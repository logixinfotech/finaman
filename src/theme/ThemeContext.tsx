import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeName = "light" | "dark" | "blue";

interface ThemeContextType {
    theme: ThemeName;
    setTheme: (t: ThemeName) => void;
    toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeName>(() => {
        const saved = localStorage.getItem("finaman-theme") as ThemeName | null;
        return saved || "light";
    });

    useEffect(() => {
        localStorage.setItem("finaman-theme", theme);
        document.documentElement.classList.remove("light", "dark", "blue");
        document.documentElement.classList.add(theme);
    }, [theme]);

    const toggleDark = () => setTheme(theme === "dark" ? "light" : "dark");

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleDark }}>
            {children}
        </ThemeContext.Provider>
    );
};
