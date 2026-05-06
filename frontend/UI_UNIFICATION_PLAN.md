# Plan d'Unification du Style UI DrawRun

## Objectif
Uniformiser le style UI de toute l'application (dashboard, app pages) pour correspondre au design moderne et sophistiqué de la landing page.

---

## 🎨 Analyse du Style Landing Page

### Palette de Couleurs Principale
```
Primary:    #007AFF (bleu iOS) → primary-600
Primary-50: #F0F7FF (fond bleu très clair)
Primary-100:#E0F0FF (fond badge)
Primary-400:#66B2FF (bleu moyen)
Success:    #34C759 (vert iOS)
Warning:      #FF9500 (orange)
Danger:       #FF3B30 (rouge iOS)
Neutral-50:   #F9FAFB (fond principal)
Neutral-900:  #111827 (texte titre)
```

### Effets Visuels Clés
1. **Fond gradient subtil** - `bg-gradient-to-br from-neutral-50 via-white to-primary-50/30`
2. **Effets de lumière floutés** - `blur-3xl` avec opacité réduite
3. **Pattern grille subtile** - `bg-[linear-gradient(rgba(0,102,255,0.03)_1px,transparent_1px)]`
4. **Glassmorphism** - `backdrop-filter: blur(20px)` + `bg-white/95`
5. **Bordures douces** - `border border-border` avec couleurs très claires
6. **Ombres sophistiquées** - `shadow-button-primary` avec transitions

### Composants Clés
- **Cards**: `rounded-2xl`, fond blanc/translucide, ombres douces
- **Badges**: `rounded-full`, couleurs pastel avec bordures
- **Boutons**: `rounded-xl`, dégradés, effets hover avec translate
- **Titres**: `font-extrabold`, `tracking-tight`, dégradés texte

---

## 📋 Plan de Migration

### Phase 1: Fond et Layout Global

#### 1.1 AppLayout (`components/layout/AppLayout.tsx`)
**Changements:**
```diff
- <div className="min-h-screen bg-slate-50">
+ <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 relative">
+   {/* Background Effects */}
+   <div className="fixed inset-0 pointer-events-none">
+     <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl" />
+     <div className="absolute bottom-20 right-10 w-96 h-96 bg-success-400/5 rounded-full blur-3xl" />
+   </div>
+   {/* Grid Pattern */}
+   <div className="fixed inset-0 bg-[linear-gradient(rgba(0,102,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,102,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
```

#### 1.2 Header (`components/layout/Header.tsx`)
**Changements:**
```diff
- <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
+ <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-neutral-200/60 shadow-sm">
```

**Boutons:**
```diff
- className="... bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
+ className="... bg-white/80 border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700"
```

---

### Phase 2: Composants UI de Base

#### 2.1 Créer `components/ui/GlassCard.tsx`
Nouveau composant de carte glassmorphism:
```tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div className={cn(
      "bg-white/90 backdrop-blur-sm border border-neutral-200/60 rounded-2xl",
      "shadow-sm",
      hover && "hover:shadow-md hover:border-primary-200/50 transition-all duration-300",
      className
    ))}>
      {children}
    </div>
  );
}
```

#### 2.2 Créer `components/ui/GradientBadge.tsx`
Badges avec style landing page:
```tsx
interface GradientBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

// Styles:
// primary: bg-primary-100 border-primary-200 text-primary-700
// success: bg-success-100 border-success-200 text-success-700
// etc.
```

#### 2.3 Créer `components/ui/PrimaryButton.tsx`
Boutons avec dégradés:
```tsx
// Variante primaire:
className="bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-button-primary hover:shadow-button-primary-hover hover:-translate-y-0.5 transition-all duration-200"

// Variante secondaire:
className="bg-white border-2 border-neutral-200 text-neutral-700 font-semibold rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
```

---

### Phase 3: Dashboard Redesign

#### 3.1 `DashboardContent.tsx`
**Section vide (aucune activité):**
```diff
- <div className="bg-surface border border-border rounded-2xl p-8">
+ <div className="bg-white/90 backdrop-blur-sm border border-neutral-200/60 rounded-2xl p-8 shadow-sm">
-   <div className="w-16 h-16 bg-primary/20 rounded-2xl">
+   <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl">
-   <Link className="... bg-primary text-white ...">
+   <Link className="... bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-button-primary hover:shadow-button-primary-hover hover:-translate-y-0.5 ...">
```

#### 3.2 ModernDashboard (`components/features/dashboard/ModernDashboard.tsx`)
- Remplacer toutes les cartes par `GlassCard`
- Ajouter des badges `GradientBadge` pour les statuts
- Utiliser `PrimaryButton` pour les CTAs

---

### Phase 4: Sidebar et Navigation

#### 4.1 Sidebar (`components/layout/Sidebar.tsx`)
```diff
- <aside className="... bg-slate-900 ...">
+ <aside className="... bg-neutral-900/95 backdrop-blur-xl ...">

- <Link className="... text-slate-300 hover:bg-slate-800 ...">
+ <Link className="... text-neutral-300 hover:bg-white/10 hover:text-white ...">
```

---

### Phase 5: Pages Spécifiques

#### 5.1 Activities Page
- Liste: utiliser `GlassCard` pour chaque item
- Filtres: badges avec style landing

#### 5.2 Coach Page
- Cards de plans: `GlassCard` avec hover effects
- Badges de statut: `GradientBadge`

#### 5.3 Profile Page
- Sections: `GlassCard` avec séparateurs subtils
- Avatar: bordure avec dégradé

#### 5.4 Social Page
- Groupes: `GlassCard` avec shadows
- Feed: style glassmorphism

---

## 🛠 Variables CSS à Ajouter

Dans `globals.css` ou `tailwind.config.js`:

```css
:root {
  /* Colors */
  --primary-50: #F0F7FF;
  --primary-100: #E0F0FF;
  --primary-400: #66B2FF;
  --primary-500: #3399FF;
  --primary-600: #007AFF;
  
  /* Shadows */
  --shadow-button-primary: 0 4px 14px rgba(0, 122, 255, 0.25);
  --shadow-button-primary-hover: 0 6px 20px rgba(0, 122, 255, 0.35);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.08);
  
  /* Transitions */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 📁 Fichiers à Modifier (Ordre de Priorité)

### Haute Priorité
1. `components/layout/AppLayout.tsx` - Fond global
2. `components/layout/Header.tsx` - Header glassmorphism
3. `components/ui/GlassCard.tsx` - **Nouveau composant**
4. `app/app/DashboardContent.tsx` - Dashboard vide
5. `components/features/dashboard/ModernDashboard.tsx` - Dashboard avec données

### Moyenne Priorité
6. `components/layout/Sidebar.tsx` - Navigation
7. `app/app/activities/page.tsx` - Liste activités
8. `app/app/coach/page.tsx` - Page coach
9. `app/app/profile/page.tsx` - Profil utilisateur

### Basse Priorité
10. `app/app/social/page.tsx` - Social
11. `app/app/explore/page.tsx` - Exploration
12. `app/app/performance/page.tsx` - Performance

---

## ✅ Checklist de Validation

- [x] Fond gradient présent sur toutes les pages app
- [x] Effets de lumière floutés visibles
- [x] Header avec glassmorphism (backdrop-blur)
- [x] Cartes avec fond blanc/90 + border subtile (GlassCard)
- [x] Boutons primaires avec dégradé et shadow
- [x] Badges avec couleurs pastel et bordures (GradientBadge)
- [x] Animations hover fluides (300ms)
- [x] Typographie bold pour les titres
- [x] Grille subtile en background
- [x] Cohérence des couleurs primary-600 partout
- [x] Build Next.js OK (aucune erreur)

---

## 🚀 Implémentation Recommandée

1. **Étape 1**: Créer les composants UI de base (`GlassCard`, `GradientBadge`, `PrimaryButton`)
2. **Étape 2**: Modifier `AppLayout` et `Header` pour le fond global
3. **Étape 3**: Refactoriser le Dashboard avec les nouveaux composants
4. **Étape 4**: Propager aux autres pages par ordre de priorité
5. **Étape 5**: Vérifier la cohérence sur mobile et desktop

---

## 📝 Notes Importantes

- Garder la compatibilité avec le système de thème (clair/sombre)
- Utiliser `cn()` pour la composition de classes
- Préserver les fonctionnalités existantes (pas de régression)
- Tester sur mobile (responsive)
- Les couleurs `slate` doivent migrer vers `neutral` pour correspondre à la landing
