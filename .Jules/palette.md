## 2024-09-05 - Unique IDs for Form Inputs
**Learning:** Generating IDs from labels (e.g., `label.toLowerCase().replace(/\s+/g, '-')`) can lead to duplicate IDs if the same component is used multiple times on a page with the same label (e.g., in lists or repeated forms), which breaks ARIA associations and causes hydration mismatches in React.
**Action:** Always use React's built-in `useId()` hook to generate guaranteed unique IDs for components to correctly link inputs with their respective labels, error messages (`aria-describedby`), and hints.
