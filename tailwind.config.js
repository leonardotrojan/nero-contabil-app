/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        nero: {
          950: "#050505",
          900: "#0F1115",
          850: "#131619",
          800: "#171A21",
          700: "#20242D",
          600: "#2A2F3D",
          500: "#363C4E",
          400: "#4A5168",
          300: "#6B7280",
          200: "#9CA3AF",
          100: "#D1D5DB",
          blue: "#4DA3FF",
          "blue-dim": "#2A6FCC",
          purple: "#7C5CFF",
          "purple-dim": "#4A38B3",
          mint: "#4FFFB0",
          "mint-dim": "#2BBF80",
          danger: "#FF5C5C",
          warning: "#FFB84D",
        },
      },
      fontFamily: {
        sans: ["Inter_400Regular", "System"],
        "sans-medium": ["Inter_500Medium", "System"],
        "sans-semibold": ["Inter_600SemiBold", "System"],
        "sans-bold": ["Inter_700Bold", "System"],
        mono: ["SpaceMono_400Regular", "monospace"],
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
};
