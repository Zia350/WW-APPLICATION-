
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface DiscoveryItem {
  id: string;
  image: string;
  type: 'image' | 'video';
  author: string;
  likes: number;
  location?: string;
  url?: string;
}

const Explore: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);

  useEffect(() => {
    // Initial mock data
    const initial = Array.from({ length: 12 }).map((_, i) => ({
      id: `ex-${i}`,
      image: `https://picsum.photos/seed/explore-${i}/600/800`,
      type: (i % 3 === 0 ? 'video' : 'image') as 'image' | 'video',
      author: 'node_' + Math.floor(Math.random() * 999),
      likes: Math.floor(Math.random() * 10000)
    }));
    setDiscoveries(initial);
  }, []);

  const handleDiscoverySearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find popular places or trending events matching "${searchQuery}". Provide results with titles and URLs if possible.`,
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }]
        },
      });

      // Extract results from grounding chunks to activate "advanced maps feature"
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        const results = chunks.map((chunk: any, i: number) => {
          const isMap = !!chunk.maps;
          return {
            id: `disc-${Date.now()}-${i}`,
            image: `https://picsum.photos/seed/place-${i}/600/800`,
            type: 'image' as const,
            author: isMap ? 'Local Guide' : 'News Hub',
            likes: Math.floor(Math.random() * 5000),
            location: isMap ? chunk.maps.title : chunk.web?.title,
            url: isMap ? chunk.maps.uri : chunk.web?.uri
          };
        });
        setDiscoveries(results as DiscoveryItem[]);
      } else {
        alert("The grid is silent on this query. Try another signal.");
      }
    } catch (err) {
      console.error(err);
      alert("Neural search disconnected. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent, item: DiscoveryItem) => {
    e.stopPropagation();
    if (item.url) window.open(item.url, '_blank');
    else alert(`Signal shared to your active chat thread!`);
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-syne font-black text-gradient tracking-tighter uppercase">Signal Discovery</h2>
        <div className="flex items-center gap-3 mt-4">
           <div className="relative flex-1 group">
             <input 
                type="text" 
                placeholder="Find Trending Nodes (e.g. 'Coffee in SF', 'Web3 events')" 
                className="w-full bg-white dark:bg-gray-800 border-none rounded-[1.5rem] py-4 pl-12 pr-6 text-sm font-bold shadow-md focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDiscoverySearch()}
             />
             <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </div>
           <button 
             onClick={handleDiscoverySearch}
             disabled={loading}
             className="p-4 bg-pink-500 text-white rounded-2xl shadow-lg hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50"
           >
             {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
             )}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {discoveries.map((item, idx) => (
          <div 
            key={item.id} 
            className={`relative group overflow-hidden rounded-[2.5rem] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 ${
              idx === 0 ? 'row-span-2' : ''
            }`}
          >
            <img 
              src={item.image} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Explore" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
              <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1">@{item.author}</p>
              {item.location && <p className="text-pink-400 text-[11px] font-black uppercase tracking-tighter mb-3 truncate">{item.location}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {item.likes}
                </div>
                <button 
                  onClick={(e) => handleShare(e, item)}
                  className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-pink-500 transition-all active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
            {item.type === 'video' && (
              <div className="absolute top-4 right-4 text-white drop-shadow-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;
