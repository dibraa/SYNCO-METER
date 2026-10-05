# Surface Brief: Profile Screen

## Direction Contract

**THESIS:** The profile screen is the account control center — it must make every account-related task findable in seconds while feeling like a natural extension of the SYNCO METER dashboard. The category-default scattered settings list is refused in favor of grouped sections that separate personal info, security, preferences, and danger zone.

**OWN-WORLD:** Light theme matching the dashboard (#F9FAFB background, #FFFFFF cards, #00C853 green accent, #111827 text, #6B7280 secondary text, #E5E7EB borders). Rounded cards (20px radius), consistent 16px padding, clear section headers. Icons from MaterialCommunityIcons in a consistent 20px size.

**STORY:** The visitor understands their account status at a glance, can find any setting within two taps, and feels in control of their data and security.

**FIRST VIEWPORT:** Top section has user avatar (circle with initials), name, and email. Below that, grouped card sections: Personal Info (name, email, phone), Security (change password, two-factor auth), Preferences (notifications, tariff rate, currency), and Danger Zone (delete account). Each row has an icon, label, current value preview, and chevron.

**FORM:** Account management profile. Seed key: b2b8938b. Each settings row has a trailing value preview that shows the current setting without requiring navigation — reduces taps.

**FINISH:** Unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope

- Profile screen with user info, account settings, security, preferences, danger zone
- Edit profile functionality (modal or inline)
- Change password flow
- Notification preferences toggle
- Tariff rate and currency settings
- Sign out functionality
- Delete account (danger zone)

## Constraints

- React Native / Expo (no web-specific APIs)
- Match existing app theme (light, green accent)
- Mobile-first (portrait orientation)
- No real backend — mock data for now
- Accessible from bottom nav or header
