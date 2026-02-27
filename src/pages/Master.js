 
export default function Master({ module }) {
    return (
        <div className="page-wrapper">
            <h1>Master</h1>
            <p>Module: {module?.mod_name}</p>
            <p>This is the Master dashboard page.</p>
        </div>
    );
}
