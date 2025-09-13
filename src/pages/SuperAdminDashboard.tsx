import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../lib/roles';
import type { Role } from '../lib/roles';
import { toast } from 'sonner';
import { getUserRole } from '../lib/roles';
import { Users, AlertTriangle, BarChart3, MessageSquare } from 'lucide-react';
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

interface Owner {
  uid: string;
  email: string;
  displayName: string;
  isActive: boolean;
  staff: string[];
  joinedAt: Date;
}

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendingOwner, setSuspendingOwner] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const role = await getUserRole(user.id);
      setCurrentRole(role);
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const ownersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'owner')
      );
      const ownersSnapshot = await getDocs(ownersQuery);
      
      const ownersList = ownersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        joinedAt: doc.data().signInTime?.toDate() || new Date(),
      })) as Owner[];

      setOwners(ownersList);
    } catch (error) {
      console.error('Error fetching owners:', error);
      toast.error('Failed to load owners');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendOwner = async (ownerId: string) => {
    try {
      setSuspendingOwner(ownerId);
      const ownerRef = doc(db, 'users', ownerId);
      await updateDoc(ownerRef, {
        isActive: false,
        suspendedAt: new Date(),
        suspendedBy: user?.id
      });
      
      await fetchOwners();
      toast.success('Owner has been suspended');
    } catch (error) {
      console.error('Error suspending owner:', error);
      toast.error('Failed to suspend owner');
    } finally {
      setSuspendingOwner(null);
    }
  };

  const handleReactivateOwner = async (ownerId: string) => {
    try {
      setSuspendingOwner(ownerId);
      const ownerRef = doc(db, 'users', ownerId);
      await updateDoc(ownerRef, {
        isActive: true,
        reactivatedAt: new Date(),
        reactivatedBy: user?.id
      });
      
      await fetchOwners();
      toast.success('Owner has been reactivated');
    } catch (error) {
      console.error('Error reactivating owner:', error);
      toast.error('Failed to reactivate owner');
    } finally {
      setSuspendingOwner(null);
    }
  };

  // Check if user has super admin access
  if (!can.managePlatform(currentRole as Role)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the Super Admin Dashboard.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Platform</span> Administration
          </h1>
          <p className="text-muted-foreground">Manage store owners, monitor platform activity, and handle feedback</p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{owners.length}</div>
              <p className="text-xs text-muted-foreground">
                Active store owners on platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {owners.reduce((acc, owner) => acc + (owner.staff?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Staff members across all owners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Customer feedback pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Owner Management */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Management</CardTitle>
            <CardDescription>
              View and manage all store owners on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading owners...</p>
              ) : owners.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No owners found. Owners will appear here once they sign up.
                </p>
              ) : (
                owners.map((owner) => (
                  <div key={owner.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{owner.displayName}</h3>
                        <Badge variant={owner.isActive ? "default" : "secondary"}>
                          {owner.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{owner.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {owner.staff?.length || 0} staff members
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {owner.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspendOwner(owner.uid)}
                          disabled={suspendingOwner === owner.uid}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivateOwner(owner.uid)}
                          disabled={suspendingOwner === owner.uid}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
            <CardDescription>
              Overview of platform performance and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
          </CardContent>
        </Card>

        {/* Feedback Management */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Feedback</CardTitle>
            <CardDescription>
              Review and respond to customer feedback and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Feedback management system coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
