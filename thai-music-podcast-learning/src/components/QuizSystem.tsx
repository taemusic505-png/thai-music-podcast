import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Award, ArrowRight, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import { QuizQuestion } from '../types';
import { preTestQuestions, postTestQuestions } from '../data/courseData';

interface QuizSystemProps {
  onAddXp: (amount: number) => void;
  onAwardBadge: (badgeId: string) => void;
  onUpdateQuizStats: (correct: number, attempted: number) => void;
}

export default function QuizSystem({ onAddXp, onAwardBadge, onUpdateQuizStats }: QuizSystemProps) {
  const [activeQuizType, setActiveQuizType] = useState<'none' | 'pre' | 'post'>('none');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOptIndex, setSelectedOptIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [answersSheet, setAnswersSheet] = useState<boolean[]>([]); // track correct/incorrect
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Pick questions list
  const activeQuestionsList: QuizQuestion[] = activeQuizType === 'pre' 
    ? preTestQuestions 
    : postTestQuestions;

  const currentQuestion = activeQuestionsList[currentQuestionIdx];

  const handleStartQuiz = (type: 'pre' | 'post') => {
    setActiveQuizType(type);
    setCurrentQuestionIdx(0);
    setSelectedOptIndex(null);
    setAnswered(false);
    setScore(0);
    setAnswersSheet([]);
    setQuizFinished(false);
  };

  const handleSelectOption = (idx: number) => {
    if (answered) return;
    setSelectedOptIndex(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptIndex === null || answered) return;
    setAnswered(true);

    const isCorrect = selectedOptIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setAnswersSheet(prev => [...prev, true]);
      // Give XP
      onAddXp(20);
    } else {
      setAnswersSheet(prev => [...prev, false]);
    }
  };

  const handleNextBtn = () => {
    const isCorrect = selectedOptIndex === currentQuestion.correctAnswer;
    onUpdateQuizStats(isCorrect ? 1 : 0, 1);

    if (currentQuestionIdx < activeQuestionsList.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOptIndex(null);
      setAnswered(false);
    } else {
      // Quiz complete!
      setQuizFinished(true);
      
      // Calculate unlockable badges & bonuses
      const scorePercentage = (score / activeQuestionsList.length) * 100;
      if (activeQuizType === 'pre' && scorePercentage >= 60) {
        onAwardBadge('badge_perfect_pretest');
      } else if (activeQuizType === 'post' && scorePercentage >= 100) {
        onAwardBadge('badge_super_scholar');
      }
    }
  };

  const handleReturnToMain = () => {
    setActiveQuizType('none');
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 text-slate-100 font-sans pb-24">
      
      {activeQuizType === 'none' ? (
        <div id="quiz_dashboard" className="space-y-8">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-900/15 via-zinc-950/40 to-black rounded-3xl p-6 border border-teal-500/10 text-center sm:text-left">
            <h2 className="text-xl font-heading font-extrabold text-amber-200 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
              <CheckSquare className="w-5.5 h-5.5 text-amber-400" />
              ศูนย์แบบทดสอบ ดนตรีไทย ม.1
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              ทำแบบทดสอบก่อนเรียนเพื่อสำรวจพื้นฐาน และแบบทดสอบหลังเรียนเพื่อวัดความเข้าใจหลังฟังพอดแคสต์ครบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pretest Panel */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="backdrop-blur-xl bg-gradient-to-b from-amber-500/5 to-zinc-950 text-left border border-amber-500/10 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="inline-block bg-amber-500/15 text-amber-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-amber-500/20">PRE-TEST</span>
                <h3 className="text-lg font-heading font-bold text-amber-200">แบบทดสอบก่อนเรียน ดนตรีไทย ม.1</h3>
                <p className="text-xs text-zinc-400 leading-normal font-sans">
                  ประเมินความรู้เดิมเกี่ยวกับประวัติดนตรีไทย องค์ประกอบของดนตรี และอัตราจังหวะ จำนวน 10 ข้อ
                </p>
                <div className="text-[10px] text-zinc-500 font-mono pt-3">
                  เกณฑ์ปลดเหรียญ: <span className="text-amber-400">ได้ 60% ขึ้นไป</span> (+155 XP)
                </div>
              </div>
              <button
                onClick={() => handleStartQuiz('pre')}
                id="btn_start_pretest"
                className="w-full mt-6 py-2.5 font-heading text-xs font-bold text-zinc-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors pointer-events-auto cursor-pointer flex items-center justify-center gap-1"
              >
                เริ่มทำควิซก่อนเรียน
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Posttest Panel */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="backdrop-blur-xl bg-gradient-to-b from-teal-500/5 to-zinc-950 text-left border border-teal-500/10 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="inline-block bg-teal-500/15 text-teal-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-teal-500/20">POST-TEST</span>
                <h3 className="text-lg font-heading font-bold text-teal-200">แบบทดสอบหลังเรียน ดนตรีไทย ม.1</h3>
                <p className="text-xs text-zinc-400 leading-normal font-sans">
                  วัดผลหลังเรียนว่าผู้เรียนเข้าใจเรื่องโน้ต จังหวะ เครื่องดนตรี และบทบาทของดนตรีไทยมากเพียงใด จำนวน 10 ข้อ
                </p>
                <div className="text-[10px] text-zinc-500 font-mono pt-3">
                  รางวัลสูงสุด: <span className="text-teal-400">ถูกต้อง 100% ปลดเหรียญมหาบัณฑิต</span> (+350 XP)
                </div>
              </div>
              <button
                onClick={() => handleStartQuiz('post')}
                id="btn_start_posttest"
                className="w-full mt-6 py-2.5 font-heading text-xs font-bold text-zinc-950 bg-teal-400 rounded-xl hover:bg-teal-300 transition-colors pointer-events-auto cursor-pointer flex items-center justify-center gap-1"
              >
                เริ่มรับการประเมินหลังเรียน
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

          </div>

        </div>
      ) : quizFinished ? (
        
        /* Quiz Finished View */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-zinc-950/40 border border-white/[0.08] rounded-3xl p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full mx-auto bg-amber-400/10 border-2 border-amber-300 flex items-center justify-center text-amber-200 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-amber-200">
              {activeQuizType === 'pre' ? 'สรุปผลแบบทดสอบก่อนเรียน!' : 'สำเร็จการประเมินหลังเรียนครบถ้วน!'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans leading-relaxed">
              ระบบบันทึกผลการตอบแล้ว สามารถกลับไปเรียนต่อหรือทดลองทำแบบทดสอบอีกครั้งเพื่อทบทวนได้
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">คะแนนที่ทำได้</div>
              <div className="text-3xl font-heading font-extrabold text-amber-300 mt-1">{score} / {activeQuestionsList.length} ข้อ</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">อัตราความถูกต้อง</div>
              <div className="text-3xl font-heading font-extrabold text-teal-300 mt-1">
                {Math.round((score / activeQuestionsList.length) * 100)}%
              </div>
            </div>
          </div>

          {/* Correct Sheet Map Visual dots */}
          <div className="flex justify-center gap-2 py-2">
            {answersSheet.map((ans, idx) => (
              <div 
                key={idx} 
                className={`w-3.5 h-3.5 rounded-full ${ans ? 'bg-emerald-500 shadow-md shadow-emerald-500/25' : 'bg-rose-500'}`}
                title={`ข้อที่ ${idx + 1}: ${ans ? 'ถูกต้อง' : 'ผิด'}`}
              />
            ))}
          </div>

          <p className="text-[11px] text-zinc-500 font-sans max-w-md mx-auto leading-normal">
            *แบบทดสอบนี้เชื่อมโยงมาตรฐาน <span className="text-zinc-400 font-bold font-mono">ศ 2.1 และ ศ 2.2</span> เพื่อฝึกแยกแยะเสียงเครื่องดนตรี ระบบโน้ตไทย และบริบททางประวัติศาสตร์
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto pt-4">
            <button
              onClick={() => handleStartQuiz(activeQuizType)}
              className="w-full py-2.5 font-heading text-xs font-semibold text-white bg-zinc-900 border border-white/[0.06] hover:bg-zinc-800 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              ทำอีกครั้ง
            </button>
            <button
              onClick={handleReturnToMain}
              className="w-full py-2.5 font-heading text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer flex items-center justify-center gap-1"
            >
              กลับหน้ารวมแบบทดสอบ
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </motion.div>

      ) : (

        /* Active Quiz Question Card */
        <div className="space-y-6">
          
          {/* Tracker row */}
          <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold font-sans">
            <div>
              <span className="font-mono text-amber-400 uppercase tracking-widest text-[9px] font-bold px-2 py-0.5 bg-amber-400/10 border border-amber-400/25 rounded mr-2">
                {activeQuizType === 'pre' ? 'ก่อนเรียน' : 'หลังเรียน'}
              </span>
              คำถามข้อที่ {currentQuestionIdx + 1} จาก {activeQuestionsList.length}
            </div>
            <div className="font-mono text-zinc-500">
              ถูกต้อง: <span className="text-amber-400 font-bold">{score}</span> / {answered ? currentQuestionIdx + 1 : currentQuestionIdx}
            </div>
          </div>

          {/* Big Question Container */}
          <motion.div 
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-zinc-950/40 border border-white/[0.08] rounded-3xl p-6 md:p-8"
          >
            
            <div className="flex gap-4 items-start mb-6 text-left">
              <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                ?
              </span>
              <p className="text-sm sm:text-base font-heading font-semibold text-zinc-200 leading-relaxed pt-1 select-text">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 gap-3.5 mb-8">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOptIndex === oIdx;
                const isCorrectAnswer = oIdx === currentQuestion.correctAnswer;
                
                let btnStyle = 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]';
                if (answered) {
                  if (isCorrectAnswer) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/15';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/15 border-rose-400 text-rose-300';
                  } else {
                    btnStyle = 'bg-zinc-950/40 border-white/[0.02] text-zinc-600 opacity-40';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-amber-400/10 border-amber-400 text-amber-300 ring-2 ring-amber-400/20';
                }

                return (
                  <motion.button
                    key={oIdx}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectOption(oIdx)}
                    disabled={answered}
                    className={`w-full p-4 rounded-xl text-left font-sans text-xs sm:text-sm border transition-all duration-350 cursor-pointer pointer-events-auto flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>
                      <strong className="font-mono text-zinc-500 mr-2.5">{['ก.', 'ข.', 'ค.', 'ง.'][oIdx]}</strong>
                      {opt}
                    </span>
                    
                    {/* Visual markers */}
                    {answered && isCorrectAnswer && (
                      <span className="font-mono text-[9px] bg-emerald-500 text-zinc-950 font-bold px-2 py-0.5 rounded uppercase">ถูก</span>
                    )}
                    {answered && isSelected && !isCorrectAnswer && (
                      <span className="font-mono text-[9px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded uppercase">ผิด</span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Active Detailed Explanation Box for Pedagogical completion */}
            <AnimatePresence>
              {answered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-950/60 rounded-2xl p-5 border border-white/[0.05] text-left space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-heading font-extrabold text-amber-300 uppercase tracking-wider">เฉลยและคำอธิบาย</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed select-text">
                    {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-2">
            {!answered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOptIndex === null}
                className={`px-8 py-3 rounded-xl font-heading font-bold text-xs cursor-pointer shadow-lg transition-all ${
                  selectedOptIndex !== null 
                    ? 'bg-amber-400 text-zinc-950 shadow-amber-400/15' 
                    : 'bg-zinc-900 text-zinc-600 border border-white/[0.05] cursor-not-allowed shadow-none'
                }`}
              >
                ยืนยันคำตอบ
              </button>
            ) : (
              <button
                onClick={handleNextBtn}
                className="px-8 py-3 rounded-xl font-heading font-bold text-xs text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 cursor-pointer hover:from-amber-300 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
              >
                {currentQuestionIdx < activeQuestionsList.length - 1 ? 'ข้อต่อไป' : 'สำเร็จการทดสอบ'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
