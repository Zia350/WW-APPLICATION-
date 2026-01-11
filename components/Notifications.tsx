
import React, { useEffect } from 'react';
import { Notification } from '../types';

interface NotificationsProps {
  onRead?: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onRead }) => {
  useEffect(() => {
    // Clear unread count when component mounts
    if (onRead) onRead();
  }, []);

  const notifications: Notification[] = [
    {
      id: 'n1',
      type: 'like',
      userId: 'u2',
      username: 'Jordan_Miller',
      userAvatar: 'https://picsum.photos/seed/jordan/100/100',
      content: 'synchronized with your signal "The pink horizon over the digital grid today is stunning. 🌌"',
      timestamp: '2m',
      read: false,
    },
    {
      id: 'n2',
      type: 'follow',
      userId: 'u3',
      username: 'Global_Hub',
      userAvatar: 'https://picsum.photos/seed/world/100/100',
      content: 'has initiated a Subspace Sync with your node.',
      timestamp: '15m',
      read: false,
    },
    {
      id: 'n3',
      type: 'ai',
      userId: 'flame',
      username: 'Flame AI',
      userAvatar: 'https://picsum.photos/seed/flame/100/100',
      content: 'Your "Node Integrity" has increased by 5%! Keep broadcasting.',
      timestamp: '1h',
      read: true,
    },
    {
      id: 'n4',
      type: 'comment',
      userId: 'u4',
      username: 'Tech_Orbit',
      userAvatar: 'https://picsum.photos/seed/tech/100/100',
      content: 'commented: "Flame AI rendering this is next level. 🔥"',
      timestamp: '3h',
      read: true,
    },
  ];

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-3xl rounded-[3rem] p-8 shadow-xl border border-pink-50 dark:border-gray-700 min-h-[600px] page-transition">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-syne font-black text-gradient tracking-tighter uppercase">Signal Matrix</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Recent Network Interactions</p>
      </div>

      <div className="space-y-4">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`flex items-center gap-4 p-5 rounded-3xl transition-all hover:bg-pink-50/50 dark:hover:bg-white/5 cursor-pointer ${notif.read ? 'opacity-80' : 'bg-pink-50/20 border-l-4 border-pink-500 shadow-sm'}`}
          >
            <div className="relative">
              <img src={notif.userAvatar} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" alt={notif.username} />
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${notif.type === 'like' ? 'bg-pink-500' : notif.type === 'follow' ? 'bg-blue-500' : 'bg-purple-500'} text-white border-2 border-white dark:border-gray-800`}>
                {notif.type === 'like' && <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>}
                {notif.type === 'follow' && <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>}
                {notif.type === 'ai' && <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
                {notif.type === 'comment' && <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-xs text-gray-700 dark:text-gray-200 leading-tight">
                <span className="font-black uppercase tracking-tight mr-1">@{notif.username}</span>
                <span className="font-medium">{notif.content}</span>
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{notif.timestamp} ago</p>
            </div>
            
            {!notif.read && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
          </div>
        ))}
      </div>
      
      {notifications.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.4em]">Signal void detected. Start broadcasting to receive pings.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
