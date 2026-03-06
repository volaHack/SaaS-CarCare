# Landing Page Redesign - Polish & Elevate

**Date:** 2026-03-06
**Approach:** Enfoque A - Polish & Elevate
**Style:** SaaS Enterprise Premium (Stripe/Linear/Vercel)
**Colors:** Mantener negro + verde neon (#3bf63b)
**Animations:** Reducir y refinar

## Decisions

- Keep all existing sections (Hero, Features, How It Works, Download, CTA, Footer)
- Remove BackgroundMeteors and ScrollGPSTrail components
- Keep dashboard 3D mockup and phone mockup SVGs
- Apply SaaS premium spacing, typography, and color refinements
- Eliminate auto-rotation on feature cards
- Consistent card styling across all sections

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| surface-0 | `#000000` | Page background |
| surface-1 | `rgba(255,255,255,0.03)` | Card backgrounds |
| surface-2 | `rgba(255,255,255,0.05)` | Card hover |
| border-subtle | `rgba(255,255,255,0.06)` | Default borders |
| border-hover | `rgba(255,255,255,0.1)` | Hover borders |
| text-primary | `#ffffff` | Headings |
| text-secondary | `rgba(255,255,255,0.55)` | Body text |
| text-muted | `rgba(255,255,255,0.4)` | Labels, metadata |
| text-faint | `rgba(255,255,255,0.25)` | Copyright, lowest hierarchy |
| accent | `#3bf63b` | Primary accent |
| accent-solid | `#22c55e` | CTA buttons |
| accent-hover | `#16a34a` | CTA hover |
| accent-glow | `rgba(59,246,59,0.3)` | Button glow shadows |
| accent-bg | `rgba(59,246,59,0.1)` | Icon containers, badges |
| accent-border | `rgba(59,246,59,0.15)` | Badge borders |

## Section-by-Section Changes

### Navbar
- Background: `rgba(0,0,0,0.6)` + `blur(20px) saturate(180%)`
- Border: `1px solid rgba(255,255,255,0.06)`
- Links: 50% opacity -> 90% on hover
- CTA: Ghost green style

### Hero
- Padding: 10rem top, 8rem bottom
- Title: 4rem, letter-spacing -0.03em
- Badge: uppercase, no emoji
- Dashboard: reduce rotation, remove float animation, remove reflection

### Features
- Padding: 10rem vertical
- Cards: surface-1 bg, subtle borders, no green highlights
- Remove auto-rotation
- Icon containers: 48px, 12px radius

### How It Works
- Simplified connectors (no glow)
- Consistent card style

### Download
- Reduced phone glow
- Consistent button style

### CTA
- Remove decorative orbs
- Single subtle radial gradient

### Footer
- Transparent background
- Uppercase column headers
- More spacing

### Global Removals
- BackgroundMeteors component
- ScrollGPSTrail component
- Replace with subtle radial gradient at page top

## Files to Modify

1. `frontend/app/landing/landing.module.css` - Main stylesheet
2. `frontend/app/page.tsx` - Root landing page component
3. `frontend/app/landing/page.tsx` - Duplicate landing page
4. `frontend/app/globals.css` - Global styles
5. `frontend/componentes/BackgroundMeteors.tsx` - To be removed from imports
