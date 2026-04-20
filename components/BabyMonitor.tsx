import React, { useEffect, useRef } from 'react';
import { BabyState } from '../types';
import { BABY_MEDIA, SENSITIVITY_LEVELS, SPEECH_THRESHOLD } from '../constants';

interface BabyMonitorProps {
  state: BabyState;
  volume: number;
  isPaused: boolean;
  sensitivity: number;
  onTogglePause: () => void;
  onSensitivityChange: (val: number) => void;
}

export const BabyMonitor: React.FC<BabyMonitorProps> = ({
  state,
  volume,
  isPaused,
  sensitivity,
  onTogglePause,
  onSensitivityChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCrying = state === BabyState.CRYING;

  useEffect(() => {
    if (!audioRef.current) return;
    if (isCrying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isCrying, sensitivity]);
  const isListening = state === BabyState.LISTENING;

  const media = isCrying ? BABY_MEDIA.CRYING : isListening ? BABY_MEDIA.LISTENING : BABY_MEDIA.PAUSED;

  const message = isCrying ? 'Waaaaaah! Read to me!' : isListening ? "I'm listening..." : 'Paused';

  const level = SENSITIVITY_LEVELS[sensitivity];

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4 h-full gap-8">

      <audio ref={audioRef} src={SENSITIVITY_LEVELS[sensitivity].audioSrc} loop />

      {/* Status bubble */}
      <div className={`px-6 py-2 rounded-full text-lg font-bold shadow-lg border-2 transition-all duration-300
        ${isCrying ? 'bg-red-600 text-white border-red-400 animate-bounce' : ''}
        ${isListening ? 'bg-green-500 text-white border-green-400' : ''}
        ${state === BabyState.PAUSED ? 'bg-amber-500 text-white border-amber-400' : ''}
      `}>
        {message}
      </div>

      {/* Baby visual */}
      <div className={`relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-[8px] shadow-2xl bg-black transition-all duration-300
        ${isCrying ? 'border-red-600 shadow-red-900/50 animate-pulse' : ''}
        ${isListening ? 'border-green-400 shadow-green-500/30' : ''}
        ${state === BabyState.PAUSED ? 'border-amber-500' : ''}
      `}>
        {media.type === 'video' ? (
          <video key={media.src} src={media.src} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          <img key={media.src} src={media.src} alt="Baby" className={`w-full h-full object-cover ${isCrying ? 'scale-110' : ''}`} />
        )}
        {state === BabyState.PAUSED && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-16 h-16 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full bg-slate-800/80 p-6 rounded-xl border border-slate-700 space-y-6 shadow-lg">

        {/* Volume meter */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
            <span>Quiet</span>
            <span>Loud</span>
          </div>
          <div className="relative w-full h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-600">
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10" style={{ left: `${Math.min(SPEECH_THRESHOLD * 1000, 100)}%` }} />
            <div
              className={`h-full transition-all duration-100 ease-out ${volume > SPEECH_THRESHOLD ? 'bg-gradient-to-r from-green-600 to-green-400' : isCrying ? 'bg-red-600' : 'bg-slate-600'}`}
              style={{ width: `${Math.min(volume * 1000, 100)}%` }}
            />
          </div>
        </div>

        {/* Pause button */}
        <button
          onClick={onTogglePause}
          className={`w-full py-4 rounded-lg font-bold text-base transition-all uppercase tracking-wide shadow-lg active:scale-95
            ${isPaused
              ? 'bg-green-600 hover:bg-green-500 text-white border-b-4 border-green-800'
              : 'bg-amber-600 hover:bg-amber-500 text-white border-b-4 border-amber-800'
            }`}
        >
          {isPaused ? '▶ Resume Reading' : '⏸ Pause Reading'}
        </button>

        {/* Sensitivity slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crying Sensitivity</label>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${level.color}`}>{level.label}</span>
          </div>
          <input
            type="range"
            min={0}
            max={SENSITIVITY_LEVELS.length - 1}
            step={1}
            value={sensitivity}
            onChange={e => onSensitivityChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

      </div>
    </div>
  );
};
