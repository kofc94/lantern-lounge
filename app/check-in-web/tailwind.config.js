/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B22222',
          hover: '#8B0000',
          light: '#FFEBEE',
        },
        accent: {
          gold: '#C5A059',
          sage: '#7D8C7D',
        },
        // Shorthand used throughout the check-in UI
        'lantern-gold': '#C5A059',
        dark: '#1C1917',
        'dark-light': '#292524',
        'dark-card': '#292524',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
