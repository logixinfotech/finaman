const ERPHeader = ({ title, isAddMode, isEditMode, isViewMode }) => {
  return (
    <div
      className="px-5 py-1.5 rounded-t-xl flex justify-between items-center text-white"
      style={{ background: "var(--sidebar-top-bg)" }}
    >
      <h2 className="text-lg font-semibold tracking-wide">{title}</h2>

      <span
        className="text-[11px] font-semibold px-3 py-[2px] rounded-md"
        style={{
          background: "var(--accent-soft)",
          color: "var(--bg-active)",
          border: "1px solid var(--bg-active)"
        }}
      >
        {isAddMode && "NEW ENTRY"}
        {isEditMode && "EDIT MODE"}
        {isViewMode && "VIEW MODE"}
      </span>
    </div>
  );
};

export default ERPHeader;