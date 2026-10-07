
## 2024-10-07 - Form Input Accessibility with useId
**Learning:** Using `useId()` for form element IDs (like input, error, and hint relationships) provides a more robust and scalable approach compared to label-derived string fallbacks. This avoids hydration mismatches during React SSR and entirely eliminates cross-page/component ID collisions that break screen reader associations. Setting `aria-invalid={!!error}` naturally casts to 'false' string in the DOM when there is no error (in tests, expecting it to be 'false' rather than completely missing when asserting non-error states).
**Action:** Default to `React.useId()` for establishing semantic aria linkages (`aria-describedby`) and `htmlFor`/`id` pairs in generic custom UI components to guarantee hydration safety and uniqueness.
