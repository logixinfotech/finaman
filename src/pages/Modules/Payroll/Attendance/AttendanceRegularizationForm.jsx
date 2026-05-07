import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList } from "../../../../utils/api";

const AttendanceRegularizationForm = ({
    mode = "view", onSave, onCancel, onDelete, onEditCancel, saving,
    onModify, onNewEntry, currentRecord, totalRecords, rights,
    activeTab = "entry", onTabChange, initialData = {}, setParentFormData
}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});

    const isViewMode = mode === "view";
    const isEditMode = mode === "edit";
    const isAddMode = mode === "add";
    const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
    const requiredFields = ["employee_id", "attendance_date", "reason"];

    const [employees, setEmployees] = useState([]);
    const [employeeNames, setEmployeeNames] = useState([]);

    const formatInputDate = (date) => {
        if (!date) return "";

        return new Date(date)
            .toISOString()
            .split("T")[0];
    };
    const formatInputTime = (time) => {

        if (!time) return "";

        // already HH:mm
        if (typeof time === "string" && time.includes(":") && time.length <= 5) {
            return time;
        }

        const d = new Date(time);

        if (isNaN(d.getTime())) {
            return "";
        }
        return d.toTimeString().slice(0, 5);
    };

    useEffect(() => { setFormData(initialData); }, [initialData]);
    useEffect(() => {

        const fetchEmployees = async () => {
            try {
                const data = await getActledList();
                setEmployees(data || []);
                setEmployeeNames(
                    (data || []).map(
                        emp => emp.Led_name?.trim()
                    )
                );
            } catch (err) {
                console.error(
                    "EMPLOYEE FETCH ERROR:",
                    err
                );
            }
        };

        fetchEmployees();
    }, []);

    const handleChange = (field, value) => {
        let updatedData;
        if (field === "employee_name") {
            const selectedEmp = employees.find(
                emp =>
                    emp.Led_name?.trim() ===
                    value?.trim()
            );
            updatedData = {
                ...formData,
                employee_name: value,
                employee_id: selectedEmp
                    ? Number(selectedEmp.Actled_id)
                    : ""
            };
        } else {
            updatedData = {
                ...formData,
                [field]: value
            };
        }
        setFormData(updatedData);
        setParentFormData(updatedData);

        const errorField =
            field === "employee_name"
                ? "employee_id"
                : field;
        if (errors[errorField]) {
            setErrors(prev => ({
                ...prev,
                [errorField]: null
            }));
        }
    };

    const getInputClass = (isDisabled, fieldName) =>
        `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
        } ${isDisabled ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500"}`;

    const handleValidateAndSave = useCallback(() => {
        if (isViewMode) return;
        let newErrors = {};
        requiredFields.forEach(field => {
            if (
                !formData[field] ||
                formData[field].toString().trim() === ""
            ) {
                newErrors[field] = "Required";
            }
        });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        if (onSave) {
            onSave(formData);
        }
    }, [formData, onSave, isViewMode]);

    return (
        <div className="w-full max-w-[720px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden" style={{ fontFamily: FONT }}>
            <ERPHeader
                title="ATTENDANCE REGULARIZATION"
                isAddMode={isAddMode}
                isEditMode={isEditMode}
                isViewMode={isViewMode}
                activeTab={activeTab}
                onTabChange={onTabChange}
                rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
            />

            <div className="flex-1 p-4 overflow-y-auto flex justify-center">
                <div id="shift-form-container" className="w-full h-fit bg-white border border-slate-200 shadow-sm rounded-md p-4 flex flex-col gap-y-4">

                    {/* ROW 1: Employee and Date */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-1 items-center gap-2">
                            <label className="text-black-800 text-[15px] w-[100px] shrink-0">Employee <span className="text-red-500">*</span></label>
                            <div className="flex-1">
                                <ERPAutocomplete
                                    options={employeeNames}
                                    value={formData.employee_name || ""}
                                    onChange={(val) =>
                                        handleChange("employee_name", val)
                                    }
                                    className={getInputClass(
                                        isViewMode,
                                        "employee_id"
                                    )}
                                    disabled={isViewMode}
                                />
                                {formData.employee_id && (

                                    <div className="text-[12px] text-blue-600 mt-1 ml-1 font-medium">
                                        EMP ID:
                                        <sub className="text-[12px]">
                                            {formData.employee_id}
                                        </sub>
                                    </div>
                                )}
                                {errors.employee_id && (
                                    <span className="text-[10px] text-red-500 ml-1">
                                        Please select employee
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-1 items-center gap-2">
                            <label className="text-black-800 text-[15px] w-[100px] shrink-0">Att. Date <span className="text-red-500">*</span></label>
                            <div className="flex-1 flex flex-col"> {/* Added wrapper div with flex-col */}
                                <input
                                    type="date"
                                    value={formatInputDate(formData.attendance_date)}
                                    disabled={isViewMode}
                                    onChange={(e) => handleChange("attendance_date", e.target.value)}
                                    className={getInputClass(isViewMode, "attendance_date")}
                                />
                                {errors.attendance_date && (
                                    <span className="text-[10px] text-red-500 ml-1 mt-1">
                                        Attendance date is required
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-1 items-center gap-2">
                            <label className="text-black-800 text-[15px] w-[100px] shrink-0">
                                Req. In Time
                            </label>
                            <input
                                type="time"
                                value={formatInputTime(formData.requested_in_time)}
                                disabled={isViewMode}
                                onChange={(e) =>
                                    handleChange("requested_in_time", e.target.value)
                                }
                                className={getInputClass(isViewMode, "requested_in_time")}
                            />
                        </div>

                        <div className="flex flex-1 items-center gap-2">
                            <label className="text-black-800 text-[15px] w-[100px] shrink-0">
                                Req. Out Time
                            </label>
                            <input
                                type="time"
                                value={formatInputTime(formData.requested_out_time)}
                                disabled={isViewMode}
                                onChange={(e) =>
                                    handleChange("requested_out_time", e.target.value)
                                }
                                className={getInputClass(isViewMode, "requested_out_time")}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-2">
                        <label className="text-black-800 text-[15px] w-[100px] pt-1 shrink-0">Reason <span className="text-red-500">*</span></label>
                        <div className="flex-1 w-full flex flex-col"> {/* Added wrapper div with flex-col */}
                            <textarea
                                rows="2"
                                value={formData.reason || ""}
                                disabled={isViewMode}
                                onChange={(e) => handleChange("reason", e.target.value)}
                                className={`${getInputClass(isViewMode, "reason")} h-[40px] py-2`}
                                placeholder="Explain the reason for regularization..."
                            />
                            {errors.reason && (
                                <span className="text-[10px] text-red-500 ml-1 mt-1">
                                    Reason is required
                                </span>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <ERPFooter
                isAddMode={isAddMode}
                isEditMode={isEditMode}
                isViewMode={isViewMode}
                saving={saving}
                handleSubmit={handleValidateAndSave}
                onModify={onModify}
                onDelete={() => onDelete?.(formData)}
                onCancel={onCancel}
                onEditCancel={onEditCancel}
                onNewEntry={onNewEntry}
                rights={rights}
            />
        </div>
    );
};

export default AttendanceRegularizationForm;