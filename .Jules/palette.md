## 2024-05-15 - Input Error and Hint Associations
**Learning:** Form inputs with separate error or hint text elements need programmatic association to be accessible to screen readers, especially in reusable UI components where IDs might clash.
**Action:** When creating or modifying form components with validation or helper text, always use React's `useId()` to generate a unique base ID, then apply `aria-invalid={!!error}` and link the input to the hint/error text via `aria-describedby` matching the IDs of the `<p>` elements.
