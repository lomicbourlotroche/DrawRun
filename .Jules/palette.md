## 2023-10-27 - [Input Form Associations]
**Learning:** Screen readers need explicit linking between an input field and its corresponding error/hint messages using `aria-describedby`. `aria-invalid` is also important for clearly conveying validation failures.
**Action:** Use React's `useId()` to generate unique IDs and attach `aria-describedby` to link inputs to the IDs of their error or hint elements. Set `aria-invalid={true}` when an error is present.
