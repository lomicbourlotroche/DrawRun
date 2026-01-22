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

### 📅 Planification & Coaching
- **Périodisation 3:1 (Step-Loading)** : Structure algorithmique des blocs d'entraînement (3 semaines de charge progressive, 1 semaine de décharge spécifique).
- **Suggestion Quotidienne** : Un coach IA analyse vos données Strava et Health Connect pour vous suggérer la séance idéale en fonction de votre programme et de votre fatigue réelle.
- **Journal d'Activités Interactif** : Visualisation riche des parcours (polylines), analyse du découplage cardiaque et suivi de l'efficacité (EF).

### 🔗 Écosystème Connecté
- **Strava API v3** : Synchronisation bidirectionnelle fluide des activités, des segments et des scores de souffrance.
- **Google Health Connect** : Centralisation des données de repos (Sommeil, HRV, Pouls au repos) pour une vision holistique de l'athlète.

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
