## 2026-06-10 - Adding ARIA labels to Recording Controls
**Learning:** The activity recording controls in this app use numerous icon-only buttons for critical actions (start, pause, connect HR, etc.), which are completely inaccessible to screen readers without ARIA labels.
**Action:** Always verify icon-only buttons have descriptive `aria-label` attributes, especially in complex UI components like recording dashboards. Use French labels to match the app's primary localization.
