import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Users, Zap, MapPin, Verified } from "lucide-react";

const featuredIdeas = [
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
];

export function FeaturedIdeas() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-builder/10 text-builder text-sm font-medium mb-4">
              Fresh Opportunities
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Ideas Seeking Builders
            </h2>
          </div>
          <Link to="/discover?tab=ideas">
            <Button variant="outline" className="group">
              View All Ideas
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Ideas Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredIdeas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/idea/${idea.id}`}>
                <div className="glass-card p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-founder/30">
                  {/* Header */}
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

                  {/* Title */}
                  <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-founder transition-colors line-clamp-2">
                    {idea.title}
                  </h3>

                  {/* Industry Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {idea.industry.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Sprint Goal */}
                  <div className="p-3 rounded-lg bg-muted/50 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Zap className="w-3 h-3 text-founder" />
                      Sprint Goal
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{idea.sprintGoal}</p>
                  </div>

                  {/* Meta */}
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

                  {/* Roles Needed */}
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
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
