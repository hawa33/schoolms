import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        lamaSky: "#808080",
        lamaSkyLight: "##D3D3D3",
        lamaPurple: "#A9A9A9",
        lamaPurpleLight: "#E0E0E0",
        lamaYellow: "#C0C0C0",
        lamaYellowLight: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
export default config;
