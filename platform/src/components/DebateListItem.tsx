"use client";

import type { Debate } from "@shared/types";
import { STATUS_LABELS, STATUS_COLORS, formatDebatePeriod } from "@/lib/status";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/Countdown";
import { ThumbsUp, ThumbsDown, Clock, Award, ListChecks, Check } from "lucide-react";

interface Props {
  debate: Debate;
  currentNickname: string;
  hasVoted: boolean;
  hasComment: boolean;
  bestInsights: string[];
  persuadedCount: number;
  onClick: () => void;
  onButtonClick?: () => void;
}

export default function DebateListItem({
  debate,
  currentNickname,
  hasVoted,
  hasComment,
  bestInsights,
  persuadedCount,
  onClick,
  onButtonClick,
}: Props) {
  const { status } = debate;
  const isMyRole =
    debate.agendaSetter === currentNickname ||
    debate.architect === currentNickname;
  const isActive = status === "active";
  const isReviewing = status === "reviewing";
  const isClosed = status === "closed";
  const hasButton = isActive || isReviewing || isClosed;

  const activeEndTime = new Date(debate.startTime.getTime() + 24 * 60 * 60 * 1000);
  const reviewEndTime = new Date(debate.startTime.getTime() + 48 * 60 * 60 * 1000);

  const showChecklist = isActive || isReviewing || isClosed;

  const BTN_WIDTH = "w-36";

  return (
    <div className="flex items-center gap-3">
      {/* 카드 */}
      <div
        className={`flex-1 min-w-0 cursor-pointer transition hover:shadow-md relative ${isActive ? "p-[2px]" : ""
          }`}
        style={{ borderRadius: "14px" }}
        onClick={onClick}
      >
        {isActive && (
          <div
            className="absolute inset-0 animate-spin-border"
            style={{ borderRadius: "14px" }}
          />
        )}
        <div
          className={`relative border bg-card text-card-foreground ${isActive
            ? "border-transparent"
            : "border-border"
            }`}
          style={{ borderRadius: "12px" }}
        >
          <CardContent className="p-4">
            <div className={`flex ${hasButton ? "items-center" : "items-start"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={STATUS_COLORS[status]}>
                    {STATUS_LABELS[status]}
                  </Badge>
                </div>

                <h3 className="font-semibold mb-1">
                  {debate.title || "(제목 미입력)"}
                </h3>

                <p
                  className={`text-xs mb-2 ${isActive
                    ? "text-blue-600 font-medium"
                    : "text-muted-foreground"
                    }`}
                >
                  {formatDebatePeriod(debate.startTime)}
                </p>

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>아젠다: {debate.agendaSetter || "-"}</span>
                  <span>아키텍트: {debate.architect || "-"}</span>
                </div>

                {(isReviewing || isClosed) && (
                  <>
                    <div className="border-t border-border/50 my-2.5" />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        찬성 <span className="font-medium text-foreground">{debate.stats.proCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        반대 <span className="font-medium text-foreground">{debate.stats.conCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        체류 <span className="font-medium text-foreground">{Math.round(debate.stats.avgDuration / 60)}분</span>
                      </span>
                      {isClosed && (
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3" />
                          설득 <span className="font-medium text-foreground">{persuadedCount}명</span>
                        </span>
                      )}
                      {bestInsights.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          베스트 인사이트 <span className="font-medium text-foreground">{bestInsights.join(", ")}</span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {isActive && (
                <div className="flex flex-col items-center gap-1.5 ml-4 shrink-0">
                  <Button
                    size="lg"
                    className={`${BTN_WIDTH} cursor-pointer bg-blue-600 hover:bg-blue-700 text-white`}
                  >
                    토론 참여하기
                  </Button>
                  <Countdown endTime={activeEndTime} />
                </div>
              )}
              {isReviewing && (
                <div className="flex flex-col items-center gap-1.5 ml-4 shrink-0">
                  <Button
                    size="lg"
                    variant="outline"
                    className={`${BTN_WIDTH} cursor-pointer bg-yellow-50 border-yellow-500 text-yellow-700 hover:bg-yellow-100`}
                    onClick={(e) => { e.stopPropagation(); onButtonClick?.(); }}
                  >
                    인사이트 작성
                  </Button>
                  <Countdown endTime={reviewEndTime} className="text-yellow-600" />
                </div>
              )}
              {isClosed && (
                <div className="flex flex-col items-center gap-1.5 ml-4 shrink-0">
                  <Button
                    size="lg"
                    variant="outline"
                    className={`${BTN_WIDTH} cursor-pointer`}
                    onClick={(e) => { e.stopPropagation(); onButtonClick?.(); }}
                  >
                    인사이트 보기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </div>

      {/* 우측 체크리스트 */}
      {showChecklist && (
        <div className="flex flex-col gap-1.5 shrink-0 w-28">
          <CheckItem
            label="토론 참여"
            checked={isMyRole ? null : hasVoted}
            disabled={isMyRole}
          />
          <CheckItem
            label="인사이트 작성"
            checked={hasComment}
          />
        </div>
      )}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  disabled = false,
}: {
  label: string;
  checked: boolean | null;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
        <span className="w-4 h-4 rounded-full bg-muted/50" />
        <span>{label}</span>
        <span className="text-[10px]">(미대상)</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs ${checked ? "text-gray-600" : "text-muted-foreground/70"}`}>
      <span
        className={`w-3 h-3 rounded-full flex items-center justify-center text-[10px] ${checked
          ? "bg-blue-300 text-white"
          : "bg-gray-200/80"
          }`}
      >
        {checked && <Check className="w-2.5 h-2.5" />}
      </span>
      <span>{label}</span>
    </div>
  );
}
