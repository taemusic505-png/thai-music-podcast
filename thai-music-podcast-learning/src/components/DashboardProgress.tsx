import React from 'react';
import { motion } from 'motion/react';
import { Award, BookOpen, Clock, Flame, Calendar, Trophy, Lock, CheckCircle } from 'lucide-react';
import { LearningStats, AchievementBadge } from '../types';
import { episodesData } from '../data/courseData';

const XP_PER_LEVEL = 300;

interface DashboardProgressProps {
  stats: LearningStats;
  badges: AchievementBadge[];
  onTabChange: (tab: 'home' | 'player' | 'soundboard' | 'quiz' | 'dashboard') => void;
  onResetStats?: () => void;
}

export default function DashboardProgress({ stats, badges, onTabChange, onResetStats }: DashboardProgressProps) {
  
  // Formulas
  const totalEpisodes = episodesData.length;
  const xpInCurrentLevel = stats.totalXp % XP_PER_LEVEL;
  const xpPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / XP_PER_LEVEL) * 100));
  
  const minutes = Math.floor(stats.listeningTime / 60);
  const seconds = stats.listeningTime % 60;
  
  const completionRate = Math.round((stats.completedEpisodes.length / totalEpisodes) * 100);
  const quizSuccessRate = stats.answersAttempted > 0 
    ? Math.round((stats.answersCorrect / stats.answersAttempted) * 100)
    : 0;

  // Unlocked vs locked badges
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;
  const unlockedBadgeXp = badges.reduce((sum, badge) => sum + (badge.unlocked ? badge.xpReward : 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 text-slate-100 font-sans pb-24">
      
      {/* Top Banner with level and streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Core Level Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 backdrop-blur-xl bg-gradient-to-br from-amber-500/10 via-zinc-950/40 to-black border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="relative flex items-center justify-center shrink-0">
            {/* Round Avatar Level Badge */}
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-400 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-[10px] font-mono tracking-wider font-semibold text-amber-400 uppercase">เลเวล</span>
              <span className="text-3xl font-heading font-extrabold text-amber-300">{stats.level}</span>
            </div>
            {/* Tiny rotating outer ring */}
            <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-dashed border-amber-500/30 animate-spin-slow"></div>
          </div>

          <div className="space-y-2 flex-grow text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-xl font-heading font-bold text-amber-100">ผู้เรียนดนตรีไทย ม.1</h2>
              <span className="font-mono text-xs text-amber-400 font-semibold">{stats.totalXp} XP สะสมทั้งหมด</span>
            </div>
            <p className="text-xs text-zinc-400">ฟังบทเรียน ทำกิจกรรม และตอบแบบทดสอบเพื่อสะสม XP อย่างต่อเนื่อง</p>
            
            {/* XP progress bar */}
            <div className="space-y-1 pt-2 w-full">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500">มุ่งสู่เลเวล {stats.level + 1}</span>
                <span className="text-amber-400 font-semibold">{xpInCurrentLevel} / {XP_PER_LEVEL} XP</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full border border-white/[0.05] overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Streak Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 via-zinc-950/40 to-black border border-orange-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative"
        >
          <div className="absolute top-3 right-3 text-[10px] font-mono text-orange-400 font-medium px-2 py-0.5 bg-orange-500/10 rounded border border-orange-500/25">STREAK</div>
          <Flame className="w-12 h-12 text-orange-500 animate-bounce mb-2" />
          <h3 className="text-4xl font-heading font-extrabold text-orange-400">{stats.dailyStreak} วัน</h3>
          <p className="text-xs text-zinc-400 font-semibold mt-1">สถิติเรียนรู้ติดต่อกันอย่างสม่ำเสมอ</p>
          <p className="text-[10px] text-zinc-500 mt-2">กลับมาเรียนต่อทุกวันเพื่อรักษาแรงจูงใจ</p>
        </motion.div>

      </div>

      {/* Grid of Key Numerical Indicators & Custom SVG Charts */}
      <h3 className="text-lg font-heading font-bold text-amber-200 uppercase tracking-wider mb-4 border-b border-white/[0.08] pb-1.5 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        สถิติรายงานการประเมินผลผู้เรียน
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Core numbers box */}
        <div className="space-y-4">
          
          {/* Time spent */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-500">เวลาฟังเรียนสะสม</div>
                <div className="text-lg font-heading font-extrabold text-blue-200">
                  {minutes} นาที {seconds} วินาที
                </div>
              </div>
            </div>
          </div>

          {/* Episode Complete count */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-500">ผ่านเนื้อหาแล้ว</div>
                <div className="text-lg font-heading font-extrabold text-amber-200">
                  {stats.completedEpisodes.length} / {totalEpisodes} ตอนเรียน
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {completionRate}%
            </div>
          </div>

          {/* Correct quizzes indicator */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-500">ตอบแบบทดสอบถูกต้อง</div>
                <div className="text-lg font-heading font-extrabold text-pink-200">
                  {stats.answersCorrect} / {stats.answersAttempted} ข้อ
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              ถูกต้อง {quizSuccessRate}%
            </div>
          </div>

        </div>

        {/* Custom SVG Gauge Chart for Quiz Correctness */}
        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-xs font-heading tracking-wider text-zinc-400 uppercase font-bold mb-4">อัตราความแม่นยำในการทำแบบทดสอบ</h4>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circular progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                className="stroke-zinc-900 fill-none" 
                strokeWidth="8"
              />
              {/* Foreground circle */}
              <motion.circle 
                cx="50" 
                cy="50" 
                r="40" 
                className="stroke-amber-400 fill-none filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]" 
                strokeWidth="8"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * quizSuccessRate) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-extrabold text-amber-200">{quizSuccessRate}%</span>
              <span className="text-[9px] text-zinc-500">ของแบบตอบกลับทั้งหมด</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 mt-4 leading-normal font-sans">
            สูตรประเมินผ่านเกณฑ์ขั้นต่ำคือ <span className="text-amber-400 font-semibold font-mono">60%</span> เพื่อสะสมเกียรติบัตร ม.1 อย่างเป็นทางการ
          </p>
        </div>

        {/* Weekly Engagement Chart Progress SVG bar chart */}
        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-heading tracking-wider text-zinc-400 uppercase font-bold">ความคืบหน้าการศึกษาแบบรายตอน</h4>
            <span className="text-[9px] font-mono text-zinc-500">{totalEpisodes} ตอนหลัก</span>
          </div>

          <div className="space-y-4 py-2">
            {[
              { epNum: 'EP1', title: 'ประวัติและความหมายของดนตรีไทย', progress: stats.completedEpisodes.includes('ep1') ? 100 : 0, color: 'bg-amber-400' },
              { epNum: 'EP2', title: 'องค์ประกอบสำคัญของดนตรีไทย', progress: stats.completedEpisodes.includes('ep2') ? 100 : 0, color: 'bg-blue-400' },
              { epNum: 'EP3', title: 'การอ่านโน้ตและสัญลักษณ์ไทย', progress: stats.completedEpisodes.includes('ep3') ? 100 : 0, color: 'bg-rose-400' }
            ].map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-heading font-bold text-zinc-300">{item.epNum} <span className="font-normal text-zinc-500 text-[10px]">{item.title}</span></span>
                  <span className="font-mono text-[10px] font-semibold text-zinc-400">{item.progress === 100 ? 'เสร็จสมบูรณ์' : 'ยังไม่ได้เรียน'}</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 border border-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-zinc-500 mt-2 flex items-center justify-center gap-1.5">
            <Calendar className="w-3 h-3 text-zinc-500" />
            <span>ปรับปรุงข้อมูลล่าสุดเมื่อ {new Date().toLocaleDateString('th-TH')}</span>
          </div>
        </div>

      </div>

      {/* Gamified Achievements / Milestones */}
      <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-6">
          <div>
            <h3 className="text-lg font-heading font-extrabold text-amber-200">เหรียญเกียรติยศและตราความสำเร็จ ({unlockedBadgesCount} / {badges.length})</h3>
            <p className="text-xs text-zinc-500 mt-0.5">ทำภารกิจ ฟังบทเรียน และฝึกจังหวะเพื่อปลดล็อกเหรียญความสำเร็จ</p>
          </div>
          <div className="font-mono text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded-full shrink-0">
            XP จากเหรียญที่ปลดล็อก: {unlockedBadgeXp}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;
            return (
              <motion.div
                key={badge.id}
                whileHover={{ y: -3 }}
                className={`relative rounded-xl p-4 border text-center transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' 
                    : 'bg-zinc-950/20 border-white/[0.05] opacity-50'
                }`}
              >
                {/* Lock icon overlay */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2 p-1 bg-black/40 border border-white/5 rounded">
                    <Lock className="w-3 h-3 text-zinc-500" />
                  </div>
                )}

                {/* Badge Trophy Circle icon */}
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  isUnlocked 
                    ? 'bg-amber-400/10 border border-amber-400/40 text-amber-300' 
                    : 'bg-zinc-900 border border-white/[0.05] text-zinc-600'
                }`}>
                  <Award className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className={`text-xs font-heading font-bold ${isUnlocked ? 'text-amber-100' : 'text-zinc-500'}`}>
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2 px-1 min-h-[30px]">
                    {badge.description}
                  </p>
                  
                  {/* XP Reward Badge */}
                  <div className="pt-2">
                    <span className={`inline-block font-mono text-[9px] font-bold px-2 py-0.5 rounded ${
                      isUnlocked 
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-400/20' 
                        : 'bg-zinc-900 text-zinc-600'
                    }`}>
                      +{badge.xpReward} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {stats.answersAttempted > 0 && onResetStats && (
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onResetStats}
            id="btn_reset_stats"
            className="text-[11px] font-mono text-zinc-600 hover:text-rose-400 underline cursor-pointer transition-colors"
          >
            ล้างผลคะแนนทดสอบเพื่อเริ่มต้นเรียนใหม่ (Reset Analytics)
          </button>
        </div>
      )}

    </div>
  );
}
