/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          900: '#0d0f12',
          800: '#1a1d23',
          700: '#232730',
          600: '#2b2f3a',
          500: '#353b48',
          400: '#4e5668',
          300: '#8a94a6',
          200: '#b9c0d4',
          100: '#e3e5e8',
          accent: '#5865f2',
          'accent-hover': '#4752c4',
          green: '#3ba55d',
          red: '#ed4245',
        },
      },
    },
  },
  plugins: [],
}

