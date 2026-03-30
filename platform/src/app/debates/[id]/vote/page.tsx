"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useNow } from "@/lib/debug-time";
import { getDebateStatus } from "@/lib/status";
import { getDebate, getVotes, castVote } from "@/lib/firestore";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import type { Debate, Side } from "@shared/types";

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { now } = useNow();
  const router = useRouter();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    async function load() {
      const d = await getDebate(id);
      if (!d || getDebateStatus(d.startTime, now()) !== "active") {
        router.push("/");
        return;
      }

      const votes = await getVotes(id);
      if (votes[user!.nickname]) {
        const url = new URL(d.url);
        url.searchParams.set("nickname", user!.nickname);
        url.searchParams.set("side", votes[user!.nickname].side);
        window.location.href = url.toString();
        return;
      }

      setDebate(d);
    }
    load();
  }, [id, user, loading, router]);

  const handleVote = async (side: Side) => {
    if (!user || !debate || submitting) return;
    setSubmitting(true);

    await castVote(debate.id, user.nickname, side);

    const url = new URL(debate.url);
    url.searchParams.set("nickname", user.nickname);
    url.searchParams.set("side", side);
    window.location.href = url.toString();
  };

  if (loading || !user || !debate) return null;

  return (
    <>
      <Nav />
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">{debate.title}</h1>
        <p className="text-sm text-muted-foreground mb-10">
          찬성 또는 반대를 선택하세요. 선택 후 변경할 수 없습니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => handleVote("pro")}
            disabled={submitting}
            className="flex-1 max-w-40 h-14 text-lg bg-blue-600 hover:bg-blue-700"
          >
            찬성
          </Button>
          <Button
            size="lg"
            onClick={() => handleVote("con")}
            disabled={submitting}
            className="flex-1 max-w-40 h-14 text-lg bg-red-600 hover:bg-red-700"
          >
            반대
          </Button>
        </div>
      </main>
    </>
  );
}
