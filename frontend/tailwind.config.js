/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0D1122', // deepest background
          900: '#11162A', // page background
          800: '#171D35', // panel background
          700: '#232B4D', // raised panel / hover
          600: '#2A3152', // hairline borders
        },
        paper: {
          100: '#EDEAE0', // primary text (warm off-white, not pure white)
          400: '#8B90A6', // muted text
        },
        brass: {
          400: '#D9B25E',
          500: '#C79A45', // primary accent
          600: '#A87E33',
        },
        teal: {
          400: '#4FAE9B', // positive / up
        },
        clay: {
          400: '#C0524A', // negative / down / error
        },
      },
      fontFamily: {
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'row-in': {
          '0%': { backgroundColor: 'rgba(199, 154, 69, 0.28)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'row-in': 'row-in 1.6s ease-out',
      },
    },
  },
  plugins: [],
};
