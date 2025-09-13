import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mt-20">
        <Hero />
        

        
        <Features />
        {/* Render pricing immediately without waiting for auth/subscription */}
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
