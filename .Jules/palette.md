## 2024-05-18 - Input Component Accessibility
**Learning:** Inputs that show dynamic error and hint messages need definitive ARIA associations. Relying only on `id || label-derived-id` risks collisions. Replacing the fallback with `React.useId()` ensures unique IDs for inputs, hints, and error elements, preventing screen readers from announcing incorrect or missing contexts.
**Action:** Always map `aria-invalid` to the presence of errors, and use `aria-describedby` dynamically pointing to specific, `useId()`-generated IDs of associated helper text or error messages.
