
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // Updated import for v13
import "./TabBar.css";

function TabBar({
    tabs,
    activeTab,
    onChangeActiveTab,
    onCloseTab,
    onReorderTabs,
}) {
    const handleDragEnd = (result) => {
        if (!result.destination) return; // No destination means no move

        const items = Array.from(tabs)
        if (result.source.index === 0 || result.destination.index === 0) {
            return;  // Prevent moving the first tab
        }

        const [moved] = items.splice(result.source.index, 1); // Remove dragged item
        items.splice(result.destination.index, 0, moved); // Insert the item in new position

        onReorderTabs(items); // Call the parent to update state
    };

    const handleTabClick = (tab) => {
        // Create a new tab and insert it after the first tab when Dashboard is clicked
        if (tab.label === "Dashboard") {
            const newTab = {
                id: `tab-${Date.now()}`,
                label: `New Tab ${tabs.length + 1}`,
                type: "page", // Default type for new tabs
            };
            const updatedTabs = [...tabs];
            updatedTabs.splice(1, 0, newTab);  // Insert the new tab at index 1
            onReorderTabs(updatedTabs);  // Update the tabs order

            // Set the newly created tab as active
            onChangeActiveTab(newTab.id);
        } else {
            // If clicking another tab, just set it as active
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
                            ref={provided.innerRef}  // Ensure the ref is correctly passed
                            {...provided.droppableProps} // Apply droppableProps
                        >
                            {tabs.map((tab, index) => (
                                <Draggable
                                    key={tab.id}
                                    draggableId={tab.id}
                                    index={index}
                                    isDragDisabled={index === 0}  // Disable dragging for the first tab (Dashboard)
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`chrome-tab ${activeTab?.id === tab.id ? "active" : ""}`}
                                            onClick={() => handleTabClick(tab)}  // Handle tab click
                                        >
                                            <span className="chrome-tab-title">
                                                {tab.label}
                                            </span>
                                            {tab.type !== "module" && (
                                                <span
                                                    className="chrome-tab-close"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent click propagation
                                                        onCloseTab(tab.id);
                                                    }}
                                                >
                                                    ×
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder} {/* Ensure placeholder is rendered */}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}

export default TabBar;
