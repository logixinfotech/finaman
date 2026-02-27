import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import LoginPage from "./pages/Login/Login";
import { fetchMasmnuData } from './utils/api';

import "./App.css";

function App() {
  const navigate = useNavigate(); 
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem("token");
  }); 
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("finaman-theme") || "theme-light";
  }); 
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
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  useEffect(() => {
  const loadMenus = async () => {
    try {
      const token = sessionStorage.getItem("token");
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
  setActiveModule(module);

  const moduleTab = {
    id: `mod-${module.masmod_id}`,
    label: module.mod_name,
    type: "module",
    module,
    appl_name: null,
  };

  setTabs((prev) => { 
    const withoutOldModule = prev.filter((t) => t.type !== "module");
    return [moduleTab, ...withoutOldModule];
  });

  setActiveTabId(moduleTab.id);
  navigate("/app");
}; 
  const handleOpenPageFromMenu = (menuItem) => {
    const tabId = `page-${menuItem.masmnu_id}`;

    setTabs((prev) => {
      if (prev.find((t) => t.id === tabId)) return prev;

      return [
        ...prev,
        {
          id: tabId,
          label: menuItem.bar_name,
          type: "page",
          module: activeModule,
          appl_name: menuItem.appl_name,
        },
      ];
    });

    setActiveTabId(tabId); 
    navigate(`/app?page=${menuItem.appl_name}`);
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
    if (tab?.appl_name) {
      navigate(`/app?page=${tab.appl_name}`);
    } else {
      navigate("/app");
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
const AppShell = () => (
  <div className={`app-layout ${theme}`}>
    
    {/* LEFT SIDE – FULL HEIGHT SIDEBAR */}
    <div className={`layout-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onMenuItemClick={handleModuleClick}
        onToggleSidebar={toggleSidebar}
      />
    </div>

    {/* RIGHT SIDE – HEADER + CONTENT + FOOTER */}
    <div className="layout-main">
      
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

      <Footer activeModule={activeModule} />
    </div>
  </div>
);

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
          isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
