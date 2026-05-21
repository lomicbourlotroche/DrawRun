# DrawRun Design System

> **Système de design UNIQUE et PROFESSIONNEL** pour l'application DrawRun
> *Inspiré des sciences du sport et des algorithmes scientifiques intégrés*

---

## 🎯 Philosophie du Design System

Le design system de DrawRun est **100% unique** et conçu spécifiquement pour le domaine du tracking sportif et de la performance athlétique. Il ne s'agit pas d'un simple thème Tailwind générique, mais d'un système visuel **scientifiquement informé** qui reflète :

- **Les principes physiologiques** (zones cardiaques, puissance, fatigue)
- **Les modèles scientifiques** (PMC - Performance Management Chart)
- **Les bonnes pratiques sportives** (80/20 rule, périodisation)
- **L'identité de la marque DrawRun**

---

## 📊 Table des Matières

1. [Architecture](#-architecture)
2. [Palette de Couleurs](#-palette-de-couleurs)
3. [Tokens Métiers Uniques](#-tokens-mtiers-uniques-drawrun)
4. [Système de Tokens Semantiques](#-système-de-tokens-semantiques)
5. [Typographie](#-typographie)
6. [Espacement (8pt Grid)](#-espacement-8pt-grid)
7. [Rayons et Ombres](#-rayons-et-ombres)
8. [Z-Index System](#-z-index-system)
9. [Animations](#-animations)
10. [Gradients Métiers](#-gradients-métiers)
11. [Utilisation](#-utilisation)
12. [Génération Automatique](#-génération-automatique)
13. [Bonnes Pratiques](#-bonnes-pratiques)
14. [Exemples d'Utilisation](#-exemples-dutilisation)

---

## 🏗️ Architecture

### Structure des Fichiers

```
frontend/
├── src/
│   └── lib/
│       └── designTokens.ts      # ⭐ SOURCE UNIQUE - Tous les tokens ici
├── app/
│   └── globals.css             # ✅ GÉNÉRÉ AUTOMATIQUEMENT
├── tailwind.config.js          # ✅ GÉNÉRÉ AUTOMATIQUEMENT
├── scripts/
│   └── generate-design-tokens.js # Script de génération
└── DESIGN_SYSTEM.md             # 📄 Ce document
```

### Principe de la Source Unique

**⚠️ RÈGLE ABSOLUE :**
> Toutes les couleurs, espacements, et tokens de design **DOIVENT** être définis dans `src/lib/designTokens.ts`
> **NE JAMAIS** dupliquer ces valeurs ailleurs dans le code

### Processus de Mise à Jour

1. Modifier `designTokens.ts` (source unique)
2. Exécuter la génération automatique :
   ```bash
   npm run generate:design-tokens
   ```
3. **NE PAS** modifier manuellement `globals.css` ou `tailwind.config.js`

---

## 🎨 Palette de Couleurs

### Couleurs Principales (Marque DrawRun)

| Couleur | Hex | Usage | Signification |
|---------|-----|-------|---------------|
| **Primary** | `#0066FF` | CTA, liens, actions | Bleu Performance - Couleur principale de la marque |
| **Secondary** | `#5856D6` | Accents secondaires | Violet - Complément du primary |
| **Success** | `#00C853` | Validation, succès | Vert - States positifs |
| **Recovery** | `#00BCD4` | Récupération, forme | Cyan - État de fraîcheur (PMC) |
| **Warning** | `#FFAB00` | Alertes, attention | Orange - Seuil à surveiller |
| **Danger** | `#FF5252` | Erreurs, risque | Rouge - État critique |
| **Peak** | `#FF6D00` | Pic de performance | Orange vif - Forme optimale |

### Palettes Complètes (50-900)

Chaque couleur principale a une palette complète de 9 nuances :

```typescript
// Exemple pour primary
primary: {
  50: '#E6F2FF',   // Fond très clair
  100: '#CCE5FF',
  200: '#99CBFF',
  300: '#66B0FF',
  400: '#4C9AFF',
  500: '#007AFF',
  600: '#0066FF',   // DEFAULT
  700: '#0052CC',
  800: '#003D99',
  900: '#001A4D',   // Fond très foncé
  DEFAULT: '#0066FF',
  foreground: '#FFFFFF',  // Texte sur fond primary
  glow: 'rgba(0, 102, 255, 0.3)',  // Effet glow
}
```

### Couleurs Neutres (60-30-10 Rule)

| Token | Hex | Usage |
|-------|-----|-------|
| `--neutral-50` | `#F8FAFC` | Fond principal (60%) |
| `--neutral-100` | `#F1F5F9` | Fond alternatif |
| `--neutral-200` | `#E2E8F0` | Bordures légères |
| `--neutral-300` | `#CBD5E1` | Bordures |
| `--neutral-400` | `#94A3B8` | Texte secondaire (muted) |
| `--neutral-600` | `#475569` | Texte emphase |
| `--neutral-800` | `#1E293B` | Surface (30%) |
| `--neutral-900` | `#0F172A` | Texte principal (10%) |

### Couleurs des Activités Sportives

| Activité | Couleur | Hex |
|----------|---------|-----|
| Course à pied | `--activity-run` | `#FF3B30` |
| Cyclisme | `--activity-ride` | `#FF9500` |
| Natation | `--activity-swim` | `#007AFF` |
| Randonnée | `--activity-hike` | `#34C759` |
| Marche | `--activity-walk` | `#8E8E93` |
| Ski | `--activity-ski` | `#007AFF` |
| Trail running | `--activity-trail` | `#FF6D00` |
| Aviron | `--activity-rowing` | `#00BCD4` |

---

## 🎯 Tokens Métiers (UNIQUE À DRAWRUN)

### 📊 Zones Cardiaques (HR Zones)

Basées sur le **% de la Fréquence Cardiaque Maximale (FCM)** - Utilisées dans `cardiovascular.js`

| Zone | Couleur | Plage | Intensité | Signification |
|------|---------|-------|-----------|---------------|
| Zone 1 | `--hr-zone-1` / `#00C853` | 50-60% | Très léger | Récupération active, échauffement |
| Zone 2 | `--hr-zone-2` / `#8BC34A` | 60-70% | Léger | Endurance fondamentale, combustion des graisses |
| Zone 3 | `--hr-zone-3` / `#FFAB00` | 70-80% | Modéré | Amélioration de la capacité aérobie |
| Zone 4 | `--hr-zone-4` / `#FF6D00` | 80-90% | Intense | Amélioration de la puissance et de la vitesse |
| Zone 5 | `--hr-zone-5` / `#FF5252` | 90-100% | Maximum | Sprints, efforts maximaux, compétition |

**Utilisation :**
```typescript
import { hrZones, getHRZoneColor } from '@/lib/designTokens';

// Couleur d'une zone spécifique
const color = hrZones.zone3.DEFAULT; // '#FFAB00'

// Couleur dynamique par numéro de zone
const color = getHRZoneColor(3); // '#FFAB00'
```

### 🚴 Zones de Puissance Cyclisme

Basées sur le **% du FTP (Functional Threshold Power)** - Utilisées dans `critical_power.js`

| Zone | Couleur | Plage | Nom | Description |
|------|---------|-------|-----|-------------|
| Zone 1 | `--power-zone-1` / `#00BCD4` | <55% | Active Recovery | Récupération, très léger |
| Zone 2 | `--power-zone-2` / `#00C853` | 56-75% | Endurance | Endurance fondamentale |
| Zone 3 | `--power-zone-3` / `#8BC34A` | 76-90% | Tempo | Allure marathon, seuil aérobie |
| Zone 4 | `--power-zone-4` / `#FFAB00` | 91-105% | Threshold | Seuil lactique, allure 10km |
| Zone 5 | `--power-zone-5` / `#FF6D00` | 106-120% | VO2 Max | Capacité anaérobie, allure 3km-5km |
| Zone 6 | `--power-zone-6` / `#E91E63` | 121-150% | Anaerobic | Efforts courts et intenses |
| Zone 7 | `--power-zone-7` / `#9C27B0` | >150% | Neuromuscular | Sprints, départs, accélérations |

**Utilisation :**
```typescript
import { powerZones, getPowerZoneColor } from '@/lib/designTokens';

// Couleur d'une zone spécifique
const color = powerZones.zone5.DEFAULT; // '#FF6D00'

// Couleur dynamique par numéro de zone
const color = getPowerZoneColor(5); // '#FF6D00'
```

### 📈 États de Forme (PMC - Performance Management Chart)

Modèle **scientifique** pour suivre la **fatigue**, la **fitness** et la **forme** (Form = Fitness - Fatigue)

| État | Couleur | Valeur TSB | Signification |
|------|---------|-------------|---------------|
| **Overtrained** | `--form-overtrained` / `#FF5252` | TSB < -20 | Risque de blessure ou de contre-performance |
| **Fatigued** | `--form-fatigued` / `#FFAB00` | -20 ≤ TSB < -5 | Fatigue accumulée, récupération nécessaire |
| **Normal** | `--form-normal` / `#0066FF` | -5 ≤ TSB < 5 | État de forme standard |
| **Fresh** | `--form-fresh` / `#00BCD4` | 5 ≤ TSB < 25 | Bien récupéré, bonne forme générale |
| **Peak** | `--form-peak` / `#FF6D00` | TSB ≥ 25 | Performance optimale, prêt à battre des records |

**Utilisation :**
```typescript
import { pmcStates, getPMCFormColor } from '@/lib/designTokens';

// Couleur d'un état spécifique
const color = pmcStates.peak.DEFAULT; // '#FF6D00'

// Couleur dynamique par valeur TSB
const color = getPMCFormColor(30); // '#FF6D00' (peak)
```

### 💤 Niveaux de Fatigue

| Niveau | Couleur | Seuil | Description |
|--------|---------|-------|-------------|
| Fresh | `--fatigue-fresh` / `#00BCD4` | < 10% | Aucune fatigue significative |
| Normal | `--fatigue-normal` / `#0066FF` | 10-30% | Fatigue normale après entraînement |
| Fatigued | `--fatigue-fatigued` / `#FFAB00` | 30-50% | Besoin de récupération |
| Very Fatigued | `#FF8F00` | 50-70% | Récupération active nécessaire |
| Overtrained | `--fatigue-overtrained` / `#FF5252` | > 70% | Risque élevé de blessure |

### ✅ Niveaux de Readiness (Prêt à s'entraîner)

| Niveau | Couleur | Score | Description |
|--------|---------|-------|-------------|
| Very Poor | `--readiness-very-poor` / `#FF5252` | 0-29 | Repos complet nécessaire |
| Poor | `--readiness-poor` / `#FF6D00` | 30-49 | Éviter les entraînements intenses |
| Fair | `--readiness-fair` / `#FFAB00` | 50-69 | Récupération active recommandée |
| Good | `--readiness-good` / `#00BCD4` | 70-89 | Bon pour un entraînement modéré |
| Excellent | `--readiness-excellent` / `#00C853` | ≥ 90 | Parfait pour un entraînement intense |

### 📊 Niveaux de Polarisation (80/20 Rule)

| Élément | Couleur | Cible | Description |
|---------|---------|-------|-------------|
| Zone 1 (Endurance) | `--polarization-zone1` / `#00BCD4` | 80% | Entraînement en zone 1 (aérobie) |
| Zone 2+ (Intensité) | `--polarization-zone2-plus` / `#FF6D00` | 20% | Entraînement en zones 2+ (anaérobie) |
| Déséquilibre | `--polarization-imbalance` / `#FF5252` | >85% | Trop d'intensité, risque de surentraînement |

### 🌡️ Stress Thermique

| Niveau | Couleur | Seuil (°C) | Description |
|--------|---------|------------|-------------|
| Low | `#00BCD4` | < 20°C | Conditions optimales |
| Moderate | `#00C853` | < 25°C | Conditions acceptables |
| High | `#FFAB00` | < 30°C | Précautions nécessaires |
| Extreme | `#FF5252` | ≥ 35°C | Danger - Éviter l'effort |

### 💧 Niveaux d'Hydratation

| Niveau | Couleur | Pourcentage | Description |
|--------|---------|-------------|-------------|
| Optimal | `#00C853` | 100% | Hydratation optimale |
| Good | `#8BC34A` | 80% | Bonne hydratation |
| Fair | `#FFAB00` | 60% | Hydratation moyenne |
| Poor | `#FF6D00` | 40% | Déshydratation légère |
| Critical | `#FF5252` | 20% | Déshydratation sévère |

---

## 🏷️ Système de Tokens Semantiques

### Tokens Light Mode

```css
/* Background */
--bg: #F8FAFC;              /* Fond principal */
--bg-secondary: #F1F5F9;    /* Fond secondaire */
--surface: #FFFFFF;          /* Cartes, surfaces élevées */

/* Text */
--foreground: #0F172A;      /* Texte principal */
--text-primary: #0F172A;
--text-secondary: #475569;
--text-tertiary: #64748B;
--muted: #94A3B8;           /* Texte atténué */

/* Borders */
--border: #E2E8F0;           /* Bordures */
--border-strong: #CBD5E1;

/* States */
--bg-success: #E8F9EE;
--bg-warning: #FFF8E1;
--bg-danger: #FFEBEE;
--bg-info: #E6F2FF;
```

### Tokens Dark Mode

```css
/* Dans .dark {} */
--bg: #080C14;              /* Fond principal */
--bg-secondary: #111827;
--surface: #111827;          /* Cartes, surfaces élevées */
--surface-elevated: #1E2D45;

--foreground: #E8EDF5;      /* Texte principal */
--text-secondary: #94A3B8;
--text-tertiary: #64748B;
--muted: #4A5568;

--border: #1E2D45;
--border-strong: #334155;

/* Background status (variantes dark) */
--bg-success: #1A2E22;
--bg-warning: #2E2212;
--bg-danger: #2E1A1A;
--bg-info: #1A2332;
```

**⚠️ Note :** Les couleurs sémantiques (`--primary`, `--success`, etc.) restent les **mêmes** en light et dark mode pour maintenir la cohérence de la marque.

---

## 🔤 Typographie

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', 'SF Pro Mono', 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
```

### Tailles de Police

| Token | Valeur | Usage |
|-------|--------|-------|
| `text-xs` | 12px | Texte très petit (labels, hints) |
| `text-sm` | 14px | Texte petit (métadonnées) |
| `text-md` | 16px | Texte standard (body) |
| `text-lg` | 18px | Texte large (sous-titres) |
| `text-xl` | 20px | Titres de section |
| `text-2xl` | 24px | Données principales |
| `text-3xl` | 30px | Titres importants |
| `text-4xl` | 36px | Titres de page |
| `text-5xl` | 48px | Titres principaux |
| `text-6xl` | 60px | Titres héro |
| `text-7xl` | 72px | Grand hero |
| `hero` | 72px | Hero desktop |
| `hero-mobile` | 40px | Hero mobile |
| `data` | 24px | Données principales |
| `stat` | 28px | Statistiques |

### Poids de Police

| Token | Valeur | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Texte standard |
| `font-medium` | 500 | Émphase légère |
| `font-semibold` | 600 | Émphase |
| `font-bold` | 700 | Émphase forte |
| `font-extrabold` | 800 | Titres |
| `font-black` | 900 | Titres très importants |

### Letter Spacing

```css
--letter-spacing-tight: -0.02em;  /* Pour les grands titres */
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.02em;
```

### Line Heights

| Token | Valeur | Usage |
|-------|--------|-------|
| `leading-xs` | 16px | Petit texte |
| `leading-sm` | 20px | Texte standard |
| `leading-md` | 24px | Body text |
| `leading-lg` | 28px | Grand texte |
| `leading-xl` | 32px | Très grand texte |

---

## 📏 Espacement (8pt Grid System)

Tous les espacements sont basés sur un **système 8px** pour une cohérence parfaite.

### Base Units

| Token | Valeur | Multiplicateur |
|-------|--------|---------------|
| `spacing-0` | 0px | 0 × 8 |
| `spacing-1` | 4px | 0.5 × 8 |
| `spacing-2` | 8px | 1 × 8 |
| `spacing-3` | 12px | 1.5 × 8 |
| `spacing-4` | 16px | 2 × 8 |
| `spacing-5` | 20px | 2.5 × 8 |
| `spacing-6` | 24px | 3 × 8 |
| `spacing-7` | 28px | 3.5 × 8 |
| `spacing-8` | 32px | 4 × 8 |
| `spacing-9` | 36px | 4.5 × 8 |
| `spacing-10` | 40px | 5 × 8 |
| `spacing-11` | 44px | 5.5 × 8 |
| `spacing-12` | 48px | 6 × 8 |
| `spacing-14` | 56px | 7 × 8 |
| `spacing-16` | 64px | 8 × 8 |

### Named Aliases

| Token | Valeur | Usage |
|-------|--------|-------|
| `spacing-xs` | 4px | Micro-espacement |
| `spacing-sm` | 8px | Petit espacement |
| `spacing-md` | 16px | Espacement standard |
| `spacing-lg` | 24px | Grand espacement |
| `spacing-xl` | 32px | Très grand espacement |
| `spacing-2xl` | 48px | Espacement extra-large |

### Component-Specific

```typescript
// Card padding
card: {
  sm: '12px',  // Card compact
  md: '16px',  // Card standard
  lg: '24px',  // Card large
}

// Button padding
button: {
  sm: '8px 16px',   // Petit bouton
  md: '12px 24px',  // Bouton standard
  lg: '16px 32px',  // Grand bouton
}
```

---

## 🔺 Rayons (Border Radius)

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius-none` | 0px | Sans bordure arrondie |
| `radius-sm` | 6px | Bordure légèrement arrondie |
| `radius-md` | 8px | Bordure standard (boutons) |
| `radius-lg` | 12px | Bordure arrondie (cartes) |
| `radius-xl` | 16px | Bordure très arrondie |
| `radius-2xl` | 24px | Bordure extra-large |
| `radius-3xl` | 32px | Bordure énorme |
| `radius-full` | 9999px | Cercle / pilule |

### Component-Specific

| Composant | Rayon | Token |
|-----------|-------|-------|
| Button | 8px | `radius-button` |
| Card | 12px | `radius-card` |
| Input | 8px | `radius-input` |
| Badge | 9999px | `radius-badge` (pilule) |
| Avatar | 50% | `radius-avatar` (cercle) |

---

## 📐 Z-Index System

Système de couches pour gérer le superposition des éléments :

| Layer | Valeur | Usage |
|-------|--------|-------|
| `z-base` | 0 | Éléments de base |
| `z-raised` | 10 | Éléments légèrement élevés |
| `z-content` | 20 | Contenu principal |
| `z-fixed` | 20 | Éléments fixed |
| `z-sticky` | 30 | Éléments sticky (headers) |
| `z-dropdown` | 40 | Dropdowns, menus |
| `z-modal-backdrop` | 45 | Overlay des modales |
| `z-modal` | 50 | Modales |
| `z-drawer` | 50 | Drawers (tiroirs) |
| `z-toast` | 60 | Notifications toast |
| `z-tooltip` | 70 | Tooltips |
| `z-max` | 9999 | Maximum (urgent) |

---

## ⏳ Animations

### Keyframes Disponibles

| Nom | Description | Durée | Itération |
|-----|-------------|-------|----------|
| `fadeIn` | Fondu en entrée | 0.3s | 1× |
| `slideUp` | Glisse vers le haut | 0.3s | 1× |
| `slideDown` | Glisse vers le bas | 0.2s | 1× |
| `pulseSoft` | Pulsation douce | 2s | ∞ |
| `shimmer` | Effet shimmer (loading) | 2s | ∞ |
| `float` | Flottaison | 3s | ∞ |
| `gradientShift` | Déplacement de gradient | 8s | ∞ |
| `countUp` | Compteur animé | 0.5s | 1× |
| `spin` | Rotation continue | 1s | ∞ |
| `ping` | Effet ping | 1s | ∞ |
| `bounce` | Rebond | 1s | ∞ |

### Utilisation en CSS

```css
/* Animation simple */
.element {
  animation: fadeIn 0.3s ease-out;
}

/* Avec utility class */
<div className="animate-fade-in">...</div>
<div className="animate-slide-up">...</div>
<div className="animate-pulse-soft">...</div>
```

### Transitions

| Transition | Durée | Timing Function | Usage |
|------------|-------|-----------------|-------|
| `transition-fast` | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Boutons, hover |
| `transition-normal` | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Cartes, modales |
| `transition-slow` | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Drawers |
| `transition-spring` | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Animations spring |

---

## 🎨 Gradients Métiers

### Gradients Principaux

```css
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-success: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
--gradient-warning: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-dark: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-peak: linear-gradient(135deg, #FF9100 0%, #FF6D00 100%);
--gradient-recovery: linear-gradient(135deg, #4DD0E1 0%, #00BCD4 100%);
--gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
```

### Gradients PMC (Performance Management Chart)

```css
--gradient-pmc-fitness: linear-gradient(135deg, #0066FF 0%, #5856D6 100%);
--gradient-pmc-fatigue: linear-gradient(135deg, #FFAB00 0%, #FF6D00 100%);
--gradient-pmc-form: linear-gradient(135deg, #00BCD4 0%, #00C853 100%);
```

### Gradients de Zones

```css
/* Zones cardiaques (horizontal) */
--gradient-hr-zones: linear-gradient(90deg, 
  #00C853 0%, #00C853 20%,   /* Zone 1 */
  #8BC34A 20%, #8BC34A 40%, /* Zone 2 */
  #FFAB00 40%, #FFAB00 60%, /* Zone 3 */
  #FF6D00 60%, #FF6D00 80%, /* Zone 4 */
  #FF5252 80%, #FF5252 100% /* Zone 5 */
);

/* Zones cardiaques (vertical) */
--gradient-hr-zones-vertical: linear-gradient(to bottom, ...);

/* Zones de puissance */
--gradient-power-zones: linear-gradient(90deg, 
  #00BCD4 0%, #00BCD4 14.28%,   /* Zone 1 */
  #00C853 14.28%, #00C853 42.85%, /* Zone 2 */
  #8BC34A 42.85%, #8BC34A 57.14%, /* Zone 3 */
  #FFAB00 57.14%, #FFAB00 71.42%, /* Zone 4 */
  #FF6D00 71.42%, #FF6D00 85.71%, /* Zone 5 */
  #E91E63 85.71%, #E91E63 100%  /* Zone 6+7 */
);

/* Niveaux de readiness */
--gradient-readiness: linear-gradient(90deg, 
  #FF5252 0%, #FF5252 20%,   /* Très faible */
  #FF6D00 20%, #FF6D00 40%,   /* Faible */
  #FFAB00 40%, #FFAB00 60%,   /* Moyen */
  #00BCD4 60%, #00BCD4 80%,   /* Bon */
  #00C853 80%, #00C853 100%   /* Excellent */
);

/* État de forme PMC */
--gradient-form-state: linear-gradient(135deg, 
  #FF5252 0%,      /* Overtrained */
  #FF6D00 25%,     /* Fatigued */
  #FFAB00 50%,     /* Normal */
  #00BCD4 75%,     /* Fresh */
  #00C853 100%     /* Peak */
);
```

### Mesh Gradient (Arrière-plan)

```css
--gradient-mesh: radial-gradient(at 40% 20%, var(--primary-400) 0px, transparent 50%),
                  radial-gradient(at 80% 0%, var(--success-400) 0px, transparent 50%),
                  radial-gradient(at 0% 50%, var(--neutral-700) 0px, transparent 50%);
```

---

## 💡 Utilisation

### Importation

```typescript
// Importer depuis la source unique
import {
  colors,
  hrZones,
  powerZones,
  pmcStates,
  lightTokens,
  darkTokens,
  typography,
  spacing,
  radius,
  shadows,
  zIndex,
  transitions,
  animations,
  getHRZoneColor,
  getPowerZoneColor,
  getPMCFormColor,
  getReadinessColor,
  getFatigueColor,
} from '@/lib/designTokens';
```

### Utilisation en CSS

```css
/* Utilisation directe des variables CSS */
.my-component {
  background-color: var(--surface);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

/* Avec gradients métiers */
.pmc-chart {
  background: var(--gradient-pmc-fitness);
}

/* Couleurs des zones */
.hr-zone-1 { background-color: var(--hr-zone-1); }
.hr-zone-2 { background-color: var(--hr-zone-2); }
.hr-zone-3 { background-color: var(--hr-zone-3); }
.hr-zone-4 { background-color: var(--hr-zone-4); }
.hr-zone-5 { background-color: var(--hr-zone-5); }
```

### Utilisation en React (inline styles)

```tsx
// Utilisation avec des couleurs dynamiques
const ZoneIndicator = ({ zone }: { zone: number }) => {
  const zoneColor = getHRZoneColor(zone);
  
  return (
    <div style={{ 
      backgroundColor: `color-mix(in srgb, ${zoneColor}, transparent 80%)`,
      color: zoneColor 
    }}>
      Zone {zone}
    </div>
  );
};

// Avec classes Tailwind
const PMCStatus = ({ tsb }: { tsb: number }) => {
  const formColor = getPMCFormColor(tsb);
  
  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium`} 
         style={{ backgroundColor: `color-mix(in srgb, ${formColor}, transparent 90%)` }}>
      {tsb > 20 ? 'Pic de forme' : tsb > 10 ? 'Bonne forme' : 'Normal'}
    </div>
  );
};
```

### Utilisation avec Recharts

```tsx
import { LineChart, Line, AreaChart, Area } from 'recharts';

// Exemple avec zones HR
<AreaChart data={data}>
  <defs>
    <linearGradient id="hrZones" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--hr-zone-1)" stopOpacity={0.3} />
      <stop offset="20%" stopColor="var(--hr-zone-2)" stopOpacity={0.3} />
      <stop offset="40%" stopColor="var(--hr-zone-3)" stopOpacity={0.3} />
      <stop offset="60%" stopColor="var(--hr-zone-4)" stopOpacity={0.3} />
      <stop offset="80%" stopColor="var(--hr-zone-5)" stopOpacity={0.3} />
      <stop offset="100%" stopColor="var(--hr-zone-5)" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area
    type="monotone"
    dataKey="value"
    stroke="var(--primary)"
    fill="url(#hrZones)"
  />
</AreaChart>
```

---

## 🔄 Génération Automatique

### Script de Génération

Le script `scripts/generate-design-tokens.js` permet de **synchroniser automatiquement** tous les fichiers de design system :

```bash
# Générer tous les fichiers
npm run generate:design-tokens

# Ou exécuter directement avec Node
node scripts/generate-design-tokens.js
```

### Ce que le script génère

1. **`app/globals.css`** - Toutes les variables CSS pour light/dark mode
2. **`tailwind.config.js`** - Configuration Tailwind synchronisée avec les tokens

### Quand exécuter le script ?

- ✅ Après avoir modifié `designTokens.ts`
- ✅ Après avoir ajouté de nouvelles couleurs
- ✅ Après avoir modifié les tokens sémantiques
- ❌ **NE PAS** modifier manuellement `globals.css` ou `tailwind.config.js`

---

## ✅ Bonnes Pratiques

### ✔️ À FAIRE

1. **Toujours utiliser les tokens**
   ```css
   /* ❌ Mauvaise pratique */
   background-color: #0066FF;
   color: #FFFFFF;
   
   /* ✅ Bonne pratique */
   background-color: var(--primary);
   color: var(--primary-foreground);
   ```

2. **Utiliser les fonctions utilitaires pour les couleurs dynamiques**
   ```typescript
   // ❌ Mauvaise pratique
   if (zone === 1) color = '#00C853';
   if (zone === 2) color = '#8BC34A';
   
   // ✅ Bonne pratique
   color = getHRZoneColor(zone);
   ```

3. **Privilégier les variables CSS dans les styles**
   ```tsx
   // ❌ Mauvaise pratique
   <div style={{ backgroundColor: '#0066FF' }}>
   
   // ✅ Bonne pratique
   <div className="bg-primary">
   // ou
   <div style={{ backgroundColor: 'var(--primary)' }}>
   ```

4. **Utiliser `color-mix()` pour les transparences**
   ```css
   /* ❌ Mauvaise pratique */
   background-color: rgba(0, 102, 255, 0.1);
   
   /* ✅ Bonne pratique */
   background-color: color-mix(in srgb, var(--primary), transparent 90%);
   ```

5. **Toujours exécuter le script après modification de designTokens.ts**

### ❌ À ÉVITER

1. **Dupliquer les couleurs**
   ```css
   /* ❌ À éviter - Duplication */
   --my-blue: #0066FF;
   --app-primary: #0066FF;
   ```

2. **Utiliser des couleurs en dur (hex, rgba)**
   ```tsx
   /* ❌ À éviter */
   <div style={{ color: '#FF5252' }}>
   <div className="bg-[#FF5252]">
   ```

3. **Créer des gradients personnalisés sans utiliser les tokens**
   ```css
   /* ❌ À éviter */
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   
   /* ✅ Utiliser les gradients définis */
   background: var(--gradient-primary);
   ```

4. **Modifier manuellement globals.css ou tailwind.config.js**

---

## 📚 Exemples d'Utilisation

### Exemple 1: Carte PMC avec états de forme

```tsx
import { pmcStates, getPMCFormColor } from '@/lib/designTokens';

const PMCCard = ({ fitness, fatigue, form }: { fitness: number; fatigue: number; form: number }) => {
  const formColor = getPMCFormColor(form);
  const formState = form > 20 ? pmcStates.peak : 
                   form > 10 ? pmcStates.fresh : 
                   form > -10 ? pmcStates.normal : 
                   form > -20 ? pmcStates.fatigued : 
                   pmcStates.overtrained;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formColor }} />
        <h3 className="text-lg font-bold">Performance Management Chart</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Fitness (CTL)"
          value={fitness}
          color="var(--primary)"
          trend={fitness > 50 ? 'up' : 'down'}
        />
        <MetricCard
          label="Fatigue (ATL)"
          value={fatigue}
          color="var(--danger)"
          trend={fatigue > 30 ? 'up' : 'down'}
        />
        <MetricCard
          label="Forme (TSB)"
          value={form}
          color={formColor}
          trend={form > 0 ? 'up' : 'down'}
        />
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <span>État :</span>
        <span className="font-semibold" style={{ color: formColor }}>
          {formState.name}
        </span>
        <span className="text-muted">{formState.description}</span>
      </div>
    </Card>
  );
};
```

### Exemple 2: Graphique avec zones HR

```tsx
import { hrZones, getHRZoneColor } from '@/lib/designTokens';

const HRZoneChart = ({ data }: { data: { time: number; hr: number; zone: number }[] }) => {
  return (
    <AreaChart data={data}>
      <defs>
        {/* Gradient basé sur les zones HR */}
        <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
          {Array.from({ length: 5 }, (_, i) => (
            <stop 
              key={i} 
              offset={`${i * 20}%`} 
              stopColor={getHRZoneColor(i + 1)} 
              stopOpacity={0.3} 
            />
          ))}
          <stop offset="100%" stopColor="transparent" stopOpacity={0} />
        </linearGradient>
      </defs>
      
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="time" stroke="var(--muted)" />
      <YAxis stroke="var(--muted)" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)'
        }}
      />
      
      <Area
        type="monotone"
        dataKey="hr"
        stroke="var(--primary)"
        strokeWidth={2}
        fill="url(#hrGradient)"
      />
    </AreaChart>
  );
};
```

### Exemple 3: Badge de zone de puissance

```tsx
import { powerZones, getPowerZoneColor } from '@/lib/designTokens';

const PowerZoneBadge = ({ zone, value }: { zone: number; value: number }) => {
  const color = getPowerZoneColor(zone);
  const zoneInfo = powerZones[`zone${zone}` as keyof typeof powerZones];
  
  return (
    <div 
      className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
      style={{ 
        backgroundColor: `color-mix(in srgb, ${color}, transparent 85%)`,
        color: zoneInfo.foreground 
      }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span>Zone {zone}</span>
      <span className="text-muted">{zoneInfo.name}</span>
      <span className="font-bold">{value}W</span>
    </div>
  );
};
```

### Exemple 4: Indicateurs de readiness

```tsx
import { readinessLevels, getReadinessColor } from '@/lib/designTokens';

const ReadinessIndicator = ({ score }: { score: number }) => {
  const color = getReadinessColor(score);
  const level = score >= 90 ? readinessLevels.excellent :
               score >= 70 ? readinessLevels.good :
               score >= 50 ? readinessLevels.fair :
               score >= 30 ? readinessLevels.poor :
               readinessLevels.veryPoor;
  
  return (
    <div className="flex items-center gap-3 p-4 bg-surface rounded-2xl">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
           style={{ backgroundColor: `color-mix(in srgb, ${color}, transparent 80%)` }}>
        <TrendingUp className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-muted text-sm">Readiness Score</p>
        <p className="text-2xl font-bold">{score}/100</p>
        <p className="text-sm" style={{ color }}>{level.description}</p>
      </div>
    </div>
  );
};
```

---

## 🎓 Ressources Additionnelles

- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Système 8pt Grid](https://spec.fm/specifics/8-pt-grid)
- [PMC - Performance Management Chart](https://www.trainingpeaks.com/blog/power-training-levels/)
- [Zones Cardiaques](https://www.polar.com/en/heart-rate-zones)
- [Zones de Puissance Cyclisme](https://www.trainingpeaks.com/blog/power-training-levels/)

---

## 📝 Historique des Changements

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-01 | Création initiale du design system |
| 1.1.0 | 2025-01 | Ajout des tokens métiers (HR zones, power zones, PMC) |
| 1.2.0 | 2025-01 | Intégration complète avec Recharts |
| 1.3.0 | 2025-01 | Script de génération automatique |
| 1.4.0 | 2025-01 | Documentation complète |

---

## 🤝 Contribution

Pour contribuer au design system :

1. **Proposer une nouvelle couleur** : Ajouter à `designTokens.ts` puis exécuter `npm run generate:design-tokens`
2. **Corriger un bug** : Vérifier la cohérence avec la source unique
3. **Ajouter un token métier** : Documenter dans ce fichier et dans `designTokens.ts`

---

> **❤️ DrawRun - L'intelligence sportive à portée de main**
>
> *Conçu avec passion pour les athlètes exigeants*
