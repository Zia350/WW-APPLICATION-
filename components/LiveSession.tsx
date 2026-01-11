
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { User } from '../types';

interface LiveSessionProps {
  user: User;
}

// Utility functions for audio encoding/decoding
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

const LiveSession: React.FC<LiveSessionProps> = ({ user }) => {
  const [isLive, setIsLive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const startLive = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Initializing GoogleGenAI with the recommended direct environment variable access
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session connected');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (event) => {
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
              // Relying on sessionPromise to send data to prevent race conditions or stale closures
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

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.inputTranscription) {
              setTranscriptions(prev => [...prev, `User: ${message.serverContent?.inputTranscription?.text}`]);
            }
            if (message.serverContent?.outputTranscription) {
              setTranscriptions(prev => [...prev, `Flame: ${message.serverContent?.outputTranscription?.text}`]);
            }
          },
          onerror: (e) => setError('Live session error: ' + e),
          onclose: () => setIsLive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are Flame, a supportive and energetic AI assistant for the Worldwide social network. Interact with users naturally in this live video/audio session.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
      setIsLive(true);
    } catch (err) {
      setError('Failed to start live: ' + err);
    }
  };

  const stopLive = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsLive(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] flex flex-col">
      <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-700 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Flame Live Studio</h2>
          <p className="text-sm opacity-80">Interact with Flame AI in real-time</p>
        </div>
        <div className="flex gap-2">
          {!isLive ? (
            <button onClick={startLive} className="px-6 py-2 bg-white text-violet-600 font-bold rounded-full hover:shadow-lg transition-all">Go Live</button>
          ) : (
            <button onClick={stopLive} className="px-6 py-2 bg-red-500 text-white font-bold rounded-full hover:shadow-lg transition-all">End Live</button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-black rounded-2xl relative overflow-hidden aspect-video group">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale-[0.3]" />
          {!isLive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center animate-pulse mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-white font-medium">Ready to start your Worldwide Live?</p>
            </div>
          )}
          {isLive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-widest animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Live
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 flex flex-col border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            Live Transcription
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-xs">
            {transcriptions.length > 0 ? (
              transcriptions.map((t, i) => (
                <div key={i} className={`p-2 rounded-lg ${t.startsWith('User') ? 'bg-white dark:bg-gray-800' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600'}`}>
                  {t}
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">No activity yet...</p>
            )}
          </div>
          {error && <p className="mt-4 text-[10px] text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LiveSession;
