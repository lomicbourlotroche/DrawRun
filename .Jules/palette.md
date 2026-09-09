
## 2026-09-09 - Input ARIA Associations
**Learning:** Using `useId()` in React components for dynamic `id` generation is essential for proper `aria-describedby` associations, avoiding ID collisions and hydration mismatches compared to label-derived IDs.
**Action:** Always prefer `useId()` over derived string transformations for unique IDs, and ensure dynamic values in UI tests are checked via regex matching (e.g., `expect.stringMatching(/.*-error/)`).
