import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa"; // better than custom SVG

interface AuthModalProps {
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
  onSuccess: () => void;
}

export function AuthModal({ mode, onModeChange, onSuccess }: AuthModalProps) {
  const { signInWithGoogle, signInWithFacebook, loading } = useAuth();

  const handleConnectGoogle = async () => {
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (error) {
      console.error("Google connection error:", error);
    }
  };

  const handleConnectFacebook = async () => {
    try {
      await signInWithFacebook();
      onSuccess();
    } catch (error) {
      console.error("Facebook connection error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <p className="text-muted-foreground">
          {mode === "signin"
            ? "Sign in to continue"
            : "Start by connecting your account"}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleConnectGoogle}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <FcGoogle className="w-5 h-5 mr-2" />
          )}
          {loading ? "Connecting..." : "Continue with Google"}
        </Button>

        {/* Facebook Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleConnectFacebook}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <FaFacebook className="w-5 h-5 mr-2 text-[#1877F2]" />
          )}
          {loading ? "Connecting..." : "Continue with Facebook"}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue later
            </span>
          </div>
        </div>

        {/* Switch Sign In / Sign Up */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {mode === "signin"
              ? "Don’t have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() =>
              onModeChange(mode === "signin" ? "signup" : "signin")
            }
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
