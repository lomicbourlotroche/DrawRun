## 2023-10-25 - React useId() for ARIA associations
**Learning:** Using `useId()` is crucial when linking accessible error/hint IDs (like `aria-describedby`) in widely used custom React components (like `Input.tsx`), instead of deriving IDs from `label` strings which leads to duplicates across pages.
**Action:** Always prefer `useId()` inside generic UI wrapper components that require associated IDs for descriptive fields. Note that UI tests should use Regex matching (e.g., `expect.stringMatching(/.*-error/)`) rather than hardcoded string matching.
