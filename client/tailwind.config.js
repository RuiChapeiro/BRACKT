/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // BRACKT brand palette — referenced as bg-slate-deep, text-brand-purple, etc.
      colors: {
        'slate-deep': '#0F172A', // primary background
        'brand-purple': '#8B5CF6', // accent 1
        'brand-cyan': '#06B6D4', // accent 2
        'neutral-light': '#F8FAFC', // light neutral
      },
    },
  },
  plugins: [],
};
