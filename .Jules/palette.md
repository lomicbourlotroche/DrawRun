## 2024-09-08 - Use useId() for ARIA associations
**Learning:** When associating form inputs with error or hint messages for screen readers, generating IDs based on the input label string (e.g., replacing spaces with dashes) can lead to hydration mismatches and ID collisions if multiple instances exist.
**Action:** Always use React's built-in `useId()` hook to generate unique, deterministic IDs for ARIA associations like `aria-describedby` and `aria-invalid` to ensure robust accessibility.
