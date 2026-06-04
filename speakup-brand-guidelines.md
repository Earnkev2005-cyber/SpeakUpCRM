# SpeakUp English — Brand & Design Guidelines

> Reference for Claude Code. Apply these tokens and rules to any UI, document, or asset
> built for SpeakUp English. When in doubt, prefer fewer colors, more whitespace, and the
> primary font for anything that draws attention.

_Source: Design Guidelines deck, SpeakUp English (7 April 2026)_

---

## Brand

**SpeakUp** is an English-learning school helping young professionals and adults build
confidence in speaking. Voice and feel: **welcoming, encouraging, modern**. Designs should
reassure learners who feel insecure about fluency and help them communicate clearly.

- **Name:** SpeakUp (one word, capital S and U — `SpeakUp`, never `Speak Up` or `Speakup`)
- **Tagline:** _Speak your future. Fluency starts here._
- **Logo:** "Speak" wordmark + "Up" inside a red speech-bubble mark.
  - **Primary logo** → use on white / light backgrounds (dark navy wordmark).
  - **Dark version** → use on navy/dark backgrounds (white wordmark).
  - Keep the red speech bubble in both versions.

---

## Color Tokens

### Primary

| Token | Hex | Use |
|---|---|---|
| `--color-blue` | `#1a2a40` | Main backgrounds, primary text |
| `--color-red` | `#ff4d4d` | Highlights, icons, CTAs / buttons |
| `--color-white` | `#ffffff` | Whitespace, clean layout, text on dark |
| `--color-black` | `#000000` | Secondary text, contrast when needed |

### Blue scale (lighter → use sparingly for surfaces, borders, gradients)

| Token | Hex |
|---|---|
| `--blue-700` | `#1a2a40` |
| `--blue-500` | `#425566` |
| `--blue-400` | `#71808c` |
| `--blue-300` | `#a1aab3` |
| `--blue-200` | `#d0d5d9` |

### Red scale (lighter → accents, tints, hover states; use sparingly)

| Token | Hex |
|---|---|
| `--red-500` | `#ff4d4d` |
| `--red-400` | `#ff6161` |
| `--red-300` | `#ff8889` |
| `--red-200` | `#ffb0b0` |
| `--red-100` | `#ffd7d8` |

> **Rule:** Lighter blue/red variations are allowed for backgrounds, gradients, and visual
> enhancement, but **use them sparingly** — the core palette is navy + red + white + black.
> Do not introduce off-brand colors.

### CSS custom properties (drop-in)

```css
:root {
  /* Primary */
  --color-blue:  #1a2a40;
  --color-red:   #ff4d4d;
  --color-white: #ffffff;
  --color-black: #000000;

  /* Blue scale */
  --blue-700: #1a2a40;
  --blue-500: #425566;
  --blue-400: #71808c;
  --blue-300: #a1aab3;
  --blue-200: #d0d5d9;

  /* Red scale */
  --red-500: #ff4d4d;
  --red-400: #ff6161;
  --red-300: #ff8889;
  --red-200: #ffb0b0;
  --red-100: #ffd7d8;

  /* Semantic */
  --bg:          var(--color-blue);
  --text:        var(--color-white);
  --text-muted:  var(--blue-300);
  --accent:      var(--color-red);
  --cta:         var(--color-red);
}
```

---

## Typography

### English (Latin)

| Role | Font | Used for |
|---|---|---|
| **Primary** | **Montserrat** | Headings, titles, logo-related text, important highlights |
| **Secondary** | **Inter** | Paragraphs, captions, descriptions |
| **Accent** | **Caveat** | Quotes, small highlights, decorative emphasis |

### Myanmar (Burmese)

| Role | Font | Used for |
|---|---|---|
| **Primary** | **Myanmar Angoun** | Headings, titles |
| **Secondary** | **Burma-024 Black** | Body text, paragraphs |

### Font stacks (drop-in)

```css
--font-heading: "Montserrat", "Myanmar Angoun", sans-serif;
--font-body:    "Inter", "Burma-024 Black", sans-serif;
--font-accent:  "Caveat", cursive;
```

Web font imports (English fonts available on Google Fonts):

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Caveat:wght@400;600&display=swap" rel="stylesheet">
```

> Montserrat, Inter, and Caveat are on Google Fonts. **Myanmar Angoun** and **Burma-024
> Black** are not — self-host them when building Burmese-language assets.

---

## Layout & Spacing

- **Spacing:** keep spacing consistent; avoid overcrowding. Give elements room to breathe.
- **Alignment:** align text and elements clearly. Prefer **left or center** alignment.
- **Safe area:** keep content away from the edges of the canvas/screen.

---

## Visual Elements

- **Icon style:** simple and clean; keep one consistent style throughout (line-style icons
  matching the deck). Don't mix outline and filled icon sets in the same view.
- **Color:** use brand colors for icons and graphics; avoid random/off-brand colors.
- **Usage:** visuals should **support** the content, not overpower the design.

---

## Quick Do / Don't

**Do**
- Navy backgrounds with white text; red reserved for CTAs, icons, and highlights.
- Montserrat for anything that should grab attention; Inter for reading.
- Generous, consistent spacing; clear left/center alignment.
- Consistent, simple icon set in brand colors.

**Don't**
- Don't write the name as "Speak Up" / "Speakup".
- Don't flood layouts with red — it's an accent, not a background.
- Don't add colors outside the palette or mix icon styles.
- Don't crowd elements or push content to the edges.
