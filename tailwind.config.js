/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.html', // Matches all HTML files in src and subdirectories
    './src/**/*.js',   // Matches all JS files in src and subdirectories
    './src/**/*.jsx',  // Include JSX files if applicable
    './src/**/*.ts',   // Include TypeScript files if applicable
    './src/**/*.tsx'   // Include TSX files if applicable
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
