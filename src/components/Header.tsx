import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = () => {
    // Navigate to auth page for sign in
    navigate('/auth?mode=signin');
  };

  const handleGetStarted = () => {
    // Navigate to auth page for sign up
    navigate('/auth?mode=signup');
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      if (location.pathname === '/') {
        // Smooth scroll to section on landing page
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to landing page with anchor
        navigate('/' + href);
      }
    } else if (href.startsWith('http')) {
      // Open external link
      window.open(href, '_blank');
    } else {
      navigate(href);
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Book Demo", href: "https://wa.me/254794832922?text=Hi%20Plint%20Team%2C%20I%20would%20like%20to%20book%20a%20demo%20for%20the%20Virtual%20POS%20platform." },
    { label: "Support", href: "/support" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <h1 
              className="text-2xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">PlintCart</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-foreground/80 hover:text-foreground transition-smooth font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-foreground" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button variant="success" className="shadow-soft" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-foreground/80 hover:text-foreground transition-smooth font-medium py-2 text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3">
                <Button variant="ghost" className="w-full justify-center" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button variant="success" className="w-full justify-center" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;