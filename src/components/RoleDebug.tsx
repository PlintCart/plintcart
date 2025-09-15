import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/roles';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function RoleDebug() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [rawUserDoc, setRawUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get role via our function
      const fetchedRole = await getUserRole(user.id);
      setRole(fetchedRole);
      
      // Get raw Firestore document
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        setRawUserDoc(userDoc.data());
      } else {
        setRawUserDoc({ error: 'Document does not exist' });
      }
      
      console.log('🔍 Debug results:', {
        userId: user.id,
        userEmail: user.email,
        fetchedRole,
        rawDoc: userDoc.exists() ? userDoc.data() : 'No document'
      });
    } catch (error) {
      console.error('Debug error:', error);
      setRawUserDoc({ error: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      debugUser();
    }
  }, [user]);

  if (!user) return <div className="p-4 bg-yellow-100">No user logged in</div>;

  return (
    <div className="p-4 bg-gray-100 border rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">🔍 Role Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>User Email:</strong> {user.email}</div>
        <div><strong>Display Name:</strong> {user.displayName}</div>
        
        <div><strong>Fetched Role:</strong> 
          <span className={`ml-2 px-2 py-1 rounded ${role ? 'bg-green-200' : 'bg-red-200'}`}>
            {role || 'null'}
          </span>
        </div>
        
        <div><strong>Raw Firestore Doc:</strong></div>
        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
          {JSON.stringify(rawUserDoc, null, 2)}
        </pre>
        
        <button 
          onClick={debugUser}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Re-check'}
        </button>
      </div>
    </div>
  );
}
