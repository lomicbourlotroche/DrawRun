## 2024-05-18 - Added ARIA labels to RecordingControls
**Learning:** Found multiple icon-only buttons in the activities RecordingControls component that were missing ARIA labels. This is a common pattern for action buttons that can hinder screen reader accessibility. The UI uses action-oriented French terminology ("Démarrer l'enregistrement", "Sélectionner un segment", etc).
**Action:** Always add `aria-label` to buttons that only display icons, especially those responsible for key recording functions.
