 
// // import { useState, useRef, useEffect, useLayoutEffect } from "react";
// // import { createPortal } from "react-dom";

// // const ERPAutocomplete = ({
// //   value,
// //   onChange,
// //   options = [],
// //   placeholder = "",
// //   onKeyDown,
// //   className = "",
// //   disabled = false,
// //   showAddIfNoMatch = false,
// //   addLabel = "Add New",
// //   onAddClick
// // }) => {
// //   const [filtered, setFiltered] = useState([]);
// //   const [show, setShow] = useState(false);
// //   const [highlightIndex, setHighlightIndex] = useState(-1);
// //   const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 }); // 🆕
// //   const wrapperRef = useRef(null);
// //   const inputRef = useRef(null);       // 🆕
// //   const dropdownRef = useRef(null);    // 🆕

// //   const updateCoords = () => {          // 🆕
// //     const el = inputRef.current;
// //     if (!el) return;
// //     const rect = el.getBoundingClientRect();
// //     setCoords({ top: rect.bottom + 2, left: rect.left, width: rect.width });
// //   };

// //   useLayoutEffect(() => {               // 🆕 open hote hi position calculate
// //     if (show) updateCoords();
// //   }, [show]);

// //   useEffect(() => {                     // 🆕 scroll/resize pe reposition
// //     if (!show) return;
// //     const handle = () => updateCoords();
// //     window.addEventListener("scroll", handle, true); // capture = nested scroll containers bhi pakdega
// //     window.addEventListener("resize", handle);
// //     return () => {
// //       window.removeEventListener("scroll", handle, true);
// //       window.removeEventListener("resize", handle);
// //     };
// //   }, [show]);

// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (
// //         wrapperRef.current && !wrapperRef.current.contains(e.target) &&
// //         dropdownRef.current && !dropdownRef.current.contains(e.target) // 🆕 portal ke bahar click bhi check
// //       ) {
// //         setShow(false);
// //         setHighlightIndex(-1);
// //       }
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);
// //   // 1) Input screen se hat jaye (tab hide / display:none / scroll se bahar) to dropdown band
// // useEffect(() => {
// //   if (!show || !inputRef.current || typeof IntersectionObserver === "undefined") return;
// //   const io = new IntersectionObserver(([entry]) => {
// //     if (!entry.isIntersecting) { setShow(false); setHighlightIndex(-1); }
// //   });
// //   io.observe(inputRef.current);
// //   return () => io.disconnect();
// // }, [show]);

// // // 2) Browser tab / window badalne par band
// // useEffect(() => {
// //   if (!show) return;
// //   const close = () => { setShow(false); setHighlightIndex(-1); };
// //   const onVis = () => { if (document.hidden) close(); };
// //   window.addEventListener("blur", close);
// //   document.addEventListener("visibilitychange", onVis);
// //   return () => {
// //     window.removeEventListener("blur", close);
// //     document.removeEventListener("visibilitychange", onVis);
// //   };
// // }, [show]);

// //   const toggleDropdown = () => {
// //     if (disabled) return;
// //     if (show) {
// //       setShow(false);
// //       setHighlightIndex(-1);
// //     } else {
// //       setFiltered(options);
// //       setShow(true);
// //     }
// //   };

// //   const handleChange = (e) => {
// //     const val = e.target.value;
// //     onChange(val);
// //     if (!val) {
// //       setFiltered(options);
// //       setShow(true);
// //       return;
// //     }
// //     const lowerVal = val.toLowerCase();
// //     const startsWithMatch = options.filter((opt) => opt.toLowerCase().startsWith(lowerVal));
// //     const containsMatch = options.filter(
// //       (opt) => opt.toLowerCase().includes(lowerVal) && !opt.toLowerCase().startsWith(lowerVal)
// //     );
// //     setFiltered([...startsWithMatch, ...containsMatch]);
// //     setShow(true);
// //     setHighlightIndex(-1);
// //   };

// //   const selectOption = (opt) => {
// //     onChange(opt);
// //     setShow(false);
// //     setHighlightIndex(-1);
// //   };

// //   const handleKey = (e) => {
// //     if (e.shiftKey && e.key === "Backspace") {
// //       e.preventDefault();
// //       if (onKeyDown) onKeyDown(e);
// //       return;
// //     }
// //     if (!show) {
// //       if (onKeyDown) onKeyDown(e);
// //       return;
// //     }
// //     if (e.key === "ArrowDown") {
// //       e.preventDefault();
// //       setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
// //     }
// //     if (e.key === "ArrowUp") {
// //       e.preventDefault();
// //       setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
// //     }
// //     // if (e.key === "Enter") {
// //     //   if (highlightIndex >= 0) {
// //     //     e.preventDefault();
// //     //     selectOption(filtered[highlightIndex]);
// //     //   } else if (filtered.length === 1) {
// //     //     e.preventDefault();
// //     //     selectOption(filtered[0]);
// //     //   } else {
// //     //     setShow(false);
// //     //     setHighlightIndex(-1);
// //     //     if (onKeyDown) onKeyDown(e);
// //     //   }
// //     // }
// //     if (e.key === "Enter") {
// //   if (highlightIndex >= 0) {
// //     e.preventDefault();
// //     selectOption(filtered[highlightIndex]);
// //   } else if (value && filtered.length > 0) {
// //     // user ne kuch type kiya hai aur list mein matches hain -> top match select
// //     e.preventDefault();
// //     selectOption(filtered[0]);
// //   } else {
// //     setShow(false);
// //     setHighlightIndex(-1);
// //     if (onKeyDown) onKeyDown(e);
// //   }
// // }
// //     if (e.key === "Escape") {
// //       setShow(false);
// //     }
// //   };

// //   return (
// //     <div ref={wrapperRef} className="relative">
// //       <input
// //         ref={inputRef}   
// //         onBlur={(e) => {
// //     // dropdown ke andar click ho raha ho to band mat karo
// //     if (dropdownRef.current?.contains(e.relatedTarget)) return;
// //     setShow(false);
// //     setHighlightIndex(-1);
// //   }}                // 🆕
// //         className={`w-full pr-7 ${className}`}
// //         value={value || ""}
// //         placeholder={placeholder}
// //         disabled={disabled}
// //         onChange={handleChange}
// //         onFocus={() => {
// //           setFiltered(options);
// //           setShow(true);
// //         }}
// //         onKeyDown={handleKey}
// //       />
// //       <button
// //         type="button"
// //         tabIndex={-1}
// //         disabled={disabled}
// //         onMouseDown={(e) => {
// //           e.preventDefault();
// //           toggleDropdown();
// //         }}
// //         className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center ${
// //           disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
// //         }`}
// //       >
// //         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-500 transition-transform duration-150 ${show ? "rotate-180" : ""}`}>
// //           <polyline points="6 9 12 15 18 9" />
// //         </svg>
// //       </button>

// //       {show && createPortal(                 // 🆕 poora dropdown ab body me portal hota hai
// //         <div
// //           ref={dropdownRef}
// //           className="fixed bg-white border border-gray-300 rounded-md shadow max-h-52 overflow-auto text-xs"
// //           style={{ top: coords.top, left: coords.left, width: coords.width, zIndex: 999999 }}
// //         >
// //           {filtered.length > 0 ? (
// //             filtered.map((opt, i) => (
// //               <div
// //                 key={i}
// //                 className={`px-3 py-1 cursor-pointer ${
// //                   i === highlightIndex ? "bg-blue-400 text-white" : "hover:bg-gray-100"
// //                 }`}
// //                 onMouseDown={() => selectOption(opt)}
// //               >
// //                 {opt}
// //               </div>
// //             ))
// //           ) : (
// //             <div className="px-3 py-2 text-gray-400">No results found</div>
// //           )}
// //           {onAddClick && !disabled && (
// //             <div
// //               className="px-3 py-2 border-t text-blue-600 font-medium cursor-pointer hover:bg-blue-50 sticky bottom-0 bg-white"
// //               onMouseDown={(e) => {
// //                 e.preventDefault();
// //                 if (onAddClick) onAddClick(value);
// //               }}
// //             >
// //               + {addLabel} {value ? `"${value}"` : ""}
// //             </div>
// //           )}
// //         </div>,
// //         document.body
// //       )}
// //     </div>
// //   );
// // };

// // export default ERPAutocomplete;
// import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
// import { createPortal } from "react-dom";
// import { useLocation } from "react-router-dom";

// const TYPING_CTRL_KEYS = new Set(["a", "c", "v", "x", "z", "y"]);
// const SCROLLABLE = /(auto|scroll|hidden|clip)/;

// // Input kisi scroll container ya viewport se kat gaya? (sticky/overflow clipping)
// const isClipped = (el) => {
//   if (!el || !el.isConnected) return true;
//   const r = el.getBoundingClientRect();
//   if (r.width === 0 && r.height === 0) return true;
//   const mid = r.top + r.height / 2;
//   if (mid < 0 || mid > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return true;

//   let p = el.parentElement;
//   while (p && p !== document.body && p !== document.documentElement) {
//     const cs = getComputedStyle(p);
//     if (SCROLLABLE.test(cs.overflowY) || SCROLLABLE.test(cs.overflowX)) {
//       const pr = p.getBoundingClientRect();
//       // input ka beech ka hissa container ke bahar ho gaya
//       if (mid < pr.top || mid > pr.bottom) return true;
//       const midX = r.left + r.width / 2;
//       if (midX < pr.left || midX > pr.right) return true;
//     }
//     p = p.parentElement;
//   }
//   return false;
// };

// const ERPAutocomplete = ({
//   value,
//   onChange,
//   options = [],
//   placeholder = "",
//   onKeyDown,
//   className = "",
//   wrapperClassName = "",
//   disabled = false,
//   showAddIfNoMatch = false,
//   addLabel = "Add New",
//   onAddClick,
// }) => {
//   const [filtered, setFiltered] = useState([]);
//   const [show, setShow] = useState(false);
//   const [highlightIndex, setHighlightIndex] = useState(-1);
//   const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0, maxH: 208, up: false });

//   const wrapperRef = useRef(null);
//   const inputRef = useRef(null);
//   const dropdownRef = useRef(null);
//   const skipOpenRef = useRef(false);

//   const location = useLocation();

//   const closeNow = useCallback(() => {
//     setShow(false);
//     setHighlightIndex(-1);
//   }, []);

//   /* ---------- position (flip up + clamp) ---------- */
//   const updateCoords = useCallback(() => {
//     const el = inputRef.current;
//     if (!el) return;
//     const r = el.getBoundingClientRect();
//     const vh = window.innerHeight;
//     const below = vh - r.bottom - 8;
//     const above = r.top - 8;
//     const up = below < 160 && above > below;
//     const maxH = Math.max(100, Math.min(208, up ? above : below));
//     const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
//     setCoords({
//       top: r.bottom + 2,
//       bottom: vh - r.top + 2,
//       left,
//       width: r.width,
//       maxH,
//       up,
//     });
//   }, []);

//   useLayoutEffect(() => {
//     if (show) updateCoords();
//   }, [show, updateCoords]);

//   /* ---------- scroll/resize: input kat gaya to band, warna reposition ---------- */
//   useEffect(() => {
//     if (!show) return;
//     const onScroll = (e) => {
//       if (dropdownRef.current && dropdownRef.current.contains(e.target)) return; // dropdown ke andar scroll
//       if (isClipped(inputRef.current)) closeNow();
//       else updateCoords();
//     };
//     const onResize = () => (isClipped(inputRef.current) ? closeNow() : updateCoords());
//     window.addEventListener("scroll", onScroll, true);
//     window.addEventListener("resize", onResize);
//     window.addEventListener("wheel", onScroll, { capture: true, passive: true });
//     return () => {
//       window.removeEventListener("scroll", onScroll, true);
//       window.removeEventListener("resize", onResize);
//       window.removeEventListener("wheel", onScroll, true);
//     };
//   }, [show, closeNow, updateCoords]);

//   /* ---------- tab / page badla (URL change) ---------- */
//   useEffect(() => {
//     closeNow();
//   }, [location.key, location.search, closeNow]);

//   /* ---------- "bahar gaya" ke baaki signals ---------- */
//   useEffect(() => {
//     if (!show) return;

//     const onPointerDown = (e) => {
//       if (wrapperRef.current?.contains(e.target)) return;
//       if (dropdownRef.current?.contains(e.target)) return;
//       closeNow();
//     };
//     const onKey = (e) => {
//       if (e.altKey || ((e.ctrlKey || e.metaKey) && !TYPING_CTRL_KEYS.has(e.key.toLowerCase()))) closeNow();
//     };
//     const onVis = () => { if (document.hidden) closeNow(); };

//     // hidden ya clipped input ~80ms mein pakda jayega (layout shift, tab hide, etc.)
//     const guard = setInterval(() => {
//       const el = inputRef.current;
//       if (!el || !el.isConnected) return closeNow();
//       const hidden =
//         typeof el.checkVisibility === "function"
//           ? !el.checkVisibility({ checkVisibilityCSS: true })
//           : el.getClientRects().length === 0;
//       if (hidden || isClipped(el)) closeNow();
//       else updateCoords();
//     }, 80);

//     window.addEventListener("mousedown", onPointerDown, true);
//     window.addEventListener("touchstart", onPointerDown, true);
//     window.addEventListener("keydown", onKey, true);
//     window.addEventListener("blur", closeNow);
//     document.addEventListener("visibilitychange", onVis);
//     return () => {
//       clearInterval(guard);
//       window.removeEventListener("mousedown", onPointerDown, true);
//       window.removeEventListener("touchstart", onPointerDown, true);
//       window.removeEventListener("keydown", onKey, true);
//       window.removeEventListener("blur", closeNow);
//       document.removeEventListener("visibilitychange", onVis);
//     };
//   }, [show, closeNow, updateCoords]);

//   /* ---------- actions ---------- */
//   const toggleDropdown = () => {
//     if (disabled) return;
//     if (show) closeNow();
//     else {
//       setFiltered(options);
//       setShow(true);
//     }
//   };

//   const handleChange = (e) => {
//     const val = e.target.value;
//     onChange(val);
//     if (!val) {
//       setFiltered(options);
//       setShow(true);
//       return;
//     }
//     const lower = val.toLowerCase();
//     const starts = options.filter((o) => o.toLowerCase().startsWith(lower));
//     const contains = options.filter((o) => o.toLowerCase().includes(lower) && !o.toLowerCase().startsWith(lower));
//     setFiltered([...starts, ...contains]);
//     setShow(true);
//     setHighlightIndex(-1);
//   };

//   const selectOption = (opt) => {
//     onChange(opt);
//     closeNow();
//   };

//   const handleAddNew = (e) => {
//     e.preventDefault();
//     skipOpenRef.current = true;
//     closeNow();
//     inputRef.current?.blur();
//     onAddClick?.(value);
//   };

//   const handleKey = (e) => {
//     if (e.shiftKey && e.key === "Backspace") {
//       e.preventDefault();
//       onKeyDown?.(e);
//       return;
//     }
//     if (!show) {
//       onKeyDown?.(e);
//       return;
//     }
//     if (e.key === "ArrowDown") {
//       e.preventDefault();
//       setHighlightIndex((p) => (p < filtered.length - 1 ? p + 1 : p));
//     }
//     if (e.key === "ArrowUp") {
//       e.preventDefault();
//       setHighlightIndex((p) => (p > 0 ? p - 1 : 0));
//     }
//     if (e.key === "Enter") {
//       if (highlightIndex >= 0) {
//         e.preventDefault();
//         selectOption(filtered[highlightIndex]);
//       } else if (value && filtered.length > 0) {
//         e.preventDefault();
//         selectOption(filtered[0]);
//       } else {
//         closeNow();
//         onKeyDown?.(e);
//       }
//     }
//     if (e.key === "Escape") closeNow();
//   };

//   /* ---------- render ---------- */
//   return (
//     <div
//       ref={wrapperRef}
//       className={`relative ${wrapperClassName}`}
//       onMouseDown={() => { skipOpenRef.current = false; }}
//     >
//       <input
//         ref={inputRef}
//         className={`pr-7 ${className}`}
//         value={value || ""}
//         placeholder={placeholder}
//         disabled={disabled}
//         onChange={handleChange}
//         onFocus={() => {
//           if (skipOpenRef.current) { skipOpenRef.current = false; return; }
//           setFiltered(options);
//           setShow(true);
//         }}
//         onBlur={(e) => {
//           if (dropdownRef.current?.contains(e.relatedTarget)) return;
//           closeNow();
//         }}
//         onKeyDown={handleKey}
//       />
//       <button
//         type="button"
//         tabIndex={-1}
//         disabled={disabled}
//         onMouseDown={(e) => { e.preventDefault(); toggleDropdown(); }}
//         className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center ${
//           disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
//         }`}
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
//           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
//           className={`text-gray-500 transition-transform duration-150 ${show ? "rotate-180" : ""}`}>
//           <polyline points="6 9 12 15 18 9" />
//         </svg>
//       </button>

//       {show && createPortal(
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow overflow-auto text-xs"
//           style={{
//             left: coords.left,
//             width: coords.width,
//             maxHeight: coords.maxH,
//             zIndex: 999999,
//             ...(coords.up ? { bottom: coords.bottom } : { top: coords.top }),
//           }}
//         >
//           {filtered.length > 0 ? (
//             filtered.map((opt, i) => (
//               <div
//                 key={i}
//                 className={`px-3 py-1 cursor-pointer ${i === highlightIndex ? "bg-blue-400 text-white" : "hover:bg-gray-100"}`}
//                 onMouseDown={() => selectOption(opt)}
//               >
//                 {opt}
//               </div>
//             ))
//           ) : (
//             <div className="px-3 py-2 text-gray-400">No results found</div>
//           )}
//           {onAddClick && !disabled && (
//             <div
//               className="px-3 py-2 border-t text-blue-600 font-medium cursor-pointer hover:bg-blue-50 sticky bottom-0 bg-white"
//               onMouseDown={handleAddNew}
//             >
//               + {addLabel} {value ? `"${value}"` : ""}
//             </div>
//           )}
//         </div>,
//         document.body
//       )}
//     </div>
//   );
// };

// export default ERPAutocomplete;
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

const TYPING_CTRL_KEYS = new Set(["a", "c", "v", "x", "z", "y"]);
const SCROLLABLE = /(auto|scroll|hidden|clip)/;

// Input kisi scroll container ya viewport se kat gaya? (sticky/overflow clipping)
const isClipped = (el) => {
  if (!el || !el.isConnected) return true;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return true;
  const mid = r.top + r.height / 2;
  if (mid < 0 || mid > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return true;

  let p = el.parentElement;
  while (p && p !== document.body && p !== document.documentElement) {
    const cs = getComputedStyle(p);
    if (SCROLLABLE.test(cs.overflowY) || SCROLLABLE.test(cs.overflowX)) {
      const pr = p.getBoundingClientRect();
      if (mid < pr.top || mid > pr.bottom) return true;
      const midX = r.left + r.width / 2;
      if (midX < pr.left || midX > pr.right) return true;
    }
    p = p.parentElement;
  }
  return false;
};

const ERPAutocomplete = ({
  value,
  onChange,
  options = [],
  placeholder = "",
  onKeyDown,
  className = "",
  wrapperClassName = "",
  disabled = false,
  showAddIfNoMatch = false,
  addLabel = "Add New",
  onAddClick,
}) => {
  const [filtered, setFiltered] = useState([]);
  const [show, setShow] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0, maxH: 208, up: false });

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const skipOpenRef = useRef(false);
  const typedRef = useRef(false); // user ne khud type kiya ya nahi

  const location = useLocation();

  const closeNow = useCallback(() => {
    setShow(false);
    setHighlightIndex(-1);
  }, []);

  /* ---------- position (flip up + clamp) ---------- */
  const updateCoords = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const below = vh - r.bottom - 8;
    const above = r.top - 8;
    const up = below < 160 && above > below;
    const maxH = Math.max(100, Math.min(208, up ? above : below));
    const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
    setCoords({
      top: r.bottom + 2,
      bottom: vh - r.top + 2,
      left,
      width: r.width,
      maxH,
      up,
    });
  }, []);

  useLayoutEffect(() => {
    if (show) updateCoords();
  }, [show, updateCoords]);

  /* ---------- scroll/resize: input kat gaya to band, warna reposition ---------- */
  useEffect(() => {
    if (!show) return;
    const onScroll = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      if (isClipped(inputRef.current)) closeNow();
      else updateCoords();
    };
    const onResize = () => (isClipped(inputRef.current) ? closeNow() : updateCoords());
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onScroll, true);
    };
  }, [show, closeNow, updateCoords]);

  /* ---------- tab / page badla (URL change) ---------- */
  useEffect(() => {
    closeNow();
  }, [location.key, location.search, closeNow]);

  /* ---------- "bahar gaya" ke baaki signals ---------- */
  useEffect(() => {
    if (!show) return;

    const onPointerDown = (e) => {
      if (wrapperRef.current?.contains(e.target)) return;
      if (dropdownRef.current?.contains(e.target)) return;
      closeNow();
    };
    const onKey = (e) => {
      if (e.altKey || ((e.ctrlKey || e.metaKey) && !TYPING_CTRL_KEYS.has(e.key.toLowerCase()))) closeNow();
    };
    const onVis = () => { if (document.hidden) closeNow(); };

    const guard = setInterval(() => {
      const el = inputRef.current;
      if (!el || !el.isConnected) return closeNow();
      const hidden =
        typeof el.checkVisibility === "function"
          ? !el.checkVisibility({ checkVisibilityCSS: true })
          : el.getClientRects().length === 0;
      if (hidden || isClipped(el)) closeNow();
      else updateCoords();
    }, 80);

    window.addEventListener("mousedown", onPointerDown, true);
    window.addEventListener("touchstart", onPointerDown, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", closeNow);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(guard);
      window.removeEventListener("mousedown", onPointerDown, true);
      window.removeEventListener("touchstart", onPointerDown, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", closeNow);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [show, closeNow, updateCoords]);

  /* ---------- actions ---------- */
  const toggleDropdown = () => {
    if (disabled) return;
    if (show) closeNow();
    else {
      setFiltered(options);
      setShow(true);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    typedRef.current = true;
    onChange(val);
    if (!val) {
      setFiltered(options);
      setShow(true);
      return;
    }
    const lower = val.toLowerCase();
    const starts = options.filter((o) => o.toLowerCase().startsWith(lower));
    const contains = options.filter((o) => o.toLowerCase().includes(lower) && !o.toLowerCase().startsWith(lower));
    setFiltered([...starts, ...contains]);
    setShow(true);
    setHighlightIndex(-1);
  };

  const selectOption = (opt) => {
    onChange(opt);
    closeNow();
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    skipOpenRef.current = true;
    closeNow();
    inputRef.current?.blur();
    onAddClick?.(value);
  };

  const handleKey = (e) => {
    if (e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      onKeyDown?.(e);
      return;
    }
    if (!show) {
      onKeyDown?.(e);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((p) => (p < filtered.length - 1 ? p + 1 : p));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((p) => (p > 0 ? p - 1 : 0));
    }
    if (e.key === "Enter") {
      if (highlightIndex >= 0) {
        // arrow se chuna hua option: select + agle field par
        e.preventDefault();
        selectOption(filtered[highlightIndex]);
        onKeyDown?.(e);
      } else if (typedRef.current && value && filtered.length > 0) {
        // user ne type kiya hai: top match select + agle field par
        e.preventDefault();
        selectOption(filtered[0]);
        onKeyDown?.(e);
      } else {
        // kuch type nahi kiya: value jaisi hai waisi, bas agle field par
        closeNow();
        onKeyDown?.(e);
      }
    }
    if (e.key === "Escape") closeNow();
  };

  /* ---------- render ---------- */
  return (
    <div
      ref={wrapperRef}
      className={`relative ${wrapperClassName}`}
      onMouseDown={() => { skipOpenRef.current = false; }}
    >
      <input
        ref={inputRef}
        className={`pr-7 ${className}`}
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => {
          typedRef.current = false;
          if (skipOpenRef.current) { skipOpenRef.current = false; return; }
          setFiltered(options);
          setShow(true);
        }}
        onBlur={(e) => {
          if (dropdownRef.current?.contains(e.relatedTarget)) return;
          closeNow();
        }}
        onKeyDown={handleKey}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onMouseDown={(e) => { e.preventDefault(); toggleDropdown(); }}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center ${
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-gray-500 transition-transform duration-150 ${show ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {show && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow overflow-auto text-xs"
          style={{
            left: coords.left,
            width: coords.width,
            maxHeight: coords.maxH,
            zIndex: 999999,
            ...(coords.up ? { bottom: coords.bottom } : { top: coords.top }),
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((opt, i) => (
              <div
                key={i}
                className={`px-3 py-1 cursor-pointer ${i === highlightIndex ? "bg-blue-400 text-white" : "hover:bg-gray-100"}`}
                onMouseDown={() => selectOption(opt)}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">No results found</div>
          )}
          {onAddClick && !disabled && (
            <div
              className="px-3 py-2 border-t text-blue-600 font-medium cursor-pointer hover:bg-blue-50 sticky bottom-0 bg-white"
              onMouseDown={handleAddNew}
            >
              + {addLabel} {value ? `"${value}"` : ""}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ERPAutocomplete;