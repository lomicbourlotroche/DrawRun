
## 2024-10-27 - Unique Accessible Identifiers for Form Fields
**Learning:** Using React's `useId()` is crucial when generating identifiers for input elements that conditionally render errors and hints, because multiple input components often share the same or similar labels. Hardcoded IDs derived from the `label` prop can easily conflict when rendered on the same page, causing ARIA `aria-describedby` associations to break and screen readers to read out incorrect, misplaced context messages.
**Action:** Always prefer `useId()` hook to generate unique IDs for input fields and use these values to construct associated IDs for validation/hint messages to bind with `aria-describedby` and ensure accessibility and hydration stability.
