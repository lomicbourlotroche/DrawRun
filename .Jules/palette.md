## 2024-08-11 - Password Visibility Toggle Accessibility
**Learning:** Icon-only interactive elements like password visibility toggles (`Eye` / `EyeOff` icons) need explicit context for screen reader users. The application state (whether the password is currently visible or masked) must also be communicated clearly.
**Action:** Always include both an `aria-label` describing the action (e.g., "Afficher/Masquer le mot de passe") and an `aria-pressed` state boolean on icon-only toggle buttons to ensure semantic correctness for assistive technologies.
