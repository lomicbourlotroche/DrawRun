## 2024-06-17 - Theme Toggle Accessibility
**Learning:** Icon-only buttons using only a `title` attribute may not be consistently read by all screen readers or may present a confusing UX for keyboard navigation. An explicit `aria-label` is preferred.
**Action:** Add `aria-label` attributes to all icon-only buttons, even if a `title` exists.
