import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  authDomain: "debate-md2-2603.firebaseapp.com",
  projectId: "debate-md2-2603",
  storageBucket: "debate-md2-2603.firebasestorage.app",
  messagingSenderId: "475801845837",
  appId: "1:475801845837:web:568ca85fedda66f2819c04",
});

const db = getFirestore(app);

async function cleanTest() {
  const snap = await getDocs(collection(db, "debates"));
  let deleted = 0;

  for (const d of snap.docs) {
    if (!d.id.startsWith("test-")) continue;

    // 서브컬렉션 삭제 (votes, comments, sessions, payloads)
    for (const sub of ["votes", "comments", "sessions", "payloads"]) {
      const subSnap = await getDocs(
        collection(db, "debates", d.id, sub)
      );
      for (const s of subSnap.docs) {
        await deleteDoc(doc(db, "debates", d.id, sub, s.id));
      }
      if (subSnap.size > 0) {
        console.log(`  ✗ ${d.id}/${sub}: ${subSnap.size} docs deleted`);
      }
    }

    await deleteDoc(doc(db, "debates", d.id));
    console.log(`  ✗ ${d.id} deleted`);
    deleted++;
  }

  console.log(`\n✅ Deleted ${deleted} test debates`);
  process.exit(0);
}

cleanTest().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
