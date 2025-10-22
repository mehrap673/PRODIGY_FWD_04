import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, LogOut, Search, X, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { contactAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import logo from "../../assets/Logo.jpg";
import axios from 'axios';

interface Contact {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    unreadCount?: number;
}

interface ContactRequest {
    _id: string;
    from: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    to: {
        _id: string;
        name: string;
        email: string;
    };
    status: string;
    createdAt: string;
}

export interface Chat {
    id: string;
    name: string;
    type: 'room' | 'dm';
    avatar?: string;
}

interface ContactsSidebarProps {
    onSelectChat?: (chat: Chat) => void;
    onOpenProfile?: () => void;
}

export default function ContactsSidebar({ onSelectChat, onOpenProfile }: ContactsSidebarProps) {
    const [search, setSearch] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [searchResults, setSearchResults] = useState<Contact[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
    const [totalUnread, setTotalUnread] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const { user, logout } = useAuth();
    const { onlineUsers, socket } = useSocket();
    const { toast } = useToast();
    // Initialize theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const isDark = savedTheme === 'dark';
        setIsDarkMode(isDark);

        const html = document.querySelector('html');
        if (html) {
            if (isDark) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
        }
    }, []);



    // Toggle theme
    const toggleTheme = () => {
        const html = document.documentElement;
        const newIsDark = !isDarkMode;

        // Update state
        setIsDarkMode(newIsDark);

        // Update localStorage
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');

        // Update HTML class
        if (newIsDark) {
            html.classList.add('dark');
            html.classList.remove('light');
        } else {
            html.classList.remove('dark');
            html.classList.add('light');
        }

        console.log('Theme switched to:', newIsDark ? 'dark' : 'light');
        console.log('HTML classes:', html.className);
    };




    // Load contacts on mount
    useEffect(() => {
        loadContacts();
        loadRequests();
        loadUnreadCounts();
    }, []);

    // Listen for new messages to update unread counts
    useEffect(() => {
        if (!socket) return;

        socket.on('message:receive', (message: any) => {
            // Increment unread count for sender
            setUnreadCounts((prev) => ({
                ...prev,
                [message.sender._id]: (prev[message.sender._id] || 0) + 1,
            }));
            setTotalUnread((prev) => prev + 1);

            // Show browser notification
            if (Notification.permission === 'granted' && document.hidden) {
                new Notification(message.sender.name, {
                    body: message.type === 'text'
                        ? message.content
                        : message.type === 'image'
                            ? '📷 Photo'
                            : '🎤 Voice message',
                    icon: message.sender.avatar || '/logo.png',
                });
            }
        });

        return () => {
            socket.off('message:receive');
        };
    }, [socket]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const loadContacts = async () => {
        try {
            const response = await contactAPI.getContacts();
            setContacts(response.data.data.contacts);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    const loadRequests = async () => {
        try {
            const response = await contactAPI.getPendingRequests();
            setRequests(response.data.data.requests);
        } catch (error) {
            console.error('Failed to load requests:', error);
        }
    };

    const loadUnreadCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/messages/unread/count',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const counts = response.data.data.unreadBySender || {};
                setUnreadCounts(counts);

                // Calculate total
                const total = Object.values(counts).reduce((sum: number, count: any) => sum + count, 0);
                setTotalUnread(total);
            }
        } catch (error) {
            console.error('Failed to load unread counts:', error);
        }
    };

    // Search users
    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await contactAPI.searchUsers(query);
            setSearchResults(response.data.data.users);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Send friend request
    const handleSendRequest = async (userId: string) => {
        setLoading(true);
        try {
            await contactAPI.sendRequest(userId);
            toast({
                title: "Success",
                description: "Friend request sent!",
            });
            setSearchResults([]);
            setSearchQuery("");
            setIsAddModalOpen(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to send request",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Accept request
    const handleAcceptRequest = async (requestId: string) => {
        try {
            await contactAPI.acceptRequest(requestId);
            toast({
                title: "Success",
                description: "Contact request accepted!",
            });
            loadContacts();
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to accept request",
                variant: "destructive",
            });
        }
    };

    // Reject request
    const handleRejectRequest = async (requestId: string) => {
        try {
            await contactAPI.rejectRequest(requestId);
            toast({
                title: "Success",
                description: "Contact request rejected",
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to reject request",
                variant: "destructive",
            });
        }
    };

    const handleSelectChat = (contact: Contact) => {
        // Clear unread count for this contact
        setUnreadCounts((prev) => {
            const updated = { ...prev };
            const count = updated[contact._id] || 0;
            delete updated[contact._id];
            setTotalUnread((prevTotal) => Math.max(0, prevTotal - count));
            return updated;
        });

        onSelectChat?.({
            id: contact._id,
            name: contact.name,
            type: 'dm',
            avatar: contact.avatar,
        });
    };

    const filteredContacts = contacts.filter(
        (contact) =>
            contact.name.toLowerCase().includes(search.toLowerCase()) ||
            contact.email.toLowerCase().includes(search.toLowerCase())
    );

    const getUserInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <aside className="flex flex-col h-screen w-80 bg-background border-r border-border">
            {/* Header: Logo and App Name */}
            <div className="p-3 border-b border-border bg-background sticky top-0 z-10 flex items-center gap-3">
                <img src={logo} alt="ChatSphere Logo" className="w-10 h-10 rounded-xl" />
                <h1 className="text-2xl font-extrabold text-primary select-none tracking-wide">
                    CHATSPHERE
                </h1>
            </div>

            {/* Search bar and Add button */}
            <div className="p-4 border-b border-border bg-background sticky top-[68px] z-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        Contacts
                        {totalUnread > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground h-5 px-2 text-xs font-bold badge-pulse">
                                {totalUnread} unread
                            </Badge>
                        )}
                    </h2>

                    {/* Add Contact Dialog */}
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="ml-1 text-sm">Add</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Add New Contact</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Search for users by name or email
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                        placeholder="Search users..."
                                        className="pl-10 bg-muted border-border text-foreground"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setSearchResults([]);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Search Results */}
                                <ScrollArea className="h-64">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="space-y-2">
                                            {searchResults.map((result) => (
                                                <div
                                                    key={result._id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarImage src={result.avatar} />
                                                            <AvatarFallback className="gradient-indigo-purple text-primary-foreground font-bold text-sm">
                                                                {getUserInitials(result.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{result.name}</p>
                                                            <p className="text-xs text-muted-foreground">{result.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSendRequest(result._id)}
                                                        disabled={loading}
                                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : searchQuery ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Start typing to search users
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="h-9 bg-card border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus-ring-indigo"
                />
            </div>

            {/* Requests & Contacts List */}
            <ScrollArea className="flex-1 px-2 py-2">
                {/* Contact Requests */}
                {requests.length > 0 && (
                    <div className="mb-5">
                        <h3 className="text-sm text-destructive font-semibold mb-2 px-1">
                            Requests ({requests.length})
                        </h3>
                        {requests.map((req) => (
                            <div
                                key={req._id}
                                className="flex items-center justify-between bg-card rounded-xl px-3 py-2 mb-2"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarImage src={req.from.avatar} />
                                        <AvatarFallback className="gradient-indigo-purple text-primary-foreground font-bold text-xs">
                                            {getUserInitials(req.from.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-foreground truncate">{req.from.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{req.from.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0 ml-2">
                                    <Button
                                        size="sm"
                                        className="bg-chart-4 hover:bg-chart-4/90 text-primary-foreground rounded px-2 py-1 h-7 text-xs"
                                        onClick={() => handleAcceptRequest(req._id)}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded px-2 py-1 h-7 text-xs"
                                        onClick={() => handleRejectRequest(req._id)}
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact List */}
                <h3 className="text-sm text-muted-foreground font-semibold mb-2 px-1">
                    All Contacts ({filteredContacts.length})
                </h3>
                {filteredContacts.length === 0 ? (
                    <div className="py-12 text-center opacity-60 text-foreground text-sm">
                        No contacts yet. Click "Add" to find friends!
                    </div>
                ) : (
                    filteredContacts.map((contact) => {
                        const online = onlineUsers?.has(contact._id);
                        const unreadCount = unreadCounts[contact._id] || 0;

                        return (
                            <div
                                key={contact._id}
                                onClick={() => handleSelectChat(contact)}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-card transition-all mb-1 cursor-pointer group"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="relative">
                                        <Avatar className="w-9 h-9 flex-shrink-0">
                                            <AvatarImage src={contact.avatar} />
                                            <AvatarFallback className="bg-muted text-foreground font-bold text-xs">
                                                {getUserInitials(contact.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {online && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-chart-4 rounded-full border-2 border-background"></div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-foreground truncate font-medium">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                                    </div>

                                    {/* Unread Count Badge */}
                                    {unreadCount > 0 && (
                                        <Badge className="bg-destructive text-destructive-foreground h-5 min-w-[20px] px-1.5 text-[10px] font-bold flex-shrink-0">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </ScrollArea>

            {/* User Profile Section */}
            <footer className="h-20 border-t border-border bg-background flex items-center px-4">
                <div className="flex items-center justify-between gap-2 w-full">
                    {/* Profile Button */}
                    <button
                        onClick={() => onOpenProfile?.()}
                        className="flex items-center gap-2 hover:bg-card rounded-lg p-2 transition-colors flex-1 min-w-0"
                    >
                        <Avatar className="w-9 h-9 flex-shrink-0">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="gradient-indigo-purple text-primary-foreground font-bold text-xs">
                                {user ? getUserInitials(user.name) : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate font-medium">{user?.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                        </div>
                    </button>

                    {/* Theme Toggle & Logout Buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-accent h-9 w-9 p-0"
                            onClick={toggleTheme}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? (
                                <Sun className="w-4 h-4 text-primary" />
                            ) : (
                                <Moon className="w-4 h-4 text-primary" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-destructive/10 h-9 w-9 p-0"
                            onClick={logout}
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </footer>
        </aside>
    );
}
