import colors from 'tailwindcss/colors'
import formsPlugin from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@tremor/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    transparent: 'transparent',
    current: 'currentColor',
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: colors.amber[50],
            muted: colors.amber[200],
            subtle: colors.amber[400],
            DEFAULT: colors.amber[500],
            emphasis: colors.amber[700],
            inverted: colors.white,
          },
          background: {
            muted: colors.slate[50],
            subtle: colors.slate[100],
            DEFAULT: colors.white,
            emphasis: colors.slate[700],
          },
          border: {
            DEFAULT: colors.slate[200],
          },
          ring: {
            DEFAULT: colors.slate[200],
          },
          content: {
            subtle: colors.slate[400],
            DEFAULT: colors.slate[500],
            emphasis: colors.slate[700],
            strong: colors.slate[900],
            inverted: colors.white,
          },
        },
        'dark-tremor': {
          brand: {
            faint: '#1f1608',
            muted: colors.amber[950],
            subtle: colors.amber[800],
            DEFAULT: colors.amber[500],
            emphasis: colors.amber[400],
            inverted: colors.amber[950],
          },
          background: {
            muted: '#131a2b',
            subtle: colors.slate[800],
            DEFAULT: colors.slate[900],
            emphasis: colors.slate[300],
          },
          border: {
            DEFAULT: colors.slate[800],
          },
          ring: {
            DEFAULT: colors.slate[800],
          },
          content: {
            subtle: colors.slate[600],
            DEFAULT: colors.slate[500],
            emphasis: colors.slate[200],
            strong: colors.slate[50],
            inverted: colors.slate[950],
          },
        },
      },
      boxShadow: {
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'tremor-small': '0.375rem',
        'tremor-default': '0.5rem',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
        'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'data-[selected]'],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'data-[selected]'],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'data-[selected]'],
    },
  ],
  plugins: [formsPlugin],
}
