## 2024-08-26 - Form Field Accessibility Attributes
**Learning:** For accessible form fields, `aria-invalid={!!error}` is crucial to signal an invalid state, and `aria-describedby` dynamically links the input field to its descriptive error or hint elements, improving the screen reader experience.
**Action:** Always ensure that custom form inputs link errors and hints using `aria-describedby` with matching dynamically generated unique IDs (e.g. via `useId()`).
