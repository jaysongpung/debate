const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const DAY = 24 * 60 * 60 * 1000;

/**
 * 매분 실행: 토론 상태 자동 전환 + stats 집계
 *
 * - pending → active: startTime 도래 시
 * - active → reviewing: startTime + 24시간
 * - reviewing → closed: startTime + 48시간 (이때 stats 집계)
 */
exports.updateDebateStatus = onSchedule(
  { schedule: "every 1 minutes", timeZone: "Asia/Seoul" },
  async () => {
    const now = Date.now();
    const snapshot = await db.collection("debates").get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const startMs = data.startTime.toMillis();
      const currentStatus = data.status;

      let newStatus;
      if (now < startMs) {
        newStatus = "pending";
      } else if (now < startMs + DAY) {
        newStatus = "active";
      } else if (now < startMs + 2 * DAY) {
        newStatus = "reviewing";
      } else {
        newStatus = "closed";
      }

      if (newStatus === currentStatus) continue;

      console.log(`[${doc.id}] ${currentStatus} → ${newStatus}`);

      // 상태 업데이트
      await doc.ref.update({ status: newStatus });

      // closed로 전환될 때 stats 집계
      if (newStatus === "closed") {
        await aggregateStats(doc.id);
      }
    }
  }
);

/**
 * stats 집계: votes, sessions, comments 서브컬렉션에서 데이터 수집
 */
async function aggregateStats(debateId) {
  const debateRef = db.collection("debates").doc(debateId);

  // 찬성/반대 수
  const votesSnap = await debateRef.collection("votes").get();
  let proCount = 0;
  let conCount = 0;
  votesSnap.forEach((doc) => {
    const side = doc.data().side;
    if (side === "pro") proCount++;
    else if (side === "con") conCount++;
  });

  // 평균 체류시간
  const sessionsSnap = await debateRef.collection("sessions").get();
  let totalDuration = 0;
  let sessionCount = 0;
  sessionsSnap.forEach((doc) => {
    const dur = doc.data().totalDuration || 0;
    if (dur > 0) {
      totalDuration += dur;
      sessionCount++;
    }
  });
  const avgDuration = sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;

  // 인사이트 수
  const commentsSnap = await debateRef.collection("comments").get();
  const commentCount = commentsSnap.size;

  await debateRef.update({
    stats: { proCount, conCount, avgDuration, commentCount },
  });

  console.log(
    `[${debateId}] stats: pro=${proCount}, con=${conCount}, avgDur=${avgDuration}s, comments=${commentCount}`
  );
}
