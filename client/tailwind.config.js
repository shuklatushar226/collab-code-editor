/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          panel: '#2d2d30',
          border: '#3e3e42',
          text: '#cccccc',
          accent: '#0078d4',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
