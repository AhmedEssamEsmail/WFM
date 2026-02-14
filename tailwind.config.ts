import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Using default Tailwind indigo and slate colors
      // No custom color overrides needed
    },
  },
  plugins: [],
} satisfies Config
