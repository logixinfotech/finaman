import React, { useState } from "react";
import { mockTasks } from "./data/mockTasks";

import TaskSidebar from "./TaskSidebar";
import TaskStats from "./TaskStats";
import TaskList from "./TaskList";
import TaskKanban from "./TaskKanban";
import TaskDetailDrawer from "./TaskDetailDrawer";
import TaskFormModal from "./TaskFormModal";

import "./styles/task.css";

const TaskDashboard = () => {
    const [tasks, setTasks] = useState(mockTasks);
    const [selectedTask, setSelectedTask] = useState(null);

    const [view, setView] = useState("grid");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);

    const addTask = (taskData) => {
        const newTask = {
            id: Date.now(),
            title: taskData.title || "",
            description: taskData.description || "",
            priority: taskData.priority || "Medium",
            status: taskData.status || "Todo",
            assignee: taskData.assignee || "",
            dueDate: taskData.dueDate || "",
            progress: 0,
            project: "General",
            tags: [],
        };

        setTasks((prev) => [newTask, ...prev]);
    };

    const filteredTasks = tasks.filter((task) => {
        const keyword = search.toLowerCase();

        return (
            task.title?.toLowerCase().includes(keyword) ||
            task.description?.toLowerCase().includes(keyword) ||
            task.assignee?.toLowerCase().includes(keyword)
        );
    });

    return (
        <div className="tm-layout">

            <TaskSidebar />

            <div className="tm-main">

                <div className="tm-header">

                    <div>
                        <h2>Task Management</h2>
                        <p>Professional Workspace Dashboard</p>
                    </div>

                    <div className="header-right">

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <button className="icon-btn">
                            🔔
                        </button>

                        <button
                            className="btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            + New Task
                        </button>

                    </div>

                </div>

                <TaskStats tasks={filteredTasks} />

                <div className="view-toolbar">

                    <div className="view-switch">

                        <button
                            className={view === "grid" ? "active" : ""}
                            onClick={() => setView("grid")}
                        >
                            Grid View
                        </button>

                        <button
                            className={view === "kanban" ? "active" : ""}
                            onClick={() => setView("kanban")}
                        >
                            Kanban View
                        </button>

                    </div>

                    <div className="task-count">
                        Total Tasks : {filteredTasks.length}
                    </div>

                </div>

                {view === "grid" ? (
                    <TaskList
                        tasks={filteredTasks}
                        onSelect={setSelectedTask}
                    />
                ) : (
                    <TaskKanban
                        tasks={filteredTasks}
                        onSelect={setSelectedTask}
                    />
                )}

            </div>

            <TaskDetailDrawer
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />

            <TaskFormModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={addTask}
            />

        </div>
    );
};

export default TaskDashboard;