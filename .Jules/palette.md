## 2024-10-19 - Accessible Input Form Component
**Learning:** Hardcoding IDs or using non-deterministic derived IDs for form elements can lead to hydration mismatches in Next.js, and standard inputs must use `aria-invalid` and `aria-describedby` to correctly associate errors/hints.
**Action:** Use React's `useId()` hook for deterministic, collision-free IDs and ensure proper ARIA attributes are set on all form components.
