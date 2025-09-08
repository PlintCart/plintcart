import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function logAction(merchantId: string, actorUid: string, role: string, action: string, targetPath: string, before: any, after: any) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, `merchants/${merchantId}/auditLogs/${id}`), {
    actorUid, role, action, targetPath, before, after, ts: serverTimestamp(),
  });
}
