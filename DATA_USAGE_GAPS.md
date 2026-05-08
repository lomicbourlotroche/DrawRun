# Analyse des Gaps entre Données Stockées et Utilisées

## Résumé Exécutif

Après l'amélioration du système de sync (GPS, streams, splits, 40 colonnes), une analyse complète montre que **le projet utilise déjà la majorité des données**, mais il existe des **gaps critiques** à combler pour exploiter pleinement les nouvelles données GPS et streams.

---

## ✅ Ce qui est DÉJÀ utilisé

### Métriques de Base (100% utilisées)
- ✅ `distance`, `moving_time`, `elapsed_time` → Dashboard, liste, détail, coach
- ✅ `average_heartrate`, `max_heartrate` → Charts, zones, TRIMP, TSS
- ✅ `average_speed`, `max_speed` → Pace, allure, prédictions
- ✅ `total_elevation_gain` → GAP, VAM, difficulté
- ✅ `calories` → Nutrition, bilan énergétique
- ✅ `start_date`, `type`, `name` → Filtres, tri, affichage

### Métriques Avancées (80% utilisées)
- ✅ `average_cadence` → Biomécanique, efficacité
- ✅ `average_power` → TSS cyclisme, IF, NP
- ✅ `tss`, `trimp`, `intensity_factor` → PMC, CTL, ATL, TSB, ACWR
- ✅ `efficiency_factor` → Performance, progression
- ✅ `timezone` → Affichage local
- ✅ `device_name` → Métadonnées
- ✅ `description` → Notes utilisateur

### Streams (60% utilisés)
- ✅ `heartrate[]` → Chart HR, zones, TRIMP détaillé
- ✅ `velocity_smooth[]` → Chart pace, variabilité
- ✅ `altitude[]` → Chart elevation, gradient, GAP
- ✅ `cadence[]` → Chart cadence, biomécanique
- ✅ `time[]`, `distance[]` → Axes X des charts

### Splits (100% utilisés)
- ✅ Calculés depuis les streams
- ✅ Affichés dans la page détail activité
- ✅ Utilisés pour GAP, gradient, zones par km

### Algorithmes Scientifiques (100% utilisés)
- ✅ **VDOT** (Jack Daniels) → Prédictions, allures, niveau
- ✅ **TSS/TRIMP** → Charge d'entraînement
- ✅ **PMC** (Banister) → CTL, ATL, TSB, forme
- ✅ **ACWR** → Risque blessure, surmenage
- ✅ **GAP** (Minetti) → Allure ajustée pente
- ✅ **Zones FC** (Karvonen) → Entraînement polarisé
- ✅ **Readiness Score** → Recommandations
- ✅ **Coach adaptatif** → Plans personnalisés

---

## ❌ Ce qui N'EST PAS utilisé (Gaps Critiques)

### 1. GPS / Polyline (Gap Majeur)

#### Données stockées mais NON utilisées
- ❌ `map_polyline` (JSON array de [lat, lng])
- ❌ `map_summary_polyline` (polyline simplifiée)
- ❌ `activity_streams.latlng` (GPS track complet)

#### Où c'est stocké
- `activities.map_polyline` → Polyline complète (JSON)
- `activities.map_summary_polyline` → Polyline simplifiée (Strava)
- `activity_streams` table → Stream `latlng` avec tous les points GPS

#### Où ça DEVRAIT être utilisé
1. **Page détail activité** (`activities/[id]/page.tsx`)
   - ✅ Composant `ActivityMap` existe déjà
   - ❌ Mais ne reçoit jamais de données GPS
   - **Action** : Passer `map_polyline` ou `streams.latlng` au composant

2. **Explore / Heatmap** (`app/explore/page.tsx`)
   - ❌ Pas de carte de chaleur des routes populaires
   - ❌ Pas de visualisation des segments
   - **Action** : Créer une heatmap depuis les GPS tracks

3. **Routes partagées** (fonctionnalité manquante)
   - ❌ Pas de partage de routes
   - ❌ Pas de découverte de routes populaires
   - **Action** : Utiliser `map_polyline` pour créer/partager des routes

4. **Segments** (fonctionnalité manquante)
   - ❌ Pas de détection automatique de segments
   - ❌ Pas de classements sur segments
   - **Action** : Utiliser GPS pour détecter les segments récurrents

#### Impact
- **Critique** : Les utilisateurs ne voient jamais leurs parcours sur une carte
- **Critique** : Impossible de comparer des routes
- **Critique** : Pas de visualisation géographique des entraînements

---

### 2. Power Streams (Gap Modéré)

#### Données stockées mais NON utilisées
- ❌ `activity_streams.watts` (power stream complet)
- ⚠️ `average_power` utilisé, mais pas le stream détaillé

#### Où ça DEVRAIT être utilisé
1. **Chart Power** (manquant)
   - ❌ Pas de graphique de puissance dans la page détail
   - **Action** : Ajouter un chart `watts[]` comme pour HR/cadence

2. **Normalized Power (NP)** (calcul incomplet)
   - ⚠️ `TrainingLoad.normalizedPower()` existe dans les algos
   - ❌ Mais jamais appelé avec le stream complet
   - **Action** : Calculer NP depuis `watts[]` stream

3. **Variability Index (VI)** (calcul incomplet)
   - ⚠️ `TrainingLoad.variabilityIndex()` existe
   - ❌ Mais jamais calculé
   - **Action** : Calculer VI = NP / avgPower

4. **Power Zones** (affichage incomplet)
   - ⚠️ Zones définies dans `Cardiovascular.powerZones()`
   - ❌ Mais pas de distribution par zone affichée
   - **Action** : Calculer % temps par zone depuis `watts[]`

#### Impact
- **Modéré** : Les cyclistes avec capteur de puissance ne voient pas leurs données
- **Modéré** : TSS cyclisme moins précis sans NP

---

### 3. Colonnes Avancées (Gap Mineur)

#### Données stockées mais NON utilisées
- ❌ `elev_high`, `elev_low` (altitude min/max)
- ❌ `normalized_power` (NP calculé)
- ❌ `variability_index` (VI calculé)
- ❌ `normalized_speed` (NGP calculé)
- ❌ `running_index` (Garmin Running Index)
- ❌ `hrv_rmssd`, `hrv_samples` (HRV par activité)
- ❌ `raw_data_key` (clé fichier brut)
- ❌ `external_id`, `upload_id` (IDs externes)
- ❌ `is_race`, `is_commute` (flags)
- ❌ `gear_id` (équipement)
- ❌ `notes` (notes utilisateur)

#### Où ça DEVRAIT être utilisé
1. **Altitude min/max**
   - **Action** : Afficher dans les stats de l'activité

2. **NP, VI, NGP**
   - **Action** : Calculer et afficher dans l'analyse avancée

3. **Running Index**
   - **Action** : Afficher comme métrique de performance Garmin

4. **HRV par activité**
   - **Action** : Afficher dans l'analyse de récupération

5. **Flags (race, commute)**
   - **Action** : Filtres dans la liste d'activités

6. **Gear**
   - **Action** : Suivi de l'usure du matériel

7. **Notes**
   - **Action** : Édition dans la page détail

#### Impact
- **Mineur** : Fonctionnalités "nice to have" mais pas critiques

---

### 4. Splits Détaillés (Gap Mineur)

#### Données stockées mais partiellement utilisées
- ✅ Splits affichés dans la page détail
- ❌ Mais pas d'analyse approfondie des splits

#### Où ça DEVRAIT être utilisé
1. **Analyse de régularité**
   - ❌ Pas de calcul de variabilité des splits
   - **Action** : Calculer écart-type des paces

2. **Détection de fade**
   - ❌ Pas de détection de baisse de rythme
   - **Action** : Comparer 1ère moitié vs 2ème moitié

3. **Splits négatifs**
   - ❌ Pas de détection de negative splits
   - **Action** : Identifier les courses bien gérées

4. **Comparaison de splits**
   - ❌ Pas de comparaison entre activités
   - **Action** : Comparer splits sur même parcours

#### Impact
- **Mineur** : Analyse plus fine pour coureurs avancés

---

## 🔧 Actions Prioritaires

### Priorité 1 — GPS / Carte (Impact Critique)

**Problème** : Les utilisateurs ne voient jamais leurs parcours sur une carte.

**Solution** :
1. Modifier `activities/[id]/page.tsx` pour passer les données GPS au composant `ActivityMap`
2. Décoder `map_polyline` (JSON) ou utiliser `streams.latlng`
3. Afficher la carte avec Leaflet/Mapbox
4. Ajouter des markers (départ, arrivée, km)

**Code à ajouter** :
```typescript
// Dans activities/[id]/page.tsx
const polyline = activity.map_polyline 
  ? JSON.parse(activity.map_polyline) 
  : latlngData;

{polyline && polyline.length > 0 && (
  <Card>
    <CardHeader><CardTitle>Parcours</CardTitle></CardHeader>
    <CardContent>
      <ActivityMap polyline={polyline} />
    </CardContent>
  </Card>
)}
```

**Fichiers à modifier** :
- `frontend/app/app/activities/[id]/page.tsx`
- `frontend/components/ui/ActivityMap.tsx` (vérifier qu'il accepte polyline)

---

### Priorité 2 — Power Chart (Impact Modéré)

**Problème** : Les cyclistes avec capteur de puissance ne voient pas leurs données.

**Solution** :
1. Ajouter un chart `watts[]` dans la page détail
2. Calculer NP depuis le stream complet
3. Afficher VI (Variability Index)
4. Afficher distribution par zone de puissance

**Code à ajouter** :
```typescript
// Dans activities/[id]/page.tsx
const wattsData = extractData(streams?.watts);

{wattsData && wattsData.length > 0 && (
  <Card>
    <CardHeader><CardTitle>Puissance</CardTitle></CardHeader>
    <CardContent>
      <StreamChart 
        data={wattsData} 
        label="Watts" 
        color="orange"
        min={Math.min(...wattsData)}
        max={Math.max(...wattsData)}
        avg={activity.average_power}
      />
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted">Moyenne</p>
          <p className="text-2xl font-bold">{activity.average_power}W</p>
        </div>
        <div>
          <p className="text-sm text-muted">NP</p>
          <p className="text-2xl font-bold">{activity.normalized_power || '-'}W</p>
        </div>
        <div>
          <p className="text-sm text-muted">VI</p>
          <p className="text-2xl font-bold">{activity.variability_index || '-'}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

**Fichiers à modifier** :
- `frontend/app/app/activities/[id]/page.tsx`
- `backend/src/metrics_calculator.js` (calculer NP/VI)

---

### Priorité 3 — Métriques Avancées (Impact Mineur)

**Problème** : Colonnes remplies mais jamais affichées.

**Solution** :
1. Afficher `elev_high`, `elev_low` dans les stats
2. Afficher `running_index` pour activités Garmin
3. Afficher `hrv_rmssd` dans l'analyse de récupération
4. Ajouter filtres `is_race`, `is_commute`
5. Ajouter édition de `notes`

**Code à ajouter** :
```typescript
// Dans activities/[id]/page.tsx - Section Stats
{activity.elev_high && (
  <div>
    <p className="text-sm text-muted">Altitude</p>
    <p className="text-lg">{activity.elev_low}m - {activity.elev_high}m</p>
  </div>
)}

{activity.running_index && (
  <div>
    <p className="text-sm text-muted">Running Index</p>
    <p className="text-lg">{activity.running_index}</p>
  </div>
)}

{activity.hrv_rmssd && (
  <div>
    <p className="text-sm text-muted">HRV</p>
    <p className="text-lg">{activity.hrv_rmssd}ms</p>
  </div>
)}
```

**Fichiers à modifier** :
- `frontend/app/app/activities/[id]/page.tsx`
- `frontend/app/app/activities/ActivitiesContent.tsx` (filtres)

---

### Priorité 4 — Heatmap / Routes (Impact Élevé à Long Terme)

**Problème** : Pas de visualisation géographique des entraînements.

**Solution** :
1. Créer une page `/app/explore/heatmap`
2. Agréger tous les GPS tracks de l'utilisateur
3. Afficher une heatmap avec intensité par fréquence
4. Permettre de créer des routes depuis les tracks
5. Partager des routes avec d'autres utilisateurs

**Nouvelle fonctionnalité** :
- Page heatmap
- Détection automatique de segments récurrents
- Classements sur segments (KOM/QOM)
- Routes partagées

**Fichiers à créer** :
- `frontend/app/app/explore/heatmap/page.tsx`
- `backend/src/routes/heatmap.js`
- `backend/src/services/heatmap.service.js`

---

## 📊 Tableau Récapitulatif

| Donnée | Stockée | Utilisée | Priorité | Impact |
|--------|---------|----------|----------|--------|
| **GPS / Polyline** | ✅ | ❌ | **P1** | **Critique** |
| **Power Stream** | ✅ | ⚠️ | **P2** | **Modéré** |
| **HR Stream** | ✅ | ✅ | - | - |
| **Cadence Stream** | ✅ | ✅ | - | - |
| **Altitude Stream** | ✅ | ✅ | - | - |
| **Velocity Stream** | ✅ | ✅ | - | - |
| **Splits** | ✅ | ✅ | - | - |
| **Elev High/Low** | ✅ | ❌ | **P3** | **Mineur** |
| **NP / VI** | ✅ | ❌ | **P2** | **Modéré** |
| **Running Index** | ✅ | ❌ | **P3** | **Mineur** |
| **HRV par activité** | ✅ | ❌ | **P3** | **Mineur** |
| **Flags (race, commute)** | ✅ | ❌ | **P3** | **Mineur** |
| **Gear** | ✅ | ❌ | **P3** | **Mineur** |
| **Notes** | ✅ | ❌ | **P3** | **Mineur** |
| **Heatmap** | ✅ | ❌ | **P4** | **Élevé (LT)** |

---

## 🎯 Roadmap Recommandée

### Phase 1 — Affichage GPS (1-2 jours)
- [ ] Afficher carte dans page détail activité
- [ ] Décoder polyline JSON
- [ ] Markers départ/arrivée/km
- [ ] Popup avec stats par point

### Phase 2 — Power Charts (1 jour)
- [ ] Chart puissance
- [ ] Calcul NP depuis stream
- [ ] Calcul VI
- [ ] Distribution zones de puissance

### Phase 3 — Métriques Avancées (1 jour)
- [ ] Afficher elev_high/low
- [ ] Afficher running_index
- [ ] Afficher HRV par activité
- [ ] Filtres race/commute
- [ ] Édition notes

### Phase 4 — Heatmap & Routes (3-5 jours)
- [ ] Page heatmap
- [ ] Agrégation GPS tracks
- [ ] Détection segments
- [ ] Classements segments
- [ ] Routes partagées

---

## 🔍 Vérification Finale

### Backend ✅
- ✅ Toutes les données sont récupérées et stockées
- ✅ Tous les algorithmes scientifiques sont implémentés
- ✅ Tous les calculs (TSS, TRIMP, VDOT, PMC, ACWR) fonctionnent
- ✅ Les routes API retournent toutes les données

### Frontend ⚠️
- ✅ Les métriques de base sont affichées
- ✅ Les charts HR/cadence/altitude fonctionnent
- ✅ Les splits sont affichés
- ✅ L'analyse avancée fonctionne
- ❌ **GPS / Carte jamais affichée** (Gap Critique)
- ❌ **Power stream jamais affiché** (Gap Modéré)
- ❌ **Métriques avancées jamais affichées** (Gap Mineur)

---

## Conclusion

Le projet DrawRun a une **architecture solide** avec des algorithmes scientifiques validés et un système de sync complet. Les données GPS, streams, et métriques avancées sont maintenant **100% récupérées et stockées**.

**Le gap principal est dans l'affichage frontend** :
- **Critique** : GPS / Carte jamais affichée
- **Modéré** : Power stream jamais affiché
- **Mineur** : Métriques avancées jamais affichées

**Recommandation** : Implémenter les Priorités 1 et 2 (GPS + Power) en priorité pour exploiter pleinement les données synchronisées.
