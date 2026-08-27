
## 2024-05-18 - Proper ARIA Connection for Input Errors/Hints
**Learning:** Reusable input components that dynamically display error or hint messages need a robust way to associate these messages with the input field for screen readers. If IDs are hardcoded or manually generated, there's a risk of ID collisions when multiple inputs are rendered on the same page.
**Action:** Use React's `useId()` hook to generate guaranteed unique base IDs for input elements. Then, append suffixes (like `-error` or `-hint`) to these base IDs to link the `aria-describedby` attribute on the `<input>` to the corresponding `id` of the error or hint text elements. Also ensure `aria-invalid` is properly toggled.
