import { ShoppingCart, MessageCircle, Users, Zap, Shield, Globe } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: "Easy Product Management",
      description: "Add, edit, and organize your products with beautiful galleries and detailed descriptions.",
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
      icon: Users,
      title: "Customer Management",
      description: "Track orders, manage customer information, and provide excellent service.",
      color: "brand-purple",
      delay: "0.4s"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance ensures your customers have a smooth ordering experience.",
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
      title: "Global Reach",
      description: "Multi-language support and global payment processing for worldwide customers.",
      color: "brand-green",
      delay: "0.4s"
    }
  ];

  return (
    <section className="py-24 bg-background relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Everything you need to <br />
            <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
              sell online
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Built specifically for food businesses that want to start selling online quickly and easily.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: feature.delay }}
              >
                <div className="gradient-card rounded-2xl p-8 shadow-soft hover-lift border border-white/50 transition-smooth h-full">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-${feature.color}/10 group-hover:bg-${feature.color}/20 transition-smooth`}>
                    <IconComponent className={`w-8 h-8 text-${feature.color} group-hover:scale-110 transition-smooth`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-smooth">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-smooth">
                    {feature.description}
                  </p>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20 animate-fade-in">
          <p className="text-lg text-muted-foreground mb-6">
            Join thousands of businesses already using Take.App
          </p>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Active Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">Orders Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;