import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const handleStartTrial = () => {
    // Navigate to auth page for sign up
    navigate('/auth?mode=signup');
  };

  const handleViewDemo = () => {
    // Navigate to storefront to show the demo
    navigate('/storefront');
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
              Your Business, <br />
              <span className="bg-gradient-to-r from-brand-green-light to-white bg-clip-text text-transparent">
                One Click Away
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <div className="mb-8 animate-slide-in-right" style={{ animationDelay: "0.4s" }}>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Create a beautiful, minimal ordering system that connects directly to WhatsApp.
            </p>
            <p className="text-lg md:text-xl text-white/80 mt-4 max-w-2xl mx-auto">
              Perfect for any business - retail, services, food, digital products & more.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <Button variant="success" size="xl" className="group min-w-[200px]" onClick={handleStartTrial}>
              Start Free Trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="xl" className="group min-w-[180px] border-white/30 text-white hover:bg-white hover:text-primary" onClick={handleViewDemo}>
              <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
              View Demo
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
          <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
            <p className="text-white/70 text-sm mb-4">Trusted by thousands of businesses worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-white/60 text-sm font-medium">� Universal Platform</div>
              <div className="text-white/60 text-sm font-medium">⚡ Instant Setup</div>
              <div className="text-white/60 text-sm font-medium">📱 WhatsApp Ready</div>
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