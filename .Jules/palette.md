## 2024-08-30 - Dynamic State Icon Toggles
**Learning:** Icon-only toggle buttons (like password visibility) require more than just an `aria-label`. They must communicate their current state dynamically using `aria-pressed` and dynamic `aria-label`s, while also having distinct keyboard focus styles so users navigating via Tab know they are interactive.
**Action:** Always pair `aria-label` with `aria-pressed` for two-state toggles, add `focus-visible` styling, and hide inner SVG elements with `aria-hidden="true"` to prevent redundant screen reader announcements.
