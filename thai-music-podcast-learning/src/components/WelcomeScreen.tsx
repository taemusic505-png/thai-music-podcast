import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Volume2, VolumeX, BookOpen, Music } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const equalizerBars = [1.4, 2.1, 1.8, 2.8, 1.2, 2.5, 1.9, 2.9, 1.5, 2.3, 1.1, 2.7, 1.6, 2.2, 1.7];
const equalizerHeights = ['35%', '58%', '44%', '78%', '32%', '70%', '52%', '86%', '40%', '62%', '30%', '74%', '46%', '64%', '48%'];

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodeRef = useRef<OscillatorNode | null>(null);
  const ambientIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAmbient = () => {
    if (ambientIntervalRef.current) {
      clearInterval(ambientIntervalRef.current);
      ambientIntervalRef.current = null;
    }

    if (oscNodeRef.current) {
      try {
        oscNodeRef.current.stop();
      } catch (e) {}
      oscNodeRef.current = null;
    }

    setAmbientPlaying(false);
  };

  // Simple synthesised soft ambient chime loop using Web Audio API
  const toggleAmbient = () => {
    if (ambientPlaying) {
      stopAmbient();
    } else {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const context = audioCtxRef.current || new Ctx();
        audioCtxRef.current = context;

        if (context.state === 'suspended') {
          context.resume();
        }

        const osc = context.createOscillator();
        const gain = context.createGain();

        // Soft sine wave simulating a flute or temple bell chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, context.currentTime); // E4 note

        // Soft pulsating volume
        gain.gain.setValueAtTime(0.005, context.currentTime);
        
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();

        oscNodeRef.current = osc;
        setAmbientPlaying(true);

        // Pulsating volume loop
        ambientIntervalRef.current = setInterval(() => {
          // random soft chime notes
          const notes = [261.63, 293.66, 329.63, 392.00, 440.00]; // Pentatonic Thai Scale
          const randomNote = notes[Math.floor(Math.random() * notes.length)];
          osc.frequency.exponentialRampToValueAtTime(randomNote, context.currentTime + 1.5);
          gain.gain.setValueAtTime(0.005, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.015, context.currentTime + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.5);
        }, 3000);

      } catch (err) {
        console.error('Audio synthesizer initialization aborted or blocked by browser user-gesture rules:', err);
      }
    }
  };

  useEffect(() => {
    return stopAmbient;
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black text-slate-100 overflow-hidden font-sans px-4 select-none">
      
      {/* Decorative Thai Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
      
      {/* Ambient depth bands */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>

      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        id="welcome_card"
        className="w-full max-w-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative z-10"
      >
        {/* Subtle Thai corner motifs simulated with styled border divs */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/50 rounded-tl-md"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/50 rounded-tr-md"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/50 rounded-bl-md"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/50 rounded-br-md"></div>

        {/* Small badge header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 font-heading text-xs font-semibold tracking-wider uppercase rounded-full mb-6 border border-amber-500/20">
          <Music className="w-3.5 h-3.5 animate-spin-slow" />
          วิชา ดนตรี-นาฏศิลป์ ม.1
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
          ความรู้พื้นฐานเกี่ยวกับดนตรีไทย
        </h1>
        
        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-400 font-medium leading-relaxed max-w-md mx-auto mb-8 font-sans">
          เรียนรู้ผ่านพอดแคสต์ สรุปเนื้อหาตามหลักสูตร มินิเกมจังหวะ คลังเสียงเครื่องดนตรี และแบบทดสอบก่อน-หลังเรียน
        </p>

        {/* Dynamic Equalizer Animation */}
        <div className="flex items-end justify-center gap-1.5 h-12 mb-10 w-full px-4">
          {equalizerBars.map((delay, index) => (
            <motion.div
              key={index}
              animate={{ height: ['15%', '100%', '15%'] }}
              transition={{
                duration: delay,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full dark:opacity-80"
              style={{
                height: equalizerHeights[index]
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 justify-center items-center w-full max-w-sm mx-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            id="btn_start_learning"
            className="w-full flex items-center justify-center gap-3 px-8 py-4 font-heading font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 cursor-pointer transition-all duration-300"
          >
            <PlayCircle className="w-5.5 h-5.5" />
            เข้าสู่พอดแคสต์บทเรียน
          </motion.button>
          
          <button
            onClick={toggleAmbient}
            id="btn_toggle_welcome_ambient"
            className="flex items-center gap-2 px-4 py-2 mt-2 text-xs font-medium text-amber-400/70 hover:text-amber-300 backdrop-blur-md bg-white/[0.02] hover:bg-white/[0.05] border border-amber-400/20 rounded-lg transition-colors cursor-pointer"
          >
            {ambientPlaying ? (
              <>
                <VolumeX className="w-4 h-4 animate-pulse text-amber-500" />
                ปิดเสียงบรรยากาศ
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-400/80" />
                เปิดเสียงบรรยากาศเบาๆ
              </>
            )}
          </button>
        </div>

        {/* Objective & Standards Info Box */}
        <div className="mt-10 pt-6 border-t border-white/[0.05] flex items-center justify-center gap-3 text-left">
          <BookOpen className="w-5 h-5 text-amber-400/80 shrink-0" />
          <div className="text-xs text-zinc-500">
            <span className="text-zinc-400 font-semibold">ตัวชี้วัด ศ 2.1 และ ศ 2.2 ม.1:</span> ความเข้าใจองค์ประกอบดนตรีไทย วิธีอ่านบันทึกโน้ต และบทบาทของดนตรีที่มีอิทธิพลต่อสังคมไทย
          </div>
        </div>

      </motion.div>

      {/* Footer Branding */}
      <span className="font-mono text-[10px] text-zinc-600 mt-10 tracking-widest uppercase">
        Thai Contemporary Podclass • Grade 7 Curriculum EdTech
      </span>
    </div>
  );
}
