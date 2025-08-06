import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') as 'signin' | 'signup' || 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Update mode when URL parameter changes
  useEffect(() => {
    const urlMode = searchParams.get('mode') as 'signin' | 'signup';
    if (urlMode && (urlMode === 'signin' || urlMode === 'signup')) {
      setMode(urlMode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !loading) {
      navigate('/admin');
    }
  }, [user, loading, navigate]);

  const handleAuthSuccess = () => {
    navigate('/admin');
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    // Update URL to reflect the new mode
    navigate(`/auth?mode=${newMode}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <AuthModal 
        mode={mode} 
        onModeChange={handleModeChange} 
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Auth;
