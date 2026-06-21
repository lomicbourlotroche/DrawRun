## 2026-06-21 - Theme Toggle Accessibility Enhancements
**Learning:** The theme toggle icon button lacked proper accessibility states (`aria-label`, `aria-pressed`) and keyboard focus visibility (`focus-visible` styles).
**Action:** Always ensure that icon-only interactive elements have semantic `aria-label` attributes, toggle states have `aria-pressed`, and that all interactive components use clear `focus-visible` styles for better keyboard navigation.
