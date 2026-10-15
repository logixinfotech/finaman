// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./src/**/*.{js,jsx}"],
//   theme: {
//     extend: {
//       theme: {
//   extend: {
//     fontSize: {
//       xs:    ["calc(0.75rem * var(--fs, 1))",  { lineHeight: "calc(1rem * var(--fs, 1))" }],
//       sm:    ["calc(0.875rem * var(--fs, 1))", { lineHeight: "calc(1.25rem * var(--fs, 1))" }],
//       base:  ["calc(1rem * var(--fs, 1))",     { lineHeight: "calc(1.5rem * var(--fs, 1))" }],
//       lg:    ["calc(1.125rem * var(--fs, 1))", { lineHeight: "calc(1.75rem * var(--fs, 1))" }],
//       xl:    ["calc(1.25rem * var(--fs, 1))",  { lineHeight: "calc(1.75rem * var(--fs, 1))" }],
//       "2xl": ["calc(1.5rem * var(--fs, 1))",   { lineHeight: "calc(2rem * var(--fs, 1))" }],
//       "3xl": ["calc(1.875rem * var(--fs, 1))", { lineHeight: "calc(2.25rem * var(--fs, 1))" }],
//     },
//   },
// },
//       screens: {
//         '3xl': '2200px', // Customize the pixel value as needed
//       },
//       colors: {

//         bgMain: "var(--bg-main)",
//         bgFooter: "var(--bg-footer)",
//         bgSidebar: "var(--bg-sidebar)",
//         bgActive: "var(--bg-active)",
//         bgHover: "var(--bg-hover)",

//         textMain: "var(--text-main)",
//         textMuted: "var(--text-muted)",
//         textActive: "var(--text-active)",

//         accentSoft: "var(--accent-soft)",
//         accentHover: "var(--accent-hover)",

//         borderMain: "var(--border-main)",
//       },
//       borderRadius: {
//         xl2: "18px",
//       },
//       boxShadow: {
//         soft: "0 6px 16px rgba(15,23,42,0.08)",
//         deep: "0 16px 40px rgba(15,23,42,0.18)",
//       },
//     },
//   },
//   plugins: [],
// };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontSize: {
        xs:    ["calc(0.75rem * var(--fs, 1))",  { lineHeight: "calc(1rem * var(--fs, 1))" }],
        sm:    ["calc(0.875rem * var(--fs, 1))", { lineHeight: "calc(1.25rem * var(--fs, 1))" }],
        base:  ["calc(1rem * var(--fs, 1))",     { lineHeight: "calc(1.5rem * var(--fs, 1))" }],
        lg:    ["calc(1.125rem * var(--fs, 1))", { lineHeight: "calc(1.75rem * var(--fs, 1))" }],
        xl:    ["calc(1.25rem * var(--fs, 1))",  { lineHeight: "calc(1.75rem * var(--fs, 1))" }],
        "2xl": ["calc(1.5rem * var(--fs, 1))",   { lineHeight: "calc(2rem * var(--fs, 1))" }],
        "3xl": ["calc(1.875rem * var(--fs, 1))", { lineHeight: "calc(2.25rem * var(--fs, 1))" }],
      },
      screens: {
        "3xl": "2200px", // Customize the pixel value as needed
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