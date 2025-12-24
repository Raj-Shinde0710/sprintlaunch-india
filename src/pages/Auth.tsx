import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Rocket, 
  Mail, 
  Lock, 
  ArrowRight, 
  User, 
  Lightbulb, 
  Code, 
  TrendingUp,
  ArrowLeft,
  Check
} from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

type AuthMode = "login" | "signup" | "forgot-password";
type UserRole = "founder" | "builder" | "backer";

const roles = [
  {
    id: "founder" as UserRole,
    label: "Idea Founder",
    description: "I have an idea and need a team",
    icon: Lightbulb,
    color: "founder",
  },
  {
    id: "builder" as UserRole,
    label: "Skilled Builder",
    description: "I have skills to contribute",
    icon: Code,
    color: "builder",
  },
  {
    id: "backer" as UserRole,
    label: "Backer",
    description: "I want to invest in sprints",
    icon: TrendingUp,
    color: "backer",
  },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as AuthMode || "login";
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const validateField = (field: string, value: string) => {
    try {
      if (field === "email") emailSchema.parse(value);
      if (field === "password") passwordSchema.parse(value);
      if (field === "fullName") nameSchema.parse(value);
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: e.errors[0].message }));
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateField("email", email) || !validateField("password", password)) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!selectedRole) {
        toast({ title: "Please select a role", variant: "destructive" });
        return;
      }
      setStep(2);
      return;
    }

    if (!validateField("fullName", fullName) || !validateField("email", email) || !validateField("password", password)) {
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName, selectedRole);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Account exists",
          description: "An account with this email already exists. Please log in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to SprintFounders. Let's start your journey!",
      });
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateField("email", email)) return;

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setMode("login");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 pb-16 min-h-screen flex items-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-founder/10 mb-4">
                <Rocket className="w-8 h-8 text-founder" />
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                {mode === "login" && "Welcome Back"}
                {mode === "signup" && (step === 1 ? "Join SprintFounders" : "Create Your Account")}
                {mode === "forgot-password" && "Reset Password"}
              </h1>
              <p className="text-muted-foreground">
                {mode === "login" && "Sign in to continue your sprint journey"}
                {mode === "signup" && (step === 1 ? "Choose your role to get started" : "Just a few more details")}
                {mode === "forgot-password" && "Enter your email to receive a reset link"}
              </p>
            </div>

            {/* Form */}
            <div className="glass-card p-8">
              <AnimatePresence mode="wait">
                {mode === "login" && (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleLogin}
                    className="space-y-6"
                  >
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => validateField("email", email)}
                          className="pl-10"
                        />
                      </div>
                      {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-xs text-founder hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => validateField("password", password)}
                          className="pl-10"
                        />
                      </div>
                      {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
                    </div>

                    <Button variant="founder" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.form>
                )}

                {mode === "signup" && step === 1 && (
                  <motion.div
                    key="signup-step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                          selectedRole === role.id
                            ? `border-${role.color} bg-${role.color}/5`
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className={`p-3 rounded-xl bg-${role.color}/10`}>
                          <role.icon className={`w-6 h-6 text-${role.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{role.label}</h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        {selectedRole === role.id && (
                          <Check className={`w-5 h-5 text-${role.color}`} />
                        )}
                      </button>
                    ))}

                    <Button 
                      variant="founder" 
                      size="lg" 
                      className="w-full mt-6" 
                      onClick={() => selectedRole && setStep(2)}
                      disabled={!selectedRole}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {mode === "signup" && step === 2 && (
                  <motion.form
                    key="signup-step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSignup}
                    className="space-y-6"
                  >
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to role selection
                    </button>

                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative mt-1.5">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onBlur={() => validateField("fullName", fullName)}
                          className="pl-10"
                        />
                      </div>
                      {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => validateField("email", email)}
                          className="pl-10"
                        />
                      </div>
                      {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => validateField("password", password)}
                          className="pl-10"
                        />
                      </div>
                      {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
                    </div>

                    <Button variant="founder" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.form>
                )}

                {mode === "forgot-password" && (
                  <motion.form
                    key="forgot"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleForgotPassword}
                    className="space-y-6"
                  >
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to login
                    </button>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => validateField("email", email)}
                          className="pl-10"
                        />
                      </div>
                      {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                    </div>

                    <Button variant="founder" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Reset Link"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setStep(1); }}
                    className="text-founder font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-founder font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
