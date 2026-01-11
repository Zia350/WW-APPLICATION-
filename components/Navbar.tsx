
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { User, AppTab, Post } from '../types';
import Logo from './Logo';

const { useNavigate } = ReactRouterDOM;

interface NavbarProps {
  user: User;
  allUsers: User[];
  posts?: Post[];
  onSwitchAccount: (userId: string) => void;
  onAddAccount: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  themeColor: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, allUsers, posts = [], onSwitchAccount, onAddAccount, activeTab, setActiveTab, themeColor }) => {
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { users: [], posts: [], exploreHints: [] };
    
    const query = searchQuery.toLowerCase();
    
    const filteredUsers = allUsers.filter(u => 
      u.username.toLowerCase().includes(query) || 
      u.displayName.toLowerCase().includes(query)
    ).slice(0, 5);

    const filteredPosts = posts.filter(p => 
      p.content.toLowerCase().includes(query) || 
      p.username.toLowerCase().includes(query)
    ).slice(0, 5);

    const hints = [
      `Search Flame AI for "${searchQuery}"`,
      `Find events related to "${searchQuery}"`,
      `Discover nodes tagged #${searchQuery.replace(/\s/g, '')}`
    ];

    return { users: filteredUsers, posts: filteredPosts, exploreHints: hints };
  }, [searchQuery, allUsers, posts]);

  const handleResultClick = (type: 'user' | 'post' | 'ai', id?: string) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    if (type === 'user') navigate('/profile');
    if (type === 'post' && id) navigate(`/post/${id}`);
    if (type === 'ai') navigate('/ai');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('feed')}>
          <Logo size={32} />
          <span className="lost-style text-xl md:text-2xl tracking-[0.1em] text-gradient hidden sm:block">
            W.WIDE
          </span>
        </div>

        <div className="flex-1 max-w-sm mx-4 sm:mx-8 hidden md:block relative" ref={searchRef}>
          <div className="relative group">
            <div className={`absolute inset-0 bg-pink-500/5 rounded-2xl blur transition-all ${isSearchFocused ? 'bg-pink-500/15' : 'group-focus-within:bg-pink-500/10'}`}></div>
            <svg className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-pink-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search nodes, signals, content..." 
              className="w-full bg-gray-100/50 dark:bg-gray-800/50 border-none rounded-2xl py-2.5 px-12 focus:ring-2 focus:ring-pink-500/20 focus:bg-white dark:focus:bg-gray-700 transition-all text-xs font-bold relative"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
              <div className="max-h-[70vh] overflow-y-auto no-scrollbar py-4">
                {/* User Section */}
                {searchResults.users.length > 0 && (
                  <div className="mb-4">
                    <p className="px-6 text-[9px] font-black uppercase tracking-[0.4em] text-pink-500 mb-2">Network Nodes</p>
                    {searchResults.users.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => handleResultClick('user')}
                        className="w-full flex items-center gap-4 px-6 py-3 hover:bg-pink-50 dark:hover:bg-white/5 transition-all group"
                      >
                        <img src={u.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate">@{u.username}</p>
                          <p className="text-[10px] text-gray-400 truncate">{u.displayName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Post Section */}
                {searchResults.posts.length > 0 && (
                  <div className="mb-4">
                    <p className="px-6 text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-2">Signal Echoes</p>
                    {searchResults.posts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleResultClick('post', p.id)}
                        className="w-full flex items-center gap-4 px-6 py-3 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover opacity-80" alt="" /> : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{p.content}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">By @{p.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Explore Hints / AI Section */}
                <div className="mb-2">
                  <p className="px-6 text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Neural Discovery</p>
                  {searchResults.exploreHints.map((hint, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleResultClick('ai')}
                      className="w-full flex items-center gap-4 px-6 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all group"
                    >
                      <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-lg group-hover:rotate-12 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400">{hint}</span>
                    </button>
                  ))}
                </div>

                {searchResults.users.length === 0 && searchResults.posts.length === 0 && (
                   <div className="px-6 py-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Signal Void</p>
                      <p className="text-[9px] font-medium text-gray-500">No nodes or echoes match this frequency.</p>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 relative">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`relative p-2 transition-all hover:scale-110 ${activeTab === 'chat' ? 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 rounded-xl' : 'text-gray-500 hover:text-pink-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`relative p-2 transition-all hover:scale-110 ${activeTab === 'notifications' ? 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 rounded-xl' : 'text-gray-500 hover:text-pink-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
          </button>
          
          <div 
            className={`flex items-center gap-2 cursor-pointer p-1 rounded-full border transition-all ${activeTab === 'profile' || showSwitcher ? 'border-pink-500 bg-pink-50/50' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-pink-200'}`}
            onClick={() => setShowSwitcher(!showSwitcher)}
          >
            <div className="relative">
              <img src={user.avatar} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="Me" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <span className="font-black text-[10px] hidden lg:block uppercase tracking-widest text-gray-600 dark:text-gray-300 pr-2">{user.displayName}</span>
          </div>

          {showSwitcher && (
            <div className="absolute top-full right-0 mt-4 w-56 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-2 animate-in slide-in-from-top-2">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 p-3">Switch Node</p>
              <div className="space-y-1">
                {allUsers.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => { onSwitchAccount(u.id); setShowSwitcher(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${u.id === user.id ? 'bg-pink-50 dark:bg-pink-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                      <span className={`font-bold text-xs ${u.id === user.id ? 'text-pink-600' : 'text-gray-700 dark:text-gray-300'}`}>@{u.username}</span>
                    </div>
                    {u.id === user.id && <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>}
                  </button>
                ))}
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                <button 
                  onClick={() => { onAddAccount(); setShowSwitcher(false); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                  </div>
                  <span className="font-black text-[10px] text-indigo-500 uppercase tracking-widest">Add Node</span>
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-full text-center py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-pink-500 transition-colors"
                >
                  View Identity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
