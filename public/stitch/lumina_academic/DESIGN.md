---
name: Lumina Academic
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#44474d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#505f76'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0b1c30'
  on-primary-container: '#75859d'
  inverse-primary: '#b7c7e2'
  secondary: '#ba0035'
  on-secondary: '#ffffff'
  secondary-container: '#e21e49'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#321115'
  on-tertiary-container: '#aa767b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#b7c7e2'
  on-primary-fixed: '#0b1c30'
  on-primary-fixed-variant: '#38485e'
  secondary-fixed: '#ffdada'
  secondary-fixed-dim: '#ffb3b6'
  on-secondary-fixed: '#40000c'
  on-secondary-fixed-variant: '#920028'
  tertiary-fixed: '#ffdadc'
  tertiary-fixed-dim: '#f3b7bc'
  on-tertiary-fixed: '#321115'
  on-tertiary-fixed-variant: '#653b3f'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  module-blue: '#3B82F6'
  module-green: '#10B981'
  module-yellow: '#F59E0B'
  module-orange: '#F97316'
  text-muted: '#5C647A'
  surface-subtle: '#F8FAFC'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1280px
---

## Brand & Style

The design system is built for a modern educational environment that balances academic rigor with creative energy. It aims to evoke a sense of clarity, progress, and intellectual curiosity. The target audience includes both students and educators who require a high-utility interface that doesn't sacrifice visual delight.

The aesthetic follows a **Modern Corporate** style with a **Card-Based** architecture. It leverages generous whitespace, a vibrant multi-chromatic palette for categorization, and subtle depth through soft shadows. The visual narrative is intentionally "impactful and novel," moving away from generic templates by using bold color-coding for different learning modules, ensuring the UI feels alive and organized.

## Colors

The palette is anchored by a deep navy (`primary`) and a vibrant raspberry (`secondary`) to maintain professional authority. However, the core of the educational experience relies on a "Module Color System":
- **Blue/Green/Yellow/Orange:** These are utilized to differentiate subjects or learning paths. They must be used as accents, icons, or subtle background tints behind cards to maintain visual hierarchy without overwhelming the text.
- **Backgrounds:** Use pure white for the main canvas to keep the interface "clean and breathable." Use `surface-subtle` for sidebars or secondary containers to create soft contrast.
- **Contrast:** High-contrast text (#0B1C30 or #2A0A0F) is mandatory on all vibrant backgrounds to ensure accessibility.

## Typography

The design system exclusively uses **Inter** to ensure maximum legibility across digital displays. The type scale is aggressive, utilizing heavy weights for headlines to create a clear "stop and look" hierarchy.

- **Headlines:** Use Bold (700) or ExtraBold (800) for section titles. Apply slight negative letter-spacing to large headlines for a more modern, editorial feel.
- **Body:** Stick to Regular (400) for long-form educational content to reduce cognitive load.
- **Labels:** Use Semibold (600) for buttons and navigational elements to ensure they stand out against the UI's colorful accents.

## Layout & Spacing

The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Grid Logic:** Use a 24px gutter to maintain a light, airy feel between cards. 
- **Rhythm:** All spacing (padding, margins) must be multiples of the 4px base unit. 
- **Mobile Adaptivity:** On mobile devices, side margins compress to 16px. Complex card grids should reflow into a single column stack.
- **Vertical Spacing:** Use larger vertical gaps (48px - 64px) between major content sections to prevent visual clutter, reinforcing the "white background" philosophy.

## Elevation & Depth

This design system uses **Ambient Shadows** to create a sense of organized layers without the harshness of traditional borders.

- **Level 1 (Default Cards):** A very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)) that makes cards appear to lift slightly off the white background.
- **Level 2 (Hover/Active):** When interacting with cards or buttons, the shadow should deepen and expand (0px 10px 30px rgba(0,0,0,0.1)) to provide tactile feedback.
- **Tonal Layering:** Use `surface-subtle` backgrounds for embedded sections (like a quiz area within a lesson) to provide depth without adding more shadows.

## Shapes

The shape language is defined by **Rounded** corners, which feel approachable and friendly while maintaining a professional structure.

- **Components:** Standard buttons and input fields use a 0.5rem (8px) radius.
- **Cards:** Major layout containers use the `rounded-lg` (1rem / 16px) radius to create a distinct, modern "app-like" appearance.
- **Avatars/Icons:** Use full circles for user profiles and soft-rounded squares for module icons to keep the visual interest high.

## Components

- **Cards:** The primary container. Cards should have a white background, Level 1 shadow, and a 16px border radius. A 4px "accent strip" of a module color can be placed at the top or left edge to identify the category.
- **Buttons:** 
  - *Primary:* Solid `secondary` color with white text. 
  - *Module-specific:* Solid module color with white text. 
  - *States:* On hover, buttons should scale slightly (1.02x) and increase shadow depth.
- **Chips/Badges:** Small, rounded-pill shapes used for status (e.g., "In Progress") or tags. Use low-opacity tints of the module colors with high-saturation text.
- **Inputs:** Clean, white fields with a 1px border (#E2E8F0). On focus, the border should change to the `primary` color with a soft glow effect.
- **Progress Bars:** Thicker, rounded bars using `module-green` to signify completion, placed at the bottom of lesson cards.
- **Iconography:** Use a consistent 2px stroke width. Icons should be "duotone," mixing a neutral primary color with a secondary module-specific accent color.