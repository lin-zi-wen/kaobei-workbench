import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#fdfbf7",
          100: "#f9f5ed",
          200: "#f2ebd8",
          300: "#e8dcc0",
          400: "#dbc9a3",
          500: "#cdb586",
          600: "#bfa06e",
          700: "#9e8256",
          800: "#7f6848",
          900: "#66543c",
        },
        pine: {
          50: "#f2f7f4",
          100: "#e0ede5",
          200: "#c3dbcc",
          300: "#99c2a8",
          400: "#6ea482",
          500: "#4e8867",
          600: "#3b6d50",
          700: "#315741",
          800: "#2a4636",
          900: "#243a2e",
        },
        seal: {
          50: "#f7f5f2",
          100: "#ece7e0",
          200: "#d9d0c4",
          300: "#c0b3a1",
          400: "#a6957a",
          500: "#8f7d62",
          600: "#7a6a54",
          700: "#635646",
          800: "#52493c",
          900: "#473f35",
        },
        ochre: {
          50: "#fdf8ed",
          100: "#f9eccd",
          200: "#f2d89d",
          300: "#ebbf65",
          400: "#e6a83b",
          500: "#df8f1f",
          600: "#c17116",
          700: "#a15615",
          800: "#844419",
          900: "#6d3917",
        },
        ink: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#454545",
          900: "#3d3d3d",
        },
      },
      fontFamily: {
        serif: [
          "'Noto Serif SC'",
          "'Source Han Serif SC'",
          "STSong",
          "SimSun",
          "serif",
        ],
        sans: [
          "'Noto Sans SC'",
          "'Source Han Sans SC'",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      screens: {
        desktop: "960px",
      },
      spacing: {
        sidebar: "236px",
      },
    },
  },
  plugins: [],
};

export default config;
