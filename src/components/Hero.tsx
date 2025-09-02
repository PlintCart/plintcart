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
  <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden py-6 md:py-12">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-90" />
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative container mx-auto px-6 text-white">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-8 py-4 md:gap-16 md:py-8">
          {/* Left Column: Content */}
          <div className="flex-[1.3] min-w-0">
            {/* Main Headline - enlarged and styled */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-2 tracking-tight text-white text-center md:text-left">
                Track every order. <span className="text-white">Know what sells.</span> <span className="text-white">Keep customers coming back.</span>
              </h1>
            </div>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center sm:justify-start items-center sm:items-start mb-12">
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
            <div className="mb-8 text-center md:text-left">
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
          </div>
          {/* Right Column: Laptop Mockup */}
          <div className="flex-1 min-w-0 flex justify-center items-center w-full">
            <div className="bg-gray-900 rounded-2xl shadow-2xl border-4 border-gray-300 p-2 w-full max-w-2xl h-[220px] md:h-[280px] flex flex-col items-center justify-center mx-auto">
              <video
                src="/landing-video.mp4"
                className="rounded-lg w-full h-full object-contain"
                style={{ aspectRatio: '16/10' }}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </div>
      {/* Scroll Indicator */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-50">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;