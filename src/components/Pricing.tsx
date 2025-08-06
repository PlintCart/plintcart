import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Up to 50 products",
        "WhatsApp integration",
        "Basic analytics",
        "Mobile responsive",
        "Email support"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "Most popular choice for growing businesses",
      features: [
        "Unlimited products",
        "Advanced analytics",
        "Custom branding",
        "Priority support",
        "Multi-language support",
        "Custom integrations",
        "Advanced reporting"
      ],
      buttonText: "Get Started",
      buttonVariant: "success" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large businesses with advanced needs",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Dedicated support",
        "White-label solution",
        "Custom domains",
        "API access",
        "Advanced security"
      ],
      buttonText: "Get Started",
      buttonVariant: "premium" as const,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-background via-accent/20 to-background relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Choose the plan that{" "}
            <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
              works best
            </span>{" "}
            for your business
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and scale as you grow. All plans include our core features with no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group animate-scale-in ${
                plan.popular ? "md:-mt-4 md:mb-4" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="gradient-cta text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-medium">
                    <Star className="w-4 h-4 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`gradient-card rounded-3xl p-8 shadow-soft hover-lift transition-smooth h-full border ${
                  plan.popular
                    ? "border-brand-green/30 shadow-glow"
                    : "border-white/50"
                } relative overflow-hidden`}
              >
                {/* Background Gradient for Popular Plan */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-brand-blue/5 rounded-3xl" />
                )}

                <div className="relative z-10">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    
                    <div className="flex items-baseline justify-center mb-6">
                      <span className="text-5xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-xl text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>

                    <Button
                      variant={plan.buttonVariant}
                      size="lg"
                      className="w-full group"
                    >
                      {plan.buttonText}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-3 group/feature"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center group-hover/feature:bg-brand-green/30 transition-smooth">
                          <Check className="w-3 h-3 text-brand-green" />
                        </div>
                        <span className="text-foreground/80 group-hover/feature:text-foreground transition-smooth">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-20 animate-fade-in">
          <div className="gradient-cta rounded-3xl p-12 shadow-large max-w-4xl mx-auto text-white">
            <h3 className="text-4xl font-bold mb-4">Ready to start selling?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of businesses already using Take.App to boost their sales
            </p>
            <Button variant="success" size="xl" className="bg-white text-primary hover:bg-white/90 shadow-medium">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm mt-4 opacity-75">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;