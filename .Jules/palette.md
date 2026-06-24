## 2026-06-24 - Adding aria-labels to recording controls
**Learning:** Found multiple icon-only buttons without `aria-label` attributes in the activity recording controls. While visual context might seem obvious, screen readers need explicit labels for actions like start/stop, lap, and sensor connection.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons to ensure full accessibility for screen reader users.
