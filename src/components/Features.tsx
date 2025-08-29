import { Store, MessageCircle, Palette, Zap, Shield, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhoneSlideshow from "./PhoneSlideshow";

const Features = () => {
  const handleStartTrial = () => {
    window.location.href = '/auth?mode=signup';
  };
  const features = [
    {
      icon: Store,
      title: "Universal Business Platform",
      description: "Perfect for any business - retail, services, food, digital products, and more.",
      color: "brand-blue",
      delay: "0s"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description: "Customers can order directly through WhatsApp with a simple click-to-order button.",
      color: "brand-green",
      delay: "0.2s"
    },
    {
      icon: Palette,
      title: "Brand Customization",
      description: "Customize colors, upload banners, and create a storefront that matches your brand.",
      color: "brand-purple",
      delay: "0.4s"
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get your online ordering system up and running in minutes, no technical knowledge required.",
      color: "brand-orange",
      delay: "0s"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for your business.",
      color: "brand-blue",
      delay: "0.2s"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Reach global customers with support for English, Spanish, French, and Swahili.",
      color: "brand-green",
      delay: "0.4s"
    }
  ];

  return (
    <section id="features" className="py-24 bg-background relative">
      {/* Why Plint Heading Above */}
      <div className="container mx-auto px-6">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground">Why Plint</h2>
        </div>
      </div>
      {/* App Screenshots Section */}
      <div className="flex flex-col md:flex-row gap-8 justify-center items-center my-4">
        <div className="w-full flex flex-col md:flex-row items-center justify-center min-h-[600px] gap-8">
          {/* How Plint Works Card */}
          <div className="gradient-cta rounded-3xl p-12 shadow-large w-full max-w-2xl text-white animate-fade-in">
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
          {/* Phone mockup - now directly adjacent to card */}
          <div className="bg-black rounded-[2rem] shadow-xl border-4 border-gray-300 p-2 max-w-[300px] w-full flex flex-col items-center">
            <PhoneSlideshow />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Section Header & Value Proposition */}
        <div className="text-center mb-20 animate-fade-in relative z-10">
          <div className="flex flex-col md:flex-row gap-8 justify-center mb-8">
            {/* Challenges */}
            <div className="bg-background rounded-xl shadow-soft border p-8 flex-1 min-w-[260px] flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
                ❌ Challenges MSMEs Face
              </h3>
              <ul className="space-y-4 text-lg text-muted-foreground">
                <li className="flex gap-2 items-start"><span>⏳</span>Manual order tracking slows everything down</li>
                <li className="flex gap-2 items-start"><span>🔄</span>Restocking is a guessing game</li>
                <li className="flex gap-2 items-start"><span>💔</span>Loyal customers slip through the cracks</li>
              </ul>
            </div>
            {/* Solutions */}
            <div className="bg-background rounded-xl shadow-soft border p-8 flex-1 min-w-[260px] flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-6 text-green-600 flex items-center gap-2">
                ✅ Plint Solves It
              </h3>
              <ul className="space-y-4 text-lg text-foreground">
                <li className="flex gap-2 items-start"><span>🔄</span><span className="font-semibold">Auto Order Tracking:</span> Log every sale in real time</li>
                <li className="flex gap-2 items-start"><span>📦</span><span className="font-semibold">Product Insights:</span> Know your bestsellers instantly</li>
                <li className="flex gap-2 items-start"><span>💖</span><span className="font-semibold">Customer Loyalty:</span> Track and reward your top buyers</li>
                <li className="flex gap-2 items-start"><span>💸</span><span className="font-semibold">Payment Links:</span> Get paid faster, from anywhere</li>
              </ul>
            </div>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Everything you need to <br />
            <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
              sell online
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Built for any business that wants to start selling online quickly and easily - retail, services, digital products, and more.
          </p>
        </div>

  {/* Features Grid removed as requested */}

        {/* Numbers That Matter Section - Horizontal & Responsive */}
        <div className="text-center mt-20 animate-fade-in">
          <h3 className="text-3xl font-bold mb-6 text-foreground">Numbers That Matter</h3>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-4xl mx-auto mb-8">
            <div className="flex-1 bg-background rounded-xl shadow-soft border p-6 flex flex-col justify-center items-center min-w-[200px]">
              <div className="text-lg text-muted-foreground mb-2">Businesses that track and analyze sales data are:</div>
              <div className="flex flex-row md:flex-col gap-6 w-full justify-center items-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">2x</span>
                  <span className="text-base text-muted-foreground">more likely to restock correctly.</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">3x</span>
                  <span className="text-base text-muted-foreground">more likely to keep loyal customers.</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">30%</span>
                  <span className="text-base text-muted-foreground">more efficient when payments are digitized.</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xl text-foreground font-semibold">Plint makes this possible for MSMEs & SMEs.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;