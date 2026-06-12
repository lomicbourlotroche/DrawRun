## 2024-06-12 - Icon-only Activity Controls Need Accessibility Labels
**Learning:** Highly interactive components like activity recorders (e.g. `RecordingControls.tsx`) are highly prone to missing accessibility labels because they rely heavily on visual cues (icons) without text.
**Action:** When working on complex mobile-like UI components with numerous icon-only buttons, systematically check and add `aria-label` attributes to ensure screen reader users understand the action each button performs.
