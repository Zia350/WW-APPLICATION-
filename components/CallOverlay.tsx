import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface CallOverlayProps {
  type: 'audio' | 'video';
  contact: any;
  onClose: () => void;
}

// Reuse audio utilities from LiveSession.tsx
const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const CallOverlay: React.FC<CallOverlayProps> = ({ type, contact, onClose }) => {
  const [status, setStatus] = useState<'calling' | 'connected' | 'ending'>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === 'video');
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ringtone logic
    if (status === 'calling') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1346/1346-preview.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => console.debug('Ringtone blocked'));
      ringtoneRef.current = audio;
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    }

    // Success sound
    if (status === 'connected') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => console.debug('Sound blocked'));
    }

    const timer = setInterval(() => {
      if (status === 'connected') setDuration(d => d + 1);
    }, 1000);

    const callTimeout = setTimeout(() => {
      startSession();
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(callTimeout);
      if (ringtoneRef.current) ringtoneRef.current.pause();
      stopSession();
    };
  }, [status]);

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });
      
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (event) => {
              if (isMuted) return;
              const inputData = event.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => {
            console.error('Call error:', e);
            setStatus('ending');
            setTimeout(onClose, 1000);
          },
          onclose: () => {
            setStatus('ending');
            setTimeout(onClose, 1000);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: contact.name === 'Flame AI' ? 'Zephyr' : 'Kore' 
              } 
            } 
          },
          systemInstruction: `You are now simulating a call from ${contact.name} (@${contact.username}). Speak in their characteristic style. Keep responses brief and conversational. This is a private call.`,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to initiate call hardware:', err);
      onClose();
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 font-space">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        <div className="mb-10 relative">
          <div className={`absolute inset-0 rounded-full bg-pink-500/20 blur-xl transition-all duration-1000 ${status === 'calling' ? 'scale-150 animate-pulse' : 'scale-110'}`}></div>
          <div className={`w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 shadow-[0_0_50px_rgba(236,72,153,0.3)] ${status === 'calling' ? 'animate-float' : ''}`}>
             <img src={contact.avatar} className="w-full h-full rounded-full object-cover border-4 border-black" alt="" />
          </div>
          {status === 'connected' && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl border-4 border-black animate-in zoom-in">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-12">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{contact.name}</h2>
          <p className={`text-[11px] font-black uppercase tracking-[0.5em] ${status === 'connected' ? 'text-emerald-400' : 'text-gray-400 animate-pulse'}`}>
            {status === 'calling' ? 'Initializing Link...' : status === 'connected' ? `Encrypted • ${formatTime(duration)}` : 'Link Terminated'}
          </p>
        </div>

        {type === 'video' && status === 'connected' && (
          <div className="w-full aspect-[9/16] bg-gray-900 rounded-[3rem] overflow-hidden mb-12 border border-white/10 shadow-2xl relative group">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Local Feed</span>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 items-center">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-3xl transition-all active:scale-90 border-2 ${isMuted ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </button>

          <button 
            onClick={() => { setStatus('ending'); setTimeout(onClose, 800); }}
            className="w-20 h-20 bg-red-600 rounded-[2rem] text-white flex items-center justify-center shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-90 transition-all rotate-[135deg]"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </button>

          <button 
            onClick={() => setCameraOn(!cameraOn)}
            className={`p-5 rounded-3xl transition-all active:scale-90 border-2 ${!cameraOn ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 text-[9px] font-black uppercase tracking-[0.6em] text-white/20">
        Worldwide Neural Protocol v6.0 • End-to-End Encrypted
      </div>
    </div>
  );
};

export default CallOverlay;