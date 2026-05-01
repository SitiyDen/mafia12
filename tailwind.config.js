/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f0f12',
        'dark-lighter': '#1a1a1f',
      },
      backgroundColor: {
        dark: '#0f0f12',
        'dark-lighter': '#1a1a1f',
      },
    },
  },
  plugins: [],
  darkMode: 'selector',
}
