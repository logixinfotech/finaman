import { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { initERPShortcuts } from "./utils/erpShortcuts";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./components/Layout/Dashboard";
import PublicQuotationRate from "./components/Publiccomponents/PublicQuotationRate";
import PublicCandidateApply from "./components/Publiccomponents/PublicCandidateApply";
import Footer from "./components/Layout/Footer";
import LoginPage from "./pages/Login/Login";
import { fetchMasmnuData, logoutUser } from "./utils/api";
import "./App.css";
import Swal from "sweetalert2";
import { useNotifications } from "./theme/NotificationContext";
import NotificationToast from "./components/Layout/Notification/NotificationToast";
import { startGlobalAutocompleteGuard } from "./utils/disableGlobalAutocomplete";
import 'primeicons/primeicons.css';
import { useAuth } from "./theme/AuthContext";
import { ShortcutsProvider } from "./utils/Shortcuts/ShortcutsContext";
import { NavShortcutsProvider } from "./utils/Shortcuts/NavShortcutContext";
function AppShell({
  theme,
  sidebarCollapsed,
  toggleSidebar,
  mobtoggleSidebar,
  handleModuleClick,
  setTheme,
  menusFromBackend,
  activeModule,
  tabs,
  activeTab,
  handleOpenPageFromMenu,
  handleChangeActiveTab,
  handleCloseTab,
  setTabs,
  mobileSidebarOpen,
  setSidebarCollapsed,
  setMobileSidebarOpen,
}) {
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      await logoutUser();
    }
  };
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isWebView =
    /wv/.test(navigator.userAgent) ||                          // Android WebView
    (isIOS && !/Safari/.test(navigator.userAgent));             // iOS WebView (real Safari always has "Safari" token)



  return (
    <div
      className={`app-layout flex flex-col overflow-hidden ${theme}`}
      style={{
        height:
          window.innerWidth < 768
            ? "calc(100dvh - env(safe-area-inset-top))"
            : "100vh",
      }}
    >

      <Header
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
        onToggleSidebar={toggleSidebar}
        onOpenPage={handleOpenPageFromMenu}
        allMenus={menusFromBackend}
        onOpenMobileSidebar={mobtoggleSidebar}

      />

      <div className="app-body flex-1 flex overflow-hidden">
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <div
          className={`
    layout-sidebar
    ${sidebarCollapsed ? "collapsed" : ""}
    fixed left-0 z-50 lg:z-auto
    transition-transform duration-300 ease-in-out
    ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    lg:relative lg:translate-x-0
  `}
          style={{
            marginTop: isWebView ? "100px" : "0px",
          }}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onMenuItemClick={(mod) => {
              handleModuleClick(mod);
              setSidebarCollapsed(true)
              setMobileSidebarOpen(false); // close overlay after tap on mobile
            }}
            onToggleSidebar={toggleSidebar}
          />
        </div>

        <div className="layout-main flex-1 min-w-0 overflow-y-auto">
          <div className="layout-content">
            <Dashboard
              activeModule={activeModule}
              tabs={tabs}
              activeTab={activeTab}
              onOpenPage={handleOpenPageFromMenu}
              onChangeActiveTab={handleChangeActiveTab}
              onCloseTab={handleCloseTab}
              setTabs={setTabs}
            />
          </div>
        </div>
      </div>
      <Footer activeModule={activeModule} />
      <NotificationToast onOpenPage={handleOpenPageFromMenu} />
    </div>

  );
}
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { token } = useAuth();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("finaman-theme") || "theme-light"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [menusFromBackend, setMenusFromBackend] = useState([]);
  const { setMenusFromBackend: syncMenusToContext } = useNotifications();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-blue", "theme-green");
    root.classList.add(theme);
    localStorage.setItem("finaman-theme", theme);
  }, [theme]);

  // ── ERP keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const cleanup = initERPShortcuts({
      onSearch: () => {
        const tableSearch = document.querySelector("#table-search");
        const globalSearch = document.querySelector("#global-search");
        if (tableSearch) tableSearch.focus();
        else if (globalSearch) globalSearch.focus();
      },
    });
    return cleanup;
  }, []);
  useEffect(() => {
    const stop = startGlobalAutocompleteGuard();
    return stop;
  }, []);


  // ── Disable autocomplete globally ──────────────────────────────────────
  useEffect(() => {
    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => input.setAttribute("autocomplete", "off"));
  }, []);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const publicPaths = ["/quotation-rate", "/apply", "/careers"];
    const isPublicPath = publicPaths.some((p) => window.location.pathname.startsWith(p));

    if (!isAuthenticated && !isPublicPath) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  useEffect(() => {
    const loadMenus = async () => {
      try {
        if (!token) return;
        const data = await fetchMasmnuData(token);
        setMenusFromBackend(data || []);
        syncMenusToContext(data || []);
      } catch (error) {
        console.error("Error loading menus:", error);
      }
    };
    if (isAuthenticated) loadMenus();
  }, [isAuthenticated, token, syncMenusToContext]);
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setSidebarCollapsed(false);
      } else if (w < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleModuleClick = (module) => {
    if (module.masmod_id === 20) {
      const workDiaryMenu = {
        masmnu_id: 642,
        bar_name: "Task Manager",
        appl_name: "WorkDiaryForm",
        appl_type: "A",
        icon_name: null,
      };
      setActiveModule(module); // module context set karo
      handleOpenPageFromMenu(workDiaryMenu);
      return; // module dashboard mat dikhao
    }
    const moduleTabId = `mod-${module.masmod_id}`;
    setActiveModule(module);
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === moduleTabId);
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }
      const moduleTab = {
        id: moduleTabId,
        label: module.mod_name,
        type: "module",
        module,
        appl_name: null,
        icon_name: module.icon_name,
      };
      const withoutOldModule = prev.filter((t) => t.type !== "module");
      const updatedTabs = [moduleTab, ...withoutOldModule];
      setActiveTabId(moduleTabId);
      return updatedTabs;
    });
    navigate("/app");
  };
  const handleOpenPageFromMenu = (menuItem, opts = {}) => {
  const { newTab = true } = opts; // Header/Notification ka purana behaviour: naya tab
  const baseId = `page-${menuItem.masmnu_id}`;
  const currentTabs = tabsRef.current;
  const activeId = activeTabIdRef.current;
  const activeT = currentTabs.find((t) => t.id === activeId);

  const goTo = (tab) => {
    const url = `/app?page=${tab.appl_name}&tab=${tab.id}`;
    if (window.location.pathname + window.location.search !== url) navigate(url);
  };

  // ── Same jagah kholo: active PAGE tab ko replace karo ─────────────────
  // (module tab ko replace nahi karte, warna menu grid gayab ho jayega)
 // ── Same jagah kholo: active tab (module ho ya page) ko replace karo ──
if (!newTab && activeT) {
  // Wahi page pehle se kisi aur tab mein khula hai, to bas usi par jao
  const samePageOthers = currentTabs.filter(
    (t) => t.id !== activeT.id && t.appl_name === menuItem.appl_name
  );
  if (samePageOthers.length > 0) {
    const target = samePageOthers[0];
    activeTabIdRef.current = target.id;
    setActiveTabId(target.id);
    goTo(target);
    return;
  }

  // Naya unique id (module tab ka id "mod-X" tha, use badalna zaroori hai)
  const usedIds = new Set(currentTabs.map((t) => t.id));
  let n = 1;
  while (usedIds.has(`${baseId}-${n}`)) n++;

  const replaced = {
    id: `${baseId}-${n}`,
    label: menuItem.bar_name,
    type: "page",
    module: activeT.module || activeModule,   // module context bana rahe
    appl_name: menuItem.appl_name,
    duplicateIndex: n,
    icon_name: menuItem.icon_name,
    params: menuItem.params || {},
  };

  // Same position par swap
  const updated = currentTabs.map((t) => (t.id === activeT.id ? replaced : t));
  tabsRef.current = updated;
  activeTabIdRef.current = replaced.id;
  setTabs(updated);
  setActiveTabId(replaced.id);
  goTo(replaced);
  return;
}

  // ── Naya tab kholo (purana logic, bas URL mein tab id) ────────────────
  const samePageTabs = currentTabs.filter(
    (t) => t.id.startsWith(baseId) || t.appl_name === menuItem.appl_name
  );
  let updatedTabs = [...currentTabs];
  let newTab_;

  if (samePageTabs.length === 0) {
    newTab_ = {
      id: `${baseId}-1`,
      label: menuItem.bar_name,
      type: "page",
      module: activeModule,
      appl_name: menuItem.appl_name,
      duplicateIndex: 1,
      icon_name: menuItem.icon_name,
      params: menuItem.params || {},
    };
    updatedTabs.push(newTab_);
  } else {
    updatedTabs = updatedTabs.map((tab) => {
      if (tab.id.startsWith(baseId) || tab.appl_name === menuItem.appl_name) {
        const index = tab.duplicateIndex || 1;
        return { ...tab, label: `${menuItem.bar_name} (${index})`, duplicateIndex: index };
      }
      return tab;
    });
    // Max index + 1 (length+1 se id collide ho sakta hai jab beech ka tab close ho)
    const maxIdx = Math.max(...samePageTabs.map((t) => t.duplicateIndex || 1));
    const newIndex = maxIdx + 1;
    newTab_ = {
      id: `${baseId}-${newIndex}`,
      label: `${menuItem.bar_name} (${newIndex})`,
      type: "page",
      module: activeModule,
      appl_name: menuItem.appl_name,
      duplicateIndex: newIndex,
      icon_name: menuItem.icon_name,
      params: menuItem.params || {},
    };
    updatedTabs.push(newTab_);
  }

  tabsRef.current = updatedTabs;
  activeTabIdRef.current = newTab_.id;
  setTabs(updatedTabs);
  setActiveTabId(newTab_.id);
  goTo(newTab_);
};
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const page = params.get("page");
  const tabId = params.get("tab");

  if (!page || !menusFromBackend.length) return;

  const currentTabs = tabsRef.current;

  // Pehle exact tab id se dhundo, phir appl_name se
  const existingTab =
    (tabId && currentTabs.find((t) => t.id === tabId)) ||
    currentTabs.find((t) => t.appl_name === page);

  if (existingTab) {
    if (activeTabIdRef.current !== existingTab.id) {
      activeTabIdRef.current = existingTab.id;
      setActiveTabId(existingTab.id);
    }
    return;
  }

  const menuItem = menusFromBackend.find((menu) => menu.appl_name === page);
  if (!menuItem) {
    console.warn(`No menu found for page: ${page}`);
    return;
  }
  handleOpenPageFromMenu(menuItem, { newTab: true });
}, [location.search, menusFromBackend]);
  // const handleOpenPageFromMenu = (menuItem) => {
  //   const baseId = `page-${menuItem.masmnu_id}`;
  //   const currentTabs = tabsRef.current;
  //   const samePageTabs = currentTabs.filter((t) => t.id.startsWith(baseId) || t.appl_name === menuItem.appl_name);
  //   let updatedTabs = [...currentTabs];

  //   if (samePageTabs.length === 0) {
  //     const newTabId = `${baseId}-1`;
  //     const newTab = {
  //       id: newTabId,
  //       label: menuItem.bar_name,
  //       type: "page",
  //       module: activeModule,
  //       appl_name: menuItem.appl_name,
  //       duplicateIndex: 1,
  //       icon_name: menuItem.icon_name,
  //       params: menuItem.params || {},
  //     };
  //     const updated = [...currentTabs, newTab];
  //     tabsRef.current = updated;
  //     activeTabIdRef.current = newTabId;
  //     setTabs(updated);
  //     setActiveTabId(newTabId);
  //   } else {
  //     updatedTabs = updatedTabs.map((tab) => {
  //       if (tab.id.startsWith(baseId) || tab.appl_name === menuItem.appl_name) {
  //         const index = tab.duplicateIndex || 1;
  //         return { ...tab, label: `${menuItem.bar_name} (${index})`, duplicateIndex: index };
  //       }
  //       return tab;
  //     });
  //     const newIndex = samePageTabs.length + 1;
  //     const newTabId = `${baseId}-${newIndex}`;
  //     const newTab = {
  //       id: newTabId,
  //       label: `${menuItem.bar_name} (${newIndex})`,
  //       type: "page",
  //       module: activeModule,
  //       appl_name: menuItem.appl_name,
  //       duplicateIndex: newIndex,
  //       icon_name: menuItem.icon_name,
  //       params: menuItem.params || {},
  //     };
  //     updatedTabs.push(newTab);
  //     tabsRef.current = updatedTabs;
  //     activeTabIdRef.current = newTabId;
  //     setTabs(updatedTabs);
  //     setActiveTabId(newTabId);
  //   }

  //   const targetUrl = `/app?page=${menuItem.appl_name}`;
  //   if (window.location.pathname + window.location.search !== targetUrl) {
  //     navigate(targetUrl);
  //   }
  // };
  // now what is heppning when i am click on the already open sub menu it is opening the new tab with index 2 but it redirects to the first tab of that sub menu i want it to open the new tab with index 2 and also redirects to the second tab of that sub menu. 
  // useEffect(() => {
  //   const params = new URLSearchParams(location.search);
  //   const page = params.get("page");

  //   if (!page || !menusFromBackend.length) return;

  //   const currentTabs = tabsRef.current;
  //   const existingTab = currentTabs.find(
  //     (tab) => tab.appl_name === page
  //   );

  //   if (existingTab) {
  //     if (activeTabIdRef.current !== existingTab.id) {
  //       activeTabIdRef.current = existingTab.id;
  //       setActiveTabId(existingTab.id);
  //     }
  //     return;
  //   }

  //   const menuItem = menusFromBackend.find(
  //     (menu) => menu.appl_name === page
  //   );

  //   if (!menuItem) {
  //     console.warn(`No menu found for page: ${page}`);
  //     return;
  //   }

  //   handleOpenPageFromMenu(menuItem);
  // }, [location.search, menusFromBackend]);

  const handleChangeActiveTab = (tabId) => {
    activeTabIdRef.current = tabId;
    setActiveTabId(tabId);
    const tab = tabsRef.current.find((t) => t.id === tabId);
   const targetUrl = tab?.appl_name ? `/app?page=${tab.appl_name}&tab=${tab.id}` : "/app";

    if (window.location.pathname + window.location.search !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleCloseTab = (tabId) => {
    const currentTabs = tabsRef.current;
    const idx = currentTabs.findIndex((tab) => tab.id === tabId);
    const remaining = currentTabs.filter((tab) => tab.id !== tabId);
    tabsRef.current = remaining;
    setTabs(remaining);

    // Closing the currently active tab
    if (tabId === activeTabIdRef.current) {
      const nextTab =
        remaining[idx] ||
        remaining[idx - 1] ||
        remaining[remaining.length - 1] ||
        null;
      activeTabIdRef.current = nextTab?.id || null;
      setActiveTabId(nextTab?.id || null);

     if (nextTab?.appl_name) {
  navigate(`/app?page=${nextTab.appl_name}&tab=${nextTab.id}`);
} else {
  navigate("/app");
}
    }
  };

  const toggleSidebar = () => setSidebarCollapsed((p) => !p);
  const mobtoggleSidebar = () => setMobileSidebarOpen((p) => !p);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  // ── Routes ──────────────────────────────────────────────────────────────
  return (
    <ShortcutsProvider>
       <NavShortcutsProvider
    menus={menusFromBackend}
    tabs={tabs}
    activeTabId={activeTabId}
    onOpenPage={handleOpenPageFromMenu}
    onChangeActiveTab={handleChangeActiveTab}
  >
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginPage onLoginSuccess={() => { }} />
          )
        }
      />    <Route
        path="/app"
        element={
          isAuthenticated ? (
            <AppShell
              theme={theme}
              sidebarCollapsed={sidebarCollapsed}
              toggleSidebar={toggleSidebar}
              mobtoggleSidebar={mobtoggleSidebar}
              handleModuleClick={handleModuleClick}
              setTheme={setTheme}
              menusFromBackend={menusFromBackend}
              activeModule={activeModule}
              tabs={tabs}
              activeTab={activeTab}
              handleOpenPageFromMenu={handleOpenPageFromMenu}
              handleChangeActiveTab={handleChangeActiveTab}
              handleCloseTab={handleCloseTab}
              setTabs={setTabs}
              mobileSidebarOpen={mobileSidebarOpen}
              setSidebarCollapsed={setSidebarCollapsed}
              setMobileSidebarOpen={setMobileSidebarOpen}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/quotation-rate" element={<PublicQuotationRate />} />
      <Route path="/apply" element={<PublicCandidateApply />} />
      <Route path="/careers" element={<PublicCandidateApply />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
    </NavShortcutsProvider>
    </ShortcutsProvider>
  );
}

export default App;
