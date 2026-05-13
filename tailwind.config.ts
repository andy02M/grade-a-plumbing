import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0758d6",
          navy: "#08213f",
          sky: "#e9f4ff",
          aqua: "#17b8d4",
          charcoal: "#162033",
          mist: "#f4f8fb"
        }
      },
      boxShadow: {
        soft: "0 18px 55px rgba(8, 33, 63, 0.12)",
        lift: "0 10px 30px rgba(7, 88, 214, 0.18)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Arial", "sans-serif"]
      },
      backgroundImage: {
        "water-grid":
          "radial-gradient(circle at 1px 1px, rgba(7,88,214,0.16) 1px, transparent 0)",
        "hero-flow":
          "linear-gradient(135deg, rgba(7,88,214,0.11), rgba(23,184,212,0.08) 42%, rgba(255,255,255,0) 72%)"
      }
    }
  },
  plugins: []
};

export default config;
