"use client";

import { useEffect, useState } from "react";
import { getUnreadCount } from "@/actions/inbox";

export function UnreadBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const unread = await getUnreadCount();
        if (mounted) {
          setCount(unread);
        }
      } catch (error) {
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-whatsapp text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
