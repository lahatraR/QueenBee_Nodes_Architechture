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
