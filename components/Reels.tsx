
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { MusicTrack, ContentCategory } from '../types';

interface ReelComment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface ReelItem {
  id: string;
  username: string;
  avatar: string;
  caption: string;
  videoThumb: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  music: MusicTrack;
  comments: ReelComment[];
  category?: ContentCategory;
}

const Reels: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showShareMenuReelId, setShowShareMenuReelId] = useState<string | null>(null);
  const [isSharingToChat, setIsSharingToChat] = useState(false);
  
  const [startY, setStartY] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Playback timer states
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const REEL_DURATION = 15; // Simulated 15 second reels

  const containerRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80;

  const contacts = [
    { id: 'c1', username: 'jordan_m', avatar: 'https://picsum.photos/seed/jordan/100/100' },
    { id: 'c2', username: 'sara_s', avatar: 'https://picsum.photos/seed/sara/100/100' },
    { id: 'c3', username: 'ww_official', avatar: 'https://picsum.photos/seed/world/100/100' },
  ];

  const [mockReels, setMockReels] = useState<ReelItem[]>([
    { id: 'r1', username: 'nature_explorer', avatar: 'https://picsum.photos/seed/nature/100/100', caption: 'The beauty of the wild. 🌿 #Nature #Explore', videoThumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600', likesCount: 45200, commentsCount: 1200, isLiked: false, isSaved: false, music: { id: 'm1', title: 'Wild Spirit', artist: 'Audio', cover: 'https://picsum.photos/seed/m1/100/100' }, comments: [], category: 'Nature' },
    { id: 'r2', username: 'tech_guru', avatar: 'https://picsum.photos/seed/tech/100/100', caption: 'The future is here. 🚀 #Tech #AI', videoThumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600', likesCount: 128000, commentsCount: 5600, isLiked: true, isSaved: true, music: { id: 'm2', title: 'Neon Dreams', artist: 'Vibes', cover: 'https://picsum.photos/seed/m2/100/100' }, comments: [], category: 'Tech' },
    { id: 'r3', username: 'urban_skater', avatar: 'https://picsum.photos/seed/skate/100/100', caption: 'Midnight sessions in the city. 🛹 #NightLife', videoThumb: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=600', likesCount: 89000, commentsCount: 3200, isLiked: false, isSaved: false, music: { id: 'm3', title: 'Night Ride', artist: 'Lofi', cover: 'https://picsum.photos/seed/m3/100/100' }, comments: [], category: 'Lifestyle' },
    { id: 'r4', username: 'chef_pro', avatar: 'https://picsum.photos/seed/chef/100/100', caption: 'Sizzling the grid with new recipes. 🍳 #Foodie', videoThumb: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600', likesCount: 21000, commentsCount: 900, isLiked: false, isSaved: true, music: { id: 'm4', title: 'Kitchen Beats', artist: 'Gourmet', cover: 'https://picsum.photos/seed/m4/100/100' }, comments: [], category: 'Lifestyle' },
  ]);

  // Neural Interest Tracking
  const trackInterest = (category?: ContentCategory, weight: number = 1) => {
    if (!category) return;
    const currentUserId = localStorage.getItem('ww-active-account-id') || 'default';
    const currentInterests = JSON.parse(localStorage.getItem(`ww-interests-${currentUserId}`) || '{}');
    currentInterests[category] = (currentInterests[category] || 0) + weight;
    localStorage.setItem(`ww-interests-${currentUserId}`, JSON.stringify(currentInterests));
  };

  // Timer logic with interest tracking
  useEffect(() => {
    setPlaybackProgress(0);
    setCurrentTime(0);
    
    const interval = setInterval(() => {
      setPlaybackProgress(prev => {
        if (prev >= 100) {
          // If the user watched the whole reel, they are INTERESTED
          trackInterest(mockReels[activeIdx]?.category, 2);
          if (activeIdx < mockReels.length - 1) {
            navigateReel(activeIdx + 1);
          }
          return 0;
        }
        return prev + (100 / (REEL_DURATION * 10)); // 10 ticks per second
      });
      setCurrentTime(prev => {
        if (prev >= REEL_DURATION) return 0;
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeIdx]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    const currentTouchY = e.touches[0].clientY;
    const delta = currentTouchY - startY;
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (!isDragging || isAnimating) return;
    setIsDragging(false);

    if (dragOffset < -SWIPE_THRESHOLD && activeIdx < mockReels.length - 1) {
      navigateReel(activeIdx + 1);
    } else if (dragOffset > SWIPE_THRESHOLD && activeIdx > 0) {
      navigateReel(activeIdx - 1);
    } else {
      setIsAnimating(true);
      setDragOffset(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const navigateReel = (newIdx: number) => {
    setIsAnimating(true);
    setDragOffset(0);
    setActiveIdx(newIdx);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isAnimating) return;
    if (e.deltaY > 50 && activeIdx < mockReels.length - 1) {
      navigateReel(activeIdx + 1);
    } else if (e.deltaY < -50 && activeIdx > 0) {
      navigateReel(activeIdx - 1);
    }
  };

  const toggleLike = (id: string) => {
    setMockReels(prev => prev.map(reel => {
      if (reel.id === id) {
        const alreadyLiked = reel.isLiked;
        if (!alreadyLiked) trackInterest(reel.category, 5);
        return { 
          ...reel, 
          isLiked: !reel.isLiked, 
          likesCount: reel.isLiked ? reel.likesCount - 1 : reel.likesCount + 1 
        };
      }
      return reel;
    }));
  };

  const toggleSave = (id: string) => {
    setMockReels(prev => prev.map(reel => {
      if (reel.id === id) {
        trackInterest(reel.category, 4);
        return { ...reel, isSaved: !reel.isSaved };
      }
      return reel;
    }));
    alert('Reel signal synchronized to your node archive.');
  };

  const handleDownloadReel = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `worldwide_reel_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      alert('Kinetic signal captured to device.');
    } catch (e) {
      alert('Unable to capture local signal.');
    }
  };

  const shareReelToDirect = (contactId: string) => {
    const reel = mockReels[activeIdx];
    if (!reel) return;
    trackInterest(reel.category, 10);
    window.dispatchEvent(new CustomEvent('ww-share-to-chat', {
      detail: {
        type: 'reel_share',
        contactId,
        payload: {
          sharedContentId: reel.id,
          sharedContentThumb: reel.videoThumb,
          sharedContentAuthor: reel.username,
          text: `🎥 Transmitting kinetic signal from @${reel.username}`
        }
      }
    }));
    setShowShareMenuReelId(null);
    setIsSharingToChat(false);
  };

  const formatCount = (num: number) => num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();
  
  const formatTime = (time: number) => {
    const s = Math.floor(time);
    return `00:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center bg-black rounded-[3rem] overflow-hidden relative group font-space select-none touch-none shadow-2xl border border-white/5"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Top Playback Bar Layer (Persistent) */}
      <div className="absolute top-0 left-0 right-0 z-40 p-6 pt-10 flex flex-col gap-4 pointer-events-none">
        <div className="flex gap-1.5 w-full">
          {mockReels.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ease-linear ${i === activeIdx ? 'bg-white shadow-[0_0_10px_#fff]' : i < activeIdx ? 'bg-white' : 'w-0'}`} 
                style={{ width: i === activeIdx ? `${playbackProgress}%` : i < activeIdx ? '100%' : '0%' }}
              ></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center animate-in fade-in duration-700">
           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_#ec4899]"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Kinetic Stream</span>
           </div>
           <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-[10px] font-mono-custom font-black tracking-widest text-white/90">
                {formatTime(currentTime)} / {formatTime(REEL_DURATION)}
              </span>
           </div>
        </div>
      </div>

      {/* Transmit (Share) Modal */}
      {showShareMenuReelId && (
        <div className="absolute inset-0 z-[500] bg-black/70 backdrop-blur-xl flex items-end justify-center animate-in fade-in duration-300" onClick={() => { setShowShareMenuReelId(null); setIsSharingToChat(false); }}>
           <div className="w-full max-w-[420px] bg-white dark:bg-[#0a0a0a] rounded-t-[3.5rem] p-10 shadow-[0_-30px_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8 opacity-40"></div>
              <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-10">{isSharingToChat ? 'Select Target Node' : 'Signal Transmit Hub'}</h3>
              
              {isSharingToChat ? (
                <div className="space-y-4 max-h-72 overflow-y-auto no-scrollbar pb-6 px-2">
                  {contacts.map(c => (
                    <button key={c.id} onClick={() => shareReelToDirect(c.id)} className="w-full flex items-center gap-5 p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-3xl transition-all text-left group">
                      <img src={c.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:scale-110 transition-transform" alt="" />
                      <div className="flex-1">
                        <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tighter">@{c.username}</span>
                        <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mt-0.5">Online Node</p>
                      </div>
                      <div className="px-5 py-2 bg-pink-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-pink-500/20 active:scale-90 transition-transform">Send</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  <button onClick={() => setIsSharingToChat(true)} className="w-full flex items-center gap-6 p-6 bg-pink-500 text-white rounded-[2rem] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-pink-500/20 group">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Transmit to Node Chat</span>
                  </button>
                  <button onClick={() => { setShowShareMenuReelId(null); alert('Signal address copied.'); }} className="w-full flex items-center gap-6 p-6 bg-white/5 border border-white/10 dark:bg-white/5 rounded-[2rem] text-gray-900 dark:text-white transition-all hover:scale-[1.02] active:scale-95 group">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg></div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Copy Kinetic URL</span>
                  </button>
                </div>
              )}
              <button onClick={() => { setShowShareMenuReelId(null); setIsSharingToChat(false); }} className="w-full mt-10 py-5 text-[11px] font-black uppercase text-gray-400 tracking-[0.3em] hover:text-pink-500 transition-colors">Discard Menu</button>
           </div>
        </div>
      )}

      {/* Reel Scrollable Surface */}
      <div 
        ref={containerRef}
        className={`w-full max-w-[480px] h-full relative transition-all ${isAnimating ? 'duration-500' : 'duration-0'}`}
        style={{ transform: `translateY(calc(-${activeIdx * 100}% + ${dragOffset}px))` }}
      >
        {mockReels.map((reel, idx) => {
          const isActive = activeIdx === idx;
          return (
            <div key={reel.id} className="h-full w-full relative bg-[#050505] flex flex-col justify-center overflow-hidden">
              {/* Media Layer */}
              <img src={reel.videoThumb} className="w-full h-full object-cover opacity-80" alt="" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>

              {/* Identity & Context Overlay */}
              <div className={`absolute bottom-12 left-8 right-20 text-white z-20 transition-all duration-1000 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative cursor-pointer group" onClick={() => alert(`Synchronizing with @${reel.username}`)}>
                    <div className="absolute inset-0 rounded-full bg-pink-500 blur-xl opacity-40 group-hover:scale-125 transition-transform animate-pulse"></div>
                    <img src={reel.avatar} className="w-12 h-12 rounded-[1.2rem] border-2 border-pink-500 relative z-10 transition-transform group-hover:rotate-6 shadow-2xl" alt="" />
                  </div>
                  <div>
                    <span className="font-black text-sm uppercase tracking-[0.15em] block cursor-pointer hover:text-pink-400 transition-colors" onClick={() => alert(`Visiting @${reel.username}'s Node`)}>@{reel.username}</span>
                    <button className="px-5 py-2 mt-1.5 bg-pink-500 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pink-500/20 active:scale-90 transition-all">Sync Node</button>
                  </div>
                </div>
                <p className="text-sm mb-8 pr-6 font-bold leading-relaxed drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-gray-100">{reel.caption}</p>
                
                <div className="flex items-center gap-3 bg-black/50 backdrop-blur-2xl px-5 py-3 rounded-[1.5rem] w-fit border border-white/10 group cursor-pointer hover:border-pink-500/50 transition-all active:scale-95" onClick={() => alert(`Track Matrix: ${reel.music.title}`)}>
                  <div className="relative">
                    <svg className="w-4 h-4 text-pink-500 group-hover:animate-bounce" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    <div className="absolute inset-0 bg-pink-500 blur-md opacity-20 animate-pulse"></div>
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase truncate max-w-[180px]">{reel.music.title} • {reel.music.artist}</span>
                </div>
              </div>

              {/* Kinetic Action Sidebar */}
              <div className={`absolute right-6 bottom-16 flex flex-col gap-8 text-white z-20 transition-all duration-1000 ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => toggleLike(reel.id)}>
                  <div className={`p-4 backdrop-blur-3xl rounded-[1.5rem] border-2 transition-all duration-500 active:scale-[1.4] ${reel.isLiked ? 'bg-pink-500 border-pink-400 shadow-[0_0_40px_rgba(236,72,153,0.4)]' : 'bg-white/10 border-white/10 group-hover:bg-white/20'}`}>
                    <svg className="w-7 h-7" fill={reel.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tighter opacity-80">{formatCount(reel.likesCount)}</span>
                </div>

                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => alert('Opening Comment Node Stream')}>
                  <div className="p-4 backdrop-blur-3xl rounded-[1.5rem] border-2 border-white/10 bg-white/10 group-hover:bg-white/20 active:scale-110 transition-all duration-300">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tighter opacity-80">{formatCount(reel.commentsCount)}</span>
                </div>

                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setShowShareMenuReelId(reel.id)}>
                   <div className="p-4 backdrop-blur-3xl rounded-[1.5rem] border-2 border-white/10 bg-white/10 group-hover:bg-white/20 active:scale-110 transition-all duration-300">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-tighter opacity-80">Transmit</span>
                </div>

                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleDownloadReel(reel.videoThumb)}>
                   <div className="p-4 backdrop-blur-3xl rounded-[1.5rem] border-2 border-white/10 bg-white/10 group-hover:bg-white/20 active:scale-110 transition-all duration-300">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-tighter opacity-80">Capture</span>
                </div>

                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => toggleSave(reel.id)}>
                   <div className={`p-4 backdrop-blur-3xl rounded-[1.5rem] border-2 transition-all duration-500 active:scale-110 ${reel.isSaved ? 'bg-amber-500 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)]' : 'bg-white/10 border-white/10 group-hover:bg-white/20'}`}>
                      <svg className="w-7 h-7" fill={reel.isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-tighter opacity-80">{reel.isSaved ? 'Stored' : 'Archive'}</span>
                </div>

                <div className="mt-6 group cursor-pointer relative" onClick={() => alert(`Audio Manifest: ${reel.music.title}`)}>
                   <div className="absolute inset-0 bg-pink-500 rounded-[1.2rem] blur-xl opacity-0 group-hover:opacity-60 transition-opacity"></div>
                   <div className="w-14 h-14 rounded-[1.2rem] overflow-hidden border-[3px] border-white/40 shadow-2xl animate-[spin_8s_linear_infinite] group-hover:animate-none transition-all relative z-10 group-hover:scale-110">
                      <img src={reel.music.cover} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/10"></div>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kinetic Index Pips */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-30 hidden md:flex">
        {mockReels.map((_, i) => (
          <button key={i} onClick={() => navigateReel(i)} className={`w-1 transition-all duration-700 rounded-full ${activeIdx === i ? 'h-16 bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,1)]' : 'h-4 bg-white/20 hover:bg-white/50'}`}></button>
        ))}
      </div>
    </div>
  );
};

export default Reels;
