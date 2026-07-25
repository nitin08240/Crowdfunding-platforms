/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // Theme mapped colors (variables defined in index.css)
        background: 'var(--background)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        text: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
        },
        border: 'var(--border)',
        
        // Brand & Semantic
        primary: {
          50: '#fff8eb',
          100: '#f7ead0',
          200: '#edd19a',
          300: '#dfb45e',
          400: '#d89a2b',
          500: 'var(--primary)',
          600: '#8a5700',
          700: '#6f4600',
          800: '#573800',
          900: '#402900',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        
        dark: {
          50: '#f8fafc',
          900: '#0f1117',
          950: '#080c14',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
    },
  },
  plugins: [],
};
