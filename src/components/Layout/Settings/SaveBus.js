import { createContext, useContext, useEffect } from "react";

export const SaveCtx = createContext(null);

export const useSaveBus = () => useContext(SaveCtx);

// every editable block registers { dirty, save }; the toolbar Save calls them all
export function useSaveSlot(id, dirty, save) {
  const bus = useContext(SaveCtx);
  useEffect(() => {
    bus?.set(id, { dirty, save });
    return () => bus?.remove(id);
  }, [bus, id, dirty, save]);
}