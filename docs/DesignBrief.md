# Design Brief: Proofline Dashboard

**Applies to:** `apps/web` (Next.js, React, TypeScript, Tailwind CSS)
**Status:** Draft 1.0

---

## 1. Intent

Proofline should look like a product from a long-established firm: calm, precise, expensive. Think of the annual report of a private bank, or the website of a fine watchmaker, applied to a security tool. Nothing about it should say "hacker tool".

The subject is evidence. The interface exists to let someone watch a flaw happen, watch the fix work, and trust the numbers. Design choices serve that: generous space, quiet surfaces, exact typography, and one memorable interaction.

**Audience:** Security researchers, engineers, and evaluators.
**Primary job of the interface:** make the difference between Vulnerable and Hardened obvious within seconds, and make empirical metrics immediate and verifiable.

## 2. What to avoid

The client rejected the usual security look. Do not build any of the following:

- Black or near-black page backgrounds, neon, cyan, acid green, purple gradients.
- Terminal aesthetics, matrix effects, glowing borders, scanlines, skull or lock icons, hacker stock imagery.
- Glassmorphism, gradient washes as decoration, blurred blobs.
- A grid of identical rounded cards with the same soft grey shadow.
- Tracked-out ALL CAPS eyebrow labels above every heading.
- Monospace type for small data labels.
- Arrows appended to every link or button, spaced em dashes in labels, middle-dot strings.
- Emoji in the interface.
- One word in a headline set in a different colour or in italic for emphasis.
- Numbered markers (01, 02, 03) unless the content really is a sequence.
- Fade-and-slide-up entrance on every section, or hover lifts on every card.

## 3. Design tokens

### 3.1 Colour

Light interface only for version 1. Colours are named by role.

| Token | Hex | Role |
| --- | --- | --- |
| `porcelain` | `#F5F6F3` | Page background |
| `paper` | `#FFFFFF` | Raised surfaces (panels, tables) |
| `mist` | `#E4E7E2` | Hairlines, dividers, table rules |
| `stone` | `#68706C` | Secondary text, axis labels |
| `graphite` | `#1C2124` | Primary text and the strongest lines |
| `bordeaux` | `#7A1F33` | Vulnerable state, flaws, warnings |
| `pine` | `#1E4B3C` | Hardened state, passed checks |
| `bordeaux-wash` | `#F3E6E8` | Tint behind vulnerable results |
| `pine-wash` | `#E5EEEA` | Tint behind hardened results |

Rules:

- Bordeaux and pine are semantic. They only ever mean "vulnerable" and "hardened". Do not use them for decoration.
- Charts use bordeaux for vulnerable series and pine for hardened series, graphite for reference lines and mist for gridlines.
- Never rely on colour alone. Pair it with a label, a line style (solid for hardened, dashed for vulnerable) or an icon.
- Body text on `porcelain` or `paper` must be at least 7:1 contrast. Secondary text at least 4.5:1.

### 3.2 Typography

Two families, clearly different, loaded through `next/font/google`.

| Role | Family | Use |
| --- | --- | --- |
| Display | **Bodoni Moda** (variable, optical size axis) | Page titles, section titles, large figures. Never below 28 px. |
| Text and interface | **Hanken Grotesk** | Body, tables, buttons, forms, chart labels |

Fallbacks: `"Bodoni Moda", "Didot", "Bodoni 72", Georgia, serif` and `"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif`.

If Bodoni Moda renders poorly in the build, use **Newsreader** (display optical size) as the single alternative. Do not substitute Playfair Display or Cormorant.

Type scale (desktop, 1.25 ratio, rounded):

| Style | Size / line height | Weight | Family |
| --- | --- | --- | --- |
| Display XL | 72 / 76 | 400 | Bodoni Moda |
| Display L | 48 / 54 | 400 | Bodoni Moda |
| Display M | 32 / 38 | 400 | Bodoni Moda |
| Heading | 22 / 30 | 600 | Hanken Grotesk |
| Body | 17 / 28 | 400 | Hanken Grotesk |
| Small | 14 / 22 | 400 | Hanken Grotesk |
| Figure | 40 / 44 | 500 | Hanken Grotesk, tabular numerals |

Mobile reduces Display XL to 44 / 50, Display L to 36 / 42.

Rules:

- Sentence case everywhere. No all-caps labels.
- Numbers in tables and metrics use tabular numerals (`font-variant-numeric: tabular-nums`).
- Maximum line length 68 characters for body text.
- Letter spacing: Display slightly tight (`-0.01em`), body default, never wide tracking.
- Italic Bodoni is allowed only for a pull quote or a caption, not for emphasis inside headlines.

### 3.3 Space, shape, elevation

- Base unit 8 px. Section spacing 96 px on desktop, 64 px on mobile.
- Page max width 1280 px, content column for reading 680 px.
- Radii by role, not one value for everything: tables and charts 2 px, panels 8 px, controls and the mode switch fully rounded (pill), images 0.
- Elevation: almost none. Panels sit on `paper` with a 1 px `mist` border. One soft shadow (`0 24px 48px -24px rgba(28,33,36,0.18)`) is reserved for the floating run bar and menus.
- Dividers: 1 px `mist` rules between rows and sections. Do not box every group.

## 4. Layout

### 4.1 Shell

A slim left rail on desktop, a top bar with a menu on mobile.

```
+------+--------------------------------------------------------------+
|      |  Proofline                                       Run history |
| rail |--------------------------------------------------------------|
|      |                                                              |
|  O   |                  page content (max 1280)                     |
|  R   |                                                              |
|  R   |                                                              |
|  D   |                                                              |
|  F   |                                                              |
+------+--------------------------------------------------------------+
```

- Rail is 88 px wide, text labels beneath small line icons, active item marked by a 2 px graphite bar on its left edge.
- Wordmark "Proofline" is set in Bodoni Moda at 22 px in the top bar. No logo mark in version 1.
- Content is left-aligned. Do not centre long text. Centre only the hero statement on the Overview page.

### 4.2 Navigation

Overview, Slow regex, Double redemption, Outdated package, Findings, Pipeline, Evidence.

Use these plain names in the interface. The technical names (ReDoS, race condition, prototype pollution) appear in the page description and in the findings ledger.

### 4.3 The memorable element: the mode seal

One thing in the whole product gets extra craft: the **mode switch**.

- A large pill control with two positions, "Vulnerable" and "Hardened", sitting in a floating run bar at the bottom of module pages.
- Switching it changes the semantic tint of the results area, the line style of the live trace and the label of the primary action, with a single 400 ms ease. The result panel background cross-fades between `bordeaux-wash` and `pine-wash`.
- A third position, "Compare", runs both modes together and splits the results area into two aligned columns.
- Everything else in the interface stays quiet so this control carries the personality.

## 5. Pages

### 5.1 Overview

Goal: explain the idea and show it working in under ten seconds.

```
+--------------------------------------------------------------+
|  Same request. Two outcomes.                       (Display XL)|
|  Three attacks, run against the same code in two modes,       |
|  measured and scored.                              (Body)     |
|                                                               |
|  [ live paired trace: dashed bordeaux line vs solid pine ]    |
|  response time against input length, running on page load     |
|                                                               |
|  [ Run the demonstration ]                                    |
|--------------------------------------------------------------|
|  Three findings (table rows, not cards)                       |
|  Slow regex        7.5 to 3.7     Server stalls  | Open      |
|  Double redemption 6.5 to x.x     Coupon spent twice | Open |
|  Outdated package  x.x to x.x     Admin check bypass | Open |
|--------------------------------------------------------------|
|  Pipeline status strip: tests, proof, Semgrep, audit, ZAP     |
+--------------------------------------------------------------+
```

- The hero is the live paired trace, not a stat block. It plays once on first load (the single orchestrated entrance of the product) using precomputed demo data, and is replayable with a button.
- The findings list is a ruled table with one row per finding.
- No decorative imagery. The chart is the image.

### 5.2 Module pages (all three share one template)

```
+--------------------------------------------------------------+
|  Slow regex                                        (Display L)|
|  One crafted input can stall a whole server.       (Body)     |
|  Weakness  CWE-1333     OWASP  A05 Security Misconfiguration  |
|--------------------------------------------------------------|
|  What happens                  |  Live result                 |
|  Short explanation, 3 short    |  [ chart ]                   |
|  paragraphs, code excerpt      |  [ metrics table ]           |
|  with the vulnerable and       |                              |
|  hardened lines side by side   |                              |
|--------------------------------------------------------------|
|  Score before and after   7.5 High   to   3.7 Low             |
|  Vector broken down in plain language                         |
|--------------------------------------------------------------|
|  Regression test: fails when Vulnerable, passes when Hardened |
+--------------------------------------------------------------+
|  ( Vulnerable | Hardened | Compare )          [ Run attack ]  |  floating run bar
+--------------------------------------------------------------+
```

- Left column is the explanation, right column is the live result. On mobile they stack, result first.
- The code excerpt uses a diff-style layout with a pale bordeaux line for the flawed line and a pale pine line for the fixed line. Use Hanken Grotesk for the surrounding text. For the code itself use a restrained monospace such as **IBM Plex Mono** at 14 px (this is real code, so monospace is correct here).
- Module-specific charts:
  - Slow regex: response time against input length (log scale option), plus a probe latency strip underneath that shows stalled intervals as shaded bands.
  - Double redemption: a ledger of the N requests as rows (accepted or rejected), and a two-bar comparison of accepted against expected.
  - Outdated package: a before and after of the profile object showing where `isAdmin` came from, plus the audit table.

### 5.3 Findings

- A full-width ruled ledger. Columns: finding, weakness, OWASP category, score before, score after, rating before, rating after.
- Selecting a row opens a side sheet with the CVSS vector broken into its eight metrics in plain language.
- Rating chips use text plus tint. Do not invent new colours for Critical, High and so on. Use graphite text, `bordeaux-wash` for High and above, `mist` for Medium and Low, `pine-wash` for None.

### 5.4 Pipeline

- A vertical list of checks (quality, proof, Semgrep, audit, ZAP) with status, duration and a link to the artifact.
- A small matrix showing each regression test against each mode, with the expected result and the actual result. This is the proof table and should be the easiest thing on the page to read.

### 5.5 Evidence

- Left: filters (module, mode, date). Right: ruled table of runs.
- Actions: Export JSON, Export CSV, Open print view, Copy chart as image.
- The print view is a separate route formatted for A4 with the same type system, a title block, one chart per module and the CVSS table.

## 6. Components

| Component | Notes |
| --- | --- |
| Run bar | Floating, centred at the bottom, 720 px max, `paper` surface with the one allowed shadow. Contains the mode switch and the primary action. |
| Mode switch | Pill, three positions, keyboard operable as a radio group, visible focus ring in graphite. |
| Primary button | Graphite fill, porcelain text, fully rounded, 48 px high. Label states the action: "Run attack", "Export JSON". Disabled state uses `mist` fill and `stone` text. |
| Secondary button | 1 px graphite outline, transparent fill. |
| Table | Ruled rows, no zebra, 56 px row height, tabular numerals, sticky header on long tables. |
| Chart | Recharts with custom axes: 1 px `mist` gridlines, `stone` labels at 13 px, no legend box (direct labels on lines), tooltip as a small `paper` panel with a 1 px border. |
| Metric | Figure style number, small label beneath, units in Small. No icons. |
| Status mark | A 10 px circle (pine, bordeaux or hollow mist for pending) next to a text label. |
| Code block | `paper` surface, 1 px `mist` border, 8 px radius, line highlights as described above. |
| Side sheet | Slides from the right over a 24% graphite scrim, closes with Escape. |
| Toast | Bottom-left, plain sentence, matches the action name. |

## 7. Motion

- One orchestrated moment: the Overview paired trace drawing itself on first load (about 2.4 s).
- Responsive motion tied to user action only: the mode switch cross-fade (400 ms), the side sheet slide (240 ms), chart lines drawing as data arrives, buttons pressing (80 ms).
- Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- No scroll-triggered entrances, no parallax, no hover lifts.
- Respect `prefers-reduced-motion`: replace the draw-in with the final state and the cross-fade with an instant change.

## 8. Writing and tone

- Plain, specific, calm. Describe what is happening, not how the system is built.
- Sentence case. Active voice. No exclamation marks.
- Buttons say what happens: "Run attack", "Reset data", "Export JSON". The toast after says the same verb: "Data reset", "JSON exported".
- Errors say what went wrong and what to do: "The lab server did not respond. Start it with pnpm dev, then try again."
- Empty states invite action: "No runs yet. Choose a mode and run the attack."
- Safety copy appears once per module page, in one sentence: "This attack runs only against your own computer and stops automatically at a safe limit."
- Example headings: "Same request. Two outcomes." / "One crafted input can stall a whole server." / "A single-use coupon, redeemed more than once." / "An old package lets a request make itself an admin."

## 9. Accessibility and quality floor

- Keyboard reachable everywhere, visible focus ring (2 px graphite with 2 px offset).
- Mode switch and run bar usable by keyboard and announced to screen readers (`role="radiogroup"`, live region for run status).
- Every chart has a text summary and a data table alternative (toggle "View as table").
- Colour is never the only signal (see section 3.1).
- Touch targets at least 44 px.
- Responsive from 360 px to 1920 px. Test at 360, 768, 1280 and 1920.
- Production build Lighthouse accessibility score of 95 or higher.

## 10. Implementation notes for the agent

- Define tokens as CSS variables in `globals.css` and map them in `tailwind.config.ts`. Do not hard-code hex values in components.
- Load fonts with `next/font/google`, set `display: "swap"`, and expose them as CSS variables.
- Keep chart code in `apps/web/components/charts/` and use one shared theme file for colours and axis styling.
- Build the mode switch and run bar first (stage 9), because every module page depends on them.
- Review each page in a browser at the four test widths before committing. Remove any element that does not carry information.
- Before finishing, do a restraint pass: remove one decorative element from every page.
