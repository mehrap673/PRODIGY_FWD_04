import { useState, useEffect } from "react";
import { contactAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Search,
  UserPlus,
  Mail,
  Loader2,
  Users,
  Check,
} from "lucide-react";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded?: () => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const { toast } = useToast();

  // Search users with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await contactAPI.searchUsers(searchQuery);
        setSearchResults(response.data.data.users);
      } catch (error: any) {
        console.error('Search error:', error);
        toast({
          title: "Search failed",
          description: error.response?.data?.message || "Failed to search users",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSendingRequest(null);
    onClose();
  };

  const handleAddContact = async (user: User) => {
    setSendingRequest(user._id);
    try {
      await contactAPI.sendRequest(user._id);
      toast({
        title: "Friend request sent!",
        description: `Request sent to ${user.name}`,
      });

      // Remove user from search results after sending request
      setSearchResults(prev => prev.filter(u => u._id !== user._id));

      // Call callback to refresh contacts
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send friend request",
        variant: "destructive",
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-indigo-purple flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-xl">Add Contact</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Search for users to connect with</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 pt-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Search by name or email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type at least 2 characters to search"
                className="h-10 pl-9 pr-9 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground rounded-lg focus-ring-indigo"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="min-h-[300px] max-h-[400px] overflow-y-auto space-y-2 scrollbar-thin">
            {searchQuery.trim().length < 2 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Start typing to search for users</p>
                  <p className="text-xs text-muted-foreground mt-1">Enter a name or email to find friends</p>
                </div>
              </div>
            ) : isSearching ? (
              <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">No users found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try searching with a different name or email</p>
                </div>
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="gradient-indigo-purple text-primary-foreground font-bold">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddContact(user)}
                    disabled={sendingRequest === user._id}
                    className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs flex-shrink-0"
                  >
                    {sendingRequest === user._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Info Box */}
          {searchResults.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary">
                Tip: Once they accept your request, you can start chatting with them.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
