import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
          <div className="relative w-20 h-20 rounded-2xl gradient-indigo-purple-pink flex items-center justify-center shadow-lg">
            <MessageSquare className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Conversation Selected
          </h2>
          <p className="text-muted-foreground">
            Select a conversation from the sidebar to start chatting, or create a new channel to begin.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {[
            { icon: "💬", label: "Real-time Chat" },
            { icon: "🔒", label: "Secure" },
            { icon: "⚡", label: "Fast" }
          ].map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground text-xs"
            >
              <span>{feature.icon}</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
