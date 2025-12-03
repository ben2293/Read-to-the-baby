
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { BabyState, AppMode } from './types';
import { BABY_MEDIA, GEMINI_LIVE_MODEL, SPEECH_THRESHOLD, SILENCE_TOLERANCE_MS } from './constants';
import { BabyMonitor } from './components/BabyMonitor';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from './services/audioUtils';

// Configuration for the Gemini Live "Baby" Persona
const LIVE_CONFIG = {
  model: GEMINI_LIVE_MODEL,
  systemInstruction: `You are a happy baby listener. You respond to the user's voice with cute baby sounds (coos, giggles, awws). Do not speak any words.`,
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
  },
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SETUP);
  const [babyState, setBabyState] = useState<BabyState>(BabyState.SLEEPING);
  const [volume, setVolume] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs for Audio Processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for Logic
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isPausedRef = useRef(false);

  // Initialize Audio & Gemini Live
  const startSession = async () => {
    try {
      // 1. Audio Context Setup
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 }); // Input rate for Gemini
      const outputContext = new AudioContextClass({ sampleRate: 24000 }); // Output rate for Gemini
      
      // Resume context if suspended (browser policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      if (outputContext.state === 'suspended') {
        await outputContext.resume();
      }

      audioContextRef.current = audioContext;
      outputNodeRef.current = outputContext.createGain();
      outputNodeRef.current.connect(outputContext.destination);

      // 2. Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 3. Connect to Gemini Live
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: LIVE_CONFIG.model,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: LIVE_CONFIG.speechConfig,
            systemInstruction: LIVE_CONFIG.systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsConnected(true);
            setMode(AppMode.ACTIVE);
            setBabyState(BabyState.LISTENING);
            lastSpeechTimeRef.current = Date.now();

            // Start silence timer
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                setBabyState(BabyState.CRYING);
            }, SILENCE_TOLERANCE_MS);
          },
          onmessage: async (message: LiveServerMessage) => {
            // If paused, STOP here. Do not play audio.
            if (isPausedRef.current) return;

            // Handle Baby's audio response (Cooing/Giggling)
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContext) {
               try {
                const audioData = base64ToUint8Array(base64Audio);
                const audioBuffer = await decodeAudioData(audioData, outputContext, 24000);
                
                const source = outputContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current!);
                
                // Schedule playback
                const currentTime = outputContext.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                    nextStartTimeRef.current = currentTime;
                }
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                
                // Track source for cleanup
                audioSourcesRef.current.add(source);
                source.onended = () => audioSourcesRef.current.delete(source);
               } catch (e) {
                   console.error("Audio decode error", e);
               }
            }
          },
          onclose: () => {
            console.log("Gemini Live Disconnected");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
          }
        }
      });
      sessionRef.current = sessionPromise;

      // 4. Client-Side Audio Processing (VAD & Streaming)
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        // SKIP processing if paused
        if (isPausedRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // A. Streaming to Gemini
        const pcmBlob = createPcmBlob(inputData);
        sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        });

        // B. Local VAD (Voice Activity Detection) Logic
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(rms); // Update UI meter

        if (rms > SPEECH_THRESHOLD) {
            // User is speaking clearly (above noise floor)
            handleSpeechDetected();
        }
      };

      inputSourceRef.current = source;
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioContext.destination); // Essential for script processor to run

    } catch (error) {
      console.error("Failed to initialize:", error);
      setMode(AppMode.ERROR);
    }
  };

  // Logic to switch states based on VAD
  const handleSpeechDetected = useCallback(() => {
    if (isPausedRef.current) return;

    lastSpeechTimeRef.current = Date.now();
    
    // If previously crying, switch to listening immediately
    setBabyState(prev => {
        if (prev === BabyState.CRYING || prev === BabyState.SLEEPING) {
            return BabyState.LISTENING;
        }
        return prev;
    });

    // Clear any existing silence timer
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
    }

    // Set a new timer to trigger CRYING if silence persists
    silenceTimerRef.current = setTimeout(() => {
        setBabyState(BabyState.CRYING);
    }, SILENCE_TOLERANCE_MS);

  }, []);

  const togglePause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    isPausedRef.current = newState;

    if (newState) {
        // PAUSING
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setBabyState(BabyState.PAUSED);
        setVolume(0);
        
        // Stop any currently playing audio sources
        audioSourcesRef.current.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0; // Reset audio cursor

    } else {
        // RESUMING
        setBabyState(BabyState.LISTENING);
        lastSpeechTimeRef.current = Date.now();
        
        // Restart silence timer immediately
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
            setBabyState(BabyState.CRYING);
        }, SILENCE_TOLERANCE_MS);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        if (processorRef.current) processorRef.current.disconnect();
        if (inputSourceRef.current) inputSourceRef.current.disconnect();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);


  // Render Helpers
  if (!process.env.API_KEY) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <div className="p-8 bg-red-900/50 rounded-lg border border-red-500">
                  <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
                  <p>API Key is missing. Please check your environment variables.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center overflow-hidden font-sans">
      {/* Header */}
      <header className="w-full p-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-blue-100">ReadToMe</h1>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-600'}`} />
            {isConnected ? 'Connected' : 'Offline'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-1 overflow-hidden">
        
        {mode === AppMode.SETUP ? (
            <div className="text-center space-y-8 max-w-lg animate-in fade-in duration-700 slide-in-from-bottom-4 px-6">
              
              <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-slate-700 opacity-80 grayscale relative bg-black shadow-2xl">
                  <video 
                    src={BABY_MEDIA.SLEEPING.src} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                  />
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
                             <br/><br/>
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
                onTogglePause={togglePause}
            />
        )}

      </main>

      {/* Footer Instructions */}
      <footer className="p-2 text-center text-slate-600 text-[10px] shrink-0">
        <p>Powered by Google Gemini 2.5 Flash & Live API</p>
      </footer>
    </div>
  );
};

export default App;
