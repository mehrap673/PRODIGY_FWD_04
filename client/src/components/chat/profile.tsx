import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Clock,
  Edit2,
  Check,
  X,
  Camera,
  LogOut,
  ArrowLeft,
  Shield,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { userAPI } from "@/lib/api";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface ProfileProps {
  onClose?: () => void;
}

export default function Profile({ onClose }: ProfileProps) {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getMe();
      console.log('Profile response:', response.data);

      if (response.data.success) {
        setProfileData(response.data.data.user);
        setNewName(response.data.data.user.name);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === profileData?.name) {
      setEditingName(false);
      return;
    }

    if (newName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await userAPI.updateProfile({ name: newName.trim() });

      if (response.data.success) {
        setProfileData((prev) => prev ? { ...prev, name: newName.trim() } : null);
        setEditingName(false);
        toast({
          title: "Success",
          description: "Name updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update name",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', file);

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      console.log('Starting upload...');
      
      const response = await userAPI.updateAvatar(file);
      
      console.log('Upload response:', response.data);

      if (response.data.success) {
        const newAvatar = response.data.data.avatar;
        
        console.log('New avatar URL:', newAvatar);
        
        if (newAvatar) {
          setProfileData((prev) =>
            prev ? { ...prev, avatar: newAvatar } : null
          );
          
          toast({
            title: "Success",
            description: "Profile picture updated successfully",
          });
        }
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await userAPI.changePassword(currentPassword, newPassword);

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastSeen = (date: Date) => {
    const lastSeen = new Date(date);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return format(lastSeen, 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-muted-foreground text-lg">Failed to load profile</p>
        <Button onClick={loadProfile} className="bg-primary hover:bg-primary/90">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header - Fixed */}
      <div className="relative z-10 border-b border-border bg-card backdrop-blur-xl flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="relative group mb-4">
                      <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                        <AvatarImage src={profileData.avatar} key={profileData.avatar} />
                        <AvatarFallback className="gradient-indigo-purple-pink text-primary-foreground font-bold text-4xl">
                          {getUserInitials(profileData.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Upload Button */}
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-foreground font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Camera className="w-8 h-8 text-foreground" />
                            <span className="text-xs text-foreground font-medium">Change Photo</span>
                          </div>
                        )}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>

                    {/* Status Badge */}
                    <Badge className={`mb-4 ${profileData.isOnline ? 'bg-chart-4 hover:bg-chart-4/90' : 'bg-muted hover:bg-muted/70'}`}>
                      {profileData.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </Badge>

                    {/* Name */}
                    <h2 className="text-2xl font-bold text-foreground text-center mb-1">
                      {profileData.name}
                    </h2>

                    {/* Email */}
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {profileData.email}
                    </p>

                    {/* Last Seen */}
                    {!profileData.isOnline && profileData.lastSeen && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Last seen {formatLastSeen(profileData.lastSeen)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Settings */}
            <div className="lg:col-span-2 space-y-6 pb-8">
              {/* Personal Information */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">Display Name</Label>
                    <div className="flex gap-2">
                      {editingName ? (
                        <>
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                            className="flex-1 bg-input border-border text-foreground focus-ring-indigo"
                            placeholder="Enter your name"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            onClick={handleUpdateName}
                            className="bg-chart-4 hover:bg-chart-4/90 flex-shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditingName(false);
                              setNewName(profileData.name);
                            }}
                            className="border-border hover:bg-muted flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={profileData.name}
                            disabled
                            className="flex-1 bg-muted border-border text-foreground cursor-not-allowed"
                          />
                          <Button
                            size="icon"
                            onClick={() => setEditingName(true)}
                            className="bg-primary hover:bg-primary/90 flex-shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email Address
                    </Label>
                    <Input
                      value={profileData.email}
                      disabled
                      className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">User ID</Label>
                    <Input
                      value={profileData.id}
                      disabled
                      className="bg-muted border-border text-muted-foreground font-mono text-xs cursor-not-allowed"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your current password and choose a new secure password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">Current Password</Label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="bg-input border-border text-foreground focus-ring-indigo"
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">New Password</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-input border-border text-foreground focus-ring-indigo"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-input border-border text-foreground focus-ring-indigo"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}
              className="border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-primary hover:bg-primary/90"
            >
              {changingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
