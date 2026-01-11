
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// Audio decoding utilities for raw PCM data from TTS
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function base64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const AIStudio: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'image' | 'video' | 'tts'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  
  // Image Config (Updated for Gemini 3 Pro Image)
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  
  // Video Config (Veo 3)
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [refImage, setRefImage] = useState<string | null>(null);
  
  // TTS Config
  const [voice, setVoice] = useState('Kore');
  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setRefImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    const ext = activeTool === 'image' ? 'png' : activeTool === 'video' ? 'mp4' : 'wav';
    link.download = `worldwide_ai_${activeTool}_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Content saved to your device.');
  };

  const ensureApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        return true; 
      }
    }
    return true;
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    await ensureApiKey();
    setLoading(true);
    setResultUrl(null);
    setProgressMsg('Rendering visual signal...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { 
            aspectRatio: aspectRatio as any, 
            imageSize: imageSize as any 
          }
        }
      });
      
      let found = false;
      for (const candidate of response.candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            setResultUrl(`data:image/png;base64,${part.inlineData.data}`);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) alert("No image data returned from signal.");
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        alert("Generation failed: " + e.message);
      }
    } finally { setLoading(false); setProgressMsg(''); }
  };

  const generateVideo = async () => {
    if (!prompt.trim() && !refImage) return;
    await ensureApiKey();
    setLoading(true);
    setResultUrl(null);
    setProgressMsg('Initiating Veo engine...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation: any;
      
      const config = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: videoAspectRatio as any
      };

      if (refImage) {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          image: { imageBytes: refImage.split(',')[1], mimeType: 'image/png' },
          config
        });
      } else {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          config
        });
      }

      while (!operation.done) {
        setProgressMsg('Rendering neural frames... this usually takes 1-2 minutes.');
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const link = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (link) {
        const resp = await fetch(`${link}&key=${process.env.API_KEY}`);
        const blob = await resp.blob();
        setResultUrl(URL.createObjectURL(blob));
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        alert("Video Gen failed: " + e.message);
      }
    } finally { setLoading(false); setProgressMsg(''); }
  };

  const generateTTS = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setProgressMsg('Synthesizing speech...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = base64ToUint8(base64Audio);
        const audioBuffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
        
        const wavBlob = bufferToWav(audioBuffer);
        setResultUrl(URL.createObjectURL(wavBlob));
      }
    } catch (e: any) { alert("TTS failed: " + e.message); }
    finally { setLoading(false); setProgressMsg(''); }
  };

  function bufferToWav(abuffer: AudioBuffer) {
    let numOfChan = abuffer.numberOfChannels,
          length = abuffer.length * numOfChan * 2 + 44,
          buffer = new ArrayBuffer(length),
          view = new DataView(buffer),
          channels: Float32Array[] = [], 
          i, 
          sample,
          offset = 0,
          pos = 0;

    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    for(i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while(pos < length) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  return (
    <div className="space-y-6 page-transition">
      <header>
        <h2 className="text-3xl font-syne font-black text-gradient uppercase tracking-tighter">AI Studio</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">Premium Content Synthesis</p>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {(['image', 'video', 'tts'] as const).map((t) => (
          <button 
            key={t}
            onClick={() => { setActiveTool(t); setResultUrl(null); setPrompt(''); }}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTool === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
          >
            {t === 'image' ? 'Neural Images' : t === 'video' ? 'Veo 3 Cinema' : 'Voice Matrix'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-black/5 shadow-xl space-y-6">
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Manifestation Prompt</label>
             <textarea 
               className="w-full h-32 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-sm font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
               placeholder={activeTool === 'image' ? "Envision the future..." : activeTool === 'video' ? "Describe the sequence..." : "Type to synthesize..."}
               value={prompt}
               onChange={e => setPrompt(e.target.value)}
             />
          </div>

          {activeTool === 'image' && (
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Aspect Ratio</label>
                 <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-[10px] font-bold dark:text-white uppercase">
                   {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Precision</label>
                 <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-[10px] font-bold dark:text-white uppercase">
                   {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
            </div>
          )}

          {activeTool === 'video' && (
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Cinematic Ratio</label>
                 <div className="flex gap-2">
                    {['16:9', '9:16'].map(r => (
                      <button key={r} onClick={() => setVideoAspectRatio(r)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${videoAspectRatio === r ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-400'}`}>{r === '16:9' ? 'Landscape' : 'Portrait'}</button>
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Base Frame (Optional)</label>
                 <input type="file" onChange={handleFileUpload} className="hidden" id="video-ref" accept="image/*" />
                 <label htmlFor="video-ref" className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                    {refImage ? <img src={refImage} className="h-10 rounded shadow-md" alt="" /> : <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inject Base Signal</span>}
                 </label>
              </div>
            </div>
          )}

          {activeTool === 'tts' && (
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Vocal Identity</label>
               <div className="grid grid-cols-3 gap-2">
                  {voices.map(v => (
                    <button key={v} onClick={() => setVoice(v)} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${voice === v ? 'bg-indigo-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-900 text-gray-400'}`}>{v}</button>
                  ))}
               </div>
            </div>
          )}

          <button 
            disabled={loading}
            onClick={activeTool === 'image' ? generateImage : activeTool === 'video' ? generateVideo : generateTTS}
            className="w-full py-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Manifesting...
              </span>
            ) : 'Initiate Synthesis'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-[2.5rem] p-4 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden border border-white/5 shadow-2xl">
           {loading ? (
             <div className="text-center space-y-6 px-12 relative z-10">
                <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                <div className="space-y-2">
                  <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">{progressMsg || 'Calibrating Neural Net...'}</p>
                  <p className="text-gray-500 text-[9px] uppercase tracking-widest">Awaiting result from the digital grid</p>
                </div>
             </div>
           ) : resultUrl ? (
             <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-500 p-2">
                {activeTool === 'image' && <img src={resultUrl} className="max-w-full max-h-[500px] rounded-3xl shadow-2xl border border-white/10" alt="Generated" />}
                {activeTool === 'video' && <video src={resultUrl} controls className="max-w-full max-h-[500px] rounded-3xl shadow-2xl border border-white/10" />}
                {activeTool === 'tts' && (
                  <div className="text-center space-y-8 p-12 bg-indigo-900/20 rounded-[3rem] border border-indigo-500/20">
                     <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                       <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     </div>
                     <audio src={resultUrl} controls autoPlay className="mx-auto" />
                     <p className="text-white text-xs font-black uppercase tracking-[0.4em]">Audio Node Ready</p>
                  </div>
                )}
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button onClick={() => { 
                    if (resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
                    setResultUrl(null); 
                  }} className="px-6 py-3 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">Discard</button>
                  <button onClick={handleDownload} className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Save to Device
                  </button>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-500 transition-all">Broadcast to Grid</button>
                </div>
             </div>
           ) : (
             <div className="text-center opacity-20 space-y-6">
                <div className="w-32 h-32 mx-auto border-4 border-dashed border-white/20 rounded-[2.5rem] flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-white text-xs font-black uppercase tracking-[0.6em]">Studio Interface Idle</p>
             </div>
           )}
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Lab Information
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Premium content manifestation requires a paid API key from a Google Cloud Project with billing enabled. High-resolution generation (4K) may take additional processing cycles. Saving media will store the file directly in your device's downloads folder.
        </p>
      </div>
    </div>
  );
};

export default AIStudio;
