import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { getUserRole } from "@/lib/zkRoles";
import { useState, useEffect } from "react";

interface AuthModalProps {
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
  onSuccess: () => void;
}

export function AuthModal({ mode, onModeChange, onSuccess }: AuthModalProps) {
  const { user, signInWithGoogle, signInWithFacebook, logout, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          const role = await getUserRole(user.id);
          setUserRole(role);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    };
    fetchRole();
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-runs

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // If user is already authenticated, show user info
  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <p className="text-muted-foreground">You're already signed in</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Connected</Badge>
              <Badge variant={userRole ? "default" : "secondary"}>
                Role: {userRole || 'None'}
              </Badge>
            </div>

            <div className="text-sm space-y-1">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Address:</strong> {user.address}</p>
              <p><strong>Display Name:</strong> {user.displayName}</p>
              <p><strong>Role:</strong> {userRole || 'Loading...'}</p>
            </div>

            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              <strong>✅ Success!</strong> User authenticated and document created in Firestore.
              <br />
              <strong>Next:</strong> Go to <a href="/staff/manage" className="underline">Staff Management</a> to assign roles.
            </div>

            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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

        {/* Development Mode Warning */}
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>💡 Development Mode:</strong> If Enoki API key fails, a mock user will be created for testing staff management features.
        </div>
      </CardContent>
    </Card>
  );
}
