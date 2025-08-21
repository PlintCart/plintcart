import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    expiringSoon: 0,
  });
  const [modal, setModal] = useState<null | {
    action: "deactivate" | "upgrade" | "downgrade" | "view";
    userId: string;
  }>(null);

  const handleDowngrade = (userId: string) => {
    setModal({ action: "downgrade", userId });
  };
  // User management handlers
  const handleDeactivate = (userId: string) => {
    setModal({ action: "deactivate", userId });
  };
  const handleUpgrade = (userId: string) => {
    setModal({ action: "upgrade", userId });
  };
  const handleViewDetails = (userId: string) => {
    setModal({ action: "view", userId });
  };
  const handleConfirm = async () => {
    if (!modal) return;
    if (modal.action === "upgrade") {
      try {
        const userRef = doc(db, "users", modal.userId);
        await updateDoc(userRef, {
          subscriptionTier: "premium",
          subscriptionStatus: "upgraded"
        });
        setUsers(prev => prev.map(u =>
          u.id === modal.userId
            ? { ...u, subscriptionTier: "premium", subscriptionStatus: "upgraded" }
            : u
        ));
      } catch (err) {
        alert("Failed to upgrade user: " + err);
      }
    } else if (modal.action === "downgrade") {
      try {
        const userRef = doc(db, "users", modal.userId);
        await updateDoc(userRef, {
          subscriptionTier: "free",
          subscriptionStatus: "downgraded"
        });
        setUsers(prev => prev.map(u =>
          u.id === modal.userId
            ? { ...u, subscriptionTier: "free", subscriptionStatus: "downgraded" }
            : u
        ));
      } catch (err) {
        alert("Failed to downgrade user: " + err);
      }
    }
    setModal(null);
  };
  const handleCancel = () => setModal(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
  const snapshot = await getDocs(collection(db, "users"));
  const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("Fetched users:", userList.map(u => u.id));
  setUsers(userList);

        // Analytics calculations
        const now = Date.now();
        let activeSubscriptions = 0;
        let totalRevenue = 0;
        let expiringSoon = 0;
        userList.forEach(user => {
          const u = user as any;
          // Subscription status
          let expires: Date | null = null;
          if (u.subscriptionEnd && typeof u.subscriptionEnd === 'object' && typeof u.subscriptionEnd.toDate === 'function') {
            expires = u.subscriptionEnd.toDate();
          } else if (u.subscriptionExpires && typeof u.subscriptionExpires === 'object' && typeof u.subscriptionExpires.toDate === 'function') {
            expires = u.subscriptionExpires.toDate();
          }
          if (expires && expires.getTime() > now) {
            activeSubscriptions++;
            // Expiring within 7 days
            if (expires.getTime() - now < 7 * 24 * 60 * 60 * 1000) expiringSoon++;
          }
          // Revenue
          if (u.lastPayment && typeof u.lastPayment === 'object' && u.lastPayment.amount) {
            totalRevenue += Number(u.lastPayment.amount);
          }
        });
        setStats({
          totalUsers: userList.length,
          activeSubscriptions,
          totalRevenue,
          expiringSoon,
        });
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-4">Super Admin Dashboard</h1>
      <p className="text-lg text-muted-foreground mb-8">Full management, supervision, and analytics for your business.</p>
      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          <div className="text-sm text-muted-foreground">Active Subscriptions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold">{stats.expiringSoon}</div>
          <div className="text-sm text-muted-foreground">Expiring Soon</div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
        {loading ? (
          <div>Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-2 text-xs text-gray-500">Debug: Fetched {users.length} users: {users.map(u => u.id).join(", ")}</div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Expires</th>
                  <th className="px-4 py-2 text-left">Last Payment</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const u = user as any;
                  return (
                    <tr key={user.id} className="border-b">
                      <td className="px-4 py-2">{u.email || u.phone || user.id}</td>
                      <td className="px-4 py-2">{u.subscriptionTier || u.subscription || 'free'}</td>
                      <td className="px-4 py-2">{u.subscriptionStatus || 'active'}</td>
                      <td className="px-4 py-2">{u.subscriptionEnd?.toDate ? u.subscriptionEnd.toDate().toLocaleDateString() : (u.subscriptionExpires?.toDate ? u.subscriptionExpires.toDate().toLocaleDateString() : 'N/A')}</td>
                      <td className="px-4 py-2">
                        {u.lastPayment ? (
                          <>
                            <span>KES {u.lastPayment.amount}</span><br />
                            <span>{u.lastPayment.mpesaReceiptNumber}</span><br />
                            <span>{u.lastPayment.timestamp ? new Date(u.lastPayment.timestamp).toLocaleString() : ''}</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            onClick={() => handleDeactivate(user.id)}
                          >Deactivate</button>
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            onClick={() => handleUpgrade(user.id)}
                          >Upgrade</button>
                          <button
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                            onClick={() => handleDowngrade(user.id)}
                          >Downgrade</button>
                          <button
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            onClick={() => handleViewDetails(user.id)}
                          >View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Confirmation Modal OUTSIDE table */}
      {modal && modal.action === "view" ? (
        (() => {
          const user = users.find(u => u.id === modal.userId);
          if (!user) return null;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
                <h3 className="text-lg font-semibold mb-4">User Details</h3>
                <div className="mb-4">
                  <div><span className="font-semibold">Email:</span> {user.email || user.phone || user.id}</div>
                  <div><span className="font-semibold">Tier:</span> {user.subscriptionTier || user.subscription || 'free'}</div>
                  <div><span className="font-semibold">Status:</span> {user.subscriptionStatus || 'active'}</div>
                  <div><span className="font-semibold">Expires:</span> {user.subscriptionEnd?.toDate ? user.subscriptionEnd.toDate().toLocaleDateString() : (user.subscriptionExpires?.toDate ? user.subscriptionExpires.toDate().toLocaleDateString() : 'N/A')}</div>
                  <div><span className="font-semibold">Last Payment:</span> {user.lastPayment ? `KES ${user.lastPayment.amount}, ${user.lastPayment.mpesaReceiptNumber}, ${user.lastPayment.timestamp ? new Date(user.lastPayment.timestamp).toLocaleString() : ''}` : '—'}</div>
                </div>
                <div className="flex gap-4 justify-end">
                  <button className="px-4 py-2 bg-gray-200 rounded" onClick={handleCancel}>Close</button>
                </div>
              </div>
            </div>
          );
        })()
      ) : modal ? (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="mb-6">
              {modal.action === "deactivate" && "Are you sure you want to deactivate this user?"}
              {modal.action === "upgrade" && "Are you sure you want to upgrade this user's subscription?"}
              {modal.action === "downgrade" && "Are you sure you want to downgrade this user's subscription?"}
            </p>
            <div className="flex gap-4 justify-end">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={handleCancel}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SuperAdminDashboard;
