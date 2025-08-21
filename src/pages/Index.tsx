import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div className="flex justify-center mt-8">
          <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
            Get Started
          </Button>
        </div>
        <Features />
        <Pricing />
        
        {/* Support Section */}
        <section id="support" className="py-24 bg-background">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Need Help?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're here to help you get started with your business storefront
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">📧 Email Support</h3>
                <p className="text-muted-foreground">Get help via email within 24 hours</p>
              </div>
              <div className="p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">💬 Live Chat</h3>
                <p className="text-muted-foreground">Chat with our support team instantly</p>
              </div>
              <div className="p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">📖 Documentation</h3>
                <p className="text-muted-foreground">Comprehensive guides and tutorials</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
