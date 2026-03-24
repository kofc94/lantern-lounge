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
          DEFAULT: '#B22222', // Heritage Red / Firebrick
          hover: '#8B0000',
          light: '#FFEBEE',
        },
        accent: {
          gold: '#C5A059', // Brass/Gold accent
          sage: '#7D8C7D', // Soft community green
        },
        neutral: {
          paper: '#FDFBF7', // Warm off-white
          stone: '#78716c',
          dark: '#1C1917',  // Warm charcoal (stone-900)
          'dark-card': '#292524', // stone-800
        },
        dark: '#1C1917',
        'dark-light': '#292524',
        'dark-card': '#44403c',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      backgroundImage: {
        'grain': "url('/assets/noise.png')",
      },
    },
  },
  plugins: [],
}
