/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#F2FAF5',
          100: '#E6F4EC',
          200: '#C0E4CC',
          400: '#33BB73',
          500: '#00A650',
          600: '#00843D',
          700: '#00732F',
          800: '#005C2B',
          900: '#003D1A',
        },
        danger: {
          100: '#FDEAED',
          600: '#C8102E',
        },
        warning: {
          100: '#FEF3C7',
          500: '#F59E0B',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}
