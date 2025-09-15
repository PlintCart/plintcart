import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../lib/roles';
import type { Role } from '../lib/roles';
import { toast } from 'sonner';
import { AdminLayout } from '../components/AdminLayout';
import { getUserRole } from '../lib/roles';
import { Copy, Mail, CheckCircle, ExternalLink } from 'lucide-react';

export default function StaffManagement() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  
  // Invitation dialog state
  const [invitationDialog, setInvitationDialog] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    link: string;
    email: string;
    welcomeMessage: string;
  } | null>(null);

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
      
      if (data.invitationLink) {
        // Create welcome message
        const welcomeMessage = `🎉 You've been invited to join our team!

Hi there! You've been invited to join as a staff member for our store. This invitation gives you access to manage products, orders, and help customers.

Click the link below to accept your invitation and create your account:
${data.invitationLink}

This invitation will expire in 7 days.

Welcome aboard! 🚀`;

        // Show invitation dialog
        setInvitationData({
          link: data.invitationLink,
          email: email.trim(),
          welcomeMessage
        });
        setInvitationDialog(true);
        
        toast.success('Invitation created successfully!');
        
        // Clear form
        setEmail('');
      } else {
        toast.success(`Invitation sent to ${email} with ${role} role`);
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

        {/* Email Service Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitation System Ready
          </h3>
          <p className="text-blue-700 text-sm mt-1">
            When you invite staff members, you'll get a beautifully formatted welcome message with the invitation link.
            Copy the message and share it via email, WhatsApp, or any messaging platform.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Staff Member</CardTitle>
            <CardDescription>
              Create an invitation link to grant staff access to your store
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

      {/* Invitation Dialog */}
      <Dialog open={invitationDialog} onOpenChange={setInvitationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Invitation Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Share this invitation with <strong>{invitationData?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Welcome Message</Label>
              <Textarea
                value={invitationData?.welcomeMessage || ''}
                readOnly
                className="min-h-[120px] font-mono text-sm"
                placeholder="Welcome message will appear here..."
              />
            </div>

            {/* Invitation Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invitation Link</Label>
              <div className="flex gap-2">
                <Input
                  value={invitationData?.link || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(invitationData?.link || '');
                    toast.success('Link copied to clipboard!');
                  }}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  const message = `${invitationData?.welcomeMessage}\n\nDirect link: ${invitationData?.link}`;
                  navigator.clipboard.writeText(message);
                  toast.success('Full message copied to clipboard!');
                }}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Copy Full Message
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  window.open(`mailto:${invitationData?.email}?subject=You're invited to join our team!&body=${encodeURIComponent(invitationData?.welcomeMessage || '')}`, '_blank');
                }}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Email Client
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              💡 <strong>Tip:</strong> Copy the full message and send it via email, WhatsApp, or any messaging app. 
              The invitation link will expire in 7 days.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
