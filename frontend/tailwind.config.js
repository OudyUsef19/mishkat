/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef1f7',
          100: '#d5dcea',
          200: '#aab9d5',
          300: '#7f96bf',
          400: '#5473aa',
          500: '#3a5a8f',
          600: '#2d4876',
          700: '#23395c',
          800: '#1e2d4a',   // primary sidebar color
          900: '#141f33',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
