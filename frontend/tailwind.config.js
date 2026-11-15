/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nasa: {
          blue: '#0B3D91',
          'blue-hover': '#1A56DB',
          'blue-ring': '#3B82F6',
          'blue-muted': 'rgba(11, 61, 145, 0.22)',
          red: '#FC3D21',
          'red-muted': 'rgba(252, 61, 33, 0.15)',
          white: '#F8FAFC',
          canvas: '#060911',
          surface: 'rgba(12, 18, 32, 0.78)',
          'surface-hover': 'rgba(18, 26, 44, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-top': 'rgba(255, 255, 255, 0.14)',
        },
        space: {
          bg: '#071026',
          secondary: '#102B4C',
          cyan: '#19C5DF',
          teal: '#50E0C0',
          white: '#F2F7FF',
          panel: 'rgba(12, 18, 32, 0.78)',
          'panel-hover': 'rgba(18, 26, 44, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.14)',
          text: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'nasa-card': '0 10px 30px rgba(0, 0, 0, 0.45)',
        'nasa-glow': '0 0 20px rgba(11, 61, 145, 0.35)',
      },
    },
  },
  plugins: [],
}
