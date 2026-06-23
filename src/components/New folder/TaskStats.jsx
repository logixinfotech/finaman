import React from "react";

const TaskStats = ({ tasks }) => {
    const total = tasks.length;

    const completed = tasks.filter(
        (t) => t.status === "Done"
    ).length;

    const progress = tasks.filter(
        (t) => t.status === "In Progress"
    ).length;

    const pending = tasks.filter(
        (t) => t.status === "Todo"
    ).length;

    return (
        <div className="stats-grid">

            <div className="stat-card">
                <h3>{total}</h3>
                <p>Total Tasks</p>
            </div>

            <div className="stat-card">
                <h3>{pending}</h3>
                <p>Pending</p>
            </div>

            <div className="stat-card">
                <h3>{progress}</h3>
                <p>In Progress</p>
            </div>

            <div className="stat-card">
                <h3>{completed}</h3>
                <p>Completed</p>
            </div>

        </div>
    );
};

export default TaskStats;