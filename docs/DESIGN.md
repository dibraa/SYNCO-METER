# SYNCO METER — Electric-Sky Design System

## Visual Direction

SYNCO METER uses an airy, modern **Electric-Sky Energy Management** visual language inspired by Scandinavian smart-home dashboards:
- **Atmospheric Hero Header**: Electric-sky vertical gradient (`#0070F3 → #3B9EFF → #C7E4FF → #F3F5F8`) framing the minimalist 3D smart-home artwork (`assets/hero-home.jpg`) and live reactive SVG energy-flow conduits.
- **Floating White Cards on Cool Canvas**: Cool light-gray canvas (`#F3F5F8`) paired with pure white elevated cards (`#FFFFFF`, `20px` radius, subtle `1px` border `#E6EBF2`, soft vertical shadow).
- **Semantic Energy Signals**: Electric blue (`#007AFF` / `#0066D6`) for active grid power & primary interactions, eco green (`#16A34A` / `#22C55E`) for standby savings & occupied status, warm amber (`#F59E0B` / `#B45309`) for vacancy auto-cutoff countdowns, and crimson red (`#DC2626` / `#EF4444`) for peak load / overload warnings.

---

## Three-Layer Token Architecture (`src/theme/theme.ts`)

### Layer 1: Primitives
- **Blue Ramp**: `blue900 (#0047A8)`, `blue700 (#005FCC)`, `blue600 (#0066D6)`, `blue500 (#007AFF)`, `blue400 (#3B9EFF)`, `blue300 (#7CC4FF)`, `blue200 (#C7E4FF)`, `blue100 (#E8F3FF)`, `blue50 (#F2F8FF)`
- **Neutral Slate**: `slate950 (#0F172A)`, `slate600 (#475569)`, `slate500 (#64748B)`, `slate400 (#94A3B8)`, `slate200 (#E6EBF2)`, `slate100 (#F1F5F9)`, `slate50 (#F3F5F8)`, `white (#FFFFFF)`
- **Semantic Accents**: Green (`#15803D`, `#16A34A`, `#22C55E`, `#65A30D`, `#84CC16`, `#DCFCE7`), Amber (`#B45309`, `#F59E0B`, `#F97316`, `#FEF3C7`), Red (`#DC2626`, `#EF4444`, `#FEE2E2`)

### Layer 2: Semantic Tokens (`colors`)
| Token | Value | Role |
|---|---|---|
| `canvas` | `#F3F5F8` | Primary scrollable screen background |
| `surface` | `#FFFFFF` | Elevated cards, tiles, headers, sheets, bottom nav |
| `primary` | `#007AFF` | Active tab icons, relay switches, primary buttons, chart spline |
| `primaryText` | `#0066D6` | High-contrast blue text on light/soft-blue pills (WCAG AA) |
| `primarySoft` | `#E8F3FF` | Cost pills, secondary full-width buttons, icon backgrounds |
| `text` | `#0F172A` | Primary headings, numbers, room names |
| `textSecondary` | `#475569` | Body descriptions, secondary labels |
| `muted` | `#64748B` | Captions, metadata, timestamps |
| `border` | `#E6EBF2` | Hairline card & input borders |
| `success` / `successSoft` | `#16A34A` / `#DCFCE7` | Occupied state, standby savings, live cloud badge |
| `warning` / `warningSoft` | `#F59E0B` / `#FEF3C7` | Vacancy auto-cutoff timer, standby bleed notices |
| `danger` / `dangerSoft` | `#DC2626` / `#FEE2E2` | Overload warning, peak-hour bar callouts, sign-out button |

### Layer 3: Component Patterns
- **Cards (`ui.card`)**: `20px` radius, `16px` padding, `#FFFFFF` fill, `1px` `#E6EBF2` border, diffused shadow (`0 4px 16px rgba(15, 23, 42, 0.05)`).
- **Quick Tiles (`ui.tile`)**: `16px` radius, 2-column grid right beneath `SmartHomeHero`.
- **Value Pills (`ui.pill`)**: `#E8F3FF` background, `#0066D6` bold `tabular-nums` text, `8px` radius.
- **Soft Action Buttons (`ui.softButton`)**: Full-width `#E8F3FF` fill with `#0066D6` bold text (`minHeight: 46`).
- **Typography**: System sans with `fontVariant: ['tabular-nums']` enforced across all wattages, kWh figures, PHP costs, and countdown timers.

---

## Data Visualization Grammar
1. **`SmartHomeHero`**: Sky-blue gradient backdrop + architectural 3D home plate + live SVG conduits mapped to Grid, Room 1, and Room 2 states.
2. **`EnergyAreaChart`**: Formula header (`Consumed − Auto-Saved = Net Impact`) + smooth SVG cubic Bézier spline with vertical blue gradient fill, dashed horizontal gridlines, and tap-interactive active hour marker.
3. **`TopConsumersCard`**: Ranked consumer list with circular numbered badges (`1`, `2`), slim share progress bars, soft-blue PHP cost pills, and full-width soft-blue CTA.
4. **`DualBarChart`**: 24-hour capsule pill-bar chart color-coded by relative load intensity (`#65A30D` → `#84CC16` → `#F59E0B` → `#F97316` → `#DC2626`) with circular callout badges above peak and lowest recorded hours.
5. **`RadialGauge`**: Gradient semicircle watt meter (`0–3.0 kW`) shifting blue → amber → red near overload, paired with `Voltage`, `Current`, and `Power Factor` chips.
