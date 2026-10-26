## 2023-10-26 - Accessible Password Toggle
**Learning:** Icon-only password visibility toggles are commonly missed in accessibility sweeps. Adding dynamic `aria-label` and `aria-pressed` states provides critical context for screen reader users on authentication forms.
**Action:** Always ensure any interactive icon, especially stateful ones like password visibility toggles, have dynamic ARIA attributes indicating their current state and action.
