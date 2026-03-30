import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Debate,
  DebateStats,
  Vote,
  Comment,
  Side,
  DebateStatus,
  DebateRole,
} from "@shared/types";

// ── Debates ──

function toDebate(id: string, data: Record<string, unknown>): Debate {
  return {
    id,
    title: (data.title as string) ?? "",
    url: (data.url as string) ?? "",
    agendaSetter: (data.agendaSetter as string) ?? "",
    architect: (data.architect as string) ?? "",
    startTime: (data.startTime as Timestamp)?.toDate() ?? new Date(),
    status: (data.status as DebateStatus) ?? "pending",
    stats: (data.stats as DebateStats) ?? {
      proCount: 0,
      conCount: 0,
      avgDuration: 0,
      commentCount: 0,
    },
  };
}

export async function getDebates(): Promise<Debate[]> {
  const q = query(collection(db, "debates"), orderBy("startTime", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    toDebate(d.id, d.data() as Record<string, unknown>)
  );
}

export async function getDebate(debateId: string): Promise<Debate | null> {
  const snap = await getDoc(doc(db, "debates", debateId));
  if (!snap.exists()) return null;
  return toDebate(snap.id, snap.data() as Record<string, unknown>);
}

export async function createDebate(
  debateId: string,
  data: {
    title: string;
    url: string;
    agendaSetter: string;
    architect: string;
    startTime: Date;
  }
) {
  await setDoc(doc(db, "debates", debateId), {
    ...data,
    startTime: Timestamp.fromDate(data.startTime),
    status: "pending" as DebateStatus,
    stats: { proCount: 0, conCount: 0, avgDuration: 0, commentCount: 0 },
  });
}

export async function updateDebate(
  debateId: string,
  data: Partial<{
    title: string;
    url: string;
    agendaSetter: string;
    architect: string;
    startTime: Date;
    status: DebateStatus;
    stats: Partial<DebateStats>;
  }>
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.startTime) {
    updateData.startTime = Timestamp.fromDate(data.startTime);
  }
  await updateDoc(doc(db, "debates", debateId), updateData);
}

export async function deleteDebate(debateId: string) {
  await deleteDoc(doc(db, "debates", debateId));
}

// ── Votes ──

export async function getVotes(
  debateId: string
): Promise<Record<string, Vote>> {
  const snapshot = await getDocs(
    collection(db, "debates", debateId, "votes")
  );
  const votes: Record<string, Vote> = {};
  snapshot.docs.forEach((d) => {
    const data = d.data();
    votes[d.id] = {
      side: data.side as Side,
      votedAt: (data.votedAt as Timestamp).toDate(),
    };
  });
  return votes;
}

export async function castVote(
  debateId: string,
  nickname: string,
  side: Side
) {
  await setDoc(doc(db, "debates", debateId, "votes", nickname), {
    side,
    votedAt: Timestamp.now(),
  });
}

// ── Comments ──

export async function getComments(
  debateId: string
): Promise<Record<string, Comment>> {
  const snapshot = await getDocs(
    collection(db, "debates", debateId, "comments")
  );
  const comments: Record<string, Comment> = {};
  snapshot.docs.forEach((d) => {
    const data = d.data();
    comments[d.id] = {
      role: data.role as DebateRole,
      persuaded: data.persuaded as boolean | undefined,
      hypothesis: data.hypothesis as string | undefined,
      analysis: (data.analysis as string) ?? "",
      isBestInsight: (data.isBestInsight as boolean) ?? false,
      bestInsightReason: data.bestInsightReason as string | undefined,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };
  });
  return comments;
}

export async function submitComment(
  debateId: string,
  nickname: string,
  data: {
    role: DebateRole;
    persuaded?: boolean;
    hypothesis?: string;
    analysis: string;
  }
) {
  await setDoc(doc(db, "debates", debateId, "comments", nickname), {
    ...data,
    isBestInsight: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateComment(
  debateId: string,
  nickname: string,
  data: Partial<{
    persuaded: boolean;
    hypothesis: string;
    analysis: string;
  }>
) {
  await updateDoc(doc(db, "debates", debateId, "comments", nickname), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function setBestInsight(
  debateId: string,
  nickname: string,
  reason: string
) {
  await updateDoc(doc(db, "debates", debateId, "comments", nickname), {
    isBestInsight: true,
    bestInsightReason: reason,
  });
}

export async function removeBestInsight(
  debateId: string,
  nickname: string
) {
  await updateDoc(doc(db, "debates", debateId, "comments", nickname), {
    isBestInsight: false,
    bestInsightReason: "",
  });
}
