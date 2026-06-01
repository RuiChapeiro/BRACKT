/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-base':    '#0D1117', // root background — near-black navy
        'bg-card':    '#131B2E', // card / surface
        'bg-card-2':  '#1A2640', // elevated card / input
        'bg-nav':     '#0F1724', // bottom nav / header

        // Brand
        'brand-purple': '#8B5CF6',
        'brand-purple-dim': '#7C3AED',
        'brand-cyan':   '#06B6D4',

        // Status
        'status-live':   '#22C55E',
        'status-soon':   '#F97316',
        'status-danger': '#EF4444',
        'status-gold':   '#EAB308',

        // Text
        'text-primary':  '#F8FAFC',
        'text-muted':    '#64748B',
        'text-subtle':   '#94A3B8',

        // Legacy aliases kept for backward compat
        'slate-deep':    '#0D1117',
        'neutral-light': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
