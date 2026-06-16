## 2026-06-16 - Accessible Interactive Controls
**Learning:** Found that globally used interactive icon buttons (like ThemeToggle and LanguageToggle) relied only on the `title` attribute without an `aria-label`, and lacked explicit keyboard focus indicators (`focus-visible`). Additionally, custom dropdowns were missing `aria-expanded` state.
**Action:** Always include `aria-label` for icon-only controls, explicitly add `focus-visible` ring styles for keyboard navigation, and manage `aria-expanded` state for interactive dropdowns to ensure screen reader compatibility.
