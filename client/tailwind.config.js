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
        background: '#F8F9FA',
        surface: '#FFFFFF',
        brand: {
          DEFAULT: '#0B4F4A',
          hover: '#083B37',
          light: '#E6F0EF',
        },
        primaryText: '#111827',
        secondaryText: '#4B5563',
        divider: '#E5E7EB',
        badge: {
          inStockText: '#15803D',
          inStockBg: '#F0FDF4',
          outStockText: '#B91C1C',
          outStockBg: '#FEF2F2',
        },
        alarm: {
          DEFAULT: '#C2410C',
          light: '#FFF7ED',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        bengali: ['var(--font-bengali)', 'Hind Siliguri', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
