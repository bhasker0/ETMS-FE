import type { Config } from "tailwindcss";

export const brandColors = {
  palette: {
    steel: '#336699',
    periwinkle: '#9494ff',
    ice: '#eff7ff',
    powder: '#cee3f8',
    slate: '#c6c6c6',
  },
  factory: {
    dark: '#0e1726',
    surface: '#19263e',
    surfaceElevated: '#243556',
    border: '#2e4368',
    borderStrong: '#9494ff',
    text: '#eff7ff',
    textMuted: '#cee3f8',
    red: '#E63946',
    green: '#2A9D8F',
    amber: '#E76F51',
    cyan: '#cee3f8',
  },
  warm: {
    canvas: '#eff7ff',
    surface: '#FFFFFF',
    surfaceElevated: '#cee3f8',
    border: '#c6c6c6',
    borderStrong: '#336699',
    ink: '#336699',
    muted: '#5c768d',
  },
  pastel: {
    green: { bg: '#EDF3EC', text: '#1B4D2E', border: '#C6E2CD' },
    red: { bg: '#FDEBEC', text: '#8A1C14', border: '#F5C2C4' },
    yellow: { bg: '#FBF3DB', text: '#744210', border: '#F5E6B8' },
    blue: { bg: '#cee3f8', text: '#336699', border: '#9494ff' },
    purple: { bg: 'rgba(148, 148, 255, 0.15)', text: '#9494ff', border: '#9494ff' },
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
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
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
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
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
