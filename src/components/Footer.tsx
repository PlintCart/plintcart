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
            <div className="max-w-4xl mx-auto text-center py-12">
              <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Step into the future of selling smarter & Digital Commerce with Plint.
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-brand-green text-primary-foreground hover:bg-brand-green-dark shadow-soft hover:shadow-medium h-16 rounded-xl px-10 text-lg group min-w-[200px]"
                  onClick={() => window.location.href = '/auth?mode=signup'}
                >
                  Start Free Trial
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5 transition-transform group-hover:translate-x-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:shadow-medium group min-w-[180px] border-brand-green bg-brand-green text-white hover:bg-brand-green-dark hover:text-white shadow-soft h-16 rounded-xl px-10 text-lg"
                  onClick={() => window.open('https://wa.me/254794832922?text=Hi%20Plint%20Team%2C%20I%20would%20like%20to%20book%20a%20demo%20for%20the%20Virtual%20POS%20platform.', '_blank')}
                >
                  Book Demo
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5 transition-transform group-hover:translate-x-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-6 gap-12">
            {/* Minimal Footer - Company Info/Contact removed as requested */}

            {/* Minimal Footer Links */}
            <div className="lg:col-span-4 flex flex-col md:flex-row gap-8 justify-end items-start">
              <div>
                <a href="#about" className="text-lg font-semibold mb-4 block text-white/80 hover:text-white transition-smooth">About</a>
              </div>
              <div>
                <a href="#pricing" className="text-lg font-semibold mb-4 block text-white/80 hover:text-white transition-smooth">Pricing</a>
              </div>
              <div>
                <a href="#terms" className="text-lg font-semibold mb-4 block text-white/80 hover:text-white transition-smooth">Terms & Conditions</a>
              </div>
              <div>
                <a href="#cookie" className="text-lg font-semibold mb-4 block text-white/80 hover:text-white transition-smooth">Cookie Policy</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/60 text-sm text-center w-full">
                © 2025 Plint. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;