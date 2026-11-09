import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },
      colors: {
        // Graphite « paillasse de labo » : fonds légèrement chauds, plus doux qu'un noir pur
        ink: {
          950: '#0a0b0a',
          900: '#111311',
          850: '#161916',
          800: '#1d211d',
          700: '#2a2f2a',
          600: '#3b413b',
          500: '#5f665f',
          400: '#8c938b',
          300: '#b4bab3',
          200: '#d6dbd5',
          100: '#eef1ec',
        },
        // Accent unique : vert « signal » d'analyseur logique / phosphore d'oscilloscope
        signal: {
          DEFAULT: '#b8f35a',
          300: '#d2f78f',
          400: '#b8f35a',
          500: '#9ad93a',
          600: '#76ad22',
          900: '#1e2a0e',
          950: '#131a09',
        },
        // Couleur secondaire réservée aux états « en cours »
        amberlab: {
          DEFAULT: '#f5b041',
          900: '#2b1e08',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      typography: ({ theme }) => ({
        lab: {
          css: {
            '--tw-prose-body': theme('colors.ink.300'),
            '--tw-prose-headings': theme('colors.ink.100'),
            '--tw-prose-lead': theme('colors.ink.300'),
            '--tw-prose-links': theme('colors.signal.400'),
            '--tw-prose-bold': theme('colors.ink.100'),
            '--tw-prose-counters': theme('colors.ink.500'),
            '--tw-prose-bullets': theme('colors.signal.600'),
            '--tw-prose-hr': theme('colors.ink.800'),
            '--tw-prose-quotes': theme('colors.ink.200'),
            '--tw-prose-quote-borders': theme('colors.signal.500'),
            '--tw-prose-captions': theme('colors.ink.500'),
            '--tw-prose-code': theme('colors.signal.300'),
            '--tw-prose-pre-code': theme('colors.ink.200'),
            '--tw-prose-pre-bg': theme('colors.ink.900'),
            '--tw-prose-th-borders': theme('colors.ink.700'),
            '--tw-prose-td-borders': theme('colors.ink.800'),
          },
        },
      }),
    },
  },
  plugins: [typography],
};
