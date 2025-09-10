import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { AuthTestComponent } from "@/components/AuthTestComponent";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mt-20">
        <Hero />
        
        {/* zkLogin Test Component - Remove after testing */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <AuthTestComponent />
          </div>
        </div>
        
        <Features />
        {/* Render pricing immediately without waiting for auth/subscription */}
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
