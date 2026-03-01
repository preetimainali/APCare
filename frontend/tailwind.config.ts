import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        display: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      colors: {
        bunker: {
          950: "#0d1117",
          900: "#161b22",
          800: "#21262d",
          700: "#30363d",
          600: "#484f58",
        },
        signal: {
          green: "#3fb950",
          amber: "#d29922",
          red: "#f85149",
          blue: "#58a6ff",
        },
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(48, 54, 61, 0.5), 0 2px 8px rgba(0,0,0,0.3)",
        glow: "0 0 20px -4px rgba(63, 185, 80, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
