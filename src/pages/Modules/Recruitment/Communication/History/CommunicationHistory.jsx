import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  History,
  Phone,
  MessageSquare,
  Mail,
  Smartphone,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  Play,
  Download,
  FileAudio,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import Table from "../../../../../components/Reusable/table/Table";
import { showToast } from "../../../../../components/Reusable/alert";
import { formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import { getCommunicationHistory, deleteCommunicationLogs } from "../../../../../utils/communicationApi";
import { DISPOSITION_STYLES } from "../communicationConstants";
import { initials } from "../../CandidateTracking/pipelineConstants";
import { BaseButton, RefreshButton, ResetButton } from "../../../../../components/Reusable/button/ActionButon";
import config from "../../../../../config";

const CHANNELS = ["All", "Call", "WhatsApp", "Email", "SMS"];
// comm_type is stored as "Call - Outbound" / "Call - Inbound" / "WhatsApp" / "Email" / "SMS"
const channelOf = (row) => ((row.comm_type || row.channel || "Call").split(" - ")[0]);

export default function CommunicationHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // The API filters by comm_type/disposition only; channel + text search are applied client-side below
      const res = await getCommunicationHistory({ limit: 300 });
      if (res?.success) {
        setLogs(res.data || []);
        setTotal((res.data || []).length);
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to load communication history" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error loading history" });
    } finally {
      setLoading(false);
    }
  }, []);
  const handleDeleteLogs = useCallback(async (ids) => {
    if (!ids?.length) return;
    if (!window.confirm(`Delete ${ids.length} selected log${ids.length > 1 ? "s" : ""}?`)) return;
    try {
      const res = await deleteCommunicationLogs(ids);
      if (res?.success) {
        showToast({ icon: "success", title: res.message || "Deleted successfully" });
        loadHistory();
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to delete" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error deleting logs" });
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const visibleLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((row) => {
      if (selectedChannel !== "All" && channelOf(row) !== selectedChannel) return false;
      if (!q) return true;
      return [row.candidate_name, row.candidate_code, row.candidate_mobile, row.disposition, row.remarks, row.job_role, row.vacancy_no]
        .some((v) => v && String(v).toLowerCase().includes(q));
    });
  }, [logs, selectedChannel, search]);

  // Rows are a fixed 34px in the shared Table, so every cell is a single truncated line
  const columns = useMemo(() => [
    {
      key: "candidate_name",
      label: "Candidate",
      width: 240,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}>
            {initials(row.candidate_name)}
          </span>
          <span className="min-w-0 truncate" title={`${row.candidate_name || ""} · ${row.candidate_code || ""} · ${row.candidate_mobile || ""}`}>
            <span className="font-semibold text-slate-800">{row.candidate_name || "Unknown"}</span>
            <span className="text-slate-400 text-[10.5px]"> · {row.candidate_code || "—"} · <span className="font-mono">{row.candidate_mobile || "No Phone"}</span></span>
          </span>
        </span>
      ),
    },
    {
      key: "comm_type",
      label: "Channel",
      width: 170,
      render: (row) => {
        const ch = channelOf(row);
        const dir = row.direction || "Outbound";
        const isIn = dir === "Inbound";
        let Icon = Phone;
        let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
        if (ch === "WhatsApp") { Icon = MessageSquare; badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"; }
        else if (ch === "Email") { Icon = Mail; badgeColor = "bg-purple-50 text-purple-700 border-purple-200"; }
        else if (ch === "SMS") { Icon = Smartphone; badgeColor = "bg-amber-50 text-amber-700 border-amber-200"; }
        const DirIcon = isIn ? ArrowDownLeft : ArrowUpRight;
        return (
          <div className="flex items-center gap-1.5 h-full whitespace-nowrap">
            <span className={`inline-flex items-center self-center gap-1 h-[20px] px-2 rounded-full text-[10px] font-bold leading-none border ${badgeColor}`}>
              <Icon size={10} />
              {ch}
            </span>
            <span
              className={`inline-flex items-center self-center gap-0.5 h-[20px] px-1.5 rounded-full text-[10px] font-medium leading-none border ${isIn ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              title={dir}
            >
              <DirIcon size={10} />
              {isIn ? "In" : "Out"}
            </span>
          </div>
        );
      },
    },
    {
      key: "stage_no",
      label: "Stage",
      width: 150,
      render: (row) => (
        <span className="text-[10.5px] text-slate-600 truncate block" title={row.stage_name || ""}>
          {row.stage_no ? `Stage ${row.stage_no}` : "—"}{row.stage_name ? ` · ${row.stage_name}` : ""}
        </span>
      ),
    },
    {
      key: "disposition",
      label: "Disposition",
      width: 230,
      render: (row) => {
        const disp = row.disposition || "Logged";
        const style = DISPOSITION_STYLES[disp] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
        const detail = row.rejection_category || row.reason;
        return (
          <div className="flex items-center gap-1.5 h-full min-w-0">
            <span className={`inline-flex items-center self-center shrink-0 h-[20px] px-2.5 rounded-full text-[10px] font-bold leading-none border whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}>
              {disp}
            </span>
            {detail && (
              <span className="text-[10px] text-slate-500 truncate" title={detail}>
                {detail}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "recording_file_path",
      label: "Recording Audio",
      width: 210,
      render: (row) => {
        if (!row.recording_file_path) return <span className="text-[10.5px] text-slate-400 italic">No recording</span>;
        const audioUrl = row.recording_file_path.startsWith("http")
          ? row.recording_file_path
          : `${config.apiUrl}/${row.recording_file_path.replace(/^\/+/, "")}`;
        return (
          <span className="flex items-center gap-1.5">
            <audio controls className="h-6 w-36" src={audioUrl} preload="none">Your browser does not support audio.</audio>
            <a href={audioUrl} download target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-blue-600 rounded" title="Download Audio Recording">
              <Download size={12} />
            </a>
          </span>
        );
      },
    },
    {
      key: "created_at",
      label: "Logged On · By",
      width: 200,
      render: (row) => {
        const d = row.created_at;
        return (
          <span className="flex items-center gap-1 text-[10.5px] text-slate-600 whitespace-nowrap min-w-0">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-800 font-medium">{d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}</span>
            <span className="text-slate-400 truncate">· {row.recruiter_name || "HR"}</span>
          </span>
        );
      },
    },
    {
      key: "remarks",
      label: "Remarks",
      width: 260,
      render: (row) => (
        <span className="text-[11px] text-slate-600 truncate block" title={row.remarks || ""}>
          {row.remarks || <span className="italic text-slate-400">No notes</span>}
        </span>
      ),
    },
  ], []);

  const filterPanel = (
    <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-[#f8fafc] border-b border-[#dde1ea] text-[11px]">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        <div className="flex items-center gap-0.5 bg-white border border-[#dde1ea] p-0.5 rounded">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setSelectedChannel(ch)}
              className={`h-[24px] px-2.5 rounded text-[10.5px] font-bold transition-all ${selectedChannel === ch
                ? "bg-blue-100 text-blue-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, phone, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${formInputClass(false, false)} !pl-6 !w-[220px] !h-[26px] !text-[11px]`}
          />
        </div>

        {(selectedChannel !== "All" || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedChannel("All");
              setSearch("");
            }}
            className="text-[10.5px] text-blue-600 hover:underline px-1"
          >
            Clear
          </button>
        )}

        <button
          type="button"
          onClick={loadHistory}
          title="Refresh History"
          className="h-[26px] px-2 rounded font-medium text-[11px] text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1 shadow-2xs"
        >
          <RefreshCw size={11} className={loading ? "animate-spin text-blue-600" : ""} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );

  const hasActiveFilters = selectedChannel !== "All" || search.trim().length > 0;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Table
          title="COMMUNICATION AUDIT LOGS & AUDIO RECORDINGS"
          TitleIcon={History}
          columns={columns}
          data={visibleLogs}
          rowKey="comm_id"
          loading={loading}
          onRefresh={loadHistory}
          onDeleteMultiple={handleDeleteLogs}
          onToggleFilter={() => setShowFilters((v) => !v)}
          showForm={showFilters}
          formComponent={filterPanel}
          activeTab="search"
          isHidden
        />
      </div>

      {/* Footer Action Bar */}
      <div className="w-full border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl px-2 sm:px-4 py-2 mt-1 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Showing {visibleLogs.length} of {logs.length} audit logs
            </span>
            {selectedChannel !== "All" && (
              <span>(Filtered by: <strong>{selectedChannel}</strong>)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* <RefreshButton onClick={loadHistory} loading={loading} /> */}
            {hasActiveFilters && (
              <ResetButton
                onClick={() => {
                  setSelectedChannel("All");
                  setSearch("");
                }}
                label="Reset Filters"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
