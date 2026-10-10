import React from "react";
import DocumentMasterPage from "./Modules/QMS/Document.jsx";
import TrainingMasterPage from "./Modules/QMS/Trainning.jsx";
import STPMasterPage from "./Modules/QMS/STP.jsx";
import AuditMasterPage from "./Modules/QMS/AuditManage.jsx";
import ModuleMaster from "../components/ModuleVisibility/ModuleMaster.jsx";
import MyWork from "./Modules/QMS/Components/MainDashboard.jsx";
const UserMasterPage = React.lazy(() => import("./Modules/Master/UserMaster/UserMasterCreation.jsx"))
const DailyAttendance = React.lazy(() => import("./Modules/Payroll/Attendance/DailyAttendence"))
const HolidayMaster = React.lazy(() => import("../components/HolidayMaster/HolidayMaster"))
const ShiftMaster = React.lazy(() => import("./Modules/Payroll/ShiftMaster/ShiftMaster.jsx"))
const ShiftAllocation = React.lazy(() => import("./Modules/Payroll/ShiftMaster/ShiftAllocationMaster"))
const SalaryFormulaEngine = React.lazy(() => import("./Modules/Payroll/SalaryMaster/SalaryTemplate/SalaryFormulaEngine.jsx"))
const ProductMasterPage = React.lazy(() => import("./Modules/QMS/Master/QMSShortMasterEntry.jsx"))
const InstrumentMasterPage = React.lazy(() => import("./Modules/QMS/Master/QMSShortMasterEntry.jsx"))
const EquipmentMasterPage = React.lazy(() => import("./Modules/QMS/Master/QMSShortMasterEntry.jsx"))
const AreaLocationMasterPage = React.lazy(() => import("./Modules/QMS/Master/QMSShortMasterEntry.jsx"))
const PersonnelMasterPage = React.lazy(() => import("./Modules/QMS/Master/QMSShortMasterEntry.jsx"))
const SupplierVendorMasterPage = React.lazy(() => import("./Modules/QMS/Master/QMSShortMasterEntry.jsx"))
const ProductRecallMasterPage = React.lazy(() => import("./Modules/QMS/ProductRecall.jsx"))
const IncidentMasterPage = React.lazy(() => import("./Modules/QMS/Incidents.jsx"))
const IncomeHeadMaster = React.lazy(() => import("./Modules/Payroll/SalaryMaster/IncomeMaster/IncomeHead"));
const FBPConfig = React.lazy(() => import("./Modules/Payroll/SalaryMaster/FlexiBenefitMaster/FBPConfig"));
const DeductionHeadMaster = React.lazy(() => import("./Modules/Payroll/SalaryMaster/DeductionMaster/DeductionHead"));
const ContributionHeadMaster = React.lazy(() => import("./Modules/Payroll/SalaryMaster/ContributionMaster/ContributionHead"));
const Master = React.lazy(() => import("./Master"));
const TestingRequisition = React.lazy(() => import("./TestingRequisition"));
const EmployeeMaster = React.lazy(() => import("./EmployeeMaster"));
const SalaryTemplate = React.lazy(() => import("./Modules/Payroll/SalaryMaster/SalaryTemplate/SalaryTemplate"))
const SalaryCalculator = React.lazy(() => import("./Modules/Payroll/SalaryMaster/SalaryProcess/SalaryCalculator.jsx"))
const CompanyMasterPage = React.lazy(() =>
    import("./Modules/MainMenu/CompanyMaster/CompanyMasterPage")
); const MenuMasterPage = React.lazy(() => import("./MenuMasterPage"));

const NotificationsPage = React.lazy(() =>
    import("./NotificationsPage")
);
const ProfilePage = React.lazy(() =>
    import("./Login/Profile")
);
const UserGroupMasterPage = React.lazy(() =>
    import("./Modules/Master/UserMaster/UserGroupMasterPage")
);
const UserAuthenticationPage = React.lazy(() =>
    import("./Modules/Master/UserMaster/UserAuthenticationPage")
);
const DesignationPage = React.lazy(() =>
    import("./Modules/Master/ShortMaster/DesignationPage")
);
const DivisionMasterPage = React.lazy(() =>
    import("./Modules/Master/ShortMaster/DivisionMasterPage")
);
const Document = React.lazy(() =>
    import("./Modules/Master/ShortMaster/DocumentMasterPage")
);
const GradeMasterPage = React.lazy(() =>
    import("./Modules/Master/ShortMaster/GradeMasterPage")
);
const ReportMasterPageing = React.lazy(() =>
    import("./Modules/Master/ShortMaster/ReportingMasterPage")
);
const ReportMasterPage = React.lazy(() =>
    import("./Modules/Master/ShortMaster/DepartmentMasterPage")
); const OTEntry = React.lazy(() =>
    import("./Modules/Payroll/OverTime/OTEntry")
);
const WeeklyOffPage = React.lazy(() =>
    import("./Modules/Payroll/WeekOff/WeeklyOffMaster")
);
const AttendanceRegularization = React.lazy(() =>
    import("./Modules/Payroll/Attendance/AttendanceRegularization")
);
const LeaveTypes = React.lazy(() =>
    import("./Modules/Payroll/Leave/LeaveTypes")
);
const LeaveBalance = React.lazy(() =>
    import("./Modules/Payroll/Leave/LeaveBalance")
);
const LeaveRequestMaster = React.lazy(() =>
    import("./Modules/Payroll/Leave/LeaveRequestMaster")
);
const Approvalworkflow = React.lazy(() =>
    import("./Modules/Payroll/Approve/Approvalworkflow")
)
const Approvaltransaction = React.lazy(() =>
    import("./Modules/Payroll/Approve/ApprovalTransaction")
);
const LeaveEncashment = React.lazy(() =>
    import("./Modules/Payroll/Leave/LeaveEncashment")
);
const LeaveAccrual = React.lazy(() =>
    import("./Modules/Payroll/Leave/LeaveAccrual")
);
const LeavePolicyMaster = React.lazy(() =>
    import("./Modules/Payroll/Leave/Policy/LeavePolicyMaster")
);
const Asset = React.lazy(() =>
    import("./Modules/Payroll/Loan/AssetMaster")
);
const Investment = React.lazy(() =>
    import("./Modules/Payroll/SalaryMaster/InvestmentMaster/InvestmentDeclaration")
);
const TrainingSkill = React.lazy(() =>
    import("./Modules/Payroll/Loan/TrainingSkillMaster")
);
const OTTransaction = React.lazy(() =>
    import("./Modules/Payroll/OverTime/OtTransaction")
);
const MonthlyAttendance = React.lazy(() => import("./Modules/Payroll/Attendance/MothlyAttendance/MonthlyAttendanceReport"))
const OverTimeReport = React.lazy(() => import("./Modules/Payroll/OverTime/OvertimeDetailsReport"))
const AttendanceRegister = React.lazy(() => import("./Modules/Payroll/Attendance/Register/AttendanceRegister"))
const SalaryStructure = React.lazy(() => import("./Modules/Payroll/SalaryMaster/SalaryStructure/SalaryStructure"))
const SalaryTransaction = React.lazy(() => import("./Modules/Payroll/SalaryMaster/SalaryTransaction/SalaryTransactions"))
const SalaryProcessing = React.lazy(() => import("./Modules/Payroll/SalaryMaster/SalaryProcess/SalaryProcess"))
const LeaveAnalytics = React.lazy(() => import("../components/Layout/DashboardComponnt/LeaveAnalytics.jsx"))
const UpcomingEvents = React.lazy(() => import("../components/Layout/DashboardComponnt/UpcomingEvents.jsx"))


const PageRegistry = {
    Master,
    TestingRequisition,
    EmployeeMaster,
    CompanyMasterPage,
    MASMNU: MenuMasterPage,
    global_setting: React.lazy(() => import("../components/Layout/Settings/SettingsPage.jsx")),
    USERMA: UserMasterPage,
    NOTIFICATIONS_PAGE: NotificationsPage,
    PROFILE: ProfilePage,
    USRGRP: UserGroupMasterPage,
    MASUSR: UserAuthenticationPage,
    ATNDAY: DailyAttendance,
    DesignationMaster: DesignationPage,
    DIV: DivisionMasterPage,
    DOC: Document,
    GradeMaster: GradeMasterPage,
    RME: ReportMasterPageing,
    DepartmentMaster: ReportMasterPage,
    HOLIDA: HolidayMaster,
    ShiftMaster,
    OTentry: OTEntry,
    shiftAllocationMaster: ShiftAllocation,
    WeekOff: WeeklyOffPage,
    AttendRegular: AttendanceRegularization,
    attendance_rules: React.lazy(() => import("./Modules/Payroll/Attendance/AttendanceRules/AttendanceRules")),
    AttendanceRule: React.lazy(() => import("./Modules/Payroll/Attendance/AttendanceRules/AttendanceRules")),
    AttendanceRules: React.lazy(() => import("./Modules/Payroll/Attendance/AttendanceRules/AttendanceRules")),
    AttendanceRuleMaster: React.lazy(() => import("./Modules/Payroll/Attendance/AttendanceRules/AttendanceRules")),
    LeaveType: LeaveTypes,
    IHM: IncomeHeadMaster,
    DHM: DeductionHeadMaster,
    "contribution_master": ContributionHeadMaster,
    leave_balance: LeaveBalance,
    LeaveRequest: LeaveRequestMaster,
    STM: SalaryTemplate,
    InvestmentDeclarationMaster: Investment,
    ApprovalFlow: Approvalworkflow,
    SFE: SalaryFormulaEngine,
    ApprovalTransaction: Approvaltransaction,
    LeaveEncashment: LeaveEncashment,
    LeaveAccrual: LeaveAccrual,
    LeavePolicyMaster: LeavePolicyMaster,
    LeavePolicy: LeavePolicyMaster,
    leave_policy: LeavePolicyMaster,
    FlexiBenefitPlanConfig: FBPConfig,
    LoanReimMaster: React.lazy(() => import("./Modules/Payroll/Loan/LoanReimMaster")),
    Asset_Master: Asset,
    Training_Skill: TrainingSkill,
    MonthlyAttendanceSummaryReport: MonthlyAttendance,
    OTR: OverTimeReport,
    OT_transaction: OTTransaction,
    ARP: AttendanceRegister,
    SSE: SalaryStructure,
    Salary_Trans: SalaryTransaction,
    salary_processing: SalaryProcessing,
    SalaryCalculator: SalaryCalculator,
    salary_calculator: SalaryCalculator,
    LeaveAnalytics: LeaveAnalytics,
    UpcomingEvents: UpcomingEvents,
    products: ProductMasterPage,
    instrument: InstrumentMasterPage,
    equipment: EquipmentMasterPage,
    area: AreaLocationMasterPage,
    personnel: PersonnelMasterPage,
    vendor: SupplierVendorMasterPage,
    ProductRecall: ProductRecallMasterPage,
    Incidents: IncidentMasterPage,
    dms: DocumentMasterPage,
    trainning: TrainingMasterPage,
    STP: STPMasterPage,
    Audit: AuditMasterPage,
    WorkDiaryForm: React.lazy(() => import("../components/WorkDiary/WorkDiary")),
    pf_master: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/PfMaster")),
    ESIMaster: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/ESIMaster")),
    PTMaster: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/PTMaster")),
    TDSMaster: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/TDSMaster")),
    LWFMaster: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/LWFMaster")),
    POA: React.lazy(() => import("./Modules/Approval/PurchaseOrder/POApproval")),
    SalesDashboard: React.lazy(() => import("./Modules/Dashboard/SalesDashboard/SalesDashboard")),
    MU_GRP: React.lazy(() => import("./Modules/MainMenu/MenuMasterPage/MenuGroupMaster.jsx")),

    deviation: React.lazy(() => import("./Modules/QMS/Deviation.jsx")),
    AuditTrail: React.lazy(() => import("./Modules/QMS/Utils/AuditTrailPage.jsx")),
    Calibration: React.lazy(() => import("./Modules/QMS/InstrumentCalibration.jsx")),
    environment: React.lazy(() => import("./Modules/QMS/Environmnetal.jsx")),
    Qualification: React.lazy(() => import("./Modules/QMS/QualificationPlanner.jsx")),
    PreventiveMain: React.lazy(() => import("./Modules/QMS/PreventiveMaintenance.jsx")),
    CAPA: React.lazy(() => import("./Modules/QMS/CAPA.jsx")),
    ChangeControl: React.lazy(() => import("./Modules/QMS/ChangeControl.jsx")),
    marketcomplaint: React.lazy(() => import("./Modules/QMS/MarketComplaint.jsx")),
    RiskAssessment: React.lazy(() => import("./Modules/QMS/RiskAssessment.jsx")),
    TrendingGraphs: React.lazy(() => import("./Modules/QMS/TrendingGraphs.jsx")),
    KPIDashboard: React.lazy(() => import("./Modules/QMS/Kpidashboard.jsx")),
    ComplianceScore: React.lazy(() => import("./Modules/QMS/ComplianceScore.jsx")),
    changeproposal: React.lazy(() => import("./Modules/QMS/ChangeProposal.jsx")),
    OOS: React.lazy(() => import("./Modules/QMS/OOS.jsx")),
    OOT: React.lazy(() => import("./Modules/QMS/OOT.jsx")),
    Logbook: React.lazy(() => import("./Modules/QMS/LogbookPage.jsx")),
    RECENT_PAGE: React.lazy(() => import("../pages/RecentPage.jsx")),
    FIN_CUSORD: React.lazy(() => import("./Modules/Dashboard/SalesDashboard/CustomerSalesPage.jsx")),
    FIN_OPD: React.lazy(() => import("./Modules/Dashboard/SalesDashboard/OrderPatternPage.jsx")),
    FIN_FBC: React.lazy(() => import("./Modules/Dashboard/SalesDashboard/FulfillmentPage.jsx")),
    AgentPerform: React.lazy(() => import("./Modules/Dashboard/SalesDashboard/AgentPerformance.jsx")),
    Maindashboard: MyWork,


    // ── Recruitment Module ──
    JobVacancyEntry: React.lazy(() => import("./Modules/Recruitment/JobVacancy/JobVacancyPage.jsx")),
    JobVacancyApproval: React.lazy(() => import("./Modules/Recruitment/JobVacancy/Approval/JobVacancyApproval.jsx")),
    SkillMaster: React.lazy(() => import("./Modules/Recruitment/SkillMaster/SkillMasterPage.jsx")),
    JobDescriptionMaster: React.lazy(() => import("./Modules/Recruitment/JDMaster/JDMasterPage.jsx")),
    JDMaster: React.lazy(() => import("./Modules/Recruitment/JDMaster/JDMasterPage.jsx")),
    RecruitmentPrefixSetting: React.lazy(() => import("./Modules/Recruitment/PrefixSetting/RecruitmentPrefixSetting.jsx")),
    CandidateRegistration: React.lazy(() => import("./Modules/Recruitment/Candidate/CandidateRegistration.jsx")),
    CandidateTracking: React.lazy(() => import("./Modules/Recruitment/CandidateTracking/CandidateTracking.jsx")),
    VacancyTracking: React.lazy(() => import("./Modules/Recruitment/VacancyTracking/VacancyTracking.jsx")),
    AssessmentMaster: React.lazy(() => import("./Modules/Recruitment/AssessmentMaster/AssessmentMasterPage.jsx")),
    Communication: React.lazy(() => import("./Modules/Recruitment/Communication/CommunicationPage.jsx")),
    CallingManagement: React.lazy(() => import("./Modules/Recruitment/Communication/CommunicationPage.jsx")),
    CallReceive: React.lazy(() => import("./Modules/Recruitment/Communication/CommunicationPage.jsx")),
    ScheduledCallbacks: React.lazy(() => import("./Modules/Recruitment/Communication/CommunicationPage.jsx")),
    WhatsAppDesk: React.lazy(() => import("./Modules/Recruitment/Communication/CommunicationPage.jsx")),
    CommunicationTemplates: React.lazy(() => import("./Modules/Recruitment/Communication/CommunicationPage.jsx")),
    InterviewScheduling: React.lazy(() => import("./Modules/Recruitment/InterviewScheduling/InterviewSchedulingPage.jsx")),
    generalassessment: React.lazy(() => import("./Modules/Recruitment/GeneralAssessment/GeneralAssessmentPage.jsx")),
    general_assessment: React.lazy(() => import("./Modules/Recruitment/GeneralAssessment/GeneralAssessmentPage.jsx")),
    ModuleMaster: ModuleMaster
};

export default PageRegistry; 