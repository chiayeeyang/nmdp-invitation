/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15334f",
        pearl: "#eaf0f6",
        blush: "#efc4e0",
        ice: "#85b9e1",
        gold: "#ffe0a3",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Helvetica Neue", "Arial", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { glass: "999px" },
      boxShadow: { glass: "inset 0 1px 3px #fff, 0 8px 28px #7185a01a" },
    },
  },
};
