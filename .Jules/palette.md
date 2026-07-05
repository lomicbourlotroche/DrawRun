## 2025-02-23 - Accessibility of icon-only toggle buttons
**Learning:** Icon-only toggle buttons in this app (like `ThemeToggle`) often rely solely on visual cues or native `title` attributes, which can be insufficient for screen reader users to understand both the purpose and the current active state of the button.
**Action:** Consistently apply both `aria-label` (for purpose description) and `aria-pressed` (for binary toggle states) to icon-only toggle buttons. Additionally, ensure they always have explicit `focus-visible` styles to aid keyboard navigation.
