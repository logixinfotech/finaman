 
import { useRef, useEffect } from "react";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import { FaRegWindowMaximize } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./TabBar.css";
  import { registerShortcutAction } from "../../utils/erpShortcuts";
 import { useShortcutLabel } from "../../utils/Shortcuts/ShortcutsContext";
function TabBar({
    tabs,
    activeTab,
    showSearch,
    searchQuery,
     onSearchChange,
     searchInputRef,
    onChangeActiveTab,
    onCloseTab,
    onReorderTabs,
}) {
    const listRef = useRef(null);
    const getTabIcon = (tab) => {
        if (tab.icon_name && FaIcons[tab.icon_name]) {
            const IconComp = FaIcons[tab.icon_name];
            return <IconComp />;
        }
        if (tab.icon) return tab.icon;
        return <FaRegWindowMaximize />;
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(tabs);
        if (result.source.index === 0 || result.destination.index === 0) return;
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        onReorderTabs(items);
    };

    const handleTabClick = (tab) => {
        onChangeActiveTab(tab.id);
    };
    
      useEffect(() => registerShortcutAction("search", () => {
        searchInputRef.current?.focus();
       searchInputRef.current?.select();
      }), []);
      const searchShortcutLabel = useShortcutLabel("search");
    // ── Alt+1..9 to switch between open tabs (Chrome-style, browser-safe) ───
useEffect(() => {
  const handleTabSwitch = (e) => {
    if (!e.altKey) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!/^[1-9]$/.test(e.key)) return;

    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (!tabs || tabs.length === 0) return;

    e.preventDefault();

    const num = Number(e.key);
    const targetTab = num === 9 ? tabs[tabs.length - 1] : tabs[num - 1];

    if (targetTab) {
      onChangeActiveTab(targetTab.id);
    }
  };

  window.addEventListener("keydown", handleTabSwitch);
  return () => window.removeEventListener("keydown", handleTabSwitch);
}, [tabs, onChangeActiveTab]);

    // Native wheel listener — passive:false hone ki wajah se preventDefault yahan reliably kaam karega
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    return (
        <div className="chrome-tabbar">
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tabs" direction="horizontal">
                    {(provided) => (
                        <div
                            className="chrome-tab-list"
                            ref={(node) => {
                                provided.innerRef(node);
                                listRef.current = node;
                            }}
                            {...provided.droppableProps}
                        >
                            {tabs.map((tab, index) => (
                                <Draggable
                                    key={tab.id}
                                    draggableId={tab.id}
                                    index={index}
                                    isDragDisabled={index === 0}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`chrome-tab ${activeTab?.id === tab.id ? "active" : ""
                                                }`}
                                            onClick={() => handleTabClick(tab)}
                                            onMouseDown={(e) => {
                                                if (e.button === 1 && index !== 0) {
                                                    onCloseTab(tab.id);
                                                }
                                            }}
                                        >
                                            <div className="tab-accent" />

                                            <span className="tab-icon">
                                                {getTabIcon(tab)}
                                            </span>

                                            <span
                                                className="chrome-tab-title"
                                                title={tab.label}
                                            >
                                                {tab.label}
                                            </span>

                                            {tab.type !== "module" && index !== 0 && (
                                                <span
                                                    className="chrome-tab-close"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCloseTab(tab.id);
                                                    }}
                                                >
                                                    ✕
                                                </span>
                                            )}
           
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            {showSearch && (
  <div className="dashboard-search tabbar-search">
    <FaSearch className="search-icon" />
    <input
      ref={searchInputRef}
      type="text"
      placeholder={`Search${ searchShortcutLabel ? ` (${ searchShortcutLabel})` : ""}`}
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
    />
    {searchQuery && (
      <FaTimesCircle
        className="search-clear cursor-pointer"
        onClick={() => {
          onSearchChange("");
          searchInputRef.current?.focus();
        }}
      />
    )}
  </div>
)}
        </div>
        
    );
}

export default TabBar;