import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  UserPlus, 
  Users, 
  Timer, 
  Trophy, 
  ArrowRight, 
  Lightbulb, 
  Code2, 
  Wallet,
  CheckCircle2,
  Shield,
  Zap,
  BarChart3
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Choose Your Role & Sign Up",
    description: "Join as an Idea Founder with your startup vision, a Skilled Builder ready to execute, or a Backer looking to invest in proven teams.",
    details: [
      "Complete your profile in under 5 minutes",
      "Founders: Post your idea with sprint goals",
      "Builders: Showcase skills and availability",
      "Backers: Set investment preferences",
    ],
    color: "founder",
  },
  {
    number: "02",
    icon: Users,
    title: "Match & Form Teams",
    description: "Our AI-powered matching system connects compatible founders, builders, and backers based on skills, goals, and commitment levels.",
    details: [
      "Browse curated matches",
      "Review compatibility scores",
      "Chat and align on expectations",
      "Agree on sprint goals and timeline",
    ],
    color: "builder",
  },
  {
    number: "03",
    icon: Timer,
    title: "Run Your Sprint",
    description: "Execute a mandatory 14-30 day sprint with clear deliverables, task tracking, and weekly progress reports.",
    details: [
      "Private sprint workspace",
      "Real-time task board",
      "Contribution tracking",
      "Weekly auto-generated reports",
    ],
    color: "founder",
  },
  {
    number: "04",
    icon: Trophy,
    title: "Unlock Equity & Funds",
    description: "Successful sprint completion triggers final equity distribution and releases escrowed investor funds.",
    details: [
      "Dynamic equity calculator finalizes",
      "Verified team badge unlocked",
      "Investor funds released",
      "Ready for next phase",
    ],
    color: "backer",
  },
];

const features = [
  {
    icon: Shield,
    title: "Protected Execution",
    description: "All teams must prove themselves through sprints before equity or money changes hands.",
  },
  {
    icon: Zap,
    title: "AI-Powered Matching",
    description: "Smart algorithms find the best team combinations based on skills, availability, and goals.",
  },
  {
    icon: BarChart3,
    title: "Transparent Tracking",
    description: "Every contribution is logged and visible, ensuring fair and transparent equity distribution.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-founder/10 text-founder text-sm font-medium mb-4">
              The Sprint Process
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              From Idea to Funded Startup
              <br />
              <span className="text-founder">in 4 Simple Steps</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              SprintFounders replaces endless meetings and empty promises with mandatory execution sprints. 
              Prove your team works before splitting equity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="founder" size="lg">
                  Start Your Sprint
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="outline" size="lg">
                  Browse Ideas
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row gap-8 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Visual */}
                  <div className="md:w-1/3 flex justify-center">
                    <div className={`relative w-40 h-40 rounded-3xl bg-${step.color}/10 flex items-center justify-center`}>
                      <Icon className={`w-16 h-16 text-${step.color}`} />
                      <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-xl bg-${step.color} flex items-center justify-center font-display font-bold text-white text-lg`}>
                        {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:w-2/3">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className={`w-5 h-5 text-${step.color} flex-shrink-0 mt-0.5`} />
                          <span className="text-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Sprints Work
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our execution-first approach eliminates the biggest problems in startup team formation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="inline-flex p-3 rounded-xl bg-builder/10 mb-4">
                    <Icon className="w-6 h-6 text-builder" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Prove Your Startup?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of Indian founders, builders, and backers who are building startups through execution.
            </p>
            <Link to="/signup">
              <Button variant="founder" size="xl">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
