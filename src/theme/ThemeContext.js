// src/theme/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
});

const THEME_KEY = "finaman-theme";
const THEME_CLASSES = ["theme-light", "theme-dark", "theme-blue"];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved || "light";
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
