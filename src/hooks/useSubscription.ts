import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// Enoki user type
interface EnokiUser {
  id: string;
  address: string;
  email?: string;
  displayName?: string;
}

export function useSubscription(user: EnokiUser | null) {
  const [subscription, setSubscription] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // No signed-in user; treat as non-premium and stop loading
      setSubscription(null);
      setIsPremium(false);
      setLoading(false);
      return;
    }
    const subRef = doc(db, "subscriptions", user.id);
    const unsub = onSnapshot(subRef, (snap) => {
      const data = snap.data();
      setSubscription(data);
      setIsPremium(!!data?.isPremium);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { subscription, isPremium, loading };
}
