
import React, { useEffect, useState, useRef } from 'react';
import { BabyState } from '../types';
import { BABY_MEDIA, CRYING_LEVELS, SPEECH_THRESHOLD } from '../constants';

interface BabyMonitorProps {
  state: BabyState;
  volume: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const BabyMonitor: React.FC<BabyMonitorProps> = ({ state, volume, isPaused, onTogglePause }) => {
  const [currentMedia, setCurrentMedia] = useState(BABY_MEDIA.SLEEPING);
  const [message, setMessage] = useState("");
  
  // Crying Logic
  const [cryingIntensity, setCryingIntensity] = useState(1); // Default to Wailing
  
  const [mediaError, setMediaError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    switch (state) {
      case BabyState.CRYING:
        setCurrentMedia(BABY_MEDIA.CRYING);
        setMessage("Waaaaaah! Read to me!");
        break;
      case BabyState.LISTENING:
        setCurrentMedia(BABY_MEDIA.LISTENING);
        setMessage("I'm listening...");
        break;
      case BabyState.HAPPY:
        setCurrentMedia(BABY_MEDIA.HAPPY);
        setMessage("Yay! I love this story!");
        break;
      case BabyState.PAUSED:
        setCurrentMedia(BABY_MEDIA.PAUSED);
        setMessage("Paused");
        break;
      case BabyState.SLEEPING:
      default:
        setCurrentMedia(BABY_MEDIA.SLEEPING);
        setMessage("Zzz...");
        break;
    }
    setMediaError(false);
  }, [state]);

  // Handle Audio Effects
  useEffect(() => {
    if (audioRef.current) {
      if (state === BabyState.CRYING) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback failed:", error);
          });
        }
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [state, cryingIntensity]);

  const isCrying = state === BabyState.CRYING;
  const isHappy = state === BabyState.LISTENING || state === BabyState.HAPPY;
  const isPausedState = state === BabyState.PAUSED;

  // Fallback emojis
  const getFallbackEmoji = () => {
    switch (state) {
      case BabyState.CRYING: return "😭";
      case BabyState.HAPPY: return "🥰";
      case BabyState.LISTENING: return "👶";
      case BabyState.PAUSED: return "⏸️";
      case BabyState.SLEEPING: 
      default: return "😴";
    }
  };

  // Determine current audio source
  const currentAudioSrc = CRYING_LEVELS[cryingIntensity].src;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-2 h-full gap-12">
      
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentAudioSrc} 
        loop 
      />

      {/* Top Section: Status & Baby */}
      <div className="flex flex-col items-center w-full shrink-0">
        {/* Status Bubble */}
        <div className={`mb-6 px-6 py-2 rounded-full text-lg font-bold transition-all duration-300 shadow-lg z-10 text-center min-h-[3rem] flex items-center border-2
            ${isCrying ? 'bg-red-600 text-white border-red-400 animate-bounce' : ''}
            ${isHappy ? 'bg-green-500 text-white border-green-400' : ''}
            ${isPausedState ? 'bg-amber-500 text-white border-amber-400' : ''}
            ${state === BabyState.SLEEPING ? 'bg-slate-800 text-blue-200 border-slate-600' : ''}
        `}>
            {message}
        </div>

        {/* Baby Visual */}
        <div className={`relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-[8px] shadow-2xl transition-all duration-300 bg-black flex items-center justify-center shrink-0
            ${isCrying ? 'border-red-600 animate-shake shadow-red-900/50' : 'border-slate-700'}
            ${isHappy ? 'border-green-400 shadow-green-500/30' : ''}
            ${isPausedState ? 'border-amber-500' : ''}
        `}>
            {!mediaError ? (
            currentMedia.type === 'video' ? (
                <video
                key={currentMedia.src}
                src={currentMedia.src}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setMediaError(true)}
                className="w-full h-full object-cover"
                />
            ) : (
                <img
                key={currentMedia.src}
                src={currentMedia.src}
                alt="Baby"
                onError={() => setMediaError(true)}
                className={`w-full h-full object-cover transition-transform duration-200
                    ${isCrying ? 'scale-110 animate-pulse' : 'scale-100'} 
                `}
                />
            )
            ) : (
            <div className="text-6xl animate-pulse select-none">
                {getFallbackEmoji()}
            </div>
            )}
            
            {/* Paused Overlay */}
            {isPausedState && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                <svg className="w-16 h-16 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
            </div>
            )}
            
            {/* Sleeping Overlay */}
            {!mediaError && state === BabyState.SLEEPING && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <span className="text-5xl animate-pulse">💤</span>
            </div>
            )}
        </div>
      </div>

      {/* Bottom Section: Controls */}
      <div className="w-full max-w-xl bg-slate-800/80 p-6 rounded-xl border border-slate-700 backdrop-blur-md shrink-0 space-y-6 shadow-lg">
        
        {/* Volume Meter */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
            <span>Quiet</span>
            <span>Loud</span>
          </div>
          <div className="relative w-full h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-600 shadow-inner">
            {/* Threshold Marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10"
              style={{ left: `${Math.min(SPEECH_THRESHOLD * 1000, 100)}%` }} 
            />
            
            {/* Level Bar */}
            <div 
              className={`h-full transition-all duration-100 ease-out ${volume > SPEECH_THRESHOLD ? 'bg-gradient-to-r from-green-600 to-green-400' : isCrying ? 'bg-red-600' : 'bg-slate-600'}`}
              style={{ width: `${Math.min(volume * 1000, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3">
            {/* Pause Button */}
            <button
                onClick={onTogglePause}
                className={`flex-1 py-4 rounded-lg font-bold text-base transition-all uppercase tracking-wide shadow-lg active:scale-95
                    ${isPaused 
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/30 border-b-4 border-green-800 hover:border-green-700' 
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 border-b-4 border-amber-800 hover:border-amber-700'
                    }
                `}
            >
                {isPaused ? '▶ Resume Reading' : '⏸ Pause Reading'}
            </button>
        </div>

        {/* Crying Level Slider */}
        <div className="pt-1">
          <div className="flex justify-between items-center mb-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Crying Sensitivity
             </label>
             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${CRYING_LEVELS[cryingIntensity].color}`}>
               {CRYING_LEVELS[cryingIntensity].label}
             </span>
          </div>
          
          <input 
            type="range" 
            min="0" 
            max={CRYING_LEVELS.length - 1}
            step="1"
            value={cryingIntensity}
            onChange={(e) => {
              setCryingIntensity(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
          />
        </div>

      </div>
    </div>
  );
};
