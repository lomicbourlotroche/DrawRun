## 2024-05-24 - Accessibility: ARIA associations for Form Inputs
**Learning:** Proper association between a form `<input>` and its `error` or `hint` messages using `aria-describedby` alongside `aria-invalid` provides critical context to screen readers, allowing them to announce the state immediately. React's `useId()` is ideal for dynamically generating these IDs to prevent hydration mismatch.
**Action:** Always ensure that form fields explicitly associate error, hint, and label elements correctly using appropriate ARIA attributes.
