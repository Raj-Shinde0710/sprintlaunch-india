import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Code2, Wallet, ArrowRight, ArrowLeft, Check, Rocket } from "lucide-react";

type RoleType = "founder" | "builder" | "backer" | null;

const roles = [
  {
    id: "founder" as RoleType,
    title: "Idea Founder",
    subtitle: "I have an idea to build",
    icon: Lightbulb,
    description: "Post your startup idea, find builders and backers, and run execution sprints.",
  },
  {
    id: "builder" as RoleType,
    title: "Skilled Builder",
    subtitle: "I want to join a sprint",
    icon: Code2,
    description: "Apply your skills to promising ideas and earn equity through execution.",
  },
  {
    id: "backer" as RoleType,
    title: "Backer",
    subtitle: "I want to invest in teams",
    icon: Wallet,
    description: "Invest in teams that have already proven themselves through sprints.",
  },
];

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") as RoleType;
  
  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    // Founder fields
    ideaTitle: "",
    problem: "",
    targetUsers: "",
    // Builder fields
    primarySkill: "",
    experience: "",
    availability: "",
    // Backer fields
    investmentRange: "",
    sectors: "",
    involvement: "",
  });

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const colorClass = selectedRole === "founder" ? "founder" : selectedRole === "builder" ? "builder" : "backer";

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step 
                    ? `w-12 bg-${colorClass || 'primary'}` 
                    : s < step 
                      ? `w-8 bg-${colorClass || 'primary'}/50` 
                      : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-center"
              >
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Join SprintFounders
                </h1>
                <p className="text-muted-foreground mb-12">
                  Choose how you want to participate in the sprint ecosystem.
                </p>

                <div className="grid gap-4">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const colorClass = role.id === "founder" ? "founder" : role.id === "builder" ? "builder" : "backer";
                    
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`group flex items-start gap-4 p-6 rounded-2xl bg-card border-2 border-border hover:border-${colorClass} text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                      >
                        <div className={`p-3 rounded-xl bg-${colorClass}/10 group-hover:bg-${colorClass}/20 transition-colors`}>
                          <Icon className={`w-6 h-6 text-${colorClass}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-lg font-bold text-foreground mb-1">
                            {role.title}
                          </h3>
                          <p className={`text-sm text-${colorClass} font-medium mb-2`}>
                            {role.subtitle}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        </div>
                        <ArrowRight className={`w-5 h-5 text-muted-foreground group-hover:text-${colorClass} group-hover:translate-x-1 transition-all`} />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-8 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-founder font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change role
                </button>

                <div className="text-center mb-8">
                  <div className={`inline-flex p-3 rounded-2xl bg-${colorClass}/10 mb-4`}>
                    {selectedRole === "founder" && <Lightbulb className={`w-8 h-8 text-${colorClass}`} />}
                    {selectedRole === "builder" && <Code2 className={`w-8 h-8 text-${colorClass}`} />}
                    {selectedRole === "backer" && <Wallet className={`w-8 h-8 text-${colorClass}`} />}
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Create Your Account
                  </h1>
                  <p className="text-muted-foreground">
                    Let's start with your basic information.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Priya Sharma"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Bengaluru"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="priya@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>

                  <Button
                    variant={colorClass as "founder" | "builder" | "backer"}
                    size="lg"
                    className="w-full"
                    onClick={() => setStep(3)}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Role-specific Info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-center mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {selectedRole === "founder" && "Tell Us About Your Idea"}
                    {selectedRole === "builder" && "Showcase Your Skills"}
                    {selectedRole === "backer" && "Investment Preferences"}
                  </h1>
                  <p className="text-muted-foreground">
                    {selectedRole === "founder" && "Share what you're building to attract the right team."}
                    {selectedRole === "builder" && "Help founders find you for the right sprints."}
                    {selectedRole === "backer" && "Let us match you with the best teams."}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Founder Fields */}
                  {selectedRole === "founder" && (
                    <>
                      <div>
                        <Label htmlFor="ideaTitle">Idea Title</Label>
                        <Input
                          id="ideaTitle"
                          name="ideaTitle"
                          placeholder="AI-Powered Legal Document Analyzer"
                          value={formData.ideaTitle}
                          onChange={handleInputChange}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="problem">Problem You're Solving</Label>
                        <Textarea
                          id="problem"
                          name="problem"
                          placeholder="Legal professionals spend 60% of their time reviewing documents manually..."
                          value={formData.problem}
                          onChange={handleInputChange}
                          className="mt-1.5"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="targetUsers">Target Users</Label>
                        <Input
                          id="targetUsers"
                          name="targetUsers"
                          placeholder="Law firms, legal departments, startups"
                          value={formData.targetUsers}
                          onChange={handleInputChange}
                          className="mt-1.5"
                        />
                      </div>
                    </>
                  )}

                  {/* Builder Fields */}
                  {selectedRole === "builder" && (
                    <>
                      <div>
                        <Label htmlFor="primarySkill">Primary Skill</Label>
                        <select
                          id="primarySkill"
                          name="primarySkill"
                          value={formData.primarySkill}
                          onChange={handleInputChange}
                          className="mt-1.5 w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                        >
                          <option value="">Select your main skill</option>
                          <option value="frontend">Frontend Development</option>
                          <option value="backend">Backend Development</option>
                          <option value="fullstack">Full-Stack Development</option>
                          <option value="mobile">Mobile Development</option>
                          <option value="ml">ML/AI Engineering</option>
                          <option value="design">Product Design</option>
                          <option value="growth">Growth/Marketing</option>
                          <option value="product">Product Management</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <select
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          className="mt-1.5 w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                        >
                          <option value="">Select experience level</option>
                          <option value="1-2">1-2 years</option>
                          <option value="3-5">3-5 years</option>
                          <option value="5-8">5-8 years</option>
                          <option value="8+">8+ years</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="availability">Weekly Availability</Label>
                        <select
                          id="availability"
                          name="availability"
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="mt-1.5 w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                        >
                          <option value="">Select availability</option>
                          <option value="10">10 hours/week</option>
                          <option value="15">15 hours/week</option>
                          <option value="20">20 hours/week</option>
                          <option value="25">25 hours/week</option>
                          <option value="40">Full-time (40 hrs)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Backer Fields */}
                  {selectedRole === "backer" && (
                    <>
                      <div>
                        <Label htmlFor="investmentRange">Investment Range</Label>
                        <select
                          id="investmentRange"
                          name="investmentRange"
                          value={formData.investmentRange}
                          onChange={handleInputChange}
                          className="mt-1.5 w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                        >
                          <option value="">Select range</option>
                          <option value="1-5L">₹1L - ₹5L</option>
                          <option value="5-25L">₹5L - ₹25L</option>
                          <option value="25L-1Cr">₹25L - ₹1Cr</option>
                          <option value="1Cr+">₹1Cr+</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="sectors">Preferred Sectors</Label>
                        <Input
                          id="sectors"
                          name="sectors"
                          placeholder="FinTech, SaaS, AI/ML"
                          value={formData.sectors}
                          onChange={handleInputChange}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="involvement">Involvement Level</Label>
                        <select
                          id="involvement"
                          name="involvement"
                          value={formData.involvement}
                          onChange={handleInputChange}
                          className="mt-1.5 w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                        >
                          <option value="">Select involvement</option>
                          <option value="silent">Silent (capital only)</option>
                          <option value="advisory">Advisory (monthly check-ins)</option>
                          <option value="hands-on">Hands-on (weekly involvement)</option>
                        </select>
                      </div>
                    </>
                  )}

                  <Button
                    variant={colorClass as "founder" | "builder" | "backer"}
                    size="lg"
                    className="w-full"
                  >
                    <Rocket className="w-4 h-4" />
                    Complete Signup
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By signing up, you agree to our{" "}
                    <Link to="/terms" className="underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="underline">Privacy Policy</Link>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
