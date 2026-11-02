## 2024-11-02 - Ensure Input Components Use Resilient ARIA Associations
**Learning:** Hardcoding IDs derived from labels for `aria-describedby` links (e.g. replacing spaces with hyphens) can result in non-unique IDs when multiple fields have identical labels on the same page, which can confuse screen readers.
**Action:** Use React's `useId()` hook to establish unique resilient relationships for associated elements like error messages and hints (`aria-describedby`) to prevent collisions and hydration mismatches.
