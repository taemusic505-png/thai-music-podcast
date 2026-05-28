import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlayCircle, Home, Music, CheckSquare, Award, Sparkles, ChevronRight, User
} from 'lucide-react';

import { LearningStats, AchievementBadge, Episode } from './types';
import { episodesData, instrumentsData, badgesData } from './data/courseData';
import WelcomeScreen from './components/WelcomeScreen';
import PodcastPlayer from './components/PodcastPlayer';
import SoundLibrary from './components/SoundLibrary';
import QuizSystem from './components/QuizSystem';
import DashboardProgress from './components/DashboardProgress';

const LOCAL_STORAGE_KEY = 'thai_music_podcast_learner_states_v1';
const XP_PER_LEVEL = 300;

const calculateLevel = (totalXp: number) => Math.floor(totalXp / XP_PER_LEVEL) + 1;

const addXpToStats = (stats: LearningStats, amount: number): LearningStats => {
  const totalXp = Math.max(0, stats.totalXp + amount);
  return {
    ...stats,
    totalXp,
    level: calculateLevel(totalXp)
  };
};

const INITIAL_STATS: LearningStats = {
  totalXp: 0,
  level: 1,
  completedEpisodes: [],
  listeningTime: 0,
  answersCorrect: 0,
  answersAttempted: 0,
  dailyStreak: 1,
  unlockedBadgeIds: [],
  activeTab: 'home',
  currentEpisodeId: 'ep1',
  isPlaying: false,
  playbackSpeed: 1,
  currentTime: 0,
  soundboardStreak: 0
};

export default function App() {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [stats, setStats] = useState<LearningStats>(INITIAL_STATS);
  const [badges, setBadges] = useState<AchievementBadge[]>(badgesData);
  const [activeEpDetail, setActiveEpDetail] = useState<Episode | null>(null);
  
  // Notification toast for level ups or badge unlocks
  const [toastMsg, setToastMsg] = useState<string>('');

  // 1. Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStats(prev => ({
          ...prev,
          ...parsed,
          activeTab: 'home', // always default to home on reload
          isPlaying: false,
          currentTime: 0
        }));
        
        // sync badges unlocked status
        if (parsed.unlockedBadgeIds) {
          setBadges(prev => prev.map(b => ({
            ...b,
            unlocked: parsed.unlockedBadgeIds.includes(b.id)
          })));
        }
        
        // Since they opened the app, let's skip welcome if they already have XP
        if (parsed.totalXp > 0) {
          setShowWelcome(false);
        }
      }
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
  }, []);

  // 2. Save progress to localStorage
  const saveStats = (newStats: LearningStats) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        totalXp: newStats.totalXp,
        level: newStats.level,
        completedEpisodes: newStats.completedEpisodes,
        listeningTime: newStats.listeningTime,
        answersCorrect: newStats.answersCorrect,
        answersAttempted: newStats.answersAttempted,
        dailyStreak: newStats.dailyStreak,
        unlockedBadgeIds: newStats.unlockedBadgeIds,
        currentEpisodeId: newStats.currentEpisodeId,
        playbackSpeed: newStats.playbackSpeed
      }));
    } catch (e) {
      console.error('Failed to write storage state:', e);
    }
  };

  // 3. XP Accumulation & Level Up mechanics
  const handleAddXp = (amount: number) => {
    if (amount <= 0) return;

    setStats(prev => {
      const updated = addXpToStats(prev, amount);

      if (updated.level > prev.level) {
        showNotification(`🎉 เลื่อนเป็นเลเวล ${updated.level} แล้ว!`);
      }
      
      saveStats(updated);
      return updated;
    });
  };

  // 4. Badge unlock checker
  const handleAwardBadge = (badgeId: string) => {
    const targetBadge = badgesData.find(b => b.id === badgeId);
    if (!targetBadge) return;

    setBadges(prev => {
      return prev.map(b => b.id === badgeId ? { ...b, unlocked: true } : b);
    });

    setStats(prev => {
      if (prev.unlockedBadgeIds.includes(badgeId)) return prev;

      const updated = {
        ...addXpToStats(prev, targetBadge.xpReward),
        unlockedBadgeIds: [...prev.unlockedBadgeIds, badgeId]
      };

      saveStats(updated);
      showNotification(`🏆 ปลดล็อกเหรียญ: ${targetBadge.title} (+${targetBadge.xpReward} XP)`);
      return updated;
    });
  };

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 4500);
  };

  // 5. Navigation callback
  const handleTabChange = (tab: 'home' | 'player' | 'soundboard' | 'quiz' | 'dashboard') => {
    setStats(prev => {
      const updated = {
        ...prev,
        activeTab: tab,
        isPlaying: tab === 'player' ? prev.isPlaying : false
      };
      return updated;
    });
    // Scroll page to top to yield seamless transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. Complete active Episode
  const handleCompleteEpisode = (epId: string) => {
    setStats(prev => {
      if (prev.completedEpisodes.includes(epId)) return prev;

      const firstListenBadge = badgesData.find(b => b.id === 'badge_first_listen');
      const shouldUnlockFirstListen = Boolean(firstListenBadge) && !prev.unlockedBadgeIds.includes('badge_first_listen');
      const episodeXp = 150;
      const badgeXp = shouldUnlockFirstListen ? firstListenBadge!.xpReward : 0;
      
      const updated = addXpToStats({
        ...prev,
        completedEpisodes: [...prev.completedEpisodes, epId],
        unlockedBadgeIds: shouldUnlockFirstListen
          ? [...prev.unlockedBadgeIds, 'badge_first_listen']
          : prev.unlockedBadgeIds
      }, episodeXp + badgeXp);

      if (shouldUnlockFirstListen) {
        setBadges(current => current.map(b => b.id === 'badge_first_listen' ? { ...b, unlocked: true } : b));
      }

      saveStats(updated);
      showNotification(`📚 เรียนจบตอนนี้แล้ว (+${episodeXp + badgeXp} XP)`);
      return updated;
    });
  };

  // 7. Mini tracker cumulative seconds counter
  useEffect(() => {
    let interval: any = null;
    if (stats.isPlaying) {
      interval = setInterval(() => {
        setStats(prev => {
          const updated = {
            ...prev,
            listeningTime: prev.listeningTime + 1
          };
          // Save periodically
          if (updated.listeningTime % 10 === 0) {
            saveStats(updated);
          }
          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stats.isPlaying]);

  // 8. Play specific episode from main list
  const startPodcastEpisode = (epId: string) => {
    setStats(prev => {
      const updated = {
        ...prev,
        currentEpisodeId: epId,
        currentTime: 0,
        isPlaying: true,
        activeTab: 'player' as any
      };
      return updated;
    });
    setActiveEpDetail(null);
  };

  // Reset metrics
  const handleResetStats = () => {
    if (window.confirm('คุณต้องการรีเซ็ตสถิติทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่? (ตราความสำเร็จจะล็อคใหม่)')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setStats(INITIAL_STATS);
      setBadges(badgesData.map(b => ({ ...b, unlocked: false })));
      showNotification('🔄 รีเซ็ตกระบวนการเรียนและการตอบผลเรียบร้อยแล้วค่ะ');
    }
  };

  const selectedEpisode = episodesData.find(ep => ep.id === stats.currentEpisodeId) || episodesData[0];

  if (showWelcome) {
    return (
      <WelcomeScreen 
        onStart={() => {
          setShowWelcome(false);
          // Set streak on first entry
          handleAddXp(20);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Decorative Traditional Border Chimes Background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Floating level up / badge notification toast banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 30, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-0 inset-x-12 mx-auto z-50 max-w-md backdrop-blur-xl bg-zinc-950/95 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300 border border-amber-400/20 shrink-0">
              <Sparkles className="w-5.5 h-5.5 animate-spin-slow" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 font-mono">ประกาศรางวัลความคืบหน้า</span>
              <p className="text-xs text-zinc-200 mt-0.5 font-heading font-bold">{toastMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile) */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-zinc-950/80 backdrop-blur-md p-6 select-none relative z-20">
        <div className="space-y-8 text-left">
          
          {/* Platform Branding logo */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/25">
              <Music className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-heading font-black text-xs leading-none tracking-tight text-amber-200 uppercase">Thai Music</h1>
              <span className="font-sans text-[8px] text-zinc-500 font-bold uppercase tracking-wider">EdTech Podclass v1</span>
            </div>
          </div>

          {/* User state indicator card */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/5 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
          <div className="space-y-0.5">
              <div className="text-[10px] text-zinc-500 uppercase font-mono font-bold">ผู้เรียน ม.1</div>
              <div className="text-xs font-heading font-extrabold text-amber-200">สะสม {stats.totalXp} XP</div>
              <div className="text-[9px] font-mono font-semibold text-emerald-400">เลเวล {stats.level}</div>
            </div>
          </div>

          {/* Menu items */}
          <nav className="space-y-1">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono font-bold block mb-2 px-3">เมนูบทเรียน</span>
            {[
              { id: 'home', label: 'หน้าแรกบทเรียน', icon: Home },
              { id: 'player', label: 'ฟังพอดแคสต์', icon: PlayCircle },
              { id: 'soundboard', label: 'คลังเสียงดนตรี', icon: Music },
              { id: 'quiz', label: 'แบบทดสอบ', icon: CheckSquare },
              { id: 'dashboard', label: 'รายงานผล', icon: Award }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = stats.activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as any)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-heading font-medium cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-amber-400 text-zinc-950 font-extrabold shadow-md shadow-amber-400/10' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info brand */}
        <div className="pt-4 border-t border-white/[0.04]">
          <div className="text-[9px] text-zinc-600 uppercase font-mono leading-normal text-left">
            ห้องเรียนอนุรักษ์ดนตรีไทย<br/>
            ระดับชั้น มัธยมศึกษาปีที่ 1
          </div>
          <button 
            onClick={() => setShowWelcome(true)}
            className="text-[9px] text-amber-500 hover:underline cursor-pointer font-bold uppercase tracking-wider block mt-2"
          >
            ← กลับสู่หน้าหลักต้อนรับ
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR (Hidden on desktop) */}
      <header className="md:hidden w-full backdrop-blur-md bg-zinc-950/80 border-b border-white/[0.06] p-4 flex items-center justify-between sticky top-0 z-30 select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 shadow-md">
            <Music className="w-4.5 h-4.5" />
          </div>
          <h1 className="font-heading font-bold text-xs uppercase text-amber-200">Thai Music Podcast</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-400">
          <span>LV</span> <span className="font-black text-amber-200">{stats.level}</span>
        </div>
      </header>

      {/* CORE SCREEN ROUTING VIEW */}
      <main className="flex-grow min-h-screen relative z-10 w-full overflow-hidden">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: HOME PANEL */}
            {stats.activeTab === 'home' && (
              <motion.div
                key="home_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Hero billboard banner with statistics overlay */}
                <div className="backdrop-blur-xl bg-gradient-to-br from-amber-900/20 via-zinc-950 to-black rounded-3xl p-6 sm:p-8 border border-amber-500/10 text-left flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  
                  {/* Glowing graphic backing */}
                  <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="space-y-3 relative z-10">
                    <span className="inline-block bg-amber-500/15 text-amber-300 text-[10px] font-mono tracking-widest font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                      หน่วยการเรียนรู้ที่ 1
                    </span>
                    <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-amber-100">
                      ดนตรีไทย มรดกทางวัฒนธรรมสำหรับ ม.1
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                      เรียนรู้ผ่านพอดแคสต์ 3 ตอน พร้อมคลังเสียง เกมจังหวะ และแบบทดสอบก่อน-หลังเรียน เพื่อให้ฝึกฟัง วิเคราะห์ และติดตามความก้าวหน้าได้จริง
                    </p>
                  </div>

                  <div className="shrink-0 flex gap-3 relative z-10 select-none">
                    <div className="bg-zinc-950/80 border border-white/[0.05] rounded-2xl p-4 text-center min-w-[90px]">
                      <div className="text-[9px] font-heading text-zinc-500 uppercase">ดัชนีผ่านเรียน</div>
                      <div className="text-2xl font-heading font-extrabold text-amber-400 mt-1">{stats.completedEpisodes.length} / 3</div>
                      <span className="text-[8px] text-zinc-600 tracking-wider">ตอนเรียนผ่าน</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-white/[0.05] rounded-2xl p-4 text-center min-w-[90px]">
                      <div className="text-[9px] font-heading text-zinc-500 uppercase">แต้มวิชา</div>
                      <div className="text-2xl font-heading font-extrabold text-teal-300 mt-1">{stats.totalXp}</div>
                      <span className="text-[8px] text-zinc-600 tracking-wider">XP สะสมรวม</span>
                    </div>
                  </div>

                </div>

                {/* Sub-header unit */}
                <div className="space-y-4 text-left">
                  <h3 className="text-sm font-heading font-black tracking-widest text-zinc-400 uppercase pb-2 border-b border-white/[0.05]">
                    รายชื่อตอนพอดแคสต์บทเรียนหลัก (Episodes list)
                  </h3>

                  {/* Active detailed sub-panel if clicked */}
                  <AnimatePresence>
                    {activeEpDetail && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="backdrop-blur-xl bg-zinc-950/70 border-2 border-amber-400 p-5 rounded-2xl"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.05] pb-3 mb-3">
                          <div>
                            <span className="text-xs font-mono text-amber-400 font-bold">ระยะเวลา {activeEpDetail.duration}</span>
                            <h4 className="text-sm sm:text-base font-heading font-bold text-amber-200 mt-0.5">{activeEpDetail.title}</h4>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startPodcastEpisode(activeEpDetail.id)}
                              className="px-4 py-1.5 bg-amber-400 text-zinc-950 font-heading text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-300 shrink-0"
                            >
                              เริ่มฟังตอนนี้
                            </button>
                            <button
                              onClick={() => setActiveEpDetail(null)}
                              className="px-3 py-1.5 bg-zinc-900 text-zinc-400 text-xs rounded-lg cursor-pointer hover:bg-zinc-800"
                            >
                              ปิด
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed py-1 text-left select-text">
                          <span className="font-semibold text-zinc-300 uppercase">เป้าประสงค์:</span> {activeEpDetail.objective}
                        </p>
                        <ul className="text-xs text-zinc-500 list-disc list-inside space-y-1 block mt-2 text-left">
                          {activeEpDetail.learningPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Shading grid cards browse */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                    {episodesData.map((ep) => {
                      const isCompleted = stats.completedEpisodes.includes(ep.id);
                      return (
                        <motion.div
                          key={ep.id}
                          whileHover={{ y: -4 }}
                          onClick={() => setActiveEpDetail(ep)}
                          className={`backdrop-blur-md bg-white/[0.02] border rounded-2xl p-5 text-left cursor-pointer hover:bg-white/[0.04] transition-all relative ${
                            isCompleted ? 'border-amber-400/40' : 'border-white/[0.06]'
                          }`}
                        >
                          {/* Complete seal badge */}
                          {isCompleted && (
                            <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-400 text-emerald-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded">
                              เสร็จสิ้น
                            </span>
                          )}

                          <div className="w-11 h-11 rounded-full bg-zinc-900 border border-white/[0.05] flex items-center justify-center text-xl mb-4 shadow-sm select-none">
                            {ep.thumbnail}
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] text-zinc-500 font-mono font-medium block">ตอนที่ {ep.id === 'ep1' ? '1' : ep.id === 'ep2' ? '2' : '3'} • {ep.duration}</span>
                            <h4 className="font-heading font-extrabold text-sm text-zinc-200 line-clamp-1 group-hover:text-amber-300">
                              {ep.title.split(': ')[1] || ep.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-normal line-clamp-3 select-text pb-4">
                              {ep.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-amber-400/85">
                            <span className="text-[10px] font-heading">แต้มผ่าน (+150 XP)</span>
                            <ChevronRight className="w-4 h-4 text-amber-500/50" />
                          </div>

                        </motion.div>
                      );
                    })}
                  </div>

                </div>

                {/* Pretest Call to action panel banner */}
                <div className="backdrop-blur-xl bg-gradient-to-r from-teal-900/10 via-zinc-950 to-black rounded-3xl p-6 border border-teal-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left select-none">
                  <div>
                    <h4 className="font-heading font-black text-xs uppercase tracking-widest text-teal-300">พร้อมประเมินตนเองแล้วหรือยัง?</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-lg">
                      ทำแบบทดสอบก่อนเรียนเพื่อสำรวจพื้นฐาน หรือทำหลังเรียนเพื่อวัดความเข้าใจและสะสม XP เพิ่มได้ทันที
                    </p>
                  </div>
                  <button
                    onClick={() => handleTabChange('quiz')}
                    className="px-5 py-2 bg-teal-400 hover:bg-teal-300 text-zinc-950 font-heading font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-colors flex items-center gap-1"
                  >
                    ไปหน้าแบบทดสอบ
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* TAB 2: PODCAST PLAYER */}
            {stats.activeTab === 'player' && (
              <motion.div
                key="player_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PodcastPlayer
                  episode={selectedEpisode}
                  currentTime={stats.currentTime}
                  isPlaying={stats.isPlaying}
                  playbackSpeed={stats.playbackSpeed}
                  onSetCurrentTime={(t) => setStats(p => ({ ...p, currentTime: Math.floor(t) }))}
                  onSetIsPlaying={(play) => setStats(p => ({ ...p, isPlaying: play }))}
                  onSetPlaybackSpeed={(sp) => setStats(p => ({ ...p, playbackSpeed: sp }))}
                  onAddXp={handleAddXp}
                  onAwardBadge={handleAwardBadge}
                  onCompleteEpisode={handleCompleteEpisode}
                />
              </motion.div>
            )}

            {/* TAB 3: SOUNDBOARD */}
            {stats.activeTab === 'soundboard' && (
              <motion.div
                key="soundboard_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SoundLibrary
                  instruments={instrumentsData}
                  onAddXp={handleAddXp}
                  onAwardBadge={handleAwardBadge}
                />
              </motion.div>
            )}

            {/* TAB 4: QUIZ SYSTEM */}
            {stats.activeTab === 'quiz' && (
              <motion.div
                key="quiz_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QuizSystem
                  onAddXp={handleAddXp}
                  onAwardBadge={handleAwardBadge}
                  onUpdateQuizStats={(corr, att) => {
                    setStats(p => {
                      const updated = {
                        ...p,
                        answersCorrect: p.answersCorrect + corr,
                        answersAttempted: p.answersAttempted + att
                      };
                      saveStats(updated);
                      return updated;
                    });
                  }}
                />
              </motion.div>
            )}

            {/* TAB 5: DASHBOARD PROGRESS */}
            {stats.activeTab === 'dashboard' && (
              <motion.div
                key="dashboard_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DashboardProgress
                  stats={stats}
                  badges={badges}
                  onTabChange={handleTabChange}
                  onResetStats={handleResetStats}
                />
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* FOOTER */}
        <footer className="w-full max-w-6xl mx-auto px-4 py-8 mt-12 mb-20 md:mb-8 border-t border-white/[0.05] text-center select-none">
          <p className="text-zinc-400 text-sm mb-2 font-medium">
            พัฒนาโดย <span className="text-amber-400 font-bold">ครูวีรวัฒน์ วัฒนปัญโญ</span> ครูโรงเรียนบ้านปากยาง
          </p>
          <p className="text-zinc-500 text-xs max-w-2xl mx-auto leading-relaxed">
            หมายเหตุ: ข้อมูลที่แสดงเป็นเพียงตัวอย่างการพัฒนานวัตกรรมที่สามารถนำไปประยุกต์ใช้งานได้จริง หากมีความผิดพลาดประการใดขออภัยมา ณ ที่นี้ ทางผู้จัดทำจะปรับปรุงพัฒนาคุณภาพให้ดียิ่งขึ้นอย่างต่อเนื่อง
          </p>
        </footer>

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-zinc-950/95 border-t border-white/[0.06] backdrop-blur-xl flex items-center justify-around py-3 z-30 select-none">
        {[
          { id: 'home', label: 'หน้าแรก', icon: Home },
          { id: 'player', label: 'ฟังพอดแคสต์', icon: PlayCircle },
          { id: 'soundboard', label: 'คลังเสียง', icon: Music },
          { id: 'quiz', label: 'ประลองควิซ', icon: CheckSquare },
          { id: 'dashboard', label: 'แดชบอร์ด', icon: Award }
        ].map(item => {
          const Icon = item.icon;
          const isSelected = stats.activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as any)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                isSelected ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-heading font-black">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
