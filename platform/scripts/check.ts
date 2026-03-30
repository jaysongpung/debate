import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  authDomain: "debate-md2-2603.firebaseapp.com",
  projectId: "debate-md2-2603",
  storageBucket: "debate-md2-2603.firebasestorage.app",
  messagingSenderId: "475801845837",
  appId: "1:475801845837:web:568ca85fedda66f2819c04",
});

const db = getFirestore(app);

async function check() {
  const q = query(collection(db, "debates"), orderBy("startTime", "asc"));
  const snap = await getDocs(q);
  snap.docs.forEach((d) => {
    const data = d.data();
    const startTime = data.startTime.toDate();
    console.log(`${d.id} | ${startTime.toISOString()} | status: ${data.status}`);
  });
  process.exit(0);
}
check();
