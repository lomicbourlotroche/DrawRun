# DrawRun ⚡

**DrawRun** est une application Android de performance sportive d'élite, conçue pour les athlètes exigeants. Elle intègre le prestigieux moteur **Jack Daniels VDOT (V6.4)** pour offrir une planification d'entraînement de précision chirurgicale et une analyse physiologique avancée.

![Dashboard Preview](https://via.placeholder.com/800x400?text=DrawRun+Dashboard+Preview)

## 🚀 Fonctionnalités Clés

### 🧠 Intelligence Physiologique

- **Moteur VDOT Elite (V6.4)** : Calcul automatique et dynamique de votre VDOT basé sur vos meilleures performances. Ajustement instantané de vos allures cibles : *Easy, Marathon, Threshold, Interval, Repetition*.
- **ScienceEngine Centralisé** : 15+ métriques avancées dans un seul moteur :
  - **TSS** (Training Stress Score) - Charge d'entraînement Coggan
  - **TRIMP** (Edwards) - Impulsion d'entraînement cardiaque
  - **NP** (Normalized Power) - Puissance normalisée cyclisme
  - **IF** (Intensity Factor) - Facteur d'intensité
  - **Age Grading** (WMA) - Ajustement performance / âge
  - **W'** (W Prime) - Réserve anaérobie cyclisme
  - **RAI** (Run Activity Index) - VDOT ajusté volume
  - **Marathon Prediction** - Prédiction temps (Riegel/Daniels)
  - **Profils Athlétiques** - Classification Cyclisme (Sprinter/Grimpeur/Rouleur/Puncheur) et Natation (Sprint/Middle/Distance)
- **Analyse de Charge (CTL/TSB)** : Suivi précis de votre charge chronique (Forme) et de votre balance de stress (Fraîcheur) pour atteindre un pic de forme optimal le jour J.
- **Variabilité de la Fréquence Cardiaque (HRV)** : Intégration des données de santé pour évaluer votre état de récupération quotidien et adapter l'intensité au réveil.

### 📅 Planification IA & Coaching
- **Générateur de Plan Run (12 Semaines)** : Création instantanée d'un plan complet de 12 semaines ciblant votre objectif (5k à Marathon) basé sur votre VDOT actuel.
- **Swim Coach IA** : Module dédié à la natation capable de générer des séances structurées (Distance ou Durée) avec focus technique et éducatifs.
- **Créateur de Séance Avancé "Pro"** :
  - **Structure par Blocs** : Créez des répétitions complexes (ex: 10x 400m/1').
  - **Réorganisation** : Déplacez vos blocs librement.
  - **PPG Intégrée** : Ajoutez des blocs de renforcement musculaire.
  - **Mode Édition** : Modifiez vos séances existantes à la volée.
- **Périodisation 3:1** : Structure algorithmique des blocs (3 semaines charge, 1 semaine décharge).

### 🔗 Écosystème Connecté
- **Strava API v3** : Synchronisation bidirectionnelle. Import des activités, calcul des scores.
- **Liaison Intelligente** : Associez manuellement vos activités Strava à vos séances prévues ("Lier/Délier") pour un suivi précis de la conformité au plan.
- **Google Health Connect** : Centralisation des données de repos (Sommeil, HRV).

## 🛠️ Stack Technique

- **Langage** : Kotlin 2.1.0+
- **Application** : Android 15 (API 35)
- **UI Framework** : Jetpack Compose avec Material 3
- **Architecture** : Clean Logic & Uni-directional Data Flow (MVI/MVVM hybride)
- **Réseau** : OkHttp 4.12.0
- **Persistance** : SharedPreferences (Encrypted)
- **Build System** : Gradle 8.10.2 (KTS)

## 📦 Installation & Configuration

### Prérequis
- Android Studio Ladybug (ou version ultérieure)
- Java 25 (OpenJDK)
- Compte Développeur Strava (pour les API Keys)

### Configuration des API
Créez un fichier `local.properties` à la racine et ajoutez vos identifiants Strava :
```properties
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
```

### Déploiement
Utilisez le script PowerShell automatisé pour compiler et déployer :
```powershell
./deploy.ps1
```

## 🎨 Identité Visuelle
L'application utilise une identité visuelle "Onyx Premium", privilégiant les contrastes élevés, le verre dépoli (glassmorphism) et des micro-animations fluides. L'icône **Bolt (Éclair)** symbolise la réactivité physiologique et la vitesse.

---
> [!IMPORTANT]
> **DrawRun** est en phase active de développement bêta. Les calculs de VDOT sont basés sur les tables officielles de Jack Daniels mais nécessitent une validation par test de terrain (ex: 5km ou 10km à fond) pour une précision optimale.

---
