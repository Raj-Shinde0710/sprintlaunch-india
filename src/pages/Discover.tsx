import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Lightbulb, 
  Code2, 
  Wallet, 
  MapPin, 
  Clock, 
  Users, 
  Verified,
  Zap,
  Star,
  ArrowRight,
  Github,
  Linkedin
} from "lucide-react";

type TabType = "ideas" | "builders" | "backers";

const ideas = [
  {
    id: "1",
    title: "AI-Powered Legal Document Analyzer",
    founder: "Priya Sharma",
    location: "Bengaluru",
    verified: true,
    stage: "Prototype",
    industry: ["LegalTech", "AI/ML"],
    sprintGoal: "Build MVP with contract parsing & risk detection",
    sprintDays: 21,
    rolesNeeded: ["Full-Stack Dev", "ML Engineer"],
    commitment: "20 hrs/week",
    applicants: 12,
  },
  {
    id: "2",
    title: "Hyperlocal Grocery Delivery for Tier-2 Cities",
    founder: "Rahul Verma",
    location: "Jaipur",
    verified: true,
    stage: "Validation",
    industry: ["E-Commerce", "Logistics"],
    sprintGoal: "Launch pilot in 3 localities with 50 daily orders",
    sprintDays: 30,
    rolesNeeded: ["React Native Dev", "Growth Lead"],
    commitment: "25 hrs/week",
    applicants: 8,
  },
  {
    id: "3",
    title: "B2B SaaS for GST Compliance Automation",
    founder: "Ananya Patel",
    location: "Mumbai",
    verified: false,
    stage: "Idea",
    industry: ["FinTech", "SaaS"],
    sprintGoal: "Validate with 10 pilot SMBs and build core automation",
    sprintDays: 14,
    rolesNeeded: ["Backend Dev", "Product Designer"],
    commitment: "15 hrs/week",
    applicants: 5,
  },
  {
    id: "4",
    title: "Mental Health App for Working Professionals",
    founder: "Vikram Singh",
    location: "Delhi NCR",
    verified: true,
    stage: "Prototype",
    industry: ["HealthTech", "Wellness"],
    sprintGoal: "Launch beta with 100 users and therapist matching",
    sprintDays: 21,
    rolesNeeded: ["Mobile Dev", "UX Designer"],
    commitment: "20 hrs/week",
    applicants: 15,
  },
  {
    id: "5",
    title: "Creator Economy Platform for Indian YouTubers",
    founder: "Sneha Iyer",
    location: "Chennai",
    verified: true,
    stage: "Validation",
    industry: ["Creator Economy", "SaaS"],
    sprintGoal: "Onboard 50 creators, integrate brand matching",
    sprintDays: 30,
    rolesNeeded: ["Full-Stack Dev", "Growth Hacker"],
    commitment: "25 hrs/week",
    applicants: 20,
  },
];

const builders = [
  {
    id: "1",
    name: "Arjun Mehta",
    location: "Pune",
    verified: true,
    role: "Full-Stack Developer",
    skills: ["React", "Node.js", "PostgreSQL", "AWS"],
    experience: "5 years",
    availability: "20 hrs/week",
    sprintsCompleted: 4,
    rating: 4.9,
    portfolio: { github: true, linkedin: true },
  },
  {
    id: "2",
    name: "Kavitha Rajan",
    location: "Hyderabad",
    verified: true,
    role: "Product Designer",
    skills: ["Figma", "User Research", "Design Systems", "Prototyping"],
    experience: "4 years",
    availability: "15 hrs/week",
    sprintsCompleted: 3,
    rating: 4.8,
    portfolio: { github: false, linkedin: true },
  },
  {
    id: "3",
    name: "Rohan Kapoor",
    location: "Bengaluru",
    verified: true,
    role: "ML Engineer",
    skills: ["Python", "TensorFlow", "NLP", "Computer Vision"],
    experience: "6 years",
    availability: "25 hrs/week",
    sprintsCompleted: 6,
    rating: 5.0,
    portfolio: { github: true, linkedin: true },
  },
  {
    id: "4",
    name: "Aisha Khan",
    location: "Mumbai",
    verified: false,
    role: "Growth Lead",
    skills: ["SEO", "Performance Marketing", "Analytics", "Community"],
    experience: "4 years",
    availability: "20 hrs/week",
    sprintsCompleted: 2,
    rating: 4.7,
    portfolio: { github: false, linkedin: true },
  },
];

const backers = [
  {
    id: "1",
    name: "Rajesh Gupta",
    location: "Mumbai",
    verified: true,
    type: "Angel Investor",
    investmentRange: "₹5L - ₹25L",
    sectors: ["FinTech", "SaaS", "AI/ML"],
    involvement: "Advisory",
    teamsBacke: 8,
    successRate: "75%",
  },
  {
    id: "2",
    name: "Meera Sundaram",
    location: "Bengaluru",
    verified: true,
    type: "Micro VC",
    investmentRange: "₹25L - ₹1Cr",
    sectors: ["HealthTech", "EdTech", "D2C"],
    involvement: "Hands-on",
    teamsBacked: 12,
    successRate: "83%",
  },
  {
    id: "3",
    name: "Amit Jain",
    location: "Delhi NCR",
    verified: true,
    type: "Angel Investor",
    investmentRange: "₹10L - ₹50L",
    sectors: ["B2B SaaS", "Enterprise"],
    involvement: "Silent",
    teamsBacked: 5,
    successRate: "80%",
  },
];

export default function Discover() {
  const [activeTab, setActiveTab] = useState<TabType>("ideas");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "ideas" as TabType, label: "Ideas", icon: Lightbulb, count: ideas.length },
    { id: "builders" as TabType, label: "Builders", icon: Code2, count: builders.length },
    { id: "backers" as TabType, label: "Backers", icon: Wallet, count: backers.length },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Discover
            </h1>
            <p className="text-muted-foreground text-lg">
              Find your perfect match — ideas seeking builders, builders ready to sprint, and backers looking for proven teams.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs & Search */}
      <section className="border-b border-border sticky top-16 md:top-20 bg-background/80 backdrop-blur-xl z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const colorClass = tab.id === "ideas" ? "founder" : tab.id === "builders" ? "builder" : "backer";
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive 
                        ? `bg-${colorClass} text-white` 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
                      {tab.count}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Ideas Tab */}
          {activeTab === "ideas" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-founder/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-founder/10 flex items-center justify-center text-founder font-bold">
                        {idea.founder.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground">{idea.founder}</span>
                          {idea.verified && <Verified className="w-3.5 h-3.5 text-builder" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {idea.location}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {idea.stage}
                    </Badge>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground mb-2 hover:text-founder transition-colors line-clamp-2">
                    {idea.title}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {idea.industry.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Zap className="w-3 h-3 text-founder" />
                      Sprint Goal
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{idea.sprintGoal}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {idea.sprintDays} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {idea.applicants} applied
                      </span>
                    </div>
                    <span className="text-founder font-medium">{idea.commitment}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">Looking for:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {idea.rolesNeeded.map((role) => (
                        <span key={role} className="px-2 py-1 rounded-md bg-builder/10 text-builder text-xs font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Builders Tab */}
          {activeTab === "builders" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {builders.map((builder, index) => (
                <motion.div
                  key={builder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-builder/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-builder/10 flex items-center justify-center text-builder font-bold text-lg">
                        {builder.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{builder.name}</span>
                          {builder.verified && <Verified className="w-3.5 h-3.5 text-builder" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {builder.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{builder.rating}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-display text-lg font-bold text-builder mb-1">
                      {builder.role}
                    </h3>
                    <p className="text-sm text-muted-foreground">{builder.experience} experience</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {builder.skills.map((skill) => (
                      <span key={skill} className="px-2 py-1 rounded-md bg-builder/10 text-builder text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="font-medium text-foreground">{builder.availability}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Sprints Completed</span>
                    <span className="font-medium text-builder">{builder.sprintsCompleted}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    {builder.portfolio.github && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Github className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    {builder.portfolio.linkedin && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Linkedin className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1" />
                    <Button variant="builderOutline" size="sm">
                      View Profile
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Backers Tab */}
          {activeTab === "backers" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backers.map((backer, index) => (
                <motion.div
                  key={backer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-backer/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-backer/10 flex items-center justify-center text-backer font-bold text-lg">
                        {backer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{backer.name}</span>
                          {backer.verified && <Verified className="w-3.5 h-3.5 text-backer" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {backer.location}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-backer/10 text-backer border-0">
                      {backer.type}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-backer/5 mb-4">
                    <div className="text-xs text-muted-foreground mb-1">Investment Range</div>
                    <div className="font-display font-bold text-backer">{backer.investmentRange}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">Preferred Sectors</div>
                    <div className="flex flex-wrap gap-1.5">
                      {backer.sectors.map((sector) => (
                        <span key={sector} className="px-2 py-1 rounded-md bg-muted text-xs text-foreground">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Involvement</span>
                    <span className="font-medium text-foreground">{backer.involvement}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium text-builder">{backer.successRate}</span>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button variant="backerOutline" size="sm" className="w-full">
                      Request Introduction
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
