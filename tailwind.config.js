/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'stock-green': '#10B981',
        'stock-red': '#EF4444',
        'stock-blue': '#3B82F6',
      }
    },
  },
  plugins: [],
} 