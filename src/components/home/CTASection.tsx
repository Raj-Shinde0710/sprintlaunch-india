import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-section" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-founder/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-builder/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Icon */}
          <div className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-8">
            <Rocket className="w-8 h-8 text-white" />
          </div>

          {/* Headline */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Stop Dreaming
            <br />
            and Start Building?
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Join 2,000+ Indian founders, builders, and backers who are turning ideas into reality through execution-first sprints.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group">
                Start Your Sprint Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="heroOutline" size="xl">
                Explore the Platform
              </Button>
            </Link>
          </div>

          {/* Trust Note */}
          <p className="mt-8 text-sm text-white/50">
            Free to join • No credit card required • India-first platform
          </p>
        </motion.div>
      </div>
    </section>
  );
}
