/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0063b1',
        secondary: '#0B0C0C',
        accent: '#D8762D',
        'primary-dark': '#3C5037',
        'accent-light': '#DCF263',
        'accent-dark': '#63AB45',
        paragraph: '#23291FBB',
        'paragraph-light': '#5E5E5E',
        border: '#E6E6E6',
        'border-light': '#EEEEEE',
      },
      fontFamily: {
        dmsans: ['var(--font-dmsans)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
      },
      boxShadow: {
        'custom-light': '0 2px 10px rgba(0,0,0,0.08)',
        'custom-focus': '0 4px 15px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      screens: {
        'xs': '475px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}; 