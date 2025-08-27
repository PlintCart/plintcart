import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const handleStartTrial = () => {
    // Navigate to auth page for sign up
    navigate('/auth?mode=signup');
  };

  const handleLearnMore = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-90" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative container mx-auto px-6 text-center text-white">
        <div className="max-w-5xl mx-auto">
          {/* Brand Logo */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold mb-2 tracking-tight">
              pl<span className="text-brand-green-light">int</span>
            </h1>
          </div>

          {/* Main Headline */}
          <div className="mb-8 animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Bridging the gap between sales tracking and smarter growth.
            </h2>
          </div>

          {/* Subtitle */}
          <div className="mb-8 animate-slide-in-right" style={{ animationDelay: "0.4s" }}>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              The Virtual POS for MSMEs & SMEs.<br />Track every order. Know what sells. Keep customers coming back.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <Button variant="success" size="xl" className="group min-w-[200px]" onClick={handleStartTrial}>
              Start Free Trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="success"
              size="xl"
              className="group min-w-[180px] border-brand-green bg-brand-green text-white hover:bg-brand-green-dark hover:text-white shadow-soft h-16 rounded-xl px-10 text-lg"
              onClick={() => window.open('https://wa.me/254794832922?text=Hi%20Plint%20Team%2C%20I%20would%20like%20to%20book%20a%20demo%20for%20the%20Virtual%20POS%20platform.', '_blank')}
            >
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              Book Demo
            </Button>
          </div>

          {/* Sign In Link for Existing Users */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.7s" }}>
            <p className="text-white/70 text-sm">
              Already have an account?{" "}
              <button 
                onClick={() => navigate('/auth?mode=signin')}
                className="text-brand-green-light hover:text-white transition-colors underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="gradient-cta rounded-3xl p-12 shadow-large max-w-4xl mx-auto text-white mt-12 animate-fade-in">
            <h3 className="text-4xl font-bold mb-4">How Plint Works</h3>
            <p className="text-xl mb-8 opacity-90">Set up in minutes – Your virtual POS, ready instantly.</p>
            <ul className="text-lg mb-8 opacity-90 list-disc list-inside text-left max-w-2xl mx-auto">
              <li className="mb-2"><span className="font-semibold text-white">Instant Setup:</span> Get your online ordering system up and running in minutes, no technical knowledge required.</li>
              <li className="mb-2"><span className="font-semibold text-white">Sell & track:</span> Orders and payments auto-logged.</li>
              <li className="mb-2"><span className="font-semibold text-white">See insights:</span> Bestsellers, slow movers, and customer loyalty at a glance.</li>
              <li className="mb-2"><span className="font-semibold text-white">Grow smarter:</span> Turn data into profits and better decisions.</li>
            </ul>
            <Button variant="success" size="xl" className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-smooth h-16 rounded-xl px-10 text-lg bg-white text-primary hover:bg-white/90 shadow-medium" onClick={handleStartTrial}>
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm mt-4 opacity-75">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;