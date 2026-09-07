
## 2026-09-07 - Input ARIA Accessibility via useId
**Learning:** Using `aria-invalid` and `aria-describedby` to associate hint/error texts is a critical accessibility requirement for form inputs. However, deriving a static ID based on a label or placeholder is problematic and prone to duplicate ID collisions (e.g., if multiple forms use an "email" input on the same page) or hydration errors.
**Action:** Always use React's built-in `useId()` hook to generate truly unique base IDs for the input, error, and hint containers. Use string matching in tests to handle the non-deterministic output of `useId()`.
