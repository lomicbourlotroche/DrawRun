## 2026-07-17 - [Input Form ARIA Associations]
**Learning:** Using React's `useId()` hook is the safest way to generate unique identifiers for ARIA associations (like `aria-describedby`) in custom form components, preventing ID collisions when multiple instances are rendered on the same page.
**Action:** When creating form inputs with error or hint messages, always use `useId()` to link the input to its corresponding messages using `aria-describedby` and set `aria-invalid` based on error state.
