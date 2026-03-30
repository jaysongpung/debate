"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useNow } from "@/lib/debug-time";
import { getDebateStatus } from "@/lib/status";
import {
  getDebate,
  getComments,
  setBestInsight,
  removeBestInsight,
} from "@/lib/firestore";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, ThumbsDown, Clock, Star, ArrowLeft } from "lucide-react";
import type { Debate, Comment, DebateRole } from "@shared/types";

const ROLE_LABELS: Record<DebateRole, string> = {
  participant: "참여자",
  architect: "아키텍트",
  agendasetter: "아젠다 세터",
};

const ROLE_ORDER: Record<DebateRole, number> = {
  agendasetter: 1,
  architect: 2,
  participant: 3,
};

export default function DebateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { now } = useNow();
  const router = useRouter();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [comments, setComments] = useState<Record<string, Comment>>({});
  const [bestReasonInput, setBestReasonInput] = useState<Record<string, string>>({});
  const [editingBest, setEditingBest] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!user) return;
    async function load() {
      const d = await getDebate(id);
      if (!d) { router.push("/"); return; }
      const status = getDebateStatus(d.startTime, now());
      // 집계중에 학생이 보기 페이지에 접근하면 작성 페이지로 리다이렉트
      if (status === "reviewing" && user!.role !== "admin") {
        router.push(`/debates/${id}/comment`);
        return;
      }
      setDebate(d);
      setComments(await getComments(id));
    }
    load();
  }, [id, user, loading, router]);

  const handleSetBest = async (nickname: string) => {
    const reason = bestReasonInput[nickname] ?? "";
    if (!reason.trim()) return;
    await setBestInsight(id, nickname, reason);
    setComments((prev) => ({ ...prev, [nickname]: { ...prev[nickname], isBestInsight: true, bestInsightReason: reason } }));
    setEditingBest(null);
  };

  const handleRemoveBest = async (nickname: string) => {
    await removeBestInsight(id, nickname);
    setComments((prev) => ({ ...prev, [nickname]: { ...prev[nickname], isBestInsight: false, bestInsightReason: "" } }));
  };

  if (loading || !user || !debate) return null;

  const isAdmin = user.role === "admin";
  const commentEntries = Object.entries(comments);
  const sorted = [...commentEntries].sort(([, a], [, b]) => {
    if (a.isBestInsight !== b.isBestInsight) return a.isBestInsight ? -1 : 1;
    const rA = ROLE_ORDER[a.role], rB = ROLE_ORDER[b.role];
    if (rA !== rB) return rA - rB;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="mb-4 cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
        </Button>
        <h1 className="text-xl font-bold mb-1">{debate.title}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground mb-1">
          <span>아젠다 세터: {debate.agendaSetter}</span>
          <span>아키텍트: {debate.architect}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> 찬성 {debate.stats.proCount}</span>
          <span className="flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> 반대 {debate.stats.conCount}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 평균 체류 {Math.round(debate.stats.avgDuration / 60)}분</span>
        </div>
        <Separator className="mb-6" />
        <h2 className="text-lg font-semibold mb-4">인사이트 ({commentEntries.length})</h2>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">인사이트가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {sorted.map(([nickname, comment]) => (
              <Card key={nickname} className={comment.isBestInsight ? "border-yellow-400 bg-yellow-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{nickname}</span>
                      <Badge variant="secondary" className="text-xs">{ROLE_LABELS[comment.role]}</Badge>
                      {comment.isBestInsight && (
                        <Badge className="bg-yellow-200 text-yellow-800 hover:bg-yellow-200">
                          <Star className="w-3 h-3 fill-yellow-500 mr-1" />베스트 인사이트
                        </Badge>
                      )}
                    </div>
                    {comment.role === "participant" && comment.persuaded !== undefined && (
                      <span className="text-xs text-muted-foreground">설득됨: {comment.persuaded ? "예" : "아니오"}</span>
                    )}
                  </div>
                  {comment.hypothesis && <p className="text-sm text-muted-foreground mb-2">가설: {comment.hypothesis}</p>}
                  <p className="text-sm whitespace-pre-wrap">{comment.analysis}</p>
                  {comment.isBestInsight && comment.bestInsightReason && (
                    <p className="mt-2 text-sm text-yellow-700">선정 이유: {comment.bestInsightReason}</p>
                  )}
                  {isAdmin && (
                    <>
                      <Separator className="my-3" />
                      {comment.isBestInsight ? (
                        <Button variant="ghost" size="sm" className="text-destructive cursor-pointer" onClick={() => handleRemoveBest(nickname)}>베스트 인사이트 해제</Button>
                      ) : editingBest === nickname ? (
                        <div className="flex gap-2">
                          <Input placeholder="선정 이유" value={bestReasonInput[nickname] ?? ""} onChange={(e) => setBestReasonInput((prev) => ({ ...prev, [nickname]: e.target.value }))} className="text-sm" />
                          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer" onClick={() => handleSetBest(nickname)}>선정</Button>
                          <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setEditingBest(null)}>취소</Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setEditingBest(nickname)}>베스트 인사이트 선정</Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
