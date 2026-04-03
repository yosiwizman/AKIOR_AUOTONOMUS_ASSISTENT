# AKIOR Brand Guide

Version 1.0 | April 2026

---

## Color Palette

| Role        | Hex       | RGB              | Usage                                         |
|-------------|-----------|------------------|-----------------------------------------------|
| Primary     | `#00D4FF` | 0, 212, 255      | Accent, headings, links, logo, interactive UI |
| Secondary   | `#1A1A2E` | 26, 26, 46       | Elevated panels, card backgrounds, nav        |
| Accent      | `#FF6B35` | 255, 107, 53     | CTAs, highlights, badges, warm emphasis       |
| Background  | `#0A0A0F` | 10, 10, 15       | Page/app background, root surface             |
| Text        | `#E0E0E0` | 224, 224, 224    | Body text, default foreground                 |
| Success     | `#00FF88` | 0, 255, 136      | Status OK, positive confirmations             |
| Warning     | `#FFB800` | 255, 184, 0      | Alerts, expiring items, caution states        |
| Error       | `#FF3366` | 255, 51, 102     | Errors, failures, critical alerts             |

### Extended Palette

| Role        | Hex       | Usage                                 |
|-------------|-----------|---------------------------------------|
| Dim Text    | `#555570` | Secondary labels, timestamps, muted   |
| Surface 2   | `#12121A` | Card interiors, alternate panels      |
| Surface 3   | `#1A1A28` | Borders, dividers, hover states       |

### Color Rules

- Primary cyan (`#00D4FF`) is the signature AKIOR color. It appears on every screen.
- Background must always be near-black (`#0A0A0F`). Never use white or light backgrounds.
- Accent orange (`#FF6B35`) is used sparingly for warmth and CTAs, never as a dominant color.
- Status colors (success/warning/error) are reserved for semantic meaning only.
- For translucent overlays, use primary/accent at 8-18% opacity (e.g., `#00D4FF18`).

---

## Typography

### Headings

- **Font:** Inter
- **Weight:** 600 (semi-bold) for card headers, 700 (bold) for page titles
- **Transform:** uppercase with letter-spacing: 2-4px for dashboard headers
- **Color:** Primary cyan (`#00D4FF`)

### Body Text

- **Font Stack:** `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Size:** 13-14px for dashboard UI, 16px for long-form content
- **Line Height:** 1.6
- **Color:** `#E0E0E0`

### Monospace (Code/Terminal)

- **Font Stack:** `'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace`
- **Use for:** terminal output, logs, status values, technical data

---

## Voice and Tone

- **Professional but approachable.** AKIOR is an autonomous system, not a chatbot.
- **Concise.** Prefer short, direct sentences. No filler words.
- **Confident.** State outcomes, not possibilities ("Deployed" not "I think it deployed").
- **Technical when needed.** Do not dumb down for the sake of it, but do not be obscure.
- **Sign-off:** Always sign communications as: **--AKIOR**

### Examples

- Good: "Morning briefing generated. 3 actions flagged. --AKIOR"
- Bad: "Hey there! I just finished putting together your morning briefing for you!"
- Good: "Deploy failed: missing team permission on Vercel. Retrying with fallback."
- Bad: "Oops, something went wrong with the deployment. Let me try again."

---

## Logo

### Primary Logo

- File: `~/akior/dashboard/akior-logo.svg`
- Geometric 'A' inside a hexagonal frame
- Primary color: electric cyan (`#00D4FF`) with gradient to `#0090B0`

### Usage Rules

- Minimum size: 32x32px
- Always display on dark backgrounds (`#0A0A0F` or `#1A1A2E`)
- Do not place the logo on light or white backgrounds
- Do not distort, rotate, or recolor the logo
- Maintain clear space of at least 25% of the logo width on all sides
- For favicon use, the 'A' glyph alone (without hexagonal frame) is acceptable

---

## UI Component Styling

### Cards

```css
background: #12121A;
border: 1px solid #1A1A28;
border-radius: 8px;
```

### Buttons (Primary)

```css
background: transparent;
border: 1px solid #00D4FF;
color: #00D4FF;
border-radius: 6px;
padding: 8px 16px;
/* Hover: */
background: #00D4FF;
color: #0A0A0F;
```

### Buttons (Accent/CTA)

```css
background: #FF6B35;
color: #0A0A0F;
border-radius: 6px;
padding: 8px 16px;
/* Hover: */
background: #FF8555;
```

### Status Badges

```css
/* OK */     background: #00FF8818; color: #00FF88;
/* Warn */   background: #FFB80018; color: #FFB800;
/* Error */  background: #FF336618; color: #FF3366;
/* Off */    background: #55557018; color: #555570;
```

### Borders and Dividers

- Default border: `1px solid #1A1A28`
- Subtle dividers: `1px solid #ffffff08`
- Active/focused: `1px solid #00D4FF`

### Shadows and Glows

- Pulsing indicator: `box-shadow: 0 0 6px #00FF88;`
- Card hover glow: `box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);`
- Error glow: `box-shadow: 0 0 6px #FF3366;`

---

## CSS Custom Properties (Canonical)

```css
:root {
  --akior-primary:    #00D4FF;
  --akior-secondary:  #1A1A2E;
  --akior-accent:     #FF6B35;
  --akior-bg:         #0A0A0F;
  --akior-text:       #E0E0E0;
  --akior-success:    #00FF88;
  --akior-warning:    #FFB800;
  --akior-error:      #FF3366;
  --akior-dim:        #555570;
  --akior-surface:    #12121A;
  --akior-border:     #1A1A28;
}
```

---

*Maintained by AKIOR. Last updated: 2026-04-03.*
