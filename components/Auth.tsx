
import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: User, isNew: boolean) => void;
}

const allCountries = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
];

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'landing' | 'phone' | 'otp'>('landing');
  const [isCreating, setIsCreating] = useState(false);
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(allCountries[0]);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const filteredCountries = useMemo(() => {
    return allCountries.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
      c.code.includes(countrySearch)
    );
  }, [countrySearch]);

  const startAuth = (creating: boolean) => {
    setIsCreating(creating);
    setStep('phone');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 7) return;
    setLoading(true);
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
      setTimer(60);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      const isNew = isCreating; 
      const mockUser: User = {
        id: 'u' + Date.now(),
        username: isNew ? 'user_' + Math.floor(Math.random() * 999) : 'alex_worldwide',
        displayName: isNew ? 'New Member' : 'Alex Worldwide',
        avatar: `https://picsum.photos/seed/${phone}/200`,
        bio: isNew ? '' : 'Connecting the world, one post at a time.',
        isLoggedIn: true,
        followers: 0,
        following: 0,
        postsCount: 0,
        profileHealth: 0
      };
      onLogin(mockUser, isNew);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[100px] opacity-60"></div>

      <div className="max-w-md w-full relative z-10 flex flex-col items-center">
        <div className="mb-12 text-center animate-float">
          <Logo size={160} className="mx-auto" />
          <p className="mt-6 text-[10px] font-black tracking-[0.6em] uppercase text-gray-300">Global Universal Node</p>
        </div>

        <div className="w-full bg-white/40 backdrop-blur-3xl border border-white/60 p-10 rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(236,72,153,0.1)] transition-all duration-700">
          {step === 'landing' && (
            <div className="space-y-6 page-transition">
              <button
                onClick={() => startAuth(true)}
                className="w-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-xl shadow-pink-200 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Create Global Account
              </button>
              <button
                onClick={() => startAuth(false)}
                className="w-full py-6 bg-white border-2 border-pink-50 text-pink-500 rounded-3xl font-black text-sm tracking-widest uppercase hover:bg-pink-50 transition-all active:scale-95"
              >
                Access Existing Node
              </button>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-8 page-transition">
              <div className="space-y-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-pink-500 ml-4">
                  {isCreating ? 'Global Registration' : 'Secure Login'}
                </label>
                
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryList(!showCountryList)}
                      className="w-full flex items-center justify-between px-8 py-6 bg-white/80 border border-gray-100 rounded-3xl hover:border-pink-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{selectedCountry.flag}</span>
                        <span className="font-black text-gray-700 tracking-tight">{selectedCountry.name}</span>
                      </div>
                      <span className="text-pink-500 font-black">{selectedCountry.code}</span>
                    </button>

                    {showCountryList && (
                      <div className="absolute bottom-full left-0 right-0 mb-4 bg-white/95 backdrop-blur-3xl border border-gray-100 rounded-[2.5rem] shadow-2xl max-h-96 overflow-hidden z-50 animate-in fade-in zoom-in duration-300 flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                          <input 
                            type="text"
                            placeholder="Search countries..."
                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-pink-500"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              className="w-full flex items-center gap-5 px-6 py-4 hover:bg-pink-50 rounded-2xl transition-all text-left group"
                              onClick={() => {
                                setSelectedCountry(c);
                                setShowCountryList(false);
                                setCountrySearch('');
                              }}
                            >
                              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{c.flag}</span>
                              <span className="flex-1 font-black text-gray-700 text-sm">{c.name}</span>
                              <span className="text-pink-400 font-black text-xs">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number"
                    className="w-full px-10 py-6 bg-white/80 border border-gray-100 rounded-3xl focus:border-pink-500 focus:ring-8 focus:ring-pink-500/5 outline-none transition-all text-2xl font-black text-gray-800 placeholder-gray-200"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-7 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-black text-xl shadow-[0_30px_60px_-10px_rgba(236,72,153,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Verify Node'}
              </button>
              <button
                type="button"
                onClick={() => setStep('landing')}
                className="w-full text-gray-300 font-black text-[10px] hover:text-pink-500 transition-all uppercase tracking-[0.4em]"
              >
                Go Back
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-10 page-transition">
              <div className="text-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-pink-500">Decryption Key</label>
                <p className="text-gray-400 font-bold text-xs mt-3">Code transmitted to {selectedCountry.code}{phone}</p>
                {timer > 0 ? (
                  <p className="text-pink-400 font-bold text-[10px] mt-1">Resend in {timer}s</p>
                ) : (
                  <button type="button" onClick={() => setTimer(60)} className="text-pink-500 font-black text-[10px] mt-1 underline">Resend Code</button>
                )}
              </div>
              
              <input
                type="text"
                required
                maxLength={6}
                placeholder="0 0 0 0"
                className="w-full px-4 py-10 bg-white/80 border border-gray-100 rounded-[2.5rem] text-center text-5xl tracking-[0.6em] focus:border-purple-500 focus:ring-8 focus:ring-purple-500/5 outline-none transition-all font-black text-purple-600 placeholder-gray-100"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />

              <div className="flex flex-col gap-6">
                <button
                  disabled={loading}
                  className="w-full py-7 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-3xl font-black text-2xl shadow-[0_30px_60px_-10px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Decrypting...' : 'Enter World'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-gray-300 font-black text-[11px] hover:text-pink-500 transition-all uppercase tracking-[0.4em]"
                >
                  Change Terminal
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-16 text-center text-[10px] font-black uppercase tracking-[0.6em] text-gray-200">
          WW Protocol v6.0 • Global Universal
        </div>
      </div>
    </div>
  );
};

export default Auth;
