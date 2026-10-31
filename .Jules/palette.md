
## 2024-10-31 - [Input Component Accessibility and ID Collision Fix]
**Learning:** Found an accessibility issue where error and hint messages in the Input component were not programmatically associated with the input field. Also, the fallback ID generation (`label?.toLowerCase().replace(/\s+/g, '-')`) could lead to collisions if multiple inputs had the same label, and caused hydration mismatches.
**Action:** Replaced the fallback ID generation with React's `useId()` hook to ensure unique IDs and prevent hydration issues. Added `aria-invalid` and `aria-describedby` attributes to correctly link error and hint states to the input for screen readers.
