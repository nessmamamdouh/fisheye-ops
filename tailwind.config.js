/** @type {import('tailwindcss').Config} */
export default {
  // Preflight (Tailwind's CSS reset) is intentionally OFF. This app existed
  // for years before Tailwind was added and has its own reset + thousands of
  // inline styles that assume default browser/box-sizing behavior in a few
  // places; turning preflight on would risk shifting margins, button
  // chrome, list bullets, etc. across the ENTIRE live app in one shot. This
  // way Tailwind only ever *adds* utility classes -- it never changes
  // anything that isn't explicitly written with a Tailwind class. Revisit
  // this once the inline-style migration (see DESIGN_SYSTEM.md) is far
  // enough along that a full visual QA pass of preflight's effects is
  // practical.
  corePlugins: {
    preflight: false,
  },
  // Prep for a future user-toggleable dark mode (per the Design System
  // ticket's "light/dark variant props" requirement) rather than following
  // the OS setting automatically -- switch a `dark` class on <html> when
  // that ships.
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // Every color below is either one of the two official Fisheye brand
      // colors or one of Tailwind's own default palettes -- deliberately,
      // because that is what the app's ~1300 existing inline styles already
      // use verbatim (e.g. "#16a34a", "#dc2626", "#9ca3af"). Using Tailwind's
      // OWN default green/red/amber/blue/purple scales here means a
      // Tailwind class like `bg-red-600` renders IDENTICAL to the existing
      // inline `style={{background:"#dc2626"}}` it will eventually replace --
      // zero visual change during migration. `gray` is remapped to the CSS
      // variables in index.css (also aligned to this same Tailwind scale)
      // so there is exactly one source of truth for neutrals, not three.
      colors: {
        primary: {
          DEFAULT: 'var(--brand)',       // Fisheye Crimson · Pantone 194C · #A02843
          dark: 'var(--brand-dark)',     // Fisheye Navy    · Pantone 303C · #00293A (also the primary button's hover shade)
          mid: 'var(--brand-mid)',
          light: 'var(--brand-light)',
          pale: 'var(--brand-pale)',
          subtle: 'var(--brand-subtle)',
        },
        secondary: {
          DEFAULT: 'var(--brand-dark)',  // Fisheye Navy · #00293A
        },
        gray: {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        },
        // success/warning/error are Tailwind's default green/amber/red
        // scales, spelled out explicitly (not aliased to `green-600` etc.)
        // so a future rebrand of just the semantic colors doesn't have to
        // touch Tailwind's actual gray/green/red/amber scale names.
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        warning: {
          50: '#fffbeb', 100: '#fef9c3', 200: '#fde68a', 300: '#fde047',
          400: '#facc15', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        error: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
      },
      // Tailwind's default spacing scale is already 4px-based (1 = 4px,
      // 2 = 8px, 3 = 12px, ...), matching the ticket's "4px scale"
      // requirement out of the box -- no override needed.
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r-md)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        brand: 'var(--shadow-brand)',
      },
      // Default Tailwind breakpoints (sm 640 / md 768 / lg 1024 / xl 1280 /
      // 2xl 1536) are kept as-is -- nothing in the app currently depends on
      // custom breakpoints, and Phase 3 (mobile-responsive) is the natural
      // place to revisit these if a real need shows up.
    },
  },
  plugins: [],
}
