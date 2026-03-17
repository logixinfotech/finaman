import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { initERPShortcuts } from "./utils/erpShortcuts";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./components/Layout/Dashboard";
import Footer from "./components/Layout/Footer";
import LoginPage from "./pages/Login/Login";
import { fetchMasmnuData } from "./utils/api";
import "./App.css";

function AppShell({
  theme,
  sidebarCollapsed,
  toggleSidebar,
  handleModuleClick,
  handleLogout,
  setTheme,
  menusFromBackend,
  activeModule,
  tabs,
  activeTab,
  handleOpenPageFromMenu,
  handleChangeActiveTab,
  handleCloseTab,
  setTabs,
}) {
  return (
    <div className={`app-layout ${theme}`}>
      <div className="app-body">
        <div className={`layout-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onMenuItemClick={handleModuleClick}
            onToggleSidebar={toggleSidebar}
          />
        </div>

        <div className="layout-main flex-1">
          <Header
            theme={theme}
            setTheme={setTheme}
            onLogout={handleLogout}
            onOpenPage={handleOpenPageFromMenu}
            allMenus={menusFromBackend}
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
    </div>
  );
}
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

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove(
      "theme-light",
      "theme-dark",
      "theme-blue",
      "theme-green"
    );

    root.classList.add(theme);
    localStorage.setItem("finaman-theme", theme);
  }, [theme]);

  useEffect(() => {
    const cleanup = initERPShortcuts({
      onSearch: () => {
        const tableSearch = document.querySelector("#table-search");
        const globalSearch = document.querySelector("#global-search");

        if (tableSearch) tableSearch.focus();
        else if (globalSearch) globalSearch.focus();
      }
    });

    return cleanup;
  }, []);
useEffect(() => {
  const disableAutocomplete = () => {
    const inputs = document.querySelectorAll("input");

    inputs.forEach((input) => {
      input.setAttribute("autocomplete", "off");
    });
  };

  disableAutocomplete();
}, []);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  useEffect(() => {
    const loadMenus = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const data = await fetchMasmnuData(token);
        setMenusFromBackend(data || []);
      } catch (error) {
        console.error("Error loading menus:", error);
      }
    };

    if (isAuthenticated) {
      loadMenus();
    }
  }, [isAuthenticated]);
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

    const samePageTabs = tabs.filter((t) =>
      t.id.startsWith(baseId)
    );

    const duplicateNumber = samePageTabs.length + 1;

    const newTabId = `${baseId}-${duplicateNumber}`;

    const newTab = {
      id: newTabId,
      label: `${menuItem.bar_name} (${duplicateNumber})`,
      type: "page",
      module: activeModule,
      appl_name: menuItem.appl_name,
      duplicateIndex: duplicateNumber,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);

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
    if (existingTab) {
      setActiveTabId(existingTab.id);
    }
  }, [tabs]);
  const handleChangeActiveTab = (tabId) => {
    setActiveTabId(tabId);

    const tab = tabs.find((t) => t.id === tabId);

    const targetUrl = tab?.appl_name
      ? `/app?page=${tab.appl_name}`
      : "/app";

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

        if (last?.appl_name) {
          navigate(`/app?page=${last.appl_name}`);
        } else {
          navigate("/app");
        }
      }

      return remaining;
    });
  };
  const toggleSidebar = () => {
    setSidebarCollapsed((p) => !p);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setTabs([]);
    setActiveModule(null);
    navigate("/login", { replace: true });
  };
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
              handleLogout={handleLogout}
              setTheme={setTheme}
              menusFromBackend={menusFromBackend}
              activeModule={activeModule}
              tabs={tabs}
              activeTab={activeTab}
              handleOpenPageFromMenu={handleOpenPageFromMenu}
              handleChangeActiveTab={handleChangeActiveTab}
              handleCloseTab={handleCloseTab}
              setTabs={setTabs}
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