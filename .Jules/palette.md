
## 2024-05-18 - Select Component ARIA W3C Combobox Pattern
**Learning:** Custom select/dropdown components in React must strictly implement the W3C combobox pattern (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-controls`, `aria-haspopup`, `aria-selected`) to be fully accessible to screen readers, and require a unique ID generated via `useId()` for `aria-controls` to properly associate the toggle with the listbox.
**Action:** Always verify ARIA attributes and ID associations on custom interactive components (like Selects and Dropdowns) using `useId()` to prevent non-accessible inputs or ID collisions.
