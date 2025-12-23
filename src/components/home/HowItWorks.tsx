import { motion } from "framer-motion";
import { UserPlus, Users, Timer, Trophy, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Post or Join",
    description: "Founders post ideas with sprint goals. Builders and backers browse and apply.",
    color: "founder",
  },
  {
    number: "02",
    icon: Users,
    title: "Form Your Team",
    description: "AI matches compatible team members based on skills, availability, and commitment.",
    color: "builder",
  },
  {
    number: "03",
    icon: Timer,
    title: "Run the Sprint",
    description: "14-30 day mandatory execution sprint with task tracking, progress reports, and milestones.",
    color: "founder",
  },
  {
    number: "04",
    icon: Trophy,
    title: "Unlock Equity & Funds",
    description: "Successful sprint completion unlocks final equity splits and escrowed investments.",
    color: "backer",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-founder/10 text-founder text-sm font-medium mb-4">
            The Sprint Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From idea to funded startup in 4 simple steps. No endless meetings, no empty promises.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                  )}

                  <div className="glass-card p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    {/* Number Badge */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-${step.color}/10 mb-4`}>
                      <Icon className={`w-6 h-6 text-${step.color}`} />
                    </div>

                    {/* Step Number */}
                    <div className={`font-display text-sm font-bold text-${step.color} mb-2`}>
                      Step {step.number}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-founder font-medium hover:gap-3 transition-all"
          >
            Learn more about the sprint process
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
