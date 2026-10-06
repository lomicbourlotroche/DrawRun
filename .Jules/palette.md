## 2026-10-06 - Deterministic IDs for ARIA associations
**Learning:** Using component properties (like `label`) to generate IDs via regex or lowercasing is fragile, can lead to ID collisions if multiple instances share the same label, and can cause hydration mismatches in Next.js/React.
**Action:** Always prefer React's `useId()` hook to generate unique, deterministic IDs for linking interactive elements (like inputs) with their descriptions (like error/hint elements using `aria-describedby`) and labels (`htmlFor`), ensuring robust accessibility support.
