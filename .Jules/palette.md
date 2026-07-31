## 2026-07-31 - Accessible Input Error and Hint Associations
**Learning:** For React inputs, generating unique IDs is critical to properly link `aria-describedby` to hint or error messages. Using `label?.toLowerCase()` can result in duplicated IDs across instances or hydration mismatches in SSR. Using React's built-in `useId()` solves this elegantly while ensuring reliable screen-reader associations.
**Action:** Always use `useId()` for generating element IDs in React components (unless explicitly provided via props), especially for linking accessibility attributes like `aria-describedby`.
