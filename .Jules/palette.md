## 2026-07-09 - Accessible Icon-only Toggle Buttons
**Learning:** Icon-only toggle buttons need both `aria-label` (or `aria-labelledby`) and `aria-pressed` states to be fully accessible. Adding `focus-visible` utility classes ensures that keyboard users can easily identify when the button is focused without impacting mouse users.
**Action:** Always verify that all icon-only buttons include descriptive ARIA labels. For buttons that toggle state (like show/hide password, dark/light theme), ensure `aria-pressed` reflects the active state. Maintain keyboard focus visibility using Tailwind's `focus-visible:` variants.

## Backend Linting Errors
**Learning:** Backend linting errors are present but are to be ignored as per the persona directives ('Do not attempt to fix pre-existing CI workflow failures or backend linting errors'). The CI will fail but that is expected.
**Action:** Ignore backend lint errors in the final check.
