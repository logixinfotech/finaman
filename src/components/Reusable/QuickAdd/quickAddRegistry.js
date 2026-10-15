import { lazy } from "react";

// path apne folder ke hisaab se theek karo
const DesignationMasterPage = lazy(() => import("../../../pages/Modules/Master/ShortMaster/DesignationPage"));

export const QUICK_ADD_REGISTRY = {
  designation: {
    title: "New Designation",
    subtitle: "Saved in Designation Master and selected automatically",
    applName: "DesignationMaster",
    size: "md",
    Component: DesignationMasterPage,
  },
  // department: { title: "New Department", applName: "...", Component: DepartmentMasterPage },
};