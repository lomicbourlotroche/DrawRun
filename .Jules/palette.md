## 2024-05-18 - Input accessibility pattern
**Learning:** Found a reusable UX pattern for this design system - form inputs should use proper ARIA attributes to map errors (`aria-invalid`, `aria-errormessage`) and hints (`aria-describedby`) for screen readers. Using `useId()` ensures robust ID generation instead of relying on label text.
**Action:** Always implement this mapping on all complex input components moving forward.
