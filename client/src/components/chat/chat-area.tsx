import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/socket-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { Star, Phone, Video, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Chat {
  id: string;
  name: string;
  type: 'room' | 'dm';
}

interface Message {
  _id: string;
  content?: string;
  image?: string;
  sender: {
    _id: string;
    name: string;
  };
  type: 'text' | 'image' | 'audio';
}

export default function ChatArea({ chat }: { chat: Chat | null }) {
  const { onlineUsers } = useSocket();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const getUserInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    setReplyingTo(null);
    setEditingMessage(null);
  }, [chat?.id]);

  if (!chat) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-card to-background">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div 
            className="h-full w-full" 
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Floating Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto px-6 text-center">
          {/* Icon with Enhanced Gradient */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
            
            <div className="relative w-20 h-20 rounded-2xl gradient-indigo-purple-pink flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
              <svg className="w-10 h-10 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3 text-gradient-indigo-purple">
            Start Chatting
          </h2>
          
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            Select a conversation to begin messaging. All chats are end-to-end encrypted.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: "🔒", label: "Secure" },
              { icon: "⚡", label: "Fast" },
              { icon: "🎯", label: "Private" }
            ].map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card backdrop-blur-sm border border-border text-muted-foreground text-sm hover:border-primary/50 transition-colors"
              >
                <span>{feature.icon}</span>
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const isOnline = onlineUsers.has(chat.id);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, hsl(var(--secondary) / 0.15) 0%, transparent 50%)`
        }}
      />

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-border">
                <AvatarFallback className="gradient-indigo-purple-pink text-primary-foreground font-semibold text-sm">
                  {getUserInitials(chat.name)}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-chart-4 rounded-full border-2 border-background animate-pulse"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-foreground truncate">{chat.name}</h1>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-chart-4 rounded-full"></span>
                    Active now
                  </>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>

          {/* Optional: Action buttons */}
          <div className="flex items-center gap-2">
            {/* Add any header actions here if needed */}
          </div>
        </div>
      </header>

      {/* Message List */}
      <MessageList 
        activeChat={chat} 
        onReply={(message: Message) => {
          setEditingMessage(null);
          setReplyingTo(message);
        }}
        onEdit={(message: Message) => {
          setReplyingTo(null);
          setEditingMessage(message);
        }}
      />

      {/* Message Input */}
      <MessageInput 
        activeChat={chat}
        replyingTo={replyingTo}
        editingMessage={editingMessage}
        onCancelReply={() => setReplyingTo(null)}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
