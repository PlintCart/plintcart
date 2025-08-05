import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Mail, Phone } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "#demo" },
      { label: "API", href: "#api" },
    ],
    Company: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
    Support: [
      { label: "Help Center", href: "#help" },
      { label: "Documentation", href: "#docs" },
      { label: "Status", href: "#status" },
      { label: "Community", href: "#community" },
    ],
    Legal: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
      { label: "Security", href: "#security" },
      { label: "Cookies", href: "#cookies" },
    ],
  };

  return (
    <footer className="bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>

      <div className="relative">
        {/* Newsletter Section */}
        <div className="border-b border-white/20">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                Stay updated with Take.App
              </h3>
              <p className="text-white/80 mb-8 text-lg">
                Get the latest updates, tips, and insights delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Button variant="success" className="bg-white text-primary hover:bg-white/90">
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-6 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-4">
                  Take<span className="text-brand-green-light">.App</span>
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  The easiest way to create an online ordering system that connects directly to WhatsApp.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="w-5 h-5" />
                  <span>hello@take.app</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Phone className="w-5 h-5" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp Support</span>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-4">{category}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-white/80 hover:text-white transition-smooth"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/60 text-sm">
                © 2024 Take.App. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="text-white/60 hover:text-white transition-smooth">
                  Privacy Policy
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-smooth">
                  Terms of Service
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-smooth">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;