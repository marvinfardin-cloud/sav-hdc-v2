import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#e8edf5",
          100: "#c5d0e5",
          200: "#9eb0d3",
          300: "#7790c0",
          400: "#5a77b3",
          500: "#3d5ea6",
          600: "#2d4f8f",
          700: "#1e3a5f",
          800: "#162d4a",
          900: "#0e1f35",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
