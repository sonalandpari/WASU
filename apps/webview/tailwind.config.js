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
          bg: "#09090b",
          secondary: "#121215",
          sidebar: "#0f0f12",
          card: "#141418",
          cardHover: "#1c1c22",
          border: "rgba(255, 255, 255, 0.08)",
          borderSubtle: "rgba(255, 255, 255, 0.04)",
          primary: "#818cf8",
          primaryMuted: "rgba(129, 140, 248, 0.12)",
          secondaryAccent: "#a78bfa",
          secondaryMuted: "rgba(167, 139, 250, 0.12)",
          success: "#34d399",
          successMuted: "rgba(52, 211, 153, 0.12)",
          warning: "#fbbf24",
          warningMuted: "rgba(251, 191, 36, 0.12)",
          error: "#f87171",
          errorMuted: "rgba(248, 113, 113, 0.12)",
          textPrimary: "#f4f4f5",
          textSecondary: "#a1a1aa",
          textMuted: "#71717a"
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
