## 2023-10-27 - Icon-only buttons accessibility pattern
**Learning:** Icon-only toggles (like ThemeToggle) in the DrawRun UI lack screen reader state visibility. Relying only on a conditional `title` attribute is insufficient as it doesn't convey the active state explicitly to assistive technologies.
**Action:** When adding or updating icon-only toggle buttons, always enforce adding a dynamic `aria-label` and `aria-pressed` attribute to represent the toggle state, and ensure focus rings are visibly applied via `focus-visible` utility classes for keyboard navigation.
