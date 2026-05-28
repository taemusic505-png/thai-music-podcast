export interface TranscriptLine {
  time: number; // in seconds
  text: string;
  speaker: 'ครูเอก' | 'นักเรียนมะลิ' | 'ผู้บรรยาย' | 'ระบบ';
  highlightInstruments?: string[]; // trigger sound or popup highlight
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
}

export interface InteractiveGameTrigger {
  time: number; // triggers at this second in the podcast
  type: 'flashcard' | 'matching' | 'quiz_popup' | 'drag_drop' | 'sound_tap';
  title: string;
  description: string;
  data: any; // game-specific configuration data
}

export interface Episode {
  id: string; // ep1, ep2, ep3
  title: string;
  duration: string; // e.g., "12:00"
  durationSeconds: number;
  description: string;
  objective: string;
  learningPoints: string[];
  thumbnail: string;
  colorGrad: string; // tailwind gradient classes
  audioUrl?: string; // Path to MP3 file for AI voice
  transcript: TranscriptLine[];
  quizzes: QuizQuestion[];
  games: InteractiveGameTrigger[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  xpReward: number;
  unlocked: boolean;
}

export interface Instrument {
  id: string;
  name: string;
  type: 'เครื่องดีด' | 'เครื่องสี' | 'เครื่องตี' | 'เครื่องเป่า';
  description: string;
  character: string; // e.g., "เสียง แหลม ใส อ่อนโยน"
  illustrationHex: string;
  audioKey: string; // sound key
  audioFrequency: number[]; // frequencies simulated for synth notes
}

export interface LearningStats {
  totalXp: number;
  level: number;
  completedEpisodes: string[]; // ['ep1', 'ep2']
  listeningTime: number; // in seconds
  answersCorrect: number;
  answersAttempted: number;
  dailyStreak: number;
  unlockedBadgeIds: string[];
  activeTab: 'home' | 'player' | 'soundboard' | 'quiz' | 'dashboard';
  currentEpisodeId: string;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  soundboardStreak: number;
}
