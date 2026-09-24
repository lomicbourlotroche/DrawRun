## 2026-09-24 - Proper Form Input Error and Hint Associations
**Learning:** When generating unique IDs for React components (e.g., to create unique error/hint IDs for ARIA associations like aria-describedby), prioritizing React's built-in useId() hook over label-derived IDs prevents ID collisions and hydration mismatches.
**Action:** Use useId() for component accessibility relationships and update tests to verify associations using regex or matchers rather than hardcoded string values.
