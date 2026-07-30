## 2024-05-18 - [Icon-Only Toggle Buttons]
**Learning:** Icon-only interactive elements lacking `aria-label` and semantic state attributes (`aria-pressed`) create significant accessibility barriers.
**Action:** When implementing or updating icon-only toggle buttons (like password visibility), always provide localized descriptive `aria-label` attributes and explicitly track state with `aria-pressed`. Ensure the element is also keyboard accessible via clear `focus-visible` ring styling.
