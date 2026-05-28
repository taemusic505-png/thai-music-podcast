import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, RefreshCw, XCircle } from 'lucide-react';
import { InteractiveGameTrigger } from '../types';

interface InteractiveActivitiesProps {
  game: InteractiveGameTrigger;
  onComplete: (xpEarned: number) => void;
  onSkip: () => void;
}

export default function InteractiveActivities({ game, onComplete, onSkip }: InteractiveActivitiesProps) {
  
  // Game state managers
  const [complete, setComplete] = useState<boolean>(false);
  const [errorFeedback, setErrorFeedback] = useState<string>('');
  
  // Type 1: Flashcard State
  const [flipped, setFlipped] = useState<boolean>(false);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

  // Type 2: Match state (Matching list)
  const [matchDone, setMatchDone] = useState<string[]>([]); // matched ids
  const [matchingStatus, setMatchingStatus] = useState<any>(null); // e.g., { leftId, rightMatch }

  // Type 3: Drag and Drop (Eras re-ordering / slot matching)
  const [dragPool, setDragPool] = useState<string[]>(game.type === 'drag_drop' ? [...game.data.pool] : []);
  const [slotsSelections, setSlotsSelections] = useState<{ [key: string]: string }>({});

  // 1. FLASHCARD LOGIC
  const handleAnswerCard = (index: number) => {
    if (complete) return;
    setSelectedCardIdx(index);
    const selectedText = game.data.options[index];
    const correctText = game.data.answer;

    if (selectedText === correctText) {
      setComplete(true);
      setErrorFeedback('');
      setTimeout(() => {
        onComplete(50); // XP
      }, 1500);
    } else {
      setErrorFeedback('ยังไม่ถูกต้อง ลองอ่านคำใบ้แล้วตอบอีกครั้งนะคะ');
    }
  };

  // 2. MATCHING LOGIC
  const [matchAnswers] = useState<any[]>(() => {
    if (game.type === 'matching') {
      // shuffle the matches for the right side
      return [...game.data.items].map((item, id) => ({
        id: item.id,
        match: item.match
      })).sort(() => Math.random() - 0.5);
    }
    return [];
  });

  const handleMatchSelect = (id: string, isLeft: boolean) => {
    if (gameStateIsDone(id)) return;

    if (isLeft) {
      if (matchingStatus && matchingStatus.rightMatch) {
        // Evaluate
        const originalItem = game.data.items.find((it: any) => it.id === id);
        if (originalItem && originalItem.match === matchingStatus.rightMatch) {
          setErrorFeedback('');
          setMatchDone(prev => [...prev, id, matchingStatus.rightId]);
          setMatchingStatus(null);
          setScoreCheck(matchDone.length + 2);
        } else {
          setErrorFeedback('คู่นี้ยังไม่ตรงกัน ลองเลือกคู่ใหม่อีกครั้ง');
          setMatchingStatus(null);
        }
      } else {
        setMatchingStatus({ leftId: id, rightId: null, rightMatch: null });
      }
    } else {
      const matchText = matchAnswers.find(ans => ans.id === id)?.match;
      if (matchingStatus && matchingStatus.leftId) {
        // Evaluate
        const originalItem = game.data.items.find((it: any) => it.id === matchingStatus.leftId);
        if (originalItem && originalItem.match === matchText) {
          setErrorFeedback('');
          setMatchDone(prev => [...prev, matchingStatus.leftId, id]);
          setMatchingStatus(null);
          setScoreCheck(matchDone.length + 2);
        } else {
          setErrorFeedback('คู่นี้ยังไม่ตรงกัน ลองทบทวนความสัมพันธ์อีกครั้ง');
          setMatchingStatus(null);
        }
      } else {
        setMatchingStatus({ leftId: null, rightId: id, rightMatch: matchText });
      }
    }
  };

  const gameStateIsDone = (id: string) => matchDone.includes(id);

  const setScoreCheck = (length: number) => {
    if (length >= game.data.items.length * 2) {
      setComplete(true);
      setTimeout(() => {
        onComplete(70);
      }, 1800);
    }
  };

  // 3. DRAG & DROP SLOT ASSIGNMENT
  const assignToSlot = (slotId: string, text: string) => {
    if (complete) return;
    setErrorFeedback('');

    setSlotsSelections(prev => {
      const newSel = { ...prev, [slotId]: text };
      // check if all slots are filled
      const allFilled = game.data.slots.every((sl: any) => newSel[sl.id]);
      if (allFilled) {
        // Check correction
        const allCorrect = game.data.slots.every((sl: any) => newSel[sl.id] === sl.answer);
        if (allCorrect) {
          setComplete(true);
          setErrorFeedback('');
          setTimeout(() => {
            onComplete(80);
          }, 1500);
        } else {
          setErrorFeedback('ลำดับยังไม่ถูกต้อง ลองล้างหรือถอดบางช่องเพื่อจัดใหม่');
        }
      }
      return newSel;
    });

    // Remove from pool
    setDragPool(prev => prev.filter(p => p !== text));
  };

  const removeSlotSelection = (slotId: string) => {
    const text = slotsSelections[slotId];
    if (!text || complete) return;

    setSlotsSelections(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setDragPool(prev => [...prev, text]);
    setErrorFeedback('');
  };

  const handleResetDrag = () => {
    setDragPool([...game.data.pool]);
    setSlotsSelections({});
    setErrorFeedback('');
    setComplete(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      
      {/* Container inside bounds */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-zinc-950 border border-amber-500/25 rounded-3xl p-6 md:p-8 shadow-2xl relative text-center space-y-6 overflow-hidden"
      >
        {/* Glowing orb backdrop effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"></div>

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-3 text-left">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400">พอดแคสต์หยุดชั่วคราว • ระหว่างฟัง</span>
              <h3 className="text-sm font-heading font-extrabold text-amber-200 uppercase tracking-wider mt-0.5">{game.title}</h3>
            </div>
          </div>
          <button 
            onClick={onSkip}
            className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 underline cursor-pointer"
          >
            ข้ามภารกิจ
          </button>
        </div>

        <p className="text-xs text-zinc-400 text-left leading-normal font-sans pt-1">
          {game.description}
        </p>

        {/* 1. FLASHCARD LAYOUT */}
        {game.type === 'flashcard' && (
          <div className="space-y-6">
            
            {/* Interactive Card */}
            <motion.div
              onClick={() => setFlipped(p => !p)}
              className="w-full h-36 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-white/[0.05] p-5 flex flex-col items-center justify-center cursor-pointer select-none border-dashed hover:border-amber-500/40 relative shadow-inner overflow-hidden group"
            >
              <div className="absolute inset-0 bg-amber-400/[0.01] group-hover:scale-105 transition-transform duration-500 rounded-2xl"></div>
              
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <motion.div 
                    key="front"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 text-center z-10"
                  >
                    <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 py-0.5 px-2 rounded">คำถามภารกิจ</span>
                    <p className="text-xs sm:text-sm font-heading font-bold text-zinc-200 px-4 leading-normal select-text">
                      {game.data.question}
                    </p>
                    <span className="text-[9px] text-zinc-500 block">แตะการ์ดเพื่ออ่านคำใบ้</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="back"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 text-center px-4 z-10"
                  >
                    <span className="text-[9px] font-mono text-teal-400 font-semibold bg-teal-500/10 py-0.5 px-2 rounded">คำอธิบายประกอบการพิจารณา</span>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed select-text">
                      {game.data.explain}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Answer Options list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {game.data.options.map((option: string, index: number) => {
                const isSelected = selectedCardIdx === index;
                const isCorrect = option === game.data.answer;
                
                let style = 'bg-white/[0.02] border-white/[0.05] text-zinc-300 hover:bg-white/[0.05]';
                if (isSelected) {
                  style = isCorrect 
                    ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-400 text-rose-300';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerCard(index)}
                    className={`p-3 rounded-xl text-left border text-xs cursor-pointer transition-colors ${style}`}
                  >
                    <span className="font-bold mr-1 text-zinc-500">{index + 1}.</span> {option}
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* 2. MATCHING (MATCH SOUND OR ERA ITEMS) */}
        {game.type === 'matching' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Left Column (Items) */}
              <div className="space-y-3">
                <span className="text-[10px] font-heading text-zinc-500 block">คอลัมน์ชื่อยุคสมัย</span>
                {game.data.items.map((item: any) => {
                  const isDone = gameStateIsDone(item.id);
                  const isSelected = matchingStatus && matchingStatus.leftId === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMatchSelect(item.id, true)}
                      className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-400/50 text-emerald-400 opacity-60 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300' 
                            : 'bg-zinc-900/50 border-white/[0.05] text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Right Column (Matches shuffled) */}
              <div className="space-y-3">
                <span className="text-[10px] font-heading text-zinc-500 block">คุณลักษณะหรือสัญลักษณ์</span>
                {matchAnswers.map((item: any) => {
                  const isDone = gameStateIsDone(item.id);
                  const isSelected = matchingStatus && matchingStatus.rightMatch === item.match;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMatchSelect(item.id, false)}
                      className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-400/50 text-emerald-400 opacity-60 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300' 
                            : 'bg-zinc-900/50 border-white/[0.05] text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {item.match}
                    </button>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* 3. DRAG & DROP CHRONOLOGICAL */}
        {game.type === 'drag_drop' && (
          <div className="space-y-6">
            
            {/* Target Slots List */}
            <div className="space-y-4">
              {game.data.slots.map((slot: any) => {
                const filledText = slotsSelections[slot.id];
                return (
                  <div 
                    key={slot.id} 
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white/[0.01] border border-white/[0.05] rounded-xl p-3 text-left"
                  >
                    <span className="text-xs font-heading font-bold text-amber-200 font-mono">สมัย{slot.label} :</span>
                    
                    {/* Drop target bar box */}
                    <div className="sm:col-span-2">
                      {filledText ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-2.5 rounded-lg text-xs flex justify-between items-start gap-3 font-sans">
                          <span>{filledText}</span>
                          <button
                            onClick={() => removeSlotSelection(slot.id)}
                            className="text-[9px] text-zinc-500 hover:text-rose-400 font-mono shrink-0 cursor-pointer"
                          >
                            ถอด
                          </button>
                        </div>
                      ) : (
                        <div className="border border-dashed border-white/[0.08] p-2 bg-zinc-950/40 rounded-lg text-zinc-600 text-center text-xs">
                          {dragPool.length > 0 ? (
                            <div className="flex flex-col gap-1.5 justify-center">
                              {dragPool.map((poolText, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => assignToSlot(slot.id, poolText)}
                                  className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.05] rounded text-[10px] text-zinc-300 cursor-pointer pointer-events-auto text-left leading-relaxed"
                                >
                                  {poolText}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px]">โปรดล้างเพื่อเริ่มใส่ใหม่</span>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Reset drag trigger button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleResetDrag}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] border border-white/[0.08] text-[10px] font-mono text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                ล้างคำตอบ
              </button>
            </div>

          </div>
        )}

        {/* Feedback block */}
        <div className="min-h-6">
          <AnimatePresence mode="wait">
            {errorFeedback && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 leading-relaxed"
              >
                <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                {errorFeedback}
              </motion.div>
            )}
            
            {complete && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 text-xs font-extrabold flex items-center justify-center gap-1.5 animate-pulse"
              >
                <Check className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
                ตอบถูกต้อง ได้รับ XP แล้ว
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

    </div>
  );
}
