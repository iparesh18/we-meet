/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px rgba(15, 23, 42, 0.06)',
        soft: '0 18px 40px -18px rgba(249, 115, 22, 0.45)',
        glow: '0 0 0 1px rgba(249,115,22,0.15), 0 12px 40px -12px rgba(249,115,22,0.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 100%)',
        'mesh': 'radial-gradient(at 12% 18%, rgba(251,146,60,0.18) 0px, transparent 55%), radial-gradient(at 88% 12%, rgba(249,115,22,0.16) 0px, transparent 50%), radial-gradient(at 70% 90%, rgba(253,186,116,0.18) 0px, transparent 55%)',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
