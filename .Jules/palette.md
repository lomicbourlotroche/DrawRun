## 2024-03-20 - Ensure custom combobox patterns are accessible
**Learning:** Custom UI components like dropdown selects built with `button` and `div` elements must implement the W3C combobox pattern (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-controls`, `aria-selected`) to provide proper context and state information to screen readers.
**Action:** When building custom select components, ensure the correct ARIA attributes are applied to indicate state and structure.

## 2024-03-20 - Form inputs require ARIA descriptions
**Learning:** Inputs need semantic `aria-invalid` and `aria-describedby` when errors or hints are present to inform screen readers of validation states.
**Action:** Always link error and hint messages to the input using dynamically generated `id` attributes via `useId()`.
