/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: "#121712",
          panel: "#1b241b",
          line: "#32402f",
          gold: "#d39b46",
          paper: "#f5f1e6"
        },
        layer: {
          base: "#5b8c5a",
          effect: "#c0763b",
          follow: "#b34f5f"
        }
      }
    }
  },
  plugins: []
};
