
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, MessageType, ChatTheme, LocationData } from '../types';
import { GoogleGenAI } from '@google/genai';
import CallOverlay from './CallOverlay';
import Logo from './Logo';
import CameraCapture from './CameraCapture';

interface ChatProps {
  user: User;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ChatTheme>('default');
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video', contact: any } | null>(null);
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const liveShareIntervalRef = useRef<number | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Camera Integration for Chat
  const [showChatCamera, setShowChatCamera] = useState(false);
  
  // Advanced Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);

  const contacts = [
    { id: 'c1', name: 'Jordan Miller', username: 'jordan_m', avatar: 'https://picsum.photos/seed/jordan/100/100', lastMsg: 'See you later!', time: '10:45 AM', status: 'online', unread: 2 },
    { id: 'c2', name: 'Sara Smith', username: 'sara_s', avatar: 'https://picsum.photos/seed/sara/100/100', lastMsg: 'Sent a video', time: 'Yesterday', status: 'offline', unread: 0 },
    { id: 'c3', name: 'Worldwide Hub', username: 'ww_official', avatar: 'https://picsum.photos/seed/world/100/100', lastMsg: 'New signal broadcasted', time: 'Monday', status: 'online', unread: 0 },
    { id: 'c4', name: 'Flame AI', username: 'flame_ai', avatar: 'https://picsum.photos/seed/flame/100/100', lastMsg: 'How can I help?', time: '09:12 AM', status: 'online', unread: 0 },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ww-chat-history');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [
      { id: 'm1', senderId: 'u2', text: 'Hey Alex! Did you see the new Flame AI update?', mediaType: 'text', timestamp: new Date(Date.now() - 3600000) },
      { id: 'm2', senderId: 'u2', text: 'It is super fast now. The Worldwide network is peaking!', mediaType: 'text', timestamp: new Date(Date.now() - 3590000) },
      { id: 'm3', senderId: user.id, text: 'Yeah, I just tried it out. Pretty impressive!', mediaType: 'text', timestamp: new Date(Date.now() - 3500000) },
    ];
  });

  useEffect(() => {
    localStorage.setItem('ww-chat-history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleGlobalShare = (e: any) => {
      const { type, payload, contactId } = e.detail;
      if (contactId) {
        setActiveChatId(contactId);
        handleSend(type, payload);
      }
    };
    window.addEventListener('ww-share-to-chat', handleGlobalShare);
    return () => window.removeEventListener('ww-share-to-chat', handleGlobalShare);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const editMediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeChatId]);

  const handleSend = async (type: MessageType = 'text', payload?: any) => {
    if (type === 'text' && !messageText.trim()) return;

    const userMessage = type === 'text' ? messageText : (payload?.text || '');
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      text: userMessage,
      mediaUrl: payload?.url || payload?.dataUrl,
      mediaType: type,
      locationData: payload?.locationData,
      sharedContentId: payload?.sharedContentId,
      sharedContentThumb: payload?.sharedContentThumb,
      sharedContentAuthor: payload?.sharedContentAuthor,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    if (type === 'text') setMessageText('');
    
    // AI Interaction with Search/Maps Grounding
    if (activeChatId === 'c4' || (Math.random() > 0.8)) {
       setIsTyping(true);
       try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         
         let userLocation: { latitude: number; longitude: number } | undefined;
         try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            userLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
         } catch (e) { }

         const response = await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: userMessage,
           config: {
             systemInstruction: `You are Flame AI, the intelligent node assistant for Worldwide. Use googleSearch and googleMaps grounding for accuracy. Be friendly and slightly high-tech.`,
             tools: [{ googleSearch: {} }, { googleMaps: {} }],
             toolConfig: userLocation ? { retrievalConfig: { latLng: userLocation } } : undefined
           }
         });
         
         setIsTyping(false);
         const reply: ChatMessage = {
           id: (Date.now() + 1).toString(),
           senderId: activeChatId === 'c4' ? 'c4' : 'u2',
           text: response.text || 'The neural grid is undergoing calibration. Stand by.',
           mediaType: 'text',
           timestamp: new Date()
         };
         setMessages(prev => [...prev, reply]);
       } catch (e) {
         setIsTyping(false);
       }
    }
  };

  const handleDeviceMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const type: MessageType = file.type.startsWith('video/') ? 'video' : 'image';
        handleSend(type, { url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Transcription Feature
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        transcribeAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setIsRecordingAudio(true);
    } catch (e) {
      alert("Mic access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingAudio(false);
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTyping(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: 'Transcribe this audio precisely.' },
              { inlineData: { data: base64, mimeType: 'audio/wav' } }
            ]
          }
        });
        if (response.text) setMessageText(response.text);
      };
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditConfirm = () => {
    if (!editingMessageId) return;
    setMessages(prev => prev.map(m => 
      m.id === editingMessageId 
        ? { ...m, text: editBuffer, isEdited: true } 
        : m
    ));
    setEditingMessageId(null);
    setEditBuffer('');
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    setContextMenuMsgId(null);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      handleSend('location', {
        locationData: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: 'Node Location',
          isSharing: false
        }
      });
    });
  };

  const themeStyles: Record<ChatTheme, { bg: string, bubble: string, text: string, wallpaper?: string }> = {
    default: { bg: 'bg-white dark:bg-gray-900', bubble: 'bg-gradient-to-r from-pink-500 to-purple-600', text: 'text-white', wallpaper: 'bg-gray-50 dark:bg-[#0b0e11]' },
    candy: { bg: 'bg-pink-50 dark:bg-pink-950', bubble: 'bg-gradient-to-r from-orange-400 to-pink-500', text: 'text-white', wallpaper: 'bg-[#fff5f8]' },
    cyber: { bg: 'bg-blue-50 dark:bg-blue-950', bubble: 'bg-gradient-to-r from-cyan-400 to-blue-600', text: 'text-white', wallpaper: 'bg-[#f0f9ff]' },
    lavender: { bg: 'bg-purple-50 dark:bg-purple-950', bubble: 'bg-gradient-to-r from-indigo-400 to-purple-500', text: 'text-white', wallpaper: 'bg-[#f9f5ff]' },
    midnight: { bg: 'bg-gray-900', bubble: 'bg-gradient-to-r from-gray-700 to-gray-900 border border-gray-600', text: 'text-white', wallpaper: 'bg-[#000000]' }
  };

  const activeContact = contacts.find(c => c.id === activeChatId);

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-white dark:bg-gray-950 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 relative">
      <input type="file" ref={mediaInputRef} onChange={handleDeviceMedia} className="hidden" accept="image/*,video/*" />
      <input type="file" ref={editMediaInputRef} onChange={() => {}} className="hidden" accept="image/*,video/*,audio/*" />
      
      {showChatCamera && (
        <CameraCapture 
          onCapture={(dataUrl, type) => {
            handleSend(type, { dataUrl });
            setShowChatCamera(false);
          }} 
          onClose={() => setShowChatCamera(false)} 
        />
      )}

      {activeCall && <CallOverlay type={activeCall.type} contact={activeCall.contact} onClose={() => setActiveCall(null)} />}

      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col`}>
        <div className="p-6">
          <h2 className="text-xl font-syne font-black dark:text-white uppercase tracking-tighter">Direct Nodes</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {contacts.map(c => (
            <div key={c.id} onClick={() => setActiveChatId(c.id)} className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${activeChatId === c.id ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
              <img src={c.avatar} className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-transparent hover:border-pink-500 transition-all" alt={c.name} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">@{c.username}</h4>
                <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative ${themeStyles[currentTheme].wallpaper}`}>
        {activeContact ? (
          <>
            <div className="z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 text-gray-900 dark:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg></button>
                <img src={activeContact.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Active" />
                <div>
                  <h3 className="font-black text-sm dark:text-gray-100 leading-tight">@{activeContact.username}</h3>
                  <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Active Node</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveCall({ type: 'audio', contact: activeContact })} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></button>
                <button onClick={() => setActiveCall({ type: 'video', contact: activeContact })} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
              </div>
            </div>

            <div ref={scrollRef} className="z-10 flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'} group relative`}>
                  <div 
                    onContextMenu={(e) => { e.preventDefault(); setContextMenuMsgId(m.id); }}
                    className={`relative max-w-[85%] p-3 px-5 rounded-[2rem] shadow-sm cursor-pointer transition-all ${
                    m.senderId === user.id 
                      ? `${themeStyles[currentTheme].bubble} ${themeStyles[currentTheme].text} rounded-br-lg` 
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-lg'
                  }`}>
                    {m.mediaType === 'image' && m.mediaUrl && (
                      <img src={m.mediaUrl} className="max-h-64 rounded-2xl mb-2 border border-white/10 shadow-lg" alt="Sent" />
                    )}
                    {m.mediaType === 'video' && m.mediaUrl && (
                      <video src={m.mediaUrl} className="max-h-64 rounded-2xl mb-2 border border-white/10 shadow-lg" controls />
                    )}
                    {m.mediaType === 'location' ? (
                       <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase">Shared Location</p>
                        <a href={`https://www.google.com/maps?q=${m.locationData?.latitude},${m.locationData?.longitude}`} target="_blank" className="block text-center py-2 bg-black/20 rounded-xl text-[9px] font-black uppercase">View Map</a>
                       </div>
                    ) : <p className="text-sm font-medium leading-relaxed">{m.text}</p>}
                    {m.isEdited && <span className="absolute bottom-1 right-3 text-[7px] opacity-60 uppercase font-black">Modified</span>}
                  </div>
                  
                  {contextMenuMsgId === m.id && m.senderId === user.id && (
                    <div className="absolute top-0 right-full mr-2 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-2 z-[100] border border-black/5 animate-in zoom-in duration-200">
                      <button onClick={() => { setEditingMessageId(m.id); setEditBuffer(m.text || ''); setContextMenuMsgId(null); }} className="block w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">Edit Signal</button>
                      <button onClick={() => deleteMessage(m.id)} className="block w-full text-left px-4 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg">Purge Node</button>
                      <button onClick={() => setContextMenuMsgId(null)} className="block w-full text-left px-4 py-2 text-[10px] font-black uppercase text-gray-400">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <div className="flex gap-1 animate-pulse px-4"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full delay-150"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full delay-300"></div></div>}
            </div>

            {editingMessageId && (
              <div className="bg-indigo-600 text-white px-6 py-2 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest">Editing Buffer</span>
                <button onClick={() => { setEditingMessageId(null); setEditBuffer(''); }} className="text-[10px] font-black uppercase">Discard</button>
              </div>
            )}

            <div className="z-20 p-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-1.5 pl-5 pr-1.5 flex items-center gap-2 shadow-2xl">
                <button 
                  onClick={() => setShowChatCamera(true)}
                  className="p-2 text-gray-400 hover:text-pink-500 transition-all hover:scale-110 active:scale-90"
                  title="Video Message"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
                
                <button 
                  onClick={() => mediaInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-90"
                  title="Upload Media"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>

                <button 
                  onMouseDown={startRecording} 
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`p-2 transition-all ${isRecordingAudio ? 'text-red-500 scale-125 animate-pulse' : 'text-gray-400 hover:text-indigo-500'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
                
                <input 
                  type="text" 
                  placeholder={isRecordingAudio ? "Listening..." : editingMessageId ? "Recalibrating signal..." : "Broadcast message..."} 
                  className="flex-1 bg-transparent dark:text-gray-100 py-2.5 text-sm focus:outline-none font-bold"
                  value={editingMessageId ? editBuffer : messageText}
                  onChange={(e) => editingMessageId ? setEditBuffer(e.target.value) : setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (editingMessageId ? handleEditConfirm() : handleSend())}
                />

                <button 
                  onClick={() => editingMessageId ? handleEditConfirm() : handleSend()}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
            <Logo size={120} className="grayscale mb-6" />
            <h3 className="text-xl font-black dark:text-gray-100 uppercase tracking-[0.5em]">Direct Interface Idle</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
