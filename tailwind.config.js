/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    './public/**/*.html',
    './src/index.html', // Corrected from .src to ./src
  ],
  theme: {
    extend: {
      fontFamily: {
        exo: ['Exo 2', 'sans-serif'],
      },
      colors: {
        slate: {
          700: '#334155',
          800: '#1e293b',
        },
      },
    },
  },
  plugins: [],
};
