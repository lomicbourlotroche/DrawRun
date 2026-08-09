## 2024-03-20 - Adding ARIA attributes to Input components
**Learning:** Using `useId()` in React is highly beneficial for generating unique, stable IDs for accessibility properties (`aria-describedby`) on components that can be instantiated multiple times on the same page. Fallback IDs derived from labels can cause conflicts.
**Action:** Always prefer React's `useId()` when creating links between inputs and descriptive elements (like error/hint messages) in reusable form components to ensure robust screen-reader support without ID collisions.
