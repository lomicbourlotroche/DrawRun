## 2026-06-25 - Adding ARIA labels and states to icon-only buttons
**Learning:** Icon-only interactive elements like theme toggle buttons often rely solely on the `title` attribute for tooltip hover states. However, screen readers also need explicit `aria-label` descriptions and semantic states like `aria-pressed` to convey the element's purpose and current toggle state effectively.
**Action:** Always ensure that icon-only toggle buttons include an `aria-label` (often mirroring the `title` text) and an `aria-pressed` attribute reflecting their active status.
