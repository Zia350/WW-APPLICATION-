
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { GoogleGenAI } from '@google/genai';

interface DashboardProps {
  user: User;
}

interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  stats: string;
  isFollowing: boolean;
  category: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [creators, setCreators] = useState<Creator[]>([
    { id: 'c1', username: 'quantum_coder', displayName: 'Quantum Coder', avatar: 'https://picsum.photos/seed/qc/100/100', stats: '2.4M Syncs', isFollowing: false, category: 'Tech' },
    { id: 'c2', username: 'digital_muse', displayName: 'Digital Muse', avatar: 'https://picsum.photos/seed/dm/100/100', stats: '1.8M Syncs', isFollowing: true, category: 'Art' },
    { id: 'c3', username: 'neo_traveler', displayName: 'Neo Traveler', avatar: 'https://picsum.photos/seed/nt/100/100', stats: '950K Syncs', isFollowing: false, category: 'Lifestyle' },
  ]);

  const [aiSuggestions, setAiSuggestions] = useState<string>('Calibrating Flame AI for node discovery...');
  const [loadingAi, setLoadingAi] = useState(false);

  const userInterests = useMemo(() => {
    return JSON.parse(localStorage.getItem(`ww-interests-${user.id}`) || '{}');
  }, [user.id]);

  const sortedInterests = useMemo(() => {
    return Object.entries(userInterests)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);
  }, [userInterests]);

  const stats = [
    { label: 'Neural Reach', value: '14.2K', change: '+12%', color: 'text-pink-500' },
    { label: 'Sync Strength', value: '98.4%', change: '+0.5%', color: 'text-purple-500' },
    { label: 'Signal Echoes', value: '256', change: '+24', color: 'text-blue-500' },
  ];

  useEffect(() => {
    fetchAiSuggestions();
  }, []);

  const fetchAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const topInterests = sortedInterests.map(([k]) => k).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on a user with interests in ${topInterests || 'general exploring'} and a profile health of ${user.profileHealth}, suggest 3 conceptual types of creators they should sync with. Keep it short and high-tech sounding.`,
        config: {
            systemInstruction: "You are the Creator Matrix Assistant for Worldwide. Provide concise, futuristic node discovery advice."
        }
      });
      setAiSuggestions(response.text || "Searching the grid for compatible signals...");
    } catch (e) {
      setAiSuggestions("Unable to establish AI link for node suggestions.");
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleFollow = (id: string) => {
    setCreators(prev => prev.map(c => c.id === id ? { ...c, isFollowing: !c.isFollowing } : c));
  };

  return (
    <div className="space-y-8 page-transition font-space pb-12">
      <header className="flex flex-col gap-2">
        <h2 className="text-4xl font-syne font-black text-gradient tracking-tighter uppercase">Creator Matrix</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Node Hub & Analytics</p>
      </header>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all duration-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{s.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-4xl font-black ${s.color} tracking-tighter`}>{s.value}</h3>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Creators */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Featured Signals</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:scale-105 transition-all">Expand Grid</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creators.map(creator => (
              <div key={creator.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 dark:border-gray-700 flex items-center gap-5 group hover:bg-white dark:hover:bg-gray-800 transition-all duration-500 shadow-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-500 rounded-full blur-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <img src={creator.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 relative z-10" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">@{creator.username}</h4>
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{creator.category} • {creator.stats}</p>
                  <button 
                    onClick={() => toggleFollow(creator.id)}
                    className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${creator.isFollowing ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-pink-500 text-white shadow-lg active:scale-95'}`}
                  >
                    {creator.isFollowing ? 'Synced' : 'Initiate Sync'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Neural Interest Profile Viz */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Neural Interest Profile</h3>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
             </div>
             <div className="space-y-4">
                {sortedInterests.length > 0 ? sortedInterests.map(([cat, score]) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-600 dark:text-gray-300">{cat}</span>
                      <span className="text-pink-500">{score as number} SIGNAL STRENGTH</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-1000" 
                        style={{ width: `${Math.min((score as number) * 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No signal data recorded. Interact with posts to calibrate.</p>
                )}
             </div>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white px-2">AI Neural Discovery</h3>
          <div className="bg-gradient-to-br from-violet-600 to-indigo-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group min-h-[300px]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
             
             <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Flame Insight</span>
                </div>

                <div className="flex-1">
                    {loadingAi ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-2 w-full bg-white/20 rounded"></div>
                        <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                        <div className="h-2 w-5/6 bg-white/20 rounded"></div>
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed italic opacity-90">
                        "{aiSuggestions}"
                      </p>
                    )}
                </div>

                <button 
                  onClick={fetchAiSuggestions}
                  className="mt-8 w-full py-4 bg-white text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  Recalibrate Discovery
                </button>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Node Health</h4>
             <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000" 
                  style={{ width: `${user.profileHealth}%` }}
                ></div>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">{user.profileHealth}% Signal Integrity</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase">Optimal Sync</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
