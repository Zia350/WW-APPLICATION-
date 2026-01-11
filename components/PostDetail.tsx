
import React, { useState, useEffect } from 'react';
// Fix: Using namespace import for react-router-dom to resolve "no exported member" errors
import * as ReactRouterDOM from 'react-router-dom';
import { Post, User } from '../types';

const { useParams, useNavigate } = ReactRouterDOM;

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  avatar: string;
  likes: number;
  isLiked?: boolean;
}

interface PostInteraction extends Post {
  isLiked?: boolean;
  isSaved?: boolean;
  shares: number;
  commentsList: Comment[];
}

interface PostDetailProps {
  user: User;
  posts: Post[];
  onPostUpdate: (posts: any[]) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ user, posts, onPostUpdate }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharingToChat, setIsSharingToChat] = useState(false);

  const post = posts.find(p => p.id === postId) as PostInteraction | undefined;

  const mockUsers = [
    { id: 'c1', username: 'jordan_m', avatar: 'https://picsum.photos/seed/jordan/100/100' },
    { id: 'c2', username: 'sara_s', avatar: 'https://picsum.photos/seed/sara/100/100' },
    { id: 'c3', username: 'ww_official', avatar: 'https://picsum.photos/seed/world/100/100' },
    { id: 'c4', username: 'flame_ai', avatar: 'https://picsum.photos/seed/flame/100/100' },
  ];

  if (!post) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm">
        <h2 className="text-xl font-black mb-4">Signal Lost</h2>
        <p className="text-gray-500 mb-6">This post has drifted away from the grid.</p>
        <button 
          onClick={() => navigate('/feed')}
          className="px-6 py-2 bg-pink-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      username: user.username,
      avatar: user.avatar,
      text: commentText,
      timestamp: 'Just now',
      likes: 0
    };

    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const castedPost = p as PostInteraction;
        return {
          ...castedPost,
          comments: castedPost.comments + 1,
          commentsList: [newComment, ...(castedPost.commentsList || [])]
        };
      }
      return p;
    });

    onPostUpdate(updatedPosts);
    setCommentText('');
  };

  const toggleLikePost = () => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const alreadyLiked = (p as PostInteraction).isLiked;
        return {
          ...p,
          isLiked: !alreadyLiked,
          likes: alreadyLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    });
    onPostUpdate(updated);
  };

  const shareToDirect = (contactId: string) => {
    window.dispatchEvent(new CustomEvent('ww-share-to-chat', {
      detail: {
        type: 'post_share',
        contactId,
        payload: {
          sharedContentId: post.id,
          sharedContentThumb: post.image || post.userAvatar,
          sharedContentAuthor: post.username,
          text: `Check out this signal by @${post.username}`
        }
      }
    }));
    setShowShareMenu(false);
    setIsSharingToChat(false);
    alert(`Signal shared to node thread.`);
  };

  const handleWhatsAppShare = () => {
    const text = `Check out this broadcast from @${post.username} on Worldwide App 🚀`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[calc(100vh-10rem)] lg:h-[700px] border border-gray-100 dark:border-gray-700 page-transition relative">
      
      {/* Share Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-end justify-center p-0 animate-in fade-in duration-300" onClick={() => { setShowShareMenu(false); setIsSharingToChat(false); }}>
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-t-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
            <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">{isSharingToChat ? 'Select Target Node' : 'Share Signal'}</h3>
            
            {isSharingToChat ? (
              <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pb-4">
                {mockUsers.map(contact => (
                  <button 
                    key={contact.id} 
                    onClick={() => shareToDirect(contact.id)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all"
                  >
                    <img src={contact.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">@{contact.username}</span>
                    <span className="ml-auto text-[9px] font-black text-pink-500 uppercase">Send</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setIsSharingToChat(true)}
                  className="w-full flex items-center gap-4 p-5 bg-pink-50 dark:bg-pink-900/10 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-pink-600"
                >
                  <div className="p-2.5 bg-pink-500 text-white rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>
                  <span className="font-black text-xs uppercase tracking-widest">Send to Direct</span>
                </button>
                <button 
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl hover:scale-[1.02] transition-all text-emerald-600"
                >
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 2c-5.523 0-10 4.477-10 10 0 1.762.455 3.414 1.252 4.854l-1.283 4.68 4.795-1.258c1.405.748 3.004 1.178 4.704 1.178 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/></svg></div>
                  <span className="font-black text-xs uppercase tracking-widest">Share to WhatsApp</span>
                </button>
              </div>
            )}
            
            <button onClick={() => { setShowShareMenu(false); setIsSharingToChat(false); }} className="w-full mt-6 py-4 text-[10px] font-black uppercase text-gray-400">Dismiss</button>
          </div>
        </div>
      )}

      {/* Media Side */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        {post.image ? (
          <img src={post.image} className="max-w-full max-h-full object-contain" alt="Post content" />
        ) : post.video ? (
          <video src={post.video} controls autoPlay className="max-w-full max-h-full" />
        ) : (
          <div className="p-12 text-center">
            <p className="text-white text-xl font-bold">Signal broadcasted without visuals.</p>
          </div>
        )}
      </div>

      {/* Interaction Side */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
        {/* Author Header */}
        <div className="p-5 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img src={post.userAvatar} className="w-10 h-10 rounded-full border border-gray-100" alt={post.username} />
            <div>
              <p className="font-black text-sm text-gray-900 dark:text-white leading-none">@{post.username}</p>
              <p className="text-[10px] font-bold text-pink-500 uppercase tracking-tighter mt-1">Network Node</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-900">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
        </div>

        {/* Comments Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          {/* Post Content as first comment */}
          <div className="flex gap-3">
            <img src={post.userAvatar} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
            <div>
              <p className="text-xs text-gray-800 dark:text-gray-200">
                <span className="font-black mr-2">@{post.username}</span>
                {post.content}
              </p>
              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">{post.timestamp} • GLOBAL SIGNAL</p>
            </div>
          </div>

          {/* Actual Comments */}
          {post.commentsList && post.commentsList.map(comment => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <img src={comment.avatar} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 dark:text-gray-200">
                  <span className="font-black mr-2">@{comment.username}</span>
                  {comment.text}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">{comment.timestamp}</span>
                  <span className="text-[9px] text-gray-400 font-black cursor-pointer hover:text-pink-500">{comment.likes} likes</span>
                  <span className="text-[9px] text-gray-400 font-black cursor-pointer hover:text-pink-500 uppercase">Reply</span>
                </div>
              </div>
              <button className="text-gray-300 hover:text-pink-500 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
            </div>
          ))}
          
          {(!post.commentsList || post.commentsList.length === 0) && (
            <div className="py-10 text-center opacity-40">
              <p className="text-[10px] font-black uppercase tracking-widest">No signals echoing here yet...</p>
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="p-5 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button onClick={toggleLikePost} className={`transition-all hover:scale-110 ${post.isLiked ? 'text-pink-500' : 'text-gray-800 dark:text-white'}`}>
                <svg className="w-6 h-6" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
              <button className="text-gray-800 dark:text-white hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </button>
              <button onClick={() => setShowShareMenu(true)} className="text-gray-800 dark:text-white hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
            </div>
            <button className="text-gray-800 dark:text-white hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
          </div>
          <p className="text-xs font-black text-gray-900 dark:text-white mb-1">{post.likes.toLocaleString()} likes</p>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{post.timestamp} ago</p>
        </div>

        {/* Add Comment */}
        <form onSubmit={handleAddComment} className="p-4 flex items-center gap-3 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <input 
            type="text" 
            placeholder="Add to the signal..." 
            className="flex-1 bg-transparent border-none text-xs font-bold focus:ring-0 outline-none dark:text-white"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button 
            disabled={!commentText.trim()}
            className="text-xs font-black text-pink-500 uppercase disabled:opacity-30 tracking-widest hover:scale-105 transition-transform"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostDetail;
