import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  projectId: "debate-md2-2603",
});
const db = getFirestore(app);

const subcollections = ["votes", "comments", "sessions", "payloads"];

async function main() {
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, "debates", "sandbox", sub));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, "debates", "sandbox", sub, d.id));
    }
    if (snap.size > 0) console.log(`  ✗ sandbox/${sub}: ${snap.size} docs deleted`);
  }
  console.log("\n✅ sandbox 테스트 데이터 정리 완료");
  process.exit(0);
}

main().catch(console.error);
