import { createContext, useCallback, useContext, useEffect, useState } from "react";

const KEY = "finaman-font-scale";
export const MIN = 80;
export const MAX = 140;
export const DEFAULT = 100;

const clamp = (n) => Math.min(MAX, Math.max(MIN, Number(n) || DEFAULT));

const FontScaleContext = createContext({
  fontScale: DEFAULT,
  setFontScale: () => {},
});

export function FontScaleProvider({ children }) {
  const [fontScale, setScale] = useState(() => clamp(localStorage.getItem(KEY)));

  // html ka font-size badalte hi poora Tailwind (rem based) scale ho jata hai
 useEffect(() => {
  document.documentElement.style.fontSize = "";
  document.documentElement.style.setProperty("--fs", fontScale / 100);
  try { localStorage.setItem(KEY, String(fontScale)); } catch {}
}, [fontScale]);

  const setFontScale = useCallback((v) => setScale(clamp(v)), []);

  return (
    <FontScaleContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export const useFontScale = () => useContext(FontScaleContext);