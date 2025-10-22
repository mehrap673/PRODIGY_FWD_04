import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import Sidebar from "@/components/chat/sidebar";
import ChatArea from "@/components/chat/chat-area";
import Profile from "@/components/chat/profile";
import { Menu, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Chat {
  id: string;
  name: string;
  type: 'room' | 'dm';
  avatar?: string;
}

type ViewMode = 'sidebar' | 'chat' | 'profile';

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('sidebar');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/30"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-primary absolute top-0 left-0"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  // Handle chat selection
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setViewMode('chat');
    setIsMobileSidebarOpen(false);
  };

  // Handle profile open
  const handleOpenProfile = () => {
    setViewMode('profile');
    setIsMobileSidebarOpen(false);
  };

  // Handle back to sidebar
  const handleBackToSidebar = () => {
    setViewMode('sidebar');
    setSelectedChat(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-xl border-b border-border px-4 flex items-center justify-between shadow-lg">
        {viewMode !== 'sidebar' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSidebar}
            className="hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="hover:bg-muted"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </Button>
        )}
        <h1 className="text-lg font-bold text-foreground truncate">
          {viewMode === 'profile' ? 'ChatSphere' : viewMode === 'chat' && selectedChat ? selectedChat.name : 'ChatSphere'}
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Sidebar - Desktop always visible, Mobile overlay */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar 
          onSelectChat={handleSelectChat}
          onOpenProfile={handleOpenProfile}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area - Conditional Rendering Based on View Mode */}
      <div className="flex-1 flex flex-col pt-16 lg:pt-0">
        {viewMode === 'profile' ? (
          <Profile onClose={handleBackToSidebar} />
        ) : (
          <ChatArea chat={selectedChat} />
        )}
      </div>
    </div>
  );
}
