
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface FlameSource {
  uri: string;
  title: string;
}

interface ChatMessage {
  role: 'user' | 'flame';
  content: string;
  sources?: FlameSource[];
  isThinking?: boolean;
}

interface FlameAIProps {
  themeColor: string;
}

const FlameAI: React.FC<FlameAIProps> = ({ themeColor }) => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const askFlame = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const userMsg = prompt;
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Feature implementation:
      // Thinking: gemini-3-pro-preview with 32768 thinkingBudget
      // Lite: gemini-flash-lite-latest
      // Default: gemini-3-flash-preview
      
      let model = 'gemini-3-flash-preview';
      let config: any = {
        systemInstruction: 'You are Flame AI, the smart assistant for Worldwide. Use search and maps for grounding to provide up-to-date info.',
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
      };

      if (isThinkingMode) {
        model = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 32768 };
      } else if (isLiteMode) {
        model = 'gemini-flash-lite-latest';
        delete config.tools; // Lite doesn't support complex grounding tools well
      } else {
        // Default model is Flash-3 for general speed and grounding support
        model = 'gemini-3-flash-preview';
      }

      const response = await ai.models.generateContent({
        model,
        contents: userMsg,
        config
      });
      
      const flameResponse = response.text || 'The neural grid is silent. Try another prompt.';
      
      // Feature: Grounding Source Extraction
      const sources: FlameSource[] = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) sources.push({ uri: chunk.web.uri, title: chunk.web.title });
          if (chunk.maps) sources.push({ uri: chunk.maps.uri, title: chunk.maps.title });
        });
      }

      setChatHistory(prev => [...prev, { 
        role: 'flame', 
        content: flameResponse,
        sources: sources.length > 0 ? sources : undefined,
        isThinking: isThinkingMode
      }]);
    } catch (error: any) {
      console.error('Flame AI Error:', error);
      setChatHistory(prev => [...prev, { role: 'flame', content: `Sync Error: ${error.message || 'Grid disconnect.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[3rem] overflow-hidden shadow-2xl border border-black/5 flex flex-col h-[calc(100vh-12rem)] animate-in zoom-in duration-500">
      <div className={`p-6 ${themeColor} text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg animate-float">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Flame AI</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Multimodal Global Intelligence</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setIsThinkingMode(!isThinkingMode); if (!isThinkingMode) setIsLiteMode(false); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 ${isThinkingMode ? 'bg-white text-indigo-600' : 'bg-white/10 text-white border border-white/20'}`}
            >
              Deep Think
            </button>
            <button 
              onClick={() => { setIsLiteMode(!isLiteMode); if (!isLiteMode) setIsThinkingMode(false); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 ${isLiteMode ? 'bg-white text-indigo-600' : 'bg-white/10 text-white border border-white/20'}`}
            >
              Lite Signal
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 animate-pulse">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.5em]">Awaiting User Signal</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-400">Flame AI is calibrated and ready</p>
            </div>
          </div>
        )}

        {chatHistory.map((chat, i) => (
          <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] shadow-xl ${
              chat.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-tl-none border border-black/5'
            }`}>
              {chat.isThinking && chat.role === 'flame' && (
                <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full w-fit">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9l-.707.707M16.243 4.243l-.707.707" /></svg>
                   Advanced Cognitive Processing
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-bold">{chat.content}</p>
              
              {chat.sources && chat.sources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-black/10 space-y-3">
                  <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    Neural Grounding Nodes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chat.sources.map((s, idx) => (
                      <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 bg-white dark:bg-black/40 px-4 py-2 rounded-xl truncate max-w-[220px] shadow-sm hover:scale-105 active:scale-95 transition-all border border-indigo-100 dark:border-indigo-900/30">{s.title || 'Source'}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center gap-4 animate-in slide-in-from-left-3">
            <div className="bg-gray-100 dark:bg-gray-900 p-5 rounded-[2rem] flex gap-1.5 shadow-md">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 animate-pulse">{isThinkingMode ? 'Decrypting deep data...' : 'Transmitting...'}</p>
          </div>
        )}
      </div>

      <div className="p-8 bg-gray-50/50 dark:bg-gray-900/30 border-t border-black/5">
        <div className="relative max-w-3xl mx-auto">
          <textarea
            className="w-full bg-white dark:bg-gray-800 border border-black/5 rounded-[2rem] py-5 pl-8 pr-20 text-sm font-bold shadow-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none outline-none min-h-[64px]"
            placeholder="Talk to Flame AI..."
            rows={1}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askFlame())}
          />
          <button 
            onClick={askFlame}
            disabled={loading || !prompt.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-90 disabled:opacity-30 transition-all flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlameAI;
