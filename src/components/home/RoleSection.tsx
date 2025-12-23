import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, Code2, Wallet, ArrowRight, Check } from "lucide-react";

const roles = [
  {
    id: "founder",
    title: "Idea Founders",
    subtitle: "Got an idea? Find your dream team.",
    description: "You bring the vision, we help you find builders and backers who'll execute alongside you.",
    icon: Lightbulb,
    color: "founder",
    benefits: [
      "Post your idea with sprint goals",
      "Auto-match with skilled builders",
      "Protected idea ownership",
      "Fair equity distribution",
    ],
    cta: "Post Your Idea",
    href: "/signup?role=founder",
  },
  {
    id: "builder",
    title: "Skilled Builders",
    subtitle: "Skills but no idea? Join a sprint.",
    description: "Your code, design, or growth skills are in demand. Join promising ideas and earn equity through execution.",
    icon: Code2,
    color: "builder",
    benefits: [
      "Browse verified ideas",
      "Contribution-based equity",
      "Build your startup portfolio",
      "Flexible time commitment",
    ],
    cta: "Find Ideas to Build",
    href: "/signup?role=builder",
  },
  {
    id: "backer",
    title: "Backers",
    subtitle: "Smart money for proven execution.",
    description: "Invest only in teams that have already shipped. Escrow-protected commitments with milestone releases.",
    icon: Wallet,
    color: "backer",
    benefits: [
      "Post-sprint verified teams",
      "Escrow-protected funds",
      "Mentor or stay silent",
      "India-first legal framework",
    ],
    cta: "Browse Sprint-Ready Teams",
    href: "/signup?role=backer",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function RoleSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-4">
            Three Paths to Success
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your Role
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Whether you have an idea, skills, or capital — there's a place for you in the sprint ecosystem.
          </p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                variants={cardVariants}
                className={`role-${role.color} role-card group`}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: `var(--gradient-${role.color})`, opacity: 0.05 }} />

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-${role.color}-light mb-6`}>
                  <Icon className={`w-6 h-6 text-${role.color}`} />
                </div>

                {/* Content */}
                <h3 className={`font-display text-2xl font-bold text-${role.color} mb-2`}>
                  {role.title}
                </h3>
                <p className="font-medium text-foreground mb-2">{role.subtitle}</p>
                <p className="text-muted-foreground text-sm mb-6">{role.description}</p>

                {/* Benefits */}
                <ul className="space-y-3 mb-8">
                  {role.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 mt-0.5 text-${role.color}`} />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={role.href}>
                  <Button
                    variant={`${role.color}Outline` as "founderOutline" | "builderOutline" | "backerOutline"}
                    className="w-full group/btn"
                  >
                    {role.cta}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
