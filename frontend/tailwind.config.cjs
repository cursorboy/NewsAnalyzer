/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: '#111111',
        paper: '#FAFAF7',
        'paper-cream': '#F4EDDF',
        'paper-warm': '#EFE6D2',
        accent: '#B91C1C',
      },
      letterSpacing: {
        'mega-tight': '-0.045em',
        'display-tight': '-0.04em',
      },
    },
  },
  plugins: [],
}
