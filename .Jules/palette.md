## 2026-07-29 - Input component accessibility
**Learning:** The `Input` component handles dynamic rendering of errors and hints. When associating these elements to the input using `aria-describedby`, we must ensure robust unique ID generation to support multiple instances on the same page, and we should use React's `useId()` hook for that to guarantee stability across renders.
**Action:** Always prefer `useId()` to manually generated IDs (e.g. from props or labels) to prevent collisions when instances are repeated.
