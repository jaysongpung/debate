"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { syncServerTime, getServerNow } from "./server-time";

interface DebugTimeContextType {
  now: () => Date;
  debugTime: Date | null;
  setDebugTime: (time: Date | null) => void;
  timeSynced: boolean;
}

const DebugTimeContext = createContext<DebugTimeContextType>({
  now: () => new Date(),
  debugTime: null,
  setDebugTime: () => {},
  timeSynced: false,
});

export function DebugTimeProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [debugTime, setDebugTime] = useState<Date | null>(null);
  const [timeSynced, setTimeSynced] = useState(false);

  useEffect(() => {
    const param = searchParams.get("debugTime");
    if (param) {
      const parsed = new Date(param);
      if (!isNaN(parsed.getTime())) {
        setDebugTime(parsed);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    syncServerTime().then(() => setTimeSynced(true));
  }, []);

  const now = () => (debugTime ? new Date(debugTime) : getServerNow());

  return (
    <DebugTimeContext.Provider value={{ now, debugTime, setDebugTime, timeSynced }}>
      {children}
      {debugTime && (
        <DebugTimeBanner time={debugTime} onClear={() => setDebugTime(null)} />
      )}
    </DebugTimeContext.Provider>
  );
}

function DebugTimeBanner({
  time,
  onClear,
}: {
  time: Date;
  onClear: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-sm font-medium py-2 px-4 flex items-center justify-center gap-4 z-50">
      <span>디버그 시간: {time.toLocaleString("ko-KR")}</span>
      <button onClick={onClear} className="underline text-xs">
        해제
      </button>
    </div>
  );
}

export function useNow() {
  return useContext(DebugTimeContext);
}
