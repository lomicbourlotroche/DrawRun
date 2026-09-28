## 2024-05-18 - Input Error & Hint ARIA Associations
**Learning:** Found that the Input component lacked explicit screen reader associations for error and hint states. Relying on label-derived IDs can cause collisions. React's `useId()` provides robust, collision-free identifiers for ARIA linking.
**Action:** When creating reusable form components (like `Input` or `Select`), always implement `aria-invalid` for error states and `aria-describedby` linking to uniquely generated IDs (via `useId()`) for inline validation and hint messages.
