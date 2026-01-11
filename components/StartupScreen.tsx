
import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const StartupScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initiating Global Node...');

  useEffect(() => {
    const statuses = [
      'Initiating Global Node...',
      'Synchronizing Neural Grid...',
      'Calibrating Flame AI...',
      'Encrypting Bio-Signal...',
      'Opening Worldwide Portal...'
    ];
    
    let currentStatusIdx = 0;
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
      
      const newIdx = Math.floor((progress / 100) * statuses.length);
      if (newIdx !== currentStatusIdx && newIdx < statuses.length) {
        currentStatusIdx = newIdx;
        setStatus(statuses[newIdx]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center p-8 font-space">
      <div className="relative mb-12 animate-in zoom-in duration-1000">
        <div className="relative w-56 h-56 md:w-72 md:h-72 flex items-center justify-center animate-float">
          <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-3xl scale-110 opacity-60"></div>
          <Logo className="drop-shadow-[0_15px_35px_rgba(162,28,175,0.4)]" />
        </div>
      </div>

      <div className="text-center space-y-8 w-full max-w-xs animate-in slide-in-from-bottom duration-700 delay-300">
        <div className="space-y-2">
          <h2 className="lost-style text-2xl md:text-3xl text-gradient font-black tracking-[0.25em]">WORLDWIDE</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300">Neural Network v6.0</p>
        </div>

        <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">
            {status}
          </p>
          <div className="px-4 py-1.5 bg-pink-50 rounded-full">
            <span className="text-[12px] font-black text-pink-600 tabular-nums tracking-widest">{progress}% SYNC</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
           <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></div>
           <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-200">
          Secured by Flame AI • Global Encryption Active
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default StartupScreen;
