import type { Config } from "tailwindcss";
import typographyPlugin from "@tailwindcss/typography";

const config: Config = {
  theme: {
    extend: {
      colors: {
        // Monochrome color palette for glassmorphic design
        neutral: {
          950: "#0a0a0a",
          900: "#1a1a1a",
          800: "#2a2a2a",
          700: "#3a3a3a",
          600: "#4a4a4a",
          500: "#6a6a6a",
          400: "#a0a0a0",
          300: "#d4d4d4",
          200: "#e5e5e5",
          100: "#f5f5f5",
          0: "#ffffff",
        },
      },
    },
  },
  plugins: [typographyPlugin],
};

export default config;
