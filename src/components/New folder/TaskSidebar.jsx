import React from "react";

const TaskSidebar = () => {
    return (
        <div className="sidebar">

            <div className="sidebar-logo">
                <h2>⚡ FINAMAN</h2>
                <span>TaskFlow Pro</span>
            </div>

            <div className="sidebar-menu">

                <div className="sidebar-item active">
                    📊 Dashboard
                </div>

                <div className="sidebar-item">
                    ✅ My Tasks
                </div>

                <div className="sidebar-item">
                    📅 Due Today
                </div>

                <div className="sidebar-item">
                    🚨 Overdue
                </div>

                <div className="sidebar-item">
                    📁 Projects
                </div>

                <div className="sidebar-item">
                    👥 Team
                </div>

                <div className="sidebar-item">
                    📈 Reports
                </div>

                <div className="sidebar-item">
                    ⚙ Settings
                </div>

            </div>

            <div className="sidebar-user">
                <div className="avatar">
                    S
                </div>

                <div>
                    <strong>Suman</strong>
                    <small>Administrator</small>
                </div>
            </div>

        </div>
    );
};

export default TaskSidebar;