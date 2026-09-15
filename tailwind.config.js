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
      // ── "Refined Editorial Enterprise" -- approved design direction ────
      // (see the Fisheye Ops Design System canvas). Only `primary` and
      // `secondary` below are load-bearing brand colors that must never
      // change; every other value here is new work, deliberately scoped to
      // ONLY the new component library (src/components/ui/) and the
      // /style-guide page. None of it overwrites `gray`, which is kept
      // mapped to the OLD Tailwind-default scale the ~1,300 not-yet-
      // migrated inline styles in App.jsx already use (see the `gray` entry
      // below) -- so shipping this new palette changes nothing on any
      // existing screen until that screen is deliberately migrated.
      colors: {
        primary: {
          DEFAULT: 'var(--brand)',       // Fisheye Crimson · Pantone 194C · #A02843 -- FIXED, never change
          dark: 'var(--brand-dark)',     // Fisheye Navy    · Pantone 303C · #00293A -- FIXED, never change
          mid: 'var(--brand-mid)',
          light: 'var(--brand-light)',
          pale: 'var(--brand-pale)',
          subtle: 'var(--brand-subtle)',
        },
        secondary: {
          DEFAULT: 'var(--brand-dark)',  // Fisheye Navy · #00293A -- FIXED, never change
        },
        // `gray` -- UNCHANGED, still the old Tailwind-default scale bound to
        // --gray-* in index.css. Kept only so old-screen migration work can
        // reference "the exact old color" when needed; the new design
        // system below uses `stone` instead, never this.
        gray: {
          50: 'var(--gray-50)', 100: 'var(--gray-100)', 200: 'var(--gray-200)',
          300: 'var(--gray-300)', 400: 'var(--gray-400)', 500: 'var(--gray-500)',
          600: 'var(--gray-600)', 700: 'var(--gray-700)', 800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        },
        // `stone` -- the NEW warm neutral scale from the approved design
        // canvas (oklch, warm hue ~70-75 instead of Tailwind's cold
        // blue-gray). Every new component uses this, never `gray`. Kept
        // properly monotonic (50 lightest -> 900 darkest, standard Tailwind
        // convention) -- card/raised surfaces use plain `white` instead of
        // a fake "lighter than 50" shade.
        stone: {
          50: 'oklch(97.5% 0.008 75)',   // page/app background ("paper")
          100: 'oklch(93% 0.008 72)',    // subtle fill (hover, table stripe)
          200: 'oklch(89% 0.012 70)',    // border
          400: 'oklch(64% 0.015 50)',    // faint text / placeholders
          600: 'oklch(46% 0.02 45)',     // secondary text
          900: 'oklch(23% 0.018 45)',    // primary text ("ink")
        },
        // success/warning/error/info -- refined, desaturated, chosen to sit
        // next to the crimson brand color without a hue clash (error is a
        // warm terracotta, not a red that competes with primary crimson).
        success: {
          100: 'oklch(94.5% 0.028 152)', 600: 'oklch(46% 0.09 152)', 800: 'oklch(34% 0.08 152)',
        },
        warning: {
          100: 'oklch(94.5% 0.045 88)', 600: 'oklch(54% 0.13 78)', 800: 'oklch(40% 0.1 78)',
        },
        error: {
          100: 'oklch(94.5% 0.035 35)', 600: 'oklch(49% 0.15 32)', 700: 'oklch(43% 0.15 32)', 800: 'oklch(37% 0.14 32)',
        },
        info: {
          100: 'oklch(94.5% 0.02 235)', 600: 'oklch(44% 0.06 235)', 800: 'oklch(32% 0.06 235)',
        },
      },
      // Tailwind's default spacing scale is already 4px-based (1 = 4px,
      // 2 = 8px, 3 = 12px, ...), matching the ticket's "4px scale"
      // requirement out of the box -- no override needed.
      fontFamily: {
        // UI body/labels/buttons/data -- Hanken Grotesk (distinctive, not
        // Inter/Roboto/Arial). Only elements using the `font-sans` Tailwind
        // class get this; nothing in the existing app does yet (Tailwind
        // classes didn't exist in this codebase before this project), so
        // this changes no existing screen.
        sans: ['Hanken Grotesk', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // Page titles, section headers, brand moments ONLY -- never dense
        // table/form text. Explicitly avoid Fraunces (over-used to the
        // point of being an "AI-generated" tell); Piazzolla has the same
        // editorial character without the cliche.
        serif: ['Piazzolla', 'Georgia', 'serif'],
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
      // Motion tokens from the /animate skill's rule set -- built-in CSS
      // easings are "too weak" for UI; these are the recommended strong
      // curves, added as Tailwind's `ease-*` utilities so components use
      // `ease-emphasized` etc. instead of inventing a bezier per component.
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.23, 1, 0.32, 1)',   // entering/exiting (modal, dropdown)
        'emphasized-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)', // moving/morphing on screen
      },
      // Default Tailwind breakpoints (sm 640 / md 768 / lg 1024 / xl 1280 /
      // 2xl 1536) are kept as-is -- nothing in the app currently depends on
      // custom breakpoints, and Phase 3 (mobile-responsive) is the natural
      // place to revisit these if a real need shows up.
    },
  },
  plugins: [],
}
