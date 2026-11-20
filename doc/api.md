# API QueenBee — Contrat v1

URL de base : `http://localhost:3000`

Tous les corps de requête et de réponse sont en JSON (`Content-Type: application/json`). Les données sont stockées dans PostgreSQL.

## Format des erreurs

Toutes les erreurs suivent la RFC 9457, avec l'en-tête `Content-Type: application/problem+json` :

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "weight_kg doit être inférieur ou égal à 150. humidity_pct doit être inférieur ou égal à 100."
}
```

| status | title                   |
|--------|-------------------------|
| 400    | Requête invalide        |
| 404    | Ressource introuvable   |
| 409    | Conflit                 |
| 413    | Contenu trop volumineux |
| 500    | Erreur interne          |

`title` est le même pour toutes les erreurs d'un même code. `detail` décrit le cas précis. Une réponse d'erreur ne contient jamais de pile d'exécution ni de message SQL.

### Validation des entrées

Les corps et les paramètres de requête sont vérifiés par des schémas Joi avant d'atteindre le code métier :
- toutes les erreurs sont signalées d'un coup, dans un seul `detail`, séparées par une espace (ex. « timestamp est obligatoire. weight_kg est obligatoire. ») ;
- un champ non déclaré est refusé : 400 « author_id n'est pas un champ autorisé. » ;
- les paramètres de requête sont convertis : `?limit=10` devient le nombre 10.

### Erreurs communes à toutes les routes

- 400 : le corps de la requête n'est pas un JSON valide
- 400 : les données ne respectent pas une règle de la base (« Les données envoyées ne respectent pas les règles de la base. »)
- 404 : aucune route ne correspond à la méthode et au chemin demandés
- 413 : le corps de la requête dépasse 1 Mo
- 500 : erreur interne inattendue (« Une erreur interne est survenue. »)

---

### GET /health

Indique que l'API répond.

200 :
```json
{ "status": "ok" }
```

---

### GET /api/hives

Liste des ruches, triées par identifiant, éventuellement filtrées par site.

Paramètres de requête
- site_id : texte non vide, facultatif. Ne renvoie que les ruches de ce site. Absent : pas de filtre. Un site inconnu renvoie une liste vide.

Aucun autre paramètre n'est accepté.

200 :
```json
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "ref_lat": 12.5743, "ref_lon": -16.2873, "status": "active" }
]
```

400 : `site_id` vide, ou paramètre inconnu
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "site_id ne peut pas être vide."
}
```

---

### GET /api/hives/:id

Une ruche par son identifiant.

Paramètres de chemin
- id : texte, identifiant de la ruche (ex. `SN-CASA-001`)

200 :
```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "ref_lat": 12.5743, "ref_lon": -16.2873, "status": "active" }
```

404 : aucune ruche ne porte cet identifiant
```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant XX-NOPE-999."
}
```

---

### POST /api/hives/:id/measures

Enregistre une mesure envoyée par la passerelle d'un site (§ 6.5). La mesure garde le `timestamp` de la trame, c'est-à-dire l'instant où le capteur l'a prise.

Paramètres de chemin
- id : texte, identifiant de la ruche

Corps
- Obligatoires : `timestamp` (date ISO 8601), `weight_kg` (nombre)
- Facultatifs : `hive_id` (s'il est présent, il doit être égal à `:id`), `site_id`, et les champs mesurés ci-dessous, qui acceptent aussi `null`
- Aucun autre champ n'est accepté.

`hive_id` et `site_id` de la réponse sont toujours repris de la ruche du chemin.

Plages physiques (UC-CY02) :

| Champ                   | Type   | Min  | Max |
|-------------------------|--------|------|-----|
| position_lat            | nombre | -90  | 90  |
| position_lon            | nombre | -180 | 180 |
| weight_kg               | nombre | 0    | 150 |
| temp_internal_c         | nombre | -10  | 60  |
| temp_external_c         | nombre | -20  | 60  |
| humidity_pct            | entier | 0    | 100 |
| acoustic_activity_score | nombre | 0    | 1   |
| battery_pct             | entier | 0    | 100 |

201 : la mesure enregistrée
```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-11-06T08:00:00.000Z",
  "position_lat": null,
  "position_lon": null,
  "weight_kg": 36.8,
  "temp_internal_c": null,
  "temp_external_c": null,
  "humidity_pct": null,
  "acoustic_activity_score": null,
  "battery_pct": null
}
```

400 : champ obligatoire absent, type faux, valeur hors plage, champ non déclaré, ou `hive_id` du corps différent de celui du chemin
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "timestamp est obligatoire. weight_kg est obligatoire."
}
```

404 : aucune ruche ne porte cet identifiant

409 : une mesure existe déjà pour cette ruche à cet instant (`timestamp`)
```json
{
  "type": "about:blank",
  "title": "Conflit",
  "status": 409,
  "detail": "Cette ressource existe déjà."
}
```

---

### GET /api/hives/:id/measures

Historique des mesures d'une ruche, de la plus récente à la plus ancienne.

Paramètres de chemin
- id : texte, identifiant de la ruche

Paramètres de requête
- limit : entier de 1 à 500, 50 par défaut
- offset : entier positif ou nul, 0 par défaut

200 :
```json
{
  "items": [
    {
      "hive_id": "SN-CASA-001",
      "site_id": "SN-CASA",
      "timestamp": "2026-10-31T23:45:00.000Z",
      "position_lat": 12.574304,
      "position_lon": -16.287302,
      "weight_kg": 36.89,
      "temp_internal_c": 34.4,
      "temp_external_c": 23.7,
      "humidity_pct": 64,
      "acoustic_activity_score": 0.03,
      "battery_pct": 80
    }
  ],
  "limit": 50,
  "offset": 0
}
```

400 : `limit` ou `offset` invalide (pas un nombre, pas un entier, hors bornes), ou paramètre inconnu
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "limit doit être un nombre."
}
```

404 : aucune ruche ne porte cet identifiant

---

### GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne.

Paramètres de chemin
- id : texte, identifiant de la ruche

200 :
```json
{
  "items": [
    {
      "id": "90b53399-ba15-4bc4-8cb0-6fef6b0bca20",
      "hive_id": "SN-CASA-001",
      "author_id": "88467c9f-4c6c-45f5-bbf8-d5464281f105",
      "inspected_at": "2026-10-24T10:12:21.538Z",
      "colony_status": "normale",
      "queen_present": true,
      "observations": "Activité normale, quelques cellules royales à surveiller"
    }
  ]
}
```

404 : aucune ruche ne porte cet identifiant

---

### POST /api/hives/:id/inspections

Enregistre une inspection saisie dans l'application mobile. L'identifiant est un UUID choisi par l'application, pas par le serveur. L'auteur (`author_id`) est fixé par le serveur, jamais par le client.

Paramètres de chemin
- id : texte, identifiant de la ruche

Corps
- Obligatoires :
  - `id` : UUID (ex. `3f2c8a6e-1b4d-4c9a-9e7f-2a5b6c7d8e9f`)
  - `inspected_at` : date ISO 8601, pas dans le futur (ex. `2026-10-31T09:30:00Z`)
  - `colony_status` : `forte`, `normale`, `faible` ou `morte`
- Facultatifs :
  - `hive_id` : s'il est présent, il doit être égal à `:id`
  - `queen_present` : booléen ou `null` ; `null` s'il est absent
  - `observations` : texte de 2 000 caractères au plus, vide ou `null` ; `null` s'il est absent
- Aucun autre champ n'est accepté (en particulier `author_id`).

201 : l'inspection créée
```json
{
  "id": "3f2c8a6e-1b4d-4c9a-9e7f-2a5b6c7d8e9f",
  "hive_id": "SN-CASA-001",
  "author_id": "88467c9f-4c6c-45f5-bbf8-d5464281f105",
  "inspected_at": "2026-10-31T09:30:00.000Z",
  "colony_status": "forte",
  "queen_present": true,
  "observations": "Couvain compact, réserves de miel suffisantes."
}
```

400 : champ obligatoire absent, type ou valeur invalide, date dans le futur, champ non déclaré, ou `hive_id` du corps différent de celui du chemin
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "colony_status doit valoir l'une de ces valeurs : [forte, normale, faible, morte]."
}
```

404 : aucune ruche ne porte cet identifiant

409 : une inspection porte déjà cet identifiant
```json
{
  "type": "about:blank",
  "title": "Conflit",
  "status": 409,
  "detail": "Une inspection porte déjà l'identifiant 3f2c8a6e-1b4d-4c9a-9e7f-2a5b6c7d8e9f."
}
```
