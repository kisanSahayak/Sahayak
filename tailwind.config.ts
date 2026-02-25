import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govBlue: "#1a3a6b",
        govOrange: "#f5a623",
        govLight: "#f4f7fb",
      },
    },
  },
  plugins: [],
};

export default config;