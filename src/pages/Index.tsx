import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase"; // adjust path as needed

const Index = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth); // Get current Firebase user

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
        <Pricing user={user} /> {/* Pass user prop here */}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
