# QueenBee_Nodes_Architechture
Voici la version node du projet QueenBee

## Résultats du TP 1

| Fichier  | Lecture   | Durée de l'import (ms) | Pire temps de /ping (ms) |
|----------|-----------|------------------------|--------------------------|
| 1 jour   | bloquante | …                      | …                        |
| 1 jour   | en flux   | …                      | …                        |
| 30 jours | bloquante | …                      | …                        |
| 30 jours | en flux   | …                      | …                        |

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
