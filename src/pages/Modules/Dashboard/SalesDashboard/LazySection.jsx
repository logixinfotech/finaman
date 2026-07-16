import { useEffect, useRef, useState } from "react"; 
export default function LazySection({ children, minHeight = 320, rootMargin = "300px" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }  
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={!visible ? { minHeight } : undefined}>
      {visible ? children : <SkeletonBlock height={minHeight} />}
    </div>
  );
}

function SkeletonBlock({ height }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-200 bg-slate-100"
      style={{ height }}
    />
  );
}
