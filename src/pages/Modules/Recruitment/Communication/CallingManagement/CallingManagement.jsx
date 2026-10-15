import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
	PhoneForwarded,
	PhoneCall,
	RotateCcw,
	AlertTriangle,
	Search,
	RefreshCw,
	PauseCircle,
	Users,
	UserCheck,
	FileCheck2,
	Building2,
	Sparkles,
	Award,
} from "lucide-react";
import Table from "../../../../../components/Reusable/table/Table";
import { showToast } from "../../../../../components/Reusable/alert";
import { formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import { getCallingQueue, getActiveVacanciesWithJD } from "../../../../../utils/communicationApi";
import { getPipelineRecruiters } from "../../../../../utils/recruitmentApi";
import UniversalCallModal from "../components/UniversalCallModal";
import GlobalWhatsAppModal from "../../../../../components/Reusable/whatsapp/GlobalWhatsAppModal";
import { initials, timeAgo } from "../../CandidateTracking/pipelineConstants";
import { SOURCE_CHANNELS, dispositionDot } from "../communicationConstants";
import { BaseButton, RefreshButton, ResetButton } from "../../../../../components/Reusable/button/ActionButon";

const EMPTY_FILTERS = { vacancy_id: "All", recruiter_id: "All", source: "All", search: "" };

// true below Tailwind's `md` breakpoint (768px) -> table switches to card list
const useIsMobile = (breakpoint = 768) => {
	const query = `(max-width: ${breakpoint - 1}px)`;
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" ? window.matchMedia(query).matches : false
	);
	useEffect(() => {
		const mq = window.matchMedia(query);
		const onChange = (e) => setIsMobile(e.matches);
		setIsMobile(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [query]);
	return isMobile;
};

// Dynamic stage resolution strictly following Ref No.: LI/HR/TM/04/009
export const resolveCandidateStage = (row) => {
	const status = (row.current_status_base || row.current_status || "").trim();
	if (status.startsWith("Raw Data") || status.includes("Raw Data")) return 1;
	if (status.includes("Screening") || status === "Qualified & Interested") return 2;
	if (status.startsWith("Assessment") || status.includes("Assessment Cleared")) return 3;
	if (status.includes("Selected - Assessment") || status.startsWith("Round 1") || status.includes("Round 1")) return 4;
	if (status.includes("Selected - Round 1") || status.startsWith("Round 2") || status.includes("Round 2")) return 5;
	if (status.includes("Selected - Round 2") || status.startsWith("Final Round") || status.includes("Final Round")) return 6;
	if (status.includes("Offer") || status.includes("Joining") || status.includes("Joined")) return 7;
	return Number(row.current_stage) || 1;
};

// Filter options with counts and aesthetic tones
const STAGE_FILTERS = [
	{ key: "all", label: "All Active", sub: "All Stages", Icon: Users, tone: "slate" },
	{ key: "attempt1", label: "Fresh / Attempt 1", sub: "Stage 1 Raw Data", Icon: PhoneCall, tone: "purple" },
	{ key: "attempt2", label: "Attempt 2", sub: "Stage 1 Raw Data", Icon: RotateCcw, tone: "sky" },
	{ key: "attempt3", label: "Attempt 3 (Final)", sub: "Stage 1 Raw Data", Icon: AlertTriangle, tone: "rose" },
	{ key: "stage2", label: "Stage 2 · Screening", sub: "Initial Screening", Icon: UserCheck, tone: "teal" },
	{ key: "stage3", label: "Stage 3 · Assessment", sub: "Assessment Review", Icon: FileCheck2, tone: "amber" },
	{ key: "stage4", label: "Stage 4 · Round 1", sub: "Telephonic Interview", Icon: PhoneForwarded, tone: "blue" },
	{ key: "stage5", label: "Stage 5 · Round 2", sub: "Walk-in / Task", Icon: Building2, tone: "indigo" },
	{ key: "stage6", label: "Stage 6 · Final", sub: "Management Round", Icon: Award, tone: "violet" },
	{ key: "stage7", label: "Stage 7 · Offer", sub: "Offer & Onboarding", Icon: Sparkles, tone: "emerald" },
	{ key: "hold", label: "On Hold", sub: "Parked Profiles", Icon: PauseCircle, tone: "gray" },
];

const TONES = {
	purple: {
		banner: "bg-[#faf5ff] border-[#e9d5ff] text-[#6b21a8]",
		badge: "bg-[#7e22ce] text-white",
		btn: "bg-[#6d28d9] hover:bg-[#5b21b6] text-white",
		filterOn: "bg-purple-100 text-purple-900 border-purple-400 ring-1 ring-purple-300",
		filterBadge: "bg-purple-200 text-purple-950",
		icon: "text-purple-600",
	},
	sky: {
		banner: "bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1]",
		badge: "bg-[#0284c7] text-white",
		btn: "bg-[#0284c7] hover:bg-[#0369a1] text-white",
		filterOn: "bg-sky-100 text-sky-900 border-sky-400 ring-1 ring-sky-300",
		filterBadge: "bg-sky-200 text-sky-950",
		icon: "text-sky-600",
	},
	rose: {
		banner: "bg-[#fff1f2] border-[#fecdd3] text-[#be123c]",
		badge: "bg-[#e11d48] text-white",
		btn: "bg-[#e11d48] hover:bg-[#be123c] text-white",
		filterOn: "bg-rose-100 text-rose-900 border-rose-400 ring-1 ring-rose-300",
		filterBadge: "bg-rose-200 text-rose-950",
		icon: "text-rose-600",
	},
	teal: {
		banner: "bg-[#f0fdfa] border-[#99f6e4] text-[#0f766e]",
		badge: "bg-[#0d9488] text-white",
		btn: "bg-[#0d9488] hover:bg-[#0f766e] text-white",
		filterOn: "bg-teal-100 text-teal-900 border-teal-400 ring-1 ring-teal-300",
		filterBadge: "bg-teal-200 text-teal-950",
		icon: "text-teal-600",
	},
	amber: {
		banner: "bg-[#fffbeb] border-[#fde68a] text-[#b45309]",
		badge: "bg-[#d97706] text-white",
		btn: "bg-[#d97706] hover:bg-[#b45309] text-white",
		filterOn: "bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-300",
		filterBadge: "bg-amber-200 text-amber-950",
		icon: "text-amber-600",
	},
	blue: {
		banner: "bg-[#eff6ff] border-[#bfdbfe] text-[#1d4ed8]",
		badge: "bg-[#2563eb] text-white",
		btn: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white",
		filterOn: "bg-blue-100 text-blue-900 border-blue-400 ring-1 ring-blue-300",
		filterBadge: "bg-blue-200 text-blue-950",
		icon: "text-blue-600",
	},
	indigo: {
		banner: "bg-[#eef2ff] border-[#c7d2fe] text-[#4338ca]",
		badge: "bg-[#4f46e5] text-white",
		btn: "bg-[#4f46e5] hover:bg-[#4338ca] text-white",
		filterOn: "bg-indigo-100 text-indigo-900 border-indigo-400 ring-1 ring-indigo-300",
		filterBadge: "bg-indigo-200 text-indigo-950",
		icon: "text-indigo-600",
	},
	violet: {
		banner: "bg-[#f5f3ff] border-[#ddd6fe] text-[#6d28d9]",
		badge: "bg-[#7c3aed] text-white",
		btn: "bg-[#7c3aed] hover:bg-[#6d28d9] text-white",
		filterOn: "bg-violet-100 text-violet-900 border-violet-400 ring-1 ring-violet-300",
		filterBadge: "bg-violet-200 text-violet-950",
		icon: "text-violet-600",
	},
	emerald: {
		banner: "bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]",
		badge: "bg-[#059669] text-white",
		btn: "bg-[#059669] hover:bg-[#047857] text-white",
		filterOn: "bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-300",
		filterBadge: "bg-emerald-200 text-emerald-950",
		icon: "text-emerald-600",
	},
	gray: {
		banner: "bg-[#f8fafc] border-[#cbd5e1] text-[#334155]",
		badge: "bg-[#475569] text-white",
		btn: "bg-[#475569] hover:bg-[#334155] text-white",
		filterOn: "bg-slate-200 text-slate-900 border-slate-400 ring-1 ring-slate-300",
		filterBadge: "bg-slate-300 text-slate-950",
		icon: "text-slate-600",
	},
	slate: {
		banner: "bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a]",
		badge: "bg-[#0f172a] text-white",
		btn: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white",
		filterOn: "bg-slate-800 text-white border-slate-900 ring-1 ring-slate-700",
		filterBadge: "bg-blue-500 text-white",
		icon: "text-blue-400",
	},
};

// Contextual action generator according to Specification LI/HR/TM/04/009
export const getActionInfo = (row) => {
	const status = (row.current_status_base || row.current_status || "").trim();
	const stageNo = resolveCandidateStage(row);
	const attempts = Number(row.call_attempts_current_stage || 0);

	if (stageNo === 1) {
		if (status === "Raw Data - Callback Scheduled") return { label: "Call Back (Due)", tone: "amber", icon: "phone" };
		if (status === "Raw Data - Screening In Progress") return { label: "Screen Candidate", tone: "purple", icon: "user" };
		if (attempts === 0 || status === "Raw Data - Sourced") return { label: "Dial Attempt 1", tone: "purple", icon: "phone" };
		if (attempts === 1 || status === "Raw Data - Call Attempt 1 Unanswered") return { label: "Dial Attempt 2", tone: "sky", icon: "rotate" };
		return { label: "Final Dial (3)", tone: "rose", icon: "alert" };
	}
	if (stageNo === 2) {
		if (status === "Qualified & Interested") return { label: "Call & Screen", tone: "teal", icon: "phone" };
		if (status === "Screening Cleared - Comm Pending") return { label: "Assign Assessment", tone: "teal", icon: "file" };
		return { label: "Call & Screen", tone: "teal", icon: "phone" };
	}
	if (stageNo === 3) {
		if (status === "Assessment Cleared - Eligible for Round 1") return { label: "Schedule Round 1", tone: "amber", icon: "calendar" };
		if (status === "Assessment - Submitted & Under Review") return { label: "Evaluate Score", tone: "amber", icon: "check" };
		if (status === "Assessment - Link Dispatched") return { label: "Follow-up / Remind", tone: "amber", icon: "phone" };
		return { label: "Call & Review", tone: "amber", icon: "phone" };
	}
	if (stageNo === 4) {
		if (status === "Selected - Assessment (Comm Pending)") return { label: "Schedule Round 1", tone: "blue", icon: "calendar" };
		if (status === "Round 1 - Call Attempt 1 Unanswered") return { label: "Dial R1 (Attempt 2)", tone: "sky", icon: "rotate" };
		if (status === "Round 1 - Not Appeared") return { label: "Follow-up / Reschedule", tone: "rose", icon: "alert" };
		if (status === "Round 1 - In Evaluation") return { label: "Scorecard Evaluation", tone: "blue", icon: "file" };
		if (status === "Selected - Round 1") return { label: "Schedule Round 2", tone: "blue", icon: "calendar" };
		return { label: "Dial Interview 1", tone: "blue", icon: "phone" };
	}
	if (stageNo === 5) {
		if (status === "Selected - Round 1 (Comm Pending)") return { label: "Schedule Round 2", tone: "indigo", icon: "calendar" };
		if (status === "Round 2 - Call Attempt 1 Unanswered") return { label: "Dial R2 (Attempt 2)", tone: "sky", icon: "rotate" };
		if (status === "Round 2 - Not Appeared") return { label: "Follow-up / Reschedule", tone: "rose", icon: "alert" };
		if (status === "Round 2 - Practical / Task In Progress") return { label: "Evaluate Practical Task", tone: "indigo", icon: "file" };
		if (status === "Selected - Round 2") return { label: "Schedule Final Round", tone: "indigo", icon: "calendar" };
		return { label: "Dial Interview 2", tone: "indigo", icon: "phone" };
	}
	if (stageNo === 6) {
		if (status === "Selected - Round 2 (Comm Pending)") return { label: "Schedule Final Round", tone: "violet", icon: "calendar" };
		if (status === "Final Round - Call Attempt 1 Unanswered") return { label: "Dial Final (Attempt 2)", tone: "sky", icon: "rotate" };
		if (status === "Final Round - Not Appeared") return { label: "Follow-up / Reschedule", tone: "rose", icon: "alert" };
		if (status === "Final Round - Under Management Review") return { label: "Management Sign-off", tone: "violet", icon: "file" };
		if (status === "Selected - Final Round") return { label: "Prepare Offer", tone: "violet", icon: "check" };
		return { label: "Dial Final Round", tone: "violet", icon: "phone" };
	}
	if (stageNo === 7) {
		if (status === "Selected - Final Round (Offer Pending)") return { label: "Release Offer", tone: "emerald", icon: "sparkles" };
		if (status === "Offer - Released") return { label: "Follow-up Acceptance", tone: "emerald", icon: "phone" };
		if (status === "Offer - Accepted / Joining Confirmed") return { label: "Onboarding Checklist", tone: "emerald", icon: "check" };
		return { label: "Dial Offer Call", tone: "emerald", icon: "phone" };
	}
	return { label: "Call Candidate", tone: "slate", icon: "phone" };
};

export default function CallingManagement({ onNavigateToEmail }) {
	const isMobile = useIsMobile();
	const [activeTab, setActiveTab] = useState("all");
	const [viewMode, setViewMode] = useState("grouped"); // 'grouped' or 'table'
	const [loading, setLoading] = useState(false);
	const [allItems, setAllItems] = useState([]);
	const [vacancies, setVacancies] = useState([]);
	const [recruiters, setRecruiters] = useState([]);
	const [filters, setFilters] = useState(EMPTY_FILTERS);
	const [callModalData, setCallModalData] = useState({ isOpen: false, candidate: null });
	const [whatsappModalData, setWhatsappModalData] = useState({ isOpen: false, candidate: null });

	const loadLookups = useCallback(async () => {
		const [v, r] = await Promise.all([getActiveVacanciesWithJD(), getPipelineRecruiters()]);
		if (v?.data) setVacancies(v.data);
		if (r?.data) setRecruiters(r.data);
	}, []);

	const loadQueue = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getCallingQueue({
				queue: "all",
				vacancy_id: filters.vacancy_id !== "All" ? filters.vacancy_id : undefined,
				recruiter_id: filters.recruiter_id !== "All" ? filters.recruiter_id : undefined,
				source: filters.source !== "All" ? filters.source : undefined,
				search: filters.search || undefined,
			});
			if (res?.success) {
				setAllItems(res.data || []);
			} else {
				showToast({ icon: "error", title: res?.message || "Failed to load calling queue" });
			}
		} catch (err) {
			showToast({ icon: "error", title: "Error loading calling queue" });
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => { loadLookups(); }, [loadLookups]);
	useEffect(() => { loadQueue(); }, [loadQueue]);

	const openCall = (row) => setCallModalData({ isOpen: true, candidate: row });

	// Categorize candidate rows into exact stages and attempt groups
	const categorizedQueues = useMemo(() => {
		const now = new Date();
		const buckets = {
			fresh: [], attempt2: [], attempt3: [],
			stage2: [], stage3: [], stage4: [], stage5: [], stage6: [], stage7: [],
			hold: [],
		};

		allItems.forEach((row) => {
			const stageNo = resolveCandidateStage(row);
			const attempts = Number(row.call_attempts_current_stage || 0);
			const onHold = row.last_disposition === "Hold" && row.last_hold_review_date && new Date(row.last_hold_review_date) > now;

			if (onHold) {
				buckets.hold.push(row);
			} else if (stageNo === 1) {
				if (attempts === 0) buckets.fresh.push(row);
				else if (attempts === 1) buckets.attempt2.push(row);
				else buckets.attempt3.push(row);
			} else if (stageNo === 2) buckets.stage2.push(row);
			else if (stageNo === 3) buckets.stage3.push(row);
			else if (stageNo === 4) buckets.stage4.push(row);
			else if (stageNo === 5) buckets.stage5.push(row);
			else if (stageNo === 6) buckets.stage6.push(row);
			else if (stageNo === 7) buckets.stage7.push(row);
		});

		return buckets;
	}, [allItems]);

	// Stage counts for the queue dropdown
	const dynamicCounts = useMemo(() => ({
		all: allItems.length,
		attempt1: categorizedQueues.fresh.length,
		attempt2: categorizedQueues.attempt2.length,
		attempt3: categorizedQueues.attempt3.length,
		stage2: categorizedQueues.stage2.length,
		stage3: categorizedQueues.stage3.length,
		stage4: categorizedQueues.stage4.length,
		stage5: categorizedQueues.stage5.length,
		stage6: categorizedQueues.stage6.length,
		stage7: categorizedQueues.stage7.length,
		hold: categorizedQueues.hold.length,
	}), [allItems, categorizedQueues]);

	const displayedItems = useMemo(() => {
		if (activeTab === "all") return allItems;
		if (activeTab === "attempt1") return categorizedQueues.fresh;
		return categorizedQueues[activeTab] || allItems;
	}, [activeTab, allItems, categorizedQueues]);

	// Section groups
	const stageSections = useMemo(() => {
		const groups = [
			{ key: "attempt1", title: "STAGE: RAW DATA - FRESH (PENDING ATTEMPT 1)", shortTitle: "Raw Data · Fresh", tone: "purple", items: categorizedQueues.fresh },
			{ key: "attempt2", title: "STAGE: RAW DATA - ATTEMPT 1 COMPLETED (PENDING ATTEMPT 2)", shortTitle: "Raw Data · Attempt 2", tone: "sky", items: categorizedQueues.attempt2 },
			{ key: "attempt3", title: "STAGE: RAW DATA - ATTEMPT 2 COMPLETED (PENDING FINAL ATTEMPT 3)", shortTitle: "Raw Data · Final Attempt 3", tone: "rose", items: categorizedQueues.attempt3 },
			{ key: "stage2", title: "STAGE 2: INITIAL SCREENING", shortTitle: "Stage 2 · Screening", tone: "teal", items: categorizedQueues.stage2 },
			{ key: "stage3", title: "STAGE 3: ASSESSMENT", shortTitle: "Stage 3 · Assessment", tone: "amber", items: categorizedQueues.stage3 },
			{ key: "stage4", title: "STAGE 4: ROUND 1 (TELEPHONIC)", shortTitle: "Stage 4 · Round 1", tone: "blue", items: categorizedQueues.stage4 },
			{ key: "stage5", title: "STAGE 5: ROUND 2 (WALK-IN / TASK)", shortTitle: "Stage 5 · Round 2", tone: "indigo", items: categorizedQueues.stage5 },
			{ key: "stage6", title: "STAGE 6: FINAL ROUND (MANAGEMENT)", shortTitle: "Stage 6 · Final Round", tone: "violet", items: categorizedQueues.stage6 },
			{ key: "stage7", title: "STAGE 7: OFFER & ONBOARDING", shortTitle: "Stage 7 · Offer & Onboarding", tone: "emerald", items: categorizedQueues.stage7 },
			{ key: "hold", title: "STAGE: ON HOLD (PARKED PROFILES)", shortTitle: "On Hold", tone: "gray", items: categorizedQueues.hold },
		];

		let filtered = groups;
		if (activeTab !== "all") filtered = groups.filter((g) => g.key === activeTab);

		// Only show stages that have at least 1 candidate
		return filtered.filter((g) => Array.isArray(g.items) && g.items.length > 0);
	}, [activeTab, categorizedQueues]);

	const handleRowAction = (row) => {
		const isAssessmentDispatch = getActionInfo(row).label === "Assign Assessment";
		if (isAssessmentDispatch && onNavigateToEmail) onNavigateToEmail(row, { templateCode: "ASSESSMENT_INVITE_EMAIL" });
		else openCall(row);
	};

	const fmtMobile = (m) => (m ? (m.startsWith("+") ? m : `+91 ${m}`) : "—");

	// Columns for flat table view (total ~1,220px; Call is a real column so it is always visible)
	const columns = useMemo(() => [
		{
			key: "full_name",
			label: "Candidate Name & ID",
			width: 230,
			render: (row) => (
				<span className="flex items-center gap-2 min-w-0">
					<span className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-blue-100 text-blue-800">
						{initials(row.full_name)}
					</span>
					<span className="min-w-0 truncate" title={`${row.full_name || ""} · ${row.candidate_code || ""}`}>
						<span className="font-semibold text-slate-800">{row.full_name || "—"}</span>
						<span className="text-slate-400 text-[10.5px]"> ({row.candidate_code || "—"})</span>
					</span>
				</span>
			),
		},
		{
			key: "mobile",
			label: "Mobile",
			width: 140,
			render: (row) => (
				<span className="block whitespace-nowrap font-mono text-[11px] font-medium text-slate-700">
					{fmtMobile(row.mobile)}
				</span>
			),
		},
		{
			key: "source_channel",
			label: "Source",
			width: 120,
			render: (row) => (
				<span className="block truncate text-[11px] text-slate-700" title={row.source_channel || row.entry_channel || "Direct"}>
					{row.source_channel || row.entry_channel || "Direct"}
				</span>
			),
		},
		{
			key: "current_status",
			label: "Stage / Status",
			width: 260,
			render: (row) => (
				<span className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
					<span className="inline-flex items-center h-[18px] px-2 rounded-full text-[10px] font-bold leading-none bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
						Stage {resolveCandidateStage(row)}
					</span>
					<span className="text-[11px] text-slate-700 truncate font-semibold" title={row.current_status || ""}>
						{row.current_status || "Raw Data - Sourced"}
					</span>
				</span>
			),
		},
		{
			key: "last_comm_at",
			label: "Last Interaction",
			width: 220,
			render: (row) => {
				if (!row.last_comm_at) return <span className="text-[10.5px] text-slate-400 italic">No call placed yet</span>;
				return (
					<span className="flex items-center gap-1.5 min-w-0 text-[11px] whitespace-nowrap" title={row.last_remarks || ""}>
						{row.last_disposition && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dispositionDot(row.last_disposition)}`} />}
						<span className="font-medium text-slate-800 shrink-0">{row.last_disposition}</span>
						<span className="text-slate-400 text-[10px] truncate">· {timeAgo(row.last_comm_at)}</span>
					</span>
				);
			},
		},
		{
			key: "last_remarks",
			label: "Remarks",
			width: 170,
			render: (row) => (
				<span className="block truncate text-[10.5px] text-slate-600" title={row.last_remarks || row.candidate_remarks || ""}>
					{row.last_remarks || row.candidate_remarks || "—"}
				</span>
			),
		},
		{
			key: "action",
			label: "Action",
			width: 80,
			render: (row) => {
				const isAssessmentDispatch = getActionInfo(row).label === "Assign Assessment";
				return (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); handleRowAction(row); }}
						className="inline-flex items-center gap-1 h-[22px] px-2.5 rounded text-[10.5px] font-semibold leading-none bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap cursor-pointer"
						title={isAssessmentDispatch ? "Open Email Desk to send assessment" : "Call candidate"}
					>
						<PhoneCall size={10} /> Call
					</button>
				);
			},
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
	], [onNavigateToEmail]);

	const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
	const SEL = `${formInputClass(false, false)} !w-auto !h-[26px] !py-0 !px-1.5 !text-[11px] min-w-0`;

	const filterPanel = (
		<div className="shrink-0 px-2.5 py-1.5 bg-[#f8fafc] border-b border-[#dde1ea] flex flex-wrap items-center gap-1.5">
			{/* Stage / Queue */}
			<div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
				<label className="hidden sm:flex text-[11px] font-bold text-slate-700 whitespace-nowrap items-center gap-1">
					<PhoneForwarded size={11} className="text-blue-600" /> Stage / Queue:
				</label>
				<select
					value={activeTab}
					onChange={(e) => setActiveTab(e.target.value)}
					className={`${SEL} flex-1 sm:flex-none sm:min-w-[190px] font-semibold border-blue-200 focus:border-blue-500`}
				>
					{STAGE_FILTERS.map(({ key, label }) => (
						<option key={key} value={key}>{label} ({dynamicCounts[key] ?? 0})</option>
					))}
				</select>
				<span className="inline-flex items-center h-[22px] px-2 rounded-full whitespace-nowrap text-[10px] font-bold leading-none bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
					{displayedItems.length} in view
				</span>
			</div>

			{/* Filters (right aligned on desktop) */}
			<div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto sm:ml-auto [&>select]:flex-1 sm:[&>select]:flex-none">
				<div className="relative min-w-[140px] order-first sm:order-none w-full sm:w-auto">
					<Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search candidate, phone, ID..."
						value={filters.search}
						onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
						className={`${formInputClass(false, false)} !pl-6 !w-full sm:!w-[190px] !h-[26px] !py-0 !text-[16px] sm:!text-[11px]`}
					/>
				</div>
				<select value={filters.vacancy_id} onChange={(e) => setFilters((p) => ({ ...p, vacancy_id: e.target.value }))} className={`${SEL} sm:max-w-[170px]`} aria-label="Vacancy">
					<option value="All">Vacancy: All ({vacancies.length})</option>
					{vacancies.map((v) => <option key={v.vacancy_id} value={v.vacancy_id}>{v.job_title || v.designation_name} ({v.vacancy_no})</option>)}
				</select>
				<select value={filters.recruiter_id} onChange={(e) => setFilters((p) => ({ ...p, recruiter_id: e.target.value }))} className={SEL} aria-label="Recruiter">
					<option value="All">Recruiter: All</option>
					{recruiters.map((r) => <option key={r.recruiter_id} value={r.recruiter_id}>{r.recruiter_name}</option>)}
				</select>
				<select value={filters.source} onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))} className={SEL} aria-label="Channel">
					<option value="All">Channel: All</option>
					{SOURCE_CHANNELS.map((s) => <option key={s} value={s}>{s}</option>)}
				</select>

				{hasActiveFilters && (
					<button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[11px] font-semibold text-blue-600 hover:underline px-1 whitespace-nowrap">
						Clear
					</button>
				)}

				<button
					type="button"
					onClick={loadQueue}
					title="Refresh (Alt+Y)"
					aria-label="Refresh"
					className="h-[26px] w-[26px] shrink-0 flex items-center justify-center rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
				>
					<RefreshCw size={12} className={loading ? "animate-spin" : ""} />
				</button>

				{/* Layout toggle: desktop only (mobile always uses cards) */}
				<div className="hidden md:inline-flex rounded border border-slate-200 bg-white p-0.5">
					{[["grouped", "Grouped"], ["table", "Flat Table"]].map(([k, l]) => (
						<button
							key={k}
							type="button"
							onClick={() => setViewMode(k)}
							className={`px-2 h-[20px] whitespace-nowrap text-[10.5px] rounded transition-all cursor-pointer ${viewMode === k ? "bg-slate-800 text-white font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
						>
							{l}
						</button>
					))}
				</div>
			</div>
		</div>
	);

	// Mobile: grouped card list
	const mobileCards = (
		<div className="space-y-3">
			{stageSections.length === 0 ? (
				<div className="py-12 text-center text-slate-400 text-xs italic bg-white rounded-xl border border-slate-200">
					<PhoneCall size={28} className="mx-auto mb-2 opacity-30" />
					<p>No candidates match your filters.</p>
				</div>
			) : stageSections.map((sec) => {
				const t = TONES[sec.tone] || TONES.slate;
				return (
					<div key={sec.key} className="space-y-2">
						<div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border text-[10.5px] font-bold uppercase tracking-wide ${t.banner}`}>
							<span className="truncate">{sec.shortTitle}</span>
							<span className={`inline-flex items-center h-[18px] px-2 rounded-full text-[10px] leading-none shrink-0 ${t.badge}`}>{sec.items.length}</span>
						</div>
						{sec.items.map((row) => {
							const act = getActionInfo(row);
							return (
								<div key={row.pipeline_id || row.candidate_id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2">
									<div className="flex items-center gap-2 min-w-0">
										<span className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-blue-100 text-blue-800">{initials(row.full_name)}</span>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-bold text-slate-800 truncate">{row.full_name || "—"}</p>
											<p className="text-[10.5px] text-slate-400 truncate">{row.candidate_code || "—"} · {row.source_channel || row.entry_channel || "Direct"}</p>
										</div>
										<a
											href={row.mobile ? `tel:${row.mobile.startsWith("+") ? row.mobile : "+91" + row.mobile}` : undefined}
											className="font-mono text-[11px] text-blue-700 whitespace-nowrap"
										>
											{fmtMobile(row.mobile)}
										</a>
									</div>
									<div className="flex items-center gap-1.5 min-w-0">
										<span className="inline-flex items-center h-[18px] px-2 rounded-full text-[10px] font-bold leading-none bg-blue-50 text-blue-700 border border-blue-200 shrink-0">Stage {resolveCandidateStage(row)}</span>
										<span className="text-[11px] font-semibold text-slate-700 truncate">{row.current_status || "Raw Data - Sourced"}</span>
									</div>
									<p className="text-[11px] text-slate-500 truncate">
										{row.last_comm_at
											? <>{row.last_disposition} · {timeAgo(row.last_comm_at)}{row.last_remarks ? ` · ${row.last_remarks}` : ""}</>
											: <span className="italic text-slate-400">No call placed yet</span>}
									</p>
									<button
										type="button"
										onClick={() => handleRowAction(row)}
										className="w-full h-9 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer"
									>
										<PhoneCall size={13} /> {act.label}
									</button>
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);

	// Desktop: grouped sections table
	const groupedTable = stageSections.length > 0 ? (
		<div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-left text-[11px] border-collapse table-fixed">
					<colgroup>
						<col style={{ width: "23%" }} />
						<col style={{ width: "13%" }} />
						<col style={{ width: "13%" }} />
						<col style={{ width: "19%" }} />
						<col style={{ width: "15%" }} />
						<col style={{ width: "9%" }} />
						<col style={{ width: "8%" }} />
					</colgroup>
					<thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider shadow-2xs">
						<tr>
							<th className="py-2.5 px-3 truncate">Candidate Name & ID</th>
							<th className="py-2.5 px-3 truncate">Mobile / Contact</th>
							<th className="py-2.5 px-3 truncate">Sourcing Channel</th>
							<th className="py-2.5 px-3 truncate">Current Stage / Status</th>
							<th className="py-2.5 px-3 truncate">Last Interaction / Reason</th>
							<th className="py-2.5 px-3 truncate">Remarks</th>
							<th className="py-2.5 px-3 text-right truncate">Action</th>
						</tr>
					</thead>
					<tbody>
						{stageSections.map((sec) => {
							const t = TONES[sec.tone] || TONES.slate;
							const rowCount = sec.items.length;

							return (
								<React.Fragment key={sec.key}>
									<tr className={`border-y font-semibold text-[11.5px] ${t.banner}`}>
										<td colSpan={7} className="px-3.5 py-1.5">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="w-2 h-2 rounded-full bg-current opacity-80" />
													<span className="tracking-wide uppercase font-bold">{sec.title}</span>
												</div>
												<span className={`inline-flex items-center h-[20px] px-2.5 rounded-full text-[10.5px] font-bold leading-none shadow-2xs ${t.badge}`}>
													{rowCount} {rowCount === 1 ? "Candidate" : "Candidates"}
												</span>
											</div>
										</td>
									</tr>

									{sec.items.map((row) => {
										const isAssessmentDispatch = getActionInfo(row).label === "Assign Assessment";

										return (
											<tr
												key={row.pipeline_id || row.candidate_id}
												onDoubleClick={() => openCall(row)}
												className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors h-[38px]"
											>
												<td className="py-1.5 px-3 font-medium text-slate-800 truncate">
													<div className="flex items-center gap-2 min-w-0">
														<span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9.5px] font-bold shrink-0 bg-slate-100 text-slate-700">
															{initials(row.full_name)}
														</span>
														<div className="min-w-0 truncate">
															<span className="font-semibold text-slate-900 truncate">{row.full_name || "—"}</span>
															<span className="text-slate-400 text-[10px]"> ({row.candidate_code || "—"})</span>
														</div>
													</div>
												</td>
												<td className="py-1.5 px-3 font-mono font-medium text-slate-700 truncate">{fmtMobile(row.mobile)}</td>
												<td className="py-1.5 px-3 text-slate-600 truncate">{row.source_channel || row.entry_channel || "Direct Ingestion"}</td>
												<td className="py-1.5 px-3 truncate">
													<span className="font-semibold text-slate-800 truncate block" title={row.current_status || ""}>
														{row.current_status || "Raw Data - Sourced"}
													</span>
												</td>
												<td className="py-1.5 px-3 text-slate-600 truncate">
													{row.last_comm_at ? (
														<span className="flex items-center gap-1.5 truncate" title={row.last_remarks || ""}>
															{row.last_disposition && (
																<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dispositionDot(row.last_disposition)}`} />
															)}
															<span className="font-medium text-slate-800 shrink-0">{row.last_disposition}</span>
															<span className="text-slate-400 text-[10px] shrink-0">· {timeAgo(row.last_comm_at)}</span>
														</span>
													) : (
														<span className="text-slate-400 italic">No call placed yet</span>
													)}
												</td>
												<td className="py-1.5 px-3 text-slate-500 truncate" title={row.last_remarks || row.candidate_remarks || ""}>
													{row.last_remarks || row.candidate_remarks || "—"}
												</td>
												<td className="py-1 px-3 text-right">
													<div className="flex items-center justify-end">
														<button
															type="button"
															onClick={(e) => { e.stopPropagation(); handleRowAction(row); }}
															className="h-[22px] px-2.5 text-[10.5px] font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-2xs inline-flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
															title={isAssessmentDispatch ? "Navigate to Email Desk to Send Assessment" : "Call Candidate"}
														>
															<PhoneCall size={10} />
															<span>Call</span>
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	) : (
		<div className="py-16 text-center text-slate-400 text-xs italic bg-white rounded-xl border border-slate-200">
			<PhoneCall size={32} className="mx-auto mb-2 opacity-30" />
			<p>No candidates currently in the calling queue matching your filters.</p>
		</div>
	);

	const flatMode = !isMobile && viewMode === "table";

	return (
		<div className="w-full h-full flex flex-col min-h-0 min-w-0 bg-slate-50">
			{/* Top Filter Bar */}
			{filterPanel}

			{/* Main Content Area */}
			<div
				className={`flex-1 min-h-0 ${flatMode ? "overflow-hidden" : "overflow-y-auto overscroll-contain px-2.5 py-2 pb-20 sm:pb-2 space-y-3"}`}
			>
				{isMobile ? (
					mobileCards
				) : viewMode === "grouped" ? (
					groupedTable
				) : (
					<Table
						title="CANDIDATE CALLING QUEUE"
						TitleIcon={PhoneForwarded}
						columns={columns}
						data={displayedItems}
						rowKey="pipeline_id"
						loading={loading}
						onRowDoubleClick={openCall}
						onRowClick={openCall}
						onRefresh={loadQueue}
						activeTab="search"
						isHidden
					/>
				)}
			</div>

			{/* Footer Action Bar */}
			<div className="w-full border-t bg-white px-3 py-1.5 shrink-0 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
				<div className="flex items-center justify-center gap-2 flex-wrap">
					{displayedItems.length > 0 && (
						<BaseButton
							onClick={() => openCall(displayedItems[0])}
							label={`Dial Next (${displayedItems[0].full_name?.split(" ")[0] || "Candidate"})`}
							icon={<PhoneCall size={15} />}
							tone="emerald"
							title="Start calling next pending candidate in queue"
						/>
					)}
					<span className="hidden sm:inline-flex">
						<RefreshButton onClick={loadQueue} loading={loading} />
					</span>
					{hasActiveFilters && <ResetButton onClick={() => setFilters(EMPTY_FILTERS)} label="Reset Filters" />}
				</div>
			</div>

			{/* Universal Call Modal with direct status progression */}
			{callModalData.isOpen && (
				<UniversalCallModal
					isOpen={callModalData.isOpen}
					candidate={callModalData.candidate}
					pipelineId={callModalData.candidate?.pipeline_id}
					onClose={() => setCallModalData({ isOpen: false, candidate: null })}
					onSuccess={() => {
						setCallModalData({ isOpen: false, candidate: null });
						loadQueue();
					}}
				/>
			)}

			{/* WhatsApp Modal */}
			{whatsappModalData.isOpen && (
				<GlobalWhatsAppModal
					isOpen={whatsappModalData.isOpen}
					onClose={() => setWhatsappModalData({ isOpen: false, candidate: null })}
					recipientPhone={whatsappModalData.candidate?.mobile}
					recipientName={whatsappModalData.candidate?.full_name}
					moduleName="Recruitment"
					referenceType="candidate"
					referenceId={whatsappModalData.candidate?.candidate_id}
					onMessageSent={() => showToast({ icon: "success", title: "WhatsApp message logged" })}
				/>
			)}
		</div>
	);
}