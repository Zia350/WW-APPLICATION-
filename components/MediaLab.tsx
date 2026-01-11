
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

const MediaLab: React.FC = () => {
  const [activeTask, setActiveTask] = useState<'image' | 'video' | 'audio'>('image');
  const [fileData, setFileData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setMimeType(f.type);
      const reader = new FileReader();
      reader.onload = () => setFileData(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const runAnalysis = async () => {
    if (!fileData) return;
    setLoading(true);
    setAnalysis('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = fileData.split(',')[1];
      
      let model = 'gemini-3-pro-preview'; // Default to Pro for detailed understanding
      let prompt = '';
      
      if (activeTask === 'image') {
        prompt = 'Provide a deep analytical description of this image. Identify key subjects, lighting, mood, and any text present. What is the narrative context of this scene?';
      } else if (activeTask === 'video') {
        prompt = 'Analyze this video clip. Provide a chronological summary of key events, identify notable objects or people, and describe the overall atmosphere and production style.';
      } else {
        model = 'gemini-3-flash-preview'; // Flash is better/faster for pure transcription
        prompt = 'Please provide a precise word-for-word transcription of this audio. If there are multiple speakers, indicate them if possible.';
      }

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ]
        },
        config: {
          // Add thinking budget for the pro model to handle complex video/image analysis
          ...(model === 'gemini-3-pro-preview' ? { thinkingConfig: { thinkingBudget: 16000 } } : {})
        }
      });
      
      setAnalysis(response.text || 'The neural network returned a void signal.');
    } catch (e: any) { 
      setAnalysis("Node link error: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <header>
        <h2 className="text-3xl font-syne font-black text-gradient uppercase tracking-tighter">Media Lab</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">Analytical Neural Processing</p>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {(['image', 'video', 'audio'] as const).map(t => (
          <button 
            key={t} 
            onClick={() => { setActiveTask(t); setFileData(null); setAnalysis(''); }} 
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTask === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
          >
            {t === 'image' ? 'Lens Analysis' : t === 'video' ? 'Kinetic Scan' : 'Sonic Decryption'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="aspect-square bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden p-3 shadow-inner group"
           >
              {fileData ? (
                <div className="relative w-full h-full">
                  {activeTask === 'image' ? <img src={fileData} className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl" alt="Subject" /> :
                   activeTask === 'video' ? <video src={fileData} className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl" /> :
                   <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-500/5 rounded-[2.5rem]">
                      <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl animate-float">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-indigo-500 mt-6 uppercase tracking-[0.2em]">Sonic Waveform Buffered</p>
                   </div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem]">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Signal</span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Inject Media Node</p>
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">Supports PNG, JPG, MP4, MP3, WAV</p>
                   </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept={activeTask === 'image' ? 'image/*' : activeTask === 'video' ? 'video/*' : 'audio/*'} />
           </div>
           
           <button 
             disabled={!fileData || loading}
             onClick={runAnalysis}
             className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-[1.02] disabled:opacity-30 active:scale-95 transition-all"
           >
             {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Neural Decryption...
                </span>
             ) : 'Execute Analytical Sweep'}
           </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3.5rem] border border-black/5 shadow-2xl flex flex-col min-h-[400px]">
           <header className="flex items-center justify-between mb-8">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               Neural Intelligence Output
             </h3>
             {analysis && <button onClick={() => navigator.clipboard.writeText(analysis)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all" title="Copy Signal"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg></button>}
           </header>
           
           <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
              {loading ? (
                <div className="space-y-6 animate-pulse">
                   <div className="space-y-3">
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <div className="h-2 w-4/5 bg-gray-100 dark:bg-gray-700 rounded"></div>
                   </div>
                   <div className="space-y-3">
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                   </div>
                </div>
              ) : analysis ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="text-sm font-medium leading-relaxed dark:text-gray-200 whitespace-pre-wrap">{analysis}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Analysis Parameters</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLab;
