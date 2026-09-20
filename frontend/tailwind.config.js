/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dexa brand red, primary = #b12623
        brand: {
          50: '#fdf3f2',
          100: '#fbe1df',
          300: '#e79b97',
          500: '#c63a35',
          600: '#b12623',
          700: '#8f1e1c',
        },
      },
    },
  },
  plugins: [],
};
