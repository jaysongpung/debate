"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useNow } from "@/lib/debug-time";
import { getDebateStatus } from "@/lib/status";
import {
  getDebate,
  getComments,
  submitComment,
  updateComment,
} from "@/lib/firestore";
import Nav from "@/components/Nav";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Debate, DebateRole } from "@shared/types";

export default function CommentPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { now } = useNow();
  const router = useRouter();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [persuaded, setPersuaded] = useState<boolean>(false);
  const [hypothesis, setHypothesis] = useState("");
  const [existingComment, setExistingComment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myRole, setMyRole] = useState<DebateRole>("participant");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    async function load() {
      const d = await getDebate(id);
      if (!d || getDebateStatus(d.startTime, now()) !== "reviewing") {
        router.push("/");
        return;
      }
      setDebate(d);

      const role: DebateRole =
        d.agendaSetter === user!.nickname
          ? "agendasetter"
          : d.architect === user!.nickname
          ? "architect"
          : "participant";
      setMyRole(role);

      const comments = await getComments(id);
      const mine = comments[user!.nickname];
      if (mine) {
        setAnalysis(mine.analysis);
        setPersuaded(mine.persuaded ?? false);
        setHypothesis(mine.hypothesis ?? "");
        setExistingComment(true);
      }
    }
    load();
  }, [id, user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !debate || submitting) return;
    setSubmitting(true);

    if (existingComment) {
      await updateComment(debate.id, user.nickname, {
        analysis,
        ...(myRole === "participant"
          ? { persuaded }
          : {}),
        ...(myRole !== "participant" ? { hypothesis } : {}),
      });
    } else {
      await submitComment(debate.id, user.nickname, {
        role: myRole,
        analysis,
        ...(myRole === "participant"
          ? { persuaded }
          : {}),
        ...(myRole !== "participant" ? { hypothesis } : {}),
      });
      setExistingComment(true);
    }

    setSaved(true);
    setSubmitting(false);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || !user || !debate) return null;

  return (
    <>
      <Nav />
      <main className="w-full max-w-3xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">{debate.title}</h1>
          <p className="text-sm text-muted-foreground">
            인사이트 작성 (집계중)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {myRole === "participant" && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">설득 여부</h2>
              <p className="text-sm text-muted-foreground">상대 진영에 설득되었나요?</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="persuaded"
                    checked={persuaded === true}
                    onChange={() => setPersuaded(true)}
                    className="w-4 h-4 accent-primary"
                  />
                  예
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="persuaded"
                    checked={persuaded === false}
                    onChange={() => setPersuaded(false)}
                    className="w-4 h-4 accent-primary"
                  />
                  아니오
                </label>
              </div>
            </div>
          )}

          {myRole !== "participant" && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">가설</h2>
              <Textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={5}
                placeholder={
                  myRole === "agendasetter"
                    ? "주제 선정에 대한 가설"
                    : "인터페이스 설계에 대한 가설"
                }
              />
            </div>
          )}

          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">
                토론분석
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                이번에 바뀐 UI에 의해서 토론의 양상이 어떻게 달라졌는가?
                <span className="ml-2">({analysis.length}/500)</span>
              </p>
            </div>
            <Textarea
              value={analysis}
              onChange={(e) => {
                if (e.target.value.length <= 500)
                  setAnalysis(e.target.value);
              }}
              rows={20}
              placeholder="분석 내용을 작성하세요"
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full cursor-pointer text-base h-14" disabled={submitting}>
            {submitting
              ? "저장 중..."
              : existingComment
              ? "수정하기"
              : "제출하기"}
          </Button>
          {saved && (
            <p className="text-sm text-green-600 text-center">
              저장되었습니다.
            </p>
          )}
        </form>
      </main>
    </>
  );
}
