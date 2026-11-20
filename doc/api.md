# API QueenBee — Contrat v1

URL de base : `http://localhost:3000`

Tous les corps de requête et de réponse sont en JSON (`Content-Type: application/json`). Les données sont stockées dans PostgreSQL.

## Authentification

Toutes les routes `/api/hives` exigent un jeton d'accès, envoyé dans l'en-tête :

```
Authorization: Bearer <access_token>
```

Le jeton s'obtient avec `POST /api/auth/login`. Les routes publiques sont `GET /health`, `POST /api/auth/login` et `POST /api/auth/refresh`.

| Jeton         | Durée de vie | Usage                                                       |
|---------------|--------------|-------------------------------------------------------------|
| access_token  | 15 minutes   | en-tête `Authorization` de chaque requête                   |
| refresh_token | 7 jours      | `POST /api/auth/refresh`, pour obtenir un nouveau couple de jetons |

Les jetons sont des JWT signés en HS256 (émetteur `queenbee-api`, audience `queenbee`). Le jeton d'accès contient l'identifiant (`sub`), le rôle et le site de l'utilisateur.

### Rôles et droits

| Rôle         | Ruches visibles                 | Ajouter une mesure | Ajouter une inspection |
|--------------|---------------------------------|--------------------|------------------------|
| admin        | toutes                          | oui                | non                    |
| gestionnaire | toutes                          | non                | non                    |
| coordinateur | celles de son site              | non                | oui, sur son site      |
| apiculteur   | celles dont il est propriétaire | non                | oui, sur ses ruches    |

Pour une ruche précise, l'existence est vérifiée avant les droits : une ruche inconnue renvoie 404, une ruche existante mais non autorisée renvoie 403.

### Blocage du compte

Après 5 échecs de connexion consécutifs, le compte est bloqué 15 minutes. Pendant ce temps, la connexion et le renouvellement renvoient 401, même avec le bon mot de passe. Une connexion réussie remet le compteur à zéro.

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

| status | title                    |
|--------|--------------------------|
| 400    | Requête invalide         |
| 401    | Authentification requise |
| 403    | Accès refusé             |
| 404    | Ressource introuvable    |
| 409    | Conflit                  |
| 413    | Contenu trop volumineux  |
| 500    | Erreur interne           |

`title` est le même pour toutes les erreurs d'un même code. `detail` décrit le cas précis. Une réponse d'erreur ne contient jamais de pile d'exécution ni de message SQL.

Une réponse 401 porte aussi l'en-tête `WWW-Authenticate: Bearer realm="queenbee"` (RFC 6750). Les réponses 401 et 403 sont inscrites dans le journal du serveur (`[accès refusé]`, avec la méthode, le chemin, l'adresse IP et l'utilisateur).

### Validation des entrées

Les corps et les paramètres de requête sont vérifiés par des schémas Joi avant d'atteindre le code métier :
- toutes les erreurs sont signalées d'un coup, dans un seul `detail`, séparées par une espace (ex. « timestamp est obligatoire. weight_kg est obligatoire. ») ;
- un champ non déclaré est refusé : 400 « author_id n'est pas un champ autorisé. » ;
- les paramètres de requête sont convertis : `?limit=10` devient le nombre 10.

Sur une route protégée, les vérifications se font dans cet ordre : jeton (401), rôle (403), données (400), puis traitement (404, 403, 409).

### Erreurs communes à toutes les routes

- 400 : le corps de la requête n'est pas un JSON valide
- 400 : les données ne respectent pas une règle de la base (« Les données envoyées ne respectent pas les règles de la base. »)
- 404 : aucune route ne correspond à la méthode et au chemin demandés
- 413 : le corps de la requête dépasse 1 Mo
- 500 : erreur interne inattendue (« Une erreur interne est survenue. »)

### Erreurs communes aux routes protégées

401 : en-tête `Authorization` absent ou sans le schéma `Bearer`
```json
{
  "type": "about:blank",
  "title": "Authentification requise",
  "status": 401,
  "detail": "Jeton d'accès manquant : ajoutez l'en-tête Authorization: Bearer <jeton>."
}
```

401 : jeton expiré, modifié, signé avec une autre clé, ou jeton de renouvellement utilisé à la place du jeton d'accès (« Jeton d'accès invalide ou expiré. »)

---

### GET /health

Indique que l'API répond. Route publique.

200 :
```json
{ "status": "ok" }
```

---

### POST /api/auth/login

Connexion. Route publique.

Corps
- Obligatoires : `email` (adresse e-mail, 254 caractères au plus ; la casse est ignorée), `password` (texte)
- Aucun autre champ n'est accepté.

200 :
```json
{
  "token_type": "Bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
}
```

400 : champ absent, adresse mal formée ou champ non déclaré

401 : adresse inconnue ou mot de passe faux. Le message est le même dans les deux cas, pour ne pas révéler quelles adresses ont un compte.
```json
{
  "type": "about:blank",
  "title": "Authentification requise",
  "status": 401,
  "detail": "Adresse e-mail ou mot de passe incorrect."
}
```

401 : compte bloqué (5e échec, ou tentative pendant le blocage)
```json
{
  "type": "about:blank",
  "title": "Authentification requise",
  "status": 401,
  "detail": "Compte bloqué après 5 échecs de connexion, jusqu'à 14:35 UTC."
}
```

---

### POST /api/auth/refresh

Échange un jeton de renouvellement contre un nouveau couple de jetons. Route publique. Le rôle et le site sont relus en base : un changement de droits est pris en compte au renouvellement.

Corps
- Obligatoire : `refresh_token` (texte)
- Aucun autre champ n'est accepté.

200 : même format que `POST /api/auth/login`

400 : `refresh_token` absent ou champ non déclaré

401 : jeton invalide ou expiré, jeton d'accès utilisé à la place, ou utilisateur supprimé (« Jeton de renouvellement invalide ou expiré. ») ; compte bloqué

---

### POST /api/auth/register

Crée un compte. Réservé au rôle `admin`.

Corps
- Obligatoires :
  - `email` : adresse e-mail, 254 caractères au plus (enregistrée en minuscules)
  - `password` : texte de 12 à 72 caractères
  - `role` : `apiculteur`, `coordinateur`, `gestionnaire` ou `admin`
- `site_id` : obligatoire pour `apiculteur` et `coordinateur`, refusé pour `gestionnaire` et `admin`
- Aucun autre champ n'est accepté.

201 : le compte créé, sans le mot de passe ni son empreinte
```json
{
  "id": "5b0c2f8e-7a3d-4e21-9c55-0e6f1a2b3c4d",
  "email": "api2.sn-casa@queenbee.test",
  "role": "apiculteur",
  "site_id": "SN-CASA",
  "created_at": "2026-11-20T10:00:00.000Z"
}
```

400 : champ absent, mot de passe trop court, rôle inconnu, `site_id` absent ou en trop

401 : jeton absent ou invalide

403 : l'utilisateur connecté n'est pas `admin` (« Action réservée aux rôles suivants : admin. »)

409 : un compte existe déjà avec cette adresse (« Un compte existe déjà avec cette adresse e-mail. »)

---

### GET /api/auth/me

L'utilisateur du jeton d'accès, lu dans le jeton sans accès à la base.

200 :
```json
{ "id": "88467c9f-4c6c-45f5-bbf8-d5464281f105", "role": "apiculteur", "site_id": "SN-CASA" }
```

401 : jeton absent ou invalide

---

### GET /api/hives

Liste des ruches visibles par l'utilisateur, triées par identifiant, éventuellement filtrées par site.

Accès : tous les rôles. La liste dépend du rôle (voir « Rôles et droits ») :
- admin, gestionnaire : toutes les ruches ;
- coordinateur : les ruches de son site ;
- apiculteur : ses ruches.

Paramètres de requête
- site_id : texte non vide, facultatif. Ne renvoie que les ruches de ce site. Absent : pas de filtre. Un site inconnu renvoie une liste vide.

Aucun autre paramètre n'est accepté.

200 :
```json
[
  {
    "id": "SN-CASA-001",
    "site_id": "SN-CASA",
    "owner_id": "88467c9f-4c6c-45f5-bbf8-d5464281f105",
    "ref_lat": 12.5743,
    "ref_lon": -16.2873,
    "status": "active"
  }
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

403 : un coordinateur demande un autre site que le sien
```json
{
  "type": "about:blank",
  "title": "Accès refusé",
  "status": 403,
  "detail": "Vous n'avez pas accès au site CI-AGBO."
}
```

---

### GET /api/hives/:id

Une ruche par son identifiant.

Accès : tous les rôles, sur une ruche qu'ils peuvent voir.

Paramètres de chemin
- id : texte, identifiant de la ruche (ex. `SN-CASA-001`)

200 :
```json
{
  "id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "owner_id": "88467c9f-4c6c-45f5-bbf8-d5464281f105",
  "ref_lat": 12.5743,
  "ref_lon": -16.2873,
  "status": "active"
}
```

403 : la ruche existe, mais l'utilisateur n'y a pas accès
```json
{
  "type": "about:blank",
  "title": "Accès refusé",
  "status": 403,
  "detail": "Vous n'avez pas accès à la ruche SN-CASA-011."
}
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

Accès : `admin` uniquement.

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

403 : l'utilisateur n'est pas `admin`
```json
{
  "type": "about:blank",
  "title": "Accès refusé",
  "status": 403,
  "detail": "Action réservée aux rôles suivants : admin."
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

Accès : tous les rôles, sur une ruche qu'ils peuvent voir.

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

403 : la ruche existe, mais l'utilisateur n'y a pas accès

404 : aucune ruche ne porte cet identifiant

---

### GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne.

Accès : tous les rôles, sur une ruche qu'ils peuvent voir.

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

403 : la ruche existe, mais l'utilisateur n'y a pas accès

404 : aucune ruche ne porte cet identifiant

---

### POST /api/hives/:id/inspections

Enregistre une inspection saisie dans l'application mobile. L'identifiant est un UUID choisi par l'application, pas par le serveur.

Accès : `apiculteur` (sur ses ruches) et `coordinateur` (sur les ruches de son site).

L'auteur (`author_id`) est l'utilisateur du jeton d'accès. Il n'est jamais lu dans le corps.

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

403 : rôle `admin` ou `gestionnaire` (« Action réservée aux rôles suivants : apiculteur, coordinateur. »), ou ruche non autorisée (« Vous n'avez pas accès à la ruche SN-CASA-011. »)

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
