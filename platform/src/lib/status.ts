import type { DebateStatus } from "@shared/types";

export function getDebateStatus(startTime: Date, now: Date = new Date()): DebateStatus {
  const start = new Date(startTime);
  const reviewStart = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const closeTime = new Date(start.getTime() + 48 * 60 * 60 * 1000);

  if (now < start) return "pending";
  if (now < reviewStart) return "active";
  if (now < closeTime) return "reviewing";
  return "closed";
}

export const STATUS_LABELS: Record<DebateStatus, string> = {
  pending: "대기중",
  active: "진행중",
  reviewing: "집계중",
  closed: "종료",
};

export const STATUS_COLORS: Record<DebateStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  active: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100 text-gray-500",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDebatePeriod(startTime: Date): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const fmt = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const day = WEEKDAYS[d.getDay()];
    return `${mm}.${dd}(${day})`;
  };

  return `${fmt(start)} 오후 6시 ~ ${fmt(end)} 오후 6시`;
}
