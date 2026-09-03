/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        factory: {
          navy: '#0d3852',
          header: '#134665',
          headerDark: '#0a273a',
          ribbon: '#184e68',
          border: '#334155',
          lightBg: '#f8fafc',
          rowAlt: '#f1f5f9',
        },
        downtime: {
          machine: '#facc15', // Yellow
          line: '#f472b6',    // Pink / Lavender
          operator: '#0d9488',// Deep Teal
          rework: '#4ade80',  // Light Green
          idle: '#ef4444',    // Red
          style: '#f97316',   // Orange
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      screens: {
        'tv': '1920px',
      }
    },
  },
  plugins: [],
}
