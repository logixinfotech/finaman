import React, { useState, useEffect, forwardRef } from "react";
import {
  FaBriefcase,
  FaFileAlt,
  FaTasks,
  FaGraduationCap,
  FaPlus,
  FaTimes,
  FaTrash,
  FaSearch,
  FaChevronDown,
  FaCheck,
  FaLayerGroup,
} from "react-icons/fa";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { fetchUserGroupsByType } from "../../../../utils/api";
import { getActiveSkills } from "../../../../utils/recruitmentApi";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b font-semibold text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1.5 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

// Standard qualification suggestions for quick-select chips
export const SUGGESTED_QUALIFICATIONS = [
  "B.Tech / B.E.",
  "M.Tech / M.E.",
  "BCA",
  "MCA",
  "B.Sc (IT / CS)",
  "M.Sc (IT / CS)",
  "BBA / MBA",
  "B.Com / M.Com",
  "Diploma in Engineering",
  "Any Graduate",
  "Post Graduate",
];

// ── Tag Input for Qualifications ─────────────────────────────────────────────
const QualificationsInput = ({
  qualifications = [],
  onChange,
  disabled,
  error,
}) => {
  const [val, setVal] = useState("");

  const handleAdd = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!qualifications.includes(trimmed)) {
      onChange([...qualifications, trimmed]);
    }
    setVal("");
  };

  const handleRemove = (idx) => {
    onChange(qualifications.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      handleAdd(val);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`min-h-[38px] p-1.5 border rounded-md bg-white flex flex-wrap items-center gap-1.5 ${
          error ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
        }`}
      >
        {qualifications.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs"
          >
            <FaGraduationCap size={11} className="text-indigo-600" />
            {typeof item === "string" ? item : item.qualification_name || item}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-indigo-400 hover:text-red-600 focus:outline-none ml-1"
              >
                <FaTimes size={10} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <div className="flex items-center gap-1 flex-1 min-w-[140px]">
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                qualifications.length === 0
                  ? "Type qualification & press Enter (e.g. B.Tech, MBA)"
                  : "Add more..."
              }
              className="flex-1 text-xs border-none outline-none px-1 h-[26px] bg-transparent text-slate-700 placeholder:text-slate-400 min-w-0"
            />
            {val.trim() && (
              <button
                type="button"
                onClick={() => handleAdd(val)}
                className="p-1 text-indigo-600 hover:text-indigo-800 focus:outline-none flex-shrink-0"
              >
                <FaPlus size={10} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suggested Qualification Badges */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-slate-500 mr-1">Quick Select:</span>
          {SUGGESTED_QUALIFICATIONS.map((sug) => {
            const isSelected = qualifications.includes(sug);
            return (
              <button
                key={sug}
                type="button"
                onClick={() => (isSelected ? handleRemove(qualifications.indexOf(sug)) : handleAdd(sug))}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {isSelected ? "✓ " : "+ "}
                {sug}
              </button>
            );
          })}
        </div>
      )}
      {error && <span className="text-[11px] text-red-500 block">{error}</span>}
    </div>
  );
};

// ── Dynamic Responsibilities Bullet List ─────────────────────────────────────
const ResponsibilitiesManager = ({
  responsibilities = [],
  onChange,
  disabled,
  error,
}) => {
  const [newText, setNewText] = useState("");

  const handleAdd = () => {
    if (!newText.trim()) return;
    onChange([...responsibilities, newText.trim()]);
    setNewText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && newText.trim()) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleUpdate = (idx, value) => {
    const updated = [...responsibilities];
    updated[idx] = value;
    onChange(updated);
  };

  const handleRemove = (idx) => {
    onChange(responsibilities.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Existing Responsibilities List */}
      <div className="space-y-2">
        {responsibilities.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-md">
            No specific responsibilities added yet. Add key duties below.
          </div>
        ) : (
          responsibilities.map((resp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md group hover:border-slate-300 transition-colors"
            >
              <span className="mt-1 w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1">
                {disabled ? (
                  <p className="text-xs text-slate-700 leading-relaxed">{resp}</p>
                ) : (
                  <textarea
                    rows={1}
                    value={resp}
                    onChange={(e) => handleUpdate(idx, e.target.value)}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-y"
                  />
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  title="Remove responsibility"
                  onClick={() => handleRemove(idx)}
                  className="mt-1 p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <FaTrash size={11} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add New Responsibility Input */}
      {!disabled && (
        <div className="flex items-start gap-2 pt-1">
          <textarea
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a key responsibility or deliverable and click 'Add' (or press Enter)..."
            className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="h-[32px] px-3 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
          >
            <FaPlus size={10} /> Add Duty
          </button>
        </div>
      )}
      {error && <span className="text-[11px] text-red-500 block">{error}</span>}
    </div>
  );
};

// ── Skills Selector Component with Skill Master Integration ──────────────────
const JDSkillsSection = ({
  skills = [],
  onChange,
  disabled,
  activeSkills = [],
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedScale, setSelectedScale] = useState("Intermediate");
  const [isPrefMode, setIsPrefMode] = useState(false);

  const selectedSkillIds = new Set(skills.map((s) => String(s.skill_id || s.skill_code)));

  const availableFiltered = activeSkills.filter((sk) => {
    const idStr = String(sk.skill_id);
    const codeStr = String(sk.skill_code);
    if (selectedSkillIds.has(idStr) || selectedSkillIds.has(codeStr)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      sk.skill_name?.toLowerCase().includes(q) ||
      sk.skill_code?.toLowerCase().includes(q) ||
      sk.skill_category?.toLowerCase().includes(q)
    );
  });

  const handleAddSkill = (skill, isPref) => {
    const newEntry = {
      skill_id: skill.skill_id,
      skill_code: skill.skill_code,
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      proficiency_scale_type: skill.proficiency_scale_type,
      is_preferred: isPref ? 1 : 0,
      proficiency_level: selectedScale,
    };
    onChange([...skills, newEntry]);
    setSearch("");
  };

  const handleRemoveSkill = (idx) => {
    onChange(skills.filter((_, i) => i !== idx));
  };

  const handleTogglePreferred = (idx) => {
    const updated = [...skills];
    updated[idx] = {
      ...updated[idx],
      is_preferred: updated[idx].is_preferred ? 0 : 1,
    };
    onChange(updated);
  };

  const handleLevelChange = (idx, level) => {
    const updated = [...skills];
    updated[idx] = {
      ...updated[idx],
      proficiency_level: level,
    };
    onChange(updated);
  };

  const requiredSkills = skills.filter((s) => !s.is_preferred || s.is_preferred === 0 || s.is_preferred === "0");
  const preferredSkills = skills.filter((s) => s.is_preferred === 1 || s.is_preferred === "1" || s.is_preferred === true);

  return (
    <div className="space-y-4">
      {/* ── Add Skill Selector Toolbar ── */}
      {!disabled && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FaPlus size={10} className="text-blue-600" /> Map Skill from Skill Master
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-600 font-medium cursor-pointer flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isPrefMode}
                  onChange={(e) => setIsPrefMode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                Mark as Preferred / Good-to-Have
              </label>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                  }}
                  placeholder="Search and select from active Skill Master..."
                  className="w-full h-[32px] pl-8 pr-3 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
                <FaSearch size={11} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-300 rounded-md shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {availableFiltered.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[11px]">
                      {activeSkills.length === 0
                        ? "No active skills found in Skill Master. Create them first."
                        : "No matching unmapped skills found."}
                    </div>
                  ) : (
                    availableFiltered.map((sk) => (
                      <div
                        key={sk.skill_id}
                        onClick={() => {
                          handleAddSkill(sk, isPrefMode);
                          setIsOpen(false);
                        }}
                        className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                            {sk.skill_code}
                          </span>
                          <span className="font-medium text-slate-800 truncate">{sk.skill_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {sk.skill_category}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600">+ Add</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Required Skills Table / List ── */}
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
        <div className="bg-red-50/70 border-b border-red-100 px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-red-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Mandatory / Required Skills ({requiredSkills.length})
          </span>
          <span className="text-[11px] text-red-600 font-medium">Must have for this job role</span>
        </div>

        {requiredSkills.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">
            No mandatory skills mapped yet. Select skills from above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requiredSkills.map((sk, idx) => {
              const fullIdx = skills.findIndex((item) => item === sk);
              return (
                <div key={idx} className="p-2 sm:px-3 flex items-center justify-between gap-2 hover:bg-slate-50 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                      {sk.skill_code || sk.skill_id}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{sk.skill_name}</span>
                    {sk.skill_category && (
                      <span className="hidden sm:inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {sk.skill_category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={sk.proficiency_level || "Intermediate"}
                      disabled={disabled}
                      onChange={(e) => handleLevelChange(fullIdx, e.target.value)}
                      className="h-[24px] px-1.5 text-[11px] border border-slate-300 rounded bg-white outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="Beginner">Beginner / Basic</option>
                      <option value="Intermediate">Intermediate / Good</option>
                      <option value="Expert">Expert / Advanced</option>
                    </select>

                    {!disabled && (
                      <>
                        <button
                          type="button"
                          title="Move to Preferred"
                          onClick={() => handleTogglePreferred(fullIdx)}
                          className="text-[10px] text-indigo-600 hover:underline px-1"
                        >
                          Make Preferred
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(fullIdx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <FaTimes size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Preferred Skills Table / List ── */}
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
        <div className="bg-amber-50/70 border-b border-amber-100 px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Preferred / Secondary Skills ({preferredSkills.length})
          </span>
          <span className="text-[11px] text-amber-600 font-medium">Good to have / Bonus skills</span>
        </div>

        {preferredSkills.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">
            No preferred skills mapped.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {preferredSkills.map((sk, idx) => {
              const fullIdx = skills.findIndex((item) => item === sk);
              return (
                <div key={idx} className="p-2 sm:px-3 flex items-center justify-between gap-2 hover:bg-slate-50 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                      {sk.skill_code || sk.skill_id}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{sk.skill_name}</span>
                    {sk.skill_category && (
                      <span className="hidden sm:inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {sk.skill_category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={sk.proficiency_level || "Intermediate"}
                      disabled={disabled}
                      onChange={(e) => handleLevelChange(fullIdx, e.target.value)}
                      className="h-[24px] px-1.5 text-[11px] border border-slate-300 rounded bg-white outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="Beginner">Beginner / Basic</option>
                      <option value="Intermediate">Intermediate / Good</option>
                      <option value="Expert">Expert / Advanced</option>
                    </select>

                    {!disabled && (
                      <>
                        <button
                          type="button"
                          title="Move to Required"
                          onClick={() => handleTogglePreferred(fullIdx)}
                          className="text-[10px] text-red-600 hover:underline px-1"
                        >
                          Make Required
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(fullIdx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <FaTimes size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <span className="text-[11px] text-red-500 block">{error}</span>}
    </div>
  );
};

// ── Main JDMasterForm Component ──────────────────────────────────────────────
const JDMasterForm = forwardRef(
  (
    {
      formData = {},
      setFormData,
      errors = {},
      setErrors,
      mode = "view",
      departments = [],
      designations = [],
    },
    ref
  ) => {
    const isViewMode = mode === "view";
    const [activeSkills, setActiveSkills] = useState([]);
    const [deptList, setDeptList] = useState(departments);
    const [desigList, setDesigList] = useState(designations);

    // Sync or fetch Department master
    useEffect(() => {
      if (departments && departments.length > 0) {
        setDeptList(departments);
      } else {
        fetchUserGroupsByType("DEP")
          .then((res) => {
            const list = (res?.data || []).map((d) => ({
              value: d.group_id,
              label: d.group_name,
            }));
            setDeptList(list);
          })
          .catch((err) => console.error("Could not fetch departments:", err));
      }
    }, [departments]);

    // Sync or fetch Designation master ("DESG")
    useEffect(() => {
      if (designations && designations.length > 0) {
        setDesigList(designations);
      } else {
        fetchUserGroupsByType("DESG")
          .then((res) => {
            const list = (res?.data || []).map((d) => ({
              value: d.group_id,
              label: d.group_name,
            }));
            setDesigList(list);
          })
          .catch((err) => console.error("Could not fetch designations:", err));
      }
    }, [designations]);

    // Fetch Skill Master
    useEffect(() => {
      getActiveSkills()
        .then((res) => {
          if (res?.data) setActiveSkills(res.data);
        })
        .catch((err) => console.error("Could not fetch active skills for JD form:", err));
    }, []);

    const handleChange = (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    };

    return (
      <div ref={ref} className="h-full flex flex-col bg-slate-50 border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">

            {/* ════════════════════ LEFT COLUMN ════════════════════ */}
            <div className="space-y-3 sm:space-y-4">
              {/* ── Section 1: JD Specification & Role ── */}
              <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                <SectionHeader
                  title="Job Description Specification"
                  icon={<FaBriefcase />}
                  barBg="bg-[#e8f0fe]"
                  iconBg="bg-[#1a56db]/15 text-[#1a56db]"
                  text="text-[#0f2137]"
                  border="border-[#c2d1f7]"
                />

                <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* JD Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      JD Code <span className="text-[11px] text-slate-400 font-normal">(Auto)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.jd_code || ""}
                      disabled
                      readOnly
                      placeholder="Auto-assigned (e.g. JD-001)"
                      className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md bg-[#eef1f6] text-slate-600 font-mono font-medium cursor-not-allowed outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status || "Active"}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none bg-white focus:border-blue-500 disabled:bg-[#eef1f6] disabled:text-slate-500 ${
                        formData.status === "Active"
                          ? "border-emerald-300 text-emerald-800 font-medium"
                          : "border-slate-300 text-slate-600 font-medium"
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Job Title * */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Title / Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.job_title || ""}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("job_title", e.target.value)}
                      placeholder="e.g. Senior Full Stack Developer, HR Generalist"
                      className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${
                        errors.job_title ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                      }`}
                    />
                    {errors.job_title && <span className="text-[11px] text-red-500">{errors.job_title}</span>}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <ERPAutocomplete
                      options={deptList.map((d) => d.label)}
                      value={
                        deptList.find((d) => String(d.value) === String(formData.department_id))?.label ||
                        formData.department_name ||
                        ""
                      }
                      onChange={(label) => {
                        const found = deptList.find((d) => d.label === label);
                        handleChange("department_id", found ? found.value : null);
                        handleChange("department_name", label || "");
                      }}
                      disabled={isViewMode}
                      placeholder="Select department..."
                      className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500 disabled:bg-[#eef1f6] disabled:text-slate-500"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation
                    </label>
                    <ERPAutocomplete
                      options={desigList.map((d) => d.label)}
                      value={
                        desigList.find((d) => String(d.value) === String(formData.designation_id))?.label ||
                        formData.designation_name ||
                        ""
                      }
                      onChange={(label) => {
                        const found = desigList.find((d) => d.label === label);
                        handleChange("designation_id", found ? found.value : null);
                        handleChange("designation_name", label || "");
                        if (!formData.job_title && label) {
                          handleChange("job_title", label);
                        }
                      }}
                      disabled={isViewMode}
                      placeholder="Select designation..."
                      className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500 disabled:bg-[#eef1f6] disabled:text-slate-500"
                    />
                  </div>

                  {/* Min Experience */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.min_experience !== undefined && formData.min_experience !== null ? formData.min_experience : 0}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("min_experience", parseFloat(e.target.value) || 0)}
                      className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 disabled:bg-[#eef1f6] disabled:text-slate-500"
                    />
                  </div>

                  {/* Max Experience */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.max_experience !== undefined && formData.max_experience !== null ? formData.max_experience : 0}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("max_experience", parseFloat(e.target.value) || 0)}
                      className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 disabled:bg-[#eef1f6] disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Job Overview & Key Responsibilities ── */}
              <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                <SectionHeader
                  title="Job Overview & Responsibilities"
                  icon={<FaTasks />}
                  barBg="bg-[#f0fdf4]"
                  iconBg="bg-[#16a34a]/15 text-[#16a34a]"
                  text="text-[#0f2137]"
                  border="border-[#bbf7d0]"
                />

                <div className="p-3 sm:p-4 space-y-3">
                  {/* Job Overview Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Overview / Summary
                    </label>
                    <textarea
                      rows={2}
                      value={formData.job_overview || ""}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("job_overview", e.target.value)}
                      placeholder="Provide a concise summary of the job purpose and organizational context..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500"
                    />
                  </div>

                  {/* Key Responsibilities Manager */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Key Responsibilities & Deliverables
                    </label>
                    <ResponsibilitiesManager
                      responsibilities={
                        Array.isArray(formData.key_responsibilities)
                          ? formData.key_responsibilities
                          : typeof formData.key_responsibilities === "string" && formData.key_responsibilities.trim()
                          ? formData.key_responsibilities.split("\n").map((s) => s.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean)
                          : []
                      }
                      onChange={(list) => handleChange("key_responsibilities", list)}
                      disabled={isViewMode}
                      error={errors.key_responsibilities}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════ RIGHT COLUMN ════════════════════ */}
            <div className="space-y-3 sm:space-y-4">
              {/* ── Section 3: Skill Requirements (Linked to Skill Master) ── */}
              <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                <SectionHeader
                  title="Skill Master Requirements"
                  icon={<FaLayerGroup />}
                  barBg="bg-[#fdf4ff]"
                  iconBg="bg-[#9333ea]/15 text-[#9333ea]"
                  text="text-[#0f2137]"
                  border="border-[#f5d0fe]"
                />

                <div className="p-3 sm:p-4">
                  <JDSkillsSection
                    skills={formData.skills || []}
                    onChange={(list) => handleChange("skills", list)}
                    disabled={isViewMode}
                    activeSkills={activeSkills}
                    error={errors.skills}
                  />
                </div>
              </div>

              {/* ── Section 4: Required Qualifications ── */}
              <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                <SectionHeader
                  title="Educational Qualifications"
                  icon={<FaGraduationCap />}
                  barBg="bg-[#eef2ff]"
                  iconBg="bg-[#6366f1]/15 text-[#6366f1]"
                  text="text-[#0f2137]"
                  border="border-[#c7d2fe]"
                />

                <div className="p-3 sm:p-4">
                  <QualificationsInput
                    qualifications={
                      Array.isArray(formData.qualifications)
                        ? formData.qualifications
                        : typeof formData.qualifications === "string" && formData.qualifications.trim()
                        ? formData.qualifications.split(",").map((s) => s.trim()).filter(Boolean)
                        : []
                    }
                    onChange={(list) => handleChange("qualifications", list)}
                    disabled={isViewMode}
                    error={errors.qualifications}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

export default JDMasterForm;
