
## 2025-10-16 - Form Accessibility: React's useId() instead of Label-Derived IDs
**Learning:** For reliable ARIA associations, using `useId()` is more robust than deriving IDs from labels (`label.replace(...)`) as it prevents ID collisions when multiple components share the same label (e.g. multiple "Email" inputs) and avoids server-client hydration mismatches.
**Action:** Always prefer `useId()` for generating IDs linking `<input>` to labels (`htmlFor`) and helper/error texts (`aria-describedby`), and avoid label-derived or hardcoded string fallbacks in generic UI components.
