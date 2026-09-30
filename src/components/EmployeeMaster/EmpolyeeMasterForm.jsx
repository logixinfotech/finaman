import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import ERPHeader from "../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../components/Reusable/input/Date";
import ERPAutocomplete from "../../components/Reusable/input/ERPAutocomplete";
import LeaveTypeSelector from "./LeaveTypeSelector";
import {
  fetchCountries,
  fetchStates,
  fetchUserGroupsByType,
  uploadEmployeePhoto,
} from "../../utils/api";
import {
  validateEmployeeForm,
  validateSingleField,
} from "./EmployeeFromValidation";
import DocumentTable from "./DocumentTable";


import {
  FaUser,
  FaBuilding,
  FaFileAlt,
  FaCloudUploadAlt,
  FaCalendarAlt,
  FaUserTie,
  FaPhoneAlt,
  FaIdCard,
  FaRegUser,
  FaGraduationCap,
  FaUsers,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaHome,
  FaShieldAlt,
  FaMoneyBillWave,
  FaCube,
  FaCreditCard,
} from "react-icons/fa";
import { useGroupOptions } from "../../Hooks/useUserGroupOption";
import config from "../../config";
export const tabs = [
  "personal_and_contact",
  "organization",
  "bank_and_payroll",
  "documents",
];
const getGridConfig = (title) => {
  const configs = {
    "Personal Information": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-5",
    "Employment Details": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4",
    "Contact Details": "grid-cols-2 md:grid-cols-3 2xl:grid-cols-4",
    "KYC Details": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-3",
    "Joining & Tenure": "grid-cols-2 md:grid-cols-3 2xl:grid-cols-4",
    "Previous Employment": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4",
    "Bank Details": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4",
    "Statutory Details": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4",
    "Salary Details": "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4",
    "Emergency Contact": "grid-cols-2 sm:grid-cols-4 2xl:grid-cols-4",
    Address: "grid-cols-2 sm:grid-cols-2 2xl:grid-cols-5",
  };
  return configs[title] || "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
};
const TabIcon = memo(({ tab }) => {
  const baseClass = "text-[15px]";
  if (tab === "personal_and_contact")
    return <FaRegUser className={baseClass} />;
  if (tab === "organization") return <FaBuilding className={baseClass} />;
  if (tab === "bank_and_payroll") return <FaCreditCard className={baseClass} />;
  if (tab === "documents") return <FaFileAlt className={baseClass} />;
  return <FaFileAlt className={baseClass} />;
});
const getInitials = (name) => {
  if (!name || name === "New Employee") return "NA";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};
const getHeaderStyle = (title) => {
  const t = title.toLowerCase();
  if (t.includes("personal"))
    return {
      icon: <FaUser />,
      barBg: "bg-[#e8f0fe]",
      iconBg: "bg-[#1a56db]/15 text-[#1a56db]",
      text: "text-[#0f2137]",
      border: "border-[#c2d1f7]",
    };
  if (t.includes("contact") && !t.includes("emergency"))
    return {
      icon: <FaPhoneAlt />,
      barBg: "bg-[#e6f7f4]",
      iconBg: "bg-[#0d9488]/15 text-[#0d9488]",
      text: "text-[#0f2137]",
      border: "border-[#b2e3da]",
    };
  if (t.includes("kyc"))
    return {
      icon: <FaIdCard />,
      barBg: "bg-[#f3e8ff]",
      iconBg: "bg-[#7c3aed]/15 text-[#7c3aed]",
      text: "text-[#0f2137]",
      border: "border-[#d4b8f5]",
    };
  if (t.includes("emergency"))
    return {
      icon: <FaExclamationCircle />,
      barBg: "bg-[#fee2e2]",
      iconBg: "bg-[#dc2626]/15 text-[#dc2626]",
      text: "text-[#0f2137]",
      border: "border-[#fca5a5]",
    };
  if (t.includes("education"))
    return {
      icon: <FaGraduationCap />,
      barBg: "bg-[#eef2ff]",
      iconBg: "bg-[#6366f1]/15 text-[#6366f1]",
      text: "text-[#0f2137]",
      border: "border-[#c7d2fe]",
    };
  if (t.includes("family"))
    return {
      icon: <FaUsers />,
      barBg: "bg-[#fdf2f8]",
      iconBg: "bg-[#ec4899]/15 text-[#ec4899]",
      text: "text-[#0f2137]",
      border: "border-[#fbcfe8]",
    };
  if (t.includes("correspondence") || t.includes("address"))
    return {
      icon: <FaMapMarkerAlt />,
      barBg: "bg-[#fff7ed]",
      iconBg: "bg-[#f97316]/15 text-[#f97316]",
      text: "text-[#0f2137]",
      border: "border-[#ffedd5]",
    };
  if (t.includes("permanent"))
    return {
      icon: <FaHome />,
      barBg: "bg-[#fefce8]",
      iconBg: "bg-[#eab308]/20 text-[#d97706]",
      text: "text-[#0f2137]",
      border: "border-[#fef08a]",
    };
  if (t.includes("bank"))
    return {
      icon: <FaCreditCard />,
      barBg: "bg-[#e0f2fe]",
      iconBg: "bg-[#0284c7]/15 text-[#0284c7]",
      text: "text-[#0f2137]",
      border: "border-[#7dd3fc]",
    };
  if (t.includes("employment"))
    return {
      icon: <FaBuilding />,
      barBg: "bg-[#eff6ff]",
      iconBg: "bg-[#2563eb]/15 text-[#2563eb]",
      text: "text-[#0f2137]",
      border: "border-[#bfdbfe]",
    };
  if (t.includes("joining") || t.includes("tenure"))
    return {
      icon: <FaCalendarAlt />,
      barBg: "bg-[#f0fdf4]",
      iconBg: "bg-[#22c55e]/20 text-[#16a34a]",
      text: "text-[#0f2137]",
      border: "border-[#bbf7d0]",
    };
  if (t.includes("statutory") || t.includes("pf"))
    return {
      icon: <FaShieldAlt />,
      barBg: "bg-[#faf5ff]",
      iconBg: "bg-[#a855f7]/15 text-[#9333ea]",
      text: "text-[#0f2137]",
      border: "border-[#e9d5ff]",
    };
  if (t.includes("salary"))
    return {
      icon: <FaMoneyBillWave />,
      barBg: "bg-[#ecfdf5]",
      iconBg: "bg-[#10b981]/15 text-[#059669]",
      text: "text-[#0f2137]",
      border: "border-[#a7f3d0]",
    };
  if (t.includes("previous employment"))
    return {
      icon: <FaCube />,
      barBg: "bg-[#fff1f2]",
      iconBg: "bg-[#f43f5e]/15 text-[#e11d48]",
      text: "text-[#0f2137]",
      border: "border-[#fecdd3]",
    };
  return {
    icon: <FaFileAlt />,
    barBg: "bg-[#eef1f7]",
    iconBg: "bg-[#64748b]/15 text-[#475569]",
    text: "text-[#0f2137]",
    border: "border-[#dde1ea]",
  };
};
const EmployeeMasterForm = forwardRef(
  (
    {
      formData = {},
      setFormData,
      onSave,
      onCancel,
      onPrevRecord,
      onNextRecord,
      onTabChange,
      saving,
      onDelete,
      mode,
      onModify,
      onNewEntry,
      currentRecord,
      totalRecords,
      onPrint,
      onEditCancel,
      rights,
    },
    ref,
  ) => {
    const isAddMode = mode === "add";
    const isViewMode = mode === "view";
    const isEditMode = mode === "edit";
    const [activeTab, setActiveTab] = useState("personal_and_contact");
    const [errors, setErrors] = useState({});
    const [attachments, setAttachments] = useState({});
    const [groupOptions, setGroupOptions] = useState({
      division: [],
      department: [],
      designation: [],
      grade: [],
      reporting: [],
    });
    const [docList, setDocList] = useState([]);
    const [countryNames, setCountryNames] = useState([]);
    const [stateNames, setStateNames] = useState([]);
    useImperativeHandle(ref, () => ({
      hasPendingPhoto: () => !!pendingPhotoRef.current?.forNewEmployee,
      uploadPendingPhoto: async (employeeId) => {
        if (!pendingPhotoRef.current?.forNewEmployee) return null;
        const { file } = pendingPhotoRef.current;
        pendingPhotoRef.current = null;
        try {
          const fd = new FormData();
          fd.append("photo", file);
          const res = await uploadEmployeePhoto(employeeId, fd);
          if (res?.success) {
            const serverUrl = `${config.apiUrl}${res.photo_url}?t=${Date.now()}`;
            setFormData((prev) => ({ ...prev, photo_url: serverUrl }));
            return serverUrl;
          }
        } catch (err) {
          console.error("Pending photo upload failed:", err);
        }
        return null;
      },
    }));
    const [emailSuggestField, setEmailSuggestField] = useState(null);
    useEffect(() => {
      const loadDocs = async () => {
        try {
          const res = await fetchUserGroupsByType("DOC");
          setDocList(res?.data || []);
        } catch (e) { }
      };
      loadDocs();
    }, []);
    const formDataRef = useRef(formData);
    useEffect(() => {
      formDataRef.current = formData;
    }, [formData]);
    const photoInputRef = useRef(null);
    const pendingPhotoRef = useRef(null);
    const prevModeRef = useRef(mode);
    useEffect(() => {
      const loadGroups = async () => {
        try {
          const div = await fetchUserGroupsByType("DIV");
          const dept = await fetchUserGroupsByType("DEP");
          const desg = await fetchUserGroupsByType("DESG");
          const grade = await fetchUserGroupsByType("GRADE");
          const reporting = await fetchUserGroupsByType("RME");
          setGroupOptions({
            division: div.data || [],
            department: dept.data || [],
            designation: desg.data || [],
            grade: grade.data || [],
            reporting: reporting.data || [],
          });
        } catch (err) { }
      };
      loadGroups();
    }, []);
    const { options: op } = useGroupOptions();

    const getDisplayValue = useCallback(
      (field, value) => {
        if (value === null || value === undefined) return "";
        const isGroupField = [
          "Division",
          "Department",
          "Designation",
          "Grade / Level",
          "Reporting Manager",
          "PT state",
        ].includes(field);
        if (isGroupField) {
          const groupMap = {
            Division: groupOptions.division,
            Department: groupOptions.department,
            Designation: groupOptions.designation,
            "Grade / Level": groupOptions.grade,
            "Reporting Manager": groupOptions.reporting,
            "PT State": op.pt,
          };
          const list = groupMap[field] || [];
          const foundById = list.find(
            (g) => String(g.group_id) === String(value),
          );
          if (foundById) return foundById.group_name;
          const foundByName = list.find(
            (g) => g.group_name?.toLowerCase() === String(value).toLowerCase(),
          );
          if (foundByName) return foundByName.group_name;
        }
        return String(value);
      },
      [groupOptions],// eslint-disable-line react-hooks/exhaustive-deps
    );

    const isPersonalComplete = Boolean(
      formData["First Name"] && formData["Date of Birth"],
    );
    const isContactComplete = Boolean(
      formData["Mobile No"] && formData["Personal Email"],
    );
    const isKYCComplete = Boolean(
      formData["PAN Number"] || formData["Aadhaar No"],
    );
    const isOrgComplete = Boolean(
      formData["Department"] || formData["Designation"],
    );
    const isBankComplete = Boolean(
      formData["Account Number"] || formData["IFSC Code"],
    );
    const isAddressComplete = Boolean(
      formData["C_Address Line 1"] && formData["C_City"],
    );
    const completedSections = [
      isPersonalComplete,
      isContactComplete,
      isKYCComplete,
      isOrgComplete,
      isBankComplete,
      isAddressComplete,
    ].filter(Boolean).length;
    const completionPercentage = Math.round((completedSections / 6) * 100) || 0;
    // Add this at the very top level of your component function
    const [activeSuggestIndex, setActiveSuggestIndex] = useState(0);
    const isTabComplete = (tabName) => {
      if (tabName === "personal_and_contact")
        return (
          isPersonalComplete ||
          isContactComplete ||
          isKYCComplete ||
          isAddressComplete
        );
      if (tabName === "organization") return isOrgComplete;
      if (tabName === "bank_and_payroll") return isBankComplete;
      if (tabName === "documents")
        return Object.keys(attachments || {}).length > 0;
      return false;
    };
    useEffect(() => {
      setTimeout(() => {
        const container = document.getElementById(`tab-content-${activeTab}`);
        if (container) {
          const firstEnabled = container.querySelector(
            "input:not([disabled]), select:not([disabled])",
          );
          if (firstEnabled) firstEnabled.focus();
        }
      }, 50);
    }, [activeTab]);
    useEffect(() => {
      fetchCountries()
        .then((data) => {
          const countries = (data || [])
            .map((c) => c?.LED_NAME || "")
            .filter(Boolean);
          setCountryNames(countries);
        })
        .catch((err) => console.error("Failed to fetch countries:", err));
    }, []);
    useEffect(() => {
      fetchStates()
        .then((data) => {
          const states = (data || [])
            .map((s) => s?.state || "")
            .filter(Boolean);
          setStateNames(states);
        })
        .catch((err) => console.error("Failed to fetch states:", err));
    }, []);
    useEffect(() => {
      if (isAddMode) {
        setTimeout(() => {
          const container = document.getElementById(
            `tab-content-personal_and_contact`,
          );
          if (container) {
            const firstEnabled = container.querySelector(
              "input:not([disabled]), select:not([disabled])",
            );
            if (firstEnabled) firstEnabled.focus();
          }
        }, 100);
      }
    }, [isAddMode]);
    const addressFields = fieldGroups?.personal_and_contact?.Address || [];
    const C_countryField = addressFields.find((f) => f.key === "C_Country");
    const C_stateField = addressFields.find((f) => f.key === "C_State");
    if (C_countryField) C_countryField.options = countryNames;
    if (C_stateField) C_stateField.options = stateNames;
    const P_countryField = addressFields.find((f) => f.key === "P_Country");
    const P_stateField = addressFields.find((f) => f.key === "P_State");
    if (P_countryField) P_countryField.options = countryNames;
    if (P_stateField) P_stateField.options = stateNames;
    useEffect(() => {
      if (mode === "add" && prevModeRef.current !== "add") {
        setActiveTab("personal_and_contact");
        pendingPhotoRef.current = null;
      }
      prevModeRef.current = mode;
    }, [mode]);

    const handleChange = useCallback(
      (field, rawValue) => {
        if (!setFormData) return;
        let finalValue =
          rawValue === undefined || rawValue === null ? "" : rawValue;
        const nameStr = field.toLowerCase();
        if (nameStr.includes("voter id")) {
          finalValue = finalValue.toString().slice(0, 10); // Only 10 chars
        } else if (nameStr.includes("driving licence")) {
          finalValue = finalValue.toString().slice(0, 15); // Max 15 chars
        } else if (nameStr.includes("pin code")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 6); // Only 6 digits
        } else if (nameStr.includes("phone extension")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 6); // Max 6 digits
        } else if (
          nameStr.includes("mobile") ||
          nameStr.includes("phone") ||
          nameStr.includes("alternate no") ||
          nameStr.includes("emerg_mobile")
        ) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 10); // Only 10 digits
        } else if (nameStr.includes("aadhaar")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 12); // Only 12 digits
        } else if (nameStr.includes("uan")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 12); // Only 12 digits
        } else if (nameStr.includes("esi number")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 17); // Only 17 digits
        } else if (nameStr.includes("account number")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 18); // Max 18 digits for Bank Accounts
        } else if (nameStr.includes("pan number") || nameStr === "pan card") {
          finalValue = finalValue
            .toString()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 10); // 10 Alphanumeric Only
        } else if (nameStr.includes("passport no")) {
          finalValue = finalValue
            .toString()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 8); // 8 Alphanumeric Only
        } else if (nameStr.includes("micr")) {
          finalValue = finalValue.toString().replace(/\D/g, "").slice(0, 9); // Only 9 digits
        } else if (nameStr.includes("ifsc")) {
          finalValue = finalValue
            .toString()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 11); // 11 Alphanumeric Only
        }
        setFormData((prev) => {
          let updated = { ...prev };
          if (
            [
              "Division",
              "Department",
              "Designation",
              "Grade / Level",
              "Reporting Manager",
              "PT State",
            ].includes(field)
          ) {
            const list =
              {
                Division: groupOptions.division,
                Department: groupOptions.department,
                Designation: groupOptions.designation,
                "Grade / Level": groupOptions.grade,
                "Reporting Manager": groupOptions.reporting,
                "PT State": op.pt,
              }[field] || [];
            const selected = list.find(
              (g) =>
                g.group_name?.toLowerCase() ===
                String(finalValue).toLowerCase(),
            );
            updated[field] = selected ? selected.group_id : finalValue;
          } else {
            updated[field] = finalValue;
          }
          if (field === "Same as Correspondence") {
            if (finalValue === true) {
              updated["P_Address Line 1"] = updated["C_Address Line 1"] || "";
              updated["P_Address Line 2"] = updated["C_Address Line 2"] || "";
              updated["P_City"] = updated["C_City"] || "";
              updated["P_District"] = updated["C_District"] || "";
              updated["P_Pin Code"] = updated["C_Pin Code"] || "";
              updated["P_State"] = updated["C_State"] || "";
              updated["P_Country"] = updated["C_Country"] || "";
            } else {
              updated["P_Address Line 1"] = "";
              updated["P_Address Line 2"] = "";
              updated["P_City"] = "";
              updated["P_District"] = "";
              updated["P_Pin Code"] = "";
              updated["P_State"] = "";
              updated["P_Country"] = "";
            }
          }
          if (field === "Marital Status" && finalValue !== "Married") {
            updated["Spouse Name"] = "";
            updated["Anniversary Date"] = "";
            updated["No. of Children"] = "";
          }
          if (field === "Status Leaving Date" && finalValue) {
            updated["Status"] = "Inactive";
          }
          if (field === "Status Leaving Date" && !finalValue) {
            updated["Status"] = "Active";
          }
          if (field === "Joining Date" && finalValue) {
            updated["Status"] = "Active";
          }
          return updated;
        });
        const err = validateSingleField(field, finalValue);
        if (err) setErrors((prev) => ({ ...prev, [field]: err }));
        else
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy[field];
            return copy;
          });
      },
      [setFormData, groupOptions],// eslint-disable-line react-hooks/exhaustive-deps
    );
    const handlePhotoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, photo_url: localUrl }));
      const currentMode = prevModeRef.current; // stale closure se bachao
      if (currentMode !== "add" && formData?.employee_id) {
        try {
          const fd = new FormData();
          fd.append("photo", file);
          const res = await uploadEmployeePhoto(formData.employee_id, fd);
          if (res?.success) {
            const serverUrl = `${config.apiUrl}${res.photo_url}?t=${Date.now()}`;
            setFormData((prev) => ({ ...prev, photo_url: serverUrl }));
          }
        } catch (err) {
          console.error("Photo upload failed:", err);
        }
      } else if (isAddMode) {
        pendingPhotoRef.current = { file, forNewEmployee: true };
      }
    };
    const requiredFields = [
      "First Name",
      "Mobile No",
      "Personal Email",
      "Department",
    ];

    const getInputClass = (isDisabled) =>
      `w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] ${isDisabled
        ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default"
        : "text-[#0f172a] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8]"
      }`;
    const handleKeyDown = useCallback(
      (e) => {
        if (isViewMode) return;
        if (
          e.target.tagName.toLowerCase() === "button" ||
          e.target.tagName.toLowerCase() === "textarea" ||
          e.target.type === "file"
        ) {
          return;
        }
        const container = document.getElementById(`tab-content-${activeTab}`);
        if (!container) return;

        const focusableElements = Array.from(
          container.querySelectorAll(
            "input:not([disabled]), select:not([disabled])",
          ),
        );
        const index = focusableElements.indexOf(e.target);

        if (e.key === "Enter") {
          e.preventDefault();

          if (index > -1) {
            if (index < focusableElements.length - 1) {
              focusableElements[index + 1].focus();
            } else {
              const currentTabIndex = tabs.indexOf(activeTab);
              if (currentTabIndex < tabs.length - 1) {
                setActiveTab(tabs[currentTabIndex + 1]);
              } else {
                const buttons = Array.from(document.querySelectorAll("button"));
                const saveBtn = buttons.find(
                  (btn) =>
                    btn.textContent.toLowerCase().includes("save") ||
                    btn.textContent.toLowerCase().includes("update"),
                );
                if (saveBtn) saveBtn.focus();
              }
            }
          }
        } else if (e.shiftKey && e.key === "Backspace") {
          if (index > 0) {
            const isTextLikeInput =
              e.target.tagName.toLowerCase() === "input" &&
              ["text", "email", "tel", "number", "password"].includes(
                e.target.type,
              );

            if (isTextLikeInput) {
              e.preventDefault();
              focusableElements[index - 1].focus();
            } else if (
              e.target.tagName.toLowerCase() === "select" ||
              e.target.type === "checkbox" ||
              e.target.type === "radio"
            ) {
              e.preventDefault();
              focusableElements[index - 1].focus();
            }
          }
        }
      },
      [activeTab, isViewMode],
    );

    const handleSave = useCallback(() => {
      try {
        const validationGroups = {};
        Object.keys(fieldGroups).forEach((tab) => {
          validationGroups[tab] = {};
          Object.keys(fieldGroups[tab]).forEach((section) => {
            validationGroups[tab][section] = fieldGroups[tab][section].filter(
              (field) => field.type !== "section-divider",
            );
          });
        });

        const currentData = formDataRef.current || {};
        const { isValid, errors: validationErrors } = validateEmployeeForm(
          currentData,
          validationGroups,
        );
        const safeErrors = validationErrors || {};
        if (!isValid || Object.keys(safeErrors).length > 0) {
          setErrors(safeErrors);
          const errorKeys = Object.keys(safeErrors);
          const firstErrorField = errorKeys.length > 0 ? errorKeys[0] : null;
          let targetTab = activeTab;
          if (firstErrorField) {
            let foundTab = null;
            for (const [tabKey, sections] of Object.entries(fieldGroups)) {
              for (const fields of Object.values(sections)) {
                if (fields.some((f) => f.key === firstErrorField)) {
                  foundTab = tabKey;
                  break;
                }
              }
              if (foundTab) break;
            }
            if (foundTab && foundTab !== activeTab) {
              setActiveTab(foundTab);
              targetTab = foundTab;
            }
          }
          setTimeout(() => {
            try {
              if (firstErrorField) {
                const container = document.getElementById(
                  `tab-content-${targetTab}`,
                );
                const errorContainer = document.getElementById(
                  `field-container-${firstErrorField}`,
                );

                if (container && errorContainer) {
                  const containerRect = container.getBoundingClientRect();
                  const elementRect = errorContainer.getBoundingClientRect();

                  const isAlreadyVisible =
                    elementRect.top >= containerRect.top &&
                    elementRect.bottom <= containerRect.bottom;

                  if (!isAlreadyVisible) {
                    const relativeTop =
                      elementRect.top - containerRect.top + container.scrollTop;
                    container.scrollTo({
                      top: Math.max(0, relativeTop - 15),
                      behavior: "smooth",
                    });
                  }

                  const errorInput = errorContainer.querySelector(
                    "input:not([disabled]), select:not([disabled])",
                  );
                  if (errorInput) errorInput.focus();
                }
              }
            } catch (scrollError) {
              console.warn("Auto-scroll gracefully skipped:", scrollError);
            }
          }, 150);

          return;
        }

        // 🆕 FIX: validation pass hone par onSave call karo
        setErrors({});
        onSave({
          ...(formDataRef.current || {}),
        });

      } catch (err) {
        console.error("Save process bypassed a crash: ", err);
        onSave({
          ...(formDataRef.current || {}),
        });
      }
    }, [onSave, activeTab]);

    const renderField = (fieldObj) => {
      const field = fieldObj.key;
      const type = fieldObj.type || "text";
      const isPermanentAddressField = field.startsWith("P_");
      const isSameAsCorrespondence = !!formData["Same as Correspondence"];
      const isEmployeeIdField = field === "Employee ID";
      const fieldDisabled =
        isViewMode ||
        (isEmployeeIdField && !isAddMode) ||
        (isPermanentAddressField && isSameAsCorrespondence) ||
        fieldObj.readOnly;

      if (type === "date")
        return (
          <ERPDateInput
            value={formData[field] || ""}
            onChange={(val) => handleChange(field, val)}
            className={getInputClass(fieldDisabled)}
            disabled={fieldDisabled}
          />
        );

      if (type === "select") {
        let options = fieldObj.options || [];

        if (field === "Division")
          options = groupOptions.division.map((g) => g.group_name);
        if (field === "Department")
          options = groupOptions.department.map((g) => g.group_name);
        if (field === "Designation")
          options = groupOptions.designation.map((g) => g.group_name);
        if (field === "Grade / Level")
          options = groupOptions.grade.map((g) => g.group_name);
        if (field === "Reporting Manager")
          options = groupOptions.reporting.map((g) => g.group_name);
        if (field === "PT State") options = (op?.pt || []).map((g) => g.label);
        const displayVal = getDisplayValue(field, formData[field]);
        return (
          <ERPAutocomplete
            options={options}
            value={displayVal || ""}
            disabled={fieldDisabled}
            onChange={(val) => handleChange(field, val)}
            className={getInputClass(fieldDisabled)}
          />
        );
      }
      if (type === "leave-selector")
        return (
          <LeaveTypeSelector
            value={formData["Leave allow"] || []}
            onChange={(selectedIds, selectedNames) => {
              setFormData((prev) => ({
                ...prev,
                "Leave allow": selectedIds,
                "Leave allow names": selectedNames,
              }));
            }}
            disabled={isViewMode}
          />
        );
      if (type === "checkbox") {
        return (
          <div className="flex items-center h-[32px] w-full px-1">
            <input
              type="checkbox"
              className="w-[16px] h-[16px] cursor-pointer accent-[#1a56db] rounded-[3px]"
              checked={!!formData[field]}
              disabled={isViewMode}
              onChange={(e) => handleChange(field, e.target.checked)}
            />
          </div>
        );
      }
      if (type === "email") {
        const emailDomains = [
          "@gmail.com",
          "@yahoo.com",
          "@outlook.com",
          "@company.com",
        ];
        const val = formData[field] || "";
        const isSuggesting = emailSuggestField === field;
        const hasAtSymbol = val.includes("@");
        const [username, domainPrefix] = hasAtSymbol
          ? val.split("@")
          : [val, ""];
        const filteredDomains = hasAtSymbol
          ? emailDomains.filter(
            (d) =>
              d.toLowerCase().startsWith("@" + domainPrefix.toLowerCase()) &&
              d.toLowerCase() !== "@" + domainPrefix.toLowerCase(),
          )
          : [];
        const selectDomain = (domain) => {
          const completedEmail = `${username}${domain}`;
          handleChange(field, completedEmail);
          setEmailSuggestField(null);
          if (typeof setActiveSuggestIndex === "function")
            setActiveSuggestIndex(0);
        };
        return (
          <div className="relative w-full">
            <input
              className={getInputClass(fieldDisabled)}
              value={val}
              disabled={fieldDisabled}
              onChange={(e) => {
                handleChange(field, e.target.value);
                setEmailSuggestField(field);
                if (typeof setActiveSuggestIndex === "function")
                  setActiveSuggestIndex(0);
              }}
              onFocus={() => {
                setEmailSuggestField(field);
                if (typeof setActiveSuggestIndex === "function")
                  setActiveSuggestIndex(0);
              }}
              onBlur={() => {
                setTimeout(() => setEmailSuggestField(null), 200);
              }}
              onKeyDown={(e) => {
                if (!isSuggesting || filteredDomains.length === 0) return;
                switch (e.key) {
                  case "ArrowDown":
                    e.preventDefault();
                    if (typeof setActiveSuggestIndex === "function") {
                      setActiveSuggestIndex((prev) =>
                        prev < filteredDomains.length - 1 ? prev + 1 : 0,
                      );
                    }
                    break;
                  case "ArrowUp":
                    e.preventDefault();
                    if (typeof setActiveSuggestIndex === "function") {
                      setActiveSuggestIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredDomains.length - 1,
                      );
                    }
                    break;

                  case "Enter":
                    e.preventDefault();
                    if (filteredDomains[activeSuggestIndex]) {
                      selectDomain(filteredDomains[activeSuggestIndex]);
                    }
                    break;

                  case "Escape":
                    e.preventDefault();
                    setEmailSuggestField(null);
                    break;

                  default:
                    break;
                }
              }}
            />
            {isSuggesting &&
              hasAtSymbol &&
              filteredDomains.length > 0 &&
              !fieldDisabled && (
                <div className="flex gap-1.5 mt-1 bg-white p-1 rounded border border-[#c8d2e4] w-max shadow-md z-[99999] absolute top-[100%] left-0">
                  {filteredDomains.map((domain, index) => {
                    // Safe fallback if state is missing
                    const isActive =
                      typeof activeSuggestIndex !== "undefined"
                        ? index === activeSuggestIndex
                        : false;

                    return (
                      <button
                        key={domain}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectDomain(domain);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-medium border rounded transition-colors cursor-pointer ${isActive
                          ? "bg-[#1a56db] text-white border-[#1a56db]"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-[#1a56db] hover:text-white"
                          }`}
                        onMouseEnter={() => {
                          if (typeof setActiveSuggestIndex === "function")
                            setActiveSuggestIndex(index);
                        }}
                      >
                        {domain}
                      </button>
                    );
                  })}
                </div>
              )}
          </div>
        );
      }
      return (
        <input
          className={getInputClass(fieldDisabled)}
          value={formData[field] || ""}
          disabled={fieldDisabled}
          maxLength={fieldObj.maxLength}
          onChange={(e) => handleChange(field, e.target.value)}
          style={{ whiteSpace: "nowrap" }}
        />
      );
    };

    const employeeName = formData["First Name"]
      ? `${formData["First Name"]} ${formData["Last Name"] || ""}`
      : formData.employee_name || "New Employee";

    const renderCard = ([title, fields], isLast) => {
      const headerStyle = getHeaderStyle(title);
      return (
        <div
          key={title}
          className={`bg-white w-full flex flex-col border border-[#dde1ea] rounded-[6px] shadow-sm shrink-0 ${isLast ? "flex-1" : ""}`}
        >
          <div
            className={`px-[14px] py-[7px] shrink-0 flex items-center justify-between border-b ${headerStyle.border} ${headerStyle.barBg} rounded-t-[5px]`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm ${headerStyle.iconBg}`}
              >
                {headerStyle.icon}
              </div>
              <h3
                className={`text-[11.5px] font-bold uppercase tracking-[0.4px] ${headerStyle.text}`}
              >
                {title}
              </h3>
            </div>
          </div>
          <div
            className={`p-[14px] grid ${getGridConfig(title)} gap-x-[12px] gap-y-[5px] content-start items-start flex-1 overflow-visible`}
          >
            {(fields || []).map((fieldObj, index) => {
              if (fieldObj.showIf && !fieldObj.showIf(formData)) return null;
              if (fieldObj.type === "section-divider") {
                const getDividerIcon = (label) => {
                  const l = label.toLowerCase();
                  if (l.includes("education"))
                    return <FaGraduationCap className="text-[14px]" />;
                  if (l.includes("family"))
                    return <FaUsers className="text-[14px]" />;
                  return <FaFileAlt className="text-[14px]" />;
                };
                const isPermanentDivider = fieldObj.key === "div_perm";
                return (
                  <div
                    key={`${fieldObj.label}-${index}`}
                    className="col-span-full mt-2 mb-1 flex items-center gap-2.5"
                  >
                    <div className="flex items-center gap-1.5 text-[#64748b]">
                      {getDividerIcon(fieldObj.label)}
                      <span className="text-[11px] font-bold uppercase tracking-[0.5px]">
                        {fieldObj.label}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-[#dde1ea]"></div>
                    {isPermanentDivider && (
                      <div
                        className="flex items-center gap-1.5 bg-[#fefce8] px-2.5 py-[3px] rounded border border-[#fef08a] hover:bg-white transition-colors cursor-pointer shrink-0"
                        onClick={() =>
                          !isViewMode &&
                          handleChange(
                            "Same as Correspondence",
                            !formData["Same as Correspondence"],
                          )
                        }
                      >
                        <input
                          type="checkbox"
                          id="sameAsCorr"
                          className="w-[12px] h-[12px] cursor-pointer accent-[#d97706]"
                          checked={!!formData["Same as Correspondence"]}
                          disabled={isViewMode}
                          onChange={(e) =>
                            handleChange(
                              "Same as Correspondence",
                              e.target.checked,
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor="sameAsCorr"
                          className="text-[10px] font-bold text-[#d97706] uppercase tracking-[0.3px] cursor-pointer select-none"
                        >
                          Same as Correspondence
                        </label>
                      </div>
                    )}
                  </div>
                );
              }
              const fieldKey = fieldObj.key;
              const label = fieldObj.label;
              const nameStr = label.toLowerCase();
              let colSpanClass = "col-span-1";
              if (
                nameStr.includes("address line") ||
                nameStr.includes("employee name") ||
                nameStr.includes("remarks")
              ) {
                colSpanClass = "col-span-2";
              } else if (
                nameStr.includes("email") ||
                nameStr.includes("bank name") ||
                nameStr.includes("mother's name") ||
                nameStr.includes("father's name") ||
                nameStr.includes("qualification")
              ) {
                colSpanClass = "col-span-1 sm:col-span-2";
              }
              const fieldClass = `flex flex-col gap-[3px] w-full ${colSpanClass}`;
              return (
                <div
                  key={fieldKey}
                  id={`field-container-${fieldKey}`}
                  className={fieldClass}
                >
                  <label className="text-[#1e293b] font-semibold text-[12px] tracking-[0.1px] flex items-center mb-[2px]">
                    {label}
                    {requiredFields.includes(fieldKey) && (
                      <span className="text-[#dc2626] ml-[2px] text-[12px] leading-none">
                        *
                      </span>
                    )}
                  </label>
                  <div className="w-full relative">
                    {renderField(fieldObj)}
                    {errors[fieldKey] && (
                      <div className="absolute left-0 top-[100%] z-50 mt-[2px]">
                        <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium">
                          {errors[fieldKey]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };
    return (
      <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f8] flex flex-col overflow-hidden font-['Segoe_UI',system-ui,Arial,sans-serif] text-[13px] text-[#0f172a] leading-[1.4]">
        <ERPHeader
          title="Employee Master"
          isAddMode={isAddMode}
          isEditMode={isEditMode}
          isViewMode={isViewMode}
          rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
          activeTab="entry"
          onTabChange={onTabChange}
          currentIndex={currentRecord} // 👈
          totalRecords={totalRecords} // 👈
          onPrevRecord={onPrevRecord} // 👈
          onNextRecord={onNextRecord}
        />
        <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden">
          <div className="w-full md:w-[220px] bg-white border-b md:border-b-0 md:border-r border-[#dde1ea] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 scrollbar-hide z-10">
            <div className="bg-[#f8fafc] border-b border-[#dde1ea] py-2.5 md:py-[18px] px-3 flex flex-row md:flex-col items-center">
              <div
                className={`relative z-10 w-[75px] h-[75px] md:w-[99px] md:h-[99px] rounded-full bg-[#dde3ef] border-[2px] md:border-[3px] border-[#dde1ea] flex items-center justify-center overflow-hidden shrink-0 ${isViewMode ? "" : "cursor-pointer"}`}
                onClick={() => {
                  if (isViewMode) return;
                  photoInputRef.current?.click();
                }}
              >
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    className="w-full h-full"
                    alt="profile"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-[18px] md:text-[28px] font-bold text-[#8a9ab5] tracking-wider">
                    {getInitials(employeeName)}
                  </span>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                ref={photoInputRef}
                onChange={(e) => {
                  if (isViewMode) return;
                  handlePhotoUpload(e);
                }}
              />

              <div className="flex flex-col ml-3 md:ml-0 flex-1 min-w-0 md:items-center">
                <h2 className="text-[14px] md:text-[15px] font-bold text-[#0f2137] md:text-center mt-0 md:mt-2.5 truncate w-full px-1">
                  {employeeName}
                </h2>
                <h4 className="text-[10.5px] font-semibold text-[#718096] md:text-center mt-0.5 tracking-[0.4px] truncate w-full">
                  EMP ID :{" "}
                  {formData["Employee ID"] || formData.employee_code || "—"}
                </h4>
              </div>

              <button
                onClick={() => {
                  if (isViewMode) return;
                  photoInputRef.current?.click();
                }}
                disabled={isViewMode}
                className={`ml-auto md:ml-0 mt-0 md:mt-2.5 flex items-center justify-center gap-1.5 px-2.5 md:px-3.5 py-[5px] rounded border-none bg-[#1a56db] hover:bg-[#1647c0] text-white text-[11px] font-semibold transition-colors w-max ${isViewMode ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <FaCloudUploadAlt className="text-[13px]" />
                <span className="hidden md:inline">Upload Photo</span>
                <span className="md:hidden">Upload</span>
              </button>
            </div>

            <div className="hidden md:flex p-3 flex-col flex-1 bg-white">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[12px] font-bold text-[#374151]">
                    Completion
                  </h3>
                  <span className="text-[13px] font-bold text-[#059669]">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-[#eef1f7] rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className="bg-[#059669] h-1.5 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              <hr className="border-[#dde1ea] mb-3" />

              <div>
                <h3 className="text-[10px] font-bold tracking-[0.6px] text-[#94aabf] uppercase mb-2">
                  Quick Info
                </h3>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
                    <span className="flex items-center gap-1.5 text-[#718096] text-[11px] truncate">
                      <FaCalendarAlt className="text-[9px] shrink-0" />{" "}
                      <span>Joining</span>
                    </span>
                    <span className="text-[#1a202c] font-bold text-[11px] truncate">
                      {formData["Joining Date"] || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
                    <span className="flex items-center gap-1.5 text-[#718096] text-[11px] truncate">
                      <FaUserTie className="text-[9px] shrink-0" />{" "}
                      <span>Reports</span>
                    </span>
                    <span
                      className="text-[#1a202c] font-bold text-[11px] truncate max-w-[100px]"
                      title={getDisplayValue(
                        "Reporting Manager",
                        formData["Reporting Manager"],
                      )}
                    >
                      {getDisplayValue(
                        "Reporting Manager",
                        formData["Reporting Manager"],
                      ) || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
                    <span className="flex items-center gap-1.5 text-[#718096] text-[11px] truncate">
                      <FaPhoneAlt className="text-[9px] shrink-0" />{" "}
                      <span>Mobile</span>
                    </span>
                    <span className="text-[#1a202c] font-bold text-[11px] truncate">
                      {formData["Mobile No"] || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-0.5">
                    <span className="flex items-center gap-1.5 text-[#718096] text-[11px] truncate">
                      <FaIdCard className="text-[9px] shrink-0" />{" "}
                      <span>PAN</span>
                    </span>
                    <span className="text-[#1a202c] font-bold text-[11px] uppercase truncate">
                      {formData["PAN Number"] || formData["PAN"] || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[#eef1f8] w-full">
            <div className="flex flex-wrap items-end gap-0 px-[6px] bg-white border-b-2 border-[#e1e7f2] shrink-0 w-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const isCompleted = isTabComplete(tab);
                const tabNameMap = {
                  personal_and_contact: "Personal & Contact",
                  organization: "Organization",
                  bank_and_payroll: "Bank & Payroll",
                  documents: "Documents",
                };
                const displayName = tabNameMap[tab] || tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-[6px] px-[12px] sm:px-[16px] pt-[10px] pb-[9px] text-[12px] font-semibold cursor-pointer border-b-2 mb-[-2px] transition-all duration-150 whitespace-nowrap outline-none ${isActive
                      ? "text-[#1a56db] border-[#1a56db]"
                      : "text-[#64748b] border-transparent hover:text-[#334155] hover:border-[#c4cfe4]"
                      }`}
                  >
                    <div
                      className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center ${isActive ? "bg-[#eef3fd]" : "bg-transparent"
                        }`}
                    >
                      <TabIcon tab={tab} />
                    </div>
                    <span className="hidden sm:inline">{displayName}</span>

                    <div
                      className={`hidden sm:flex w-[16px] h-[16px] rounded-[8px] bg-[#059669] text-white text-[9px] font-bold items-center justify-center ml-1 ${isCompleted ? "opacity-100" : "opacity-0"
                        }`}
                    >
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>
            <div
              id={`tab-content-${activeTab}`}
              className="flex-1 p-[8px] overflow-y-auto  overflow-x-hidden min-h-0 flex flex-col w-full"
              onKeyDown={handleKeyDown}
            >
              {activeTab === "documents" ? (
                <DocumentTable
                  attachments={attachments}
                  setAttachments={setAttachments}
                  isViewMode={isViewMode}
                  documents={docList}
                  employeeId={formData?.employee_id || null}
                />
              ) : (
                (() => {
                  const entries = Object.entries(fieldGroups[activeTab] || {});
                  const leftCol = [];
                  const rightCol = [];
                  entries.forEach(([title, fields], index) => {
                    if (activeTab === "personal_and_contact") {
                      if (
                        title === "Address" ||
                        title === "KYC Details" ||
                        title === "Emergency Contact"
                      ) {
                        rightCol.push([title, fields]);
                      } else {
                        leftCol.push([title, fields]);
                      }
                    } else if (activeTab === "organization") {
                      if (title === "Employment Details") {
                        leftCol.push([title, fields]);
                      } else {
                        rightCol.push([title, fields]);
                      }
                    } else {
                      if (index % 2 === 0) leftCol.push([title, fields]);
                      else rightCol.push([title, fields]);
                    }
                  });
                  return (
                    <div className="flex flex-col w-full gap-[12px] pb-4">
                      <div className="flex flex-col lg:flex-row gap-[8px] flex-1 items-stretch w-full">
                        <div className="flex-1 flex flex-col gap-[8px] min-w-0">
                          {leftCol.map((entry, index) =>
                            renderCard(entry, index === leftCol.length - 1),
                          )}
                        </div>

                        {rightCol.length > 0 && (
                          <div className="flex-1 flex flex-col gap-[8px] min-w-0">
                            {rightCol.map((entry, index) =>
                              renderCard(entry, index === rightCol.length - 1),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>

        <ERPFooter
          isAddMode={isAddMode}
          isViewMode={isViewMode}
          isEditMode={isEditMode}
          saving={saving}
          handleSubmit={handleSave}
          onModify={onModify}
          onDelete={() => onDelete && onDelete(formData)}
          onCancel={onCancel}
          onNewEntry={onNewEntry}
          onPrint={onPrint}
          onEditCancel={onEditCancel}
          rights={rights}
        />
      </div>
    );
  },
);

export default EmployeeMasterForm;

export const fieldGroups = {
  personal_and_contact: {
    "Personal Information": [
      {
        key: "Employee ID",
        label: "Employee Code",
        type: "text",
        readOnly: false,
        placeholder: "Leave blank to auto-generate",
      },
      {
        key: "Title",
        label: "Title",
        type: "select",
        options: ["Mr", "Mrs", "Ms", "Dr", "Er"],
      },

      { key: "First Name", label: "First Name", type: "text" },
      { key: "Middle Name", label: "Middle Name", type: "text" },
      { key: "Last Name", label: "Last Name", type: "text" },

      {
        key: "Gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
      },
      { key: "Date of Birth", label: "Date of Birth", type: "date" },
      {
        key: "Blood Group",
        label: "Blood Group",
        type: "select",
        options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      },
      {
        key: "Nationality",
        label: "Nationality",
        type: "select",
        options: ["Indian", "Other"],
      },
      {
        key: "Religion",
        label: "Religion",
        type: "select",
        options: [
          "Hindu",
          "Muslim",
          "Christian",
          "Sikh",
          "Jain",
          "Buddhist",
          "Other",
        ],
      },
      {
        key: "Category",
        label: "Category",
        type: "select",
        options: ["General", "OBC", "SC", "ST"],
      },

      {
        key: "Marital Status",
        label: "Marital Status",
        type: "select",
        options: ["Single", "Married", "Divorced", "Widowed"],
      },
      {
        key: "Spouse Name",
        label: "Spouse Name",
        type: "text",
        showIf: (data) => data["Marital Status"] === "Married",
      },
      {
        key: "Anniversary Date",
        label: "Anniversary",
        type: "date",
        showIf: (data) => data["Marital Status"] === "Married",
      },
      {
        key: "No. of Children",
        label: "No. of Children",
        type: "select",
        options: ["0", "1", "2", "3", "4+"],
        showIf: (data) => data["Marital Status"] === "Married",
      },

      { key: "div_family", type: "section-divider", label: "FAMILY DETAILS" },
      { key: "Mother's Name", label: "Mother's Name", type: "text" },
      {
        key: "Father's / Guardian's Name",
        label: "Father's Name",
        type: "text",
      },

      { key: "div_edu", type: "section-divider", label: "EDUCATIONAL DETAILS" },
      {
        key: "Qualification",
        label: "Qualification",
        type: "select",
        options: [
          "Below 10th",
          "10th Pass",
          "12th Pass",
          "Graduate",
          "Post Graduate",
          "Doctorate",
        ],
      },
      {
        key: "Professional Qualification",
        label: "Professional Qualification",
        type: "text",
      },
      { key: "Specialization", label: "Specialization", type: "text" },
    ],
    "Contact Details": [
      { key: "Mobile No", label: "Mobile No", type: "tel" },
      { key: "Alternate Mobile", label: "Alternate Mobile", type: "tel" },
      { key: "Phone Extension", label: "Phone Extension", type: "tel" },
      { key: "Phone (Residence)", label: "Phone (Residence)", type: "tel" },
      { key: "Personal Email", label: "Personal Email", type: "email" },
      { key: "Work Email", label: "Work Email", type: "email" },
    ],
    "Emergency Contact": [
      { key: "Emerg_Contact Person", label: "Contact Person", type: "text" },
      {
        key: "Emerg_Relationship",
        label: "Relationship",
        type: "select",
        options: [
          "Brother",
          "Sister",
          "Father",
          "Mother",
          "Spouse",
          "Friend",
          "Other",
        ],
      },
      { key: "Emerg_Mobile No", label: "Mobile No", type: "tel" },
      { key: "Emerg_Alternate No", label: "Alternate No", type: "tel" },
    ],
    "KYC Details": [
      { key: "PAN Number", label: "PAN Number", type: "text" },
      { key: "Aadhaar No", label: "Aadhaar No", type: "text" },
      { key: "Voter ID", label: "Voter ID", type: "text" },
      { key: "Driving Licence", label: "Driving Licence", type: "text" },
      { key: "Passport No", label: "Passport No", type: "text" },
      { key: "Passport Expiry", label: "Passport Expiry", type: "date" },
    ],

    Address: [
      {
        key: "div_corr",
        type: "section-divider",
        label: "Correspondence Address",
      },
      { key: "C_Address Line 1", label: "Address Line 1", type: "text" },
      { key: "C_Address Line 2", label: "Address Line 2", type: "text" },
      { key: "C_City", label: "City", type: "text" },
      { key: "C_District", label: "District", type: "text" },
      { key: "C_Pin Code", label: "Pin Code", type: "text" },
      { key: "C_State", label: "State", type: "select" },
      { key: "C_Country", label: "Country", type: "select" },

      { key: "div_perm", type: "section-divider", label: "Permanent Address" },
      { key: "P_Address Line 1", label: "Address Line 1", type: "text" },
      { key: "P_Address Line 2", label: "Address Line 2", type: "text" },
      { key: "P_City", label: "City", type: "text" },
      { key: "P_District", label: "District", type: "text" },
      { key: "P_Pin Code", label: "Pin Code", type: "text" },
      { key: "P_State", label: "State", type: "select" },
      { key: "P_Country", label: "Country", type: "select" },
    ],
  },
  organization: {
    "Employment Details": [
      { key: "Department", label: "Department", type: "select" },
      { key: "Designation", label: "Designation", type: "select" },
      { key: "Grade / Level", label: "Grade / Level", type: "select" },
      {
        key: "Branch / Location",
        label: "Branch / Location",
        type: "select",
        options: [
          "Noida — Head Office",
          "Mumbai",
          "Delhi",
          "Pune",
          "Bangalore",
        ],
      },
      { key: "Cost Centre", label: "Cost Centre", type: "text" },
      { key: "Division", label: "Division", type: "select" },
      { key: "Reporting Manager", label: "Reporting Manager", type: "select" },
      {
        key: "Employment Type",
        label: "Employment Type",
        type: "select",
        options: ["Full Time", "Part Time", "Contract", "Consultant", "Intern"],
      },
      {
        key: "Status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
      },
      {
        key: "Work Location Type",
        label: "Work Location Type",
        type: "select",
        options: ["Office", "Work From Home", "Hybrid", "Field"],
      },
      {
        key: "Employee Category",
        label: "Employee Category",
        type: "select",
        options: ["Permanent", "Probation", "Trainee", "Contractual"],
      },
      {
        key: "Status Leaving Date",
        label: "Status Leaving Date",
        type: "date",
      },
      {
        key: "Status Reason",
        label: "Reason for Leaving",
        type: "select",
        options: [
          "Resigned",
          "Terminated",
          "Retired",
          "Contract Ended",
          "Absconded",
          "Other",
        ],
        showIf: (data) => !!data["Status Leaving Date"], // sirf tab dikhe jab DOL filled ho
      },
    ],
    "Joining & Tenure": [
      { key: "Joining Date", label: "Joining Date", type: "date" },
      { key: "Confirmation Date", label: "Confirmation Date", type: "date" },
      {
        key: "Probation Period",
        label: "Probation Period",
        type: "select",
        options: ["3 Months", "6 Months", "1 Year", "NA"],
      },
      {
        key: "Notice Period",
        label: "Notice Period",
        type: "select",
        options: ["30 Days", "60 Days", "90 Days", "NA"],
      },
      {
        key: "Previous Experience",
        label: "Previous Experience",
        type: "text",
      },
      {
        key: "Total Experience",
        label: "Total Experience",
        type: "text",
        readOnly: true,
      },
    ],
    "Previous Employment": [
      { key: "Previous Company", label: "Previous Company", type: "text" },
      { key: "Last Designation", label: "Last Designation", type: "text" },
      { key: "Last CTC", label: "Last CTC (₹ LPA)", type: "text" },
      {
        key: "Reason for Leaving",
        label: "Reason for Leaving",
        type: "select",
        options: [
          "Better Opportunity",
          "Higher Studies",
          "Personal",
          "Relocation",
          "Layoff",
        ],
      },
      { key: "PF Account", label: "PF Account", type: "text" },
    ],
  },

  bank_and_payroll: {
    "Bank Details": [
      { key: "Bank Name", label: "Bank Name", type: "text", maxLength: 25 },
      { key: "IFSC Code", label: "IFSC Code", type: "text", maxLength: 11 },
      { key: "Account Number", label: "Account Number", type: "text", maxLength: 25 },
      {
        key: "Account Type",
        label: "Account Type",
        type: "select",
        options: ["Savings", "Current", "Salary"],
      },
      { key: "Holder Name", label: "Holder Name", type: "text", maxLength: 100 },
      { key: "Branch Name", label: "Branch Name", type: "text", maxLength: 50 },
      { key: "MICR Code", label: "MICR Code", type: "text", maxLength: 9 },
    ],
    "Statutory Details": [
      { key: "PF Number", label: "PF Number", type: "text", maxLength: 25 },
      { key: "UAN", label: "UAN", type: "text", maxLength: 12 },
      { key: "ESI Number", label: "ESI Number", type: "text", maxLength: 17 },
      {
        key: "PT State",
        label: "PT State",
        type: "select",
        options: [
          "Maharashtra",
          "Karnataka",
          "Andhra Pradesh",
          "Telangana",
          "Gujarat",
        ],
      },
      {
        key: "PF Applicable",
        label: "PF Applicable",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "ESI Applicable",
        label: "ESI Applicable",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "Gratuity",
        label: "Gratuity Eligible",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "TDS Category",
        label: "TDS Category",
        type: "select",
        options: ["Salaried", "Non-Salaried", "Exempt"],
      },
    ],
  },
  documents: {
    "Document Repository": [
      { key: "Aadhaar Card", label: "Aadhaar Card Upload", type: "file" },
      { key: "PAN Card", label: "PAN Card Upload", type: "file" },
      { key: "Offer Letter", label: "Offer Letter Upload", type: "file" },
    ],
  },
};
