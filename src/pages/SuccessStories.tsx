import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Quote, MapPin, Clock, Users, TrendingUp, Verified } from "lucide-react";

const stories = [
  {
    id: "1",
    company: "LegalMind AI",
    tagline: "AI-powered contract analysis for law firms",
    logo: "L",
    industry: "LegalTech",
    raised: "₹2.5 Cr",
    founded: "2024",
    location: "Bengaluru",
    sprintDays: 21,
    teamSize: 4,
    founder: {
      name: "Priya Sharma",
      role: "Founder & CEO",
      quote: "SprintFounders helped me find a technical co-founder who actually delivered. The sprint process filtered out people who only wanted to talk.",
    },
    metrics: [
      { label: "Sprint Duration", value: "21 days" },
      { label: "Team Formed", value: "4 members" },
      { label: "Funding Raised", value: "₹2.5 Cr" },
      { label: "Time to Revenue", value: "3 months" },
    ],
  },
  {
    id: "2",
    company: "KiranaQuick",
    tagline: "Hyperlocal grocery delivery for Tier-2 cities",
    logo: "K",
    industry: "E-Commerce",
    raised: "₹1.8 Cr",
    founded: "2024",
    location: "Jaipur",
    sprintDays: 30,
    teamSize: 5,
    founder: {
      name: "Rahul Verma",
      role: "Founder & CEO",
      quote: "We went from idea to 50 daily orders in just 30 days. The sprint forced us to focus on execution, not endless planning.",
    },
    metrics: [
      { label: "Sprint Duration", value: "30 days" },
      { label: "Daily Orders", value: "200+" },
      { label: "Funding Raised", value: "₹1.8 Cr" },
      { label: "Cities Expanded", value: "3" },
    ],
  },
  {
    id: "3",
    company: "TaxFlow",
    tagline: "GST compliance automation for SMBs",
    logo: "T",
    industry: "FinTech",
    raised: "₹3.2 Cr",
    founded: "2023",
    location: "Mumbai",
    sprintDays: 14,
    teamSize: 3,
    founder: {
      name: "Ananya Patel",
      role: "Founder & CEO",
      quote: "The contribution-based equity model was fair and transparent. Everyone knew exactly what they were working towards.",
    },
    metrics: [
      { label: "Sprint Duration", value: "14 days" },
      { label: "Pilot SMBs", value: "25" },
      { label: "Funding Raised", value: "₹3.2 Cr" },
      { label: "MRR", value: "₹8L" },
    ],
  },
];

const stats = [
  { value: "500+", label: "Sprints Completed" },
  { value: "₹12Cr+", label: "Total Funding" },
  { value: "89%", label: "Sprint Success Rate" },
  { value: "2,000+", label: "Founders Matched" },
];

export default function SuccessStories() {
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-builder/10 text-builder text-sm font-medium mb-4">
              Real Results
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Startups Built Through
              <br />
              <span className="text-builder">Execution Sprints</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              These teams proved themselves through mandatory sprints before splitting equity or raising funds.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 md:p-10"
              >
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Left: Company Info */}
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-founder/10 flex items-center justify-center text-founder font-display font-bold text-2xl">
                        {story.logo}
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                          {story.company}
                          <Verified className="w-5 h-5 text-builder" />
                        </h3>
                        <Badge variant="outline" className="mt-1">{story.industry}</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{story.tagline}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {story.location}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {story.sprintDays}-day sprint
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {story.teamSize} team members
                      </div>
                      <div className="flex items-center gap-2 text-builder font-medium">
                        <TrendingUp className="w-4 h-4" />
                        Raised {story.raised}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Quote */}
                  <div className="md:border-l md:border-r border-border md:px-8">
                    <Quote className="w-8 h-8 text-founder/30 mb-4" />
                    <p className="text-lg text-foreground mb-6 italic">
                      "{story.founder.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-founder/10 flex items-center justify-center text-founder font-bold">
                        {story.founder.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{story.founder.name}</div>
                        <div className="text-xs text-muted-foreground">{story.founder.role}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div>
                    <h4 className="font-display font-bold text-foreground mb-4">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {story.metrics.map((metric, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                          <div className="font-display font-bold text-foreground">{metric.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Write Your Success Story
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the growing list of Indian startups that proved themselves through execution sprints.
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
                  Explore Ideas
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
