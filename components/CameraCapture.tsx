
import React, { useState, useRef, useEffect } from 'react';
import { MusicTrack } from '../types';
import MusicPicker from './MusicPicker';

interface CameraCaptureProps {
  onCapture: (dataUrl: string, type: 'image' | 'video', music?: MusicTrack) => void;
  onClose: () => void;
}

type Filter = 'none' | 'ww-glow' | 'cyber' | 'mono' | 'vapor' | 'glitch';
type Mode = 'photo' | 'video';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [mode, setMode] = useState<Mode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Filter>('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [recordingTime, setRecordingTime] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const filters: Record<Filter, { css: string; label: string }> = {
    'none': { css: '', label: 'Natural' },
    'ww-glow': { css: 'sepia(0.3) hue-rotate(280deg) brightness(1.1) saturate(1.5)', label: 'WW Glow' },
    'cyber': { css: 'contrast(1.5) brightness(0.9) hue-rotate(180deg) saturate(2)', label: 'Cyber' },
    'mono': { css: 'grayscale(1) contrast(1.2) brightness(1.1)', label: 'Noir' },
    'vapor': { css: 'contrast(1.2) sepia(0.4) saturate(1.8) brightness(0.9)', label: 'Vapor' },
    'glitch': { css: 'hue-rotate(90deg) contrast(1.4) saturate(2)', label: 'Glitch' }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async () => {
    stopCamera();
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      setPermissionDenied(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = filters[activeFilter].css;
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      onCapture(canvas.toDataURL('image/jpeg', 0.9), 'image');
      onClose();
    }
  };

  const startRecording = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    const canvasStream = (canvas as any).captureStream(30);
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);

    const drawFrame = () => {
      if (ctx && videoRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = filters[activeFilter].css;
        if (facingMode === 'user') {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }
        if (mediaRecorderRef.current?.state === 'recording') {
          requestAnimationFrame(drawFrame);
        }
      }
    };
    
    const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string, 'video', selectedMusic || undefined);
        onClose();
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    setIsRecording(true);
    requestAnimationFrame(drawFrame);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMainAction = () => {
    if (mode === 'photo') takePhoto();
    else if (isRecording) stopRecording();
    else startRecording();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden font-space">
      {showMusicPicker && (
        <MusicPicker 
          onSelect={(track) => { setSelectedMusic(track); setShowMusicPicker(false); }} 
          onClose={() => setShowMusicPicker(false)} 
        />
      )}

      <div className={`relative w-full max-w-lg h-full md:h-auto md:aspect-[9/16] bg-gray-950 md:rounded-[3.5rem] overflow-hidden shadow-2xl border transition-all duration-300 ${isRecording ? 'border-red-600 ring-8 ring-red-600/20' : 'border-white/5'}`}>
        
        {permissionDenied ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 text-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-6 border border-pink-500/20">
              <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Signal Blocked</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8">
              We need your camera and microphone access to broadcast your signal to the world. Please enable permissions in your browser settings and try again.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={startCamera}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pink-50 transition-all active:scale-95"
              >
                Try Reconnecting
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/10 text-white/60 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Return to Grid
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Viewport Recording Overlay */}
            {isRecording && (
              <div className="absolute inset-0 pointer-events-none z-10">
                 <div className="absolute inset-0 border-[12px] border-red-600/30 animate-pulse"></div>
                 <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50 shadow-[0_0_15px_#dc2626] animate-[scan_3s_linear_infinite]"></div>
              </div>
            )}

            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transition-all duration-500"
              style={{ 
                filter: filters[activeFilter].css, 
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' 
              }}
            />

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12 md:pt-8 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-20">
              <button 
                onClick={onClose} 
                className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Music Selection Overlay */}
              {mode === 'video' && !isRecording && (
                <button 
                  onClick={() => setShowMusicPicker(true)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-3xl border border-white/20 transition-all active:scale-95 group ${selectedMusic ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <div className="relative">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    </svg>
                    {selectedMusic && <div className="absolute inset-0 bg-white blur-md opacity-20 animate-pulse"></div>}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[120px]">
                    {selectedMusic ? selectedMusic.title : 'Add Music'}
                  </span>
                  {selectedMusic && (
                    <div onClick={(e) => { e.stopPropagation(); setSelectedMusic(null); }} className="p-1 hover:bg-white/20 rounded-full">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    </div>
                  )}
                </button>
              )}

              {isRecording && (
                <div className="absolute left-1/2 -translate-x-1/2 top-10 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-3 bg-red-600 px-6 py-2.5 rounded-full text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400/50 transition-all animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                       <span className="text-[11px] font-black uppercase tracking-[0.2em]">RECORDING</span>
                    </div>
                    <div className="w-px h-4 bg-white/30"></div>
                    <span className="text-lg font-black tracking-[0.1em] tabular-nums leading-none">
                      {formatTimer(recordingTime)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                 <button 
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                  className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/20 transition-all active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
              
              {!isRecording && (
                <div className="flex justify-center mb-8">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-full backdrop-blur-xl text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70'}`}
                  >
                    {filters[activeFilter].label} Filters
                  </button>
                </div>
              )}

              {showFilters && !isRecording && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 animate-in slide-in-from-bottom duration-300">
                  {(Object.keys(filters) as Filter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${activeFilter === f ? 'scale-110' : 'opacity-60'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden ${activeFilter === f ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'border-white/20'}`}>
                        <div className="w-full h-full bg-gray-800" style={{ filter: filters[f].css }}>
                          <img src="https://picsum.photos/seed/filter/100/100" className="w-full h-full object-cover" alt="" />
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-white uppercase tracking-tight">{filters[f].label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl border-2 border-white/20 overflow-hidden opacity-50">
                  <img src="https://picsum.photos/seed/prev/100/100" className="w-full h-full object-cover" alt="" />
                </div>

                <div className="relative">
                  <button 
                    onClick={handleMainAction}
                    className={`w-24 h-24 rounded-full border-[6px] transition-all duration-300 flex items-center justify-center ${
                      isRecording 
                        ? 'border-white p-1.5' 
                        : mode === 'photo' 
                          ? 'border-white p-2.5' 
                          : 'border-red-600/60 p-2.5'
                    }`}
                  >
                    <div className={`transition-all duration-300 shadow-xl ${
                      isRecording 
                        ? 'w-10 h-10 bg-red-600 rounded-lg animate-pulse' 
                        : mode === 'photo' 
                          ? 'w-full h-full bg-white rounded-full' 
                          : 'w-full h-full bg-red-600 rounded-full'
                    }`}></div>
                  </button>
                </div>

                <div className="w-12 h-12 flex items-center justify-center">
                  <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white/50 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </button>
                </div>
              </div>

              {!isRecording && (
                <div className="flex justify-center mt-10 relative">
                  <div className="bg-black/40 backdrop-blur-2xl rounded-full p-1 flex gap-0 border border-white/10 shadow-2xl relative w-64 overflow-hidden">
                    <div 
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-500 ease-out ${
                        mode === 'photo' 
                          ? 'left-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                          : 'left-[calc(50%+1px)] bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                      }`}
                    ></div>
                    
                    <button 
                      onClick={() => setMode('photo')}
                      className={`flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative z-10 ${
                        mode === 'photo' ? 'text-gray-950' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Photo
                    </button>
                    <button 
                      onClick={() => setMode('video')}
                      className={`flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative z-10 ${
                        mode === 'video' ? 'text-white' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;
