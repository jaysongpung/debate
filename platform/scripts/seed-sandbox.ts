import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  authDomain: "debate-md2-2603.firebaseapp.com",
  projectId: "debate-md2-2603",
  storageBucket: "debate-md2-2603.firebasestorage.app",
  messagingSenderId: "475801845837",
  appId: "1:475801845837:web:568ca85fedda66f2819c04",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  // startTime을 항상 "지금"으로 설정 → 항상 active 상태
  // Cloud Functions가 status를 바꿀 수 있으므로, startTime을 매우 먼 미래로 설정하지 않고
  // 현재 시각으로 설정하여 24시간 동안 active 유지
  const now = new Date();
  now.setMinutes(0, 0, 0);

  await setDoc(doc(db, "debates", "sandbox"), {
    title: "[테스트] 자유 테스트 토론",
    url: "",
    agendaSetter: "test",
    architect: "test",
    startTime: Timestamp.fromDate(now),
    status: "active",
    stats: { proCount: 0, conCount: 0, avgDuration: 0, commentCount: 0 },
  });

  console.log("✅ sandbox 토론 생성 완료");
  console.log("   architect: test");
  console.log("   status: active (24시간 유지)");
  console.log("");
  console.log("학생 테스트 방법:");
  console.log('   1. data-architect-id="test" 로 설정');
  console.log("   2. ?nickname=본인닉네임&side=pro 로 접속");
  console.log("");
  console.log("주의: 24시간 후 reviewing으로 전환됩니다.");
  console.log("      다시 active로 만들려면 이 스크립트를 재실행하세요.");

  process.exit(0);
}

main().catch(console.error);
