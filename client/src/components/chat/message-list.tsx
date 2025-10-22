import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import axios from 'axios';
import {
  CheckCheck,
  Smile,
  MoreVertical,
  Copy,
  Trash2,
  Reply,
  Edit,
  Play,
  Pause,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
  };
  content?: string;
  image?: string;
  audio?: string;
  type: 'text' | 'image' | 'audio';
  isRead: boolean;
  createdAt: string;
  reactions?: { user: string; emoji: string }[];
  replyTo?: {
    _id: string;
    content?: string;
    image?: string;
    audio?: string;
    type: 'text' | 'image' | 'audio';
    sender: {
      _id: string;
      name: string;
    };
  };
}

interface Chat {
  id: string;
  name: string;
  type: 'room' | 'dm';
}

interface MessageListProps {
  activeChat: Chat;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export default function MessageList({ activeChat, onReply, onEdit }: MessageListProps) {
  const { user } = useAuth();
  const { socket, markAsRead, toggleReaction } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openReactions, setOpenReactions] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDurations, setAudioDurations] = useState<{ [key: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/messages/chat/${activeChat.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(response.data.data.messages);
        markAsRead(activeChat.id);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    if (activeChat) {
      loadMessages();
    }
  }, [activeChat]);

  useEffect(() => {
    if (!socket) return;

    const addMessageIfNotExists = (newMessage: Message) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    socket.on('message:receive', (message: Message) => {
      if (
        message.sender._id === activeChat.id ||
        message.receiver._id === activeChat.id
      ) {
        addMessageIfNotExists(message);
        markAsRead(activeChat.id);
      }
    });

    socket.on('message:sent', (message: Message) => {
      addMessageIfNotExists(message);
    });

    socket.on('message:edited', (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    socket.on('message:deleted', (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    });

    socket.on('message:reacted', (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    socket.on('typing:start', (data: { userId: string }) => {
      if (data.userId === activeChat.id) {
        setTypingUser(activeChat.name);
      }
    });

    socket.on('typing:stop', (data: { userId: string }) => {
      if (data.userId === activeChat.id) {
        setTypingUser(null);
      }
    });

    return () => {
      socket.off('message:receive');
      socket.off('message:sent');
      socket.off('message:edited');
      socket.off('message:deleted');
      socket.off('message:reacted');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOwnMessage = (message: Message) => message.sender._id === user?.id;

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;
    return !isSameDay(new Date(currentMessage.createdAt), new Date(previousMessage.createdAt));
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setOpenDropdown(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setOpenDropdown(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
    setOpenReactions(null);
  };

  const toggleAudioPlayback = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;

    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      Object.entries(audioRefs.current).forEach(([id, audioEl]) => {
        if (id !== messageId) {
          audioEl.pause();
        }
      });
      audio.play();
      setPlayingAudio(messageId);
    }
  };

  const handleAudioTimeUpdate = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    setAudioProgress((prev) => ({ ...prev, [messageId]: audio.currentTime }));
  };

  const handleAudioLoadedMetadata = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    setAudioDurations((prev) => ({ ...prev, [messageId]: audio.duration }));
  };

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto px-6 py-6 max-w-full sm:max-w-4xl">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="w-20 h-20 rounded-2xl gradient-indigo-purple-pink flex items-center justify-center mb-6 border border-border">
              <Smile className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Be the first to send a message and start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
              const isOwn = isOwnMessage(message);
              const isGrouped = !showAvatar;
              const currentTime = audioProgress[message._id] || 0;
              const duration = audioDurations[message._id] || 0;

              return (
                <div key={message._id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl"></div>
                        <span className="relative text-xs font-medium text-muted-foreground px-4 py-1.5 rounded-full bg-card backdrop-blur-sm border border-border">
                          {formatDateSeparator(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className={`group/message hover:bg-muted/30 rounded-xl transition-colors py-1 px-4 -mx-4 ${isGrouped ? 'mt-0.5' : 'mt-4'}`}>
                    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-8">
                        {showAvatar && !isOwn && (
                          <Avatar className="w-8 h-8 ring-2 ring-border">
                            <AvatarFallback className="gradient-indigo-purple-pink text-primary-foreground font-semibold text-xs">
                              {getUserInitials(message.sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex-1 min-w-0 max-w-[75%] ${isOwn ? 'flex flex-col items-end' : ''}`}>
                        {/* Header */}
                        {showAvatar && (
                          <div className={`flex items-baseline gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-semibold text-foreground">
                              {isOwn ? 'You' : message.sender.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        )}

                        {/* Message Bubble with Menu */}
                        <div className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {/* Message Bubble */}
                          <div className="relative">
                            <div
                              className={`
                                group/bubble relative rounded-2xl transition-all
                                ${isOwn
                                  ? 'bg-primary text-primary-foreground shadow-lg'
                                  : 'bg-card text-foreground border border-border'
                                }
                                ${isGrouped && !isOwn ? 'rounded-tl-md' : ''}
                                ${isGrouped && isOwn ? 'rounded-tr-md' : ''}
                                ${message.type === 'audio' ? 'px-3 py-2.5' : 'px-4 py-2.5'}
                              `}
                            >
                              {/* Reply Preview */}
                              {message.replyTo && (
                                <div className={`mb-2 pb-2 border-b ${isOwn ? 'border-primary-foreground/30' : 'border-border'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Reply className="w-3 h-3 opacity-60" />
                                    <span className="text-xs opacity-70">
                                      {message.replyTo.sender._id === user?.id ? 'You' : message.replyTo.sender.name}
                                    </span>
                                  </div>
                                  <div className={`text-xs opacity-70 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {message.replyTo.type === 'text' && message.replyTo.content && (
                                      <p className="truncate">{message.replyTo.content}</p>
                                    )}
                                    {message.replyTo.type === 'image' && <p className="italic">📷 Photo</p>}
                                    {message.replyTo.type === 'audio' && <p className="italic">🎤 Voice message</p>}
                                  </div>
                                </div>
                              )}

                              {/* Text Content */}
                              {message.type === 'text' && message.content && (
                                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              )}

                              {/* Image Content */}
                              {message.type === 'image' && message.image && (
                                <div className="rounded-xl overflow-hidden">
                                  <img
                                    src={message.image}
                                    alt="Shared image"
                                    className="w-full max-w-full rounded-xl object-cover"
                                    style={{ maxHeight: '400px' }}
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              {/* Audio Content - Custom Player with Progress */}
                              {message.type === 'audio' && message.audio && (
                                <div className="flex items-center gap-3 min-w-[280px]">
                                  <button
                                    onClick={() => toggleAudioPlayback(message._id)}
                                    className={`
                                      w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                                      ${isOwn
                                        ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                                        : 'bg-muted hover:bg-muted/70'
                                      }
                                    `}
                                  >
                                    {playingAudio === message._id ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                  </button>

                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-0.5">
                                      {[...Array(30)].map((_, i) => {
                                        const barProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
                                        const barIndex = (i / 30) * 100;
                                        const isActive = barProgress >= barIndex;

                                        return (
                                          <div
                                            key={i}
                                            className={`w-0.5 rounded-full transition-all ${isOwn
                                                ? isActive ? 'bg-primary-foreground' : 'bg-primary-foreground/30'
                                                : isActive ? 'bg-primary' : 'bg-muted'
                                              }`}
                                            style={{
                                              height: `${Math.random() * 16 + 8}px`,
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                    <span className="text-xs opacity-70 font-mono tabular-nums">
                                      {duration > 0 ? formatAudioTime(currentTime) : '0:00'}
                                    </span>
                                  </div>

                                  <audio
                                    ref={(el) => {
                                      if (el) audioRefs.current[message._id] = el;
                                    }}
                                    src={message.audio}
                                    onTimeUpdate={() => handleAudioTimeUpdate(message._id)}
                                    onLoadedMetadata={() => handleAudioLoadedMetadata(message._id)}
                                    onEnded={() => setPlayingAudio(null)}
                                    onPause={() => setPlayingAudio(null)}
                                    className="hidden"
                                  />
                                </div>
                              )}

                              {/* Status */}
                              {isOwn && message.type === 'text' && (
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                  <span className="text-[10px] text-primary-foreground/60">
                                    {format(new Date(message.createdAt), 'h:mm a')}
                                  </span>
                                  <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/60" />
                                </div>
                              )}
                            </div>

                            {/* Reactions Display + Quick React Button */}
                            <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              {/* Existing Reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(
                                    message.reactions.reduce((acc, reaction) => {
                                      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>)
                                  ).map(([emoji, count]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message._id, emoji)}
                                      className="px-2 py-0.5 bg-muted hover:bg-accent border border-border rounded-full text-xs flex items-center gap-1 transition-colors"
                                    >
                                      <span>{emoji}</span>
                                      {count > 1 && <span className="text-muted-foreground">{count}</span>}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Add Emoji Button */}
                              <Popover open={openReactions === message._id} onOpenChange={(open) => setOpenReactions(open ? message._id : null)}>
                                <PopoverTrigger asChild>
                                  <button
                                    className="w-6 h-6 rounded-full bg-muted hover:bg-accent border border-border flex items-center justify-center transition-colors opacity-0 group-hover/message:opacity-100"
                                  >
                                    <Smile className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  align={isOwn ? "end" : "start"}
                                  className="w-auto p-2 bg-card border-border"
                                >
                                  <div className="flex gap-1">
                                    {QUICK_REACTIONS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReaction(message._id, emoji)}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-xl"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          {/* Menu Bar - Outside Bubble */}
                          <div className={`
                            flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity flex-shrink-0
                          `}>
                            {/* More Options */}
                            <DropdownMenu
                              open={openDropdown === message._id}
                              onOpenChange={(open) => setOpenDropdown(open ? message._id : null)}
                            >
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-1.5 rounded-lg bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align={isOwn ? "start" : "end"}
                                side="top"
                                className="bg-card border-border min-w-[180px]"
                                sideOffset={5}
                              >
                                {/* Reply - Available for ALL messages */}
                                <DropdownMenuItem
                                  onClick={() => {
                                    onReply(message);
                                    setOpenDropdown(null);
                                  }}
                                  className="text-foreground hover:bg-muted cursor-pointer"
                                >
                                  <Reply className="w-4 h-4 mr-2" />
                                  Reply
                                </DropdownMenuItem>

                                {/* Copy - Available for ALL text messages */}
                                {message.content && (
                                  <DropdownMenuItem
                                    onClick={() => handleCopyMessage(message.content!)}
                                    className="text-foreground hover:bg-muted cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Text
                                  </DropdownMenuItem>
                                )}

                                {/* Edit and Delete - Only for OWN messages */}
                                {isOwn && (
                                  <>
                                    <DropdownMenuSeparator className="bg-border" />

                                    {/* Edit - Only for text messages */}
                                    {message.content && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          onEdit(message);
                                          setOpenDropdown(null);
                                        }}
                                        className="text-foreground hover:bg-muted cursor-pointer"
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Message
                                      </DropdownMenuItem>
                                    )}

                                    {/* Delete */}
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteMessage(message._id)}
                                      className="text-destructive hover:bg-destructive/10 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Message
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUser && (
              <div className="py-1 px-4 -mx-4 mt-4 animate-in fade-in duration-300">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8">
                    <Avatar className="w-8 h-8 ring-2 ring-border">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 inline-flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
