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
          bg: '#060B19',
          panel: '#0D1528',
          'panel-hover': '#131F3A',
          border: '#1E2D4A',
          'border-light': '#2A3C60',
          cyan: '#06B6D4',
          'cyan-muted': 'rgba(6, 182, 212, 0.15)',
          emerald: '#10B981',
          'emerald-muted': 'rgba(16, 185, 129, 0.15)',
          amber: '#F59E0B',
          'amber-muted': 'rgba(245, 158, 11, 0.15)',
          red: '#EF4444',
          'red-muted': 'rgba(239, 68, 68, 0.15)',
          text: '#F1F5F9',
          muted: '#94A3B8',
          dim: '#64748B',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
