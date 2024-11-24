/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}', // Adjust this to match your file structure
    './public/**/*.html',
  ],  theme: {
    extend: {fontFamily: {
      exo: ['Exo 2', 'sans-serif'], 
    },
   },
  },
  plugins: [],
}

