"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useNow } from "@/lib/debug-time";
import { getDebates, getVotes, getComments, getSessions } from "@/lib/firestore";
import { getDebateStatus } from "@/lib/status";
import Nav from "@/components/Nav";
import DebateListItem from "@/components/DebateListItem";
import type { Debate } from "@shared/types";

export default function HomePage() {
  const { user, loading } = useAuth();
  const { now } = useNow();
  const router = useRouter();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [votedDebates, setVotedDebates] = useState<Record<string, string>>({});
  const [commentedDebates, setCommentedDebates] = useState<Set<string>>(new Set());
  const [bestInsightsMap, setBestInsightsMap] = useState<Record<string, string[]>>({});
  const [persuadedCountMap, setPersuadedCountMap] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const allDebates = await getDebates();
      const withStatus = allDebates.map((d) => ({
        ...d,
        status: getDebateStatus(d.startTime, now()),
      }));
      const visible = withStatus.filter((d) => d.status !== "pending" && d.id !== "sandbox");
      setDebates(visible.reverse());

      const voted: Record<string, string> = {};
      const commented = new Set<string>();
      const bests: Record<string, string[]> = {};
      const persuaded: Record<string, number> = {};

      for (const d of visible) {
        const votes = await getVotes(d.id);
        if (votes[user!.nickname]) {
          voted[d.id] = votes[user!.nickname].side;
        }

        // 투표 데이터에서 실시간 찬/반 집계
        const voteEntries = Object.values(votes);
        const proCount = voteEntries.filter((v) => v.side === "pro").length;
        const conCount = voteEntries.filter((v) => v.side === "con").length;
        if (proCount > 0 || conCount > 0) {
          d.stats = { ...d.stats, proCount, conCount };
        }

        // 세션 데이터에서 평균 체류시간 집계
        const sessions = await getSessions(d.id);
        const durations = Object.values(sessions).map((s) => s.totalDuration).filter((t) => t > 0);
        if (durations.length > 0) {
          d.stats = { ...d.stats, avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) };
        }

        if (d.status === "reviewing" || d.status === "closed") {
          const comments = await getComments(d.id);
          if (comments[user!.nickname]) {
            commented.add(d.id);
          }
          const bestNicknames = Object.entries(comments)
            .filter(([, c]) => c.isBestInsight)
            .map(([nickname]) => nickname);
          if (bestNicknames.length > 0) {
            bests[d.id] = bestNicknames;
          }
          persuaded[d.id] = Object.values(comments).filter(
            (c) => c.role === "participant" && c.persuaded === true
          ).length;
          // 인사이트 수도 실시간 집계
          d.stats = { ...d.stats, commentCount: Object.keys(comments).length };
        }
      }
      setVotedDebates(voted);
      setCommentedDebates(commented);
      setBestInsightsMap(bests);
      setPersuadedCountMap(persuaded);
      setFetching(false);
    }
    fetchData();
  }, [user, now]);

  const openDebateSite = (debate: Debate) => {
    if (!debate.url) return;
    const url = new URL(debate.url);
    url.searchParams.set("nickname", user!.nickname);
    url.searchParams.set("debateId", debate.id);
    if (votedDebates[debate.id]) {
      url.searchParams.set("side", votedDebates[debate.id]);
    }
    window.open(url.toString(), "_blank");
  };

  const handleDebateClick = (debate: Debate) => {
    const isMyRole =
      debate.agendaSetter === user?.nickname ||
      debate.architect === user?.nickname;

    if (debate.status === "active") {
      if (!isMyRole && !votedDebates[debate.id]) {
        router.push(`/debates/${debate.id}/vote`);
        return;
      }
      openDebateSite(debate);
      return;
    }

    // 집계중/종료: 카드 본문 클릭 → 토론 사이트 열기
    if (debate.status === "reviewing" || debate.status === "closed") {
      openDebateSite(debate);
      return;
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="w-full max-w-4xl mx-auto px-4 py-6 flex-1">
        <h1 className="text-xl font-bold mb-6">토론 목록</h1>
        {fetching ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : debates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            진행중이거나 완료된 토론이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {debates.map((debate) => (
              <DebateListItem
                key={debate.id}
                debate={debate}
                currentNickname={user.nickname}
                hasVoted={!!votedDebates[debate.id]}
                hasComment={commentedDebates.has(debate.id)}
                bestInsights={bestInsightsMap[debate.id] ?? []}
                persuadedCount={persuadedCountMap[debate.id] ?? 0}
                onClick={() => handleDebateClick(debate)}
                onButtonClick={() => {
                  if (debate.status === "reviewing") {
                    router.push(`/debates/${debate.id}/comment`);
                  } else if (debate.status === "closed") {
                    router.push(`/debates/${debate.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
