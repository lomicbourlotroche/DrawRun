## 2024-09-26 - Custom Select W3C Combobox Pattern
**Learning:** Custom UI components like dropdown selects built with `button` and `div` elements must implement the W3C combobox pattern (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-controls`, `aria-selected`) to provide proper context and state information to screen readers.
**Action:** Always ensure custom dropdown components include these required ARIA roles and state attributes, using `useId` to reliably generate unique identifiers for the `aria-controls` and `aria-labelledby` associations.
