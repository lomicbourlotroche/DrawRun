# RECAPITULATIF PROJET : SUUNTO REPLICA

**Date :** 22 Janvier 2026
**Objectif :** Intégrer un planificateur d'itinéraire identique à [Suunto Route Planner](https://routeplanner.suunto.com) dans l'application.

---

## 📋 Liste des Fonctionnalités à Développer

### 1. La Carte (Le Fondamentale)
*   [ ] **Style Satellite** : Reproduction du rendu satellite haute résolution.
*   [ ] **Positionnement** : Centrage automatique sur les coordonnées (Brest - 48.382728, -4.474713).
*   [ ] **Fluidité** : Zoom et pan sans accroc (Zoom initial ~14).

### 2. Les Heatmaps (La "Trail-Running Touch")
*   [ ] **Calque d'intensité** : Visualiser les chemins fréquentés par les trail-runners.
*   [ ] **Superposition** : Gérer la transparence pour voir le satellite ET la chaleur.

### 3. L'Outil de Tracé (Le Moteur)
*   [ ] **Création de Route** : Cliquer pour ajouter des points.
*   [ ] **Suivi intelligent (Snap-to-road)** : Le tracé doit coller aux sentiers, pas faire des lignes droites (sauf si demandé).
*   [ ] **Données en direct** : Affichage de la distance et du dénivelé cumulé au fur et à mesure du tracé.

### 4. Interface & Design
*   [ ] **UI Premium** : Contrôles minimalistes, esthétique "Suunto" (sombre/technique).
*   [ ] **UX** : Expérience utilisateur fluide pour une "perfection" ressentie.

---

## 🛠 Plan d'Action pour Demain

1.  **Setup Technique** : Initialiser la vue carte (Mapbox est recommandé pour ce niveau de customisation).
2.  **Rendu Satellite** : Configurer le style de base.
3.  **Logique de Tracé** : Implémenter le clic-to-route basique.
