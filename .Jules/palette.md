## 2026-09-25 - Form input accessibility and ARIA associations
**Learning:** Using React's useId() hook is critical for generating unique IDs for ARIA associations (like aria-describedby) to prevent ID collisions and hydration mismatches, rather than relying on label-derived IDs.
**Action:** Always prefer useId() when establishing accessible relationships between inputs and their corresponding error/hint elements in reusable components.
