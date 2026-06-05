## 2026-06-05 - Password Visibility Buttons Accessibility
**Learning:** Password visibility toggle buttons were implemented as icon-only elements without ARIA labels or tooltips, causing issues for screen reader users and lacking hover context for visual users. French localization is important for this codebase.
**Action:** Add localized `aria-label` and `title` attributes to icon-only buttons to convey their dynamic state (e.g., 'Masquer le mot de passe' vs 'Afficher le mot de passe').
