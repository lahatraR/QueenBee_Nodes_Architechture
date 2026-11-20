# Fait par 
 - RAMANAMPAMONJY RIANTSOA LAHATRINIAINA
 - NYAMSI MENYIN VANELE BRICE

# QueenBee_Nodes_Architechture
Voici la version node du projet QueenBee

## Résultats du TP 1

| Fichier  | Lecture   | Durée de l'import (ms) | Pire temps de /ping (ms) |
|----------|-----------|------------------------|--------------------------|
| 1 jour   | bloquante | 15                     | 3                        |
| 1 jour   | en flux   | 10                     | 2                        |
| 30 jours | bloquante | 166                    | 146                      |
| 30 jours | en flux   | 145                    | 2                        |


### Questions

1. **Pourquoi /ping attend-il pendant l'import bloquant ?**
   `readFileSync` puis la boucle de `JSON.parse` s'exécutent d'un seul bloc sur l'unique thread de Node. Tant que ce travail n'est pas fini, la boucle d'événements ne peut traiter aucune autre requête, donc `/ping` reste en file d'attente.

2. **La lecture en flux est-elle plus rapide ? Sinon, qu'apporte-t-elle ?**
   Non, sa durée totale est similaire, parfois un peu plus longue. En revanche, elle rend la main à la boucle d'événements entre deux morceaux du fichier : les autres requêtes restent servies rapidement et la mémoire utilisée reste faible.

3. **Pourquoi l'effet est-il presque invisible avec le fichier d'une journée ?**
   Avec 4 800 lignes, la lecture bloquante ne dure que quelques millisecondes. Ce blocage est trop court pour que le pire temps de `/ping` augmente de façon visible.


## État du jour 1

API v0, tag `jour1-fin`.

### Fait

- Ruches, mesures et inspections, en mémoire, organisées en couches :
  routeur → contrôleur → services → repositories (`src/`)
- Contrat de chaque route : [docs/api.md](docs/api.md)
- Collection Postman : `QueenBee.postman_collection.json` (sans jeton ni mot de passe)
- Erreurs au format RFC 9457 (`application/problem+json`), y compris route inconnue et JSON mal formé
- Contrôle des plages physiques des mesures (UC-CY02)
- Tests : `npm test` (`test/measures.service.test.js`)
- Configuration par `.env` (`PORT`, `NODE_ENV`), modèle dans `.env.example`

### Lancer le projet

    cp .env.example .env
    npm install
    npm run dev
    npm test

### Ce qui manque

Rien : tous les points du livrable du jour 1 sont faits.


## Résultats du TP 5 — Import de 4 800 mesures

| Mode          | Durée (ms) |
|---------------|------------|
| ligne à ligne | 4 623      |
| par lot       | 308        |

1. **Quel temps obtenez-vous dans chaque mode ? D'où vient l'écart ?**
   Ligne à ligne : 4 623 ms ; par lot : 308 ms, soit environ 15 fois plus rapide. Ligne à ligne paie 4 800 allers-retours avec la base et 4 800 validations, chacune écrite sur disque (autocommit) ; par lot, il n'y a que 5 requêtes de 1 000 lignes et une seule validation à la fin.

2. **Si la 2 001e mesure provoquait une erreur, que resterait-il en base dans chaque mode ?**
   Ligne à ligne : les 2 000 premières mesures, déjà validées une par une, restent en base. Par lot : rien, car l'erreur déclenche un ROLLBACK qui annule toute la transaction.

3. **Pourquoi la transaction emprunte-t-elle une connexion avec `pool.connect()` au lieu d'appeler `pool.query()` ?**
   BEGIN, les INSERT et COMMIT doivent passer par la même connexion : une transaction appartient à une connexion. `pool.query()` peut prendre une connexion différente à chaque appel, et les INSERT ne feraient alors pas partie de la transaction.

4. **Que se passerait-il si `client.release()` n'était pas dans le `finally`, et qu'une erreur survenait dix fois de suite ?**
   Chaque erreur laisserait une connexion empruntée et jamais rendue. Après dix erreurs, les 10 connexions du pool seraient toutes perdues : les requêtes suivantes attendraient 5 s puis échoueraient avec « timeout exceeded when trying to connect », et l'API ne répondrait plus.

## Journal des requêtes interdites (TP 7)

| Requête interdite | Connecté en | Requête | Code attendu | Code obtenu |
|---|---|---|---|---|
| Ressource d'un autre site | coord.sn-casa | GET /api/hives?site_id=CI-AGBO | 403 | … |
| Rôle insuffisant | api1.sn-casa | POST /api/hives/SN-CASA-001/measures | 403 | … |
| Jeton expiré (JWT_ACCESS_TTL=10s) | admin | GET /api/hives après 10 s | 401 | … |
| Jeton falsifié (un caractère changé) | admin | GET /api/hives | 401 | … |

Extrait du journal du serveur :

    [accès refusé] 403 GET /api/hives?site_id=CI-AGBO ip=::1 utilisateur=b6351399-…
