// import { createContext, useContext } from "react";

// const TabContext = createContext({ closeTab: null, openTab: null });

// export const useTab = () => useContext(TabContext);

// export function TabProvider({ closeTab, openTab, children }) {
//   return <TabContext.Provider value={{ closeTab, openTab }}>{children}</TabContext.Provider>;
// }
import { createContext, useContext } from "react";

const TabContext = createContext({ closeTab: null, registerCloseGuard: null, openTab: null });

export const useTab = () => useContext(TabContext);

export function TabProvider({ closeTab, registerCloseGuard, children, openTab  }) {
  return (
    <TabContext.Provider value={{ closeTab, registerCloseGuard , openTab  }}>
      {children}
    </TabContext.Provider>
  );
}