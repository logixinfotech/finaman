import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FaGraduationCap,
  FaTools,
  FaCar,
  FaFileAlt,
  FaPlus,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaBriefcase,
  FaLink,
  FaUnlink,
} from "react-icons/fa";
import ERPAutocomplete from "../../../Reusable/input/ERPAutocomplete";
import { getActiveSkills, getActiveJDs, getJDById } from "../../../../utils/recruitmentApi";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b font-medium text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

const TRAVEL_FREQUENCIES = ["Occasional (1-2 times/mo)", "Moderate (1-2 times/wk)", "Frequent (Daily/Multi-city)"];

const TagInput = ({ tags = [], onAdd, onRemove, placeholder, disabled, label, required, error }) => {
  const [val, setVal] = useState("");

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      onAdd(val.trim());
      setVal("");
    }
  };

  const handleAddClick = () => {
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`min-h-[34px] p-1 border rounded-md bg-white flex flex-wrap items-center gap-1.5 ${error ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
          }`}
      >
        {tags.map((t, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200"
          >
            {typeof t === "string" ? t : t.qualification_name || t.skill_name || t.industry_name || t.language_name || t.source_name}
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-blue-500 hover:text-red-600 focus:outline-none"
              >
                <FaTimes size={9} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <div className="flex items-center gap-1 flex-1 min-w-[100px]">
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : "Add more & press Enter..."}
              className="flex-1 text-xs border-none outline-none px-1 h-[24px] bg-transparent text-slate-700 placeholder:text-slate-400 min-w-0"
            />
            {val.trim() && (
              <button
                type="button"
                onClick={handleAddClick}
                className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none flex-shrink-0"
              >
                <FaPlus size={10} />
              </button>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
};

// ── Skill Multi-Select backed by Skill Master ─────────────────────────────────
const SkillMultiSelect = ({
  label,
  required,
  selectedSkills = [],
  availableSkills = [],
  onAddSkill,
  onRemoveSkill,
  disabled,
  error,
  placeholder = "Select skill from Skill Master...",
  isPreferred = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  // Selected skill codes/names for exclusion
  const selectedIds = useMemo(() => {
    const set = new Set();
    selectedSkills.forEach((s) => {
      const code = typeof s === "object" ? s.skill_id || s.skill_code : null;
      const name = typeof s === "object" ? s.skill_name : s;
      if (code) set.add(code.toLowerCase());
      if (name) set.add(name.toLowerCase());
    });
    return set;
  }, [selectedSkills]);

  // Filter available skills (Only active & not already selected)
  const filteredOptions = useMemo(() => {
    return availableSkills.filter((sk) => {
      const code = (sk.skill_code || "").toLowerCase();
      const name = (sk.skill_name || "").toLowerCase();
      if (selectedIds.has(code) || selectedIds.has(name)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        name.includes(q) ||
        code.includes(q) ||
        (sk.skill_category && sk.skill_category.toLowerCase().includes(q))
      );
    });
  }, [availableSkills, selectedIds, search]);

  const handleSelect = (skillItem) => {
    onAddSkill(skillItem);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Chips Container */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={`min-h-[34px] p-1 border rounded-md bg-white flex flex-wrap items-center gap-1.5 transition-all ${disabled ? "bg-[#eef1f6] cursor-not-allowed border-slate-200" : "cursor-pointer hover:border-slate-400"
          } ${error ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"}`}
      >
        {selectedSkills.map((s, idx) => {
          const sName = typeof s === "object" ? s.skill_name : s;
          const sCode = typeof s === "object" ? s.skill_id || s.skill_code : null;

          return (
            <span
              key={sCode || sName || idx}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${isPreferred
                ? "bg-purple-50 text-purple-800 border-purple-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
            >
              {sCode && (
                <span className={`font-mono text-[10px] font-semibold ${isPreferred ? "text-purple-600" : "text-blue-600"}`}>
                  [{sCode}]
                </span>
              )}
              <span>{sName}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSkill(s);
                  }}
                  className={`${isPreferred ? "text-purple-500 hover:text-red-600" : "text-blue-500 hover:text-red-600"} focus:outline-none ml-0.5`}
                >
                  <FaTimes size={9} />
                </button>
              )}
            </span>
          );
        })}

        {!disabled && (
          <div className="flex items-center gap-1 flex-1 min-w-[120px] px-1 py-0.5 text-xs text-slate-400">
            {selectedSkills.length === 0 ? (
              <span className="text-slate-400 select-none flex items-center justify-between w-full">
                <span>{placeholder}</span>
                <FaChevronDown size={9} className="text-slate-400 ml-1" />
              </span>
            ) : (
              <span className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1">
                <FaPlus size={8} /> Add skill
              </span>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-[11px] text-red-500">{error}</span>}

      {/* Dropdown Options Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-300 rounded-md shadow-lg max-h-56 overflow-hidden flex flex-col text-xs">
          {/* Search bar within dropdown */}
          <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex items-center gap-1.5">
            <FaSearch size={10} className="text-slate-400 ml-1" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skill by name or ID..."
              className="w-full h-[26px] px-1.5 text-xs border border-slate-300 rounded outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* List of Skills */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px]">
                {availableSkills.length === 0
                  ? "No active skills found in Skill Master."
                  : "No matching skills available."}
              </div>
            ) : (
              filteredOptions.map((item) => (
                <div
                  key={item.skill_id || item.skill_code}
                  onClick={() => handleSelect(item)}
                  className="px-2.5 py-1.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-semibold text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                      {item.skill_code}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{item.skill_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                    {item.skill_category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Tab3JobRequirement = ({
  formData = {},
  setFormData,
  onChange,
  errors = {},
  isViewMode = false,
  skillOptions = [],
  jdOptions = [],
}) => {
  const travelReq = !!formData.travel_required;
  const [internalSkills, setInternalSkills] = useState(skillOptions);
  const [internalJDs, setInternalJDs] = useState(jdOptions);
  const [selectedJdId, setSelectedJdId] = useState(formData.jd_id || "");

  // Fallback: Fetch active skills if skillOptions wasn't supplied
  useEffect(() => {
    if (skillOptions && skillOptions.length > 0) {
      setInternalSkills(skillOptions);
    } else {
      getActiveSkills()
        .then((res) => {
          if (res?.data) setInternalSkills(res.data);
        })
        .catch((err) => console.error("Could not fetch active skills:", err));
    }
  }, [skillOptions]);

  // Fallback: Fetch active JDs if jdOptions wasn't supplied
  useEffect(() => {
    if (jdOptions && jdOptions.length > 0) {
      setInternalJDs(jdOptions);
    } else {
      getActiveJDs()
        .then((res) => {
          if (res?.data) setInternalJDs(res.data);
        })
        .catch((err) => console.error("Could not fetch active JDs:", err));
    }
  }, [jdOptions]);

  // Keep selectedJdId in sync with formData
  useEffect(() => {
    setSelectedJdId(formData.jd_id || "");
  }, [formData.jd_id]);

  // ── Handle JD Selection & Auto-Population ──
  const handleSelectJD = async (jdIdVal) => {
    if (!jdIdVal) {
      onChange("jd_id", null);
      setSelectedJdId("");
      return;
    }

    const jdObj = internalJDs.find((j) => String(j.jd_id) === String(jdIdVal));
    let fullJD = jdObj;

    // Fetch full JD details if skills or responsibilities need hydration
    try {
      const res = await getJDById(jdIdVal);
      if (res?.data) {
        fullJD = res.data;
      }
    } catch (e) {
      console.warn("Could not fetch full JD detail, using list item", e);
    }

    if (!fullJD) return;

    setSelectedJdId(fullJD.jd_id);

    // Format responsibilities
    let respText = "";
    if (Array.isArray(fullJD.key_responsibilities)) {
      respText = fullJD.key_responsibilities.map((r) => `• ${r}`).join("\n");
    } else if (typeof fullJD.key_responsibilities === "string") {
      respText = fullJD.key_responsibilities;
    }

    // Format qualifications
    let qualList = [];
    if (Array.isArray(fullJD.qualifications)) {
      qualList = fullJD.qualifications.map((q) =>
        typeof q === "string" ? { qualification_name: q, is_preferred: 0 } : q
      );
    } else if (typeof fullJD.qualifications === "string" && fullJD.qualifications.trim()) {
      qualList = fullJD.qualifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((q) => ({ qualification_name: q, is_preferred: 0 }));
    }

    // Format skills
    const mappedSkills = (fullJD.skills || []).map((sk) => ({
      skill_id: sk.skill_id || sk.skill_code,
      skill_name: sk.skill_name,
      is_preferred: sk.is_preferred ? 1 : 0,
      proficiency_level: sk.proficiency_level || "Intermediate",
    }));

    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        jd_id: fullJD.jd_id,
        job_summary: fullJD.job_overview || prev.job_summary || "",
        job_responsibilities: respText || prev.job_responsibilities || "",
        min_experience_years:
          fullJD.min_experience !== undefined && fullJD.min_experience !== null
            ? fullJD.min_experience
            : prev.min_experience_years,
        max_experience_years:
          fullJD.max_experience !== undefined && fullJD.max_experience !== null
            ? fullJD.max_experience
            : prev.max_experience_years,
        qualifications: qualList.length > 0 ? qualList : prev.qualifications,
        skills: mappedSkills.length > 0 ? mappedSkills : prev.skills,
      }));
    } else {
      onChange("jd_id", fullJD.jd_id);
      if (fullJD.job_overview) onChange("job_summary", fullJD.job_overview);
      if (respText) onChange("job_responsibilities", respText);
      if (mappedSkills.length > 0) onChange("skills", mappedSkills);
      if (qualList.length > 0) onChange("qualifications", qualList);
      if (fullJD.min_experience !== undefined) onChange("min_experience_years", fullJD.min_experience);
      if (fullJD.max_experience !== undefined) onChange("max_experience_years", fullJD.max_experience);
    }
  };

  const handleUnlinkJD = () => {
    onChange("jd_id", null);
    setSelectedJdId("");
  };

  const currentJD = internalJDs.find((j) => String(j.jd_id) === String(selectedJdId));

  // Separate required skills vs preferred skills
  const requiredSkills = useMemo(() => {
    return (formData.skills || []).filter(
      (s) => !s.is_preferred || s.is_preferred === 0 || s.is_preferred === "0" || s.is_preferred === false
    );
  }, [formData.skills]);

  const preferredSkills = useMemo(() => {
    return (formData.skills || []).filter(
      (s) => s.is_preferred === 1 || s.is_preferred === "1" || s.is_preferred === true
    );
  }, [formData.skills]);

  // Add Required Skill
  const handleAddRequiredSkill = (skillItem) => {
    const newSkill = {
      skill_id: skillItem.skill_code || String(skillItem.skill_id),
      skill_name: skillItem.skill_name,
      is_preferred: 0,
    };
    onChange("skills", [...(formData.skills || []), newSkill]);
  };

  // Remove Required Skill
  const handleRemoveRequiredSkill = (skillToRemove) => {
    const codeOrName = typeof skillToRemove === "object" ? skillToRemove.skill_id || skillToRemove.skill_name : skillToRemove;
    const updated = (formData.skills || []).filter((s) => {
      const match = (s.skill_id && s.skill_id === codeOrName) || (s.skill_name && s.skill_name === codeOrName) || s === skillToRemove;
      const isReq = !s.is_preferred || s.is_preferred === 0 || s.is_preferred === "0" || s.is_preferred === false;
      return !(match && isReq);
    });
    onChange("skills", updated);
  };

  // Add Preferred Skill
  const handleAddPreferredSkill = (skillItem) => {
    const newSkill = {
      skill_id: skillItem.skill_code || String(skillItem.skill_id),
      skill_name: skillItem.skill_name,
      is_preferred: 1,
    };
    onChange("skills", [...(formData.skills || []), newSkill]);
  };

  // Remove Preferred Skill
  const handleRemovePreferredSkill = (skillToRemove) => {
    const codeOrName = typeof skillToRemove === "object" ? skillToRemove.skill_id || skillToRemove.skill_name : skillToRemove;
    const updated = (formData.skills || []).filter((s) => {
      const match = (s.skill_id && s.skill_id === codeOrName) || (s.skill_name && s.skill_name === codeOrName) || s === skillToRemove;
      const isPref = s.is_preferred === 1 || s.is_preferred === "1" || s.is_preferred === true;
      return !(match && isPref);
    });
    onChange("skills", updated);
  };

  return (
    <div className="space-y-4">
      {/* ── Top JD Master Link Bar ── */}
      <div className="bg-white border border-blue-200 rounded-md p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-blue-50/50 via-indigo-50/30 to-white">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-md bg-blue-600 text-white shadow-2xs">
            <FaBriefcase size={14} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800">Job Description (JD) Master Link</h4>
              {currentJD ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <FaLink size={9} /> Linked: {currentJD.jd_code}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Optional Template
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Select a standardized JD Master to auto-populate responsibilities, skills, and qualifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedJdId || ""}
            disabled={isViewMode}
            onChange={(e) => handleSelectJD(e.target.value)}
            className="w-full sm:w-64 h-[32px] px-2.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 font-medium text-slate-700"
          >
            <option value="">-- Choose Job Description --</option>
            {internalJDs.map((jd) => (
              <option key={jd.jd_id} value={jd.jd_id}>
                {jd.jd_code} - {jd.job_title}
              </option>
            ))}
          </select>

          {selectedJdId && !isViewMode && (
            <button
              type="button"
              onClick={handleUnlinkJD}
              title="Unlink JD Master"
              className="h-[32px] px-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-300 hover:border-red-200 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
            >
              <FaUnlink size={11} /> Unlink
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* ── Section 1: Job Description & Responsibilities ── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
          <SectionHeader
            title="Job Description & Responsibilities"
            icon={<FaFileAlt />}
            barBg="bg-[#e8f0fe]"
            iconBg="bg-[#1a56db]/15 text-[#1a56db]"
            text="text-[#0f2137]"
            border="border-[#c2d1f7]"
          />
          <div className="p-4 space-y-3">
            {/* Job Summary */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Job Summary / Overview <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.job_summary || ""}
                disabled={isViewMode}
                onChange={(e) => onChange("job_summary", e.target.value)}
                placeholder="Provide a concise summary of the position scope and purpose..."
                className={`w-full px-2.5 py-1.5 text-xs border rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${errors.job_summary ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                  }`}
              />
              {errors.job_summary && <span className="text-[11px] text-red-500">{errors.job_summary}</span>}
            </div>

            {/* Job Responsibilities */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Key Responsibilities & Deliverables <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.job_responsibilities || ""}
                disabled={isViewMode}
                onChange={(e) => onChange("job_responsibilities", e.target.value)}
                placeholder="List daily duties, core deliverables, and performance expectations..."
                className={`w-full px-2.5 py-1.5 text-xs border rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${errors.job_responsibilities ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                  }`}
              />
              {errors.job_responsibilities && (
                <span className="text-[11px] text-red-500">{errors.job_responsibilities}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Qualifications & Experience ── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
          <SectionHeader
            title="Qualifications & Experience"
            icon={<FaGraduationCap />}
            barBg="bg-[#eef2ff]"
            iconBg="bg-[#6366f1]/15 text-[#6366f1]"
            text="text-[#0f2137]"
            border="border-[#c7d2fe]"
          />
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <TagInput
                label="Required Qualifications"
                required
                tags={formData.qualifications || []}
                onAdd={(item) =>
                  onChange("qualifications", [
                    ...(formData.qualifications || []),
                    { qualification_name: item, is_preferred: 0 },
                  ])
                }
                onRemove={(idx) =>
                  onChange("qualifications", (formData.qualifications || []).filter((_, i) => i !== idx))
                }
                placeholder="Type qualification (e.g. B.Tech, MBA, MCA) and press Enter"
                disabled={isViewMode}
                error={errors.qualifications}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Min Experience (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.min_experience_years || 0}
                disabled={isViewMode}
                onChange={(e) => onChange("min_experience_years", e.target.value)}
                className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none focus:border-blue-500 ${errors.min_experience_years ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                  }`}
              />
              {errors.min_experience_years && (
                <span className="text-[11px] text-red-500">{errors.min_experience_years}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Max Experience (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.max_experience_years || 0}
                disabled={isViewMode}
                onChange={(e) => onChange("max_experience_years", e.target.value)}
                className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none focus:border-blue-500 ${errors.max_experience_years ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                  }`}
              />
              {errors.max_experience_years && (
                <span className="text-[11px] text-red-500">{errors.max_experience_years}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Skills & Domain Experience ── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
          <SectionHeader
            title="Skills & Domain Experience"
            icon={<FaTools />}
            barBg="bg-[#ecfdf5]"
            iconBg="bg-[#10b981]/15 text-[#059669]"
            text="text-[#0f2137]"
            border="border-[#a7f3d0]"
          />
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Required Skills (Skill Master Linked) */}
            <SkillMultiSelect
              label="Required Skills / Competencies"
              required
              selectedSkills={requiredSkills}
              availableSkills={internalSkills}
              onAddSkill={handleAddRequiredSkill}
              onRemoveSkill={handleRemoveRequiredSkill}
              disabled={isViewMode}
              error={errors.skills}
              placeholder="Select required skill..."
              isPreferred={false}
            />

            {/* Preferred Skills (Skill Master Linked) */}
            <SkillMultiSelect
              label="Preferred / Good-to-have Skills"
              selectedSkills={preferredSkills}
              availableSkills={internalSkills}
              onAddSkill={handleAddPreferredSkill}
              onRemoveSkill={handleRemovePreferredSkill}
              disabled={isViewMode}
              placeholder="Select preferred skill..."
              isPreferred={true}
            />

            <TagInput
              label="Industry / Domain Experience"
              tags={formData.industries || []}
              onAdd={(item) =>
                onChange("industries", [...(formData.industries || []), { industry_name: item }])
              }
              onRemove={(idx) =>
                onChange("industries", (formData.industries || []).filter((_, i) => i !== idx))
              }
              placeholder="e.g. Pharma, Manufacturing, IT Services"
              disabled={isViewMode}
            />

            <div>
              <TagInput
                label="Required / Preferred Languages"
                tags={formData.languages || []}
                onAdd={(item) =>
                  onChange("languages", [...(formData.languages || []), { language_name: item }])
                }
                onRemove={(idx) =>
                  onChange("languages", (formData.languages || []).filter((_, i) => i !== idx))
                }
                placeholder="e.g. English, Hindi, German"
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>

        {/* ── Section 4: Mobility & Field Conditions ── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
          <SectionHeader
            title="Mobility & Field Requirements"
            icon={<FaCar />}
            barBg="bg-[#fff7ed]"
            iconBg="bg-[#f97316]/15 text-[#f97316]"
            text="text-[#0f2137]"
            border="border-[#ffedd5]"
          />
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            {/* Travel Required */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Travel Required?</label>
              <select
                value={formData.travel_required ? "Yes" : "No"}
                disabled={isViewMode}
                onChange={(e) => {
                  const yes = e.target.value === "Yes";
                  onChange("travel_required", yes);
                  if (!yes) onChange("travel_frequency", "");
                }}
                className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Travel Frequency (Conditional) */}
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${travelReq ? "text-slate-800 font-semibold" : "text-slate-400"
                  }`}
              >
                Travel Frequency {travelReq && <span className="text-red-500">*</span>}
              </label>
              <ERPAutocomplete
                options={TRAVEL_FREQUENCIES}
                value={formData.travel_frequency || ""}
                onChange={(val) => onChange("travel_frequency", val)}
                disabled={!travelReq || isViewMode}
                placeholder={travelReq ? "Select frequency..." : "N/A"}
                className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${!travelReq
                  ? "bg-[#eef1f6] text-slate-400 border-slate-200 cursor-not-allowed"
                  : errors.travel_frequency
                    ? "border-red-500 ring-1 ring-red-200"
                    : "border-slate-300 bg-white"
                  }`}
              />
              {errors.travel_frequency && (
                <span className="text-[11px] text-red-500">{errors.travel_frequency}</span>
              )}
            </div>

            {/* Driving Licence Required */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Driving Licence Required?
              </label>
              <select
                value={formData.driving_licence_req ? "Yes" : "No"}
                disabled={isViewMode}
                onChange={(e) => onChange("driving_licence_req", e.target.value === "Yes")}
                className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Vehicle Required */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Personal Vehicle Required?
              </label>
              <select
                value={formData.vehicle_required ? "Yes" : "No"}
                disabled={isViewMode}
                onChange={(e) => onChange("vehicle_required", e.target.value === "Yes")}
                className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Client Visit Required */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client Visit Required?</label>
              <select
                value={formData.client_visit_required ? "Yes" : "No"}
                disabled={isViewMode}
                onChange={(e) => onChange("client_visit_required", e.target.value === "Yes")}
                className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab3JobRequirement;