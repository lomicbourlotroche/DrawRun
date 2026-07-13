## 2024-11-20 - Form Input Accessibility
**Learning:** Relying purely on visual proximity for error messages leaves screen reader users unaware of form validation issues. Always use `useId()` to generate unique IDs and pair them with `aria-invalid` and `aria-describedby` to explicitly link inputs with their corresponding hint or error texts.
**Action:** Apply this pattern using `useId` + `aria-describedby` across all custom form control components (Select, Textarea, etc.) to ensure consistent accessibility.
