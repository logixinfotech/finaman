import React, { useState } from "react";

const TaskFormModal = ({
    open,
    onClose,
    onSave,
}) => {
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        status: "Todo",
        assignee: "",
        dueDate: "",
    });

    if (!open) return null;

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const saveTask = () => {
        onSave(form);

        setForm({
            title: "",
            description: "",
            priority: "Medium",
            status: "Todo",
            assignee: "",
            dueDate: "",
        });

        onClose();
    };

    return (
        <div className="modal-overlay">

            <div className="task-modal">

                <div className="modal-header">
                    <h2>Create Task</h2>

                    <button
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">

                    <input
                        name="title"
                        placeholder="Task Title"
                        value={form.title}
                        onChange={handleChange}
                    />

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                    />

                    <select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option>Todo</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </select>

                    <input
                        name="assignee"
                        placeholder="Assigned To"
                        value={form.assignee}
                        onChange={handleChange}
                    />

                    <input
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                    />

                </div>

                <div className="modal-footer">

                    <button
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn-save"
                        onClick={saveTask}
                    >
                        Save Task
                    </button>

                </div>

            </div>

        </div>
    );
};

export default TaskFormModal;