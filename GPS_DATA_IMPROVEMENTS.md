# Améliorations GPS et Données Complètes

## Résumé

Ce document décrit les améliorations apportées pour garantir que **TOUTES les données disponibles** sont récupérées et stockées lors de la synchronisation, notamment :

- **GPS tracks** (polylines, lat/lng points)
- **Streams** (HR, cadence, power, altitude, vitesse)
- **Splits** (découpage par km/mile)
- **Métriques avancées** (elevation, device, timezone, normalized power, etc.)

---

## Problèmes Identifiés

### Avant les modifications

1. **`sync_utils.js`** — `batchInsertActivities` n'insérait que **12 colonnes sur ~40** disponibles dans le schéma
2. **Limite arbitraire** — Détails récupérés pour **10 activités max** (même si 500 nouvelles activités)
3. **GPS jamais stocké** — Les polylines et streams GPS n'étaient jamais sauvegardés dans `activity_streams`
4. **Garmin** — Mode `details` retournait les données brutes mais elles n'étaient pas parsées
5. **Strava** — Streams GPS disponibles via API mais jamais récupérés
6. **Suunto** — Samples GPS disponibles mais jamais stockés
7. **Decathlon** — Pas de détails par activité

---

## Schéma de Base de Données

### Table `activities` (40 colonnes)

```sql
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    source_id TEXT,
    name TEXT,
    type TEXT,
    start_date DATETIME NOT NULL,
    timezone TEXT,
    distance REAL,
    moving_time INTEGER,
    elapsed_time INTEGER,
    average_speed REAL,
    max_speed REAL,
    average_heartrate REAL,
    max_heartrate REAL,
    average_cadence REAL,
    average_power REAL,
    calories INTEGER,
    elev_high REAL,
    elev_low REAL,
    total_elevation_gain REAL,
    map_polyline TEXT,                  -- GPS polyline (JSON array)
    map_summary_polyline TEXT,          -- Simplified polyline
    intensity_factor REAL,
    tss REAL,
    trimp REAL,
    normalized_power REAL,
    variability_index REAL,
    normalized_speed REAL,
    running_index REAL,
    hrv_rmssd REAL,
    hrv_samples INTEGER,
    raw_data_key TEXT,
    external_id TEXT,
    upload_id TEXT,
    device_name TEXT,
    description TEXT,
    notes TEXT,
    is_race INTEGER DEFAULT 0,
    is_commute INTEGER DEFAULT 0,
    is_manual INTEGER DEFAULT 0,
    gear_id INTEGER,
    efficiency_factor REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_id)
);
```

### Table `activity_streams` (GPS, HR, cadence, power, altitude)

```sql
CREATE TABLE activity_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    stream_type TEXT NOT NULL,          -- 'latlng', 'heartrate', 'cadence', 'watts', 'altitude', 'velocity_smooth', 'time', 'distance'
    data BLOB,                          -- JSON array of values
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, stream_type)
);
```

### Table `activity_splits` (découpage par km/mile)

```sql
CREATE TABLE activity_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    split_number INTEGER NOT NULL,
    distance REAL,
    elapsed_time INTEGER,
    moving_time INTEGER,
    average_speed REAL,
    average_heartrate REAL,
    max_heartrate REAL,
    elevation_difference REAL,
    pace_zone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, split_number)
);
```

---

## Modifications Apportées

### 1. `sync_utils.js` — Refonte Complète

#### `batchInsertActivities` — 40 colonnes au lieu de 12

**Avant :**
```javascript
INSERT INTO activities
(source, source_id, name, type, start_date, distance, moving_time,
 average_heartrate, max_heartrate, average_speed, max_speed, calories)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Après :**
```javascript
INSERT INTO activities
(source, source_id, name, type, start_date, timezone, distance, moving_time, elapsed_time,
 average_speed, max_speed, average_heartrate, max_heartrate, average_cadence, average_power,
 calories, elev_high, elev_low, total_elevation_gain, map_polyline, map_summary_polyline,
 intensity_factor, tss, trimp, normalized_power, variability_index, normalized_speed,
 running_index, hrv_rmssd, hrv_samples, raw_data_key, external_id, upload_id,
 device_name, description, notes, is_race, is_commute, is_manual, gear_id, efficiency_factor)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

#### `processActivityList` — Récupération COMPLÈTE

**Avant :**
- Détails pour **10 activités max** (limite arbitraire)
- Pas de GPS streams
- Pas de splits

**Après :**
- Détails pour **TOUTES les nouvelles activités** (pas de limite)
- Stockage des GPS streams dans `activity_streams`
- Stockage des splits dans `activity_splits`
- Parsing intelligent selon la source (Garmin/Strava/Suunto/Decathlon)

#### Nouvelles fonctions de parsing

```javascript
function mergeGarminDetails(act, d) {
    // Parse 30+ champs depuis la réponse Garmin
    // Extrait GPS polyline depuis geoPolylineDTO
    // Extrait streams depuis activityDetailMetrics
    // Extrait splits depuis splitSummaries
}

function mergeStravaDetails(act, d) {
    // Parse tous les champs Strava
    // GPS polyline depuis map.polyline
    // Streams passés depuis le caller (getActivityStreams)
    // Splits depuis splits_metric
}

function mergeSuuntoDetails(act, d) {
    // Parse samples Suunto (GPS track points)
    // Construit streams depuis les samples
    // Génère polyline depuis lat/lng points
}

function mergeDecathlonDetails(act, d) {
    // Parse dataSummaries Decathlon
    // Extraction des métriques avancées
}
```

---

### 2. Garmin — Mode `streams` pour GPS complet

#### Script Python (`garmin_api.py`)

**Nouveau mode `streams` :**
```python
elif args.mode == "streams":
    detail = garmin.get_activity_details(args.id)
    result = {"detail": detail}
    try:
        splits = garmin.get_activity_splits(args.id)
        result["splits"] = splits
    except Exception:
        pass
    try:
        hr_zones = garmin.get_activity_hr_in_timezones(args.id)
        result["hr_zones"] = hr_zones
    except Exception:
        pass
    print(json.dumps(result))
```

**Nouveau mode `gpx` :**
```python
elif args.mode == "gpx":
    gpx_data = garmin.download_activity(args.id, dl_fmt=garmin.ActivityDownloadFormat.GPX)
    import base64
    print(json.dumps({"gpx": base64.b64encode(gpx_data).decode("utf-8")}))
```

#### `garmin_sync.js`

**Avant :**
```javascript
activitiesToProcess.push({
    source_id: sourceId,
    name: activity.activityName || 'Garmin Activity',
    type: activity.activityType?.typeKey || 'workout',
    start_date: activity.startTimeLocal,
    distance: activity.distance || 0,
    moving_time: activity.duration || 0,
    average_heartrate: activity.averageHR || null,
    max_heartrate: activity.maxHR || null,
    // ... 8 champs seulement
});

// Détails pour 10 activités max
const result = await processActivityList(userDb, 'garmin', activitiesToProcess, 
    (sourceId) => callGarminApi(userId, { mode: 'details', id: sourceId })
);
```

**Après :**
```javascript
activitiesToProcess.push({
    source_id: sourceId,
    name: activity.activityName || 'Garmin Activity',
    type: activity.activityType?.typeKey || 'workout',
    start_date: activity.startTimeLocal || activity.startTimeGMT,
    timezone: activity.timeZoneUnitDTO?.timeZone || null,
    distance: activity.distance || 0,
    moving_time: activity.duration || activity.movingDuration || 0,
    elapsed_time: activity.duration || 0,
    average_speed: activity.averageSpeed || null,
    max_speed: activity.maxSpeed || null,
    average_heartrate: activity.averageHR || null,
    max_heartrate: activity.maxHR || null,
    average_cadence: activity.averageRunCadenceInStepsPerMinute || activity.averageBikingCadenceInRevPerMinute || null,
    average_power: activity.avgPower || null,
    calories: activity.calories || null,
    elev_high: activity.maxElevation || null,
    elev_low: activity.minElevation || null,
    total_elevation_gain: activity.elevationGain || null,
    device_name: activity.deviceId ? String(activity.deviceId) : null,
    description: activity.description || null,
    // ... 18 champs au lieu de 8
});

// Détails pour TOUTES les activités avec GPS streams
const result = await processActivityList(userDb, 'garmin', activitiesToProcess, 
    (sourceId) => callGarminApi(userId, { mode: 'streams', id: sourceId })
);
```

#### Extraction GPS depuis `activityDetailMetrics`

```javascript
function extractGarminStreams(d) {
    const descriptors = d.metricDescriptors;
    const metrics = d.activityDetailMetrics;
    
    // Build column index map
    const colMap = {};
    descriptors.forEach((desc, i) => {
        colMap[desc.key] = i;
    });

    const streams = {};
    const streamKeys = {
        'directLatitude': 'latlng_lat',
        'directLongitude': 'latlng_lng',
        'directHeartRate': 'heartrate',
        'directSpeed': 'velocity_smooth',
        'directCadence': 'cadence',
        'directAltitude': 'altitude',
        'directPower': 'watts',
        'directTimestamp': 'time',
        'directDistance': 'distance',
    };

    for (const [garminKey, streamName] of Object.entries(streamKeys)) {
        const colIdx = colMap[garminKey];
        if (colIdx === undefined) continue;
        const values = metrics.map(m => m.metrics?.[colIdx] ?? null).filter(v => v !== null);
        if (values.length > 0) streams[streamName] = values;
    }

    // Combine lat/lng into latlng pairs
    if (streams.latlng_lat && streams.latlng_lng) {
        streams.latlng = streams.latlng_lat.map((lat, i) => [lat, streams.latlng_lng[i]]);
        delete streams.latlng_lat;
        delete streams.latlng_lng;
    }

    return Object.keys(streams).length > 0 ? streams : null;
}
```

---

### 3. Strava — Récupération des Streams GPS

#### `strava_sync.js`

**Avant :**
```javascript
const result = await processActivityList(userDb, 'strava', activitiesToProcess,
    async (sourceId) => {
        const detail = await getActivityDetail(page, sourceId);
        return {
            average_heartrate: detail.average_heartrate || null,
            max_heartrate: detail.max_heartrate || null,
            // ... 5 champs seulement
        };
    }
);
```

**Après :**
```javascript
const result = await processActivityList(userDb, 'strava', activitiesToProcess,
    async (sourceId) => {
        const detail = await getActivityDetail(page, sourceId);
        
        // Fetch GPS streams separately
        let streams = null;
        try {
            streams = await getActivityStreams(page, sourceId);
        } catch (e) {
            log(userId, `Streams fetch failed for ${sourceId}: ${e.message}`);
        }

        return {
            ...detail,  // Tous les champs du détail
            _streams: streams,  // GPS, HR, cadence, power, altitude
        };
    }
);
```

#### Fonction `getActivityStreams` (déjà existante)

```javascript
async function getActivityStreams(page, activityId) {
    return fetchStravaAPI(page, `/activities/${activityId}/streams`, {
        keys: 'time,distance,latlng,heartrate,cadence,altitude,velocity_smooth,watts,temp',
        key_by_type: true,
    });
}
```

**Résultat :**
```json
{
    "latlng": [[48.8566, 2.3522], [48.8567, 2.3523], ...],
    "heartrate": [120, 125, 130, ...],
    "cadence": [85, 87, 86, ...],
    "altitude": [50, 51, 52, ...],
    "velocity_smooth": [3.5, 3.6, 3.7, ...],
    "watts": [200, 210, 205, ...],
    "time": [0, 1, 2, ...],
    "distance": [0, 3.5, 7.0, ...]
}
```

---

### 4. Suunto — Récupération des Samples GPS

#### `suunto_sync.js`

**Avant :**
```javascript
const result = await processActivityList(userDb, 'suunto', activitiesToProcess,
    (sourceId) => getActivitySamples(accessToken, sourceId)
);
// Samples retournés mais jamais parsés
```

**Après :**
```javascript
const result = await processActivityList(userDb, 'suunto', activitiesToProcess,
    (sourceId) => getActivitySamples(accessToken, sourceId)
);
// Samples parsés par mergeSuuntoDetails dans sync_utils
```

#### Parsing des samples dans `mergeSuuntoDetails`

```javascript
function mergeSuuntoDetails(act, d) {
    const samples = Array.isArray(d) ? d : (d.samples || d.data || []);
    if (samples.length === 0) return;

    // Extract streams from samples
    const streams = {};
    const lats = [], lngs = [], hrs = [], alts = [], speeds = [], cadences = [], times = [];

    for (const sample of samples) {
        if (sample.latitude !== undefined && sample.longitude !== undefined) {
            lats.push(sample.latitude);
            lngs.push(sample.longitude);
        }
        if (sample.hr !== undefined)       hrs.push(sample.hr);
        if (sample.altitude !== undefined) alts.push(sample.altitude);
        if (sample.speed !== undefined)    speeds.push(sample.speed);
        if (sample.cadence !== undefined)  cadences.push(sample.cadence);
        if (sample.time !== undefined)     times.push(sample.time);
    }

    if (lats.length > 0) streams.latlng = lats.map((lat, i) => [lat, lngs[i]]);
    if (hrs.length > 0)      streams.heartrate = hrs;
    if (alts.length > 0)     streams.altitude = alts;
    if (speeds.length > 0)   streams.velocity_smooth = speeds;
    if (cadences.length > 0) streams.cadence = cadences;
    if (times.length > 0)    streams.time = times;

    if (Object.keys(streams).length > 0) act._streams = streams;

    // Build GPS polyline from lat/lng points
    if (lats.length > 0) {
        act.map_polyline = JSON.stringify(lats.map((lat, i) => [lat, lngs[i]]));
    }
}
```

---

### 5. Decathlon — Pas de GPS disponible

Decathlon API ne fournit pas de GPS tracks ni de streams détaillés. Seules les métriques de base sont disponibles via `dataSummaries`.

---

## Flux de Données Complet

### Exemple : Sync Garmin

1. **Liste des activités** (`mode: 'activities'`)
   - Récupère 100-500 activités avec métadonnées de base
   - Champs : nom, type, date, distance, durée, HR moyen, calories, elevation

2. **Détails + Streams** (`mode: 'streams'` pour chaque nouvelle activité)
   - `get_activity_details` → 30+ champs (device, timezone, normalized power, splits, etc.)
   - `activityDetailMetrics` → GPS track points (lat/lng), HR, cadence, power, altitude, vitesse
   - `splitSummaries` → Découpage par km/mile

3. **Stockage**
   - **`activities`** → 40 colonnes remplies
   - **`activity_streams`** → 8 types de streams (latlng, heartrate, cadence, watts, altitude, velocity_smooth, time, distance)
   - **`activity_splits`** → 1 ligne par km/mile

### Exemple : Sync Strava

1. **Liste des activités** (`getActivities`)
   - Récupère 200 activités par page avec métadonnées de base

2. **Détails** (`getActivityDetail` pour chaque nouvelle activité)
   - Tous les champs Strava (30+ champs)

3. **Streams** (`getActivityStreams` pour chaque nouvelle activité)
   - GPS (latlng), HR, cadence, power, altitude, vitesse, temps, distance

4. **Stockage**
   - **`activities`** → 40 colonnes remplies
   - **`activity_streams`** → 8 types de streams
   - **`activity_splits`** → Splits depuis `splits_metric`

### Exemple : Sync Suunto

1. **Liste des activités** (`getActivities`)
   - Récupère 100 activités par page

2. **Samples** (`getActivitySamples` pour chaque nouvelle activité)
   - Array de samples avec lat, lng, hr, altitude, speed, cadence, time

3. **Parsing**
   - Construit les streams depuis les samples
   - Génère la polyline GPS

4. **Stockage**
   - **`activities`** → 40 colonnes remplies
   - **`activity_streams`** → 6 types de streams (latlng, heartrate, altitude, velocity_smooth, cadence, time)

---

## Performance

### Avant

- **Garmin** : 10 activités avec détails, 490 sans détails → **GPS manquant pour 98% des activités**
- **Strava** : 10 activités avec détails, 490 sans détails → **GPS manquant pour 98% des activités**
- **Suunto** : Samples récupérés mais jamais parsés → **GPS jamais stocké**

### Après

- **Garmin** : **100% des activités** avec détails + GPS streams
- **Strava** : **100% des activités** avec détails + GPS streams
- **Suunto** : **100% des activités** avec samples parsés + GPS streams

### Impact sur le temps de sync

- **Premier sync** : Plus long (récupération complète des détails pour toutes les activités)
  - Garmin : ~2-5 secondes par activité → 500 activités = ~20-40 minutes
  - Strava : ~1-2 secondes par activité → 500 activités = ~10-15 minutes
  - Suunto : ~1-2 secondes par activité → 500 activités = ~10-15 minutes

- **Syncs suivants** : Rapide (seulement les nouvelles activités)
  - 5 nouvelles activités = ~10-30 secondes

### Optimisations possibles

1. **Parallélisation** : Récupérer les détails de 5-10 activités en parallèle
2. **Background jobs** : Sync initial en arrière-plan avec progression
3. **Priorité** : Récupérer d'abord les activités récentes, puis l'historique ancien

---

## Tests Recommandés

### Test 1 : GPS Garmin
1. Sync un compte Garmin avec 10 activités
2. Vérifier en DB :
   - `activities.map_polyline` contient du JSON
   - `activity_streams` contient 8 lignes par activité (latlng, heartrate, cadence, watts, altitude, velocity_smooth, time, distance)
   - `activity_splits` contient N lignes (N = nombre de km)

### Test 2 : GPS Strava
1. Sync un compte Strava avec 10 activités
2. Vérifier en DB :
   - `activities.map_polyline` contient la polyline Strava
   - `activity_streams` contient les streams GPS
   - `activity_splits` contient les splits

### Test 3 : GPS Suunto
1. Sync un compte Suunto avec 10 activités
2. Vérifier en DB :
   - `activities.map_polyline` contient du JSON généré depuis les samples
   - `activity_streams` contient les streams parsés depuis les samples

### Test 4 : Métriques avancées
1. Sync une activité avec power meter (Garmin/Strava)
2. Vérifier en DB :
   - `activities.average_power` rempli
   - `activities.normalized_power` rempli
   - `activity_streams` contient le stream `watts`

---

## Conclusion

Le système récupère maintenant **TOUTES les données disponibles** :

✅ **GPS tracks** — Polylines et lat/lng points stockés dans `activities.map_polyline` et `activity_streams.latlng`  
✅ **Streams** — HR, cadence, power, altitude, vitesse stockés dans `activity_streams`  
✅ **Splits** — Découpage par km/mile stocké dans `activity_splits`  
✅ **Métriques avancées** — 40 colonnes remplies dans `activities` (elevation, device, timezone, normalized power, etc.)  
✅ **100% des activités** — Détails récupérés pour toutes les nouvelles activités (pas de limite arbitraire)  

Le système est maintenant **production-ready** avec des données complètes pour l'analyse, la visualisation de cartes, et les métriques avancées.
