import React from "react";
import UserMasterPage from "./Modules/Master/UserMaster/UserMasterCreation";
import DailyAttendance from "./Modules/Payroll/Attendance/DailyAttendence";
import HolidayMaster from "../components/HolidayMaster/HolidayMaster";
import ShiftMaster from "./Modules/Payroll/ShiftMaster/ShiftMaster";
import ShiftAllocation from "./Modules/Payroll/ShiftMaster/ShiftAllocationMaster";
import SalaryFormulaEngine from "./Modules/Payroll/SalaryMaster/SalaryTemplate/SalaryFormulaEngine";
const IncomeHeadMaster = React.lazy(() => import("./Modules/Payroll/SalaryMaster/IncomeMaster/IncomeHead"));
const FBPConfig = React.lazy(() => import("./Modules/Payroll/SalaryMaster/FlexiBenefitMaster/FBPConfig"));
const DeductionHeadMaster = React.lazy(() => import("./Modules/Payroll/SalaryMaster/DeductionMaster/DeductionHead"));
const Master = React.lazy(() => import("./Master"));
const TestingRequisition = React.lazy(() => import("./TestingRequisition"));
const EmployeeMaster = React.lazy(() => import("./EmployeeMaster"));
const SalaryTemplate=React.lazy(()=>import("./Modules/Payroll/SalaryMaster/SalaryTemplate/SalaryTemplate"))
const CompanyMasterPage = React.lazy(() =>
    import("./Modules/MainMenu/CompanyMaster/CompanyMasterPage")
);
const BusinessHealthSnapshot = React.lazy(() =>
    import("../pages/Modules/Dashboard/BusinessHealthSnapshot")
);
const MenuMasterPage = React.lazy(() => import("./MenuMasterPage"));
const AddUserMaster = React.lazy(() =>
    import("../pages/Modules/Master/UserMaster/AddUserMaster")
);
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
);
const OTEntry = React.lazy(() =>
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
const MonthlyAttendance=React.lazy(()=>import("./Modules/Payroll/Attendance/MothlyAttendance/MonthlyAttendanceReport"))
const OverTimeReport=React.lazy(()=>import("./Modules/Payroll/OverTime/OvertimeDetailsReport"))
const AttendanceRegister=React.lazy(()=>import("./Modules/Payroll/Attendance/Register/AttendanceRegister"))
const SalaryStructure=React.lazy(()=>import("./Modules/Payroll/SalaryMaster/SalaryStructure/SalaryStructure"))
const SalaryTransaction=React.lazy(()=>import("./Modules/Payroll/SalaryMaster/SalaryTransaction/SalaryTransactions"))


const PageRegistry = {
    Master,
    TestingRequisition,
    EmployeeMaster,
    CompanyMasterPage,
    MASMNU: MenuMasterPage,
    DASH_BHS: BusinessHealthSnapshot,
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
    LeaveType: LeaveTypes,
    IHM: IncomeHeadMaster,
    DHM: DeductionHeadMaster,
    leave_balance: LeaveBalance,
    LeaveRequest: LeaveRequestMaster,
    STM:SalaryTemplate,
    InvestmentDeclarationMaster:Investment,
    ApprovalFlow: Approvalworkflow,
    SFE: SalaryFormulaEngine,
    ApprovalTransaction: Approvaltransaction, 
    LeaveEncashment: LeaveEncashment, 
    LeaveAccrual: LeaveAccrual, 
    FlexiBenefitPlanConfig:FBPConfig, 
    LoanReimMaster:React.lazy(() => import("./Modules/Payroll/Loan/LoanReimMaster")),
    Asset_Master: Asset,
    Training_Skill: TrainingSkill,
    MonthlyAttendanceSummaryReport:MonthlyAttendance,
    OTR:OverTimeReport,
    OT_transaction:OTTransaction,
    ARP:AttendanceRegister,
    SSE:SalaryStructure,
    Salary_Trans:SalaryTransaction,


pf_master: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/PfMaster")),
ESIMaster: React.lazy(() => import("./Modules/Payroll/StatutoryMaster/ESIMaster")),
PTMaster : React.lazy(() => import("./Modules/Payroll/StatutoryMaster/PTMaster")),
TDSMaster : React.lazy(() => import("./Modules/Payroll/StatutoryMaster/TDSMaster")),
LWFMaster : React.lazy(() => import("./Modules/Payroll/StatutoryMaster/LWFMaster")),
POA: React.lazy(() => import("./Modules/Approval/PurchaseOrder/POApproval")),

};

export default PageRegistry;