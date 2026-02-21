/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0a',
          surface: '#141414',
          elevated: '#1a1a1a',
        },
        border: {
          DEFAULT: '#262626',
          subtle: '#1e1e1e',
        },
        text: {
          primary: '#fafafa',
          muted: '#737373',
          disabled: '#404040',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          subtle: 'rgba(99,102,241,0.1)',
        },
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
