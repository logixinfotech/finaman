/**
 * useNotificationTime.js
 * ─────────────────────────────────────────────────────────────
 * Tiny hook that returns a live-updating relative-time string.
 * Uses dayjs for formatting. Updates every 60s automatically.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function useRelativeTime(isoString) {
  const [label, setLabel] = useState(() => dayjs(isoString).fromNow());

  useEffect(() => {
    const id = setInterval(() => setLabel(dayjs(isoString).fromNow()), 60_000);
    return () => clearInterval(id);
  }, [isoString]);

  return label;
}

/**
 * Group a flat notification array by Today / Yesterday / Earlier.
 * Returns an object: { Today: [], Yesterday: [], Earlier: [] }
 */
export function groupByDay(notifications) {
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  const today     = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");

  notifications.forEach((n) => {
    const d = dayjs(n.created_at);
    if (d.isSame(today, "day"))     groups.Today.push(n);
    else if (d.isSame(yesterday, "day")) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });

  return groups;
}
