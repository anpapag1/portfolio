/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        fg: '#e8e8e8',
        card: {
          skills: '#A78BFA',
          websites: '#4ADE80',
          projects: '#FB923C',
          work: '#F472B6',
          contact: '#FBBF24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'figma-card': '0px 13px 36px 0px rgba(0, 0, 0, 0.55), 0px 2px 7px 0px rgba(0, 0, 0, 0.4), inset 0px 0.5px 0px 0px rgba(255, 255, 255, 0.06)',
        'figma-hud': '0px 8px 40px 0px rgba(0, 0, 0, 0.45), inset 0px -1px 0px 0px rgba(0, 0, 0, 0.2), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
