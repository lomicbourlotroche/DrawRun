## 2024-08-17 - Added missing ARIA properties to Input component
**Learning:** React `useId()` is crucial for generating unique IDs to ensure ARIA associations (like `aria-describedby`) work correctly across multiple instances of the same component on a page.
**Action:** When creating reusable form components, always fallback to `useId()` for generating IDs, and properly associate error and hint elements with the input using `aria-describedby` and `aria-invalid`.
