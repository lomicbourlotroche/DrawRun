## 2024-08-31 - React useId() for ARIA associations
**Learning:** Using predictable label-derived IDs (e.g. `label.toLowerCase().replace(...)`) for form inputs leads to ID collisions when multiple instances of the same component are rendered, breaking ARIA associations and causing hydration mismatches in Next.js App Router.
**Action:** Always use React`s built-in `useId()` hook to generate unique base IDs for inputs, errors, and hints, ensuring robust and unique `aria-describedby` associations across the application.
