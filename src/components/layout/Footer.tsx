import { Link } from "react-router-dom";
import { Rocket, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Discover Ideas", href: "/discover?tab=ideas" },
    { label: "Find Builders", href: "/discover?tab=builders" },
    { label: "For Backers", href: "/discover?tab=backers" },
    { label: "Equity Calculator", href: "/equity-calculator" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Success Stories", href: "/success-stories" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refunds" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
    { label: "API Docs", href: "/docs" },
    { label: "DPIIT Guide", href: "/dpiit-guide" },
    { label: "Legal Templates", href: "/templates" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/sprintfounders", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/sprintfounders", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/sprintfounders", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@sprintfounders", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-founder/10">
                <Rocket className="w-5 h-5 text-founder" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                SprintFounders
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              India's first execution-first startup team formation platform. Ship before you split.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-founder/10 hover:text-founder transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-bold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SprintFounders. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground">
              🇮🇳 Proudly Indian • DPIIT Recognized
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
