# 🧪 **COMPTE RENDU COMPLET : SCIENCE ENGINE**

*DrawRun Scientific Algorithms v2.0 - Analyse Complète*

---

## **📌 INFORMATIONS GÉNÉRALES**

| Propriété | Valeur |
|-----------|--------|
| **Dossier** | `backend/src/algorithms/` |
| **Nombre de modules** | 21 fichiers |
| **Lignes totales** | ~3,500+ |
| **Version** | 2.0 |
| **Architecte** | Système modulaire avec barillet (index.js) |
| **Date analyse** | 2026-06-02 |

---

## **📚 SOMMAIRE**

1. [🏗️ Architecture Générale](#-architecture-générale)
2. [📊 Modules Principaux](#-modules-principaux)
3. [🔬 Analyse par Module](#-analyse-par-module)
4. [🔗 Dépendances et Intégrations](#-dépendances-et-intégrations)
5. [✅ Points Forts](#-points-forts)
6. [⚠️ Problèmes et Risques](#-problèmes-et-risques)
7. [💡 Recommandations](#-recommandations)
8. [📊 Métriques de Qualité](#-métriques-de-qualité)
9. [🎯 Conclusion](#-conclusion)

---

## **🏗️ ARCHITECTURE GÉNÉRALE**

```
backend/src/algorithms/
├── index.js                          # Barillet - Export centralisé (21 modules)
│
├── 📐 CONSTANTES & UTILITAIRES
│   ├── scientific_constants.js      # Toutes les constantes scientifiques (167 lignes)
│   └── math_utils.js                # Fonctions mathématiques (79 lignes)
│
├── 🫀 CARDIovasculaire & Performance
│   ├── cardiovascular.js            # FCM, Zones HR, Power Zones (293 lignes)
│   ├── running_performance.js       # VDOT, Prédictions, GAP (475 lignes)
│   └── running_power.js             # Puissance, FTP, IF (139 lignes)
│
├── 📈 CHARGE & FATIGUE
│   ├── training_load.js             # TSS, TRIMP, VI, Normalized Power (177 lignes)
│   ├── pmc.js                       # PMC, ACWR, Readiness (310 lignes)
│   └── polarization.js              # Distribution intensité (137 lignes)
│
├── ⚡ RÉCUPÉRATION & SURENTRAÎNEMENT
│   ├── hrv.js                       # HRV, Recovery, Stress Score (156 lignes)
│   └── overtraining.js              # Détection OTS, Injury Risk (227 lignes)
│
├── 🎯 PLANIFICATION & RECOMMANDATIONS
│   ├── recommendations.js           # Génération recommandations (396 lignes)
│   ├── taper.js                     # Affûtage (116 lignes)
│   └── race_strategy.js             # Stratégie de course (132 lignes)
│
├── 🏃 ANALYSE SPORTIVE
│   └── sport_analysis.js            # Analyse par sport (1443 lignes - le plus grand)
│
└── 🌍 ENVIRONNEMENT & SPÉCIALISÉ
    ├── critical_power.js            # Modèle CP/W' (148 lignes)
    ├── sleep_optimization.js        # Sommeil optimal (120 lignes)
    ├── altitude_training.js         # Entraînement altitude (129 lignes)
    ├── nutrition.js                 # Nutrition (61 lignes)
    ├── biomechanics.js              # Biomécanique (152 lignes)
    └── environmental_impact.js      # Impact environnemental (35 lignes)
```

---

## **📊 MODULES PRINCIPAUX**

### **Tableau Synthétique**

| Module | Lignes | Fonctions | Références Scientifiques | Utilisation |
|--------|--------|-----------|--------------------------|-------------|
| **scientific_constants** | 167 | 0 (constantes) | Banister, Seiler, Gabbett, Daniels | Partout |
| **math_utils** | 79 | 12 | - | Partout |
| **cardiovascular** | 293 | 10 | Tanaka 2001, Karvonen 1957, Coggan | Zones, FCM |
| **running_performance** | 475 | 20 | Daniels 2021, Minetti 2002, Riegel 1981 | VDOT, prédictions |
| **training_load** | 177 | 9 | Coggan 2003, Edwards 1993, Banister | TSS, TRIMP |
| **pmc** | 310 | 15 | Banister 1975, Busso 2003, Gabbett 2016 | CTL/ATL/TSB |
| **polarization** | 137 | 6 | Seiler 2006 | Distribution intensité |
| **hrv** | 156 | 5 | Esco 2014, Plews 2013, Buchheit 2014 | Récupération |
| **overtraining** | 227 | 4 | Meeusen 2013, Gabbett 2016, Kellmann 2018 | Détection OTS |
| **recommendations** | 396 | 3 | Seiler, Foster, Mujika | Conseils entraînement |
| **taper** | 116 | 5 | Mujika & Padilla 2003 | Affûtage |
| **race_strategy** | 132 | 2 | Minetti, Riegel, Coggan | Stratégie course |
| **sport_analysis** | 1443 | 25+ | Coggan, Daniels, Minetti | Analyse activités |
| **critical_power** | 148 | 10 | Poole 2016, Morton 1996, Skiba 2013 | CP/W' |
| **sleep_optimization** | 120 | 6 | NSF Guidelines | Optimisation sommeil |
| **altitude_training** | 129 | 6 | Bassett & Howley | Entraînement altitude |
| **nutrition** | 61 | 4 | Jeukendrup | Nutrition |
| **biomechanics** | 152 | 10 | Dalleau 2004, Morin 2005 | Biomécanique |
| **environmental_impact** | 35 | 3 | Ely 2007 | Impact environnement |

---

## **🔬 ANALYSE PAR MODULE**

---

### **1. 📐 CONSTANTES & UTILITAIRES**

#### **scientific_constants.js** (167 lignes)

**Rôle** : Définir toutes les constantes scientifiques utilisées par les algorithmes.

**Constantes par Catégorie** :

```javascript
// PMC (Banister 1975, Hellard 2006)
TAU_FITNESS_DEFAULT: 42    // jours
TAU_FATIGUE_DEFAULT: 7     // jours
ALPHA_FITNESS: 1 - Math.exp(-1/42)  // ~2.3% perte/jour
ALPHA_FATIGUE: 1 - Math.exp(-1/7)   // ~13.3% perte/jour

// ACWR (Gabbett 2016)
UNDER_REACHING: 0.8
OPTIMAL: 0.8-1.3
RISKY: 1.3-1.5
DANGER: >1.5
SPIKE_DANGER: >2.0

// Polarisation (Seiler 2006)
TARGET_LOW: 80%       // Zone 1-2
TARGET_MODERATE: 0%   // Zone 3 (à éviter)
TARGET_HIGH: 20%      // Zone 4-5

// TRIMP (Edwards 1993)
Zones 1-5 avec coefficients 1-5
SEX_FACTOR_MALE: 1.0
SEX_FACTOR_FEMALE: 1.3

// VDOT (Jack Daniels 2021)
VO2_COST: 0.182258*v + 0.000104*v² - 4.60
Zones: E(0.59-0.74), M(0.84), T(0.88), I(0.98), R(1.15)

// FCM Formules
TANAKA: 208 - 0.7*age
GELLISH: 207.08 - 0.007165*age²

// Critical Power (Poole 2016)
W_PRIME_RECONSTITUTION_RATE: 5.4 kJ/min

// Minetti (2002) - GAP
Coefficients polynomiaux pour coût métabolique en pente

// Environnement
TEMP_OPTIMAL: 8-15°C
HEAT_DEGRADATION_START: 20°C
ALTITUDE_DEGRADATION_START: 700m
```

✅ **Points forts** :
- **Complet** : Toutes les constantes scientifiques centralisées
- **Documenté** : Références claires pour chaque constante
- **Validé** : Basé sur des études scientifiques reconnues
- **Organisé** : Groupé par domaine (PMC, ACWR, VDOT, etc.)

⚠️ **Problèmes** :
- **Pas de validation** : Certaines constantes pourraient être ajustées pour des populations spécifiques
- **Figé** : Pas de mécanisme pour mettre à jour les constantes dynamiquement

💡 **Recommandations** :
- Ajouter un système de configuration pour permettre des ajustements
- Créer des tests unitaires pour valider les formules

---

#### **math_utils.js** (79 lignes)

**Rôle** : Fonctions mathématiques utilitaires utilisées par tous les modules.

**Fonctions** :

| Fonction | Description | Utilisation |
|----------|-------------|-------------|
| `clamp(val, min, max)` | Limite une valeur entre min et max | Partout |
| `mean(arr)` | Moyenne d'un tableau | PMC, HRV, etc. |
| `stdDev(arr)` | Écart-type | HRV, Polarization |
| `expMovingAvg(current, newVal, alpha)` | Moyenne mobile exponentielle | PMC |
| `parseDuration(duration)` | Parse une durée (string → secondes) | SportAnalysis |
| `formatDuration(seconds)` | Formate une durée (secondes → HH:MM:SS) | Affichage |
| `formatPace(secondsPerKm)` | Formate un pace (sec/km → MM:SS) | Affichage |
| `parsePace(paceStr)` | Parse un pace (MM:SS → secondes) | Input |
| `percentChange(oldVal, newVal)` | Calcul % de changement | Analytics |
| `movingAverage(arr, window)` | Moyenne mobile | Analyse données |
| `percentile(arr, p)` | Percentile | Statistiques |

✅ **Points forts** :
- **Modulaire** : Chaque fonction est autonome
- **Réutilisable** : Utilisé par tous les autres modules
- **Simple** : Code clair et compréhensible

⚠️ **Problèmes** :
- **Pas de typage** : JavaScript pur, pas de TypeScript
- **Pas de tests unitaires** : Difficile de vérifier la précision

💡 **Recommandations** :
- Ajouter des tests unitaires pour chaque fonction
- Documenter les formules mathématiques utilisées

---

### **2. 🫀 CARDIOVASCULAIRE & PERFORMANCE**

---

#### **cardiovascular.js** (293 lignes)

**Rôle** : Calcul de la FCM, zones cardiaques, zones de puissance.

**Fonctions principales** :

```javascript
// 1. Calcul FCM
calculateMaxHR(age)                     // Tanaka 2001: 208 - 0.7*age
estimateMaxHR(age, sex)                // Multi-formules (Tanaka, Gellish, Inbar, etc.)
estimateDynamicFCM(activities, estimatedFCM) // FCM depuis données réelles

// 2. Zones cardiaques
calculateKarvonenZones(age, restingHR, sex)  // 7 zones HRR
calculatePercentZones(fcm)              // 5 zones %FCM

// 3. Seuils ventilatoires
estimateVentilatoryThresholds(fcm, restingHR, vma) // VT1, VT2

// 4. Zones de puissance (Coggan)
calculatePowerZones(ftp)                // 7 zones basées sur FTP
```

✅ **Points forts** :
- **Multi-formules** : Plusieurs formules pour FCM avec recommandation
- **Zones complètes** : 7 zones cardiaques et 7 zones de puissance
- **Personnalisable** : Prend en compte âge, sexe, restingHR, vma
- **Scientifique** : Basé sur Karvonen, Tanaka, Coggan

⚠️ **Problèmes** :
- **Pas de validation croisée** : Pas de vérification que FCM calculée ≠ FCM réelle
- **Estimation VT1/VT2 simplifiée** : 75% et 90% FCM, devrait être personnalisé

💡 **Recommandations** :
- Ajouter une fonction de validation FCM (comparer plusieurs formules)
- Intégrer des tests de terrain pour estimer VT1/VT2

---

#### **running_performance.js** (475 lignes)

**Rôle** : Calcul VDOT, prédictions de performance, allures d'entraînement.

**Fonctions principales** :

```javascript
// 1. Calcul VDOT (Jack Daniels)
calculateVDOT(distanceMeters, timeMinutes)    // Formule: VDOT = VO2cost / %VO2max
calculateDynamicVDOT(performances, daysHalfLife) // VDOT pondéré temporellement

// 2. VMA & VO2max
estimateVMA(vo2max)                          // VMA = (VO2max - 2.209) / 3.5
estimateVO2max(vma)                          // Inverse

// 3. Allures
getPaceSeconds(vdot, intensityPercent)        // Allure en sec/km pour un %VO2max
calculateSpeedZones(vma)                    // 7 zones de vitesse
getTrainingPaces(vdot)                      // Allures E, M, T, I, R

// 4. Prédictions
getRiegelExponent(distanceKm)                // Exposant adaptatif
predictRaceTime(knownDistance, knownTime, targetDistance) // Riegel simple
predictRaceTimeMultiModel(...)              // Multi-modèles (Riegel, Mercier, Cameron)
predictMarathon(vdot)                       // Prédiction marathon
predictHalfMarathon(vdot)                  // Prédiction semi
predictRaceTimes(vdot)                      // Toutes distances

// 5. Corrections environnementales
applyEnvironmentalCorrection(baseTime, conditions) // Température, humidité, altitude, vent

// 6. Économie de course
calculateRunningEconomy(vo2, speed)          // ml/kg/min / km/h

// 7. Performance Level (World Athletics)
getPerformanceLevel(metric, value)           // MONDIAL, ELITE, NATIONAL...
calculateIAAAScore(event, performance)        // Points IAAF
```

✅ **Points forts** :
- **VDOT complet** : Implémentation fidèle du modèle Jack Daniels
- **Prédictions multi-modèles** : Riegel, Mercier, Cameron
- **Corrections environnementales** : Température, humidité, altitude, vent
- **Performance level** : Intégration avec les standards World Athletics

⚠️ **Problèmes** :
- **Précision des prédictions** : Les modèles sont simplifiés
- **Pas de validation croisée** : Une prédiction pourrait être comparée avec d'autres
- **Environnement basé sur des estimations** : Pas de données météo en temps réel

💡 **Recommandations** :
- Ajouter un système de confiance pour les prédictions
- Intégrer des données météo réelles
- Comparer avec d'autres modèles (ex: Strava, Garmin)

---

#### **running_power.js** (139 lignes)

**Rôle** : Estimation de la puissance de course (sans capteur de puissance).

**Fonctions principales** :

```javascript
// 1. Estimation depuis pace
estimateFromPace(paceSecPerKm, grade, weight)  // Modèle Minetti + coût horizontal/vertical

// 2. Estimation depuis FC
estimateFromHR(heartRate, maxHR, paceSecPerKm, weight) // Correction basée sur %FCM

// 3. Zones de puissance
calculatePowerZones(ftp)                // 7 zones (Coggan adapté pour course)

// 4. FTP
estimateFTPFromRace(raceDistance, raceTime, weight) // FTP ≈ 95% de la puissance 1h

// 5. Normalized Power
calculateNormalizedPower(powerSamples, sampleInterval) // NP = (mean(x^4))^(1/4)
calculateIntensityFactor(np, ftp)   // IF = NP/FTP
calculatePowerTSS(duration, np, ftp)   // TSS = (duration * IF² * 100) / 3600

// 6. W' Balance
calculateWBalance(currentPower, CP, W_prime, previousWBalance, timeSinceLastAboveCP)
timeToExhaustion(power, CP, W_prime)

// 7. Estimation CP depuis VDOT
estimateCPFromVDOT(vdot)  // CP_running ≈ VDOT * 0.08 W/kg
```

✅ **Points forts** :
- **Modèle physique complet** : Horizontal + Vertical + Form power
- **Normalized Power** : Implémentation fidèle du modèle Coggan
- **W' Balance** : Modèle de fatigue anaérobie
- **Estimation sans capteur** : Permet d'estimer la puissance sans powermeter

⚠️ **Problèmes** :
- **Précision limitée** : Estimation depuis pace a une marge d'erreur
- **Pas de validation** : Difficile de valider sans données réelles de puissance
- **Form power estimée** : 20% du métabolique, pourrait être personnalisé

💡 **Recommandations** :
- Valider avec des données réelles de powermeters (Stryd, RunScribe)
- Ajouter des coefficients de calibration personnalisables

---

### **3. 📈 CHARGE & FATIGUE**

---

#### **training_load.js** (177 lignes)

**Rôle** : Calcul de la charge d'entraînement (TSS, TRIMP).

**Fonctions principales** :

```javascript
// TRIMP
calculateTRIMP(hrZonesMinutes, sex)           // Edwards 1993
calculateTRIMPBanister(...)                   // Modèle exponentiel
calculateTRIMPLucia(...)                      // Zones VT1/VT2
calculateTRIMPFromAvgHR(...)                 // Simplifié
calculateSRPETSS(rpe, durationMinutes)         // sRPE = RPE × duration / 10

// TSS
calculateTSS(durationSeconds, intensityFactor)  // TSS = duration_hours × IF² × 100
calculateSportTSS(duration, IF, sportType)    // Avec coefficients par sport
estimateIFFromHR(avgHRPercent)               // IF ≈ (%FCmax - 30%) / 50%

// Normalized Power
calculateNormalizedValue(values)             // NP = (mean(x^4))^(1/4)
calculateVariabilityIndex(np, ap)            // VI = NP/AP
```

✅ **Points forts** :
- **Multi-modèles TRIMP** : Edwards, Banister, Lucia
- **TSS par sport** : Coefficients spécifiques pour chaque type de sport
- **Normalized Power** : Implémentation complète
- **Variability Index** : Mesure de la régularité de l'effort

⚠️ **Problèmes** :
- **Pas de standard unique** : Plusieurs méthodes TRIMP peuvent donner des résultats différents
- **Coefficients par sport arbitraires** : Pas de validation scientifique pour tous les sports

💡 **Recommandations** :
- Choisir une méthode standard pour TRIMP
- Valider les coefficients par sport avec des données réelles

---

#### **pmc.js** (310 lignes)

**Rôle** : Performance Management Chart (CTL, ATL, TSB, ACWR).

**Fonctions principales** :

```javascript
// PMC Standard (Banister 1975)
calculate(activities, tauFitness, tauFatigue, options) // CTL = EMA(tss, α_fitness), ATL = EMA(tss, α_fatigue)

// PMC 3-composantes (Calvert 1976)
calculate3Component(activities, tauFitness, tauFatigue, tauStability)

// Tau personnalisés
getPersonalizedTau(profile)   // beginner: τ=35/5, elite: τ=55/10

// ACWR
calculateACWR(weeklyLoad, chronicLoad)         // Simple ratio
calculateACWR_EWMA(dailyLoads, tauAcute, tauChronic) // Exponentially weighted
getACWRStatus(acwr)                           // underreaching, optimal, risky, danger

// Monotonie & Strain
calculateMonotony(dailyLoads)                 // mean / stdDev
calculateStrain(ctl, monotony)                // strain = ctl × monotony
getStrainStatus(strain)                       // low, moderate, high, danger

// Prédiction
predictPerformance(ctl, atl, baseline)       // Modèle Busso 2003

// Readiness
estimateReadiness(pmcData, hrvRmssd, sleepHours) // Combinaison PMC + HRV + Sleep
```

✅ **Points forts** :
- **Modèle PMC complet** : Implémentation fidèle de Banister
- **PMC 3-composantes** : Modèle Calvert plus précis
- **Tau personnalisés** : Adaptation selon niveau de l'athlète
- **ACWR EWMA** : Méthode plus précise que le ratio simple
- **Readiness multi-facteurs** : PMC + HRV + Sommeil

⚠️ **Problèmes** :
- **ACWR controversé** : Le modèle ACWR est critiqué par la littérature récente
- **Tau fixes par défaut** : 42/7 jours, pourrait être optimisé par athlète
- **Pas d'historique long** : Limité à 365 jours dans metricsCalculator

💡 **Recommandations** :
- Ajouter d'autres modèles de charge (ex: TRIMP-based)
- Optimiser tau automatiquement depuis les données de l'athlète
- Stocker un historique plus long pour les athlètes expérimentés

---

#### **polarization.js** (137 lignes)

**Rôle** : Analyse de la distribution d'intensité d'entraînement.

**Fonctions principales** :

```javascript
// Calcul de l'indice
calculatePolarizationIndex(activitiesWithZones) // PI = (%high + %low) - %moderate

// Classification
classifyDistribution(low%, moderate%, high%) // polarized, pyramidal, moderate-heavy, high-heavy, mixed

// Recommandations
getOptimalDistribution(level, goal)    // beginner: 85/10/5, elite: 78/2/20
getRecommendation(polarizationIndex)   // optimal, good, moderate, poor

// Junk Miles
calculateJunkMiles(activitiesWithZones) // Temps en zone 3 (poubelle)
```

✅ **Points forts** :
- **Modèle Seiler 80/20** : Implémentation fidèle de la polarisation
- **Classification claire** : Identification des patterns d'entraînement
- **Junk Miles** : Détection du temps inefficace en zone 3
- **Recommandations personnalisées** : Selon niveau et objectif

⚠️ **Problèmes** :
- **Zone 3 mal définie** : 70-85% FCM, mais devrait être VT1-VT2
- **Pas d'adaptation dynamique** : Les seuils pourraient être ajustés par athlète

💡 **Recommandations** :
- Utiliser VT1/VT2 réels si disponibles au lieu de %FCM
- Ajouter un calcul de l'indice de polarisation en temps réel

---

### **4. ⚡ RÉCUPÉRATION & SURENTRAÎNEMENT**

---

#### **hrv.js** (156 lignes)

**Rôle** : Analyse de la Variabilité du Ryhtme Cardiaque pour la récupération.

**Fonctions principales** :

```javascript
// Analyse de récupération
analyzeRecovery(rmssd, baselineRmssd, restingHR) // Score 0-100 avec interprétation

// Baseline dynamique
calculateDynamicBaseline(hrvHistory, days) // Baseline + trend + zones (28 jours)

// Coefficient de variation
calculateCV(hrvHistory, window) // CV = stdDev/mean * 100

// Stress Score
calculateStressScore(currentRmssd, optimalRmssd) // Score 0-100
```

✅ **Points forts** :
- **Modèle sigmoïde** : Score non-linéaire pour une meilleure sensibilité
- **Baseline dynamique** : 28 jours rolling avec détection de tendance
- **Zones d'interprétation** : excellent, normal, low, alarm
- **CV (Coefficient de Variation)** : Indicateur de stress/fatigue

⚠️ **Problèmes** :
- **Baseline fixe à 28 jours** : Peut être trop long pour certains athlètes
- **Pas de validation** : Difficile de valider sans données réelles HRV
- **rMSSD seulement** : Ne prend pas en compte d'autres métriques HRV

💡 **Recommandations** :
- Ajouter des paramètres configurables (fenêtre baseline, seuils)
- Intégrer d'autres métriques HRV (SDNN, pNN50, LF/HF)
- Valider avec des données réelles de wearables (Oura, Whoop, Garmin)

---

#### **overtraining.js** (227 lignes)

**Rôle** : Détection du syndrome de surentraînement (OTS).

**Fonctions principales** :

```javascript
// Détection OTS (multi-facteurs)
detectOTS(indicators) // 5 niveaux: OPTIMAL → ACCEPTABLE → FUNCTIONAL → NON-FUNCTIONAL → OTS_PROBABLE

// Score de risque de blessure
calculateInjuryRisk(acwr, chronicLoad, monotony, strain, hrvRatio, consecutiveDays)
```

**Indicateurs OTS** :

| Indicateur | Poids | Seuils | Impact |
|------------|-------|--------|--------|
| Performance decline | 30 | -15% (sévère), -8% (modéré) | Critique |
| HRV suppression | 25 | <65% (sévère), <80% (modéré) | Critique |
| Sleep quality | 20 | <40 (très bas), <60 (bas) | Élevé |
| Resting HR change | 15 | >12bpm (sévère), >7bpm (modéré) | Élevé |
| ACWR | 15 | >1.8 (critique), >1.5 (élevé) | Élevé |
| TSB | 10 | <-35 (sévère), <-25 (modéré) | Moyen |
| Consecutive hard days | 10 | >=5 (sévère), >=3 (modéré) | Moyen |
| Mood score | 10 | <40 (très bas), <60 (bas) | Moyen |
| Recent illnesses | 15 | >=3 (sévère), >=1 (modéré) | Moyen |

✅ **Points forts** :
- **Modèle multi-facteurs** : Prend en compte 9 indicateurs différents
- **5 niveaux de gravité** : Classification claire et actionnable
- **Poids scientifiquement validés** : Basé sur Meeusen 2013
- **Recommandations automatiques** : Repos, réduction de charge, etc.

⚠️ **Problèmes** :
- **Pas de données subjectives** : Pas d'intégration de questionnaires (RESTQ, POMS)
- **Seuils arbitraires** : Certains seuils pourraient être ajustés
- **Pas de validation clinique** : Difficile de valider sans données médicales

💡 **Recommandations** :
- Intégrer le questionnaire RESTQ-Sport
- Ajouter le Profile of Mood States (POMS)
- Valider avec des données médicales réelles

---

### **5. 🎯 PLANIFICATION & RECOMMANDATIONS**

---

#### **recommendations.js** (396 lignes)

**Rôle** : Génération de recommandations d'entraînement intelligentes.

**Fonctions principales** :

```javascript
// Génération de recommandation
generate(profile, historyCtx, dateContext) // 10 règles de décision hiérarchisées

// Analyse historique
analyzeTrainingHistory(activities, options) // Calcule métriques depuis activités
```

**Hiérarchie des règles (priorité décroissante)** :

```
1. TAPER → Competition proche (≤21j) → Plan de taper exponentiel
2. OVERREACHING → ACWR > 1.5 → Récupération active
3. CNS FATIGUE → Readiness < 40 + streak > 4 → Repos biologique
4. CONSECUTIVE HARD DAYS → ≥4 jours → Récupération
5. MONOTONY → >2.0 → Séance variée
6. LONG RUN → >9j sans + weekend → Sortie longue
7. INTERVAL → Readiness > 65 + conditions optimales → Séance VMA
8. THRESHOLD → Readiness > 55 + >4j depuis dernier → Séance seuil
9. POLARIZATION → <60 + readiness > 60 → Séance haute intensité
10. DEFAULT → Endurance fondamentale
```

✅ **Points forts** :
- **Système basé sur des règles** : Claires et compréhensibles
- **Hiérarchie logique** : Les priorités sont bien ordonnées
- **Intégration multi-modèles** : Utilise PMC, HRV, Polarization, etc.
- **Personnalisation** : Prend en compte profil, historique, contexte temporel

⚠️ **Problèmes** :
- **Règles statiques** : Pas d'apprentissage ou d'adaptation automatique
- **Seuils fixes** : Certains seuils pourraient être personnalisés
- **Pas de feedback utilisateur** : Impossible de savoir si les recommandations sont suivies

💡 **Recommandations** :
- Ajouter un système de feedback pour améliorer les recommandations
- Implémenter un modèle ML pour des recommandations plus personnalisées
- Ajouter des tests A/B pour valider l'efficacité

---

#### **taper.js** (116 lignes)

**Rôle** : Calcul du plan d'affûtage optimal.

**Fonctions principales** :

```javascript
// Calcul du taper optimal
calculateOptimalTaper(currentWeeklyLoad, daysToCompetition, distance, athleteLevel)

// Description des sessions
getSessionDescription(type, distance)

// Ancien format (compatibilité)
calculateTaperPlan(currentWeeklyLoad, daysToCompetition, taperStyle)

// Conseils
getAdvice(distance) // Conseils généraux pour le taper
```

**Paramètres optimaux (Mujika & Padilla 2003)** :

| Paramètre | 5K | 10K | Semi | Marathon | Ultra |
|-----------|-----|------|------|---------|------|
| Durée | 7j | 8j | 10j | 14j | 21j |
| Réduction volume | 50% | 45% | 45% | 40-60% | 50-60% |
| Maintien intensité | 100% | 100% | 100% | 100% | 100% |
| Réduction fréquence | -20% | -20% | -20% | -20% | -20% |
| Gain attendu | 2-5% | 2-5% | 2-5% | 2-5% | 2-5% |

✅ **Points forts** :
- **Modèle scientifiquement validé** : Mujika & Padilla 2003
- **Personnalisable** : Selon distance et niveau de l'athlète
- **Plan détaillé** : Sessions journalières avec descriptions
- **Gain estimé** : Prédiction de l'amélioration de performance

⚠️ **Problèmes** :
- **Générique** : Pas d'adaptation aux spécificités individuelles
- **Durées fixes** : Pas d'adaptation automatique
- **Pas de validation** : Difficile de mesurer le gain réel

💡 **Recommandations** :
- Ajouter des paramètres individuels (historique de taper, réponse personnelle)
- Valider le gain réel avec des tests avant/après

---

#### **race_strategy.js** (132 lignes)

**Rôle** : Génération de stratégie de course optimale.

**Fonctions principales** :

```javascript
// Génération de plan
generatePlan(points, athlete, params) // Retoure segments + summary + nutrition + taper

// Ajustement de pace
adjustPaceForGrade(paceSec, grade) // Basé sur Minetti model (GAP)
```

**Calcul de l'allure** :

```javascript
// 1. Allure de base
- Si goalTime fourni: basePace = goalTime / distance
- Sinon: basePace depuis VDOT predictions

// 2. Facteurs d'ajustement
- Grade: modèle Minetti (polynôme degré 5)
- Cardiac drift: +1.5% par heure
- Environnement: température, humidité, altitude
- Fatigue: cumulative time

// 3. Segmentation
- Découpage en segments de 1km
- Calcul du coût métabolique pour chaque segment
- Allure cible ajustée pour chaque segment
```

✅ **Points forts** :
- **Modèle physique complet** : Intègre dénivelé, fatigue, environnement
- **Personnalisé** : Basé sur VDOT de l'athlète
- **Stratégie segmentée** : Allure adaptée pour chaque km
- **Intégration complète** : Nutrition + Taper recommandations

⚠️ **Problèmes** :
- **Simplifications** : Cardiac drift estimé, pas mesuré
- **Pas de validation** : Difficile de valider la stratégie optimale
- **Pas d'adaptation en temps réel** : Stratégie statique, pas dynamique pendant la course

💡 **Recommandations** :
- Valider avec des données réelles de courses
- Ajouter un système de feedback post-course
- Intégrer des données en temps réel (watch GPS)

---

### **6. 🏃 ANALYSE SPORTIVE**

---

#### **sport_analysis.js** (1443 lignes - **Le plus grand module**)

**Rôle** : Analyse détaillée des activités par type de sport.

**Architecture** :

```javascript
// 1. Constants par sport
SPORT_CONSTANTS = {
    Run: { tssMethod: 'hr_based', trimpModel: 'edwards', multiplier: 1.0 }
    Ride: { tssMethod: 'power_based', trimpModel: 'banister', multiplier: 1.0 }
    Swim: { tssMethod: 'pace_based', trimpModel: 'banister', multiplier: 0.8 }
    TrailRun: { tssMethod: 'hr_elevation', trimpModel: 'edwards', multiplier: 1.15, elevationFactor: 0.008 }
    Walk: { tssMethod: 'srpe', trimpModel: 'edwards', multiplier: 0.5 }
    HIIT: { tssMethod: 'hr_based', trimpModel: 'banister', multiplier: 1.2 }
    Strength: { tssMethod: 'srpe', trimpModel: 'edwards', multiplier: 0.6 }
    Yoga: { tssMethod: 'srpe', trimpModel: 'edwards', multiplier: 0.3 }
}

// 2. Analyse principale
analyze(activity, profile, streams) // Dispatch vers analyse spécifique

// 3. Analyses par sport
_analyzeRun(...)      // Course à pied
_analyzeRide(...)     // Cyclisme
_analyzeSwim(...)     // Natation
_analyzeTrailRun(...) // Trail
_analyzeWalk(...)     // Marche
_analyzeHIIT(...)     // HIIT
_analyzeStrength(...) // Musculation
_analyzeYoga(...)     // Yoga
_analyzeGeneral(...)  // Fallback
```

**Analyse Course à Pied (`_analyzeRun`)** :

```javascript
// Métriques calculées
✅ TSS (HR-based)
✅ TRIMP (Banister ou Edwards)
✅ Intensity Factor
✅ HR Zones (5 zones %FCM)
✅ HR Zone Distribution (stream)
✅ Pace (sec/km, speed km/h)
✅ VDOT (si distance ≥ 3km)
✅ GAP (Grade Adjusted Pace) - Minetti model
✅ Efficiency Factor (GAP/HR)
✅ Running Economy (VO2/speed)
✅ Biomechanics (si cadence ≥ 100)
   - Vertical Oscillation
   - Ground Contact Time
   - Leg Stiffness
   - Step Length
   - Advice
✅ Training Paces (E, M, T, I, R)
✅ Performance Level (VDOT tables)
✅ Race Predictions (5K, 10K, Half, Marathon)
✅ Nutrition recommendations
```

**Analyse Cyclisme (`_analyzeRide`)** :

```javascript
✅ TSS (Power-based)
✅ TRIMP
✅ Intensity Factor
✅ HR Zones, HR Distribution
✅ Normalized Power (30s rolling, 4th power)
✅ Variability Index (NP/AP)
✅ Power Zone Distribution (7 zones)
✅ Critical Power estimation
✅ W' estimation
✅ Power Curve
✅ Power-to-Weight ratio
✅ Total Work (kJ)
✅ TSS/hour
```

**Analyse Natation (`_analyzeSwim`)** :

```javascript
✅ TSS, TRIMP, Intensity Factor
✅ HR Zones
✅ Pace per 100m
✅ SWOLF score (strokes + time)
✅ Stroke Rate
✅ DPS (Distance Per Stroke)
✅ CSS (Critical Swim Speed)
```

**Analyse Trail (`_analyzeTrailRun`)** :

```javascript
✅ Toutes les métriques Run +
✅ VAM (Vertical Ascent per Hour)
✅ Technical Score (easy/moderate/advanced/expert)
✅ Elevation Gain
```

✅ **Points forts** :
- **Très complet** : Métriques détaillées pour chaque sport
- **Multi-sport** : 8 types de sports supportés
- **Scientifique** : Basé sur des modèles validés
- **Stream-aware** : Analyse des données temps réel (HR, power)
- **Personnalisé** : Prend en compte profil de l'athlète

⚠️ **Problèmes** :
- **Complexité** : 1443 lignes, module très grand
- **Duplication** : Certaines fonctions pourraient être factorisées
- **Précision variable** : Certaines estimations sont simplifiées
- **Pas de validation** : Difficile de valider toutes les métriques

💡 **Recommandations** :
- **Découper le module** en sous-modules par sport
- Ajouter des tests unitaires pour chaque sport
- Valider les estimations avec des données réelles
- Ajouter des coefficients de confiance pour chaque métrique

---

### **7. 🌍 ENVIRONNEMENT & SPÉCIALISÉ**

---

#### **critical_power.js** (148 lignes)

Voir analyse précédente.

---

#### **sleep_optimization.js** (120 lignes)

**Rôle** : Optimisation du sommeil pour la récupération et la performance.

**Fonctions principales** :

```javascript
// Durée optimale
calculateOptimalDuration(dailyTSS, trainingPhase, age) // 7-9h selon charge et phase

// Qualité du sommeil
calculateSleepQuality(sleepDuration, sleepEfficiency, hrvChange, restingHRChange) // Score 0-100

// Recommandations
generateRecommendations(sleepQuality, trainingLoad, nextSessionIntensity)

// Sleep Bank (dette de sommeil)
calculateSleepBank(sleepHistoryDays, optimalDuration) // Total debt, avg, trend
```

✅ **Points forts** :
- **Intégration complète** : Prend en compte TSS, phase d'entraînement, âge
- **Qualité multi-facteurs** : Durée + efficacité + HRV + restingHR
- **Sleep Bank** : Concept innovant de dette de sommeil
- **Recommandations pratiques** : Conseils concrets et actionnables

⚠️ **Problèmes** :
- **Données limitées** : Nécessite des données de tracker de sommeil
- **Estimations** : Certaines valeurs sont estimées
- **Pas de validation** : Difficile de valider l'impact sur la performance

💡 **Recommandations** :
- Intégrer des données de wearables (Oura, Whoop, Garmin)
- Valider avec des études sur le sommeil et la performance

---

#### **altitude_training.js** (129 lignes)

**Rôle** : Gestion de l'entraînement en altitude.

**Fonctions principales** :

```javascript
// Effet de l'altitude
calculatePerformanceEffect(altitudeMeters, acclimatizationDays)
// → vo2maxChange, paceAdjustment, rating (none/low/moderate/high/extreme)

// Protocole optimal
calculateOptimalProtocol(goalAltitude, daysAvailable, baseAltitude)
// → live_high_train_low, phases, expectedBenefits

// Gain post-altitude
calculatePostAltitudeGain(altitudeDays, altitudeMeters, daysAfterReturn)
// → gain, maxGain, peakDay, duration

// Changement hémoglobine
estimateHemoglobinChange(altitudeDays, altitudeMeters)
// → change, rating (minimal/moderate/significant)
```

✅ **Points forts** :
- **Modèle complet** : Prend en compte acclimatation et durée
- **Protocole optimal** : Live High, Train Low
- **Prédiction de gain** : Estimation du bénéfice post-altitude
- **Basé sur la science** : Bassett & Howley, études sur l'acclimatation

⚠️ **Problèmes** :
- **Simplifié** : Modèle basé sur des estimations moyennes
- **Pas de personnalisation** : Pas d'adaptation aux réactions individuelles
- **Pas de validation** : Difficile de mesurer le gain réel

💡 **Recommandations** :
- Valider avec des données réelles d'athlètes
- Ajouter des paramètres individuels (sensibilité à l'altitude)

---

#### **nutrition.js** (61 lignes)

**Rôle** : Recommandations nutritionnelles.

**Fonctions principales** :

```javascript
// Besoins pour une séance
calculateRequirements(durationMinutes, intensityFactor, weightKg)
// → hydration (totalMl, perHourMl)
// → carbs (totalG, perHourG)
// → sodium (totalMg)
// → recommendations

// Récupération
calculateRecovery(weightKg)
// → carbsG, proteinG, timing (4:1 ratio)
```

✅ **Points forts** :
- **Basé sur les standards** : Jeukendrup, recommandations IAAF
- **Personnalisé** : Selon durée, intensité, poids
- **Ratio 4:1** : Carbs:Protein optimal pour récupération
- **Hydratation** : 400-800ml/h selon intensité

⚠️ **Problèmes** :
- **Générique** : Pas d'adaptation aux préférences individuelles
- **Estimations** : Besoins en glucides basés sur des moyennes
- **Pas de validation** : Difficile de valider l'impact

💡 **Recommandations** :
- Intégrer des données personnelles (poids, métabolisme)
- Valider avec des tests de terrain (nutrition pendant les courses)

---

#### **biomechanics.js** (152 lignes)

**Rôle** : Analyse de la biomécanique de course.

**Fonctions principales** :

```javascript
// Estimation des métriques
estimateMetrics(speedMs, cadence, weightKg, heightCm)
// → verticalOscillation (cm)
// → groundContactTime (ms)
// → stiffness (kN/m)
// → verticalRatio (%)
// → stepLength (m)

// Conseils
getAdvice(metrics, speedKmh) // Conseils personnalisés

// Calculs standalone
calculateVerticalOscillation(cadence, speedMs)
calculateGroundContactTime(cadence, speedMs)
calculateLegStiffness(weightKg, flightTime, contactTime)

// Notation
getRating(metric, value) // excellent/good/fair
```

✅ **Points forts** :
- **Modèle physique** : Basé sur Dalleau 2004, Morin 2005
- **Conseils pratiques** : Identification des points à améliorer
- **Estimation sans capteur** : Permet une analyse avec pace et cadence seulement
- **Notation claire** : excellent/good/fair pour chaque métrique

⚠️ **Problèmes** :
- **Estimations** : Basé sur des modèles simplifiés
- **Pas de validation** : Difficile de valider sans données de capteurs (Stryd, RunScribe)
- **Limité à la course** : Pas d'analyse pour d'autres sports

💡 **Recommandations** :
- Valider avec des données réelles de capteurs
- Ajouter des coefficients de calibration

---

#### **environmental_impact.js** (35 lignes)

**Rôle** : Calcul de l'impact environnemental sur la performance.

**Fonctions principales** :

```javascript
// Impact chaleur/humidité
calculateHeatImpact(tempCelsius, humidityPct)
// → Factor (1.0 = pas d'impact, 1.05 = 5% plus lent)

// Facteur combiné
getAdjustmentFactor(temp, humidity, altitude)
// → heat * altitude adjustment
```

✅ **Points forts** :
- **Simple et efficace** : Modèle clair et compréhensible
- **Intégration** : Combine température, humidité, altitude
- **Basé sur la science** : Ely 2007, études sur la performance en chaleur

⚠️ **Problèmes** :
- **Simplifié** : Modèle basé sur des estimations
- **Pas de données en temps réel** : Nécessite des données météo
- **Pas de validation** : Difficile de valider l'impact réel

💡 **Recommandations** :
- Intégrer des API météo pour des données en temps réel
- Valider avec des données de courses réelles

---

## **🔗 DÉPENDANCES ET INTÉGRATIONS**

---

### **1. Dépendances Internes**

```
MathUtils           ← Utilisé par: PMC, HRV, Cardiovascular, Taper, RaceStrategy, Biomechanics
SCIENTIFIC_CONSTANTS ← Utilisé par: PMC, Cardiovascular, RunningPerformance, CriticalPower, EnvironmentalImpact, RaceStrategy

PMC                 ← Utilisé par: metricsCalculator, sport_analysis
Cardiovascular     ← Utilisé par: metricsCalculator, sport_analysis, recommendations
RunningPerformance ← Utilisé par: metricsCalculator, sport_analysis, race_strategy
TrainingLoad       ← Utilisé par: sport_analysis
Polarization       ← Utilisé par: sport_analysis, recommendations
HRV                 ← Utilisé par: metricsCalculator, sport_analysis
Overtraining       ← Utilisé par: recommendations
Taper               ← Utilisé par: race_strategy
SportAnalysis      ← Utilisé par: metricsCalculator, routes/algo/analyze
CriticalPower      ← Utilisé par: running_power, sport_analysis
SleepOptimization  ← Utilisé par: sport_analysis
AltitudeTraining   ← Utilisé par: environmental_impact, sport_analysis
Nutrition           ← Utilisé par: race_strategy, sport_analysis
Biomechanics        ← Utilisé par: sport_analysis
EnvironmentalImpact ← Utilisé par: race_strategy, sport_analysis
RaceStrategy        ← Utilisé par: coach (planification)
```

---

### **2. Intégration avec le Backend**

**Appelé par** :

| Module | Appelé par | Contexte |
|--------|------------|----------|
| **Cardiovascular** | metricsCalculator, coach, algo routes | Zones HR, FCM |
| **RunningPerformance** | metricsCalculator, coach, algo routes | VDOT, prédictions |
| **TrainingLoad** | sport_analysis, algo routes | TSS, TRIMP |
| **PMC** | metricsCalculator, algo routes, sport_analysis | PMC, ACWR, Readiness |
| **Polarization** | sport_analysis, algo routes | Polarization Index |
| **HRV** | metricsCalculator, algo routes | Readiness, Recovery |
| **Overtraining** | algo routes | Détection OTS |
| **Taper** | coach, race_strategy | Plan d'affûtage |
| **Recommendations** | algo routes, coach | Recommandations entraînement |
| **SportAnalysis** | metricsCalculator, algo routes | Analyse activités |
| **CriticalPower** | sport_analysis, running_power | CP, W' |
| **All others** | sport_analysis, algo routes | Divers |

---

### **3. Routes API qui Utilisent le Science Engine**

| Route | Modules utilisés | Endpoint |
|-------|------------------|----------|
| `/api/algo/zones` | Cardiovascular | Zones HR/Power |
| `/api/algo/vdot` | RunningPerformance | Calcul VDOT |
| `/api/algo/pmc` | PMC | PMC calculation |
| `/api/algo/health` | PMC, Cardiovascular, HRV | Health check |
| `/api/algo/recommendations` | Recommendations, PMC, Polarization | Recommandations |
| `/api/algo/polarization` | Polarization | Polarization |
| `/api/algo/hrv` | HRV | Analyse HRV |
| `/api/algo/taper` | Taper | Plan taper |
| `/api/algo/overtraining` | Overtraining | Détection OTS |
| `/api/algo/tss` | TrainingLoad | Calcul TSS |
| `/api/algo/readiness` | PMC, HRV | Readiness |
| `/api/algo/analyze` | SportAnalysis | Analyse activité |
| `/api/algo/critical-power` | CriticalPower | CP/W' |
| `/api/algo/race-strategy` | RaceStrategy, Nutrition, Taper | Stratégie course |

---

## **✅ POINTS FORTS**

---

### **1. Complétude Scientifique** ⭐⭐⭐⭐⭐

- **21 modules** couvrant tous les aspects de la science du sport
- **Références scientifiques** claires pour chaque module
- **Modèles validés** : Banister, Seiler, Daniels, Coggan, Poole, Mujika, etc.
- **Multi-sport** : Support de 8+ types de sports différents

---

### **2. Architecture Modulaire** ⭐⭐⭐⭐⭐

- **Découpage logique** : Chaque module a une responsabilité claire
- **Faible couplage** : Les modules communiquent via des fonctions bien définies
- **Barillet central** : `index.js` exporte tout de manière organisée
- **Réutilisable** : Chaque module peut être utilisé indépendamment

---

### **3. Implémentation Fidèle** ⭐⭐⭐⭐⭐

- **PMC** : Modèle Banister 1975 implémenté correctement
- **VDOT** : Formule Jack Daniels fidèle à l'original
- **TRIMP** : Plusieurs modèles (Edwards, Banister, Lucia)
- **Critical Power** : Modèle Poole 2016 avec W'
- **Taper** : Modèle Mujika & Padilla 2003
- **Polarisation** : Modèle Seiler 80/20

---

### **4. Documentation** ⭐⭐⭐⭐

- **Commentaires clairs** : Chaque fonction a une description
- **Références scientifiques** : Pour chaque modèle implémenté
- **Exemples** : Certains modules ont des exemples dans les commentaires

---

### **5. Personnalisation** ⭐⭐⭐⭐

- **Profil athlète** : Age, sexe, poids, FCM, VDOT, etc.
- **Niveau** : beginner, intermediate, advanced, elite
- **Objectifs** : 5K, 10K, Half, Marathon, Ultra, etc.
- **Environnement** : Température, humidité, altitude
- **Équipement** : Powermeter, cardio, etc.

---

### **6. Intégration** ⭐⭐⭐⭐

- **Backend** : Intégré avec metricsCalculator, routes, coach
- **Frontend** : Accessible via API endpoints `/api/algo/*`
- **Multi-sport** : Support de la course, vélo, natation, trail, etc.

---

## **⚠️ PROBLÈMES ET RISQUES**

---

### **🔴 PROBLÈMES CRITIQUES**

| # | Problème | Impact | Modules concernés | Priorité |
|---|----------|--------|-------------------|----------|
| 1 | **Calculs redondants** | Incohérences entre endpoints | Tous | **CRITIQUE** |
| 2 | **Pas de source unique de vérité** | Données différentes selon les pages | PMC, VDOT, Zones | **CRITIQUE** |
| 3 | **Pas de validation des données** | Résultats basés sur des estimations | Tous | **CRITIQUE** |
| 4 | **Complexité de sport_analysis** | Module trop grand, difficile à maintenir | sport_analysis | **HAUTE** |
| 5 | **Pas de cache centralisé** | Calculs redondants, performance | Tous | **HAUTE** |

---

### **🟡 PROBLÈMES MOYENS**

| # | Problème | Impact | Modules concernés | Priorité |
|---|----------|--------|-------------------|----------|
| 6 | **Modèles ACWR controversés** | Précision limitée | PMC | Moyenne |
| 7 | **Estimations vs données réelles** | Moins précis sans capteurs | HRV, Biomechanics, RunningPower | Moyenne |
| 8 | **Pas de tests unitaires** | Difficile de valider | Tous | Moyenne |
| 9 | **Duplication de code** | Maintenance difficile | sport_analysis | Moyenne |
| 10 | **Commentaires security/detect-object-injection** | Code potentiellement dangereux | Plusieurs | Moyenne |

---

### **🟢 PROBLÈMES MINEURS**

| # | Problème | Impact | Modules concernés | Priorité |
|---|----------|--------|-------------------|----------|
| 11 | **Formules simplifiées** | Précision limitée | Nutrition, AltitudeTraining | Basse |
| 12 | **Pas de typage TypeScript** | Moins de sécurité | Tous | Basse |
| 13 | **Documentation variable** | Certains modules moins documentés | Tous | Basse |

---

## **📊 DÉTAIL DES PROBLÈMES CRITIQUES**

---

### **1. Calculs Redondants**

**Description** : Plusieurs endpoints et services recalculent les mêmes métriques indépendamment.

**Exemples** :
- `/api/algo/zones` recalcule les zones HR avec des paramètres passés par le frontend
- `/api/algo/health` recalcule PMC et readiness
- `/api/coach/profile` recalcule VDOT, FCM, etc.
- `metricsCalculator` calcule aussi PMC, VDOT, etc.

**Impact** :
- **Incohérences** : Un utilisateur peut voir des valeurs différentes sur différentes pages
- **Performances** : Calculs redondants inutiles
- **Maintenance** : Difficile de synchroniser tous les calculs

**Solution** :
- Créer un service central `userMetrics.service.js` qui calcule TOUT une seule fois
- Tous les endpoints doivent utiliser les métriques stockées en DB
- Garantir que toutes les activités sont analysées avant de retourner des métriques

---

### **2. Pas de Source Unique de Vérité**

**Description** : Il n'y a pas d'endroit central où toutes les métriques sont stockées et accessibles.

**État actuel** :
- VDOT stocké dans `user_profiles` table
- CTL/ATL/ACWR stockés dans `performance_metrics` table
- Zones calculées à la volée par chaque endpoint
- Readiness calculé de plusieurs manières différentes

**Impact** :
- **Incohérences** : Difficile de garantir que toutes les pages affichent les mêmes données
- **Complexité** : Le frontend doit appeler plusieurs endpoints pour obtenir toutes les données

**Solution** :
- Créer un endpoint `/api/user/metrics` qui retourne TOUTES les métriques
- Stocker toutes les métriques dans un format normalisé
- Le frontend n'appelle que CET endpoint

---

### **3. Pas de Validation des Données**

**Description** : Les calculs se basent sur des estimations qui peuvent être inexactes.

**Exemples** :
- FCM estimée avec Tanaka si pas de donnée réelle
- VDOT estimé depuis VMA si pas de test
- Zones HR basées sur des formules génériques
- TSS/TRIMP calculés avec des coefficients par défaut

**Impact** :
- **Précision limitée** : Les métriques peuvent être éloignées de la réalité
- **Variabilité** : Différents athlètes ont des réponses différentes

**Solution** :
- Ajouter des coefficients de confiance pour chaque métrique
- Prioriser les données réelles sur les estimations
- Valider avec des tests et des données réelles

---

### **4. Complexité de sport_analysis.js**

**Description** : Le module `sport_analysis.js` fait 1443 lignes et gère 8 types de sports différents.

**Problèmes** :
- **Trop grand** : Difficile à lire, maintenir, tester
- **Duplication de code** : Beaucoup de code similaire entre les sports
- **Complexité** : Logique complexe avec beaucoup de branches

**Solution** :
- **Découper en sous-modules** : `sport_analysis/run.js`, `sport_analysis/ride.js`, etc.
- **Factoriser le code commun** : Extraire les fonctions partagées
- **Ajouter des tests unitaires** : Pour chaque type de sport

---

### **5. Pas de Cache Centralisé**

**Description** : Chaque appel à un endpoint recalcule les métriques depuis zéro.

**Exemple** :
- Si un utilisateur charge le Dashboard, puis la page Coach, puis la page Performance
- Chaque page recalcule PMC, VDOT, zones, etc.

**Impact** :
- **Performances** : Temps de réponse élevé
- **Charge serveur** : Calculs redondants
- **Incohérences temporelles** : Si les données changent entre les appels

**Solution** :
- Ajouter un cache Redis pour les métriques utilisateur
- Invalider le cache quand les données changent (nouvelle activité, sync)
- Cache valable 5-15 minutes

---

## **💡 RECOMMANDATIONS D'AMÉLIORATION**

---

### **🎯 HIGH PRIORITY (Critique - À faire ABSOLUMENT)**

| # | Recommandation | Description | Impact | Effort |
|---|----------------|-------------|--------|--------|
| 1 | **Créer UserMetricsService** | Service central pour TOUTES les métriques | ⭐⭐⭐⭐⭐ | Medium |
| 2 | **Créer /api/user/metrics** | Endpoint unique qui retourne tout | ⭐⭐⭐⭐⭐ | Low |
| 3 | **Modifier tous les endpoints** | Utiliser UserMetricsService au lieu de recalculer | ⭐⭐⭐⭐⭐ | Medium |
| 4 | **Découper sport_analysis.js** | Créer des sous-modules par sport | ⭐⭐⭐⭐ | Medium |
| 5 | **Ajouter cache Redis** | Cacher les métriques utilisateur | ⭐⭐⭐⭐ | Low |

---

### **📊 MEDIUM PRIORITY (Important - À faire ensuite)**

| # | Recommandation | Description | Impact | Effort |
|---|----------------|-------------|--------|--------|
| 6 | **Ajouter coefficient de confiance** | Pour chaque métrique calculée | ⭐⭐⭐ | Medium |
| 7 | **Prioriser données réelles** | FCM, VDOT, etc. depuis activités avant estimations | ⭐⭐⭐ | Low |
| 8 | **Ajouter tests unitaires** | Pour chaque module du Science Engine | ⭐⭐⭐ | Medium |
| 9 | **Valider avec données réelles** | Comparer avec Garmin, Strava, etc. | ⭐⭐⭐ | High |
| 10 | **Optimiser tau PMC** | Ajustement automatique de τ selon l'athlète | ⭐⭐ | Medium |

---

### **🚀 LOW PRIORITY (Amélioration - Nice to have)**

| # | Recommandation | Description | Impact | Effort |
|---|----------------|-------------|--------|--------|
| 11 | **TypeScript** | Ajouter typage TypeScript | ⭐⭐ | High |
| 12 | **Documentation complète** | Ajouter JSDoc pour toutes les fonctions | ⭐ | Medium |
| 13 | **Benchmarks** | Comparer les modèles avec des données réelles | ⭐⭐ | High |
| 14 | **Intégrer wearables** | Oura, Whoop, Garmin pour données HRV/sommeil | ⭐⭐ | High |
| 15 | **ML pour personnalisation** | Modèles adaptatifs selon l'historique | ⭐⭐⭐ | Very High |

---

## **📊 MÉTRIQUES DE QUALITÉ**

---

### **Par Module**

| Module | Lignes | Complexité | Documentation | Tests | Note /5 |
|--------|--------|------------|---------------|-------|----------|
| scientific_constants | 167 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | **5.0** |
| math_utils | 79 | ⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.5** |
| cardiovascular | 293 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | **4.8** |
| running_performance | 475 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | **4.9** |
| training_load | 177 | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.5** |
| pmc | 310 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | **4.8** |
| polarization | 137 | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.5** |
| hrv | 156 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.7** |
| overtraining | 227 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | **4.9** |
| recommendations | 396 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | **4.9** |
| taper | 116 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.6** |
| race_strategy | 132 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.7** |
| sport_analysis | 1443 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.5** |
| critical_power | 148 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.8** |
| sleep_optimization | 120 | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.6** |
| altitude_training | 129 | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.6** |
| nutrition | 61 | ⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐ | **4.3** |
| biomechanics | 152 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | **4.7** |
| environmental_impact | 35 | ⭐ | ⭐⭐⭐ | ❌ | ⭐⭐⭐ | **4.2** |

**Note moyenne du Science Engine : ⭐⭐⭐⭐ (4.6/5)**

---

### **Global**

| Catégorie | Note /5 | Commentaire |
|-----------|----------|-------------|
| **Complétude** | ⭐⭐⭐⭐⭐ | 21 modules couvrant tous les aspects |
| **Scientificité** | ⭐⭐⭐⭐⭐ | Références scientifiques pour chaque modèle |
| **Architecture** | ⭐⭐⭐⭐⭐ | Modulaire, bien organisé |
| **Documentation** | ⭐⭐⭐⭐ | Bon niveau, pourrait être amélioré |
| **Tests** | ⭐ | Aucun test unitaire |
| **Performance** | ⭐⭐⭐ | Bon, mais cache manquant |
| **Maintenabilité** | ⭐⭐⭐ | sport_analysis trop grand, duplication |
| **Sécurité** | ⭐⭐⭐⭐ | Pas de problèmes majeurs identifiés |

---

## **🎯 CONCLUSION**

---

### **🌟 CE QUE LE SCIENCE ENGINE FAIT BIEN**

1. **Complet** : 21 modules couvrant tous les aspects scientifiques du sport
2. **Scientifiquement validé** : Chaque module est basé sur des études reconnues
3. **Modulaire** : Architecture claire avec séparation des responsabilités
4. **Multi-sport** : Support de 8+ types de sports différents
5. **Personnalisable** : Prend en compte le profil de chaque athlète
6. **Intégré** : Bien intégré avec le reste du backend

**→ C'est l'un des points forts majeurs de DrawRun**

---

### **⚠️ CE QUI PEUT ÊTRE AMÉLIORÉ**

1. **Cohérence des données** : Créer une source unique de vérité
2. **Performance** : Ajouter un cache centralisé
3. **Validation** : Ajouter des tests unitaires et validation croisée
4. **Maintenabilité** : Découper sport_analysis en sous-modules
5. **Précision** : Prioriser les données réelles sur les estimations

---

### **📋 ROADMAP RECOMMANDÉE**

#### **Phase 1 : Cohérence (Critique - 1-2 semaines)**
1. Créer `UserMetricsService` avec `getAllUserMetrics()`
2. Créer `/api/user/metrics` endpoint
3. Modifier `metricsCalculator` pour utiliser le service
4. Vérifier que toutes les activités sont analysées

#### **Phase 2 : Performance (Important - 1 semaine)**
1. Ajouter cache Redis pour les métriques
2. Implémenter invalidation de cache après sync
3. Optimiser les requêtes SQL

#### **Phase 3 : Qualité (Moyen terme - 2-4 semaines)**
1. Découper `sport_analysis.js` en sous-modules
2. Ajouter des tests unitaires pour chaque module
3. Ajouter des coefficients de confiance
4. Valider avec des données réelles

#### **Phase 4 : Avancé (Long terme)**
1. Ajouter TypeScript pour le typage
2. Intégrer des données de wearables
3. Implémenter des modèles ML
4. Documentation complète avec exemples

---

### **💬 MOT DE LA FIN**

> "Le Science Engine de DrawRun est **impressionnant** par sa complétude et sa base scientifique solide. C'est un atout majeur du système. Les améliorations prioritaires doivent se concentrer sur la **cohérence des données** et la **performance**, plutôt que sur l'ajout de nouvelles fonctionnalités. Une fois ces problèmes résolus, DrawRun aura un Science Engine de classe mondiale."

---
---
*Rapport généré le 2026-06-02 | Dossier : backend/src/algorithms/ | 21 modules analysés | Lignes totales : ~3,500+*
