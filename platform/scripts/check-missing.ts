import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  projectId: "debate-md2-2603",
});
const db = getFirestore(app);

const debateId = process.argv[2] || "debate-20260331";

async function main() {
  const users = await getDocs(collection(db, "users"));
  const allNicknames = new Set<string>();
  users.forEach((doc) => { if (doc.data().role === "student") allNicknames.add(doc.id); });

  const comments = await getDocs(collection(db, "debates", debateId, "comments"));
  const commented = new Set<string>();
  comments.forEach((doc) => commented.add(doc.id));

  const missing = [...allNicknames].filter((n) => !commented.has(n)).sort();
  console.log(`${debateId} 인사이트 미작성 (${missing.length}명):`);
  missing.forEach((n) => console.log("  " + n));

  process.exit(0);
}

main().catch(console.error);
