import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Calm, bedtime-friendly palette.
        night: {
          50: "#f4f5fb",
          100: "#e7e9f6",
          200: "#c9cceb",
          300: "#a3a7da",
          400: "#7b7ec6",
          500: "#5d5eb2",
          600: "#4a4796",
          700: "#3d3a79",
          800: "#2b2954",
          900: "#1c1b39",
          950: "#100f22",
        },
        dawn: {
          100: "#fff4ec",
          200: "#ffe3d1",
          300: "#ffc9a8",
          400: "#ffab7a",
          500: "#ff8c4b",
        },
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
