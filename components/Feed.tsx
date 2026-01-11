
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Post, User, MusicTrack, MessageType, ContentCategory } from '../types';
import CameraCapture from './CameraCapture';
import MusicPicker from './MusicPicker';
import { GoogleGenAI } from '@google/genai';

const { useNavigate } = ReactRouterDOM;

interface FeedProps {
  themeColor: string;
  user: User;
  posts: Post[];
  onPostUpdate: (posts: any[]) => void;
}

interface InteractionUser {
  id: string;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  avatar: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
}

interface PostInteraction extends Post {
  isLiked?: boolean;
  isSaved?: boolean;
  shares: number;
  commentsList: Comment[];
  likers: InteractionUser[];
}

const categories: ContentCategory[] = ['Tech', 'Art', 'Music', 'Lifestyle', 'Nature', 'Neural', 'Future'];

const Feed: React.FC<FeedProps> = ({ themeColor, user, posts: globalPosts, onPostUpdate }) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('Lifestyle');
  const [showCamera, setShowCamera] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showShareMenuId, setShowShareMenuId] = useState<string | null>(null);
  const [isGeneratingAIPost, setIsGeneratingAIPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [animatingLikeId, setAnimatingLikeId] = useState<string | null>(null);
  
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [replyToInfo, setReplyToInfo] = useState<{ commentId: string; username: string } | null>(null);

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const REFRESH_THRESHOLD = 80;
  
  const deviceMediaInputRef = useRef<HTMLInputElement>(null);

  const mockUsers: InteractionUser[] = [
    { id: 'c1', username: 'jordan_m', avatar: 'https://picsum.photos/seed/jordan/100/100', isFollowing: true },
    { id: 'c2', username: 'sara_s', avatar: 'https://picsum.photos/seed/sara/100/100', isFollowing: false },
    { id: 'c3', username: 'ww_official', avatar: 'https://picsum.photos/seed/world/100/100', isFollowing: true },
    { id: 'c4', username: 'flame_ai', avatar: 'https://picsum.photos/seed/flame/100/100', isFollowing: false },
  ];

  const [localPosts, setLocalPosts] = useState<PostInteraction[]>([]);

  // Neural Interest Tracking Function
  const trackInterest = (category?: ContentCategory, weight: number = 1) => {
    if (!category) return;
    const currentInterests = JSON.parse(localStorage.getItem(`ww-interests-${user.id}`) || '{}');
    currentInterests[category] = (currentInterests[category] || 0) + weight;
    localStorage.setItem(`ww-interests-${user.id}`, JSON.stringify(currentInterests));
  };

  useEffect(() => {
    if (globalPosts.length === 0) {
      const initial: PostInteraction[] = [
        {
          id: 'p1',
          userId: 'u2',
          username: 'Luna_Comms',
          userAvatar: 'https://picsum.photos/seed/travel/100/100',
          content: 'The pink horizon over the digital grid today is stunning. 🌌 #Vibes #Worldwide.',
          image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=800',
          music: { id: 'm1', title: 'Midnight City', artist: 'M83', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=100' },
          likes: 1243,
          comments: 2,
          shares: 45,
          timestamp: '2h',
          isLiked: false,
          isSaved: false,
          category: 'Neural',
          commentsList: [
            { 
              id: 'c1', 
              username: 'alex_ww', 
              text: 'Absolutely breathtaking! ✨', 
              timestamp: '1h', 
              avatar: 'https://picsum.photos/seed/alex/50/50', 
              likes: 12,
              replies: [
                { id: 'r1', username: 'luna_comms', text: 'Thank you! It looks even better in high-orbit.', timestamp: '45m', avatar: 'https://picsum.photos/seed/travel/100/100', likes: 2, replies: [] }
              ]
            },
            { id: 'c2', username: 'tech_orbit', text: 'Neural rendering is on point here.', timestamp: '30m', avatar: 'https://picsum.photos/seed/orbit/50/50', likes: 5, replies: [] }
          ],
          likers: mockUsers.slice(0, 4)
        },
        {
          id: 'p2',
          userId: 'u3',
          username: 'Tech_Arch',
          userAvatar: 'https://picsum.photos/seed/tech/100/100',
          content: 'Building the next generation of node infrastructure. The grid expands! 💻',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
          likes: 856,
          comments: 0,
          shares: 12,
          timestamp: '4h',
          isLiked: false,
          category: 'Tech',
          commentsList: [],
          likers: []
        }
      ];
      setLocalPosts(initial);
      onPostUpdate(initial);
    } else {
      setLocalPosts(globalPosts as PostInteraction[]);
    }
  }, [globalPosts]);

  const sortedPosts = useMemo(() => {
    const interests = JSON.parse(localStorage.getItem(`ww-interests-${user.id}`) || '{}');
    return [...localPosts].sort((a, b) => {
      const scoreA = (interests[a.category || ''] || 0) * 1.5;
      const scoreB = (interests[b.category || ''] || 0) * 1.5;
      return scoreB - scoreA;
    });
  }, [localPosts, user.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      const dampedDiff = Math.pow(diff, 0.85);
      setPullDistance(dampedDiff);
      if (diff > 10) {
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > REFRESH_THRESHOLD) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    setPullDistance(REFRESH_THRESHOLD);
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a short 1-sentence social media post update for the Worldwide network about technology or future. Use 1 emoji.",
      });
      const refreshedPost: PostInteraction = {
        id: 'ref-' + Date.now(),
        userId: 'flame',
        username: 'Flame_AI',
        userAvatar: 'https://picsum.photos/seed/flame/100/100',
        content: response.text || 'The neural network has successfully synced. New signals available.',
        likes: Math.floor(Math.random() * 500),
        comments: 0,
        shares: 0,
        timestamp: 'Just now',
        isLiked: false,
        isSaved: false,
        category: 'Future',
        commentsList: [],
        likers: []
      };
      const updated = [refreshedPost, ...localPosts];
      setLocalPosts(updated);
      onPostUpdate(updated);
    } catch (e) {
      console.warn("Refresh signal interrupted.");
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  };

  const handlePost = () => {
    if (!newPostContent.trim() && !selectedImage && !selectedVideo) return;
    const newPost: PostInteraction = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      content: newPostContent,
      image: selectedImage || undefined,
      video: selectedVideo || undefined,
      music: selectedMusic || undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'Just now',
      isLiked: false,
      isSaved: false,
      category: selectedCategory,
      commentsList: [],
      likers: []
    };
    const updated = [newPost, ...localPosts];
    setLocalPosts(updated);
    onPostUpdate(updated);
    setNewPostContent('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setSelectedMusic(null);
    setSelectedCategory('Lifestyle');
  };

  const handleAIBroadcast = async () => {
    setIsGeneratingAIPost(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Manifest a poetic social media post about the Worldwide network peaking. Use 1-2 emojis.",
      });
      if (response.text) setNewPostContent(response.text);
    } catch (e) {
      alert("AI Signal disconnected.");
    } finally {
      setIsGeneratingAIPost(false);
    }
  };

  const toggleLike = (e: React.MouseEvent, post: PostInteraction) => {
    e.stopPropagation();
    const updated = localPosts.map(p => {
      if (p.id === post.id) {
        const alreadyLiked = p.isLiked;
        if (!alreadyLiked) {
          trackInterest(p.category, 5);
          setAnimatingLikeId(p.id);
          setTimeout(() => setAnimatingLikeId(null), 800);
        }
        return {
          ...p,
          isLiked: !alreadyLiked,
          likes: alreadyLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    });
    setLocalPosts(updated);
    onPostUpdate(updated);
  };

  const handleAddInlineComment = (post: PostInteraction) => {
    if (!inlineCommentText.trim()) return;
    trackInterest(post.category, 3);
    
    const newComment: Comment = {
      id: Date.now().toString(),
      username: user.username,
      avatar: user.avatar,
      text: inlineCommentText,
      timestamp: 'Just now',
      likes: 0,
      replies: []
    };

    const updated = localPosts.map(p => {
      if (p.id === post.id) {
        let newList = [...p.commentsList];
        if (replyToInfo) {
          // Recursive search for the target comment to append reply
          const appendReply = (list: Comment[]): Comment[] => {
            return list.map(c => {
              if (c.id === replyToInfo.commentId) {
                return { ...c, replies: [...(c.replies || []), newComment] };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: appendReply(c.replies) };
              }
              return c;
            });
          };
          newList = appendReply(newList);
        } else {
          newList = [newComment, ...newList];
        }

        return {
          ...p,
          comments: p.comments + 1,
          commentsList: newList
        };
      }
      return p;
    });

    setLocalPosts(updated);
    onPostUpdate(updated);
    setInlineCommentText('');
    setReplyToInfo(null);
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
    const updated = localPosts.map(p => {
      if (p.id === postId) {
        const updateLikes = (list: Comment[]): Comment[] => {
          return list.map(c => {
            if (c.id === commentId) {
              const liked = !c.isLiked;
              return { ...c, isLiked: liked, likes: liked ? c.likes + 1 : c.likes - 1 };
            }
            if (c.replies) return { ...c, replies: updateLikes(c.replies) };
            return c;
          });
        };
        return { ...p, commentsList: updateLikes(p.commentsList) };
      }
      return p;
    });
    setLocalPosts(updated);
  };

  const shareToDirect = (contactId: string, post: PostInteraction) => {
    trackInterest(post.category, 8);
    window.dispatchEvent(new CustomEvent('ww-share-to-chat', {
      detail: {
        type: 'post_share',
        contactId,
        payload: {
          sharedContentId: post.id,
          sharedContentThumb: post.image || post.video || post.userAvatar,
          sharedContentAuthor: post.username,
          text: `Check out this signal by @${post.username}`
        }
      }
    }));
    setShowShareMenuId(null);
    alert(`Signal transmitted to node node.`);
  };

  const handleCapture = (data: string, type: 'image' | 'video') => {
    if (type === 'image') {
      setSelectedImage(data);
      setSelectedVideo(null);
    } else {
      setSelectedVideo(data);
      setSelectedImage(null);
    }
    setShowCamera(false);
  };
  
  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        if (file.type.startsWith('image/')) {
          setSelectedImage(data);
          setSelectedVideo(null);
        } else if (file.type.startsWith('video/')) {
          setSelectedVideo(data);
          setSelectedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderComment = (postId: string, comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`flex gap-3 group/comment relative ${depth > 0 ? 'mt-4' : 'py-5 border-b border-black/5 last:border-0'}`}>
      {depth > 0 && (
        <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-pink-200/50 to-transparent"></div>
      )}
      
      <div className="relative">
        <img src={comment.avatar} className={`${depth > 0 ? 'w-7 h-7' : 'w-10 h-10'} rounded-[1rem] object-cover border-2 border-white dark:border-gray-700 shadow-sm relative z-10 transition-transform group-hover/comment:scale-110`} alt="" />
        {depth === 0 && (
          <div className="absolute inset-0 bg-pink-500/10 blur-md rounded-full -z-0 scale-75 opacity-0 group-hover/comment:opacity-100 transition-opacity"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-gray-50/80 dark:bg-white/5 p-4 rounded-[1.5rem] rounded-tl-none border border-black/5 dark:border-white/5 transition-colors group-hover/comment:bg-gray-100/50 dark:group-hover/comment:bg-white/10">
          <div className="flex items-center justify-between mb-1">
             <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 dark:text-white group-hover/comment:text-pink-500 transition-colors">@{comment.username}</p>
             <span className="text-[8px] font-black uppercase text-gray-400 opacity-60 group-hover/comment:opacity-100">{comment.timestamp}</span>
          </div>
          <p className="text-xs font-medium leading-relaxed text-gray-700 dark:text-gray-300 select-text">{comment.text}</p>
        </div>

        <div className="flex items-center gap-6 mt-2.5 px-1">
          <button 
            onClick={() => toggleCommentLike(postId, comment.id)}
            className={`flex items-center gap-1.5 text-[9px] font-black uppercase transition-all active:scale-125 ${comment.isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
          >
            <svg className="w-3.5 h-3.5" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            {comment.likes > 0 && comment.likes}
          </button>
          
          <button 
            onClick={() => { setReplyToInfo({ commentId: comment.id, username: comment.username }); }}
            className="text-[9px] font-black uppercase text-gray-400 hover:text-indigo-500 transition-colors tracking-widest flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply
          </button>
          
          {depth === 0 && comment.replies && comment.replies.length > 0 && (
            <div className="flex items-center gap-1.5">
               <div className="w-4 h-px bg-gray-200 dark:bg-gray-700"></div>
               <span className="text-[8px] font-black uppercase text-indigo-500/70 tracking-widest">{comment.replies.length} REPLIES</span>
            </div>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 pl-4 border-l-2 border-pink-50 dark:border-gray-800 space-y-1 mt-3">
            {comment.replies.map(reply => renderComment(postId, reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className="space-y-6 font-space relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes heart-burst {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); }
          75% { transform: scale(0.9); }
          100% { transform: scale(1.1); }
        }
        .animate-heart-burst {
          animation: heart-burst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
      
      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
      <input type="file" ref={deviceMediaInputRef} onChange={handleDeviceUpload} className="hidden" accept="image/*,video/*" />

      {/* Pull-to-refresh indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
        style={{ 
          top: -20,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
          transform: `translateX(-50%) translateY(${Math.min(pullDistance, 100)}px) scale(${Math.min(pullDistance / REFRESH_THRESHOLD, 1)})`
        }}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-xl border border-pink-500/20 ${isRefreshing ? 'animate-spin' : ''}`}>
          <svg className={`w-5 h-5 text-pink-500 transition-transform ${pullDistance > REFRESH_THRESHOLD ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        <p className="text-[8px] font-black uppercase text-pink-500 tracking-[0.3em] mt-2 whitespace-nowrap">
          {isRefreshing ? 'Syncing Neural Grid...' : pullDistance > REFRESH_THRESHOLD ? 'Release to Sync' : 'Pull for Signal'}
        </p>
      </div>

      {showMusicPicker && <MusicPicker onSelect={(track) => { setSelectedMusic(track); setShowMusicPicker(false); }} onClose={() => setShowMusicPicker(false)} />}
      
      <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-[3rem] p-8 shadow-2xl border border-white/20 dark:border-gray-700 transition-all hover:shadow-pink-500/5 ${isRefreshing ? 'opacity-50 grayscale scale-95 pointer-events-none' : ''}`} style={{ transform: `translateY(${Math.min(pullDistance / 2, 20)}px)` }}>
        <div className="flex gap-5">
          <div className="relative">
            <img src={user.avatar} className="w-14 h-14 rounded-[1.5rem] border-2 border-pink-500 p-0.5 object-cover shadow-lg" alt="Me" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full shadow-lg"></div>
          </div>
          <div className="flex-1 pt-1">
            <textarea 
              className="w-full bg-transparent border-none rounded-xl p-0 text-xl font-black dark:text-white placeholder-gray-300 resize-none focus:ring-0" 
              placeholder="Broadcast a new signal..." 
              value={newPostContent} 
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={2}
            ></textarea>

            {selectedMusic && (
              <div className="mt-6 flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-[2rem] border border-white/10 animate-in zoom-in duration-300">
                <img src={selectedMusic.cover} className="w-12 h-12 rounded-2xl shadow-lg rotate-3" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-pink-500 tracking-widest mb-0.5">Neural Sonic Wave</p>
                  <p className="text-sm font-bold dark:text-white truncate uppercase tracking-tighter">{selectedMusic.title}</p>
                </div>
                <button onClick={() => setSelectedMusic(null)} className="p-3 text-gray-400 hover:text-red-500 transition-colors bg-white/5 rounded-xl active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            )}
            
            {selectedImage && (
              <div className="mt-6 relative group w-fit">
                <img src={selectedImage} className="max-h-64 rounded-[2.5rem] shadow-2xl border border-white/10" alt="Preview" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-black text-white p-2 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all border border-white/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {selectedVideo && (
              <div className="mt-6 relative group w-fit">
                <video src={selectedVideo} className="max-h-64 rounded-[2.5rem] shadow-2xl border border-white/10" controls muted />
                <button onClick={() => setSelectedVideo(null)} className="absolute -top-3 -right-3 bg-black text-white p-2 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all border border-white/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="absolute top-4 right-12 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Kinetic Signal</div>
              </div>
            )}
          </div>
        </div>

        {/* Category Selection Row */}
        <div className="mt-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 ml-2">Signal Frequency</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
                  selectedCategory === cat 
                    ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/20' 
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 border-transparent hover:border-pink-500/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            <button onClick={() => setShowCamera(true)} className="p-4 bg-pink-50 dark:bg-pink-900/10 text-pink-500 rounded-2xl hover:scale-110 transition-all active:scale-90 shadow-sm" title="Capture Camera"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg></button>
            <button onClick={() => deviceMediaInputRef.current?.click()} className="p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-500 rounded-2xl hover:scale-110 transition-all active:scale-90 shadow-sm" title="Upload from Device"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
            <button onClick={() => setShowMusicPicker(true)} className={`p-4 rounded-2xl transition-all active:scale-90 shadow-sm ${selectedMusic ? 'bg-indigo-600 text-white shadow-xl' : 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg></button>
            <button onClick={handleAIBroadcast} disabled={isGeneratingAIPost} className="p-4 bg-violet-50 dark:bg-violet-900/10 text-violet-600 rounded-2xl hover:rotate-12 transition-all active:scale-90 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>
          </div>
          <button 
            onClick={handlePost} 
            disabled={!newPostContent.trim() && !selectedImage && !selectedVideo}
            className={`px-10 py-4 ${themeColor} text-white font-black text-xs uppercase tracking-[0.25em] rounded-[1.5rem] shadow-xl shadow-pink-500/10 active:scale-95 disabled:opacity-30 transition-all`}
          >
            Launch Node
          </button>
        </div>
      </div>

      <div className="space-y-8" style={{ transform: `translateY(${Math.min(pullDistance / 2.5, 30)}px)` }}>
        {sortedPosts.map(post => {
          const interests = JSON.parse(localStorage.getItem(`ww-interests-${user.id}`) || '{}');
          const isHighMatch = post.category && interests[post.category] > 10;
          const isAnimatingLike = animatingLikeId === post.id;

          return (
          <div 
            key={post.id} 
            className="bg-white dark:bg-gray-800 rounded-[3rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-2xl group relative"
          >
            {isHighMatch && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                 <div className="bg-pink-500/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_0_20px_#ec4899] border border-pink-400 animate-pulse">
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Neural Signal Match</span>
                 </div>
              </div>
            )}

            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}>
                  <div className="absolute inset-0 bg-pink-500 blur-lg opacity-10 rounded-full animate-pulse"></div>
                  <img src={post.userAvatar} className="w-12 h-12 rounded-[1.2rem] border-2 border-white dark:border-gray-700 object-cover relative z-10" alt="" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tighter cursor-pointer hover:text-pink-500 transition-colors" onClick={() => navigate('/profile')}>@{post.username}</h4>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{post.timestamp} Node Broadcast • {post.category || 'Global'}</p>
                </div>
              </div>
              <button className="p-3 text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              </button>
            </div>
            
            <div className="px-8 pb-6" onClick={() => { 
                trackInterest(post.category, 2);
                navigate(`/post/${post.id}`);
              }}>
              <p className="text-gray-700 dark:text-gray-200 text-base font-medium leading-relaxed whitespace-pre-wrap cursor-pointer">{post.content}</p>
            </div>

            {post.music && (
               <div className="mx-8 mb-6 px-5 py-4 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-white/5 flex items-center gap-4 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer group" onClick={(e) => { e.stopPropagation(); alert(`Tuning into: ${post.music.title}`); }}>
                  <div className="w-10 h-10 rounded-[0.8rem] overflow-hidden flex-shrink-0 animate-float shadow-xl relative">
                    <img src={post.music.cover} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-pink-500/20 mix-blend-overlay"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase text-pink-500 tracking-widest mb-0.5 opacity-80">Sonic Frequency</p>
                    <p className="text-xs font-bold dark:text-white truncate uppercase tracking-tighter">{post.music.title} • {post.music.artist}</p>
                  </div>
                  <div className="flex gap-1.5 items-end h-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-0.5 bg-pink-500 animate-pulse rounded-full" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.15}s` }}></div>)}
                  </div>
               </div>
            )}

            {post.image && (
              <div className="px-4 pb-4" onClick={() => navigate(`/post/${post.id}`)}>
                <img src={post.image} className="w-full aspect-[4/5] object-cover rounded-[2.5rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.01] cursor-pointer" alt="" />
              </div>
            )}

            {post.video && (
              <div className="px-4 pb-4" onClick={() => navigate(`/post/${post.id}`)}>
                <div className="relative group/vid cursor-pointer">
                  <video src={post.video} className="w-full aspect-[4/5] object-cover rounded-[2.5rem] shadow-2xl" loop muted autoPlay playsInline />
                  <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md p-3 rounded-2xl text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover/vid:opacity-100 transition-opacity rounded-[2.5rem]">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white scale-90 group-hover/vid:scale-100 transition-transform">
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 px-10 flex items-center justify-between border-t border-gray-50 dark:border-gray-700">
              <div className="flex items-center gap-8">
                <button 
                  onClick={(e) => toggleLike(e, post)} 
                  className={`relative flex items-center gap-3 group transition-all active:scale-[1.4] ${post.isLiked ? 'text-pink-500 font-black' : 'text-gray-400 hover:text-pink-500'}`}
                >
                  {isAnimatingLike && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="w-8 h-8 rounded-full border-2 border-pink-500 animate-ping opacity-75"></div>
                    </div>
                  )}
                  <svg 
                    className={`w-6 h-6 transition-all duration-300 ${isAnimatingLike ? 'animate-heart-burst' : ''} ${post.isLiked ? 'scale-110' : ''}`} 
                    fill={post.isLiked ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-xs font-black tracking-tighter">{post.likes.toLocaleString()}</span>
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id);
                    if (expandedCommentsPostId !== post.id) {
                      trackInterest(post.category, 2);
                      setReplyToInfo(null);
                    }
                  }} 
                  className={`flex items-center gap-3 transition-all active:scale-90 group ${expandedCommentsPostId === post.id ? 'text-indigo-500 font-black' : 'text-gray-400 hover:text-indigo-500'}`}
                >
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <span className="text-xs font-black tracking-tighter">{post.comments}</span>
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowShareMenuId(post.id); }} 
                  className="p-3 text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-2xl transition-all active:scale-90 hover:text-pink-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); (post as any).isSaved = !(post as any).isSaved; setLocalPosts([...localPosts]); alert('Signal archived in node vault.'); }} 
                  className={`p-3 transition-all active:scale-90 rounded-2xl ${ (post as any).isSaved ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10' }`}
                >
                  <svg className="w-6 h-6" fill={(post as any).isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </button>
              </div>
            </div>

            {expandedCommentsPostId === post.id && (
              <div className="px-10 pb-8 animate-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-gray-50 dark:bg-gray-700 w-full mb-6"></div>
                <div className="space-y-1 mb-8">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">Signal Echo Stream</p>
                  <p className="text-[8px] font-black text-pink-500 uppercase tracking-widest">{post.comments} ACTIVE CONNECTIONS</p>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto no-scrollbar mb-8">
                  {post.commentsList && post.commentsList.map(comment => renderComment(post.id, comment))}
                  {(!post.commentsList || post.commentsList.length === 0) && (
                    <div className="py-12 text-center flex flex-col items-center">
                       <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-[1.5rem] flex items-center justify-center text-gray-300 mb-4 border border-black/5">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                       </div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grid silence. Be the first to resonate.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {replyToInfo && (
                    <div className="flex items-center justify-between px-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-t-2xl border-t border-x border-indigo-100 dark:border-indigo-900/40 animate-in slide-in-from-bottom-2">
                       <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Replying to @{replyToInfo.username}</p>
                       <button onClick={() => setReplyToInfo(null)} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500">Cancel</button>
                    </div>
                  )}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500"></div>
                    <div className={`relative bg-white dark:bg-gray-900 border ${replyToInfo ? 'rounded-b-[2.5rem] border-indigo-100 dark:border-indigo-900/40' : 'rounded-[2.5rem] border-gray-100 dark:border-gray-700'} p-1.5 pl-6 pr-1.5 flex items-center gap-3 transition-all`}>
                      <input 
                        type="text" 
                        placeholder={replyToInfo ? `Write a reply...` : "Attach a signal echo..."} 
                        className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 outline-none dark:text-white"
                        value={inlineCommentText}
                        onChange={e => setInlineCommentText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddInlineComment(post)}
                      />
                      <button 
                        onClick={() => handleAddInlineComment(post)}
                        disabled={!inlineCommentText.trim()}
                        className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30 disabled:grayscale hover:bg-pink-600 shadow-pink-500/20"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showShareMenuId === post.id && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-white dark:bg-gray-900 shadow-[0_30px_100px_rgba(0,0,0,0.4)] rounded-[2.5rem] p-6 border border-black/5 animate-in zoom-in duration-300 w-full max-w-[280px]" onClick={e => e.stopPropagation()}>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] text-center mb-6">Transmit Signal To</p>
                  {mockUsers.map(c => (
                    <button key={c.id} onClick={() => shareToDirect(c.id, post)} className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-left group">
                      <img src={c.avatar} className="w-10 h-10 rounded-xl group-hover:scale-110 transition-transform shadow-md" alt="" />
                      <span className="text-[11px] font-black dark:text-white uppercase tracking-tight">@{c.username}</span>
                    </button>
                  ))}
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-4"></div>
                  <button onClick={() => setShowShareMenuId(null)} className="w-full py-3 text-[10px] font-black uppercase text-red-500 tracking-widest hover:bg-red-50 rounded-xl transition-colors">Discard</button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default Feed;
