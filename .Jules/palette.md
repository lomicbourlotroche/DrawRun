## 2024-05-15 - Dynamic IDs for Form Error Hints
**Learning:** Using React's `useId()` hook is essential for generating robust, unique IDs for `aria-describedby` associations, especially in Next.js applications where mismatching client/server IDs can cause hydration errors. Avoid relying on parsed labels or props to generate IDs for form hints.
**Action:** Always utilize `useId()` when generating dynamic IDs for accessible error and hint messages in shared UI components like inputs.
