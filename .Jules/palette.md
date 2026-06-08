## 2025-02-23 - Add Select and ThemeToggle ARIA labels
**Learning:** Adding accessibility labels to custom select components requires generating a unique `useId()` because reusable form components can appear multiple times on the same page, preventing duplicate DOM element IDs when setting `aria-labelledby`.
**Action:** Always use React's `useId()` for `id` fields inside reusable form components.
