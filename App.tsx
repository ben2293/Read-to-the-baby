import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BabyState, AppMode } from './types';
import { BABY_MEDIA, SENSITIVITY_LEVELS, SPEECH_THRESHOLD } from './constants';
import { BabyMonitor } from './components/BabyMonitor';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SETUP);
  const [babyState, setBabyState] = useState<BabyState>(BabyState.SLEEPING);
  const [volume, setVolume] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sensitivity, setSensitivity] = useState(1);

  const inputContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);

  const clearTimer = () => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  };

  const startTimer = () => {
    clearTimer();
    const ms = SENSITIVITY_LEVELS[sensitivityRef.current].silenceMs;
    silenceTimerRef.current = setTimeout(() => setBabyState(BabyState.CRYING), ms);
  };

  const startSession = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      inputContextRef.current = inputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setMode(AppMode.ACTIVE);
      setBabyState(BabyState.LISTENING);
      startTimer();

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        const data = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        setVolume(rms);
        if (rms > SPEECH_THRESHOLD) handleSpeechDetected();
      };

      inputSourceRef.current = source;
      processorRef.current = processor;
      source.connect(processor);
      const silentGain = inputCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(inputCtx.destination);

    } catch (error) {
      console.error('Failed to initialize:', error);
      setMode(AppMode.ERROR);
    }
  };

  const handleSpeechDetected = useCallback(() => {
    if (isPausedRef.current) return;
    setBabyState(prev => (prev === BabyState.CRYING ? BabyState.LISTENING : prev));
    startTimer();
  }, []);

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    isPausedRef.current = next;
    if (next) {
      clearTimer();
      setBabyState(BabyState.PAUSED);
      setVolume(0);
    } else {
      setBabyState(BabyState.LISTENING);
      startTimer();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (inputContextRef.current) inputContextRef.current.close();
      if (processorRef.current) processorRef.current.disconnect();
      if (inputSourceRef.current) inputSourceRef.current.disconnect();
      clearTimer();
    };
  }, []);

  if (mode === AppMode.ERROR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="p-8 bg-red-900/50 rounded-lg border border-red-500">
          <h1 className="text-2xl font-bold mb-2">Microphone Error</h1>
          <p>Could not access your microphone. Please check permissions and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center overflow-hidden font-sans">
      <header className="w-full p-3 flex justify-between items-center z-10 shrink-0">
        <h1 className="text-lg font-bold tracking-tight text-blue-100">ReadToMe</h1>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center p-1 overflow-hidden">
        {mode === AppMode.SETUP ? (
          <div className="text-center space-y-8 max-w-lg animate-in fade-in duration-700 slide-in-from-bottom-4 px-6">
            <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-slate-700 opacity-80 grayscale relative bg-black shadow-2xl">
              <video src={BABY_MEDIA.SLEEPING.src} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-6xl animate-pulse">💤</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white tracking-tight">Ready to Read?</h2>
              <p className="text-xl text-blue-200 font-medium">Read aloud to keep the baby happy.</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-5 backdrop-blur-sm text-left">
              <div className="flex items-start gap-4">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="text-red-400 font-bold text-xs uppercase tracking-widest mb-1">Critical Warning</p>
                  <p className="text-red-100/90 leading-relaxed text-sm">
                    This baby <span className="font-extrabold text-white underline decoration-red-500 decoration-2">HATES</span> silence.
                    <br /><br />
                    You must start reading <span className="italic text-white font-semibold">immediately</span> after clicking the button.
                    If you pause for even a second... <span className="font-bold text-red-300">THE SCREAMING STARTS!</span> 😱
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-1"
            >
              Start Reading Immediately!
            </button>
          </div>
        ) : (
          <BabyMonitor
            state={babyState}
            volume={volume}
            isPaused={isPaused}
            sensitivity={sensitivity}
            onTogglePause={togglePause}
            onSensitivityChange={setSensitivity}
          />
        )}
      </main>

      <footer className="p-2 text-center text-slate-600 text-[10px] shrink-0">
        <p>No API required — 100% local</p>
      </footer>
    </div>
  );
};

export default App;
