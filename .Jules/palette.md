## 2024-05-18 - Input component accessible IDs
**Learning:** Using `useId()` in React is essential for mapping input fields with descriptive tags (`aria-describedby`) without hardcoding them, preventing hydration and collision issues on heavily reused components like Input.
**Action:** Always prefer `useId()` inside reusable form elements to guarantee stable, unique links for ARIA properties instead of deriving from labels.
