## 2024-05-18 - Input ARIA Associations
**Learning:** Reusable form components must use unique IDs (like React's `useId`) for `aria-describedby` associations. Hardcoded or prop-derived IDs can clash across instances, breaking screen reader context for errors and hints.
**Action:** Always implement `useId` and dynamically map `aria-describedby` and `aria-invalid` in base UI elements (e.g., Input, Select) to ensure hydration safety and robust accessibility.
