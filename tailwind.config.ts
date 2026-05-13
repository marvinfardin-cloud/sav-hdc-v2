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
          50: "#FFF8F2",
          100: "#FFE8CC",
          200: "#FFCF99",
          300: "#FFB566",
          400: "#FF9A3D",
          500: "#F47920",
          600: "#D96A18",
          700: "#F47920",
          800: "#D96A18",
          900: "#A04A0A",
        },
        stihl: {
          50: "#FFF8F2",
          100: "#FFE8CC",
          200: "#FFCF99",
          300: "#FFB566",
          400: "#FF9A3D",
          500: "#F47920",
          600: "#D96A18",
          700: "#C05A10",
          800: "#A04A0A",
          900: "#7A3507",
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
