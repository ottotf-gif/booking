/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // City Barbershop palette
        barber: {
          red:       '#C8102E', // primary red (barber pole)
          'red-hov': '#A00D26', // darker red for hover
          black:     '#0A0A0A', // near-black
          ink:       '#1A1A1A', // body text
          stone:     '#525252', // muted text
          line:      '#E5E5E5', // borders
        },
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'], // condensed headers
        sans:    ['Inter', 'system-ui', 'sans-serif'], // body
      },
      letterSpacing: {
        'wide-2': '0.06em',
        'wide-3': '0.12em',
        'wide-4': '0.25em',
      },
    },
  },
  plugins: [],
};