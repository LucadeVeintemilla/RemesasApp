/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bfe0ff',
          300: '#95ceff',
          400: '#63b2ff',
          500: '#3a93ff',
          600: '#1f74f0',
          700: '#165bd0',
          800: '#164aa9',
          900: '#153f88',
        },
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
}
