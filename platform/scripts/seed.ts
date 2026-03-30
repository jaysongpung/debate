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

const students: [string, string][] = [
  ["20231591", "222"],
  ["20231593", "1004"],
  ["20251163", "alice"],
  ["20251169", "ian"],
  ["20251170", "amy"],
  ["20251180", "momlove"],
  ["20251192", "soori"],
  ["20252714", "zero"],
  ["20252922", "noun"],
  ["20252987", "nemo"],
  ["20253024", "sin"],
  ["20253053", "kyo"],
  ["20253094", "wal7676"],
  ["20253163", "kuchipatchi"],
  ["20253168", "yoonin"],
  ["20253178", "malangko"],
  ["20253320", "dang"],
  ["20253437", "oyajitchi"],
  ["20221659", "nonew"],
  ["20231573", "bulkyboy"],
  ["20221607", "yongari"],
  ["20221654", "tomo"],
  ["20211605", "ellia"],
  ["20211648", "i1i11i"],
  ["20241806", "dan"],
];

async function seed() {
  console.log("Seeding users...");

  // 그레고리 (관리자)
  await setDoc(doc(db, "users", "gregory"), {
    nickname: "gregory",
    studentId: "admin",
    role: "admin",
  });
  console.log("  ✓ gregory (admin)");

  // 학생 25명
  for (const [studentId, nickname] of students) {
    await setDoc(doc(db, "users", nickname), {
      nickname,
      studentId,
      role: "student",
    });
    console.log(`  ✓ ${nickname} (${studentId})`);
  }

  console.log("\nSeeding debates (28 days: 3/31 ~ 4/27)...");

  // 닉네임 목록 셔플 (아젠다세터/아키텍트 배정용)
  const nicknames = students.map(([, n]) => n);
  const shuffledForAgenda = [...nicknames].sort(() => Math.random() - 0.5);
  const shuffledForArchitect = [...nicknames].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 28; i++) {
    const date = new Date(2026, 2, 31 + i); // 3/31 = month 2 (0-indexed), day 31
    date.setHours(18, 0, 0, 0); // 오후 6시

    const debateId = `debate-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    // 이전 데이터 덮어쓰기

    const isGregoryDays = i < 3; // 첫 3일은 그레고리
    const agendaSetter = isGregoryDays ? "gregory" : shuffledForAgenda[i - 3];
    const architect = isGregoryDays ? "gregory" : shuffledForArchitect[i - 3];

    await setDoc(doc(db, "debates", debateId), {
      title: "",
      url: "",
      agendaSetter,
      architect,
      startTime: Timestamp.fromDate(date),
      status: "pending",
      stats: {
        proCount: 0,
        conCount: 0,
        avgDuration: 0,
        commentCount: 0,
      },
    });

    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    console.log(`  ✓ ${debateId} (${dateStr}) — 아젠다: ${agendaSetter}, 아키텍트: ${architect}`);
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
