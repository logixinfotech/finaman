import AttendanceHeatmap from "./DashboardComponnt/AttendanceHeatmap";
import LeaveAnalytics from "./DashboardComponnt/LeaveAnalytics";
import ApprovalWorkflow from "./DashboardComponnt/ApprovalWorkflow";
import WorkDiarySummary from "./DashboardComponnt/WorkDiarySummary";
import PayrollOverview from "./DashboardComponnt/PayrollOverview";
import UpcomingEvents from "./DashboardComponnt/UpcomingEvents";
import QmsSummaryWidget from "./QmsSummaryWidget";
import SalesSummaryWidget from "./SalesSummaryWidget";
export const WIDGET_REGISTRY = [

  { id: "Maindashboard",      label: "QMS — My Work",          module: "QMS",  span: 1, Component: QmsSummaryWidget },
  { id: "sales-summary",   label: "Sales — Today",          module: "Sales",span: 1, Component: SalesSummaryWidget },
  { id: "hrms-attendance", label: "Attendance Heatmap",     module: "HRMS", span: 1, Component: AttendanceHeatmap },
  { id: "hrms-leave",      label: "Leave Analytics",        module: "HRMS", span: 1, Component: LeaveAnalytics, props:{isHalf:true}},
  { id: "hrms-approval",   label: "Approval Workflow",      module: "HRMS", span: 1, Component: ApprovalWorkflow },
  { id: "hrms-workdiary",  label: "Work Diary Summary",     module: "HRMS", span: 1, Component: WorkDiarySummary },
  { id: "hrms-payroll",    label: "Payroll Overview",       module: "HRMS", span: 2, Component: PayrollOverview },
  { id: "hrms-events",     label: "Upcoming Events",        module: "HRMS", span: 1, Component: UpcomingEvents ,props:{isHalf:true}},

];

export const DEFAULT_LAYOUT = WIDGET_REGISTRY.map((w) => ({
  id: w.id,
  visible: true,
  span: w.span,
}));