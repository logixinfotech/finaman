import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { initERPShortcuts } from "./utils/erpShortcuts";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./components/Layout/Dashboard";
import Footer from "./components/Layout/Footer";
import LoginPage from "./pages/Login/Login";
import { fetchMasmnuData, logoutUser } from "./utils/api";
import "./App.css";
import Swal from "sweetalert2";
import { useNotifications } from "./theme/NotificationContext";
import NotificationToast from "./components/Layout/Notification/NotificationToast"; 
import 'primeicons/primeicons.css';
function AppShell({
  theme,
  sidebarCollapsed,
  toggleSidebar,
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

  return (
    <div className={`app-layout ${theme}`}>
      <div className="app-body"> 
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
            fixed top-0 left-0 h-screen lg:h-full lg:relative z-50 lg:z-auto
            transition-transform duration-300 ease-in-out
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onMenuItemClick={(mod) => {
              handleModuleClick(mod);
              setMobileSidebarOpen(false); // close overlay after tap on mobile
            }}
            onToggleSidebar={toggleSidebar}
          />
        </div> 
        <div className="layout-main flex-1 min-w-0">
          <Header
            theme={theme}
            setTheme={setTheme}
            onLogout={handleLogout}
            onOpenPage={handleOpenPageFromMenu}
            allMenus={menusFromBackend}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />

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

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    !!sessionStorage.getItem("token")
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("finaman-theme") || "theme-light"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [menusFromBackend, setMenusFromBackend] = useState([]);
  const { setMenusFromBackend: syncMenusToContext } = useNotifications();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Theme sync ──────────────────────────────────────────────────────────
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

  // ── Disable autocomplete globally ──────────────────────────────────────
  useEffect(() => {
    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => input.setAttribute("autocomplete", "off"));
  }, []);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  // ── Load menus ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadMenus = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const data = await fetchMasmnuData(token);
        setMenusFromBackend(data || []);
        syncMenusToContext(data || []);
        console.log("[Menus synced to context]", data?.length, "items");
      } catch (error) {
        console.error("Error loading menus:", error);
      }
    };
    if (isAuthenticated) loadMenus();
  }, [isAuthenticated, syncMenusToContext]); 
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        // Mobile: always reset collapsed so overlay shows full sidebar
        setSidebarCollapsed(false);
      } else if (w < 1024) {
        // Tablet: icon-only in the persistent sidebar
        setSidebarCollapsed(true);
      } else {
        // Desktop: full sidebar
        setSidebarCollapsed(false);
      }
    };

    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Tab / navigation handlers ───────────────────────────────────────────
  const handleModuleClick = (module) => {
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
      };
      const withoutOldModule = prev.filter((t) => t.type !== "module");
      const updatedTabs = [moduleTab, ...withoutOldModule];
      setActiveTabId(moduleTabId);
      return updatedTabs;
    });
    navigate("/app");
  };

  const handleOpenPageFromMenu = (menuItem) => {
    const baseId = `page-${menuItem.masmnu_id}`;
    const samePageTabs = tabs.filter((t) => t.id.startsWith(baseId));
    let updatedTabs = [...tabs];

    if (samePageTabs.length === 0) {
      const newTabId = `${baseId}-1`;
      const newTab = {
        id: newTabId,
        label: menuItem.bar_name,
        type: "page",
        module: activeModule,
        appl_name: menuItem.appl_name,
        duplicateIndex: 1,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTabId);
    } else {
      updatedTabs = updatedTabs.map((tab) => {
        if (tab.id.startsWith(baseId)) {
          const index = tab.duplicateIndex || 1;
          return { ...tab, label: `${menuItem.bar_name} (${index})`, duplicateIndex: index };
        }
        return tab;
      });
      const newIndex = samePageTabs.length + 1;
      const newTabId = `${baseId}-${newIndex}`;
      const newTab = {
        id: newTabId,
        label: `${menuItem.bar_name} (${newIndex})`,
        type: "page",
        module: activeModule,
        appl_name: menuItem.appl_name,
        duplicateIndex: newIndex,
      };
      updatedTabs.push(newTab);
      setTabs(updatedTabs);
      setActiveTabId(newTabId);
    }

    const targetUrl = `/app?page=${menuItem.appl_name}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      navigate(targetUrl);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    if (!page || !tabs.length) return;
    const existingTab = tabs.find((t) => t.appl_name === page);
    if (existingTab) setActiveTabId(existingTab.id);
  }, [tabs]);

  const handleChangeActiveTab = (tabId) => {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    const targetUrl = tab?.appl_name ? `/app?page=${tab.appl_name}` : "/app";
    if (window.location.pathname + window.location.search !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleCloseTab = (tabId) => {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== tabId);
      if (tabId === activeTabId) {
        const last = remaining[remaining.length - 1];
        setActiveTabId(last ? last.id : null);
        if (last?.appl_name) navigate(`/app?page=${last.appl_name}`);
        else navigate("/app");
      }
      return remaining;
    });
  };

  const toggleSidebar = () => setSidebarCollapsed((p) => !p);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  // ── Routes ──────────────────────────────────────────────────────────────
  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
          )
        }
      />

      <Route
        path="/app"
        element={
          isAuthenticated ? (
            <AppShell
              theme={theme}
              sidebarCollapsed={sidebarCollapsed}
              toggleSidebar={toggleSidebar}
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
              setMobileSidebarOpen={setMobileSidebarOpen}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
