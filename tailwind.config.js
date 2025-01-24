/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.html', // For development files
    './public/**/*.{html, js}', // For deployment files
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
