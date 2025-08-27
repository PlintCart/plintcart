import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "../lib/firebase";

export function useSubscription(user: User | null) {
  const [subscription, setSubscription] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const subRef = doc(db, "subscriptions", user.uid);
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