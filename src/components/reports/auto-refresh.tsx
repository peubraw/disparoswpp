"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ isActive, intervalMs = 5000 }: { isActive: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!isActive) return;
    
    const intervalId = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isActive, intervalMs, router]);

  return null;
}
