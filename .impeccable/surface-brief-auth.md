# Surface Brief: Auth Flow (Login + Signup)

## Direction Contract

**THESIS:** The auth screen is the first touchpoint of SYNCO METER — it must communicate "energy management" within seconds while keeping the login task effortless. The category-default centered card on a plain background is refused in favor of a split-screen composition that gives the brand its own zone.

**OWN-WORLD:** Dark navy palette (#0B0F19 ground, #0F172A surfaces, #38BDF8 accent, #34D399 success). The brand panel carries a live energy visualization — a compact radial gauge or waveform that reads as "this app measures power." The form zone uses the same dark surfaces with clear hierarchy. Typography: bold display for the brand, clean sans for form labels and inputs.

**STORY:** The visitor understands immediately that SYNCO METER is an energy management tool, feels the product is connected to real hardware (live data even on the auth screen), and can complete login or signup without friction.

**FIRST VIEWPORT:** Top 40% is the brand panel: centered SYNCO METER logo (lightning bolt icon + wordmark), tagline "IoT Energy & Load Management," and a compact live wattage readout with a subtle pulse animation. Bottom 60% is the form: email field, password field, confirm password field (signup only), primary action button, and a login/signup toggle link. A subtle gradient divider separates the two zones.

**FORM:** Split-screen brand + form. Seed key: 4aa6dd9e. The brand panel's energy visualization is the signature move — it shows live (simulated) wattage data, making the auth screen feel connected to the product's purpose.

**FINISH:** Unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope

- Two screens: Login and Signup
- Shared layout component (split-screen)
- Mock auth (no real backend)
- Form validation (email format, password match)
- Toggle between login and signup modes
- Loading state on submit
- Error state for invalid credentials

## Constraints

- React Native / Expo (no web-specific APIs)
- Match existing app theme and component patterns
- Mobile-first (portrait orientation)
- No real authentication backend — mock only for now
