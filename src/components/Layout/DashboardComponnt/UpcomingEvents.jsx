 
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import Swal from "sweetalert2";
import {
  getActledListAll,
  fetchHolidays,
  fetchUserGroupsByType,
  sendEventWish,
  sendHolidayNotice,
} from "../../../utils/api";

const TABS = ["Today", "This week", "All"];

const FILTER_TYPES = [
  "All",
  "birthday",
  "anniversary",
  "holiday",
  "probation",
  "payroll",
];

const RANGES = [
  { key: "today", label: "Today", test: (w) => w === 0 },
  { key: "week", label: "This week", test: (w) => w >= 0 && w <= 6 },
  { key: "month", label: "30 days", test: (w) => w >= 0 && w <= 30 },
  { key: "all", label: "All", test: () => true },
];

const FIELD_KEYS = {
  id: ["Actled_id", "employee_id", "Employee ID", "id"],
  code: ["Led_code", "employee_code", "Employee Code", "code"],
  firstName: ["Led_name", "first_name", "First Name", "firstname"],
  lastName: ["Led_alias", "last_name", "Last Name", "lastname"],
  middleName: ["Middle_name"],
  dob: ["Dob", "dob", "DOB", "date_of_birth", "Date of Birth"],
  doj: ["Doj", "doj", "DOJ", "date_of_joining", "Joining Date", "joining_date"],
  department: ["department_name", "Department", "dept_name"],
  departmentId: ["department", "Department"],
  statusLeaving: [
    "Dol",
    "status_leaving_date",
    "Status Leaving Date",
    "leaving_date",
  ],
  status: ["status", "Status"],
};

const PROBATION_MONTHS = 6;
const EVENT_WINDOW_PAST_DAYS = 30;
const EVENT_WINDOW_FUTURE_DAYS = 120;

const C = {
  blue: "#3B6FD9",
  blueSoft: "#EAF0FB",
  green: "#2BA36B",
  greenSoft: "#E6F5EE",
  amber: "#D9962B",
  amberSoft: "#FBF1DF",
  red: "#D64545",
  redSoft: "#FBE9E9",
  purple: "#7B61D9",
  purpleSoft: "#EEEAFB",
  indigo: "#5B4FE9",
  indigoSoft: "#EFEEFD",
  teal: "#1D9E9E",
  tealSoft: "#E3F5F5",
  ink: "#1F2A44",
  navy: "#1F3A68",
  muted: "#6B7A90",
  faint: "#9AA6B8",
  line: "#E4E8EF",
  panel: "#F5F7FB",
};

const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return obj[k];
    }
  }

  return null;
};

const startOfDay = (d) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const daysBetween = (from, to) =>
  Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatDateStr = (d) =>
  `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

const dayLabelFor = (diff, d) => {
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${-diff} d overdue`;

  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const nextOccurrence = (rawDate, today) => {
  if (!rawDate) return null;

  const d = new Date(rawDate);

  if (isNaN(d.getTime())) return null;

  let occ = startOfDay(
    new Date(today.getFullYear(), d.getMonth(), d.getDate()),
  );

  if (occ < startOfDay(today)) {
    occ.setFullYear(occ.getFullYear() + 1);
  }

  return {
    occ,
    sourceYear: d.getFullYear(),
  };
};

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

const TYPE_STYLE = {
  birthday: {
    label: "Birthdays",
    icon: "ti ti-cake",
    color: C.blue,
    soft: C.blueSoft,
    action: "Send Wishes",
  },

  anniversary: {
    label: "Anniversaries",
    icon: "ti ti-star",
    color: C.purple,
    soft: C.purpleSoft,
    action: "Send Badge",
  },

  holiday: {
    label: "Holidays",
    icon: "ti ti-flag",
    color: C.amber,
    soft: C.amberSoft,
    action: "Send Notice",
  },

  probation: {
    label: "Probation Due",
    icon: "ti ti-user-check",
    color: C.green,
    soft: C.greenSoft,
    action: "Review",
  },

  payroll: {
    label: "Payroll",
    icon: "ti ti-report-money",
    color: C.red,
    soft: C.redSoft,
    action: "Run Payroll",
  },
};

const TODAY_STYLE = {
  dayColor: "#1F4FB8",
  dayBg: C.blueSoft,
};

const TOMORROW_STYLE = {
  dayColor: "#8A5A0E",
  dayBg: C.amberSoft,
};

const OVERDUE_STYLE = {
  dayColor: "#9A2F2F",
  dayBg: C.redSoft,
};

const dayColorsFor = (diff, type) => {
  if (diff < 0) return OVERDUE_STYLE;
  if (diff === 0) return TODAY_STYLE;
  if (diff === 1) return TOMORROW_STYLE;

  return {
    dayColor: TYPE_STYLE[type].color,
    dayBg: TYPE_STYLE[type].soft,
  };
};

const RESPONSIVE_CSS = `
.ue-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  flex-wrap: wrap;
}

.ue-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}

.ue-header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ue-filter-row {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.ue-search {
  flex: 1 1 240px;
  min-width: 0;
}

.ue-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  flex-shrink: 0;
}

.ue-row2 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  flex-shrink: 0;
}

.ue-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  text-align: left;
}

@media (max-width: 1280px) {
  .ue-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .ue-row2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .ue-header-top {
    padding: 12px 14px;
  }
}

@media (max-width: 600px) {
  .ue-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ue-header-actions {
    width: 100%;
  }

  .ue-header-actions > button {
    flex: 1 1 auto;
    justify-content: center;
  }
}

@media (max-width: 400px) {
  .ue-kpi-grid {
    grid-template-columns: 1fr;
  }
}
`;

const useResponsiveCss = () => {
  useEffect(() => {
    const id = "upcoming-events-responsive-css";

    if (document.getElementById(id)) return;

    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = RESPONSIVE_CSS;

    document.head.appendChild(tag);
  }, []);
};

const UpcomingEvents = ({
  isHalf = false,
  onViewFullCalendar,
  onAIClick,
  onEventAction,
}) => {
  useResponsiveCss();

  const [activeTab, setActiveTab] = useState("Today");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [range, setRange] = useState("month");
  const [showFilters, setShowFilters] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [deptMap, setDeptMap] = useState({});

  const [sendingWishId, setSendingWishId] = useState(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (!isHalf) return;

    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHalf]);

  const pageRef = useRef(null);
  const [pageHeight, setPageHeight] = useState(null);

  useLayoutEffect(() => {
    if (isHalf) return;

    const recalc = () => {
      const el = pageRef.current;

      if (!el) return;

      const top = el.getBoundingClientRect().top;
      let bottomLimit = window.innerHeight;

      let node = el.parentElement;

      while (node && node !== document.body) {
        const { overflowY } = getComputedStyle(node);

        if (
          overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowY === "hidden"
        ) {
          bottomLimit = Math.min(
            bottomLimit,
            node.getBoundingClientRect().bottom,
          );
          break;
        }

        node = node.parentElement;
      }

      setPageHeight(Math.max(320, bottomLimit - top - 16));
    };

    recalc();

    window.addEventListener("resize", recalc);

    const t1 = setTimeout(recalc, 50);
    const t2 = setTimeout(recalc, 300);

    let ro;

    if (
      typeof ResizeObserver !== "undefined" &&
      pageRef.current?.parentElement
    ) {
      ro = new ResizeObserver(recalc);
      ro.observe(pageRef.current.parentElement);
    }

    return () => {
      window.removeEventListener("resize", recalc);
      clearTimeout(t1);
      clearTimeout(t2);

      if (ro) {
        ro.disconnect();
      }
    };
  }, [isHalf, loading]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const [empRes, holidayRows, deptRes] = await Promise.all([
        getActledListAll(),
        fetchHolidays(),
        fetchUserGroupsByType("DEP"),
      ]);

      setEmployees(empRes?.success ? empRes.data || [] : []);

      setHolidays(holidayRows || []);

      const map = {};

      (deptRes?.data || []).forEach((g) => {
        map[g.group_id] = g.group_name;
      });

      setDeptMap(map);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("UpcomingEvents fetch error:", e);

      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resolveDept = useCallback(
    (emp) => {
      const name = pick(emp, FIELD_KEYS.department);

      if (name) return name;

      const id = pick(emp, FIELD_KEYS.departmentId);

      if (id && deptMap[id]) {
        return deptMap[id];
      }

      return "—";
    },
    [deptMap],
  );

  const resolveName = useCallback((emp) => {
    const first = pick(emp, FIELD_KEYS.firstName) || "";

    const middle = pick(emp, FIELD_KEYS.middleName) || "";

    const last = pick(emp, FIELD_KEYS.lastName) || "";

    return (
      `${first} ${middle} ${last}`.replace(/\s+/g, " ").trim() ||
      "Unnamed Employee"
    );
  }, []);

  const EVENTS = useMemo(() => {
    const list = [];
    let autoId = 1;

    const isActive = (emp) => {
      const leaving = pick(emp, FIELD_KEYS.statusLeaving);

      const status = pick(emp, FIELD_KEYS.status);

      if (leaving) return false;

      if (status && String(status).toLowerCase() === "inactive") {
        return false;
      }

      return true;
    };

    employees.filter(isActive).forEach((emp) => {
      const name = resolveName(emp);
      const dept = resolveDept(emp);
      const empId = pick(emp, FIELD_KEYS.id);

      const birthdayOcc = nextOccurrence(pick(emp, FIELD_KEYS.dob), today);

      if (birthdayOcc) {
        const diff = daysBetween(today, birthdayOcc.occ);

        if (diff <= EVENT_WINDOW_FUTURE_DAYS) {
          list.push({
            id: `bday-${autoId++}`,
            employeeId: empId,
            type: "birthday",
            title: name,
            sub: "Birthday" + (diff === 0 ? " today" : ""),
            when: diff,
            dept,
            dateStr: formatDateStr(birthdayOcc.occ),
          });
        }
      }

      const dojRaw = pick(emp, FIELD_KEYS.doj);

      const annivOcc = nextOccurrence(dojRaw, today);

      if (annivOcc) {
        const diff = daysBetween(today, annivOcc.occ);

        const years = annivOcc.occ.getFullYear() - annivOcc.sourceYear;

        if (diff <= EVENT_WINDOW_FUTURE_DAYS && years > 0) {
          list.push({
            id: `anniv-${autoId++}`,
            employeeId: empId,
            type: "anniversary",
            title: name,
            sub: `${years}-year work anniversary`,
            when: diff,
            dept,
            dateStr: formatDateStr(annivOcc.occ),
            years,
          });
        }
      }

      if (dojRaw) {
        const dojDate = new Date(dojRaw);

        if (!isNaN(dojDate.getTime())) {
          const probationDate = startOfDay(
            addMonths(dojDate, PROBATION_MONTHS),
          );

          const diff = daysBetween(today, probationDate);

          if (
            diff >= -EVENT_WINDOW_PAST_DAYS &&
            diff <= EVENT_WINDOW_FUTURE_DAYS
          ) {
            list.push({
              id: `prob-${autoId++}`,
              employeeId: empId,
              type: "probation",
              title: name,
              sub:
                diff < 0
                  ? "Probation ended — confirmation overdue"
                  : "Probation ends — confirmation due",
              when: diff,
              dept,
              dateStr: formatDateStr(probationDate),
            });
          }
        }
      }
    });

    holidays.forEach((h) => {
      if (!h.date) return;

      const d = startOfDay(new Date(h.date));

      if (isNaN(d.getTime())) return;

      const diff = daysBetween(today, d);

      if (diff >= 0 && diff <= EVENT_WINDOW_FUTURE_DAYS) {
        list.push({
          id: `hol-${h.id}`,
          holidayId: h.id,
          type: "holiday",
          title: h.purpose || "Holiday",
          sub: (h.remarks ? `${h.remarks} — ` : "") + "Office closed",
          when: diff,
          dept: "All India",
          dateStr: formatDateStr(d),
        });
      }
    });

    {
      const y = today.getFullYear();
      const m = today.getMonth();

      let lastDay = startOfDay(new Date(y, m + 1, 0));

      let diff = daysBetween(today, lastDay);

      if (diff < 0) {
        lastDay = startOfDay(new Date(y, m + 2, 0));

        diff = daysBetween(today, lastDay);
      }

      list.push({
        id: "payroll-cutoff",
        type: "payroll",
        title: "Payroll Deadline",
        sub: `${MONTHS_SHORT[lastDay.getMonth()]} salary processing cutoff`,
        when: diff,
        dept: "Finance",
        dateStr: formatDateStr(lastDay),
      });
    }

    return list
      .map((e) => {
        const eventDate = new Date(today);

        eventDate.setDate(eventDate.getDate() + e.when);

        const style = TYPE_STYLE[e.type];

        const dayColors = dayColorsFor(e.when, e.type);

        return {
          ...e,
          icon: style.icon,
          iconBg: style.soft,
          iconColor: style.color,
          action: style.action,
          day: dayLabelFor(e.when, eventDate),
          ...dayColors,
        };
      })
      .sort((a, b) => a.when - b.when);
  }, [employees, holidays, today, resolveDept, resolveName]);

  const filtered = EVENTS.filter((e) => {
    if (activeTab === "Today") {
      return e.when === 0;
    }

    if (activeTab === "This week") {
      return e.when >= 0 && e.when <= 6;
    }

    return true;
  });

  const groups = filtered.reduce((acc, e) => {
    (acc[e.day] = acc[e.day] || []).push(e);

    return acc;
  }, {});

  const rangeTest = RANGES.find((r) => r.key === range)?.test || (() => true);

  const detailedFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return EVENTS.filter((e) => {
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q) ||
        e.sub.toLowerCase().includes(q);

      const matchType = selectedType === "All" || e.type === selectedType;

      return matchSearch && matchType && rangeTest(e.when);
    });
  }, [EVENTS, searchTerm, selectedType, rangeTest]);

  const countType = (type, list = EVENTS) =>
    list.filter((e) => e.type === type).length;

  const todayCount = EVENTS.filter((e) => e.when === 0).length;

  const weekCount = EVENTS.filter((e) => e.when >= 0 && e.when <= 6).length;

  const overdueCount = EVENTS.filter((e) => e.when < 0).length;

  const WEEKLY = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const base = EVENTS.filter(
      (e) =>
        (selectedType === "All" || e.type === selectedType) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          e.dept.toLowerCase().includes(q)),
    );

    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(today);

      start.setDate(start.getDate() + i * 7);

      const byType = {};

      base.forEach((e) => {
        if (e.when >= i * 7 && e.when <= i * 7 + 6) {
          byType[e.type] = (byType[e.type] || 0) + 1;
        }
      });

      const total = Object.values(byType).reduce(
        (sum, value) => sum + value,
        0,
      );

      return {
        label:
          i === 0
            ? "This wk"
            : `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`,
        byType,
        total,
      };
    });

    const max = Math.max(1, ...weeks.map((w) => w.total));

    return {
      weeks,
      max,
    };
  }, [EVENTS, selectedType, searchTerm, today]);

  const BY_TYPE = useMemo(() => {
    const entries = Object.keys(TYPE_STYLE).map((type) => ({
      type,
      ...TYPE_STYLE[type],
      count: countType(type, detailedFiltered),
    }));

    const max = Math.max(1, ...entries.map((e) => e.count));

    return entries
      .map((e) => ({
        ...e,
        pct: Math.round((e.count / max) * 100),
        share: pct(e.count, detailedFiltered.length),
      }))
      .sort((a, b) => b.count - a.count);
  }, [detailedFiltered]);

  const handleExportCSV = () => {
    const headers = [
      "Title",
      "Description",
      "Date",
      "Timeline",
      "Category",
      "Department",
    ];

    const rows = detailedFiltered.map((e) => [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.sub.replace(/"/g, '""')}"`,
      `"${e.dateStr}"`,
      `"${e.day}"`,
      `"${e.type}"`,
      `"${e.dept}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "upcoming_events_schedule.csv";

    link.style.visibility = "hidden";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // Birthday and anniversary events call the API directly.
  // Holiday events broadcast a notice to all active employees.
  // Other event types use the parent event action handler.

  const handleActionClick = async (e) => {
    if (e.type === "birthday" || e.type === "anniversary") {
      if (!e.employeeId) {
        Swal.fire(
          "Error",
          "Employee ID is not available for this event.",
          "error",
        );

        return;
      }

      setSendingWishId(e.id);

      try {
        const res = await sendEventWish(e.employeeId, e.type, e.years);

        if (res.success === false) {
          Swal.fire(
            "Info",
            res.message || "The wish could not be sent.",
            "info",
          );

          return;
        }

        Swal.fire({
          icon: "success",

          title: e.type === "anniversary" ? "Badge Sent! 🎉" : "Sent! 🎂",

          text:
            e.type === "anniversary"
              ? `The ${e.years}-year anniversary wish has been sent to ${e.title}.`
              : `The birthday wish has been sent to ${e.title}.`,

          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire(
          "Error",
          err.response?.data?.message || err.message || "Something went wrong.",
          "error",
        );
      } finally {
        setSendingWishId(null);
      }

      return;
    }

    if (e.type === "holiday") {
      if (!e.holidayId) {
        Swal.fire(
          "Error",
          "Holiday ID is not available for this event.",
          "error",
        );

        return;
      }

      setSendingWishId(e.id);

      try {
        const res = await sendHolidayNotice(e.holidayId);

        if (res.success === false) {
          Swal.fire(
            "Info",
            res.message || "The holiday notice could not be sent.",
            "info",
          );

          return;
        }

        Swal.fire({
          icon: "success",
          title: "Notice Sent! 📢",
          text:
            res.message ||
            `The holiday notice for ${e.title} has been sent to all employees.`,
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire(
          "Error",
          err.response?.data?.message || err.message || "Something went wrong.",
          "error",
        );
      } finally {
        setSendingWishId(null);
      }

      return;
    }

    // Handle other event types using the parent handler, if provided.
    if (!onEventAction) return;

    setSendingWishId(e.id);

    try {
      await onEventAction(e);
    } finally {
      setSendingWishId(null);
    }
  };

  if (isHalf) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <div>
            <div style={styles.cardTitle}>Upcoming events</div>

            <div style={styles.cardSub}>
              {MONTHS_SHORT[today.getMonth()]} {today.getFullYear()}
            </div>
          </div>

          <div style={styles.filterWrap} ref={filterRef}>
            <button
              style={styles.filterBtn}
              onClick={() => setFilterOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={filterOpen}
            >
              <i
                className="ti ti-filter"
                aria-hidden="true"
                style={{
                  fontSize: 13,
                }}
              />

              <span>{activeTab}</span>

              <i
                className="ti ti-chevron-down"
                aria-hidden="true"
                style={{
                  fontSize: 11,
                }}
              />
            </button>

            {filterOpen && (
              <div style={styles.filterMenu}>
                {TABS.map((t) => (
                  <div
                    key={t}
                    style={{
                      ...styles.filterOption,
                      ...(activeTab === t ? styles.filterOptionActive : {}),
                    }}
                    onClick={() => {
                      setActiveTab(t);
                      setFilterOpen(false);
                    }}
                  >
                    <span>{t}</span>

                    {t === "Today" && (
                      <span style={styles.tabBadge}>{todayCount}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "10px 0",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="ah-skeleton-fallback"
                style={styles.skeletonRow}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={styles.empty}>
            <i
              className="ti ti-alert-triangle"
              aria-hidden="true"
              style={{
                fontSize: 20,
                color: C.red,
              }}
            />

            <span
              style={{
                fontSize: 11,
                color: "#aaa",
                marginTop: 4,
              }}
            >
              Couldn't load events
            </span>
          </div>
        )}

        {!loading && !error && (
          <div style={styles.list}>
            {Object.keys(groups).length === 0 ? (
              <div style={styles.empty}>
                <i
                  className="ti ti-calendar-off"
                  aria-hidden="true"
                  style={{
                    fontSize: 20,
                    color: "#ccc",
                  }}
                />

                <span
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    marginTop: 4,
                  }}
                >
                  No events
                </span>
              </div>
            ) : (
              Object.entries(groups).map(([day, events]) => (
                <div key={day} style={styles.group}>
                  <div style={styles.dayHdr}>
                    <div style={styles.dayLine} />

                    <span
                      style={{
                        ...styles.dayLabel,
                        background: events[0].dayBg,
                        color: events[0].dayColor,
                      }}
                    >
                      {day}
                    </span>

                    <div style={styles.dayLine} />
                  </div>

                  {events.map((e) => (
                    <div key={e.id} style={styles.eventRow}>
                      <div
                        style={{
                          ...styles.iconBubble,
                          background: e.iconBg,
                        }}
                      >
                        <i
                          className={e.icon}
                          aria-hidden="true"
                          style={{
                            fontSize: 13,
                            color: e.iconColor,
                          }}
                        />
                      </div>

                      <div style={styles.eventInfo}>
                        <div style={styles.eventTitle}>{e.title}</div>

                        <div style={styles.eventSub}>{e.sub}</div>
                      </div>

                      <span
                        style={{
                          ...styles.typeChip,
                          background: e.iconBg,
                          color: e.iconColor,
                        }}
                      >
                        {e.type}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        <div style={styles.footer} onClick={onViewFullCalendar}>
          <i
            className="ti ti-calendar-plus"
            aria-hidden="true"
            style={{
              fontSize: 12,
            }}
          />

          <span>View full calendar</span>
        </div>
      </div>
    );
  }

  const KPIS = [
    {
      label: "Today",
      val: todayCount,
      sub: overdueCount ? `${overdueCount} overdue` : "nothing overdue",
      icon: "ti ti-calendar-event",
      color: C.indigo,
      soft: C.indigoSoft,
    },

    {
      label: "This Week",
      val: weekCount,
      sub: "next 7 days",
      icon: "ti ti-calendar-week",
      color: C.teal,
      soft: C.tealSoft,
    },

    {
      label: "Birthdays",
      val: countType("birthday"),
      sub: "next 120 days",
      icon: "ti ti-cake",
      color: C.blue,
      soft: C.blueSoft,
    },

    {
      label: "Anniversaries",
      val: countType("anniversary"),
      sub: "next 120 days",
      icon: "ti ti-star",
      color: C.purple,
      soft: C.purpleSoft,
    },

    {
      label: "Probation Due",
      val: countType("probation"),
      sub: "confirmations pending",
      icon: "ti ti-user-check",
      color: C.green,
      soft: C.greenSoft,
    },

    {
      label: "Holidays",
      val: countType("holiday"),
      sub: "office closed days",
      icon: "ti ti-flag",
      color: C.amber,
      soft: C.amberSoft,
    },
  ];

  const SectionHead = ({ icon, title, right }) => (
    <div style={styles.secHead}>
      <div style={styles.secTitle}>
        <i
          className={icon}
          aria-hidden="true"
          style={{
            fontSize: 14,
            color: C.blue,
          }}
        />

        <span>{title}</span>
      </div>

      {right}
    </div>
  );

  const rangeLabel = RANGES.find((r) => r.key === range)?.label;

  return (
    <div
      ref={pageRef}
      style={{
        ...styles.page,
        height: pageHeight ? `${pageHeight}px` : "90vh",
      }}
    >
      <div style={styles.header}>
        <div className="ue-header-top">
          <div className="ue-header-left">
            <h2 style={styles.title}>Upcoming Events</h2>

            <span style={styles.metaChip}>
              {loading
                ? "Loading…"
                : `${detailedFiltered.length.toLocaleString()} events`}

              {lastUpdated && !loading
                ? ` · ${lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
                : ""}
            </span>
          </div>

          <div className="ue-header-actions">
            <button
              style={{
                ...styles.ghostBtn,
                ...(showFilters ? styles.ghostBtnActive : null),
              }}
              onClick={() => setShowFilters((v) => !v)}
            >
              <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
              Filters
              <i
                className="ti ti-chevron-down"
                aria-hidden="true"
                style={{
                  transform: showFilters ? "rotate(180deg)" : "none",
                  transition: "transform .15s",
                }}
              />
            </button>

            {onAIClick && (
              <button
                style={{
                  ...styles.ghostBtn,
                  position: "relative",
                }}
                onClick={onAIClick}
              >
                <i className="ti ti-sparkles" aria-hidden="true" />
                AI
                <span style={styles.aiDot} />
              </button>
            )}

            <button
              style={styles.ghostBtn}
              onClick={loadData}
              disabled={loading}
            >
              <i className="ti ti-refresh" aria-hidden="true" />

              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <button style={styles.primaryBtn} onClick={handleExportCSV}>
              <i className="ti ti-download" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={styles.filterArea}>
            <div className="ue-filter-row">
              <div className="ue-search" style={styles.filterGroup}>
                <label style={styles.filterLabel}>Search</label>

                <div style={styles.searchBox}>
                  <i
                    className="ti ti-search"
                    aria-hidden="true"
                    style={{
                      color: C.faint,
                      fontSize: 14,
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Employee, department or event…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />

                  {searchTerm && (
                    <i
                      className="ti ti-x"
                      aria-hidden="true"
                      style={{
                        color: C.faint,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                      onClick={() => setSearchTerm("")}
                    />
                  )}
                </div>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Range</label>

                <div style={styles.segment}>
                  {RANGES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRange(r.key)}
                      style={{
                        ...styles.segBtn,
                        ...(range === r.key ? styles.segBtnActive : null),
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Type</label>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {FILTER_TYPES.map((t) => {
                    const on = selectedType === t;

                    const st = TYPE_STYLE[t];

                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        style={{
                          ...styles.chip,
                          background: on
                            ? st
                              ? st.soft
                              : C.indigoSoft
                            : "#fff",
                          color: on ? (st ? st.color : C.indigo) : C.muted,
                          borderColor: on ? (st ? st.color : C.indigo) : C.line,
                        }}
                      >
                        {st && (
                          <i
                            className={st.icon}
                            aria-hidden="true"
                            style={{
                              fontSize: 12,
                            }}
                          />
                        )}

                        {t === "All" ? "All" : st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(searchTerm || selectedType !== "All" || range !== "month") && (
                <button
                  style={{
                    ...styles.ghostBtn,
                    alignSelf: "flex-end",
                  }}
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("All");
                    setRange("month");
                  }}
                >
                  <i className="ti ti-eraser" aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorBanner}>
          Couldn't load events.{" "}
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={loadData}
          >
            Try again
          </span>
        </div>
      )}

      <div style={styles.scrollArea}>
        <div className="ue-kpi-grid">
          {KPIS.map((k) => (
            <div key={k.label} style={styles.kpi}>
              <div
                style={{
                  ...styles.kpiIcon,
                  background: k.soft,
                }}
              >
                <i
                  className={k.icon}
                  aria-hidden="true"
                  style={{
                    fontSize: 16,
                    color: k.color,
                  }}
                />
              </div>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div style={styles.kpiLabel}>{k.label}</div>

                <div
                  style={{
                    ...styles.kpiVal,
                    color: k.color,
                  }}
                >
                  {loading ? "—" : k.val}
                </div>

                <div style={styles.kpiSub}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ue-row2">
          <div style={styles.panel}>
            <SectionHead
              icon="ti ti-chart-bar"
              title="Next 8 Weeks"
              right={
                <span
                  style={{
                    fontSize: 11,
                    color: C.faint,
                  }}
                >
                  {selectedType === "All"
                    ? "all types"
                    : TYPE_STYLE[selectedType].label}
                </span>
              }
            />

            <div style={styles.panelBody}>
              <div style={styles.hint}>How many events land in each week</div>

              <div style={styles.weekChart}>
                {WEEKLY.weeks.map((w) => (
                  <div
                    key={w.label}
                    style={styles.weekCol}
                    title={`${w.label}: ${w.total}`}
                  >
                    <div style={styles.weekVal}>{w.total || ""}</div>

                    <div style={styles.weekBar}>
                      {Object.entries(w.byType).map(([t, n]) => (
                        <div
                          key={t}
                          style={{
                            height: `${(n / WEEKLY.max) * 100}%`,
                            background: TYPE_STYLE[t].color,
                            minHeight: n ? 3 : 0,
                          }}
                          title={`${TYPE_STYLE[t].label}: ${n}`}
                        />
                      ))}
                    </div>

                    <div style={styles.weekLbl}>{w.label}</div>
                  </div>
                ))}
              </div>

              <div style={styles.legend}>
                {Object.keys(TYPE_STYLE).map((t) => (
                  <span key={t} style={styles.legendItem}>
                    <span
                      style={{
                        ...styles.dot,
                        background: TYPE_STYLE[t].color,
                      }}
                    />

                    {TYPE_STYLE[t].label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.panel}>
            <SectionHead icon="ti ti-category" title="By Category" />

            <div style={styles.panelBody}>
              <div style={styles.hint}>
                Share of events in the current view ({rangeLabel})
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {BY_TYPE.map((t) => (
                  <div key={t.type} style={styles.barRow}>
                    <span style={styles.barLbl}>
                      <i
                        className={t.icon}
                        aria-hidden="true"
                        style={{
                          color: t.color,
                          marginRight: 5,
                        }}
                      />

                      {t.label}
                    </span>

                    <div style={styles.barBg}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: `${t.pct}%`,
                          background: t.color,
                          minWidth: t.count ? 34 : 0,
                        }}
                      >
                        {t.count > 0 && (
                          <span style={styles.barInner}>{t.share}%</span>
                        )}
                      </div>
                    </div>

                    <span style={styles.barVal}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <SectionHead
            icon="ti ti-list"
            title={`Events (${detailedFiltered.length})`}
            right={
              <span
                style={{
                  fontSize: 11,
                  color: C.faint,
                }}
              >
                {rangeLabel}
              </span>
            }
          />

          <div style={styles.tableWrap}>
            <table className="ue-table">
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: C.panel,
                  zIndex: 1,
                }}
              >
                <tr>
                  <th style={styles.th}>Event</th>

                  <th style={styles.th}>Date</th>

                  <th style={styles.th}>Category</th>

                  <th style={styles.th}>Department</th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: "right",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={styles.tdMsg}>
                      Loading events…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        ...styles.tdMsg,
                        color: C.red,
                      }}
                    >
                      Couldn't load events. Please refresh.
                    </td>
                  </tr>
                ) : detailedFiltered.length ? (
                  detailedFiltered.map((e) => (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: `1px solid ${C.line}`,
                      }}
                    >
                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              ...styles.iconBubble,
                              background: e.iconBg,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <i
                              className={e.icon}
                              aria-hidden="true"
                              style={{
                                fontSize: 15,
                                color: e.iconColor,
                              }}
                            />
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                color: C.ink,
                                fontSize: 13,
                              }}
                            >
                              {e.title}
                            </div>

                            <div
                              style={{
                                fontSize: 11,
                                color: C.faint,
                              }}
                            >
                              {e.sub}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            color: C.ink,
                            fontSize: 12,
                          }}
                        >
                          {e.dateStr}
                        </div>

                        <span
                          style={{
                            ...styles.dayPill,
                            color: e.dayColor,
                            background: e.dayBg,
                          }}
                        >
                          {e.day}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusChip,
                            background: e.iconBg,
                            color: e.iconColor,
                          }}
                        >
                          {TYPE_STYLE[e.type].label}
                        </span>
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          color: C.muted,
                        }}
                      >
                        {e.dept}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: "right",
                        }}
                      >
                        <button
                          style={{
                            ...styles.actionBtn,
                            opacity: sendingWishId === e.id ? 0.6 : 1,
                            cursor:
                              sendingWishId === e.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                          onClick={() => handleActionClick(e)}
                          disabled={sendingWishId === e.id}
                        >
                          {sendingWishId === e.id ? "Sending…" : e.action}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={styles.tdMsg}>
                      No events match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderRadius: 8,
    padding: "13px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  cardHdr: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  cardSub: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },

  filterWrap: {
    position: "relative",
    flexShrink: 0,
  },

  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    padding: "4px 9px",
    borderRadius: 20,
    border: "0.5px solid #B5D4F4",
    background: "#E6F1FB",
    color: "#185FA5",
    cursor: "pointer",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },

  filterMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    minWidth: 130,
    zIndex: 20,
    overflow: "hidden",
  },

  filterOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 12,
    padding: "8px 12px",
    color: "#444",
    cursor: "pointer",
  },

  filterOptionActive: {
    background: "#E6F1FB",
    color: "#185FA5",
    fontWeight: 500,
  },

  tabBadge: {
    fontSize: 9,
    background: "#E24B4A",
    color: "#fff",
    borderRadius: 20,
    padding: "0px 5px",
    fontWeight: 500,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    scrollbarWidth: "none",
  },

  skeletonRow: {
    height: 28,
    borderRadius: 6,
    background: "linear-gradient(90deg,#eef0f2 25%,#f7f8f9 37%,#eef0f2 63%)",
    backgroundSize: "200px 100%",
  },

  group: {
    marginBottom: 10,
  },

  dayHdr: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },

  dayLine: {
    flex: 1,
    height: "0.5px",
    background: "rgba(0,0,0,0.08)",
  },

  dayLabel: {
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },

  eventRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "6px 0",
    borderBottom: "0.5px solid rgba(0,0,0,0.05)",
  },

  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  eventInfo: {
    flex: 1,
    minWidth: 0,
  },

  eventTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "#1a1a1a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  eventSub: {
    fontSize: 10,
    color: "#888",
    marginTop: 1,
  },

  typeChip: {
    fontSize: 9,
    padding: "2px 6px",
    borderRadius: 20,
    textTransform: "capitalize",
    flexShrink: 0,
    fontWeight: 500,
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 0",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#185FA5",
    cursor: "pointer",
    marginTop: 10,
    paddingTop: 8,
    borderTop: "0.5px solid rgba(0,0,0,0.07)",
    flexShrink: 0,
  },

  page: {
    background: C.panel,
    padding: 12,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxSizing: "border-box",
    color: C.ink,
    overflow: "hidden",
  },

  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingRight: 4,
    paddingBottom: 12,
  },

  header: {
    background: "#fff",
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
  },

  title: {
    fontSize: 17,
    fontWeight: 700,
    color: C.ink,
    margin: 0,
    whiteSpace: "nowrap",
  },

  metaChip: {
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    padding: "3px 8px",
    whiteSpace: "nowrap",
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    background: C.indigo,
    color: "#fff",
    cursor: "pointer",
  },

  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    border: `1px solid ${C.line}`,
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    background: "#fff",
    color: C.ink,
    cursor: "pointer",
  },

  ghostBtnActive: {
    borderColor: C.indigo,
    color: C.indigo,
    background: C.indigoSoft,
  },

  aiDot: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: C.indigo,
  },

  filterArea: {
    borderTop: `1px solid ${C.line}`,
    background: "#FAFBFD",
    padding: "12px 14px",
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  filterLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: `1px solid ${C.line}`,
    borderRadius: 7,
    background: "#fff",
    padding: "0 10px",
    height: 34,
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    background: "transparent",
    minWidth: 0,
    color: C.ink,
  },

  segment: {
    display: "inline-flex",
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 7,
    padding: 2,
    height: 34,
    boxSizing: "border-box",
  },

  segBtn: {
    border: "none",
    background: "transparent",
    padding: "0 12px",
    fontSize: 12,
    fontWeight: 600,
    color: C.muted,
    borderRadius: 5,
    cursor: "pointer",
  },

  segBtnActive: {
    background: "#fff",
    color: C.indigo,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "0 10px",
    height: 30,
    borderRadius: 20,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },

  errorBanner: {
    background: C.redSoft,
    color: "#9A2F2F",
    border: "1px solid #F3C7C7",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    flexShrink: 0,
  },

  kpi: {
    background: "#fff",
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "14px 16px",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    minWidth: 0,
  },

  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  kpiLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  kpiVal: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    marginTop: 2,
  },

  kpiSub: {
    fontSize: 11,
    color: C.faint,
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  panel: {
    background: "#fff",
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    minWidth: 0,
  },

  secHead: {
    background: C.panel,
    borderBottom: `1px solid ${C.line}`,
    padding: "9px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  secTitle: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12,
    fontWeight: 700,
    color: C.navy,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  panelBody: {
    padding: "12px 14px 14px",
    flex: 1,
  },

  hint: {
    fontSize: 11,
    color: C.faint,
    marginBottom: 8,
  },

  weekChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    height: 180,
    marginTop: 6,
  },

  weekCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    minWidth: 0,
  },

  weekVal: {
    fontSize: 11,
    fontWeight: 700,
    color: C.ink,
    height: 16,
  },

  weekBar: {
    flex: 1,
    width: "100%",
    maxWidth: 46,
    display: "flex",
    flexDirection: "column-reverse",
    background: C.panel,
    borderRadius: 4,
    overflow: "hidden",
  },

  weekLbl: {
    fontSize: 10,
    color: C.faint,
    marginTop: 6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },

  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    fontSize: 11,
    color: C.muted,
  },

  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },

  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  barLbl: {
    fontSize: 12,
    color: C.navy,
    width: 120,
    flexShrink: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-flex",
    alignItems: "center",
  },

  barBg: {
    flex: 1,
    height: 18,
    background: C.panel,
    borderRadius: 4,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    paddingLeft: 6,
    boxSizing: "border-box",
    transition: "width .3s",
  },

  barInner: {
    fontSize: 10,
    fontWeight: 700,
    color: "#fff",
    whiteSpace: "nowrap",
  },

  barVal: {
    fontSize: 12,
    fontWeight: 700,
    color: C.ink,
    minWidth: 24,
    textAlign: "right",
  },

  tableWrap: {
    maxHeight: 420,
    overflowY: "auto",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },

  th: {
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 700,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: `1px solid ${C.line}`,
  },

  td: {
    padding: "10px 14px",
    verticalAlign: "middle",
    fontSize: 13,
  },

  tdMsg: {
    textAlign: "center",
    padding: 30,
    color: C.faint,
    fontSize: 13,
  },

  statusChip: {
    padding: "3px 9px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  dayPill: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 10,
    marginTop: 3,
  },

  actionBtn: {
    padding: "5px 11px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    background: C.indigoSoft,
    color: C.indigo,
    border: "1px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default UpcomingEvents;