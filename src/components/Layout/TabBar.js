import * as FaIcons from "react-icons/fa";
import { FaRegWindowMaximize } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./TabBar.css";

function TabBar({
    tabs,
    activeTab,
    onChangeActiveTab,
    onCloseTab,
    onReorderTabs,
}) {
    const getTabIcon = (tab) => {
        if (tab.icon_name && FaIcons[tab.icon_name]) {
            const IconComp = FaIcons[tab.icon_name];
            return <IconComp />;
        }
        // fall back to any emoji already set, else a default icon
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
        if (tab.label === "Dashboard") {
            const newTab = {
                id: `tab-${Date.now()}`,
                label: `New Tab ${tabs.length}`,
                type: "page",
                icon: "📄"
            };

            const updatedTabs = [...tabs];
            updatedTabs.splice(1, 0, newTab);

            onReorderTabs(updatedTabs);
            onChangeActiveTab(newTab.id);
        } else {
            onChangeActiveTab(tab.id);
        }
    };

    return (
        <div className="chrome-tabbar">
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tabs" direction="horizontal">
                    {(provided) => (
                        <div
                            className="chrome-tab-list"
                            ref={provided.innerRef}
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
                                            {/* Accent */}
                                            <div className="tab-accent" />

                                            <span className="tab-icon">
                                                {getTabIcon(tab)}
                                            </span>

                                            {/* Title */}
                                            <span
                                                className="chrome-tab-title"
                                                title={tab.label}
                                            >
                                                {tab.label}
                                            </span>

                                            {/* Close */}
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
        </div>
    );
}

export default TabBar;