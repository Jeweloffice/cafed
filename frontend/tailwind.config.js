/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        biryani: {
          50: '#fff8f1',
          100: '#feeedc',
          200: '#fcd9b6',
          300: '#fabd85',
          400: '#f59648',
          500: '#ea6c17',
          600: '#d94f0e',
          700: '#b4390e',
          800: '#8f2e13',
          900: '#742813',
        },
      }
    },
  },
  plugins: [],
}
