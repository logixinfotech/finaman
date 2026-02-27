import Master from "./Master";
import TestingRequisition from "./TestingRequisition";
import EmployeeMaster from "./EmployeeMaster";
import CompanyMasterPage from "./CompanyMaster/CompanyMasterPage";
import BusinessHealthSnapshot from "../components/Dashboard/BusinessHealthSnapshot";
import MenuMasterPage from "./MenuMasterPage";
import AddUserMaster from "../components/UserMaster/AddUserMaster";
import NotificationsPage from "./NotificationsPage";
import ProfilePage from "./Login/Profile";
import UserGroupMasterPage from "./UserGroupMasterPage";
import UserAuthenticationPage from "./UserAuthenticationPage";

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
