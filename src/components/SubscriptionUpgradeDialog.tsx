import React, { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

// Enoki user type
interface EnokiUser {
  id: string;
  address: string;
  email?: string;
  displayName?: string;
}

export interface SubscriptionUpgradeDialogProps {
  user: EnokiUser;
}

interface PaymentDoc {
  status: "pending" | "success" | "failed";
  checkoutRequestId?: string;
  amount: number;
  phoneNumber?: string;
  email?: string;
  createdAt: string;
}

interface SubscriptionDoc {
  isPremium: boolean;
  plan?: string;
  expiresAt?: string;
}

export const SubscriptionUpgradeDialog: React.FC<SubscriptionUpgradeDialogProps> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | null>(null);

  // Listen to subscription status in Firestore
  useEffect(() => {
    if (!user) return;
    const subRef = doc(db, "subscriptions", user.id);
    const unsub = onSnapshot(subRef, (snap) => {
      const data = snap.data() as SubscriptionDoc | undefined;
      setIsPremium(!!data?.isPremium);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Listen to payment status in Firestore
  useEffect(() => {
    if (!user) return;
    const payRef = doc(db, "payments", user.id);
    const unsub = onSnapshot(payRef, (snap) => {
      const data = snap.data() as PaymentDoc | undefined;
      if (data?.status) setPaymentStatus(data.status);
    });
    return () => unsub();
  }, [user]);

  const handleUpgrade = async () => {
    setOpen(true);
    // Initiate MPesa payment via Netlify Function
    try {
      const res = await fetch("/.netlify/functions/emergency-stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "", // fallback to empty string, Enoki user has no phoneNumber
          amount: 2600, // your premium price
          userId: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      // Save payment initiation to Firestore
      await setDoc(doc(db, "payments", user.id), {
        status: "pending",
        checkoutRequestId: data.CheckoutRequestID,
        amount: 2600,
        phoneNumber: "",
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      setPaymentStatus("pending");
    } catch (err) {
      setPaymentStatus("failed");
    }
  };

  const handlePaymentSuccess = async () => {
    await setDoc(doc(db, "subscriptions", user.id), {
      isPremium: true,
      plan: "premium",
      upgradedAt: new Date().toISOString(),
    });
  };

  // When payment is successful, update subscription in Firestore
  useEffect(() => {
    if (paymentStatus === "success" && user) {
      const subRef = doc(db, "subscriptions", user.id);
      updateDoc(subRef, {
        isPremium: true,
        plan: "premium",
        expiresAt: null, // set your expiry logic if needed
      }).catch(() => {
        // If doc doesn't exist, create it
        setDoc(subRef, {
          isPremium: true,
          plan: "premium",
          expiresAt: null,
        });
      });
      setOpen(false);
      setIsPremium(true);
      handlePaymentSuccess();
    }
    if (paymentStatus === "pending") setOpen(true);
    if (paymentStatus === "failed") setOpen(false);
  }, [paymentStatus, user]);

  if (loading) return <span>Checking subscription...</span>;
  if (isPremium) return <span className="text-green-600 font-semibold">Premium Active</span>;

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleUpgrade}>
        Upgrade to Premium
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upgrade to Premium</DialogTitle>
        <DialogContent>
          {paymentStatus === "pending" && (
            <span>Waiting for MPesa payment confirmation...</span>
          )}
          {paymentStatus === "failed" && (
            <span className="text-red-600">Payment failed. Please try again.</span>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};