import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserRole } from '@/lib/zkRoles';
import { useState, useEffect } from 'react';

export function AuthTestComponent() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    };
    fetchRole();
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>🔐 zkLogin Test</CardTitle>
        <CardDescription>Test Google authentication with Sui zkLogin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
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
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Not Connected</Badge>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Connecting...' : '🔑 Sign in with Google'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will create a user document in Firestore and set up zkLogin authentication
            </p>
            
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>💡 Development Mode:</strong> If Enoki API key fails, a mock user will be created for testing staff management features.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
