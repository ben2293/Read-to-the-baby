export const BABY_MEDIA = {
  SLEEPING: {
    type: 'video',
    src: 'https://videos.pexels.com/video-files/3205798/3205798-hd_1920_1080_25fps.mp4'
  },
  CRYING: {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1516737384526-e904148256b7?q=80&w=1000&auto=format&fit=crop'
  },
  LISTENING: {
    type: 'video',
    src: 'https://videos.pexels.com/video-files/3245379/3245379-hd_1920_1080_25fps.mp4'
  },
  PAUSED: {
    type: 'video',
    src: 'https://videos.pexels.com/video-files/3205798/3205798-hd_1920_1080_25fps.mp4'
  }
};

// Sensitivity levels — how long before baby cries
export const SENSITIVITY_LEVELS = [
  { label: 'Chill',     silenceMs: 5000, color: 'bg-yellow-600', audioSrc: 'https://quicksounds.com/uploads/tracks/1355384241_119010098_1119435478.mp3' },
  { label: 'Normal',    silenceMs: 2000, color: 'bg-orange-500', audioSrc: 'https://bigsoundbank.com/UPLOAD/mp3/0877.mp3' },
  { label: 'Screaming', silenceMs: 800,  color: 'bg-red-500',    audioSrc: 'https://bigsoundbank.com/UPLOAD/mp3/0233.mp3' },
  { label: 'Meltdown',  silenceMs: 300,  color: 'bg-red-700',    audioSrc: 'https://bigsoundbank.com/UPLOAD/mp3/0881.mp3' },
];

export const SPEECH_THRESHOLD = 0.05;
