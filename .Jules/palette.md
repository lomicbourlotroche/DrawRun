## 2024-07-06 - [Toggle Button Accessibility]
**Learning:** Icon-only toggle buttons need more than just `title` tags for accessibility. They require an explicit `aria-label` for screen readers, `aria-pressed` to denote semantic state, and clear `focus-visible` states for keyboard navigation.
**Action:** Always verify that icon-only buttons have an `aria-label` and ensure that toggle-like interactive components utilize `aria-pressed` states.
