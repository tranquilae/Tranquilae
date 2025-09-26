/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Liquid Glass Design System - iOS 26 inspired
        cream: '#FDFBF7',
        nature: {
          DEFAULT: '#6DA06E',
          50: '#F0F7F1',
          100: '#D6EDD8',
          500: '#6DA06E',
          600: '#5A8A5C',
          700: '#4A734C',
        },
        softblue: {
          DEFAULT: '#7FB6E3',
          50: '#F0F8FF',
          100: '#E0F0FE',
          500: '#7FB6E3',
          600: '#6BA4D8',
          700: '#5892CD',
        },
        // Glass system colors
        glass: {
          tint: 'rgba(255,255,255,0.22)',
          border: 'rgba(255,255,255,0.35)',
          bg: 'rgba(255,255,255,0.48)',
          bgSecondary: 'rgba(255,255,255,0.36)',
          dark: 'rgba(16,16,16,0.72)',
          darkSecondary: 'rgba(16,16,16,0.56)',
        },
        // Text colors
        text: {
          900: '#0F1724',
          800: '#1F2937',
          700: '#374151',
          600: '#6B7280',
          500: '#9CA3AF',
        }
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        // Liquid Glass elevation shadows
        'glass': '0 6px 20px rgba(10, 12, 20, 0.06)',
        'glass-lg': '0 8px 32px rgba(10, 12, 20, 0.08)',
        'glass-xl': '0 12px 48px rgba(10, 12, 20, 0.12)',
        'subtle': '0 2px 8px rgba(10, 12, 20, 0.04)',
        'nature': '0 4px 16px rgba(109, 160, 110, 0.15)',
        'softblue': '0 4px 16px rgba(127, 182, 227, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '6px', 
        md: '14px',  // iOS 26 standard
        lg: '20px',
        xl: '28px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glass-shimmer': 'glassShimmer 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
