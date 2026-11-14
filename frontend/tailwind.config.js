/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          darkest: '#050814',
          darker: '#0b112c',
          card: '#101a42',
          border: '#1e295d',
          accent: '#38bdf8',
          warning: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
        },
      },
    },
  },
  plugins: [],
}
