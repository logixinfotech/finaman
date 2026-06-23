/**
 * useIsMobile.js
 * Shared hook — avoids duplicating the same hook in 3 files.
 */
import { useState, useEffect } from "react";

export const useIsMobile = (breakpoint = 1024) => {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [breakpoint]);
  return mobile;
};