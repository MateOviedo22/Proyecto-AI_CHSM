/** Tokens de diseño extraídos de las capturas de Figma (valores estimados). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2FBFAE', // turquesa primario
          dark: '#1E8478',    // degradado del login
          light: '#D5F1EC',
        },
        wine: { DEFAULT: '#6B4343', dark: '#573434' }, // botones CTA
        sun: { DEFAULT: '#D4801A', light: '#F6C945' }, // naranja/amarillo de marca
        sand: '#E9BF80',                                // ítem activo del menú
        canvas: '#E8E8E8',                              // fondo del sistema
        ink: '#111827',
        status: {
          ok: '#16A34A', okBg: '#DCF5E3',
          bad: '#DC2626', badBg: '#F9C9C9',
          warn: '#A16207', warnBg: '#FDF3B0',
          info: '#2563EB', infoBg: '#DBE7FF',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '12px', field: '8px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        lift: '0 8px 24px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'login-panel': 'linear-gradient(160deg, #2FBFAE 0%, #1E8478 100%)',
      },
    },
  },
  plugins: [],
};
