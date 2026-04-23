/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        '3xl': '2200px', // Customize the pixel value as needed
      },
      colors: {

        bgMain: "var(--bg-main)",
        bgFooter: "var(--bg-footer)",
        bgSidebar: "var(--bg-sidebar)",
        bgActive: "var(--bg-active)",
        bgHover: "var(--bg-hover)",

        textMain: "var(--text-main)",
        textMuted: "var(--text-muted)",
        textActive: "var(--text-active)",

        accentSoft: "var(--accent-soft)",
        accentHover: "var(--accent-hover)",

        borderMain: "var(--border-main)",
      },
      borderRadius: {
        xl2: "18px",
      },
      boxShadow: {
        soft: "0 6px 16px rgba(15,23,42,0.08)",
        deep: "0 16px 40px rgba(15,23,42,0.18)",
      },
    },
  },
  plugins: [],
};

