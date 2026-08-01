import React, { memo } from "react";
import {
  FaBuilding, FaPhoneAlt, FaIdCard, FaCertificate, FaMapMarkerAlt, 
  FaCreditCard, FaMoneyBillWave, FaCogs, FaFileAlt, FaEnvelope, FaGlobe, FaShieldAlt,
  FaExclamationTriangle, FaLink, FaTruck, FaGavel, FaCheckCircle, FaClipboardList, FaBalanceScale,
  FaUser,
  FaFirstAid,
  FaSearch
} from "react-icons/fa";


export const TabIcon = memo(({ tab }) => {
  const t = (tab || "").toLowerCase();
  const baseClass = "text-[15px]";

  // ===== Recall sections =====
  if (t.includes("linked reference")) return <FaLink className={baseClass} />;
  if (t.includes("distribution") || t.includes("quantity")) return <FaTruck className={baseClass} />;
  if (t.includes("regulatory")) return <FaGavel className={baseClass} />;
  if (t.includes("effectiveness") || t.includes("closure")) return <FaCheckCircle className={baseClass} />;

  // ===== Deviation sections =====
// ===== Deviation sections =====
if (t.includes("deviation details")) return <FaExclamationTriangle className={baseClass} />;
if (t.includes("investigation details")) return <FaClipboardList className={baseClass} />;
if (t.includes("root cause analysis")) return <FaGavel className={baseClass} />;
if (t.includes("impact assessment")) return <FaBalanceScale className={baseClass} />;
if (t === "capa") return <FaCogs className={baseClass} />;
if (t.includes("qa review") || t.includes("closure")) return <FaCheckCircle className={baseClass} />;

  // generic
  if (t.includes("recall")) return <FaExclamationTriangle className={baseClass} />;
  if (t.includes("document")) return <FaFileAlt className={baseClass} />;
  return <FaFileAlt className={baseClass} />;
});
export const getHeaderStyle = (title) => {
  const t = (title || "").toLowerCase();

  const commonStyle = {
    barBg: "bg-[#ECF2FA]",
    iconBg: "bg-[#2563EB]/15 text-[#2563EB]",
    text: "text-[#2563EB]",
    border: "border-[#bae6fd]",
    icon: "📄",
  };

  // ===== Recall sections =====
  if (t.includes("recall details"))
    return { ...commonStyle, icon: <FaExclamationTriangle /> };
  if (t.includes("linked reference"))
    return { ...commonStyle, icon: <FaLink /> };
  if (t.includes("distribution") || t.includes("quantity"))
    return { ...commonStyle, icon: <FaTruck /> };
  if (t.includes("regulatory"))
    return { ...commonStyle, icon: <FaGavel /> };
  if (t.includes("effectiveness") || t.includes("closure"))
    return { ...commonStyle, icon: <FaCheckCircle /> };

  // ===== Deviation sections =====
  if (t.includes("deviation information"))
    return { ...commonStyle, icon: <FaExclamationTriangle /> };
  if (t.includes("batch") || t.includes("reporting"))
    return { ...commonStyle, icon: <FaTruck /> };
  if (t.includes("investigation") || t.includes("root cause"))
    return { ...commonStyle, icon: <FaGavel /> };
  if (t.includes("disposition"))
    return { ...commonStyle, icon: <FaCheckCircle /> };

  // generic recall
  if (t.includes("recall"))
    return { ...commonStyle, icon: <FaExclamationTriangle /> };
  if (t.includes("incident details"))
  return { ...commonStyle, icon: <FaExclamationTriangle /> };
if (t.includes("reporting information"))
  return { ...commonStyle, icon: <FaUser /> };
if (t.includes("incident description"))
  return { ...commonStyle, icon: <FaFileAlt /> };
if (t.includes("immediate action"))
  return { ...commonStyle, icon: <FaFirstAid /> };
if (t.includes("impact") || t.includes("investigation"))
  return { ...commonStyle, icon: <FaSearch /> };
if (t.includes("closure"))
  return { ...commonStyle, icon: <FaCheckCircle /> };

  // ===== DEFAULT =====
  return { ...commonStyle, icon: <FaFileAlt /> };
};
export const widthConfig = {
  "Reason for Recall": "col-span-full",
  "Distribution Details (Parties, Regions, Export)": "col-span-full",
  "Recall Effectiveness Check Summary": "col-span-full",
  "Recovered Stock Disposition / Destruction Details": "col-span-full",
  // widthConfig (existing object) mein ye 5 naye entries add karo
"Incident Description": "col-span-full",
"Immediate Action / Containment": "col-span-full",
"Impact Assessment": "col-span-full",
"Root Cause": "col-span-full",
"Investigation Summary": "col-span-full",
"Trainees & Scores (One per line: Name — Dept — Score — Pass/Fail/Retrain)":"col-span-full"
};
