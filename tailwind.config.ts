import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#fff7e7",
        ink: "#1f2530",
        coral: "#ff845c",
        mint: "#6fd3c0",
        sunflower: "#f7c948",
        lagoon: "#3c84a8",
      },
      fontFamily: {
        display: ['"Arial Rounded MT Bold"', '"Trebuchet MS"', "sans-serif"],
        body: ['"Trebuchet MS"', '"Segoe UI"', "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px rgba(31, 37, 48, 0.14)",
      },
      borderRadius: {
        jumbo: "1.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;

