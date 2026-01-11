
import React, { useState, useEffect } from 'react';
import { MusicTrack } from '../types';
import { GoogleGenAI } from '@google/genai';

interface MusicPickerProps {
  onSelect: (track: MusicTrack) => void;
  onClose: () => void;
}

const MusicPicker: React.FC<MusicPickerProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeService, setActiveService] = useState<'spotify' | 'google-music' | 'ytm'>('google-music');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiTracks, setAiTracks] = useState<MusicTrack[]>([]);
  
  const mockTracks: MusicTrack[] = [
    { id: 't1', title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=100' },
    { id: 't2', title: 'Cyberpunk 2077', artist: 'Hyper', cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=100' },
    { id: 't3', title: 'Levitating', artist: 'Dua Lipa', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=100' },
    { id: 't4', title: 'Midnight City', artist: 'M83', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=100' },
    { id: 't5', title: 'Worldwide Anthem', artist: 'Flame AI feat. Synth', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=100' },
  ];

  const handleConnect = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsSyncing(false);
    }, 1500);
  };

  const handleServiceSwitch = (service: 'spotify' | 'google-music' | 'ytm') => {
    setIsSyncing(true);
    setSearch('');
    setAiTracks([]);
    setTimeout(() => {
      setActiveService(service);
      setIsSyncing(false);
    }, 800);
  };

  const handleAISearch = async () => {
    if (!search.trim() || activeService !== 'google-music') return;
    setIsSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for popular songs matching "${search}" for the Worldwide Social Music Library. Return a JSON list of 6 tracks. 
        Each track must have: 
        - "id": a unique string
        - "title": song title
        - "artist": artist name
        - "cover": a realistic Unsplash URL (use photos related to music, concerts, or abstract moods like 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200').
        Return ONLY the JSON array.`,
        config: { 
          responseMimeType: "application/json"
        }
      });
      
      const tracks = JSON.parse(response.text || '[]');
      setAiTracks(tracks);
    } catch (e) {
      console.error("Neural music search interrupted.");
    } finally {
      setIsSyncing(false);
    }
  };

  const currentDisplayTracks = activeService === 'google-music' && aiTracks.length > 0 
    ? aiTracks 
    : mockTracks.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.artist.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a] rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col h-[85vh] font-space relative">
        <div className="p-8 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-white font-black uppercase tracking-tighter text-2xl">Music Matrix</h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">Select Frequency Provider</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-90 border border-white/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl gap-1 relative overflow-hidden">
            {isSyncing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center animate-pulse">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0.6s]"></div>
                </div>
              </div>
            )}
            <button 
              onClick={() => handleServiceSwitch('google-music')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-500 ${activeService === 'google-music' ? 'bg-white text-black font-black' : 'text-gray-400 hover:text-white'}`}
            >
              <div className="flex gap-0.5 scale-75">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-[8px] uppercase tracking-widest font-black">Google Music</span>
            </button>
            <button 
              onClick={() => handleServiceSwitch('spotify')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-500 ${activeService === 'spotify' ? 'bg-[#1DB954] text-black font-black' : 'text-gray-400 hover:text-white'}`}
            >
              <span className="text-[8px] uppercase tracking-widest font-black">Spotify</span>
            </button>
            <button 
              onClick={() => handleServiceSwitch('ytm')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-500 ${activeService === 'ytm' ? 'bg-red-600 text-white font-black' : 'text-gray-400 hover:text-white'}`}
            >
              <span className="text-[8px] uppercase tracking-widest font-black">YouTube Music</span>
            </button>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in duration-500">
            <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-float transition-all duration-500 ${activeService === 'google-music' ? 'bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500' : 'bg-gradient-to-br from-pink-500 to-purple-600'}`}>
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
            </div>
            <div>
              <h3 className="text-white font-black text-xl uppercase tracking-tight mb-2">
                {activeService === 'google-music' ? 'Sync Google Account' : 'Connect Node Account'}
              </h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-[250px] mx-auto">
                {activeService === 'google-music' 
                  ? 'Access Google’s massive music library for high-fidelity signal broadcasts.' 
                  : 'Authorize Worldwide to access your sonic library for broadcast signals and reels.'}
              </p>
            </div>
            <button 
              onClick={handleConnect}
              disabled={isSyncing}
              className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl ${activeService === 'google-music' ? 'bg-blue-600 text-white shadow-blue-500/10' : 'bg-white text-black shadow-white/5'}`}
            >
              {isSyncing ? 'Connecting Node...' : `Authenticate ${activeService === 'google-music' ? 'Google Music' : activeService === 'spotify' ? 'Spotify' : 'YouTube Music'}`}
            </button>
          </div>
        ) : (
          <>
            <div className="p-8">
              <div className="relative group">
                <div className={`absolute -inset-1 rounded-3xl blur opacity-0 group-focus-within:opacity-20 transition-opacity ${activeService === 'google-music' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                <input 
                  type="text" 
                  placeholder={activeService === 'google-music' ? "Search Google Library..." : `Search ${activeService}...`}
                  className="w-full bg-[#111] border-none rounded-2xl py-5 pl-14 pr-20 text-white text-sm font-bold focus:ring-1 focus:ring-white/20 transition-all relative z-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                  autoFocus
                />
                <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                
                {activeService === 'google-music' && search.length > 2 && (
                  <button 
                    onClick={handleAISearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-blue-500 transition-all"
                  >
                    AI Search
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8 space-y-3">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">
                  {activeService === 'google-music' ? 'Google Sonic Assets' : 'Global Frequency Matches'}
                </p>
                {activeService === 'google-music' && (
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>

              {currentDisplayTracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => onSelect(track)}
                  className="w-full flex items-center gap-5 p-4 rounded-3xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
                >
                  <div className="relative w-16 h-16 flex-shrink-0">
                     <img src={track.cover} className="w-full h-full rounded-2xl object-cover shadow-2xl transition-transform group-hover:scale-95" alt={track.title} />
                     <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity ${activeService === 'google-music' ? 'bg-blue-600/40' : 'bg-black/40'}`}>
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-sm truncate uppercase tracking-tighter mb-0.5">{track.title}</h4>
                    <p className="text-gray-500 text-[10px] font-bold truncate uppercase tracking-widest">{track.artist}</p>
                  </div>
                  <div className={`text-[8px] font-black group-hover:text-white transition-colors uppercase tracking-[0.2em] border border-white/5 px-4 py-2.5 rounded-xl ${activeService === 'google-music' ? 'text-blue-500 group-hover:bg-blue-600' : 'text-pink-500 group-hover:bg-pink-600'}`}>Attach</div>
                </button>
              ))}

              {currentDisplayTracks.length === 0 && (
                <div className="py-24 text-center opacity-40">
                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No matching frequencies found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MusicPicker;
