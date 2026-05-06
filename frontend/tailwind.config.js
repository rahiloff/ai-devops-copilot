/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        app: {
          bg: '#050810',
          sidebar: '#080d1a',
          border: 'rgba(255, 255, 255, 0.07)',
          accent: '#00ff88',
          accentHover: '#00cc6a',
          indigo: '#6366f1',
          textMain: '#f1f5f9',
          textMuted: '#64748b'
        }
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-accent-hover': '0 0 35px rgba(0, 255, 136, 0.5)',
        'glow-red': '0 0 12px rgba(239, 68, 68, 0.3)',
        'glow-orange': '0 0 12px rgba(249, 115, 22, 0.3)',
        'glow-yellow': '0 0 12px rgba(234, 179, 8, 0.3)',
        'glow-blue': '0 0 12px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'blink': 'blink 1s step-end infinite',
        'progress': 'progress 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        progress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '30%', marginLeft: '70%' },
          '100%': { width: '0%', marginLeft: '100%' },
        }
      }
    },
  },
  plugins: [],
}
