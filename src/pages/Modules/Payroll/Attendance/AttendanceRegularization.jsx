
import { useEffect, useState, useCallback, useRef } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ERPTabBar from "../../../../components/Reusable/form/ERPTabBar";
import AttendanceRegularizationForm from "./AttendanceRegularizationForm";
import AttendanceRegularizationRegisterView from "./Regularization/AttendanceRegularizationRegisterView";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getAttendRegular, createAttendRegular, updateAttendRegular, deleteAttendRegular } from "../../../../utils/api";
import { FileText, Search, CalendarCheck } from "lucide-react";

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA");
};

const formatTime = (time) => {
  if (!time) return "";
  if (typeof time === "string" && time.includes(":") && time.length <= 5) {
    return time;
  }

  const d = new Date(time);
  if (isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const processApiResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  } else if (response?.success) {
    return response.data || [];
  }
  return [];
};

const initialState = {
  request_id: null,
  employee_id: "",
  employee_name: "",
  attendance_date: "",
  requested_in_time: "",
  requested_out_time: "",
  reason: "",
};

const columns = [
  { key: "employee_name", label: "Employee" },
  {
    key: "attendance_date",
    label: "Date",
    render: (row) => formatDate(row.attendance_date),
  },
  {
    key: "requested_in_time",
    label: "Req. In",
    render: (row) => formatTime(row.requested_in_time),
  },
  {
    key: "requested_out_time",
    label: "Req. Out",
    render: (row) => formatTime(row.requested_out_time),
  },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
];

const MODULE_TABS = [
  { id: "entry", label: "1. Regularization Entry", icon: <FileText size={13} /> },
  { id: "search", label: "2. Request List & Search", icon: <Search size={13} /> },
  { id: "regularization", label: "3. Monthly Register", icon: <CalendarCheck size={13} /> },
];

const AttendanceRegularization = ({ tab }) => {
  const [activeTab, setActiveTab] = useState("entry");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchAttendanceList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAttendRegular();
      setList(processApiResponse(response));
    } catch (err) {
      alertError("Fetch Error", "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode, formData, setFormData, showForm, setShowForm,
    saving, handleEditCancel, handleView, handleAdd, handleModify, performSave, rights: originalRights
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      if (isEdit) {
        return await updateAttendRegular(data.request_id, data);
      }
      return await createAttendRegular(data);
    },
    fetchAttendanceList,
    tab?.appl_name || "AttendanceRegularization"
  );

  useEffect(() => {
    fetchAttendanceList();
  }, [fetchAttendanceList]);

  const rights = { ...originalRights, add: 1, edit: 1, delete: 1, view: 1 };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.request_id === row.request_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setActiveTab("entry");
  };

  // Fixed handleSave to merge frontend employee_name with backend response
  const handleSave = useCallback(async (updatedData) => {
    const dataToSave = updatedData || formData;
    const response = await performSave("request_id", dataToSave);

    if (response?.success) {
      showToast({
        icon: "success",
        title: "Request Saved Successfully"
      });

      const refreshed = await getAttendRegular();
      const latestList = processApiResponse(refreshed);
      setList(latestList);

      const savedId = response.data?.request_id || dataToSave.request_id;
      const fetchedRecord = latestList.find(item => item.request_id === savedId) || response.data;

      // Merge data so employee_name is safely preserved even if the API omitted it
      const savedRecord = {
        ...dataToSave,
        ...fetchedRecord,
        employee_name: fetchedRecord?.employee_name || dataToSave.employee_name || formData.employee_name
      };

      const newIndex = latestList.findIndex(item => item.request_id === savedId);
      if (newIndex !== -1) setCurrentIndex(newIndex);

      // Load the merged data cleanly into View Mode
      handleView(savedRecord);
    }
  }, [formData, performSave, handleView]);

  const shortcutStateRef = useRef({});
  shortcutStateRef.current = { list, currentIndex, handleAdd, handleSave, setShowForm, handleView, setActiveTab };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => {
        const { list, currentIndex, handleView } = shortcutStateRef.current;
        const nextIdx = Math.min(currentIndex + 1, list.length - 1);
        if (list[nextIdx]) {
          setCurrentIndex(nextIdx);
          handleView(list[nextIdx]);
        }
      },
      onPrevRecord: () => {
        const { list, currentIndex, handleView } = shortcutStateRef.current;
        const prevIdx = Math.max(currentIndex - 1, 0);
        if (list[prevIdx]) {
          setCurrentIndex(prevIdx);
          handleView(list[prevIdx]);
        }
      },
      onNew: () => {
        shortcutStateRef.current.handleAdd();
        shortcutStateRef.current.setActiveTab("entry");
      },
      onSave: () => shortcutStateRef.current.handleSave(),
      onEsc: () => {
        shortcutStateRef.current.setShowForm(false);
        shortcutStateRef.current.setActiveTab("search");
      },
    });
  }, []);

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete this attendance request?`
    });
    if (!confirmed) return;

    await deleteAttendRegular(row.request_id);
    showToast({ icon: "success", title: "Deleted" });
    fetchAttendanceList();
    setShowForm(false);
    setActiveTab("search");
  };

  const handleTabChange = (targetTab) => {
    setActiveTab(targetTab);
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.request_id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} record(s)?` });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteAttendRegular(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
      }
      fetchAttendanceList();
      setShowForm(false);
      setActiveTab("search");
    } catch (err) {
      alertError("Delete Error", "Failed to delete some attendance records");
    }
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-slate-50">
      {/* Module Level Navigation Tab Strip */}
      <ERPTabBar
        tabs={MODULE_TABS}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
          if (tabId === "entry") {
            setShowForm(true);
          } else if (tabId === "search") {
            setShowForm(false);
          }
        }}
      />

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {/* Tab 1: Manual Regularization Entry Form */}
        {activeTab === "entry" && (
          <AttendanceRegularizationForm
            initialData={formData}
            setParentFormData={setFormData}
            onSave={handleSave}
            onDelete={handleDelete}
            onCancel={() => handleTabChange("search")}
            mode={mode}
            saving={saving}
            onModify={handleModify}
            onNewEntry={handleAdd}
            currentRecord={list.length > 0 ? currentIndex + 1 : 0}
            totalRecords={list.length}
            rights={rights}
            onEditCancel={handleEditCancel}
            activeTab="entry"
            onTabChange={handleTabChange}
            onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
            onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
          />
        )}

        {/* Tab 2: Requests List & Search View */}
        {activeTab === "search" && (
          <div className="bg-slate-50 h-full p-2">
            <Table
              activeTab="search"
              onTabChange={handleTabChange}
              title="Attendance Regularization Requests"
              data={list}
              onDeleteMultiple={handleDeleteMultiple}
              columns={columns}
              rowKey="request_id"
              loading={loading}
              onAdd={() => {
                handleAdd();
                setActiveTab("entry");
              }}
              onRowDoubleClick={handleRowSelect}
            />
          </div>
        )}

        {/* Tab 3: Monthly Attendance Regularization Register Matrix (SPEC: LI/HR/TM/04/011) */}
        {activeTab === "regularization" && (
          <div className="h-full w-full overflow-hidden">
            <AttendanceRegularizationRegisterView tab={tab} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRegularization;
