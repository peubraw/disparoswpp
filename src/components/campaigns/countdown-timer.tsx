"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  scheduledFor: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

export function CountdownTimer({ scheduledFor }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(scheduledFor));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(scheduledFor));
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledFor]);

  if (timeLeft.expired) {
    return <span className="text-sm text-amber-600 font-medium">Disparando em breve...</span>;
  }

  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${String(timeLeft.hours).padStart(2, "0")}h`);
  parts.push(`${String(timeLeft.minutes).padStart(2, "0")}m`);
  parts.push(`${String(timeLeft.seconds).padStart(2, "0")}s`);

  return (
    <span className="text-sm font-mono tabular-nums text-blue-700">
      {parts.join(" ")}
    </span>
  );
}
