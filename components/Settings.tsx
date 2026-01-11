
import React, { useState, useRef, useEffect } from 'react';
import { User, AppTheme, ProfileFont, ThemeConfig } from '../types';

interface SettingsProps {
  user: User;
  onLogout: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onUpdateUser: (updatedUser: User) => void;
  onAddAccount: () => void;
}

const PRESETS: Record<string, Partial<ThemeConfig>> = {
  'Cyberpunk': { primaryColor: '#00fff2', secondaryColor: '#ff00ff', borderRadius: 'none', mode: 'dark', fontFamily: 'mono' },
  'Minimalist': { primaryColor: '#000000', secondaryColor: '#666666', borderRadius: 'md', mode: 'light', fontFamily: 'serif' },
  'Ethereal': { primaryColor: '#fce7f3', secondaryColor: '#818cf8', borderRadius: 'full', mode: 'light', fontFamily: 'syne' },
  'Classic WW': { primaryColor: '#ec4899', secondaryColor: '#8b5cf6', borderRadius: '3xl', mode: 'light', fontFamily: 'space' }
};

const Settings: React.FC<SettingsProps> = ({ user, onLogout, theme, onThemeChange, onUpdateUser, onAddAccount }) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'notifications' | 'privacy' | 'theme' | 'accounts' | 'customizer'>('profile');
  
  // Profile state
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [status, setStatus] = useState(user.status || '');
  const [avatar, setAvatar] = useState(user.avatar);
  
  // Theme state
  const [config, setConfig] = useState<ThemeConfig>(user.themeConfig || {
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    borderRadius: '3xl',
    glassIntensity: 0.1,
    fontFamily: 'space',
    mode: 'light'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateUser({
      ...user,
      displayName,
      bio,
      status,
      avatar,
      themeConfig: config
    });
    alert('Global Node Synchronized.');
  };

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const applyPreset = (name: string) => {
    const preset = PRESETS[name];
    updateConfig(preset as ThemeConfig);
  };

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-3xl rounded-[var(--app-radius)] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Sub Nav */}
        <div className="w-full lg:w-64 border-r border-black/5 dark:border-white/5 bg-gray-50/30 p-8 space-y-4">
          <h2 className="text-xl font-black uppercase tracking-widest mb-8" style={{ color: 'var(--primary-color)' }}>Node Config</h2>
          {[
            { id: 'profile', label: 'Identity', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'customizer', label: 'Visual Engine', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
            { id: 'notifications', label: 'Signals', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
            { id: 'accounts', label: 'Multi-Node', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeSubTab === item.id ? 'bg-white dark:bg-gray-800 shadow-md' : 'text-gray-400'}`}
              style={{ color: activeSubTab === item.id ? 'var(--primary-color)' : '' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
          <div className="pt-20">
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Disconnect Node
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto max-h-[700px] no-scrollbar">
          {activeSubTab === 'profile' && (
            <div className="space-y-8 page-transition">
              <div>
                <h3 className="text-3xl font-syne font-black tracking-tighter">Identity Core</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Update your hardware signature</p>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: 'var(--primary-color)' }}></div>
                  <img src={avatar} className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-2xl relative z-10" alt="Identity" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 z-20 text-white p-2.5 rounded-full border-4 border-white dark:border-gray-800 shadow-xl hover:scale-110 transition-transform"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4" style={{ color: 'var(--primary-color)' }}>Display Alias</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-black/5 dark:border-white/5 rounded-2xl outline-none font-bold transition-all focus:border-[var(--primary-color)]"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4" style={{ color: 'var(--primary-color)' }}>Neural Bio</label>
                  <textarea 
                    className="w-full h-32 px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-black/5 dark:border-white/5 rounded-3xl outline-none font-medium transition-all focus:border-[var(--primary-color)] resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-6 text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}
                >
                  Synchronize Identity
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'customizer' && (
            <div className="space-y-10 page-transition">
              <div>
                <h3 className="text-3xl font-syne font-black tracking-tighter">Visual Engine</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Personalize your neural interface</p>
              </div>

              {/* Preset Section */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Engine Presets</label>
                 <div className="grid grid-cols-2 gap-3">
                   {Object.keys(PRESETS).map(name => (
                     <button key={name} onClick={() => applyPreset(name)} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-black/5 hover:border-[var(--primary-color)] transition-all text-left group">
                       <p className="text-[10px] font-black uppercase mb-1">{name}</p>
                       <div className="flex gap-1">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRESETS[name].primaryColor }}></div>
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRESETS[name].secondaryColor }}></div>
                       </div>
                     </button>
                   ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Color Pickers */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-between px-2">
                      Primary Signal
                      <span className="text-[8px] font-mono">{config.primaryColor}</span>
                    </label>
                    <input 
                      type="color" 
                      value={config.primaryColor} 
                      onChange={e => updateConfig({ primaryColor: e.target.value })}
                      className="w-full h-14 rounded-2xl cursor-pointer bg-transparent border-none overflow-hidden"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-between px-2">
                      Secondary Signal
                      <span className="text-[8px] font-mono">{config.secondaryColor}</span>
                    </label>
                    <input 
                      type="color" 
                      value={config.secondaryColor} 
                      onChange={e => updateConfig({ secondaryColor: e.target.value })}
                      className="w-full h-14 rounded-2xl cursor-pointer bg-transparent border-none overflow-hidden"
                    />
                  </div>
                </div>

                {/* Sliders and Mode */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Grid Curvature</label>
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl gap-1">
                      {(['none', 'md', 'xl', '3xl', 'full'] as const).map(r => (
                        <button key={r} onClick={() => updateConfig({ borderRadius: r })} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-xl transition-all ${config.borderRadius === r ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Interface Mode</label>
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl gap-1">
                      {(['light', 'dark'] as const).map(m => (
                        <button key={m} onClick={() => updateConfig({ mode: m })} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-xl transition-all ${config.mode === m ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Neural Glass Intensity</label>
                <input 
                  type="range" min="0" max="0.5" step="0.05" 
                  value={config.glassIntensity} 
                  onChange={e => updateConfig({ glassIntensity: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
                />
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-black/5 flex flex-col items-center gap-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Engine Preview</p>
                 <div className="w-full max-w-xs p-6 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl flex items-center gap-4" style={{ borderRadius: 'var(--app-radius)' }}>
                    <div className="w-12 h-12 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}></div>
                    <div>
                      <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                      <div className="h-2 w-16 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-6 text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-xl transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}
              >
                Apply System Visuals
              </button>
            </div>
          )}

          {activeSubTab === 'accounts' && (
            <div className="space-y-12 page-transition">
               <div>
                <h3 className="text-3xl font-syne font-black tracking-tighter">Multi-Node</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Manage identity nodes</p>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2.5rem] border border-black/5">
                   <div className="flex items-center gap-4">
                      <img src={user.avatar} className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg" alt="" />
                      <div>
                        <h4 className="font-black text-lg leading-tight">@{user.username}</h4>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Active Node</p>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={onAddAccount}
                  className="w-full flex items-center justify-center gap-4 p-8 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-900/40 rounded-[var(--app-radius)] text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                >
                  Inject New Identity Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
