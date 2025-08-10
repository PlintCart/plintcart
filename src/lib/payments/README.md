# Payments Integration (Swypt)

Flow:
1. Frontend calls callable function `payments_init` with orderId.
2. Cloud Function validates order, creates Swypt payment, stores pending status.
3. Swypt sends webhook -> `swypt_webhook` updates order to paid/failed.
4. UI polls or reflects real-time changes via Firestore listener (future enhancement).

Next Enhancements:
- Implement real signature verification in `verifySignature`.
- Add Firestore security rules preventing client writes to payment fields.
- Add subscription create/cancel flows.
- Real-time listener in `usePayment` to update status instantly.
