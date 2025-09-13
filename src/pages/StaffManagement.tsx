import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../lib/roles';
import type { Role } from '../lib/roles';
import { toast } from 'sonner';
import { AdminLayout } from '../components/AdminLayout';
import { getUserRole } from '../lib/roles';

export default function StaffManagement() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // Get current user's role using Firebase auth
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setCurrentRole(null);
        return;
      }
      
      const userRole = await getUserRole(user.id);
      setCurrentRole(userRole);
    };
    
    fetchRole();
    
    // Listen for role changes
    const handleRoleChange = () => {
      fetchRole();
    };
    
    window.addEventListener('roleChanged', handleRoleChange);
    
    return () => {
      window.removeEventListener('roleChanged', handleRoleChange);
    };
  }, [user]);

  // Only vendors can manage staff
  if (!can.manageStaff(currentRole as Role)) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-medium">Access Restricted</h2>
            <p className="text-red-700 mt-1">
              Only owners can manage staff. Your current role: <strong>{currentRole || 'No role assigned'}</strong>
            </p>
            <p className="text-red-600 text-sm mt-2">
              If you need access to staff management, please contact your store owner or upgrade to an owner account.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handleInviteStaff = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      // Get merchantId - for Firebase auth, we'll use user.id as basis
      let merchantId = null;
      
      if (user) {
        // Use the user's UID as the vendor ID
        merchantId = user.uid || user.id;
        console.log('🔧 Using vendor ID:', merchantId);
      }

      if (!merchantId) {
        toast.error('Unable to determine vendor ID');
        return;
      }

      const response = await fetch('/.netlify/functions/invite-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authorization header with Firebase ID token
        },
        body: JSON.stringify({
          email: email.trim(),
          role: 'staff', // All invitations are for staff role
          vendorId: merchantId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      const data = await response.json();
      toast.success(`Invitation sent to ${email} with ${role} role`);

      // In development, show the invitation link
      if (data.invitationLink) {
        console.log('Invitation link:', data.invitationLink);
        toast.info('Check console for invitation link (dev mode)');
      }

      setEmail('');
      setRole('staff');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">Staff</span> Management
          </h1>
          <p className="text-muted-foreground">Invite team members and manage their access levels</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Staff Member</CardTitle>
            <CardDescription>
              Send an invitation email to grant access to your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff - Product and order management, customer support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleInviteStaff}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Staff</CardTitle>
            <CardDescription>
              Manage existing team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Staff list will be displayed here</p>
            {/* TODO: Add staff list component */}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
