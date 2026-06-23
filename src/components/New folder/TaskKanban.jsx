import React from "react";

const TaskKanban = ({ tasks, onSelect }) => {
    const todo = tasks.filter((t) => t.status === "Todo");
    const progress = tasks.filter((t) => t.status === "In Progress");
    const done = tasks.filter((t) => t.status === "Done");

    const renderCard = (task) => (
        <div
            key={task.id}
            className="kanban-task"
            onClick={() => onSelect(task)}
        >
            <h4>{task.title}</h4>
            <p>{task.description}</p>

            <div className="kanban-footer">
                <span>{task.assignee}</span>
                <span>{task.progress}%</span>
            </div>
        </div>
    );

    return (
        <div className="kanban">

            <div className="kanban-column">
                <div className="kanban-header todo">
                    Todo ({todo.length})
                </div>

                {todo.map(renderCard)}
            </div>

            <div className="kanban-column">
                <div className="kanban-header progress">
                    In Progress ({progress.length})
                </div>

                {progress.map(renderCard)}
            </div>

            <div className="kanban-column">
                <div className="kanban-header done">
                    Done ({done.length})
                </div>

                {done.map(renderCard)}
            </div>

        </div>
    );
};

export default TaskKanban;