/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        'neu-flat': '6px 6px 14px #c2ccd9, -6px -6px 14px #ffffff',
        'neu-flat-sm': '3px 3px 8px #c2ccd9, -3px -3px 8px #ffffff',
        'neu-flat-lg': '9px 9px 20px #c2ccd9, -9px -9px 20px #ffffff',
        'neu-inset': 'inset 3px 3px 6px #c2ccd9, inset -3px -3px 6px #ffffff',
        'neu-inset-sm': 'inset 2px 2px 4px #c2ccd9, inset -2px -2px 4px #ffffff',
        'neu-pressed': 'inset 4px 4px 8px #c2ccd9, inset -4px -4px 8px #ffffff',
        'neu-primary': '4px 4px 10px rgba(79, 70, 229, 0.3), -3px -3px 8px #ffffff',
        'neu-badge': '2px 2px 5px #c2ccd9, -2px -2px 5px #ffffff',
      },
      colors: {
        neu: {
          bg: "#e9eff6",
          surface: "#e9eff6",
          darkShadow: "#c2ccd9",
          lightShadow: "#ffffff",
          primary: "#4f46e5",
          primaryHover: "#4338ca",
          textHead: "#1e293b",
          textBody: "#334155",
          textMuted: "#64748b",
          border: "rgba(255, 255, 255, 0.7)",
        },
        aurora: {
          bg: "#e9eff6",
          secondary: "#dfe7f2",
          sidebar: "#e3eaf3",
          card: "#e9eff6",
          cardHover: "#f1f5fa",
          border: "#c8d4e2",
          borderSubtle: "#dbe4ef",
          primary: "#4f46e5",
          primaryMuted: "rgba(79, 70, 229, 0.12)",
          secondaryAccent: "#7c3aed",
          secondaryMuted: "rgba(124, 58, 237, 0.12)",
          success: "#059669",
          successMuted: "rgba(5, 150, 105, 0.12)",
          warning: "#d97706",
          warningMuted: "rgba(217, 119, 6, 0.12)",
          error: "#dc2626",
          errorMuted: "rgba(220, 38, 38, 0.12)",
          textPrimary: "#1e293b",
          textSecondary: "#475569",
          textMuted: "#64748b"
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
