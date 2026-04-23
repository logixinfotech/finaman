const DailyAttendanceFilter = ({ filters, setFilters }) => {

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow p-4">

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Filter Attendance
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-4">

        <div>
          <label className="label">From Date</label>
          <input
            type="date"
            name="from_date"
            value={filters.from_date || ""}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">To Date</label>
          <input
            type="date"
            name="to_date"
            value={filters.to_date || ""}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Employee ID</label>
          <input
            name="emp_id"
            value={filters.emp_id || ""}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Status</label>
          <select
            name="status"
            value={filters.status || ""}
            onChange={handleChange}
            className="input"
          >
            <option value="">All</option>
            <option value="P">Present</option>
            <option value="A">Absent</option>
          </select>
        </div>

      </div>

    </div>
  );
};

export default DailyAttendanceFilter;