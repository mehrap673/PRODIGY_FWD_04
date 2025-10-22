import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/contexts/socket-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Send, Smile, X, Reply, Mic } from "lucide-react";
import axios from 'axios';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import VoiceRecorder from "./voice-recorder";

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

interface MessageInputProps {
  activeChat: Chat;
  replyingTo: Message | null;
  editingMessage: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

export default function MessageInput({
  activeChat,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage: socketSendMessage, sendImage, sendAudio, editMessage, startTyping, stopTyping } = useSocket();

  useEffect(() => {
    if (editingMessage && editingMessage.content) {
      setMessage(editingMessage.content);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      }, 0);
    } else {
      setMessage("");
    }
  }, [editingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (editingMessage) {
      editMessage(editingMessage._id, message.trim());
      onCancelEdit();
    } else {
      socketSendMessage(activeChat.id, message.trim(), replyingTo?._id);
      if (replyingTo) {
        onCancelReply();
      }
    }

    setMessage("");
    handleStopTyping();

    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    if (value.trim() && !isTyping && !editingMessage) {
      setIsTyping(true);
      startTyping(activeChat.id);
    } else if (!value.trim() && isTyping) {
      handleStopTyping();
    }
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(activeChat.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      if (editingMessage) {
        onCancelEdit();
        setMessage("");
      }
      if (replyingTo) {
        onCancelReply();
      }
      if (showVoiceRecorder) {
        setShowVoiceRecorder(false);
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);

      setMessage(newMessage);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(message + emoji);
    }

    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/messages/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const imageUrl = response.data.data.url;
      sendImage(activeChat.id, imageUrl);
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAudioSent = (audioUrl: string) => {
    sendAudio(activeChat.id, audioUrl);
    setShowVoiceRecorder(false);
  };

  return (
    <div className="border-t border-border bg-background">
      {/* Reply/Edit Preview Bar */}
      {(replyingTo || editingMessage) && (
        <div className="border-b border-border bg-muted/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-10 rounded-full ${editingMessage ? 'bg-chart-4' : 'bg-primary'}`}></div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {editingMessage ? (
                  <span className="text-xs font-semibold text-chart-4">Editing message</span>
                ) : (
                  <>
                    <Reply className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">Replying to {replyingTo?.sender.name}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {editingMessage?.content || replyingTo?.content}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (editingMessage) {
                  onCancelEdit();
                  setMessage("");
                } else {
                  onCancelReply();
                }
              }}
              className="h-8 w-8 flex-shrink-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area - Fixed Height matching sidebar footer */}
      <div className="h-20 px-6 flex items-center">
        {showVoiceRecorder && !editingMessage ? (
          <VoiceRecorder
            receiverId={activeChat.id}
            onAudioSent={handleAudioSent}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <div className={`
              relative rounded-2xl transition-all duration-200
              ${isFocused
                ? 'bg-card ring-2 ring-ring shadow-lg'
                : 'bg-muted/50 hover:bg-muted/70'
              }
            `}>
              <div className="flex items-end gap-2 p-2">
                {/* Image Upload Button */}
                {!editingMessage && (
                  <>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={uploading}
                        className="h-9 w-9 flex-shrink-0 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all hover:scale-105 cursor-pointer"
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </span>
                      </Button>
                    </label>
                  </>
                )}

                {/* Text Input */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder={
                      editingMessage
                        ? "Edit your message..."
                        : `Message ${activeChat.name}...`
                    }
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      handleStopTyping();
                    }}
                    rows={1}
                    disabled={uploading}
                    className="resize-none min-h-[40px] max-h-[120px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground text-[15px] py-2.5 px-0 scrollbar-thin"
                    style={{ height: '40px' }}
                  />
                </div>

                {/* Emoji Picker */}
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all hover:scale-105"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="end"
                    className="w-full p-0 border-0 bg-transparent shadow-none"
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={350}
                      height={400}
                      searchPlaceholder="Search emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  </PopoverContent>
                </Popover>

                {/* Voice Button - Show when no message typed and not editing */}
                {!editingMessage && !message.trim() && (
                  <Button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 flex-shrink-0 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all hover:scale-105"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                )}

                {/* Send Button - Show when message is typed */}
                {message.trim() && (
                  <Button
                    type="submit"
                    disabled={uploading}
                    size="icon"
                    className={`
                      h-9 w-9 flex-shrink-0 rounded-xl transition-all duration-200 transform
                      ${editingMessage
                        ? 'bg-chart-4 hover:bg-chart-4/90'
                        : 'bg-primary hover:bg-primary/90'
                      } text-primary-foreground shadow-lg hover:scale-105
                    `}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
