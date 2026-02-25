/** @type {import('tailwindcss').config} */
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Paleta principal: Off-White + Verde #83a781 */
        offwhite: '#FEFBF6',
        olive: {
          DEFAULT: '#83a781',
          light: '#9bb999',
          dark: '#6b8a69',
          muted: '#8fa98d',
        },
        gray: {
          mist: '#E8E6E1',
          mistDark: '#D4D2CC',
        },
        accent: {
          purple: '#9bb999',
          purpleLight: '#a8c4a6',
          violet: '#9bb999',
        },
        luxury: {
          cream: '#FEFBF6',
          offWhite: '#FEFBF6',
          warmGray: '#E8E6E1',
          dark: '#2D2E24',
          slate: '#3A3C2D',
        },
        night: {
          bg: '#1A1B14',
          surface: '#22231C',
          card: '#2A2B22',
          border: '#3D3E34',
          muted: '#8A8B7A',
          text: '#F5F4EF',
          accent: '#8A8B7A',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(131, 167, 129, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        glass: '0 8px 32px rgba(131, 167, 129, 0.12)',
        button: '0 4px 14px 0 rgba(131, 167, 129, 0.28)',
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #83a781 0%, #9bb999 50%, #6b8a69 100%)',
        'gradient-soft': 'linear-gradient(180deg, rgba(254, 251, 246, 0.6) 0%, #FEFBF6 100%)',
        'gradient-hero': 'linear-gradient(160deg, #FEFBF6 0%, rgba(131, 167, 129, 0.04) 40%, rgba(131, 167, 129, 0.08) 100%)',
        'gradient-olive-subtle': 'linear-gradient(180deg, transparent 0%, rgba(131, 167, 129, 0.06) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
