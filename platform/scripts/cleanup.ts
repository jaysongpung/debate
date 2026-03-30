import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  authDomain: "debate-md2-2603.firebaseapp.com",
  projectId: "debate-md2-2603",
  storageBucket: "debate-md2-2603.firebasestorage.app",
  messagingSenderId: "475801845837",
  appId: "1:475801845837:web:568ca85fedda66f2819c04",
});

const db = getFirestore(app);

async function cleanup() {
  const snap = await getDocs(collection(db, "debates"));
  let deleted = 0;
  for (const d of snap.docs) {
    // 2025년 데이터 삭제 (debate-2025xxxx)
    if (d.id.startsWith("debate-2025")) {
      await deleteDoc(doc(db, "debates", d.id));
      console.log(`  ✗ deleted ${d.id}`);
      deleted++;
    } else {
      console.log(`  ✓ kept ${d.id}`);
    }
  }
  console.log(`\n✅ Deleted ${deleted} old debates`);
  process.exit(0);
}
cleanup();
