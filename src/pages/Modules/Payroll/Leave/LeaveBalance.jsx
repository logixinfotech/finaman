import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import { getLeaveBalance } from "../../../../utils/api";

const columns = [
  { key: "employee_name",  label: "Employee Name"   },
  { key: "leave_name",     label: "Leave Type"       },
  { key: "financial_year", label: "Financial Year"   },
  { key: "total_days",     label: "Total Days"       },
  { key: "carried_forward",label: "Carried Forward"  },
  { key: "used_days",      label: "Used Days"        },
  { key: "balance_days",   label: "Balance Days"     },
  {
  key: "last_updated",
  label: "Last Updated",
  render: (row) => {
  if (!row.last_updated) return "-";
  const dt = row.last_updated;
  const [datePart, timePart] = dt.split("T")[0]
    ? [dt.split("T")[0], dt.split("T")[1] || ""]
    : dt.split(" ");
  const [year, month, day] = datePart.split("-");
  const time = timePart?.split(".")[0] || "";
  return `${day}/${month}/${year} ${time}`;
},
},
];

const LeaveBalance = () => {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(false);

const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeaveBalance();
      console.log("API Response:", res); // ← ye dekho
      setList(res.data || []);
    } catch (err) {
      console.error("LeaveBalance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4 bg-slate-50 h-full">
      <Table
      isHidden={true}
        title="Leave Balance"
        data={list}
        columns={columns}
        rowKey="balance_id"
        loading={loading}
      />
    </div>
  );
};

export default LeaveBalance;