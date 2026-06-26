## 2026-06-26 - [Add ARIA states to Custom Icon Toggles]
**Learning:** Custom icon toggle buttons require not just `aria-label` for screen readers, but also `aria-pressed` to semantically communicate their current active/inactive state.
**Action:** Always add `aria-pressed={state}` and proper focus indicators like `focus-visible:ring-2` when creating custom toggle switches or theme togglers.
