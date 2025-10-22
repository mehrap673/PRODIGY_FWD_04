import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  unreadCount: number;
  sendMessage: (receiverId: string, content: string, replyToId?: string) => void;
  sendImage: (receiverId: string, imageUrl: string) => void;
  sendAudio: (receiverId: string, audioUrl: string) => void;
  editMessage: (messageId: string, content: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  startTyping: (receiverId: string) => void;
  stopTyping: (receiverId: string) => void;
  markAsRead: (senderId: string) => void;
  refreshUnreadCount: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // Fetch unread count
  const refreshUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages/unread/count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Show browser notification
  const showNotification = (title: string, body: string, icon?: string) => {
    if (notificationPermission === 'granted' && document.hidden) {
      new Notification(title, {
        body,
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: 'new-message',
        requireInteraction: false,
      });
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      newSocket.emit('user:online');
      refreshUnreadCount(); // Load unread count on connect
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('user:status', (data: { userId: string; isOnline: boolean }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (data.isOnline) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    });

    // Listen for incoming messages and show notification
    newSocket.on('message:receive', (message: any) => {
      // Show notification
      showNotification(
        message.sender.name,
        message.type === 'text' 
          ? message.content 
          : message.type === 'image' 
          ? '📷 Sent a photo' 
          : '🎤 Sent a voice message',
        message.sender.avatar
      );
      
      // Increment unread count
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const sendMessage = (receiverId: string, content: string, replyToId?: string) => {
    if (!socket) return;
    socket.emit('message:send', {
      receiverId,
      content,
      type: 'text',
      ...(replyToId && { replyTo: replyToId }),
    });
  };

  const sendImage = (receiverId: string, imageUrl: string) => {
    if (!socket) return;
    socket.emit('message:send', {
      receiverId,
      image: imageUrl,
      type: 'image',
    });
  };

  const sendAudio = (receiverId: string, audioUrl: string) => {
    if (!socket) return;
    socket.emit('message:send', {
      receiverId,
      audio: audioUrl,
      type: 'audio',
    });
  };

  const editMessage = (messageId: string, content: string) => {
    if (!socket) return;
    socket.emit('message:edit', { messageId, content });
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('message:reaction', { messageId, emoji });
  };

  const startTyping = (receiverId: string) => {
    if (!socket) return;
    socket.emit('typing:start', { receiverId });
  };

  const stopTyping = (receiverId: string) => {
    if (!socket) return;
    socket.emit('typing:stop', { receiverId });
  };

  const markAsRead = (senderId: string) => {
    if (!socket) return;
    socket.emit('message:read', { senderId });
    refreshUnreadCount(); // Refresh count after marking as read
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        unreadCount,
        sendMessage,
        sendImage,
        sendAudio,
        editMessage,
        toggleReaction,
        startTyping,
        stopTyping,
        markAsRead,
        refreshUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
