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


      <div className="relative container mx-auto px-6 text-white">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-16 py-12">
          {/* Left Column: Content */}
          <div className="flex-[1.3] min-w-0">
            {/* Main Headline - enlarged and styled */}
            <div className="mb-8 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold mb-2 tracking-tight text-black">
                Track every order. Know what sells. Keep customers coming back.
              </h1>
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
                Book Demo
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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
            {/* Desktop Frame UI with looping video and styled background */}
            <div className="relative w-full flex flex-col items-center justify-start min-h-[600px]">
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0)',
                  backgroundSize: '50px 50px',
                  zIndex: 1,
                }}
              ></div>
              <div className="relative z-10 w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-black flex items-center justify-center mt-0">
                <img
                  src="/hero-desktop.png"
                  alt="Desktop Hero"
                  className="w-full h-full object-cover rounded-2xl"
                  style={{ borderRadius: '1rem' }}
                />
              </div>
            </div>
          </div>
          {/* Right Column: How Plint Works */}
          <div className="flex-1 min-w-0 flex items-start justify-end">
            <div className="gradient-cta rounded-3xl p-12 shadow-large max-w-3xl text-white mt-0 animate-fade-in ml-auto">
              <h3 className="text-4xl font-bold mb-4">How Plint Works</h3>
              <p className="text-xl mb-8 opacity-90">Set up in minutes – Your virtual POS, ready instantly.</p>
              <div className="text-lg mb-8 opacity-90 space-y-6 text-left max-w-2xl mx-auto">
                <div>
                  <span className="text-2xl mr-2">⚡</span>
                  <span className="font-semibold text-white">Instant Setup</span>
                  <div className="text-white/90 ml-8">Launch your online ordering system in minutes—no tech skills needed.</div>
                </div>
                <div>
                  <span className="text-2xl mr-2">📦</span>
                  <span className="font-semibold text-white">Sell & Track</span>
                  <div className="text-white/90 ml-8">Automatically log orders and payments. Stay organized effortlessly.</div>
                </div>
                <div>
                  <span className="text-2xl mr-2">📊</span>
                  <span className="font-semibold text-white">See Insights</span>
                  <div className="text-white/90 ml-8">Spot bestsellers, slow movers, and loyal customers at a glance.</div>
                </div>
                <div>
                  <span className="text-2xl mr-2">🚀</span>
                  <span className="font-semibold text-white">Grow Smarter</span>
                  <div className="text-white/90 ml-8">Turn data into profits with smarter decisions.</div>
                </div>
              </div>
              <Button variant="success" size="xl" className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-smooth h-16 rounded-xl px-10 text-lg bg-white text-primary hover:bg-white/90 shadow-medium" onClick={handleStartTrial}>
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">No credit card required • 14-day free trial • Cancel anytime</p>
            </div>
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