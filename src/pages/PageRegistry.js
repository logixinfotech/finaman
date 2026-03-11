import React from "react";

const Master = React.lazy(() => import("./Master"));
const TestingRequisition = React.lazy(() => import("./TestingRequisition"));
const EmployeeMaster = React.lazy(() => import("./EmployeeMaster"));
const CompanyMasterPage = React.lazy(() =>
    import("./CompanyMaster/CompanyMasterPage")
);
const BusinessHealthSnapshot = React.lazy(() =>
    import("../components/Dashboard/BusinessHealthSnapshot")
);
const MenuMasterPage = React.lazy(() => import("./MenuMasterPage"));
const AddUserMaster = React.lazy(() =>
    import("../components/UserMaster/AddUserMaster")
);
const NotificationsPage = React.lazy(() =>
    import("./NotificationsPage")
);
const ProfilePage = React.lazy(() =>
    import("./Login/Profile")
);
const UserGroupMasterPage = React.lazy(() =>
    import("./UserGroupMasterPage")
);
const UserAuthenticationPage = React.lazy(() =>
    import("./UserAuthenticationPage")
);

const PageRegistry = {
    Master,
    TestingRequisition,
    EmployeeMaster,
    CompanyMasterPage,
    MASMNU: MenuMasterPage,
    DASH_BHS: BusinessHealthSnapshot,
    USERMA: AddUserMaster,
    NOTIFICATIONS_PAGE: NotificationsPage,
    PROFILE: ProfilePage,
    USERGROUP: UserGroupMasterPage,
    MASUSR: UserAuthenticationPage,
};

export default PageRegistry;