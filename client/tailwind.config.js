/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // surfaces
        'surface-base': '#0F1117',
        'surface-card': '#181B24',
        'surface-raised': '#1E2130',
        'surface-hover': '#252840',
        // borders
        'border-subtle': '#2A2D3A',
        'border-strong': '#383B4D',
        // text
        'text-primary': '#E2E4E9',
        'text-secondary': '#9095A8',
        'text-muted': '#565B70',
        // brand
        'ivy-purple': '#7B6FD4',
        'ivy-purple-lt': '#2A2654',
        'ivy-purple-dk': '#9D94E8',
        'ivy-purple-md': '#6459B8',
        'ivy-teal': '#2EC4A0',
        'ivy-teal-lt': '#1A3832',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}