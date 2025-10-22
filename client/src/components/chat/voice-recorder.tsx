import { useState, useRef } from "react";
import { useSocket } from "@/contexts/socket-context";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send, X } from "lucide-react";
import axios from 'axios';

interface VoiceRecorderProps {
  receiverId: string;
  onAudioSent: (audioUrl: string) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ receiverId, onAudioSent, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel();
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-note.webm');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/messages/upload/audio',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const audioUrl = response.data.data.url;
      
      // Pass the audio URL back to parent component
      onAudioSent(audioUrl);
      
      // Reset
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error: any) {
      console.error('Audio upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload audio');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative rounded-2xl bg-card/80 backdrop-blur-sm border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-4 h-4 bg-destructive rounded-full animate-ping"></div>
              <div className="relative w-3 h-3 bg-destructive rounded-full"></div>
            </div>
            <span className="text-sm text-muted-foreground font-mono tabular-nums">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Audio preview */}
        {audioBlob && !isRecording && (
          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mic className="w-4 h-4" />
              <span className="text-sm">Voice message</span>
            </div>
            <audio 
              src={URL.createObjectURL(audioBlob)} 
              controls 
              className="flex-1 h-9 rounded-lg"
              style={{ maxWidth: '300px' }}
            />
          </div>
        )}

        {/* Start recording prompt */}
        {!isRecording && !audioBlob && (
          <div className="flex-1 flex items-center gap-2 text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span className="text-sm">Click record to start voice message</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Start Recording Button */}
          {!isRecording && !audioBlob && (
            <Button
              type="button"
              onClick={startRecording}
              size="icon"
              className="h-10 w-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:scale-105 transition-transform"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}

          {/* Stop Recording Button */}
          {isRecording && (
            <Button
              type="button"
              onClick={stopRecording}
              size="icon"
              className="h-10 w-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          )}

          {/* Preview Controls */}
          {audioBlob && !isRecording && (
            <>
              <Button
                type="button"
                onClick={cancelRecording}
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                onClick={sendAudio}
                disabled={uploading}
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:scale-105 transition-transform"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </>
          )}

          {/* Cancel Button */}
          {!audioBlob && (
            <Button
              type="button"
              onClick={cancelRecording}
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar for recording */}
      {isRecording && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-destructive transition-all duration-300"
            style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
