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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36aaf8',
          500: '#0c8de9',
          600: '#006fc7',
          700: '#0159a1',
          800: '#064b85',
          900: '#0b3f6e',
        },
      },
    },
  },
  plugins: [],
}
