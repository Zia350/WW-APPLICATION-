
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface OnboardingProps {
  user: User;
  allUsers: User[];
  onComplete: (updatedUser: User) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ user, allUsers, onComplete }) => {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user.avatar);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    notifications: false
  });

  // Sync username with display name initially, but let user edit it
  useEffect(() => {
    if (displayName && !username.startsWith('user_')) {
        const derived = displayName.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
        if (derived.length > 2) setUsername(derived);
    }
  }, [displayName]);

  // Validate username uniqueness
  useEffect(() => {
    const conflict = allUsers.some(u => u.id !== user.id && u.username.toLowerCase() === username.toLowerCase());
    setIsUsernameTaken(conflict);
  }, [username, allUsers, user.id]);

  const handleNext = () => {
    if (isUsernameTaken && step === 1) return;
    
    if (step < 3) setStep(step + 1);
    else {
      onComplete({
        ...user,
        displayName,
        bio,
        avatar,
        username: username || user.username
      });
    }
  };

  const requestPermission = async (type: 'camera' | 'microphone' | 'notifications') => {
    try {
      if (type === 'notifications') {
        const result = await Notification.requestPermission();
        if (result === 'granted') setPermissions(p => ({ ...p, notifications: true }));
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ [type === 'camera' ? 'video' : 'audio']: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissions(p => ({ ...p, [type]: true }));
      }
    } catch (e) {
      console.warn('Permission denied:', type);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-50 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-50 rounded-full blur-[120px]"></div>
      
      <div className="max-w-md w-full bg-white/60 backdrop-blur-3xl rounded-[3rem] p-10 border border-white shadow-[0_50px_100px_rgba(236,72,153,0.1)] relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${step === i ? 'w-12 bg-pink-500' : 'w-2 bg-pink-100'}`}></div>
            ))}
          </div>
          <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Protocol {step}/3</span>
        </div>

        {step === 1 && (
          <div className="space-y-10 page-transition">
            <div>
              <h2 className="text-4xl font-syne font-extrabold text-gray-900 tracking-tight mb-3">Identity</h2>
              <p className="text-gray-400 font-medium leading-relaxed">Let the world recognize your arrival.</p>
            </div>
            
            <div className="flex flex-col items-center gap-8 py-4">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity rounded-full"></div>
                <img src={avatar} className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500" alt="Preview" />
                <div className="absolute bottom-1 right-1 bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full text-white border-4 border-white z-20 shadow-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </div>
              </div>
              
              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:border-pink-500 outline-none font-bold text-gray-800 transition-all shadow-sm"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="The Nomad"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-4 ${isUsernameTaken ? 'text-red-500' : 'text-purple-400'}`}>
                    {isUsernameTaken ? 'Neural handle already claimed' : 'Unique Node Username'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">@</span>
                    <input 
                      type="text" 
                      className={`w-full pl-12 pr-8 py-5 bg-white border rounded-2xl outline-none font-bold transition-all shadow-sm ${isUsernameTaken ? 'border-red-500 text-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-gray-100 focus:border-purple-500 text-gray-800'}`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                    />
                  </div>
                  {isUsernameTaken && (
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-4 mt-2 animate-pulse">
                      This frequency is occupied. Recalibrate handle.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 page-transition">
            <div>
              <h2 className="text-4xl font-syne font-extrabold text-gray-900 tracking-tight mb-3">The Bio</h2>
              <p className="text-gray-400 font-medium leading-relaxed">What message are you broadcasting?</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-4">Magic Status</label>
              <textarea 
                className="w-full h-44 px-8 py-6 bg-white border border-gray-100 rounded-[2rem] focus:border-purple-500 outline-none font-medium text-gray-800 transition-all resize-none shadow-sm"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Exploring the pink clouds of the Worldwide network..."
              ></textarea>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 page-transition">
            <div>
              <h2 className="text-4xl font-syne font-extrabold text-gray-900 tracking-tight mb-3">Nodes</h2>
              <p className="text-gray-400 font-medium leading-relaxed">Power up your hardware for the full experience.</p>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'camera', label: 'Magic Lens', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                { id: 'microphone', label: 'Sonic Core', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
                { id: 'notifications', label: 'Signal Pings', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' }
              ].map(perm => (
                <button 
                  key={perm.id}
                  onClick={() => requestPermission(perm.id as any)}
                  className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${permissions[perm.id as keyof typeof permissions] ? 'border-pink-500 bg-pink-50/50 text-pink-600 shadow-lg shadow-pink-100' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-pink-100 text-gray-400'}`}
                >
                  <div className="flex items-center gap-5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={perm.icon} /></svg>
                    <span className="font-black text-xs uppercase tracking-widest">{perm.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${permissions[perm.id as keyof typeof permissions] ? 'bg-pink-500 border-pink-500' : 'border-gray-200'}`}>
                    {permissions[perm.id as keyof typeof permissions] && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={handleNext}
          disabled={isUsernameTaken && step === 1}
          className={`w-full mt-12 py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-2xl shadow-pink-200 transition-all ${isUsernameTaken && step === 1 ? 'opacity-30 cursor-not-allowed scale-95 grayscale' : 'hover:scale-[1.02] active:scale-95'}`}
        >
          {step === 3 ? 'Initiate Node' : 'Proceed'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
