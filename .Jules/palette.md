## 2024-06-14 - Aria Labels on Recording Controls
**Learning:** Found an accessibility issue pattern specific to this app's components, where icon-only buttons lacked aria-labels, specifically in `RecordingControls.tsx`. This made the interface inaccessible to screen readers.
**Action:** Added `aria-label` attributes to all icon-only buttons in the component, using localized French text since the app's primary language is French. Always ensure icon-only interactive elements have an `aria-label`.
