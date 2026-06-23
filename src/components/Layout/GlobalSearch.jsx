import { useEffect, useRef, useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const GlobalSearch = ({ allMenus, onOpenPage }) => {
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText), 200);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredResults = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return [];
    const results = [];
    for (const m of allMenus) {
      if (results.length >= 8) break;
      if (m.menu_hide !== "Y" && m.bar_name.toLowerCase().includes(query)) {
        results.push(m);
      }
    }
    return results;
  }, [debouncedQuery, allMenus]);

  useEffect(() => {
    const handleK = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
        searchRef.current?.focus();
      }
      if (showSearch && filteredResults.length > 0) {
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
    window.addEventListener("keydown", handleK);
    return () => window.removeEventListener("keydown", handleK);
  }, [showSearch, filteredResults, highlightIndex, onOpenPage]);

  return (
    <div className="relative group ">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-[10px] z-10" />
      <input
        ref={searchRef}
        type="text"
        placeholder="Search... (Ctrl+K)"
        value={searchText}
        onFocus={() => setShowSearch(true)}
        onBlur={() => setTimeout(() => setShowSearch(false), 200)}
        onChange={(e) => {
          setSearchText(e.target.value);
          setHighlightIndex(0);
        }} 
        className="w-[180px] focus:w-[240px] pl-8 pr-3 py-1.5 rounded bg-white/20 focus:bg-white/30 border border-white/10 text-white placeholder-white/40 outline-none transition-all text-xs"
      />

      <AnimatePresence>
        {showSearch && filteredResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-10 w-[280px] right-0 bg-white rounded-lg shadow-[0_15px_30px_-5px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-[600]"
          >
            {/* Header Tip */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Navigator</span>
              <span className="text-[8px] text-slate-300">↑↓ to navigate</span>
            </div>

            <div className="py-1">
              {filteredResults.map((item, index) => {
                const isActive = index === highlightIndex; 
                const moduleName = item.mod_name || item.module_name || "General";

                return (
                  <div
                    key={item.masmnu_id}
                    onClick={() => {
                      onOpenPage(item);
                      setSearchText("");
                    }}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={`px-3 py-2 cursor-pointer transition-colors flex flex-col gap-0.5 ${
                      isActive ? "bg-blue-600 shadow-inner" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`text-[11px] font-semibold tracking-tight ${isActive ? "text-white" : "text-slate-700"}`}>
                      {item.bar_name}
                    </span>
                    <div className="flex items-center gap-1">
                       <div className={`w-1 h-1 rounded-full ${isActive ? "bg-blue-300" : "bg-blue-500"}`} />
                       <span className={`text-[9px] uppercase font-bold tracking-tighter ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                         {moduleName}
                       </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;