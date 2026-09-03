import { createContext, useContext } from "react";

const TabContext = createContext({ closeTab: null });

export const useTab = () => useContext(TabContext);

export function TabProvider({ closeTab, children }) {
  return <TabContext.Provider value={{ closeTab }}>{children}</TabContext.Provider>;
}