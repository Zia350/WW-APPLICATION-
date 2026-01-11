
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { User, AppTab } from '../types';
import Logo from './Logo';

const { useNavigate } = ReactRouterDOM;

interface SidebarProps {
  user: User;
  allUsers: User[];
  onSwitchAccount: (userId: string) => void;
  onAddAccount: () => void;
  activeTab: string;
  setActiveTab: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, allUsers, onSwitchAccount, onAddAccount, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const menuItems = [
    { id: 'feed', label: 'Home Feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'explore', label: 'Discovery', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: 'reels', label: 'Reels Hub', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
    { id: 'ai-studio', label: 'AI Studio', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'media-lab', label: 'Media Lab', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'chat', label: 'Direct Nodes', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'notifications', label: 'Signal Pings', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'dashboard', label: 'Matrix Core', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'profile', label: 'Identity', isProfile: true },
  ];

  const handleNav = (tabId: string) => {
    setActiveTab(tabId as AppTab);
    navigate('/' + tabId);
    setShowMoreMenu(false);
  };

  return (
    <div className="h-full bg-white dark:bg-gray-950 px-4 py-10 flex flex-col border-r border-gray-100 dark:border-gray-800 transition-all duration-300 relative shadow-sm">
      <div className="mb-14 px-3 flex items-center gap-4 cursor-pointer group" onClick={() => handleNav('feed')}>
        <Logo size={42} className="group-hover:rotate-[360deg] transition-all duration-700" />
        <span className="lost-style text-xl xl:text-2xl tracking-[0.15em] text-gradient hidden xl:block">
          W.WIDE
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {menuItems.map((item, idx) => (
          <button
            key={`${item.label}-${idx}`}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-gray-900 group active:scale-90 ${
              activeTab === item.id ? 'font-black bg-pink-50/50 dark:bg-pink-900/10 shadow-sm' : 'font-medium'
            }`}
          >
            {item.isProfile ? (
              <div className={`w-7 h-7 rounded-xl border-2 overflow-hidden transition-all group-hover:scale-110 ${activeTab === 'profile' ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
              </div>
            ) : (
              <svg className={`w-7 h-7 transition-all group-hover:scale-110 group-hover:rotate-3 ${activeTab === item.id ? 'text-pink-500 stroke-[3px]' : 'text-gray-400 dark:text-gray-500 stroke-[2px]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            )}
            <span className={`text-base hidden xl:block transition-colors uppercase tracking-tight ${activeTab === item.id ? 'text-pink-600' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Account Switcher Section */}
      <div className="mt-6 mb-2 border-t border-gray-50 dark:border-gray-800 pt-6">
        <button 
          onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
          className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-2xl transition-all group"
        >
          <div className="relative">
            <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border-2 border-pink-500" alt="" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full"></div>
          </div>
          <div className="hidden xl:block text-left flex-1 min-w-0">
            <p className="font-black text-xs text-gray-900 dark:text-white truncate">@{user.username}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active Node</p>
          </div>
          <svg className={`hidden xl:block w-4 h-4 text-gray-400 transition-transform ${showAccountSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
        </button>

        {showAccountSwitcher && (
          <div className="absolute bottom-32 left-4 right-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-2 animate-in slide-in-from-bottom-2 z-50">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 p-3 mb-1">Switch Node</p>
            <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
              {allUsers.filter(u => u.id !== user.id).map(u => (
                <button 
                  key={u.id}
                  onClick={() => { onSwitchAccount(u.id); setShowAccountSwitcher(false); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-left group"
                >
                  <img src={u.avatar} className="w-8 h-8 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                  <span className="font-bold text-xs text-gray-700 dark:text-gray-300">@{u.username}</span>
                </button>
              ))}
              <button 
                onClick={() => { onAddAccount(); setShowAccountSwitcher(false); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-2xl transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span className="font-black text-[10px] text-pink-500 uppercase tracking-widest">Add Node</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 relative">
        {showMoreMenu && (
          <div className="absolute bottom-full left-0 mb-6 w-64 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 p-3 animate-in slide-in-from-bottom-5 duration-300 z-50">
             <button onClick={() => handleNav('settings')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-left group">
                <div className="p-2.5 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-pink-500 group-hover:rotate-45 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></div>
                <span className="text-[11px] font-black uppercase tracking-widest dark:text-white">Config Node</span>
             </button>
             <button onClick={() => handleNav('dashboard')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-left group">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></div>
                <span className="text-[11px] font-black uppercase tracking-widest dark:text-white">Activity Matrix</span>
             </button>
             <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-4"></div>
             <button onClick={() => navigate('/')} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all text-left text-red-500 group">
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 group-hover:-translate-x-1 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
                <span className="text-[11px] font-black uppercase tracking-widest">Disconnect</span>
             </button>
          </div>
        )}
        <button 
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="w-full flex items-center gap-5 px-5 py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all active:scale-95 border-2 border-transparent hover:border-pink-500/10"
        >
          <svg className="w-7 h-7 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <span className="text-base font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 hidden xl:block">Matrix Core</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
