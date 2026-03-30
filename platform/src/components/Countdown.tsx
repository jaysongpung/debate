"use client";

import { useState, useEffect } from "react";
import { useNow } from "@/lib/debug-time";

interface Props {
  endTime: Date;
  className?: string;
}

export default function Countdown({ endTime, className = "text-blue-600" }: Props) {
  const { now, debugTime } = useNow();
  const [remaining, setRemaining] = useState(() => calcRemaining(now(), endTime));

  useEffect(() => {
    if (debugTime) {
      setRemaining(calcRemaining(debugTime, endTime));
      return;
    }

    const interval = setInterval(() => {
      setRemaining(calcRemaining(now(), endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, now, debugTime]);

  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className={`font-mono text-xs font-medium tabular-nums ${className}`}>
      {pad(hours)}:{pad(minutes)}:{pad(seconds)} 남음
    </span>
  );
}

function calcRemaining(now: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}
