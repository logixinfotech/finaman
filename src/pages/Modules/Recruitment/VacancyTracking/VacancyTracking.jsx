import React, { useState } from "react";
import VacancyList from "./VacancyList";
import VacancyDetail from "./VacancyDetail";

// Recruitment › Vacancy Tracking (appl_name = VacancyTracking)
// Read-only view over Job Vacancy + Candidate Pipeline. List → click a vacancy → Detail opens in the same tab.
export default function VacancyTracking({ onOpenPage }) {
  const [view, setView] = useState({ mode: "list", vacancyId: null });
  const [refreshKey, setRefreshKey] = useState(0);

  const backToList = () => {
    setView({ mode: "list", vacancyId: null });
    setRefreshKey((k) => k + 1);
  };

  if (view.mode === "detail") {
    return <VacancyDetail vacancyId={view.vacancyId} onBack={backToList} onOpenPage={onOpenPage} />;
  }

  return (
    <div className="bg-slate-50 h-full w-full min-w-0">
      <VacancyList refreshKey={refreshKey} onOpen={(row) => setView({ mode: "detail", vacancyId: row.vacancy_id })} />
    </div>
  );
}
