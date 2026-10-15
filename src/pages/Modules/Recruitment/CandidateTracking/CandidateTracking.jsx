import React, { useMemo, useState } from "react";
import { getRights } from "../../../../utils/permissions";
import PipelineList from "./PipelineList";
import PipelineDetail from "./PipelineDetail";
import AddToPipelineModal from "./AddToPipelineModal";
import { alertError } from "../../../../components/Reusable/alert";

// Recruitment › Candidate Tracking (appl_name = CandidateTracking)
// List → click a candidate → Detail opens inside the same tab (breadcrumb + Search tab go back).
export default function CandidateTracking({ tab }) {
  const rights = useMemo(() => getRights(tab?.appl_name || "CandidateTracking"), [tab?.appl_name]);
  const [view, setView] = useState({ mode: "list", pipelineId: null, intent: "view" });
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const backToList = () => {
    setView({ mode: "list", pipelineId: null, intent: "view" });
    setRefreshKey((k) => k + 1);
  };

  if (view.mode === "detail") {
    return (
      <div className="h-full w-full min-w-0 min-h-0 overflow-hidden">
        <PipelineDetail pipelineId={view.pipelineId} intent={view.intent} onBack={backToList} rights={rights} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 h-full w-full min-w-0 min-h-0 overflow-hidden">
      <PipelineList
        refreshKey={refreshKey}
        onOpen={(row, intent = "view") => setView({ mode: "detail", pipelineId: row.pipeline_id, intent })}
        onAdd={() => {
          if (rights?.add !== 1) { alertError("Access Denied", "You do not have permission to ADD in Candidate Tracking"); return; }
          setShowAdd(true);
        }}
      />
      <AddToPipelineModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { setShowAdd(false); setRefreshKey((k) => k + 1); }}
      />
    </div>
  );
}