/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#1e40af",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        info: "#06b6d4",
        light: "#f3f4f6",
        dark: "#1f2937",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        safe: "1rem",
      },
    },
  },
  plugins: [],
};
