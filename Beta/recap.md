# Récapitulatif : Système de Planification VDOT Elite (V6.4)

Ce document résume le fonctionnement de la génération de plans d'entraînement dans le dossier Beta, basée sur le moteur Jack Daniels.

## 1. Moteur VDOT (Jack Daniels)
Le système utilise les formules physiologiques de Jack Daniels pour estimer la performance :
- **VO2 Cost** : Calculé à partir de la vitesse moyenne sur une distance de référence.
- **Drop-off Factor** : Ajuste l'intensité en fonction de la durée de l'effort pour obtenir le VDOT (Index de performance).
- **Zones d'entraînement** :
    - **E (Easy)** : Endurance fondamentale (70% VO2max).
    - **M (Marathon)** : Allure cible marathon (80% VO2max).
    - **T (Threshold)** : Seuil anaérobie (88% VO2max).
    - **I (Interval)** : Puissance aérobie max / VMA (98% VO2max).
    - **R (Repetition)** : Vitesse et économie de course (110% VO2max).

## 2. Périodisation Dynamique (3:1 Step-Loading)
Le plan est structuré en blocs de 4 semaines pour optimiser l'assimilation :
- **Semaines 1-3** : Augmentation progressive de la charge ou maintien de l'intensité.
- **Semaine 4 (Décharge)** : Réduction du volume (environ -20%) pour permettre la surcompensation.
- **Phases** : Le plan évolue de la vitesse (Phase 1-2) vers la puissance et le seuil spécifique (Phase 3-4).

## 3. Dynamique et Personnalisation
Les données de vos activités réelles sont utilisées pour calibrer le plan :
- **Volume Peak** : Le volume hebdomadaire maximum est calculé automatiquement à partir de vos 4 dernières semaines d'activités synchronisées.
- **Dates** : Le plan s'aligne automatiquement sur la date actuelle pour une continuité parfaite.
- **Méthode Duale** : Support complet des allures (Pace) ou des fréquences cardiaques (HR) selon vos préférences.

## 4. Optimisations Techniques
- **Journal d'Activités** : Refonte technique utilisant `LazyColumn` pour une fluidité parfaite, même avec des centaines d'activités.
- **Import de Données** : Amélioration du lien entre le Journal et les écrans d'analyse pour garantir que les calculs d'efficacité (EF) et de découplage sont toujours basés sur les dernières données Strava/Health Connect.
