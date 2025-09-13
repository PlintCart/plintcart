import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/roles';

export function RoleGate({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }
      
      const role = await getUserRole(user.id);
      setUserRole(role);
      setLoading(false);
    };
    
    fetchRole();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  
  return (userRole && allow.includes(userRole)) ? <>{children}</> : null;
}
