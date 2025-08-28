import { Store, MessageCircle, Palette, Zap, Shield, Globe } from "lucide-react";
import PhoneSlideshow from "./PhoneSlideshow";

const Features = () => {
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
      {/* App Screenshots Section */}
      <div className="flex flex-col md:flex-row gap-8 justify-center items-center my-16">
        {/* Laptop mockup */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl border-4 border-gray-300 p-4 max-w-xl w-full flex flex-col items-center">
          <video
            src="/landing-video.mp4"
            className="rounded-lg w-full h-auto object-cover"
            style={{ aspectRatio: '16/10' }}
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Caption removed as requested */}
        </div>
        {/* Phone mockup */}
        <div className="bg-black rounded-[2rem] shadow-xl border-4 border-gray-300 p-2 max-w-[300px] w-full flex flex-col items-center">
          <PhoneSlideshow />
          {/* Caption removed as requested */}
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Decorative radial background for Why Plint section */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0)",
            backgroundSize: "50px 50px",
            opacity: 0.08,
            zIndex: 0
          }}
        />
        {/* Section Header & Value Proposition */}
        <div className="text-center mb-20 animate-fade-in relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Why Plint?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Reach, grow, and retain more customers with smarter tools.<br />
            <span className="block mt-4 text-lg text-primary font-semibold">Most small businesses struggle with:</span>
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center mb-8">
            <div className="bg-background rounded-xl shadow-soft border p-6 flex-1 min-w-[260px]">
              <h3 className="text-lg font-semibold mb-4 text-primary">Challenges for MSMEs & SMEs</h3>
              <ul className="list-disc ml-6 text-muted-foreground text-left space-y-2">
                <li>Manual order tracking that slows them down.</li>
                <li>Guessing what to restock.</li>
                <li>Losing loyal customers.</li>
              </ul>
            </div>
            <div className="bg-background rounded-xl shadow-soft border p-6 flex-1 min-w-[260px]">
              <h3 className="text-lg font-semibold mb-4 text-primary">Plint Fixes This With</h3>
              <ul className="list-disc ml-6 text-muted-foreground text-left space-y-2">
                <li>Auto Order Tracking — log every sale in real time.</li>
                <li>Product Insights — know your bestsellers instantly.</li>
                <li>Customer Loyalty — track and reward your top buyers.</li>
                <li>Payment Links — get paid faster, anywhere.</li>
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