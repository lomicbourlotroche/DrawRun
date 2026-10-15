## 2023-10-24 - Stable Accessible IDs for Inputs
**Learning:** Using label-derived string fallbacks for `id` causes hydration mismatches and collision issues in dynamically rendered forms.
**Action:** Always prefer React's built-in `useId()` hook to generate unique IDs, and programmatically construct related IDs (e.g., `-error`, `-hint`) to ensure robust `aria-describedby` associations. Also expect boolean `aria-invalid` to render as string `'true'`/`'false'` in DOM for testing purposes.
