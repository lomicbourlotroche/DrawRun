## 2024-11-01 - Accessible Custom Select
**Learning:** Custom UI components like dropdown selects built with `button` and `div` elements must implement the W3C combobox pattern (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-controls`, `aria-selected`) to provide proper context and state information to screen readers.
**Action:** When building or updating custom select components, ensure the complete W3C combobox pattern is implemented, including linking the combobox to the listbox using `aria-controls`.
