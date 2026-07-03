## 2026-07-03 - Accessible Toggle Pattern
**Learning:** Icon-only toggle buttons (like theme switchers) need both `aria-label` for identification and `aria-pressed` to communicate their current binary state to screen readers.
**Action:** Always include `aria-pressed` alongside `aria-label` for components that toggle between two states, even if the icon visually changes.
