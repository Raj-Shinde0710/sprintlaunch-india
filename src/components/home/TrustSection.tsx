import { motion } from "framer-motion";
import { Shield, FileText, Scale, Fingerprint, Clock, Lock } from "lucide-react";

const trustFeatures = [
  {
    icon: Fingerprint,
    title: "Aadhaar/PAN Verification",
    description: "Optional identity verification for enhanced trust and credibility.",
  },
  {
    icon: Clock,
    title: "Idea Timestamping",
    description: "Blockchain-backed proof of idea ownership and submission time.",
  },
  {
    icon: FileText,
    title: "Legal Templates",
    description: "India-compliant founder agreements, NDAs, and term sheets.",
  },
  {
    icon: Lock,
    title: "Escrow Protection",
    description: "Investor funds secured until sprint milestones are met.",
  },
  {
    icon: Scale,
    title: "Fair Equity Calculator",
    description: "AI-powered contribution tracking for transparent equity splits.",
  },
  {
    icon: Shield,
    title: "DPIIT Guidance",
    description: "Resources for Startup India registration and compliance.",
  },
];

export function TrustSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-backer/10 text-backer text-sm font-medium mb-4">
            India-First Trust Layer
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Built for Indian Founders
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Legal protection, identity verification, and escrow systems designed specifically for the Indian startup ecosystem.
          </p>
        </motion.div>

        {/* Trust Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-backer/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-backer/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-backer" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
