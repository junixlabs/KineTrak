/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: { DEFAULT: '#2f6fed', light: '#6e8bff', dark: '#2a63d6' },
        teal: { DEFAULT: '#0d9488' },
        grape: { DEFAULT: '#7c5cff' },
        amber: { DEFAULT: '#f59e0b' },
        ink: '#14181f',
        muted: '#5b6470',
        faint: '#646c78',
        line: '#e5e8ec',
        app: '#eef1f5',
        // status semantics
        st: {
          must: '#e5484d',
          progress: '#f59e0b',
          done: '#16a34a',
          nice: '#6e8bff',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,24,31,.07)',
        pop: '0 12px 32px rgba(20,24,31,.14)',
        panel: '-10px 0 34px rgba(20,24,31,.10)',
      },
      keyframes: {
        ktPanelIn: { from: { transform: 'translateX(28px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        ktPop: { '0%': { opacity: '0', transform: 'scale(.96) translateY(6px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        ktPulse: { '0%': { boxShadow: '0 0 0 0 rgba(47,111,237,.40)' }, '100%': { boxShadow: '0 0 0 14px rgba(47,111,237,0)' } },
      },
      animation: {
        panelIn: 'ktPanelIn .22s cubic-bezier(.4,0,.2,1) both',
        pop: 'ktPop .16s ease both',
        pulse2: 'ktPulse 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}
