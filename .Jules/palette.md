## 2024-07-04 - Accessible Toggle Buttons
**Learning:** Icon-only toggle buttons need `aria-pressed` in addition to `aria-label` to provide the correct semantic state to screen readers.
**Action:** Always include `aria-pressed={state}` on custom toggle buttons alongside a descriptive `aria-label`.
