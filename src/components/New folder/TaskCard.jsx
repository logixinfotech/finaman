import React from "react";

const TaskCard = ({ task, onClick }) => {
    const priorityClass = {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low",
    };

    return (
        <div
            className="task-card"
            onClick={() => onClick(task)}
        >
            <div className="task-card-header">
                <span className={`priority-badge ${priorityClass[task.priority]}`}>
                    {task.priority}
                </span>

                <span className="task-status">
                    {task.status}
                </span>
            </div>

            <h3>{task.title}</h3>

            <p>{task.description}</p>

            <div className="task-progress">
                <div className="progress-top">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                </div>

                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
            </div>

            <div className="task-tags">
                {task.tags?.map((tag, i) => (
                    <span key={i} className="tag">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="task-footer">
                <div>
                    <small>Due</small>
                    <div>{task.dueDate}</div>
                </div>

                <div>
                    <small>Assigned</small>
                    <div>{task.assignee}</div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;