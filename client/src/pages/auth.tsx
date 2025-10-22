import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/Logo.jpg";
import {
  MessageSquare,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users,
  Eye,
  EyeOff
} from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      setLocation('/');
    }
  }, [user, authLoading, setLocation]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      } else {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        await register(formData.name, formData.email, formData.password);
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-8 xl:p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 xl:mb-16">
            <img src={logo} className="w-12 h-12 rounded-2xl" alt="ChatSphere Logo" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">ChatSphere</h1>
              <p className="text-xs text-muted-foreground">Real-time messaging</p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
              Connect with your friends in real-time
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Experience seamless communication with powerful features designed for modern conversations.
            </p>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Real-time messaging with zero lag</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">Your conversations stay private</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Easy Connections</h3>
                  <p className="text-sm text-muted-foreground">Connect with friends instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-indigo-purple-pink flex items-center justify-center shadow-2xl">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ChatSphere</h1>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-8 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl gradient-indigo-purple flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {isLogin ? 'Welcome back' : 'Get started'}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? 'Sign in to continue to your account'
                  : 'Create your account to get started'
                }
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 px-6 sm:px-8 mb-6">
              <button
                data-testid="tab-login"
                onClick={() => setIsLogin(true)}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300
                  ${isLogin
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                `}
              >
                Sign In
              </button>
              <button
                data-testid="tab-register"
                onClick={() => setIsLogin(false)}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300
                  ${!isLogin
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                `}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8 space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      data-testid="input-name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 pl-12 pr-4 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground focus-ring-indigo transition-all"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 pl-12 pr-4 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground focus-ring-indigo transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 pl-12 pr-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground focus-ring-indigo transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      data-testid="input-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-12 pl-12 pr-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground focus-ring-indigo transition-all"
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, rememberMe: checked as boolean })
                      }
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                    Forgot password?
                  </a>
                </div>
              )}

              <Button
                data-testid="button-submit"
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* Mobile Features - Only visible on mobile */}
          <div className="lg:hidden mt-8 space-y-6">
            <div className="flex items-start gap-4 px-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Real-time messaging with zero lag</p>
              </div>
            </div>

            <div className="flex items-start gap-4 px-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Your conversations stay private</p>
              </div>
            </div>

            <div className="flex items-start gap-4 px-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">Easy Connections</h3>
                <p className="text-sm text-muted-foreground">Connect with friends instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
