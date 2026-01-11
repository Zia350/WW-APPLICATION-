
import React, { useState, useMemo } from 'react';
import { User, AppTab, Post, MusicTrack } from '../types';
import MusicPicker from './MusicPicker';
import Logo from './Logo';

interface ProfileProps {
  user: User;
  onEdit: () => void;
  setActiveTab: (tab: AppTab) => void;
}

interface ProfilePost {
  id: string;
  image: string;
  type: 'image' | 'video';
  likes: number;
  comments: number;
  isArchived: boolean;
}

const Profile: React.FC<ProfileProps> = ({ user, onEdit, setActiveTab }) => {
  const [activeView, setActiveView] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [showArchive, setShowArchive] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const [noteText, setNoteText] = useState('');
  const [noteMusic, setNoteMusic] = useState<MusicTrack | null>(null);

  const [myPosts] = useState<ProfilePost[]>(() => [
    { id: 'p-1', image: 'https://picsum.photos/seed/p1/600/600', type: 'image', likes: 120, comments: 12, isArchived: false },
    { id: 'p-2', image: 'https://picsum.photos/seed/p2/600/600', type: 'video', likes: 450, comments: 34, isArchived: false },
    { id: 'p-3', image: 'https://picsum.photos/seed/p3/600/600', type: 'image', likes: 89, comments: 5, isArchived: true },
    { id: 'p-4', image: 'https://picsum.photos/seed/p4/600/600', type: 'image', likes: 210, comments: 18, isArchived: false },
  ]);

  const [savedPosts] = useState<ProfilePost[]>(() => [
    { id: 's-1', image: 'https://picsum.photos/seed/s1/600/600', type: 'image', likes: 1200, comments: 88, isArchived: false },
    { id: 's-2', image: 'https://picsum.photos/seed/s2/600/600', type: 'image', likes: 3400, comments: 156, isArchived: false },
    { id: 's-3', image: 'https://picsum.photos/seed/s3/600/600', type: 'video', likes: 5600, comments: 230, isArchived: false },
  ]);

  const handleNoteComplete = () => {
    if (!noteText.trim() && !noteMusic) return;
    alert('Note signal synchronized to your global node profile.');
    setShowNoteModal(false);
  };

  const displayPosts = useMemo(() => {
    switch (activeView) {
      case 'saved': return savedPosts;
      case 'reels': return myPosts.filter(p => p.type === 'video');
      default: return myPosts.filter(p => p.isArchived === showArchive);
    }
  }, [activeView, myPosts, savedPosts, showArchive]);

  return (
    <div className="max-w-[935px] mx-auto pt-4 md:pt-12 pb-20 px-4 page-transition font-space">
      {showMusicPicker && (
        <MusicPicker onSelect={(track) => { setNoteMusic(track); setShowMusicPicker(false); }} onClose={() => setShowMusicPicker(false)} />
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[3.5rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600"></div>
              
              <h3 className="text-center font-black uppercase tracking-[0.5em] text-gray-400 mb-12 text-[10px]">Neural Node Pulse</h3>
              
              <div className="relative group mb-10 flex flex-col items-center">
                 <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-br from-pink-500 to-purple-600 mb-8 shadow-2xl relative animate-float">
                   <img src={user.avatar} className="w-full h-full rounded-full object-cover border-[6px] border-white dark:border-gray-900 shadow-inner" alt="" />
                   {noteMusic && (
                     <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-3 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl animate-bounce">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                     </div>
                   )}
                 </div>
                 <textarea 
                   className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] p-8 text-sm font-black dark:text-white border-none focus:ring-4 focus:ring-pink-500/10 resize-none h-40 text-center shadow-inner placeholder-gray-400"
                   placeholder="Broadcast your current frequency..."
                   value={noteText}
                   onChange={e => setNoteText(e.target.value)}
                 />
              </div>

              {noteMusic ? (
                <div className="mb-10 flex items-center gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/40 animate-in slide-in-from-bottom-4">
                   <img src={noteMusic.cover} className="w-12 h-12 rounded-2xl shadow-xl rotate-3" alt="" />
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black dark:text-white truncate uppercase tracking-tighter mb-0.5">{noteMusic.title}</p>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{noteMusic.artist}</p>
                   </div>
                   <button onClick={() => setNoteMusic(null)} className="p-3 text-gray-400 hover:text-red-500 active:scale-90 transition-all bg-white/10 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowMusicPicker(true)}
                  className="w-full mb-10 py-6 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-all flex items-center justify-center gap-4 active:scale-95 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                  Connect Frequency
                </button>
              )}

              <div className="flex gap-4">
                 <button onClick={() => setShowNoteModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 active:scale-95 transition-all">Abort</button>
                 <button 
                    onClick={handleNoteComplete} 
                    disabled={!noteText.trim() && !noteMusic}
                    className="flex-[2] py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                  >
                    Sync Node Pulse
                  </button>
              </div>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row items-center md:items-start mb-20 gap-14 md:gap-32">
        <div className="flex-shrink-0 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
            <button 
              onClick={() => setShowNoteModal(true)}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-6 py-3 rounded-[2rem] shadow-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group hover:border-pink-500"
            >
              {noteText ? <span className="text-pink-500">Live Frequency</span> : 'Emit Pulse'}
              <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping group-hover:scale-150 transition-transform"></div>
            </button>
          </div>
          <div className="w-44 h-44 md:w-52 md:h-52 rounded-full p-[4px] bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 animate-float shadow-2xl">
            <div className="bg-white dark:bg-gray-950 rounded-full h-full w-full p-2">
              <img src={user.avatar} className="w-full h-full rounded-full object-cover shadow-inner border-4 border-transparent hover:border-pink-50/20 transition-all cursor-pointer" alt="Profile" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center md:items-start w-full">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mb-10 w-full">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">@{user.username}</h2>
            <div className="flex items-center gap-4">
              <button onClick={onEdit} className="px-8 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-pink-500 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm active:scale-95">Config Node</button>
              <button 
                onClick={() => { setShowArchive(!showArchive); setActiveView('posts'); }} 
                className={`p-3 rounded-2xl transition-all active:scale-95 ${showArchive ? 'bg-pink-500 text-white shadow-xl' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-900'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-16 mb-10">
            <div className="text-center md:text-left cursor-pointer group" onClick={() => setActiveView('posts')}>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter group-hover:text-pink-500 transition-colors">{myPosts.filter(p => !p.isArchived).length}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Signals</p>
            </div>
            <div className="text-center md:text-left cursor-pointer group" onClick={() => alert('Synchronized Nodes List')}>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter group-hover:text-pink-500 transition-colors">{user.followers.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncs</p>
            </div>
            <div className="text-center md:text-left cursor-pointer group" onClick={() => alert('Following Nodes List')}>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter group-hover:text-pink-500 transition-colors">{user.following.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing</p>
            </div>
          </div>

          <div className="space-y-5 text-center md:text-left">
            <div>
              <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight">{user.displayName}</h3>
              <p className="text-[11px] font-black text-pink-500 uppercase tracking-[0.2em] mt-1">Admin Global Node</p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg font-medium text-sm">
              {user.bio || 'Broadcasting my digital signature across the Worldwide network infrastructure. 🛸'}
            </p>
          </div>
        </div>
      </header>

      <div className="border-t border-gray-200 dark:border-gray-800 flex justify-center gap-14 md:gap-32 mb-12">
        {(['posts', 'reels', 'saved'] as const).map(v => (
          <button 
            key={v}
            onClick={() => { setActiveView(v); setShowArchive(false); }}
            className={`pt-8 text-[11px] font-black uppercase tracking-[0.3em] transition-all border-t-2 -mt-[2px] active:scale-95 ${activeView === v && !showArchive ? 'text-pink-500 border-pink-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-10">
        {displayPosts.length > 0 ? displayPosts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => setActiveTab('feed')}
            className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500"
          >
            <img src={post.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Post" />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/80 via-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-10">
              <div className="flex flex-col items-center gap-2 text-white font-black text-sm uppercase tracking-widest">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                {post.likes}
              </div>
              <div className="flex flex-col items-center gap-2 text-white font-black text-sm uppercase tracking-widest">
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                 {post.comments}
              </div>
            </div>
            {post.type === 'video' && (
              <div className="absolute top-6 right-6 text-white drop-shadow-2xl">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-3 py-48 text-center flex flex-col items-center opacity-20">
            <Logo size={100} className="grayscale mb-10" />
            <p className="text-[12px] font-black uppercase tracking-[0.6em]">Sector Null detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
