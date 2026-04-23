import React from "react";
import UserMasterPage from "./Modules/Master/UserMaster/UserMasterCreation";
import DailyAttendance from "./Modules/Payroll/Attendance/DailyAttendence";
import HolidayMaster from "../components/HolidayMaster/HolidayMaster";
import ShiftMaster from "./Modules/Payroll/ShiftMaster/ShiftMaster";

const Master = React.lazy(() => import("./Master"));
const TestingRequisition = React.lazy(() => import("./TestingRequisition"));
const EmployeeMaster = React.lazy(() => import("./EmployeeMaster"));
const CompanyMasterPage = React.lazy(() =>
    import("./Modules/MainMenu/CompanyMaster/CompanyMasterPage")
);
const BusinessHealthSnapshot = React.lazy(() =>
    import("../components/Dashboard/BusinessHealthSnapshot")
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
    GradeMaster: GradeMasterPage,
    RME: ReportMasterPageing, 
    DepartmentMaster: ReportMasterPage,
    HOLIDA: HolidayMaster, 
    ShiftMaster,
    OTentry: OTEntry
  
     
};

export default PageRegistry;