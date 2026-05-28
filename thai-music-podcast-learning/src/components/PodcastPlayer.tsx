import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, PauseCircle, SkipForward, SkipBack, Volume2, CheckCircle, Sparkles } from 'lucide-react';
import { Episode, TranscriptLine, InteractiveGameTrigger } from '../types';
import InteractiveActivities from './InteractiveActivities';

interface PodcastPlayerProps {
  episode: Episode;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onSetCurrentTime: (time: number) => void;
  onSetIsPlaying: (playing: boolean) => void;
  onSetPlaybackSpeed: (speed: number) => void;
  onAddXp: (amount: number) => void;
  onAwardBadge: (badgeId: string) => void;
  onCompleteEpisode: (epId: string) => void;
}

export default function PodcastPlayer({
  episode,
  currentTime,
  isPlaying,
  playbackSpeed,
  onSetCurrentTime,
  onSetIsPlaying,
  onSetPlaybackSpeed,
  onAddXp,
  onAwardBadge,
  onCompleteEpisode
}: PodcastPlayerProps) {
  
  const [activeGameTrigger, setActiveGameTrigger] = useState<InteractiveGameTrigger | null>(null);
  const [solvedGameTimes, setSolvedGameTimes] = useState<number[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [lastSpokenLineIndex, setLastSpokenLineIndex] = useState<number | null>(null);

  const activeLineIndex = episode.transcript.findIndex((line, idx) => {
    return currentTime >= line.time && (idx === episode.transcript.length - 1 || currentTime < episode.transcript[idx + 1].time);
  });

  // Pre-process text to make Thai AI speak much more naturally
  const preprocessTTS = (text: string) => {
    return text
      .replace(/นร\./g, 'นักเรียน')
      .replace(/ม\.1/g, 'มอหนึ่ง')
      .replace(/ร\.7/g, 'รัชกาลที่ 7')
      .replace(/ดนตรี-นาฏศิลป์/g, 'ดนตรีและนาฏศิลป์')
      .replace(/Thai Music Podcast/gi, 'ไทย มิวสิค พอดแคสต์')
      .replace(/EP1:/g, 'อีพีหนึ่ง')
      .replace(/EP2:/g, 'อีพีสอง')
      .replace(/EP3:/g, 'อีพีสาม')
      .replace(/๗ เสียง/g, 'เจ็ดเสียง')
      .replace(/๘ ห้อง/g, 'แปดห้อง')
      .replace(/๔ ตัว/g, 'สี่ตัว')
      .replace(/๓ ชั้น/g, 'สามชั้น')
      .replace(/๒ ชั้น/g, 'สองชั้น')
      .replace(/ด - โด, ร - เร, ม - มี, ฟ - ฟา, ซ - ซอล, ล - ลา, ท - ที/g, 'ดอ โด, รอ เร, มอ มี, ฟอ ฟา, ซอ ซอล, ลอ ลา, ทอ ที')
      // Break sentences to allow AI to breathe naturally
      .replace(/!/g, ' ')
      .replace(/\?/g, ' ')
      .replace(/"/g, ' ');
  };

  // Handle Speech Synthesis
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    // Pause or stop if not playing
    if (!isPlaying || activeGameTrigger) {
      window.speechSynthesis.cancel();
      setLastSpokenLineIndex(null);
      return;
    }

    // Speak the new active line
    if (activeLineIndex !== -1 && activeLineIndex !== lastSpokenLineIndex) {
      window.speechSynthesis.cancel(); // Stop current speech
      
      const line = episode.transcript[activeLineIndex];
      const naturalText = preprocessTTS(line.text);
      
      const utterance = new SpeechSynthesisUtterance(naturalText);
      utterance.lang = 'th-TH';
      utterance.rate = Math.max(0.5, Math.min(2.0, playbackSpeed));
      
      if (line.speaker === 'ครูเอก') {
        utterance.pitch = 0.95; // Slightly lower, natural adult male
      } else {
        utterance.pitch = 1.15; // Slightly higher, natural young female
      }

      // Ensure Thai voice if available (Prefer Google Thai if exists, else default)
      const voices = window.speechSynthesis.getVoices();
      const googleThai = voices.find(v => v.name.includes('Google') && v.lang.includes('th'));
      const anyThai = voices.find(v => v.lang.includes('th'));
      if (googleThai) {
        utterance.voice = googleThai;
      } else if (anyThai) {
        utterance.voice = anyThai;
      }

      window.speechSynthesis.speak(utterance);
      setLastSpokenLineIndex(activeLineIndex);
    }
  }, [activeLineIndex, isPlaying, episode, lastSpokenLineIndex, playbackSpeed, activeGameTrigger]);

  // Clean up TTS when unmounting or changing episode
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [episode.id]);

  useEffect(() => {
    setActiveGameTrigger(null);
    setSolvedGameTimes([]);
    setLastSpokenLineIndex(null);
  }, [episode.id]);

  // Core Simulation clock ticking
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !activeGameTrigger) {
      interval = setInterval(() => {
        const nextTime = Math.min(episode.durationSeconds, currentTime + playbackSpeed);
        
        // Check for interactive activities triggers
        const triggerGame = episode.games.find(
          game => currentTime <= game.time && nextTime >= game.time && !solvedGameTimes.includes(game.time)
        );

        if (triggerGame) {
          onSetCurrentTime(triggerGame.time);
          onSetIsPlaying(false); // Pause audio
          setActiveGameTrigger(triggerGame);
          return;
        }

        onSetCurrentTime(nextTime);

        // Check if finished
        if (nextTime >= episode.durationSeconds) {
          onSetIsPlaying(false);
          onSetCurrentTime(episode.durationSeconds);
          onCompleteEpisode(episode.id);
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, playbackSpeed, activeGameTrigger, episode, solvedGameTimes]);

  // Handle active game completion
  const handleGameComplete = (xpEarned: number) => {
    if (activeGameTrigger) {
      onAddXp(xpEarned);
      // Award the active gamer badge
      onAwardBadge('badge_active_gamer');
      setSolvedGameTimes(prev => [...prev, activeGameTrigger.time]);
      setActiveGameTrigger(null);
      onSetIsPlaying(true); // Resume
    }
  };

  const handleGameSkip = () => {
    if (activeGameTrigger) {
      setSolvedGameTimes(prev => [...prev, activeGameTrigger.time]);
      setActiveGameTrigger(null);
      onSetIsPlaying(true); // Resume
    }
  };

  // Convert seconds to readable format
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    const displayMins = mins < 10 ? `0${mins}` : mins;
    const displaySecs = remainder < 10 ? `0${remainder}` : remainder;
    return `${displayMins}:${displaySecs}`;
  };

  // Karaoke script item selection
  const handleSentenceClick = (line: TranscriptLine) => {
    onSetCurrentTime(line.time);
  };

  // Progress Bar navigation click handler
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetSeconds = Math.min(episode.durationSeconds, Math.max(0, percentage * episode.durationSeconds));
    onSetCurrentTime(targetSeconds);
  };

  // Fast forward / backward 10s
  const handleSkip = (forward: boolean) => {
    const delta = forward ? 10 : -10;
    const targetSeconds = Math.min(episode.durationSeconds, Math.max(0, currentTime + delta));
    onSetCurrentTime(targetSeconds);
  };

  // Scroll current transcript line into center cleanly
  useEffect(() => {
    if (transcriptContainerRef.current) {
      const activeElement = transcriptContainerRef.current.querySelector('.transcript-active');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentTime]);

  const progressPercentage = Math.min(100, Math.max(0, (currentTime / episode.durationSeconds) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 text-slate-100 font-sans pb-24 space-y-8 select-none">
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left column: Vinyl disc rotating visualization & controller */}
        <div id="player_visual_card" className="lg:col-span-2 backdrop-blur-xl bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 flex flex-col justify-between items-center text-center space-y-6 relative">
          
          <div className="w-full text-left space-y-1">
            <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">พอดแคสต์บทเรียน</span>
            <div className="text-zinc-500 text-xs font-semibold flex items-center gap-1.5 mt-2">
              <span>ตอนเรียน:</span>
              <span className="text-zinc-300 font-bold">{episode.title.split(': ')[0]}</span>
            </div>
          </div>

          {/* Album Vinyl Cover Disc */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 select-none">
            {/* Spinning outward track record */}
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full bg-radial from-stone-900 via-neutral-950 to-stone-900 border-4 border-zinc-900 flex items-center justify-center shadow-2xl relative"
            >
              {/* Inner grooves */}
              <div className="absolute inset-4 rounded-full border border-zinc-800/40"></div>
              <div className="absolute inset-8 rounded-full border border-zinc-800/40"></div>
              <div className="absolute inset-12 rounded-full border border-zinc-800/40"></div>
              <div className="absolute inset-16 rounded-full border border-zinc-800"></div>

              {/* Center thumbnail sticker */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 via-amber-900 to-amber-950 flex flex-col items-center justify-center p-3 relative border-4 border-black border-dashed">
                <span className="text-3xl mt-1">{episode.thumbnail}</span>
                <span className="absolute text-[8px] font-mono tracking-widest text-amber-200 mt-14 uppercase">THAI-EP</span>
              </div>
            </motion.div>

            {/* Simulated vinyl arm pin */}
            <div className="absolute -top-4 -right-1.5 w-16 h-28 transform origin-top rotate-12 bg-transparent pointer-events-none transition-transform duration-700">
              <svg className="w-full h-full" viewBox="0 0 100 150">
                <path d="M70 10 L45 80 L52 130" fill="none" stroke="#6b7280" strokeWidth="4" strokeLinecap="round" />
                <circle cx="70" cy="10" r="10" fill="#4B5563" />
                <rect x="42" y="115" width="20" height="20" rx="3" fill="#D4AF37" transform="rotate(20 52 130)" />
              </svg>
            </div>
          </div>

          <div className="space-y-1 w-full">
            <h3 className="font-heading font-black text-base text-amber-100 line-clamp-1">{episode.title.split(': ')[1] || episode.title}</h3>
            <p className="text-[11px] text-zinc-500 font-sans leading-normal line-clamp-2 px-4">
              {episode.objective}
            </p>
          </div>

          {/* Micro Equalizer lines */}
          <div className="flex items-center gap-1 h-3.5 select-none shrink-0">
            {Array.from({ length: 11 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: isPlaying ? [1, 2.5, 1] : 1 }}
                transition={{ duration: 0.6 + i * 0.1, repeat: Infinity }}
                className="w-1.5 h-2.5 bg-gradient-to-t from-amber-500/60 to-amber-400 rounded-full opacity-70"
              />
            ))}
          </div>

        </div>

        {/* Right column: Karaoke Transcript viewer & controller stats */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 flex flex-col justify-between space-y-6">
          
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <h3 className="text-xs font-heading font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                บทพูดประกอบการฟัง
              </h3>
              <span className="text-[9px] font-mono text-zinc-500">แตะประโยคเพื่อข้ามเวลา</span>
            </div>

            {/* Transcript scrollable content zone */}
            <div 
              ref={transcriptContainerRef}
              className="h-72 overflow-y-auto pr-1 space-y-3 Scrollbar-thin text-left select-text relative"
            >
              {episode.transcript.map((line, idx) => {
                const isActive = currentTime >= line.time && (idx === episode.transcript.length - 1 || currentTime < episode.transcript[idx + 1].time);
                
                return (
                  <motion.div
                    key={idx}
                    onClick={() => handleSentenceClick(line)}
                    className={`transcript-item p-3 rounded-xl border transition-all duration-300 cursor-pointer text-xs leading-relaxed flex flex-col gap-1 select-text ${
                      isActive 
                        ? 'transcript-active bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20 text-white' 
                        : 'bg-zinc-950/20 border-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.05]'
                    }`}
                  >
                    <div className="flex justify-between items-center select-none">
                      <span className={`font-heading font-black text-[10px] ${
                        line.speaker === 'ครูเอก' ? 'text-amber-400' : 'text-teal-400'
                      }`}>
                        🎙️ {line.speaker} :
                      </span>
                      <span className="font-mono text-[9px] text-zinc-500 shrink-0">{formatTime(line.time)}</span>
                    </div>
                    <p className="select-text font-serif leading-relaxed text-zinc-200 font-medium">
                      {line.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>

          </div>

          {/* Complete controls dashboard */}
          <div className="space-y-5 pt-2">
            
            {/* PROGRESS SLIDER TIMELINE */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(episode.durationSeconds)}</span>
              </div>
              
              {/* Clickable timeline bar */}
              <div 
                onClick={handleProgressClick}
                className="w-full h-2.5 bg-zinc-900 border border-white/[0.05] rounded-full overflow-hidden cursor-pointer relative"
              >
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* AUDIO BUTTON PANEL */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* Playback speed selector */}
              <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.08] rounded-xl p-1 shrink-0">
                {[0.5, 1.0, 1.25, 1.5, 2.0].map(sp => (
                  <button
                    key={sp}
                    onClick={() => onSetPlaybackSpeed(sp)}
                    className={`px-2 py-1 text-[10px] uppercase font-mono tracking-wider font-semibold rounded-lg transition-colors cursor-pointer ${
                      playbackSpeed === sp 
                        ? 'bg-amber-400 text-zinc-950 font-bold' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>

              {/* Central icons skip, play/pause */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleSkip(false)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="ย้อนกลับ 10 วินาที"
                >
                  <SkipBack className="w-5.5 h-5.5" />
                </button>

                <button 
                  onClick={() => onSetIsPlaying(!isPlaying)}
                  id="btn_play_pause_podcast"
                  className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                >
                  {isPlaying ? (
                    <PauseCircle className="w-14 h-14" />
                  ) : (
                    <PlayCircle className="w-14 h-14" />
                  )}
                </button>

                <button 
                  onClick={() => handleSkip(true)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="ข้ามไปข้างหน้า 10 วินาที"
                >
                  <SkipForward className="w-5.5 h-5.5" />
                </button>
              </div>

              {/* Completed validation badge indicator */}
              <div className="text-zinc-500 text-xs shrink-0 flex items-center gap-1">
                <Volume2 className="w-4.5 h-4.5 text-zinc-400 animate-pulse" />
                <span className="font-mono text-[10px] text-zinc-400">44.1 kHz PCM</span>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Episode summaries details beneath players card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        
        {/* Objectives Box */}
        <div className="backdrop-blur-md bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 text-left">
          <h4 className="text-xs font-heading font-black text-amber-200 uppercase tracking-widest gap-2 flex items-center mb-4 pb-2 border-b border-white/[0.05]">
            จุดประสงค์การเรียนรู้ตามหลักสูตร ม.1
          </h4>
          <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed font-sans list-disc list-inside">
            {episode.learningPoints.map((pt, i) => (
              <li key={i} className="leading-relaxed select-text">{pt}</li>
            ))}
          </ul>
        </div>

        {/* Dynamic Games checklist preview */}
        <div className="backdrop-blur-md bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 text-left space-y-4">
          <h4 className="text-xs font-heading font-black text-teal-200 uppercase tracking-widest gap-2 flex items-center pb-2 border-b border-white/[0.05]">
            กิจกรรมแทรกระหว่างฟัง ({episode.games.length} ช่วง)
          </h4>
          
          <div className="space-y-3 pt-1">
            {episode.games.map((g, i) => {
              const solved = solvedGameTimes.includes(g.time);
              return (
                <div key={i} className="flex justify-between items-center text-xs bg-zinc-950/40 border border-white/[0.04] p-3 rounded-xl select-none">
                  <div className="flex gap-2.5 items-center">
                    <span className="p-1 rounded bg-teal-500/10 text-teal-400 font-mono text-[9px] font-bold">
                      ที่ {formatTime(g.time)}
                    </span>
                    <span className="font-heading font-bold text-zinc-300">{g.title}</span>
                  </div>
                  <div>
                    {solved ? (
                      <span className="font-mono text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        เสร็จสมบูรณ์
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] text-zinc-500">รอคำตอบ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Mid podcast overlay active learning challenge modal trigger */}
      <AnimatePresence>
        {activeGameTrigger && (
          <InteractiveActivities
            game={activeGameTrigger}
            onComplete={handleGameComplete}
            onSkip={handleGameSkip}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
