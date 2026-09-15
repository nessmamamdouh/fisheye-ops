# Fisheye Ops — Design System (Phase 1)

Status: **foundation laid, not yet applied to existing screens.** This phase
adds design tokens + a reusable component library and fixes one real
visual inconsistency found while building it. It does **not** touch any
existing screen's markup — every one of the ~1,300 inline `style={{}}`
objects across the app is untouched and renders exactly as before.

Live visual reference: `/style-guide` (in the running app — requires an
`@fisheye.sa` login, same as the rest of the app; not linked from the real
navigation).

## Why Tailwind, on top of an existing hand-written CSS system

`src/index.css` already defines a real token system (`--brand`, `--gray-*`,
`--shadow-*`, `--r-*`, `--font-*`) and a set of `.fe-*` utility classes
(buttons, cards, inputs, tables, modals, pills, tabs...), added in an
earlier rebrand pass and used in ~114 places across 8 files. That work
wasn't replaced — Tailwind is configured to **read the same CSS variables**
(see `tailwind.config.js`), so a Tailwind class like `bg-primary` and the
existing `.fe-btn-primary` class resolve to the exact same color. There is
one source of truth for every token, whichever styling mechanism a given
piece of code uses.

`corePlugins.preflight` is turned **off** in `tailwind.config.js`. Tailwind's
default CSS reset changes default margins, list/button/heading styling
across the whole page — enabling it on an app with ~1,300 inline styles
written without it in mind would risk shifting layout everywhere at once.
With it off, Tailwind only ever *adds* a utility class where one is
explicitly written — it can't change anything else.

## Real inconsistency found and fixed

While pulling together the token values, the "gray" scale in `index.css`
turned out to be **zinc** (`#e4e4e7`, `#a1a1aa`, `#18181b`...), a different,
slightly-off scale from the actual Tailwind **gray** scale
(`#e5e7eb`, `#9ca3af`, `#111827`...) that ~1,300 inline styles across the
app already use directly. This made the ~114 `.fe-*`-styled elements
(mostly the sidebar/topbar/nav) render a subtly different shade of gray
than everything else. Fixed by aligning `--gray-*` (and the `--surface-*`/
`--border*`/`--text-*` variables derived from it) to the same scale
everywhere, plus replacing ~40 raw zinc hex literals hardcoded directly in
`style={{}}` objects (`App.jsx` and 5 other component files) with the
matching gray value. Zero layout change; colors now agree everywhere.

## Tokens

All defined in `tailwind.config.js` `theme.extend`, backed by the CSS
variables in `src/index.css`:

| Token | Source | Notes |
|---|---|---|
| `primary` / `primary-dark` | `--brand` (#A02843) / `--brand-dark` (#00293A) | Official Fisheye Crimson (Pantone 194C) / Navy (Pantone 303C) |
| `secondary` | `--brand-dark` | Alias of Navy, per the ticket's primary/secondary/success/warning/error naming |
| `gray-50`…`gray-900` | `--gray-50`…`--gray-900` | Tailwind's default gray scale — matches ~1,300 existing inline styles |
| `success-*` / `warning-*` / `error-*` / `info-*` | Tailwind's default green/amber/red/blue scales, spelled out | Matches existing inline hex (e.g. `#16a34a`, `#dc2626`) exactly |
| spacing | Tailwind default (4px base unit) | Already satisfies the "4px scale" requirement — no override needed |
| `rounded-xs/sm/md/lg/xl/2xl` | `--r-xs`…`--r-2xl` | |
| `shadow-xs/sm/md/lg/xl/brand` | `--shadow-xs`…`--shadow-brand` | |
| `font-sans` / `font-mono` | Plus Jakarta Sans / IBM Plex Mono | Same fonts already loaded in `index.css` |
| breakpoints | Tailwind default (sm/md/lg/xl/2xl) | Revisit in the mobile-responsive phase if a real need shows up |

Dark mode: `darkMode: 'class'` is configured (toggle a `dark` class on
`<html>` later) and every component below accepts dark-mode Tailwind
classes, but no toggle UI exists yet — this is preparation only, per the
ticket.

## Component library — `src/components/ui/`

Import from the barrel: `import { Button, Card, Badge, Input, Select, Modal, Tabs, Table, Form } from "./components/ui";`
(adjust the relative path from wherever you are in the tree).

- **Button** — `variant`: primary / secondary / ghost / danger / success. `size`: sm / md / lg. Also: `icon`, `loading`, `fullWidth`, `disabled`.
- **Card** — `interactive` (hover lift, for clickable cards), `header`, `footer`, `padding`.
- **Badge** — `color`: gray / success / warning / error / info / primary. `dot`, `icon`.
- **Input** — text input with `error` state and optional leading `icon`.
- **Select** — native `<select>` (kept native for accessibility/mobile), same `error` styling as Input, `options` convenience prop or `<option>` children.
- **Modal** — `open`, `onClose`, `title`, `size` (sm/md/lg/xl), `footer`. Closes on Escape, backdrop click, or the × button.
- **Tabs** — `tabs` (array of `{key, label, icon?}`), `active`, `onChange`.
- **Table** — `Table.Root` / `Table.Head` / `Table.Th` / `Table.Td` wrapper components (not a data-grid) that apply the existing `.fe-table` look to plain `<table>` markup. `Table.Td numeric` gets the monospace numeric-column treatment.
- **Form** — `Form.Field` / `Form.Label` (`required`) / `Form.HelperText` / `Form.ErrorText` / `Form.Row` layout wrappers for label+field+helper text.

Each file has a JSDoc block with its prop list and a usage example at the
top — read the component source for the exact snippet, or see
`src/StyleGuide.jsx` for every component and variant rendered together.

## Bundle size impact

Measured via `npm run build` before/after this phase:

| | Before | After | Delta |
|---|---|---|---|
| JS (gzip) | 292.69 KB | 297.68 KB | +4.99 KB |
| CSS (gzip) | 3.08 KB | 6.17 KB | +3.09 KB |
| **Total (gzip)** | **295.77 KB** | **303.85 KB** | **+8.08 KB** |

Well inside the ticket's 20 KB budget. Raw (non-gzip) size grew more
(~33 KB combined), which is normal for Tailwind's generated utility CSS —
gzip is what a browser actually downloads.

## What this phase deliberately does NOT do

- It does not touch any existing screen's inline styles. `App.jsx` and the
  other component files render pixel-for-pixel identical to before, aside
  from the ~40 zinc→gray hex fixes above (a real, disclosed color
  correction, not a side effect).
- It does not decompose `App.jsx` (7,588 lines) into smaller component
  files. That's a separate, larger refactor and should happen screen by
  screen as each screen is migrated to the new components, not as a
  standalone step.
- It does not wire up an actual dark-mode toggle — only the groundwork
  (`darkMode: 'class'` + `dark:` classes on every component) is in place.

## Next steps (pending review of `/style-guide`)

Once the tokens/components above are confirmed to look right, migrate one
screen at a time to use them (replacing that screen's inline styles),
verifying build + tests + a visual check after each one, committing and
deploying independently — never a single big-bang rewrite of `App.jsx`.
