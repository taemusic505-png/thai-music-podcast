import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Sparkles, Trophy, AlertCircle } from 'lucide-react';
import { Instrument } from '../types';

interface SoundLibraryProps {
  instruments: Instrument[];
  onAddXp: (amount: number) => void;
  onAwardBadge: (badgeId: string) => void;
}

export default function SoundLibrary({ instruments, onAddXp, onAwardBadge }: SoundLibraryProps) {
  const [selectedInst, setSelectedInst] = useState<Instrument>(instruments[0]);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  
  // Rhythm Game State
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [rhythmClass, setRhythmClass] = useState<'slow' | 'medium' | 'fast'>('medium'); // 3-ชั้น, 2-ชั้น, 1-ชั้น
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackColor, setFeedbackColor] = useState<string>('');
  const [isCing, setIsCing] = useState<boolean>(true); // toggles between Cing (ฉิ่ง) and Cap (ฉับ)
  const [lastBeatTime, setLastBeatTime] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context lazily
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  // Synthesise traditional instruments using Web Audio API
  const playClassNote = (freq: number, instrumentType: string) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Customize waves representing instruments
      if (instrumentType === 'เครื่องตี' && selectedInst.id === 'ranad') {
        // Triangle wave with immediate short wood percussive hit
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6); // Fast decay
        
        // Wood mallet resonant peak
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
      } else if (instrumentType === 'เครื่องสี' && selectedInst.id === 'saw') {
        // Slightly scratchy sawtooth lowpass-filtered string sound
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        
        // vibrato effect
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.frequency.value = 6; // 6Hz vibrato
        modGain.gain.value = 4; // freq shift depth
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        mod.start();
        mod.stop(ctx.currentTime + 1.2);

        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2); // Slow draw
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
      } else if (instrumentType === 'เครื่องเป่า') {
        // Sine wave with breathing white noise and soft vibrato
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5); // long breath draft

        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.frequency.value = 4.5; // slow flute vibrato
        modGain.gain.value = 3;
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        mod.start();
        mod.stop(ctx.currentTime + 1.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.connect(filter);
        filter.connect(gain);
      } else if (selectedInst.id === 'gong') {
        // Golden brass bell ping with rich long ringing sustain
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0); // long resonance decay
        
        // add extra higher harmonic frequencies to represent metal ring
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(freq * 2.01, ctx.currentTime);
        harmGain.gain.setValueAtTime(0.08, ctx.currentTime);
        harmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        harm.connect(harmGain);
        harmGain.connect(ctx.destination);
        harm.start();
        harm.stop(ctx.currentTime + 1.0);

        osc.connect(gain);
      } else {
        // Default
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
      }

      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.5);

    } catch (e) {
      console.log('Audio synthesiser is blocked or uninitialised:', e);
    }
  };

  const selectInstrument = (inst: Instrument) => {
    setSelectedInst(inst);
    // Play root tonic to demo
    playClassNote(inst.audioFrequency[0], inst.type);
  };

  const playInteractiveNote = (noteIndex: number, freq: number) => {
    setActiveNoteIndex(noteIndex);
    playClassNote(freq, selectedInst.type);
    setTimeout(() => {
      setActiveNoteIndex(null);
    }, 200);

    // Track sound demo for badges
    onAddXp(2);
  };

  // Rhythm Game Core Loops
  const getBeatInterval = () => {
    if (rhythmClass === 'slow') return 2200;   // ๓ ชั้น (ช้าวิจิตร)
    if (rhythmClass === 'medium') return 1400; // ๒ ชั้น (ปานกลาง)
    return 750;                               // ชั้นเดียว (เร็วครึกครื้น)
  };

  const startRhythmGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setGameState('playing');
    setScore(0);
    setCombo(0);
    setFeedback('เริ่มแล้ว เคาะให้ตรงจังหวะฉิ่ง-ฉับ');
    setFeedbackColor('text-amber-400');
    setIsCing(true);
    
    const intervalTime = getBeatInterval();
    setLastBeatTime(Date.now());
    playMetronomeSound(true);

    timerRef.current = setInterval(() => {
      setLastBeatTime(Date.now());
      setIsCing(prev => {
        const nextState = !prev;
        playMetronomeSound(nextState);
        return nextState;
      });
    }, intervalTime);
  };

  const playMetronomeSound = (cing: boolean) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (cing) {
        // High tink chime representing CING
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); // Long sustain ring
      } else {
        // Short thud damp representing CAP
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12); // Extingush fast
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {}
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;

    const tapTime = Date.now();
    const interval = getBeatInterval();
    const offset = Math.abs(tapTime - lastBeatTime);

    // Margin of acceptance
    if (offset < 140 || offset > interval - 140) {
      setScore(prev => prev + 15);
      setCombo(prev => {
        const next = prev + 1;
        if (next >= 10) onAwardBadge('badge_instrument_expert');
        return next;
      });
      setFeedback('PERFECT! ตรงจังหวะมาก +15 แต้ม');
      setFeedbackColor('text-emerald-400 font-extrabold animate-pulse');
      onAddXp(5);
    } else if (offset < 260 || offset > interval - 260) {
      setScore(prev => prev + 5);
      setCombo(prev => {
        const next = prev + 1;
        if (next >= 10) onAwardBadge('badge_instrument_expert');
        return next;
      });
      setFeedback('GOOD! ใกล้จังหวะ +5 แต้ม');
      setFeedbackColor('text-amber-300 font-semibold');
      onAddXp(2);
    } else {
      setCombo(0);
      setFeedback('MISS! เคาะก่อนหรือหลังจังหวะไปนิด');
      setFeedbackColor('text-rose-500 font-bold');
    }
  };

  const endRhythmGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setFeedback('จบเกมแล้ว คุณทำคะแนนได้ ' + score + ' คะแนน');
    setFeedbackColor('text-amber-400 font-bold');
    
    // Add XP reward based on score
    if (score > 40) {
      onAddXp(80);
      onAwardBadge('badge_instrument_expert');
    }
    setGameState('ended');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const noteLabels = ['ด (Do)', 'ร (Re)', 'ม (Mi)', 'ฟ (Fa)', 'ซ (Sol)', 'ล (La)', 'ท (Ti)'];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 text-slate-100 font-sans pb-24 space-y-8">
      
      {/* Soundboard header */}
      <div className="bg-gradient-to-r from-amber-600/10 via-zinc-950/40 to-black rounded-3xl p-6 border border-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-amber-200 uppercase tracking-wider flex items-center gap-2">
            <Music className="w-5.5 h-5.5 text-amber-400 animate-spin-slow" />
            คลังเสียงเครื่องดนตรีไทย
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            เลือกเครื่องดนตรีเพื่ออ่านข้อมูล ฟังเสียงจำลอง และลองเล่นโน้ต 7 เสียงตามบันไดเสียงไทย
          </p>
        </div>
        <div className="inline-flex flex-wrap justify-center gap-2">
          {instruments.map(inst => (
            <button
              key={inst.id}
              onClick={() => selectInstrument(inst)}
              className={`px-3 py-1.5 text-xs font-heading font-medium rounded-full cursor-pointer transition-all ${
                selectedInst.id === inst.id 
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/15' 
                  : 'bg-white/[0.02] border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {inst.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left hand side: Instrument detail card */}
        <motion.div 
          key={selectedInst.id}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-2xl" role="img" aria-label="instrument">
                {selectedInst.id === 'ranad' ? '🪵' : selectedInst.id === 'saw' ? '🎻' : selectedInst.id === 'khlui' ? '🌬️' : '🔔'}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-md">
                {selectedInst.type}
              </span>
            </div>

            <h3 className="text-2xl font-heading font-bold text-amber-200 mb-2">{selectedInst.name}</h3>
            <p className="text-xs text-amber-400 font-semibold font-mono bg-amber-500/5 py-1 px-2.5 rounded-lg border border-amber-500/10 inline-block mb-4">
              ลักษณะเสียง: {selectedInst.character}
            </p>
            
            <p className="text-xs text-zinc-400 leading-relaxed text-left font-sans">
              {selectedInst.description}
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/[0.05] text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">ระดับย่านความถี่จำลอง</p>
            <div className="flex justify-center gap-1 mt-2.5">
              {selectedInst.audioFrequency.map((f, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-amber-400/40 rounded-full" 
                  style={{ height: `${20 + (f % 100) * 0.15}px` }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Center portion: Virtual playable scale keyboard */}
        <div className="md:col-span-2 backdrop-blur-xl bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.05]">
              <h3 className="text-xs font-heading font-bold text-zinc-400 uppercase tracking-widest">แป้นทดลองเสียงโน้ตไทย 7 เสียง</h3>
              <span className="text-[10px] text-zinc-500 font-mono">เครื่องเสียง: {selectedInst.name}</span>
            </div>

            <p className="text-xs text-zinc-400 mb-6">แตะตัวโน้ตเพื่อฟังเสียงจำลองของเครื่องดนตรีที่เลือก และเปรียบเทียบระดับเสียงสูง-ต่ำ</p>

            {/* Scale piano keys layout */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-4">
              {selectedInst.audioFrequency.map((freq, idx) => {
                const isActive = activeNoteIndex === idx;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playInteractiveNote(idx, freq)}
                    className={`h-28 sm:h-40 relative rounded-2xl flex flex-col justify-end p-3 cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-xl shadow-amber-400/30' 
                        : 'bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 border-white/[0.05] text-zinc-300'
                    }`}
                  >
                    {/* Key accent cap */}
                    <div className={`absolute top-0 inset-x-0 h-4 rounded-t-2xl ${
                      isActive ? 'bg-amber-500' : 'bg-zinc-800'
                    }`}></div>

                    <div className="text-center w-full space-y-1 z-10">
                      <span className="font-mono text-[9px] block text-zinc-500">{freq} Hz</span>
                      <span className="font-heading font-black text-lg block">{noteLabels[idx].split(' ')[0]}</span>
                      <span className="text-[9px] text-zinc-400 block font-sans">{noteLabels[idx].split(' ')[1]}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-3 bg-zinc-950/40 rounded-xl border border-white/[0.04] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-zinc-500 font-sans">
              *เสียงในหน้านี้เป็นเสียงสังเคราะห์สำหรับฝึกแยกแยะลักษณะเสียง ไม่ใช่ไฟล์บันทึกจากเครื่องดนตรีจริง
            </p>
          </div>

        </div>

      </div>

      {/* Rhythm Tapping Mini-game */}
      <div className="bg-radial from-slate-950 via-zinc-950 to-black rounded-3xl p-6 md:p-8 border border-white/[0.06] relative overflow-hidden">
        
        {/* Subtle decorative target background line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06] relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">MINI-GAME</span>
              <h3 className="text-lg font-heading font-extrabold text-amber-200">เกมฝึกเคาะจังหวะ ม.1 (Rhythm Tap)</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">ฟังจังหวะฉิ่ง-ฉับ แล้วแตะปุ่มให้ตรงจังหวะเพื่อฝึกความแม่นยำ</p>
          </div>
          
          {gameState === 'idle' && (
            <div className="flex flex-wrap items-center gap-2 bg-white/[0.02] border border-white/[0.08] rounded-xl p-1 shrink-0">
              <button 
                onClick={() => setRhythmClass('slow')}
                className={`px-3 py-1 text-xs font-heading rounded-lg transition-colors cursor-pointer ${rhythmClass === 'slow' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                ๓ ชั้น (ช้า)
              </button>
              <button 
                onClick={() => setRhythmClass('medium')}
                className={`px-3 py-1 text-xs font-heading rounded-lg transition-colors cursor-pointer ${rhythmClass === 'medium' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                ๒ ชั้น (ปกติ)
              </button>
              <button 
                onClick={() => setRhythmClass('fast')}
                className={`px-3 py-1 text-xs font-heading rounded-lg transition-colors cursor-pointer ${rhythmClass === 'fast' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:text-white'}`}
              >
                ชั้นเดียว (เร็ว)
              </button>
            </div>
          )}
        </div>

        {gameState === 'idle' ? (
          <div className="text-center py-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 animate-pulse">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-amber-100">พร้อมฝึกจับจังหวะหรือยัง?</h4>
              <p className="text-xs text-zinc-400 max-w-sm">เลือกความเร็ว แล้วเคาะตามจังหวะให้ต่อเนื่องเพื่อสะสมคะแนนและ XP</p>
            </div>
            <button
              onClick={startRhythmGame}
              id="btn_start_rhythm"
              className="px-6 py-2.5 font-heading font-bold text-xs text-zinc-950 bg-amber-400 rounded-full cursor-pointer hover:bg-amber-300 shadow-lg shadow-amber-400/10"
            >
              เริ่มเคาะประกอบจังหวะ
            </button>
          </div>
        ) : gameState === 'playing' ? (
          <div className="space-y-8 py-3 text-center">
            
            {/* Combo & Score dashboard */}
            <div className="flex justify-around items-center max-w-md mx-auto">
              <div className="text-zinc-500 text-xs">
                คะแนน: <span className="font-mono text-xl font-extrabold text-amber-300">{score}</span>
              </div>
              <div className="text-zinc-500 text-xs">
                คอมโบติดต่อ: <span className="font-mono text-xl font-extrabold text-orange-400">{combo}</span>
              </div>
            </div>

            {/* Target rhythm metronome display visualization */}
            <div className="flex justify-center items-center gap-6 max-w-xs mx-auto">
              
              {/* Cing visual container */}
              <div className={`relative w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                isCing 
                  ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 scale-110 shadow-lg shadow-emerald-500/20' 
                  : 'bg-zinc-950 border-white/[0.05] text-zinc-600 opacity-40'
              }`}>
                <span className="font-heading font-extrabold text-xl">ฉิ่ง</span>
                <span className="text-[8px] uppercase tracking-wider font-mono">จังหวะเปิด</span>
              </div>

              {/* Cap visual container */}
              <div className={`relative w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                !isCing 
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 scale-110 shadow-lg shadow-amber-500/20' 
                  : 'bg-zinc-950 border-white/[0.05] text-zinc-600 opacity-40'
              }`}>
                <span className="font-heading font-extrabold text-xl">ฉับ</span>
                <span className="text-[8px] uppercase tracking-wider font-mono">จังหวะหนัก</span>
              </div>

            </div>

            {/* Dynamic Interactive Feedbacks */}
            <div className="h-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={feedback}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs ${feedbackColor}`}
                >
                  {feedback}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Big TAP trigger button */}
            <div className="flex flex-col gap-4 items-center justify-center">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleTap}
                className="w-48 h-48 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-500/10 via-zinc-900 to-amber-500/20 text-center flex flex-col items-center justify-center cursor-pointer relative shadow-2xl overflow-hidden hover:border-amber-300 group"
              >
                {/* Ripple animation inside */}
                <div className="absolute inset-0 bg-amber-400/5 group-hover:scale-105 transition-transform duration-500 rounded-full"></div>
                <Sparkles className="w-7 h-7 text-amber-400 animate-pulse mb-1.5 z-10" />
                <span className="font-heading font-extrabold text-lg text-amber-200 uppercase tracking-widest z-10">เคาะจังหวะ</span>
                <span className="text-[9px] text-zinc-500 tracking-wider z-10 font-mono">TAP METRONOME</span>
              </motion.button>

              <button
                onClick={endRhythmGame}
                className="px-4 py-1.5 text-zinc-500 hover:text-rose-400 text-[10px] font-mono cursor-pointer underline"
              >
                จบเกมและบันทึกคะแนน
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <h4 className="font-heading font-bold text-amber-300">สรุปผลเกมจังหวะ</h4>
            <div className="inline-block bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4">
              <div className="text-xs text-zinc-500">คะแนนที่ทำได้</div>
              <div className="text-3xl font-heading font-extrabold text-amber-200 mt-1">{score} คะแนน</div>
            </div>
            
            <p className="text-xs text-zinc-400 max-w-sm mx-auto p-1 leading-relaxed">
              การฝึกจังหวะช่วยให้จับความแตกต่างของอัตรา 3 ชั้น 2 ชั้น และชั้นเดียวได้ชัดขึ้น
            </p>

            <button
              onClick={() => setGameState('idle')}
              className="px-5 py-2.5 bg-zinc-900 border border-white/[0.05] hover:bg-zinc-800 rounded-full cursor-pointer text-xs font-semibold"
            >
              เล่นอีกครั้ง
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
