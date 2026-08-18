
## 2024-08-18 - Form Input Error and Hint Associations
**Learning:** Screen readers require explicit programmatic associations between input fields and their error/hint messages to convey context to visually impaired users. In Next.js/React, `useId()` is crucial to generate unique IDs and prevent hydration mismatches, avoiding duplicate IDs when a component like `Input` is reused multiple times.
**Action:** Always link form input elements to their validation/hint elements using `aria-describedby` (combining IDs) and indicate invalid state using `aria-invalid={!!error}`. Use `useId()` to ensure these IDs remain globally unique across multiple instances.
