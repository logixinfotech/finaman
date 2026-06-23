import React from "react";

const TaskDetailDrawer = ({ task, onClose }) => {
    if (!task) {
        return (
            <div className="drawer empty">
                Select a task
            </div>
        );
    }

    return (
        <div className="drawer">

            <div className="drawer-header">
                <h2>{task.title}</h2>

                <button
                    className="close-btn"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            <div className="drawer-content">

                <div className="drawer-section">
                    <label>Description</label>
                    <p>{task.description}</p>
                </div>

                <div className="drawer-section">
                    <label>Status</label>
                    <p>{task.status}</p>
                </div>

                <div className="drawer-section">
                    <label>Priority</label>
                    <p>{task.priority}</p>
                </div>

                <div className="drawer-section">
                    <label>Project</label>
                    <p>{task.project}</p>
                </div>

                <div className="drawer-section">
                    <label>Assigned To</label>
                    <p>{task.assignee}</p>
                </div>

                <div className="drawer-section">
                    <label>Due Date</label>
                    <p>{task.dueDate}</p>
                </div>

                <div className="drawer-section">
                    <label>Progress</label>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${task.progress}%`,
                            }}
                        />
                    </div>

                    <span>{task.progress}%</span>
                </div>

            </div>
        </div>
    );
};

export default TaskDetailDrawer;