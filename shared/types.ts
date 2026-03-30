export type DebateStatus = "pending" | "active" | "reviewing" | "closed";
export type Side = "pro" | "con";
export type UserRole = "admin" | "student";
export type DebateRole = "participant" | "architect" | "agendasetter";

export interface User {
  nickname: string;
  studentId: string;
  role: UserRole;
}

export interface DebateStats {
  proCount: number;
  conCount: number;
  avgDuration: number;
  commentCount: number;
}

export interface Debate {
  id: string;
  title: string;
  url: string;
  agendaSetter: string;
  architect: string;
  startTime: Date;
  status: DebateStatus;
  stats: DebateStats;
}

export interface Vote {
  side: Side;
  votedAt: Date;
}

export interface Comment {
  role: DebateRole;
  persuaded?: boolean;
  hypothesis?: string;
  analysis: string;
  isBestInsight: boolean;
  bestInsightReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  lastHeartbeat: Date;
  totalDuration: number;
  isActive: boolean;
}

export interface Payload {
  data: Record<string, unknown>;
  updatedAt: Date;
}
