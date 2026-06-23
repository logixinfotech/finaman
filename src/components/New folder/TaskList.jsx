import React from "react";
import TaskCard from "./TaskCard";

const TaskList = ({
    tasks = [],
    onSelect = () => { },
}) => {

    // Safety Check
    if (!Array.isArray(tasks)) {
        return (
            <div className="empty-state">
                <div className="empty-icon">⚠️</div>

                <h3>Invalid Task Data</h3>

                <p>
                    Task data is not in valid format.
                </p>
            </div>
        );
    }

    // No Records
    if (tasks.length === 0) {
        return (
            <div className="empty-state">

                <div className="empty-icon">
                    📋
                </div>

                <h3>No Tasks Found</h3>

                <p>
                    Create a new task to get started.
                </p>

            </div>
        );
    }

    return (
        <div className="task-list-container">

            <div className="task-list-header">

                <div>
                    <h3>Task List</h3>
                    <span>
                        Total Tasks : {tasks.length}
                    </span>
                </div>

            </div>

            <div className="task-grid">

                {tasks.map((task) => (

                    <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onSelect(task)}
                    />

                ))}

            </div>

        </div>
    );
};

export default TaskList;