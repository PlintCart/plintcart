import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Get invitation token from URL
  const token = searchParams.get('token');
  const role = searchParams.get('role') || 'staff';

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      navigate('/');
    }
  }, [token, navigate]);

  const handleAcceptInvitation = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Create account
      await signUp(email, password);

      // TODO: Validate invitation token and set role
      // This would call the set-role function with the invitation details
      if (token) {
        // Validate token and get invitation details
        const response = await fetch('/.netlify/functions/validate-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          const invitationData = await response.json();
          // Role will be set automatically via the validation function
          toast.success('Account created and role assigned! Welcome to the team.');
        } else {
          toast.success('Account created successfully! Please contact your administrator to set your role.');
        }
      }

      navigate('/staff');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // If user is already logged in, redirect to staff dashboard
  if (user) {
    navigate('/staff');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join the Team</CardTitle>
          <CardDescription>
            You've been invited to join as a {role}. Create your account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleAcceptInvitation}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Account...' : 'Join Team'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
