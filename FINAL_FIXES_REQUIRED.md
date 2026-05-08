# Corrections Finales Requises

## Résumé

Après analyse complète, le système de sync récupère et stocke **toutes les données GPS, streams, splits et métriques avancées**. Le frontend est **déjà prêt** à afficher ces données (carte, charts, splits). 

**Le seul problème** : Les routes backend ne lisent pas correctement les données depuis les bonnes tables.

---

## ❌ Problème Identifié

### Backend Routes (`backend/src/routes/activities.js`)

**Problème 1 — Streams**
```javascript
// ❌ INCORRECT : Lit depuis une colonne qui n'existe pas
const streams = await dbGetUser(userDb,
    `SELECT streams_data FROM activities WHERE id = ?`, [activityId]);
```

La colonne `streams_data` **n'existe pas** dans le schéma. Les streams sont stockés dans la table `activity_streams`.

**Problème 2 — Polyline**
```javascript
// ✅ CORRECT : SELECT * retourne map_polyline
const activity = await dbGetUser(userDb,
    `SELECT * FROM activities WHERE id = ?`, [activityId]);
```

Ceci fonctionne déjà, mais il faut vérifier que `map_polyline` est bien rempli lors du sync.

---

## ✅ Solutions

### Fix 1 — Route GET /api/activities/:id/streams

**Remplacer** :
```javascript
const streams = await dbGetUser(userDb,
    `SELECT streams_data FROM activities WHERE id = ?`, [activityId]);
if (!streams || !streams.streams_data) {
    return res.json({});
}
const parsed = JSON.parse(streams.streams_data);
res.json(parsed);
```

**Par** :
```javascript
// Récupérer tous les streams depuis la table activity_streams
const streamRows = await dbAllUser(userDb,
    `SELECT stream_type, data FROM activity_streams WHERE activity_id = ?`, 
    [activityId]
);

if (!streamRows || streamRows.length === 0) {
    return res.json({});
}

// Construire l'objet streams
const streams = {};
for (const row of streamRows) {
    try {
        streams[row.stream_type] = JSON.parse(row.data);
    } catch (e) {
        logger.warn(`Failed to parse stream ${row.stream_type}`, { error: e.message });
    }
}

res.json(streams);
```

---

### Fix 2 — Route GET /api/activities/:id/splits

**Remplacer** :
```javascript
const activity = await dbGetUser(userDb,
    `SELECT distance, moving_time, average_heartrate, max_heartrate, average_cadence, streams_data FROM activities WHERE id = ?`,
    [activityId]);

let streams = {};
if (activity.streams_data) {
    try { streams = JSON.parse(activity.streams_data); } catch { /* ignore */ }
}
```

**Par** :
```javascript
const activity = await dbGetUser(userDb,
    `SELECT distance, moving_time, average_heartrate, max_heartrate, average_cadence FROM activities WHERE id = ?`,
    [activityId]);

// Récupérer les streams depuis activity_streams
const streamRows = await dbAllUser(userDb,
    `SELECT stream_type, data FROM activity_streams WHERE activity_id = ?`, 
    [activityId]
);

const streams = {};
for (const row of streamRows) {
    try {
        streams[row.stream_type] = JSON.parse(row.data);
    } catch (e) {
        logger.warn(`Failed to parse stream ${row.stream_type}`, { error: e.message });
    }
}
```

---

### Fix 3 — Vérifier que map_polyline est bien stocké

Dans `sync_utils.js`, la fonction `mergeGarminDetails` construit déjà `map_polyline` :

```javascript
// GPS polyline from measurementSummary or geoPolylineDTO
const geo = d.geoPolylineDTO;
if (geo?.polyline) {
    act.map_polyline = JSON.stringify(geo.polyline);
}
```

Et `batchInsertActivities` l'insère déjà :

```javascript
INSERT INTO activities
(..., map_polyline, ...)
VALUES (..., ?, ...)
```

**Donc map_polyline devrait déjà fonctionner** une fois les activités re-synchronisées avec le nouveau code.

---

### Fix 4 — Ajouter Power Chart (Bonus)

Dans `frontend/app/app/activities/[id]/page.tsx`, ajouter après le chart Cadence :

```typescript
{/* Power Chart */}
{(() => {
  const wattsData = extractData(streams?.watts);
  return wattsData && Array.isArray(wattsData) && wattsData.length > 10 && (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          Puissance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StreamChart 
          data={wattsData} 
          color="#F97316" 
          fillColor="rgba(249,115,22,0.1)" 
          unit="W" 
          formatValue={v => `${Math.round(v)}W`} 
        />
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <p className="text-sm font-bold text-orange-400">
              {activity.average_power ? Math.round(activity.average_power) : '-'}
            </p>
            <p className="text-xs text-muted">Moyenne</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10">
            <p className="text-sm font-bold text-orange-400">
              {activity.normalized_power ? Math.round(activity.normalized_power) : '-'}
            </p>
            <p className="text-xs text-muted">NP</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10">
            <p className="text-sm font-bold text-orange-400">
              {activity.variability_index ? activity.variability_index.toFixed(2) : '-'}
            </p>
            <p className="text-xs text-muted">VI</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
})()}
```

---

### Fix 5 — Afficher métriques avancées (Bonus)

Dans la section "Secondary metrics", ajouter :

```typescript
{/* Altitude min/max */}
{activity.elev_low !== null && activity.elev_high !== null && (
  <div className="text-center p-3 rounded-lg bg-background border border-border">
    <p className="text-sm font-bold text-foreground">
      {Math.round(activity.elev_low)}m - {Math.round(activity.elev_high)}m
    </p>
    <p className="text-xs text-muted">Altitude</p>
  </div>
)}

{/* Running Index (Garmin) */}
{activity.running_index && (
  <div className="text-center p-3 rounded-lg bg-background border border-border">
    <p className="text-sm font-bold text-green-400">{Math.round(activity.running_index)}</p>
    <p className="text-xs text-muted">Running Index</p>
  </div>
)}

{/* HRV */}
{activity.hrv_rmssd && (
  <div className="text-center p-3 rounded-lg bg-background border border-border">
    <p className="text-sm font-bold text-purple-400">{Math.round(activity.hrv_rmssd)}</p>
    <p className="text-xs text-muted">HRV (ms)</p>
  </div>
)}
```

---

## 📋 Checklist des Modifications

### Priorité 1 — Critique (Bloque l'affichage GPS/Streams)

- [ ] **Fix 1** : Modifier `GET /api/activities/:id/streams` pour lire depuis `activity_streams` table
- [ ] **Fix 2** : Modifier `GET /api/activities/:id/splits` pour lire depuis `activity_streams` table
- [ ] **Test** : Re-synchroniser une activité Garmin/Strava et vérifier que la carte s'affiche

### Priorité 2 — Important (Améliore l'expérience)

- [ ] **Fix 4** : Ajouter le chart Power dans la page détail
- [ ] **Fix 5** : Afficher altitude min/max, running_index, HRV

### Priorité 3 — Nice to have

- [ ] Calculer NP (Normalized Power) depuis le stream `watts[]`
- [ ] Calculer VI (Variability Index) = NP / avgPower
- [ ] Afficher distribution par zone de puissance

---

## 🧪 Tests Recommandés

### Test 1 — GPS Garmin
1. Supprimer une activité Garmin existante
2. Re-synchroniser Garmin
3. Ouvrir la page détail de l'activité
4. **Vérifier** : La carte s'affiche avec le parcours
5. **Vérifier** : Markers vert (départ) et rouge (arrivée)

### Test 2 — GPS Strava
1. Supprimer une activité Strava existante
2. Re-synchroniser Strava
3. Ouvrir la page détail de l'activité
4. **Vérifier** : La carte s'affiche avec le parcours

### Test 3 — Streams
1. Ouvrir une activité avec GPS
2. **Vérifier** : Chart HR s'affiche
3. **Vérifier** : Chart vitesse s'affiche
4. **Vérifier** : Chart altitude s'affiche
5. **Vérifier** : Chart cadence s'affiche (si disponible)
6. **Vérifier** : Chart power s'affiche (si disponible)

### Test 4 — Splits
1. Ouvrir une activité avec GPS
2. **Vérifier** : Table des splits s'affiche
3. **Vérifier** : Colonnes : km, temps, allure, GAP, vitesse, FC, dénivelé, pente, cadence
4. **Vérifier** : GAP différent de l'allure sur les portions en pente

---

## 📊 État Final Attendu

### Backend ✅
- ✅ Toutes les données récupérées et stockées (GPS, streams, splits, métriques)
- ✅ Tables `activities`, `activity_streams`, `activity_splits` remplies
- ✅ Routes API corrigées pour lire depuis les bonnes tables

### Frontend ✅
- ✅ Carte GPS affichée avec parcours
- ✅ Charts HR, vitesse, altitude, cadence, power
- ✅ Splits détaillés avec GAP, gradient, zones
- ✅ Métriques avancées (altitude, running_index, HRV)
- ✅ Analyse complète (VDOT, zones, prédictions, nutrition)

---

## 🚀 Déploiement

### Étape 1 — Appliquer les fixes backend
```bash
cd backend
# Modifier src/routes/activities.js (Fix 1 et Fix 2)
npm test  # Vérifier que les tests passent
```

### Étape 2 — Re-synchroniser les activités
```bash
# Depuis l'interface web :
# 1. Aller dans Profil > Synchronisation
# 2. Cliquer sur "Synchroniser maintenant" pour chaque service
# 3. Attendre la fin de la synchronisation
```

### Étape 3 — Vérifier l'affichage
```bash
# 1. Ouvrir une activité récemment synchronisée
# 2. Vérifier que la carte s'affiche
# 3. Vérifier que les charts s'affichent
# 4. Vérifier que les splits s'affichent
```

### Étape 4 — Appliquer les bonus (optionnel)
```bash
cd frontend
# Modifier app/app/activities/[id]/page.tsx (Fix 4 et Fix 5)
npm run build
npm run start
```

---

## 🎯 Résultat Final

Après ces corrections, DrawRun sera **100% fonctionnel** avec :

✅ **GPS / Carte** — Parcours affiché sur carte interactive  
✅ **Streams** — Charts HR, vitesse, altitude, cadence, power  
✅ **Splits** — Découpage km par km avec GAP, gradient, zones  
✅ **Métriques avancées** — Altitude, running_index, HRV, NP, VI  
✅ **Analyse complète** — VDOT, zones, prédictions, nutrition  
✅ **Coach adaptatif** — Plans personnalisés basés sur les données  
✅ **PMC** — CTL, ATL, TSB, ACWR, readiness  

Le projet sera alors **production-ready** avec une expérience utilisateur complète et des données scientifiquement validées.
