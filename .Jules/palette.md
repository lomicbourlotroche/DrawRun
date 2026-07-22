## 2024-05-18 - ARIA Association for Form Inputs
**Learning:** Using React's `useId` to dynamically generate unique identifiers ensures robust `aria-describedby` links between form inputs and their corresponding error or hint messages, improving accessibility without risking ID collisions across multiple component instances.
**Action:** Consistently apply `useId` when building reusable input components to automatically wire `aria-invalid` and `aria-describedby` attributes to their respective feedback elements.
