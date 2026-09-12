import type { Config } from "tailwindcss";

export const brandColors = {
  palette: {
    ink: '#111111',
    charcoal: '#1A1A1A',
    bone: '#F7F6F3',
    warmElevated: '#F1EFEA',
    border: '#E6E4DD',
  },
  factory: {
    dark: '#121212',
    surface: '#1A1A1A',
    surfaceElevated: '#242424',
    border: '#2E2E2E',
    borderStrong: '#EDEDED',
    text: '#EDEDED',
    textMuted: '#888888',
    red: '#EF4444',
    green: '#22C55E',
    amber: '#F59E0B',
    cyan: '#38BDF8',
  },
  warm: {
    canvas: '#F7F6F3',
    surface: '#FFFFFF',
    surfaceElevated: '#F1EFEA',
    border: '#E6E4DD',
    borderStrong: '#111111',
    ink: '#111111',
    muted: '#666666',
  },
  pastel: {
    green: { bg: '#EDF3EC', text: '#15803D', border: '#C6E2CD' },
    red: { bg: '#FDEBEC', text: '#B91C1C', border: '#F5C2C4' },
    yellow: { bg: '#FBF3DB', text: '#B45309', border: '#F5E6B8' },
    blue: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    purple: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  },
  surface: {
    base: 'var(--bg-canvas)',
    card: 'var(--bg-surface)',
    border: 'var(--border)',
    textPrimary: 'var(--text-main)',
    textMuted: 'var(--text-muted)',
  },
};

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'var(--font-sans)', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'var(--font-mono)', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        number: ['Geist Mono', 'var(--font-mono)', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      colors: {
        ...brandColors,
        background: "var(--bg-canvas)",
        foreground: "var(--text-main)",
        card: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-main)",
        },
        popover: {
          DEFAULT: "var(--bg-surface-elevated)",
          foreground: "var(--text-main)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--text-main)",
        },
        muted: {
          DEFAULT: "var(--bg-canvas)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent-green)",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "var(--accent-red)",
          foreground: "#FFFFFF",
        },
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",
      },
      borderRadius: {
        none: '0px',
        xs: '1px',
        sm: '2px',
        DEFAULT: '3px',
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
        full: '9999px',
      },
      fontSize: {
        '2xs': '0.625rem',
        'macro': 'clamp(2rem, 5vw, 3.5rem)',
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '64px',
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '64px',
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'technical': '+0.06em',
      }
    },
  },
  plugins: [],
};

export default config;
