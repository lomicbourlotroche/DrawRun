
## 2024-05-14 - Input Component ARIA Enhancements
**Learning:** Hardcoded IDs for linking inputs to errors and hints cause hydration mismatches and collision issues when multiple instances of the same component are rendered. Simply adding a fixed ID isn't scalable in React.
**Action:** Use React's \`useId()\` to generate robust, guaranteed-unique IDs dynamically, and explicitly define \`aria-invalid\` (boolean) and \`aria-describedby\` (dynamic string or undefined) to strictly associate inputs with their respective hints or error messages.
