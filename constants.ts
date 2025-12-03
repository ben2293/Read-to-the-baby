
export const BABY_MEDIA = {
  SLEEPING: { 
    type: 'video', 
    src: 'https://videos.pexels.com/video-files/3205798/3205798-hd_1920_1080_25fps.mp4' 
  },
  CRYING: { 
    type: 'image', 
    // A very expressive crying baby image
    src: 'https://images.unsplash.com/photo-1516737384526-e904148256b7?q=80&w=1000&auto=format&fit=crop' 
  },
  LISTENING: { 
    type: 'video', 
    src: 'https://videos.pexels.com/video-files/3245379/3245379-hd_1920_1080_25fps.mp4' 
  },
  HAPPY: { 
    type: 'video', 
    src: 'https://videos.pexels.com/video-files/3245379/3245379-hd_1920_1080_25fps.mp4' 
  },
  PAUSED: {
    type: 'video',
    src: 'https://videos.pexels.com/video-files/3205798/3205798-hd_1920_1080_25fps.mp4' 
  }
};

export const CRYING_LEVELS = [
  {
    label: "Whining",
    src: "https://www.soundjay.com/human/sounds/baby-crying-01.mp3",
    color: "bg-yellow-600"
  },
  {
    label: "Wailing",
    src: "https://www.soundjay.com/human/sounds/baby-crying-02.mp3",
    color: "bg-orange-500"
  },
  {
    label: "Screaming",
    src: "https://www.soundjay.com/human/sounds/baby-crying-03.mp3",
    color: "bg-red-500"
  },
  {
    label: "Meltdown",
    src: "https://www.soundjay.com/human/sounds/baby-crying-06.mp3",
    color: "bg-red-700"
  }
];

export const BABY_AUDIO = {
  // Default fallback
  CRYING: CRYING_LEVELS[1].src,
};

export const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const STORY_MODEL = 'gemini-2.5-flash';

// Thresholds
export const SPEECH_THRESHOLD = 0.05; // Must be louder than this to count as reading
export const SILENCE_TOLERANCE_MS = 2000; // 2 seconds of silence before crying