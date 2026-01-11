
import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { User, AppTheme, AppTab, Post, Story, Notification, ThemeConfig } from './types';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Stories from './components/Stories';
import Chat from './components/Chat';
import LiveSession from './components/LiveSession';
import FlameAI from './components/FlameAI';
import AIStudioLab from './components/AIStudio';
import MediaLab from './components/MediaLab';
import Settings from './components/Settings';
import Explore from './components/Explore';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import Reels from './components/Reels';
import CameraCapture from './components/CameraCapture';
import StartupScreen from './components/StartupScreen';
import Dashboard from './components/Dashboard';
import PostDetail from './components/PostDetail';
import CallOverlay from './components/CallOverlay';

const { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } = ReactRouterDOM;

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Fixed: Made aistudio optional to ensure consistency with environmental global declarations and avoid "identical modifiers" errors.
    aistudio?: AIStudio;
  }
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#ec4899',
  secondaryColor: '#8b5cf6',
  borderRadius: '3xl',
  glassIntensity: 0.1,
  fontFamily: 'space',
  mode: 'light'
};

const AppContent: React.FC<{
  user: User | null;
  allUsers: User[];
  setUser: (u: User | null) => void;
  onSwitchAccount: (userId: string) => void;
  onAddAccount: () => void;
  isNewUser: boolean;
  setIsNewUser: (b: boolean) => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  globalPosts: Post[];
  setGlobalPosts: (p: Post[]) => void;
  globalStories: Story[];
  setGlobalStories: (s: Story[]) => void;
  unreadNotifications: number;
  setUnreadNotifications: (n: number | ((prev: number) => number)) => void;
  setShowStoryCamera: (b: boolean) => void;
  setIsCreateOpen: (b: boolean) => void;
  isCreateOpen: boolean;
  handleGenerateAIPost: () => void;
  handleLogout: (userId?: string) => void;
  handleLogin: (u: User, b?: boolean) => void;
  handleOnboardingComplete: (u: User) => void;
  calculateHealth: (u: Partial<User>) => number;
  incomingCall: any | null;
  setIncomingCall: (call: any | null) => void;
}> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTab = (location.pathname.split('/')[1] || 'feed') as AppTab;
  const setActiveTab = (tab: AppTab) => navigate('/' + tab);

  const currentThemeConfig = useMemo(() => {
    return props.user?.themeConfig || DEFAULT_THEME;
  }, [props.user?.themeConfig]);

  // Inject CSS Variables for Global Theme Customization
  useEffect(() => {
    const root = document.documentElement;
    const config = currentThemeConfig;
    
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    root.style.setProperty('--app-radius', config.borderRadius === 'full' ? '9999px' : config.borderRadius === '3xl' ? '3rem' : config.borderRadius === 'xl' ? '1.5rem' : config.borderRadius === 'md' ? '0.75rem' : '0');
    root.style.setProperty('--glass-opacity', config.glassIntensity.toString());
    
    // Mode handling
    if (config.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Font family mapping
    const fontMap: Record<string, string> = {
      'space': "'Space Grotesk', sans-serif",
      'syne': "'Syne', sans-serif",
      'serif': "'Playfair Display', serif",
      'mono': "'JetBrains Mono', monospace"
    };
    root.style.setProperty('--app-font', fontMap[config.fontFamily] || fontMap['space']);
    
    // Update theme color meta
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute('content', config.primaryColor);
  }, [currentThemeConfig]);

  if (!props.user) {
    return <Auth onLogin={props.handleLogin} />;
  }

  if (props.isNewUser) {
    return <Onboarding user={props.user} allUsers={props.allUsers} onComplete={props.handleOnboardingComplete} />;
  }

  return (
    <div className={`min-h-screen theme-transition bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20 lg:pb-0`} style={{ fontFamily: 'var(--app-font)' }}>
      {props.incomingCall && (
        <CallOverlay 
          type="video" 
          contact={props.incomingCall} 
          onClose={() => props.setIncomingCall(null)} 
        />
      )}

      <div className="lg:hidden">
        <Navbar 
          user={props.user} 
          allUsers={props.allUsers}
          posts={props.globalPosts}
          onSwitchAccount={props.onSwitchAccount}
          onAddAccount={props.onAddAccount}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          themeColor={`bg-[var(--primary-color)]`} 
        />
      </div>
      
      <main className="max-w-[1440px] mx-auto min-h-screen">
        <div className="flex flex-col lg:flex-row h-full">
          <aside className="hidden lg:block w-[72px] xl:w-64 fixed h-screen z-50">
            <Sidebar 
              user={props.user} 
              allUsers={props.allUsers}
              onSwitchAccount={props.onSwitchAccount}
              onAddAccount={props.onAddAccount}
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </aside>

          <section className="flex-1 lg:ml-[72px] xl:ml-64 py-4 sm:py-6 pt-16 sm:pt-20 lg:pt-0 page-transition">
            <div className="max-w-[935px] mx-auto px-4 sm:px-0">
              <div className="hidden lg:block mb-8">
                 <Navbar 
                  user={props.user} 
                  allUsers={props.allUsers}
                  posts={props.globalPosts}
                  onSwitchAccount={props.onSwitchAccount}
                  onAddAccount={props.onAddAccount}
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  themeColor={`bg-[var(--primary-color)]`} 
                />
              </div>
              <Routes>
                <Route path="/" element={<Navigate to="/feed" replace />} />
                <Route path="/feed" element={
                  <div className="space-y-6 max-w-[630px] mx-auto">
                    <div className="py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                      <Stories user={props.user} stories={props.globalStories} onAddStory={() => props.setShowStoryCamera(true)} />
                    </div>
                    <Feed 
                      themeColor={`bg-[var(--primary-color)]`} 
                      user={props.user} 
                      posts={props.globalPosts} 
                      onPostUpdate={(newPosts) => props.setGlobalPosts(newPosts)} 
                    />
                  </div>
                } />
                <Route path="/post/:postId" element={
                  <PostDetail 
                    user={props.user} 
                    posts={props.globalPosts} 
                    onPostUpdate={(newPosts) => props.setGlobalPosts(newPosts)}
                  />
                } />
                <Route path="/explore" element={<Explore />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/chat" element={<Chat user={props.user} />} />
                <Route path="/notifications" element={<Notifications onRead={() => props.setUnreadNotifications(0)} />} />
                <Route path="/live" element={<LiveSession user={props.user} />} />
                <Route path="/ai" element={<FlameAI themeColor={`bg-[var(--primary-color)]`} />} />
                <Route path="/ai-studio" element={<AIStudioLab />} />
                <Route path="/media-lab" element={<MediaLab />} />
                <Route path="/dashboard" element={<Dashboard user={props.user} />} />
                <Route path="/profile" element={
                  <Profile 
                    user={props.user} 
                    onEdit={() => setActiveTab('settings')} 
                    setActiveTab={setActiveTab}
                  />
                } />
                <Route path="/settings" element={
                  <Settings 
                    user={props.user} 
                    onLogout={() => props.handleLogout()} 
                    theme={props.theme} 
                    onThemeChange={props.setTheme} 
                    onUpdateUser={(u) => props.setUser({...u, profileHealth: props.calculateHealth(u)})}
                    onAddAccount={props.onAddAccount}
                  />
                } />
              </Routes>
            </div>
          </section>

          {(activeTab === 'feed' || activeTab === 'dashboard') && (
            <aside className="hidden lg:block w-[320px] pt-24 pr-4 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={props.user.avatar} className="w-11 h-11 rounded-full object-cover" alt="Me" />
                  <div>
                    <p className="text-sm font-bold">@{props.user.username}</p>
                    <p className="text-sm text-gray-500">{props.user.displayName}</p>
                  </div>
                </div>
                <button onClick={props.onAddAccount} className="text-xs font-bold text-blue-500 hover:text-blue-600">Switch</button>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg space-y-3" style={{ borderRadius: 'var(--app-radius)' }}>
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  Flame Advanced Lab
                </h4>
                <p className="text-[10px] leading-tight opacity-90">Access Veo 3 Video Gen, Nano Banana Pro Image Gen, and Audio Synthesis in the AI Studio.</p>
                <button 
                  onClick={() => setActiveTab('ai-studio')}
                  className="w-full py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Enter Lab
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-gray-500">Suggested for you</p>
                  <button className="text-xs font-bold">See All</button>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                      <div>
                        <p className="text-xs font-bold">suggested_user_{i}</p>
                        <p className="text-[10px] text-gray-500">Followed by flame_ai + 2 more</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-blue-500 hover:text-blue-600">Follow</button>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Floating AI Action */}
      <div className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-[60]">
        <button 
          onClick={() => setActiveTab('ai')}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl hover:scale-110 active:scale-90 transition-all duration-300 ring-4 ring-white dark:ring-gray-950"
          style={{ background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))` }}
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {props.unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 animate-bounce">
              {props.unreadNotifications}
            </span>
          )}
        </button>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-3xl border-t border-gray-100 dark:border-gray-800 px-2 py-1.5 pb-safe-area flex justify-between items-center z-50 shadow-lg">
        <button onClick={() => setActiveTab('feed')} className={`p-3 transition-all ${activeTab === 'feed' ? 'text-[var(--primary-color)] scale-110' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill={activeTab === 'feed' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <button onClick={() => setActiveTab('ai-studio')} className={`p-3 transition-all ${activeTab === 'ai-studio' ? 'text-violet-500 scale-110' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill={activeTab === 'ai-studio' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.726 2.178a2 2 0 01-3.793 0l-.726-2.178a2 2 0 00-1.96-1.414l-2.387.477a2 2 0 00-1.022.547l-1.428 1.428a2 2 11-2.828-2.828l1.428-1.428a2 2 0 00.547-1.022l.477-2.387a2 2 0 00-1.414-1.96L4.12 9.043a2 2 110-3.793l2.178-.726a2 2 0 001.414-1.96l.477-2.387a2 2 0 00.547-1.022L10.164.547a2 2 112.828 2.828L11.564 4.803a2 2 0 00-.547 1.022l-.477 2.387a2 2 0 001.414 1.96l2.178.726a2 2 110 3.793l-2.178.726a2 2 0 00-1.414-1.96l-.477 2.387a2 2 0 00.547-1.022l1.428 1.428a2 2 11-2.828-2.828l-1.428-1.428z" /></svg>
        </button>
        
        <button onClick={() => props.setIsCreateOpen(true)} className="relative -mt-8 mx-1">
          <div className="p-3.5 rounded-2xl shadow-lg text-white ring-4 ring-white dark:ring-gray-950 transition-all active:scale-90" style={{ background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))`, borderRadius: 'var(--app-radius)' }}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>

        <button onClick={() => setActiveTab('media-lab')} className={`p-3 transition-all ${activeTab === 'media-lab' ? 'text-indigo-500 scale-110' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill={activeTab === 'media-lab' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </button>

        <button onClick={() => setActiveTab('profile')} className={`p-3 transition-all ${activeTab === 'profile' ? 'scale-110' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 rounded-full border-2 overflow-hidden ${activeTab === 'profile' ? 'border-[var(--primary-color)]' : 'border-transparent'}`}>
            <img src={props.user.avatar} className="w-full h-full object-cover" alt="Me" />
          </div>
        </button>
      </nav>

      {props.isCreateOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => props.setIsCreateOpen(false)}>
          <div className="max-w-xs w-full bg-white dark:bg-gray-900 rounded-[2rem] p-8 space-y-4 shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()} style={{ borderRadius: 'var(--app-radius)' }}>
            <div className="text-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-wider mb-1">Create Hub</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Select your signal type</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              <button onClick={() => { setActiveTab('feed'); props.setIsCreateOpen(false); }} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-pink-50 dark:hover:bg-gray-700 transition-all group">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-xl group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                <div className="text-left"><p className="font-black text-[10px] uppercase tracking-wider">Broadcast Signal</p></div>
              </button>

              <button onClick={() => { setActiveTab('ai-studio'); props.setIsCreateOpen(false); }} className="flex items-center gap-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all group border border-violet-100 dark:border-violet-900/40">
                <div className="p-3 bg-violet-500 text-white rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-violet-500/30"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                <div className="text-left"><p className="font-black text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400">AI Studio Lab</p></div>
              </button>

              <button onClick={() => { props.setShowStoryCamera(true); props.setIsCreateOpen(false); }} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-purple-50 dark:hover:bg-gray-700 transition-all group">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-xl group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg></div>
                <div className="text-left"><p className="font-black text-[10px] uppercase tracking-wider">New Story</p></div>
              </button>

              <button onClick={() => { setActiveTab('live'); props.setIsCreateOpen(false); }} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-red-50 dark:hover:bg-gray-700 transition-all group">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
                <div className="text-left"><p className="font-black text-[10px] uppercase tracking-wider">Go Live</p></div>
              </button>
            </div>
            <button onClick={() => props.setIsCreateOpen(false)} className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[var(--primary-color)] transition-colors">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [theme, setTheme] = useState<AppTheme>('purple');
  const [globalPosts, setGlobalPosts] = useState<Post[]>([]);
  const [globalStories, setGlobalStories] = useState<Story[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showStoryCamera, setShowStoryCamera] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem('ww-accounts');
    const savedActiveId = localStorage.getItem('ww-active-account-id');
    
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      setAllUsers(parsed);
      if (savedActiveId) {
        const active = parsed.find((u: User) => u.id === savedActiveId);
        if (active) setActiveUser(active);
      }
    }
    
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (allUsers.length > 0) {
      localStorage.setItem('ww-accounts', JSON.stringify(allUsers));
    }
    if (activeUser) {
      localStorage.setItem('ww-active-account-id', activeUser.id);
    }
  }, [allUsers, activeUser]);

  const calculateHealth = (u: Partial<User>) => {
    let health = 0;
    if (u.avatar) health += 25;
    if (u.bio) health += 25;
    if (u.displayName) health += 25;
    if (u.status) health += 25;
    return health;
  };

  const handleLogin = (u: User, isNew: boolean = false) => {
    const finalUser = { ...u, profileHealth: calculateHealth(u), themeConfig: u.themeConfig || DEFAULT_THEME };
    const exists = allUsers.find(au => au.id === u.id);
    
    if (!exists) {
      setAllUsers(prev => [...prev, finalUser]);
    }
    setActiveUser(finalUser);
    setIsNewUser(isNew);
  };

  const handleSwitchAccount = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setIsSwitching(true);
      setTimeout(() => {
        setActiveUser(target);
        setIsSwitching(false);
      }, 1000);
    }
  };

  const handleAddAccount = () => {
    setActiveUser(null);
    setIsNewUser(false);
  };

  const handleLogout = (userId?: string) => {
    const targetId = userId || activeUser?.id;
    const remaining = allUsers.filter(u => u.id !== targetId);
    setAllUsers(remaining);
    
    if (remaining.length > 0) {
      setActiveUser(remaining[0]);
    } else {
      setActiveUser(null);
      localStorage.removeItem('ww-accounts');
      localStorage.removeItem('ww-active-account-id');
    }
  };

  const handleOnboardingComplete = (u: User) => {
    const updated = { ...u, profileHealth: calculateHealth(u) };
    setAllUsers(prev => {
        const conflict = prev.some(au => au.id !== u.id && au.username === u.username);
        if (conflict) {
            u.username = u.username + '_' + Math.floor(Math.random() * 1000);
        }
        return prev.map(au => au.id === u.id ? { ...u, profileHealth: calculateHealth(u) } : au);
    });
    setActiveUser(updated);
    setIsNewUser(false);
  };

  if (isLoading) {
    return <StartupScreen />;
  }

  if (isSwitching) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white dark:bg-gray-950 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 animate-pulse">Switching Neural Node...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <AppContent 
        user={activeUser}
        allUsers={allUsers}
        setUser={setActiveUser}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={handleAddAccount}
        isNewUser={isNewUser}
        setIsNewUser={setIsNewUser}
        theme={theme}
        setTheme={setTheme}
        globalPosts={globalPosts}
        setGlobalPosts={setGlobalPosts}
        globalStories={globalStories}
        setGlobalStories={setGlobalStories}
        unreadNotifications={unreadNotifications}
        setUnreadNotifications={setUnreadNotifications}
        setIsCreateOpen={setIsCreateOpen}
        isCreateOpen={isCreateOpen}
        setShowStoryCamera={setShowStoryCamera}
        handleGenerateAIPost={() => {}}
        handleLogout={handleLogout}
        handleLogin={handleLogin}
        handleOnboardingComplete={handleOnboardingComplete}
        calculateHealth={calculateHealth}
        incomingCall={incomingCall}
        setIncomingCall={setIncomingCall}
      />
      {showStoryCamera && (
        <CameraCapture 
          onCapture={(data) => {
            const newStory: Story = {
              id: Date.now().toString(),
              userId: activeUser?.id || 'me',
              username: activeUser?.username || 'Me',
              userAvatar: activeUser?.avatar || '',
              image: data,
              seen: false
            };
            setGlobalStories([newStory, ...globalStories]);
            setShowStoryCamera(false);
          }}
          onClose={() => setShowStoryCamera(false)}
        />
      )}
    </HashRouter>
  );
};

export default App;
