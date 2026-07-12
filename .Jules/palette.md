
## 2024-07-12 - Form Input Accessibility with React useId
**Learning:** Hard-coded fallback IDs for DOM elements inside reusable form components lead to accessibility and hydration issues when multiple instances of the same component are rendered on the same page. Without unique `id`s, `aria-describedby` could point a screen reader to the wrong hint or error message.
**Action:** Always utilize React's `useId()` hook to generate guaranteed unique IDs for elements like inputs, labels, error messages, and hint messages to ensure robust `aria-invalid` and `aria-describedby` linkages that won't conflict with other components.
