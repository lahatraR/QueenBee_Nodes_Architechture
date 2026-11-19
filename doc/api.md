# API QueenBee — Contrat v0

URL de base : `http://localhost:3000`

Tous les corps de requête et de réponse sont en JSON (`Content-Type: application/json`).

## Format des erreurs

Toutes les erreurs suivent la RFC 9457, avec l'en-tête `Content-Type: application/problem+json` :

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

| status | title                 |
|--------|-----------------------|
| 400    | Requête invalide      |
| 404    | Ressource introuvable |
| 409    | Conflit               |
| 500    | Erreur interne        |

`title` est le même pour toutes les erreurs d'un même code. `detail` décrit le cas précis. Une réponse d'erreur ne contient jamais de pile d'exécution.

Erreurs communes à toutes les routes :
- 404 : aucune route ne correspond à la méthode et au chemin demandés
- 400 : le corps de la requête n'est pas un JSON valide
- 500 : erreur interne inattendue

---

### GET /health

Indique que l'API répond.

200 :
```json
{ "status": "ok" }
```

---

### GET /api/hives

Liste des ruches, éventuellement filtrée par site.

Paramètres de requête
- site_id : texte, facultatif. Ne renvoie que les ruches de ce site. Absent ou vide : pas de filtre. Un site inconnu renvoie une liste vide.

200 :
```json
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
]
```

Cette route ne renvoie pas d'erreur spécifique.

---

### GET /api/hives/:id

Une ruche par son identifiant.

Paramètres de chemin
- id : texte, identifiant de la ruche (ex. `SN-CASA-001`)

200 :
```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" }
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
- Facultatifs : `hive_id` (s'il est présent, il doit être égal à `:id`), `site_id`, `position_lat`, `position_lon`, `temp_internal_c`, `temp_external_c`, `humidity_pct`, `acoustic_activity_score`, `battery_pct`

`hive_id` et `site_id` sont toujours repris de la ruche du chemin.

201 : la mesure enregistrée
```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "temp_internal_c": 34.4,
  "battery_pct": 88
}
```

400 : `timestamp` ou `weight_kg` manque, ou le `hive_id` du corps diffère de celui du chemin
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ timestamp est obligatoire."
}
```

404 : aucune ruche ne porte cet identifiant

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
    { "hive_id": "SN-CASA-001", "site_id": "SN-CASA", "timestamp": "2026-10-31T23:45:00Z", "weight_kg": 36.9 }
  ],
  "limit": 50,
  "offset": 0
}
```

400 : limit ou offset invalide (absent de la plage, pas un entier, ou vide)
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

404 : aucune ruche ne porte cet identifiant (vérifié avant les paramètres)

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
      "id": "3f2c8a6e-1b4d-4c9a-9e7f-2a5b6c7d8e9f",
      "hive_id": "SN-CASA-001",
      "inspected_at": "2026-10-31T09:30:00Z",
      "colony_status": "forte",
      "queen_present": true,
      "observations": "Couvain compact, réserves de miel suffisantes."
    }
  ]
}
```

404 : aucune ruche ne porte cet identifiant

---

### POST /api/hives/:id/inspections

Enregistre une inspection saisie dans l'application mobile. L'identifiant est un UUID choisi par l'application, pas par le serveur.

Paramètres de chemin
- id : texte, identifiant de la ruche

Corps
- Obligatoires :
  - `id` : UUID (ex. `3f2c8a6e-1b4d-4c9a-9e7f-2a5b6c7d8e9f`)
  - `inspected_at` : date ISO 8601 avec fuseau (ex. `2026-10-31T09:30:00Z`)
  - `colony_status` : `forte`, `normale`, `faible` ou `morte`
- Facultatifs :
  - `queen_present` : booléen, `null` s'il est absent
  - `observations` : texte, `null` s'il est absent

201 : l'inspection créée
```json
{
  "id": "3f2c8a6e-1b4d-4c9a-9e7f-2a5b6c7d8e9f",
  "hive_id": "SN-CASA-001",
  "inspected_at": "2026-10-31T09:30:00Z",
  "colony_status": "forte",
  "queen_present": true,
  "observations": "Couvain compact, réserves de miel suffisantes."
}
```
400 : `timestamp` ou `weight_kg` manque, le `hive_id` du corps diffère de celui du chemin,
ou un champ mesuré n'est pas un nombre dans sa plage physique :

| Champ                   | Min | Max |
|-------------------------|-----|-----|
| position_lat            | -90 | 90  |
| position_lon            | -180| 180 |
| weight_kg               | 0   | 150 |
| temp_internal_c         | -10 | 60  |
| temp_external_c         | -20 | 60  |
| humidity_pct            | 0   | 100 |
| acoustic_activity_score | 0   | 1   |
| battery_pct             | 0   | 100 |

<!-- 400 : un champ obligatoire manque ou un champ a un type ou une valeur invalide
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ colony_status doit valoir forte, normale, faible ou morte."
} -->
```

404 : aucune ruche ne porte cet identifiant

409 : une inspection porte déjà cet identifiant
