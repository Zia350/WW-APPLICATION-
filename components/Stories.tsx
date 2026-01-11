
import React, { useState } from 'react';
import { User, Story } from '../types';

interface StoriesProps {
  user: User;
  stories: Story[];
  onAddStory: () => void;
}

const Stories: React.FC<StoriesProps> = ({ user, stories, onAddStory }) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const allStories: Story[] = [
    { id: 's1', userId: user.id, username: 'Me', userAvatar: user.avatar, image: '', seen: false },
    ...stories
  ];

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x no-scrollbar">
        {allStories.map((story, i) => (
          <div 
            key={story.id} 
            onClick={() => i === 0 ? onAddStory() : setActiveStory(story)}
            className="flex flex-col items-center gap-2 flex-shrink-0 snap-start cursor-pointer group"
          >
            <div className={`p-0.5 rounded-full border-2 transition-all duration-300 ${i === 0 ? 'border-dashed border-gray-300' : (story.seen ? 'border-gray-200' : 'border-violet-600 ring-2 ring-violet-500/20')}`}>
              <div className="relative">
                <img 
                  src={story.userAvatar} 
                  className="w-16 h-16 rounded-full object-cover transition-transform group-hover:scale-95" 
                  alt={story.username} 
                />
                {i === 0 && (
                  <div className="absolute bottom-0 right-0 bg-violet-600 text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 max-w-[70px] truncate">{story.username}</span>
          </div>
        ))}
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl bg-gray-900 border border-white/10">
            {/* Progress Bars */}
            <div className="absolute top-6 left-6 right-6 flex gap-1 z-20">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-2/3 animate-[progress_5s_linear_infinite]"></div>
              </div>
            </div>

            {/* Header */}
            <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <img src={activeStory.userAvatar} className="w-10 h-10 rounded-full border-2 border-white" alt="Avatar" />
                <span className="text-white font-black text-xs uppercase tracking-widest">@{activeStory.username}</span>
              </div>
              <button onClick={() => setActiveStory(null)} className="text-white p-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <img src={activeStory.image} className="w-full h-full object-cover" alt="Story" />

            <div className="absolute bottom-8 left-0 right-0 px-8 flex gap-4 items-center">
              <input 
                type="text" 
                placeholder="Reply to story..." 
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
              <button className="text-white hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </>
  );
};

export default Stories;
