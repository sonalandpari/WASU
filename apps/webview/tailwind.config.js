/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aurora: {
          bg: "#0B0F14",
          secondary: "#111820",
          sidebar: "#0E141B",
          card: "#151E28",
          cardHover: "#1A2532",
          border: "#263442",
          borderSubtle: "#1C2733",
          primary: "#69D6E8",
          primaryMuted: "rgba(105, 214, 232, 0.15)",
          secondaryAccent: "#8B9CFF",
          secondaryMuted: "rgba(139, 156, 255, 0.15)",
          success: "#4ADE80",
          successMuted: "rgba(74, 222, 128, 0.15)",
          warning: "#F6C177",
          warningMuted: "rgba(246, 193, 119, 0.15)",
          error: "#F87171",
          errorMuted: "rgba(248, 113, 113, 0.15)",
          textPrimary: "#E8F0F6",
          textSecondary: "#91A0AE",
          textMuted: "#5F7081"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
