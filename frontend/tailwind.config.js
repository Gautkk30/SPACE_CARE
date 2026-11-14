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
          bg: '#060911',
          panel: 'rgba(12, 18, 32, 0.78)',
          'panel-hover': 'rgba(18, 26, 44, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.14)',
          cyan: '#38BDF8',
          'cyan-muted': 'rgba(56, 189, 248, 0.14)',
          emerald: '#10B981',
          'emerald-muted': 'rgba(16, 185, 129, 0.14)',
          amber: '#F59E0B',
          'amber-muted': 'rgba(245, 158, 11, 0.14)',
          red: '#FC3D21',
          'red-muted': 'rgba(252, 61, 33, 0.14)',
          text: '#F8FAFC',
          muted: '#94A3B8',
          dim: '#64748B',
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
