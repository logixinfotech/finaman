// import { useEffect, useRef, useState, useMemo } from "react";
// import { FaSearch, FaTimes } from "react-icons/fa";
// import * as FaIcons from "react-icons/fa";
// import { motion, AnimatePresence } from "framer-motion";

// const GlobalSearch = ({ allMenus, modules = [], onOpenPage }) => {
//   const [searchText, setSearchText] = useState("");
//   const [showSearch, setShowSearch] = useState(false);
//   const [debouncedQuery, setDebouncedQuery] = useState("");
//   const [highlightIndex, setHighlightIndex] = useState(0);
//   const searchRef = useRef(null);
//   const listRef = useRef(null);
//   const itemRefs = useRef({});

//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedQuery(searchText), 200);
//     return () => clearTimeout(timer);
//   }, [searchText]);

//   const moduleMap = useMemo(() => {
//     const map = {};
//     if (Array.isArray(modules)) {
//       modules.forEach((m) => {
//         map[m.masmod_id] = m.mod_name;
//       });
//     }
//     return map;
//   }, [modules]);

//   // const filteredResults = useMemo(() => {
//   //   const query = debouncedQuery.trim().toLowerCase();
//   //   if (!query) return [];
//   //   const results = [];
//   //   for (const m of allMenus) {
//   //     if (results.length >= 8) break;
//   //     if (m.menu_hide !== "Y" && (m.bar_name || "").toLowerCase().includes(query)) {
//   //       results.push(m);
//   //     }
//   //   }
//   //   return results;
//   // }, [debouncedQuery, allMenus]);

//   //with Module master
//   const filteredResults = useMemo(() => {
//     const query = debouncedQuery.trim().toLowerCase();
//     if (!query) return [];
//     const results = [];
//     for (const m of allMenus) {
//       if (results.length >= 8) break;
//       const isMenuHidden = m.menu_hide === "Y";
//       const isGroupHidden = m.grp_hide === "Y";
//       const isModuleHidden = m.show_stat === "N";
//       if (!isMenuHidden && !isGroupHidden && !isModuleHidden && (m.bar_name || "").toLowerCase().includes(query)) {
//         results.push(m);
//       }
//     }
//     return results;
// }, [debouncedQuery, allMenus]);

//   const hasQuery = debouncedQuery.trim().length > 0;
//   const showPanel = showSearch && hasQuery;
//   useEffect(() => {
//     const active = filteredResults[highlightIndex];
//     if (active && itemRefs.current[active.masmnu_id]) {
//       itemRefs.current[active.masmnu_id].scrollIntoView({ block: "nearest" });
//     }
//   }, [highlightIndex, filteredResults]);
//   const palette = [
//     "#5B7FDE", "#7B6EF6", "#9A6FD1", "#C46FB3", "#D96B7A",
//     "#D98A5F", "#C9A24B", "#5FA972", "#3FA894", "#3E9CA8",
//     "#4A93C4", "#6C8FE0",
//   ];
//   const getItemColor = (name = "") => {
//     let hash = 0;
//     for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
//     return palette[Math.abs(hash) % palette.length];
//   };


//   const getIcon = (item) => {
//     if (item?.icon_name && FaIcons[item.icon_name]) {
//       const IconComp = FaIcons[item.icon_name];
//       return <IconComp />;
//     }
//     return null;
//   };

//   const closeSearch = () => {
//     setShowSearch(false);
//     searchRef.current?.blur();
//   };

//   useEffect(() => {
//     const handleK = (e) => {
//       if (e.ctrlKey && e.key.toLowerCase() === "k") {
//         e.preventDefault();
//         setShowSearch(true);
//         searchRef.current?.focus();
//         return;
//       }

//       if (!showSearch) return;

//       if (e.key === "Escape") {
//         e.preventDefault();
//         closeSearch();
//         return;
//       }

//       if (filteredResults.length > 0) {
//         if (e.key === "ArrowDown") {
//           e.preventDefault();
//           setHighlightIndex((p) => (p + 1) % filteredResults.length);
//         } else if (e.key === "ArrowUp") {
//           e.preventDefault();
//           setHighlightIndex((p) => (p === 0 ? filteredResults.length - 1 : p - 1));
//         } else if (e.key === "Enter") {
//           e.preventDefault();
//           if (filteredResults[highlightIndex]) {
//             onOpenPage(filteredResults[highlightIndex]);
//             setSearchText("");
//             setShowSearch(false);
//           }
//         }
//       }
//     };
//     window.addEventListener("keydown", handleK);
//     return () => window.removeEventListener("keydown", handleK);
//   }, [showSearch, filteredResults, highlightIndex, onOpenPage]);
//   const renderHighlighted = (text, query, color) => {
//     if (!query) return text;
//     const idx = text.toLowerCase().indexOf(query.toLowerCase());
//     if (idx === -1) return text;
//     return (
//       <>
//         {text.slice(0, idx)}
//         <span style={{ color, fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
//         {text.slice(idx + query.length)}
//       </>
//     );
//   };

//   return (
//     <div className="relative group">
//       <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2   text-white/80 text-[10px] z-10 pointer-events-none" />

//       <input
//         ref={searchRef}
//         type="text"
//         placeholder="Search... (Ctrl+K)"
//         value={searchText}
//         onFocus={() => setShowSearch(true)}
//         onBlur={() => setTimeout(() => setShowSearch(false), 200)}
//         onChange={(e) => {
//           setSearchText(e.target.value);
//           setHighlightIndex(0);
//         }}
//         className="w-[180px] focus:w-[260px] color:white pl-8 pr-7 py-[7px] rounded-[10px] bg-white/20 border border-white/10 text-white placeholder-white/40 text-slate-800  outline-none transition-[width,box-shadow,border-color] duration-200 text-xs focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
//       />

//       {searchText && (
//         <button
//           type="button"
//           onMouseDown={(e) => e.preventDefault()}
//           onClick={() => {
//             setSearchText("");
//             searchRef.current?.focus();
//           }}
//           className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors z-10"
//         >
//           <FaTimes className="text-[10px]" />
//         </button>
//       )}

//       <AnimatePresence>
//         {showPanel && (
//           <motion.div
//             initial={{ opacity: 0, y: 8, scale: 0.98 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 8, scale: 0.98 }}
//             transition={{ duration: 0.15, ease: "easeOut" }}
//             className="absolute top-[42px] w-[300px] right-0 bg-white rounded-[14px] shadow-[0_20px_40px_-8px_rgba(0,0,0,0.22)] border border-slate-200/70 overflow-hidden z-[600]"
//           >
//             {/* Header Tip */}
//             <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
//               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
//                 {filteredResults.length > 0 ? `${filteredResults.length} results` : "Navigator"}
//               </span>
//               <span className="text-[9px] text-slate-400 flex items-center gap-1">
//                 <kbd className="px-1 py-[1px] rounded-[4px] bg-white border border-slate-200 text-slate-400 font-sans">↑↓</kbd>
//                 navigate
//                 <kbd className="px-1 py-[1px] rounded-[4px] bg-white border border-slate-200 text-slate-400 font-sans">↵</kbd>
//                 open
//               </span>
//             </div>

//             {filteredResults.length > 0 ? (
//               <div ref={listRef} role="listbox" className="py-1.5 px-1.5 flex flex-col gap-[3px] max-h-[320px] overflow-y-auto">
//                 {filteredResults.map((item, index) => {
//                   const isActive = index === highlightIndex;
//                   const moduleName = moduleMap[item.masmod_id] || "General";
//                   const color = getItemColor(item.bar_name || moduleName);

//                   return (
//                     <div
//                       key={item.masmnu_id}
//                       ref={(el) => (itemRefs.current[item.masmnu_id] = el)}
//                       role="option"
//                       aria-selected={isActive}
//                       onClick={() => {
//                         onOpenPage(item);
//                         setSearchText("");
//                         setShowSearch(false);
//                       }}
//                       onMouseEnter={() => setHighlightIndex(index)}
//                       className="relative px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors duration-100 flex items-center gap-2.5"
//                       style={{ background: isActive ? `${color}14` : "transparent" }}
//                     >
//                       {isActive && (
//                         <div
//                           className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full"
//                           style={{ background: color }}
//                         />
//                       )}
//                       <div
//                         className="shrink-0 w-6 h-6 rounded-[7px] flex items-center justify-center text-[11px] font-bold"
//                         style={{ background: `${color}1c`, color }}
//                       >
//                         {getIcon(item) || (item.bar_name || "?").charAt(0).toUpperCase()}
//                       </div>

//                       <div className="flex flex-col gap-0.5 min-w-0">
//                         <span className="text-[11.5px] font-semibold tracking-tight truncate text-slate-700">
//                           {renderHighlighted(item.bar_name || "", debouncedQuery, color)}
//                         </span>
//                         <span className="text-[9px] uppercase font-bold tracking-wide text-slate-400">
//                           {moduleName}
//                         </span>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="px-4 py-6 flex flex-col items-center gap-1.5 text-center">
//                 <FaSearch className="text-slate-300 text-[16px]" />
//                 <span className="text-[11px] font-medium text-slate-500">No matches found</span>
//                 <span className="text-[9.5px] text-slate-400">Try a different keyword</span>
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default GlobalSearch;
import { useEffect, useRef, useState, useMemo } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
// TODO: apne project ke hisaab se path check karo (Header.jsx jitni hi depth maani hai)
import { registerShortcutAction } from "../../utils/erpShortcuts";
import { useShortcutLabel } from "../../utils/Shortcuts/ShortcutsContext";

const GlobalSearch = ({ allMenus, modules = [], onOpenPage }) => {
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  // Settings mein jo bhi key ho ("global.search"), yahi placeholder mein dikhega —
  // hardcoded "Ctrl+K" nahi, taaki user ne rebind kiya ho to sahi hint dikhe.
  const shortcutLabel = useShortcutLabel("global.search") || "Ctrl+K";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText), 200);
    return () => clearTimeout(timer);
  }, [searchText]);

  const moduleMap = useMemo(() => {
    const map = {};
    if (Array.isArray(modules)) {
      modules.forEach((m) => {
        map[m.masmod_id] = m.mod_name;
      });
    }
    return map;
  }, [modules]);

  const filteredResults = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return [];
    const results = [];
    for (const m of allMenus) {
      if (results.length >= 8) break;
      const isMenuHidden = m.menu_hide === "Y";
      const isGroupHidden = m.grp_hide === "Y";
      const isModuleHidden = m.show_stat === "N";
      if (!isMenuHidden && !isGroupHidden && !isModuleHidden && (m.bar_name || "").toLowerCase().includes(query)) {
        results.push(m);
      }
    }
    return results;
  }, [debouncedQuery, allMenus]);

  const hasQuery = debouncedQuery.trim().length > 0;
  const showPanel = showSearch && hasQuery;
  useEffect(() => {
    const active = filteredResults[highlightIndex];
    if (active && itemRefs.current[active.masmnu_id]) {
      itemRefs.current[active.masmnu_id].scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, filteredResults]);
  const palette = [
    "#5B7FDE", "#7B6EF6", "#9A6FD1", "#C46FB3", "#D96B7A",
    "#D98A5F", "#C9A24B", "#5FA972", "#3FA894", "#3E9CA8",
    "#4A93C4", "#6C8FE0",
  ];
  const getItemColor = (name = "") => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  };


  const getIcon = (item) => {
    if (item?.icon_name && FaIcons[item.icon_name]) {
      const IconComp = FaIcons[item.icon_name];
      return <IconComp />;
    }
    return null;
  };

  const closeSearch = () => {
    setShowSearch(false);
    searchRef.current?.blur();
  };

  // "Search kholo" ab central dispatcher se aata hai (Settings mein rebind/disable ho sakta hai).
  // Registry mein id "global.search" hai, default Ctrl+K — koi apna alag window listener nahi.
  useEffect(() => {
    return registerShortcutAction("global.search", () => {
      setShowSearch(true);
      searchRef.current?.focus();
    });
  }, []);

  // Panel khulne ke baad ke andar ka navigation (Escape/↑/↓/Enter) — ye shortcut nahi,
  // isi component ka UX hai, isliye customizable nahi, jaisa pehle tha waisa hi.
  useEffect(() => {
    const handleNav = (e) => {
      if (!showSearch) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
        return;
      }

      if (filteredResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightIndex((p) => (p + 1) % filteredResults.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightIndex((p) => (p === 0 ? filteredResults.length - 1 : p - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (filteredResults[highlightIndex]) {
            onOpenPage(filteredResults[highlightIndex]);
            setSearchText("");
            setShowSearch(false);
          }
        }
      }
    };
    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [showSearch, filteredResults, highlightIndex, onOpenPage]);

  const renderHighlighted = (text, query, color) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color, fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="relative group">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2   text-white/80 text-[10px] z-10 pointer-events-none" />

      <input
        ref={searchRef}
        type="text"
        placeholder={`Search... (${shortcutLabel})`}
        value={searchText}
        onFocus={() => setShowSearch(true)}
        onBlur={() => setTimeout(() => setShowSearch(false), 200)}
        onChange={(e) => {
          setSearchText(e.target.value);
          setHighlightIndex(0);
        }}
        className="w-[180px] focus:w-[260px] color:white pl-8 pr-7 py-[7px] rounded-[10px] bg-white/20 border border-white/10 text-white placeholder-white/40 text-slate-800  outline-none transition-[width,box-shadow,border-color] duration-200 text-xs focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
      />

      {searchText && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setSearchText("");
            searchRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors z-10"
        >
          <FaTimes className="text-[10px]" />
        </button>
      )}

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[42px] w-[300px] right-0 bg-white rounded-[14px] shadow-[0_20px_40px_-8px_rgba(0,0,0,0.22)] border border-slate-200/70 overflow-hidden z-[600]"
          >
            {/* Header Tip */}
            <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {filteredResults.length > 0 ? `${filteredResults.length} results` : "Navigator"}
              </span>
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                <kbd className="px-1 py-[1px] rounded-[4px] bg-white border border-slate-200 text-slate-400 font-sans">↑↓</kbd>
                navigate
                <kbd className="px-1 py-[1px] rounded-[4px] bg-white border border-slate-200 text-slate-400 font-sans">↵</kbd>
                open
              </span>
            </div>

            {filteredResults.length > 0 ? (
              <div ref={listRef} role="listbox" className="py-1.5 px-1.5 flex flex-col gap-[3px] max-h-[320px] overflow-y-auto">
                {filteredResults.map((item, index) => {
                  const isActive = index === highlightIndex;
                  const moduleName = moduleMap[item.masmod_id] || "General";
                  const color = getItemColor(item.bar_name || moduleName);

                  return (
                    <div
                      key={item.masmnu_id}
                      ref={(el) => (itemRefs.current[item.masmnu_id] = el)}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        onOpenPage(item);
                        setSearchText("");
                        setShowSearch(false);
                      }}
                      onMouseEnter={() => setHighlightIndex(index)}
                      className="relative px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors duration-100 flex items-center gap-2.5"
                      style={{ background: isActive ? `${color}14` : "transparent" }}
                    >
                      {isActive && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full"
                          style={{ background: color }}
                        />
                      )}
                      <div
                        className="shrink-0 w-6 h-6 rounded-[7px] flex items-center justify-center text-[11px] font-bold"
                        style={{ background: `${color}1c`, color }}
                      >
                        {getIcon(item) || (item.bar_name || "?").charAt(0).toUpperCase()}
                      </div>

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11.5px] font-semibold tracking-tight truncate text-slate-700">
                          {renderHighlighted(item.bar_name || "", debouncedQuery, color)}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wide text-slate-400">
                          {moduleName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-6 flex flex-col items-center gap-1.5 text-center">
                <FaSearch className="text-slate-300 text-[16px]" />
                <span className="text-[11px] font-medium text-slate-500">No matches found</span>
                <span className="text-[9.5px] text-slate-400">Try a different keyword</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;