import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
  authDomain: "debate-md2-2603.firebaseapp.com",
  projectId: "debate-md2-2603",
  storageBucket: "debate-md2-2603.firebasestorage.app",
  messagingSenderId: "475801845837",
  appId: "1:475801845837:web:568ca85fedda66f2819c04",
});

const db = getFirestore(app);

async function seedTest() {
  const now = new Date();
  const HOUR = 60 * 60 * 1000;

  // 4가지 상태의 토론
  const debates = [
    {
      id: "test-pending",
      title: "[테스트] 대기중 토론",
      startTime: new Date(now.getTime() + 24 * HOUR), // 내일
      agendaSetter: "gregory",
      architect: "gregory",
    },
    {
      id: "test-active",
      title: "[테스트] AI가 인간의 창의성을 대체할 수 있는가?",
      startTime: new Date(now.getTime() - 2 * HOUR), // 2시간 전
      agendaSetter: "alice",
      architect: "dan",
      url: "https://example.com/debate-active",
    },
    {
      id: "test-reviewing",
      title: "[테스트] 대학 등록금은 무상이어야 하는가?",
      startTime: new Date(now.getTime() - 26 * HOUR), // 26시간 전 (집계중)
      agendaSetter: "nemo",
      architect: "kyo",
      url: "https://example.com/debate-reviewing",
    },
    {
      id: "test-closed",
      title: "[테스트] SNS 익명성은 보장되어야 하는가?",
      startTime: new Date(now.getTime() - 50 * HOUR), // 50시간 전 (종료)
      agendaSetter: "zero",
      architect: "tomo",
      url: "https://example.com/debate-closed",
    },
  ];

  console.log("Seeding test debates...");
  for (const d of debates) {
    await setDoc(doc(db, "debates", d.id), {
      title: d.title,
      url: d.url ?? "",
      agendaSetter: d.agendaSetter,
      architect: d.architect,
      startTime: Timestamp.fromDate(d.startTime),
      status: "pending",
      stats: {
        proCount: d.id === "test-closed" ? 12 : d.id === "test-reviewing" ? 8 : 0,
        conCount: d.id === "test-closed" ? 11 : d.id === "test-reviewing" ? 13 : 0,
        avgDuration: d.id === "test-closed" ? 720 : d.id === "test-reviewing" ? 540 : 0,
        commentCount: d.id === "test-closed" ? 5 : 0,
      },
    });
    console.log(`  ✓ ${d.id} — ${d.title}`);
  }

  // test-active: 투표 데이터 (일부 학생 투표 완료, 일부 미투표)
  console.log("\nSeeding votes for test-active...");
  const voters = [
    { nickname: "222", side: "pro" },
    { nickname: "1004", side: "con" },
    { nickname: "ian", side: "pro" },
    { nickname: "amy", side: "con" },
    { nickname: "momlove", side: "pro" },
    { nickname: "soori", side: "con" },
    { nickname: "zero", side: "pro" },
    { nickname: "noun", side: "pro" },
    { nickname: "nemo", side: "con" },
    { nickname: "sin", side: "pro" },
  ];
  for (const v of voters) {
    await setDoc(doc(db, "debates", "test-active", "votes", v.nickname), {
      side: v.side,
      votedAt: Timestamp.now(),
    });
    console.log(`  ✓ ${v.nickname} → ${v.side}`);
  }

  // test-reviewing: 투표 데이터
  console.log("\nSeeding votes for test-reviewing...");
  const reviewVoters = [
    { nickname: "222", side: "pro" },
    { nickname: "1004", side: "con" },
    { nickname: "alice", side: "pro" },
    { nickname: "ian", side: "con" },
    { nickname: "amy", side: "con" },
    { nickname: "momlove", side: "pro" },
    { nickname: "soori", side: "con" },
    { nickname: "zero", side: "pro" },
    { nickname: "noun", side: "pro" },
    { nickname: "sin", side: "con" },
    { nickname: "malangko", side: "pro" },
    { nickname: "dang", side: "con" },
    { nickname: "dan", side: "pro" },
    { nickname: "bulkyboy", side: "con" },
    { nickname: "yoonin", side: "pro" },
    { nickname: "nonew", side: "con" },
    { nickname: "tomo", side: "con" },
    { nickname: "yongari", side: "con" },
    { nickname: "ellia", side: "pro" },
    { nickname: "i1i11i", side: "con" },
    { nickname: "oyajitchi", side: "con" },
  ];
  for (const v of reviewVoters) {
    await setDoc(doc(db, "debates", "test-reviewing", "votes", v.nickname), {
      side: v.side,
      votedAt: Timestamp.now(),
    });
  }
  console.log(`  ✓ ${reviewVoters.length} votes`);

  // test-closed: 투표 + 코멘트 + 베스트 인사이트
  console.log("\nSeeding votes for test-closed...");
  const closedVoters = [
    { nickname: "222", side: "pro" },
    { nickname: "1004", side: "con" },
    { nickname: "alice", side: "pro" },
    { nickname: "ian", side: "con" },
    { nickname: "amy", side: "con" },
    { nickname: "momlove", side: "pro" },
    { nickname: "soori", side: "con" },
    { nickname: "noun", side: "pro" },
    { nickname: "nemo", side: "con" },
    { nickname: "sin", side: "pro" },
    { nickname: "malangko", side: "pro" },
    { nickname: "dang", side: "con" },
    { nickname: "dan", side: "pro" },
    { nickname: "bulkyboy", side: "con" },
    { nickname: "yoonin", side: "pro" },
    { nickname: "nonew", side: "con" },
    { nickname: "ellia", side: "pro" },
    { nickname: "i1i11i", side: "con" },
    { nickname: "yongari", side: "con" },
    { nickname: "oyajitchi", side: "pro" },
    { nickname: "kuchipatchi", side: "pro" },
    { nickname: "kyo", side: "con" },
    { nickname: "wal7676", side: "con" },
  ];
  for (const v of closedVoters) {
    await setDoc(doc(db, "debates", "test-closed", "votes", v.nickname), {
      side: v.side,
      votedAt: Timestamp.now(),
    });
  }
  console.log(`  ✓ ${closedVoters.length} votes`);

  console.log("\nSeeding comments for test-closed...");
  const comments = [
    {
      nickname: "alice",
      role: "participant",
      persuaded: true,
      analysis: "익명성이 보장되어야 한다는 주장에 설득되었다. 실명제가 오히려 소수 의견을 억압할 수 있다는 논점이 강력했다. 특히 내부고발자 보호 사례가 인상적이었다.",
    },
    {
      nickname: "ian",
      role: "participant",
      persuaded: false,
      analysis: "여전히 익명성이 사이버 폭력을 조장한다고 생각한다. 상대 진영의 논리가 이상적이긴 하지만 현실적으로 익명 뒤에 숨어 타인을 공격하는 사례가 너무 많다.",
    },
    {
      nickname: "222",
      role: "participant",
      persuaded: true,
      analysis: "UI가 찬반 의견을 나란히 보여줘서 비교하기 좋았다. 처음엔 반대였지만 찬성 측 논거를 읽다 보니 생각이 바뀌었다. 인터페이스가 설득에 영향을 준 것 같다.",
    },
    {
      nickname: "zero",
      role: "agendasetter",
      hypothesis: "SNS 익명성은 모든 학생이 경험해본 주제라 격렬한 토론이 가능할 것이다.",
      analysis: "예상대로 참여율이 높았다. 다만 찬반이 6:5로 거의 균등하게 나뉘어서 한쪽으로 치우치지 않은 것이 좋았다.",
    },
    {
      nickname: "tomo",
      role: "architect",
      hypothesis: "타임라인형 UI로 의견이 시간순으로 쌓이면 대화 흐름이 자연스러워질 것이다.",
      analysis: "타임라인 방식이 실시간 채팅처럼 느껴져서 체류시간이 길었다. 하지만 깊은 논거보다 짧은 반응이 많아진 부작용도 있었다.",
    },
  ];

  for (const c of comments) {
    await setDoc(doc(db, "debates", "test-closed", "comments", c.nickname), {
      role: c.role,
      ...(c.persuaded !== undefined ? { persuaded: c.persuaded } : {}),
      ...(c.hypothesis ? { hypothesis: c.hypothesis } : {}),
      analysis: c.analysis,
      isBestInsight: c.nickname === "222", // 222를 베스트 인사이트로
      bestInsightReason: c.nickname === "222" ? "인터페이스가 설득에 미치는 영향을 구체적으로 분석한 점이 좋았습니다." : "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✓ ${c.nickname} (${c.role})`);
  }

  console.log("\n✅ Test seed complete!");
  console.log("  삭제: ./node_modules/.bin/tsx scripts/clean-test.ts");
  process.exit(0);
}

seedTest().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
