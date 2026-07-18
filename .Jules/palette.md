## 2026-07-18 - Form Accessibility
**Learning:** Linking form labels to inputs and adding aria-labels to icon-only buttons significantly improves accessibility. Using `useId()` for ARIA associations like `aria-describedby` ensures true uniqueness and prevents hydration mismatches.
**Action:** Use React's `useId()` hook to generate IDs for label associations and dynamic error message IDs, and ensure toggle buttons always have an `aria-label` and semantic `aria-pressed` states.
