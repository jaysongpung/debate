import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

let offsetMs = 0;
let synced = false;

export async function syncServerTime(): Promise<void> {
  if (synced) return;

  const ref = doc(db, "_meta", "time-sync");
  const clientBefore = Date.now();
  await setDoc(ref, { t: serverTimestamp() });
  const snap = await getDoc(ref);
  const clientAfter = Date.now();

  if (snap.exists()) {
    const serverMs = (snap.data().t as Timestamp).toMillis();
    const clientMid = (clientBefore + clientAfter) / 2;
    offsetMs = serverMs - clientMid;
    synced = true;
  }
}

export function getServerNow(): Date {
  return new Date(Date.now() + offsetMs);
}
