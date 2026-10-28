/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        veryfi: {
          bg: '#0A0D18',
          card: '#121727',
          cardHover: '#171E32',
          surface: '#1A2138',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.14)',
          purple: {
            DEFAULT: '#7C3AED',
            light: '#9333EA',
            accent: '#8B5CF6',
            glow: 'rgba(124, 58, 237, 0.35)',
            hover: '#6D28D9'
          },
          green: {
            DEFAULT: '#10B981',
            light: '#34D399',
            glow: 'rgba(16, 185, 129, 0.3)',
            bg: 'rgba(16, 185, 129, 0.12)'
          },
          amber: {
            DEFAULT: '#F59E0B',
            light: '#FBBF24',
            bg: 'rgba(245, 158, 11, 0.12)'
          },
          red: {
            DEFAULT: '#EF4444',
            light: '#F87171',
            bg: 'rgba(239, 68, 68, 0.12)'
          },
          text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8',
            muted: '#64748B'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        satoshi: ['Satoshi', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-purple': '0 0 25px -3px rgba(124, 58, 237, 0.45)',
        'glow-green': '0 0 25px -3px rgba(16, 185, 129, 0.45)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
}

