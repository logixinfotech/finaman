const MenuMasterTable = ({
  data,
  onRowClick,
  selectedRow,
  visibleColumns,
  sortField,
  sortOrder,
  setSortField,
  setSortOrder,
}) => {
  const sort = (col) => {
    if (sortField === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(col);
      setSortOrder("asc");
    }
  };

  return (
    <div className="overflow-auto max-h-[420px] border rounded">
      <table className="min-w-[1600px] text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            {Object.entries(visibleColumns).map(
              ([col, visible]) =>
                visible && (
                  <th
                    key={col}
                    onClick={() => sort(col)}
                    className="cursor-pointer px-3 py-2"
                  >
                    {col.replace(/_/g, " ").toUpperCase()}
                    {sortField === col && (sortOrder === "asc" ? " ▲" : " ▼")}
                  </th>
                )
            )}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="20" className="text-center py-10 text-gray-500">
                🚫 No menu data
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.masmnu_id}
                onClick={() => onRowClick(row)}
                className={`border-b hover:bg-gray-100 ${
                  selectedRow?.masmnu_id === row.masmnu_id ? "bg-blue-50" : ""
                }`}
              >
                {visibleColumns.mod_name && <td>{row.mod_name}</td>}
                {visibleColumns.pad_name && <td>{row.pad_name}</td>}
                {visibleColumns.item_type && <td>{row.item_type}</td>}
                {visibleColumns.srl_no && <td>{row.srl_no}</td>}
                {visibleColumns.bar_srl && <td>{row.bar_srl}</td>}
                {visibleColumns.bar_name && <td>{row.bar_name}</td>}
                {visibleColumns.appl_name && <td>{row.appl_name}</td>}
                {visibleColumns.appl_type && <td>{row.appl_type}</td>}
                {visibleColumns.menu_hide && (
                  <td className="text-center font-bold">
                    {row.menu_hide === "Y" ? "Y" : ""}
                  </td>
                )}
                {visibleColumns.appl_para && <td>{row.appl_para}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MenuMasterTable;
