"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useNow } from "@/lib/debug-time";
import { getDebates, getComments, updateDebate, createDebate, deleteDebate } from "@/lib/firestore";
import { getDebateStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Debate } from "@shared/types";

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingCell, setEditingCell] = useState<{
    debateId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [persuadedMap, setPersuadedMap] = useState<Record<string, number>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { now } = useNow();

  useEffect(() => {
    if (!user) return;
    async function load() {
      const allDebates = await getDebates();
      const withStatus = allDebates.map((d) => ({
        ...d,
        status: getDebateStatus(d.startTime, now()),
      }));
      setDebates(withStatus);

      const pMap: Record<string, number> = {};
      for (const d of withStatus) {
        if (d.status === "closed") {
          const comments = await getComments(d.id);
          pMap[d.id] = Object.values(comments).filter(
            (c) => c.role === "participant" && c.persuaded === true
          ).length;
        }
      }
      setPersuadedMap(pMap);
      setFetching(false);
    }
    load();
  }, [user, now]);

  const isAdmin = user?.role === "admin";

  const handleCellClick = (
    debateId: string,
    field: string,
    currentValue: string
  ) => {
    if (!isAdmin) return;
    setEditingCell({ debateId, field });
    setEditValue(currentValue);
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    await updateDebate(editingCell.debateId, {
      [editingCell.field]: editValue,
    });
    setDebates((prev) =>
      prev.map((d) =>
        d.id === editingCell.debateId
          ? { ...d, [editingCell.field]: editValue }
          : d
      )
    );
    setEditingCell(null);
  };

  const handleRowClick = useCallback((debate: Debate) => {
    if (debate.status === "reviewing") {
      router.push(`/debates/${debate.id}/comment`);
      return;
    }
    if (debate.status === "closed") {
      router.push(`/debates/${debate.id}`);
      return;
    }
  }, [router]);

  const handleAddDebate = async () => {
    if (!newDate) return;
    const date = new Date(newDate);
    date.setHours(18, 0, 0, 0);
    const debateId = `debate-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    await createDebate(debateId, {
      title: "",
      url: "",
      agendaSetter: "",
      architect: "",
      startTime: date,
    });
    setDebates((prev) => [...prev, {
      id: debateId,
      title: "",
      url: "",
      agendaSetter: "",
      architect: "",
      startTime: date,
      status: getDebateStatus(date, now()),
      stats: { proCount: 0, conCount: 0, avgDuration: 0, commentCount: 0 },
    }].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
    setShowAddRow(false);
    setNewDate("");
  };

  const handleDeleteDebate = async (debateId: string) => {
    await deleteDebate(debateId);
    setDebates((prev) => prev.filter((d) => d.id !== debateId));
  };

  const handleExportCsv = () => {
    const headers = [
      "날짜",
      "상태",
      "아젠다세터",
      "아키텍트",
      "제목",
      "URL",
      "찬성",
      "반대",
      "체류시간(분)",
      "설득",
      "인사이트수",
    ];
    const rows = debates.map((d) => [
      d.startTime.toLocaleDateString("ko-KR"),
      STATUS_LABELS[d.status],
      d.agendaSetter,
      d.architect,
      d.title,
      d.url,
      d.stats.proCount,
      d.stats.conCount,
      Math.round(d.stats.avgDuration / 60),
      persuadedMap[d.id] ?? 0,
      d.stats.commentCount,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "debates.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !user) return null;

  const editableFields = ["agendaSetter", "architect", "title", "url"] as const;
  const fieldLabels: Record<string, string> = {
    agendaSetter: "아젠다세터",
    architect: "아키텍트",
    title: "제목",
    url: "URL",
  };

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">28일 캘린더</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddRow(true)}>
                + 행 추가
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                CSV 다운로드
              </Button>
            </div>
          )}
        </div>

        {showAddRow && (
          <div className="flex items-center gap-3 mb-4">
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-44"
            />
            <Button size="sm" onClick={handleAddDebate} disabled={!newDate}>
              추가
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowAddRow(false); setNewDate(""); }}>
              취소
            </Button>
          </div>
        )}

        {fetching ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">날짜</TableHead>
                  <TableHead className="w-20">상태</TableHead>
                  <TableHead>아젠다세터</TableHead>
                  <TableHead>아키텍트</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="max-w-32">URL</TableHead>
                  <TableHead className="w-14 text-center">찬성</TableHead>
                  <TableHead className="w-14 text-center">반대</TableHead>
                  <TableHead className="w-14 text-center">체류</TableHead>
                  <TableHead className="w-14 text-center">설득</TableHead>
                  <TableHead className="w-16 text-center">인사이트</TableHead>
                  {isAdmin && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {debates.map((debate) => {
                  const d = debate.startTime;
                  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                  const dateStr = `${String(d.getFullYear()).slice(2)}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} (${dayNames[d.getDay()]})`;
                  const isActive = debate.status === "active";
                  const isReviewing = debate.status === "reviewing";
                  const showStats =
                    debate.status === "reviewing" ||
                    debate.status === "closed";

                  // 제출 마감: startTime 전날 오후 6시 (= startTime - 24h)
                  const deadlineMs = d.getTime() - 24 * 60 * 60 * 1000;
                  const nowMs = now().getTime();
                  const msLeft = deadlineMs - nowMs;
                  const hoursLeft = msLeft / (1000 * 60 * 60);
                  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
                  const hasSubmitted = !!(debate.title && debate.url);
                  const showDeadline = daysLeft <= 3 && msLeft > 0;
                  const isMyDebate =
                    debate.agendaSetter === user.nickname ||
                    debate.architect === user.nickname;

                  let deadlineText = "";
                  if (showDeadline) {
                    if (hasSubmitted) {
                      deadlineText = "제출완료";
                    } else if (hoursLeft < 1) {
                      deadlineText = `제출 ${Math.max(0, Math.round(hoursLeft * 60))}분 남음`;
                    } else {
                      deadlineText = `제출 ${Math.round(hoursLeft)}시간 남음`;
                    }
                  }

                  return (
                    <TableRow
                      key={debate.id}
                      className={`cursor-pointer ${
                        debate.status === "active"
                          ? "bg-sky-50"
                          : debate.status === "reviewing"
                          ? "bg-yellow-50"
                          : ""
                      }`}
                      onClick={() => handleRowClick(debate)}
                    >
                      <TableCell className="whitespace-nowrap font-medium">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[debate.status]}
                        >
                          {STATUS_LABELS[debate.status]}
                        </Badge>
                      </TableCell>
                      {editableFields.map((field) => {
                        const value = debate[field] || "";
                        const isEditing =
                          editingCell?.debateId === debate.id &&
                          editingCell?.field === field;
                        return (
                          <TableCell
                            key={field}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(debate.id, field, value);
                            }}
                          >
                            {isEditing ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCellSave();
                                  if (e.key === "Escape")
                                    setEditingCell(null);
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={`${
                                  field === "url"
                                    ? "max-w-32 truncate block"
                                    : ""
                                } ${
                                  isAdmin && !value
                                    ? "text-muted-foreground italic"
                                    : ""
                                } ${
                                  (field === "agendaSetter" || field === "architect") && value === user.nickname
                                    ? "text-orange-500 font-semibold"
                                    : ""
                                }`}
                              >
                                {value ||
                                  (isAdmin ? `(${fieldLabels[field]})` : "-")}
                                {(field === "agendaSetter" || field === "architect") && value === user.nickname && showDeadline && (
                                  <span className={`ml-1.5 text-[11px] font-normal ${hasSubmitted ? "text-green-600" : "text-orange-400"}`}>
                                    {deadlineText}
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        {showStats ? debate.stats.proCount : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {showStats ? debate.stats.conCount : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {showStats
                          ? `${Math.round(debate.stats.avgDuration / 60)}분`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {debate.status === "closed" ? `${persuadedMap[debate.id] ?? 0}명` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {showStats ? debate.stats.commentCount : "-"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("이 토론을 삭제하시겠습니까?")) {
                                handleDeleteDebate(debate.id);
                              }
                            }}
                            className="text-muted-foreground/40 hover:text-destructive text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

      </main>
    </>
  );
}
