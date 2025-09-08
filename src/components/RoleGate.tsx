import { ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase'; // Adjust path to your Firebase config

export function RoleGate({ allow, children }: { allow: string[]; children: ReactNode }) {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div>Loading...</div>;
  const role = (user as any)?.stsTokenManager?.claims?.role || (user as any)?.role;
  return allow.includes(role) ? <>{children}</> : null;
}
