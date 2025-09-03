import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionUpgradeDialog } from './SubscriptionUpgradeDialog';
import { PremiumBadge } from './PremiumWrapper';
import { useState } from 'react';

// Testimonials data
const testimonials = [
  {
    quote: "Before Plint, we were guessing what products to stock. Now, we see exactly what sells, track customers who keep coming back, and spend less time worrying about sales.",
    author: "Early Merchant Partner"
  },
  {
    quote: "The analytics dashboard transformed how we understand our customers. We've increased repeat purchases by 40% just by knowing what they actually want.",
    author: "Sarah K., Electronics Store Owner"
  },
  {
    quote: "Stock management used to be a nightmare. Plint's system tells us exactly when to reorder and what's trending. Our shelves are never empty anymore.",
    author: "Mike R., Fashion Boutique"
  },
  {
    quote: "The payment processing is seamless. Our customers love the quick M-Pesa integration, and we get paid faster than ever before.",
    author: "Grace M., Home Goods Store"
  }
];

// Testimonials Slideshow Component
const TestimonialsSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative">
      {/* Main testimonial card */}
      <div className="bg-background rounded-2xl shadow-soft border p-8 mx-auto max-w-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </div>
          <p className="text-xl text-muted-foreground mb-6 italic">
            "{testimonials[currentIndex].quote}"
          </p>
          <div className="text-sm text-foreground font-semibold">
            — {testimonials[currentIndex].author}
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevTestimonial}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border shadow-sm hover:shadow-md transition-all duration-200 hover:bg-accent"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        onClick={nextTestimonial}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border shadow-sm hover:shadow-md transition-all duration-200 hover:bg-accent"
        aria-label="Next testimonial"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex 
                ? 'bg-brand-green w-6' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const Pricing = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const { isPremium, loading } = useSubscription(user);

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };
  
  const plans = [
    {
      name: "Starter",
      price: "KSh 650",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Up to 100 products",
        "Basic analytics",
        "Mobile responsive",
        "Product sharing",
        "Email support"
      ],
      buttonText: "Get Started",
      buttonVariant: "success" as const,
      popular: false
    },
    {
      name: "Professional", 
      price: "KSh 2,600",
      period: "/month",
      description: "Most popular choice for growing businesses",
      features: [
        "Unlimited products",
        "Advanced analytics",
        "Custom branding & themes", 
        "Priority support",
        "Multi-currency support",
        "Custom business settings",
        "Advanced product sharing",
        "Store customization"
      ],
      buttonText: "Get Started",
      buttonVariant: "success" as const,
      popular: true
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-background via-accent/20 to-background relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Choose the plan that{" "}
            <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
              works best
            </span>{" "}
            for your business
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start and scale as you grow. All plans include our core features with no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${
                plan.popular ? "md:-mt-4 md:mb-4" : ""
              }`}
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

              <div className="gradient-card rounded-3xl p-8 shadow-soft hover-lift transition-smooth h-full border border-brand-green/30 shadow-glow relative overflow-hidden">
                {/* Background Gradient for All Plans */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-brand-blue/5 rounded-3xl" />

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
                      onClick={handleGetStarted}
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

        {/* Testimonials Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold mb-8 text-center text-foreground">What Our Merchants Say</h3>
          <TestimonialsSlideshow />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
