# API REST de gestion de publications

Petit projet Node.js sans dépendances externes, réalisé dans le cadre du TP d'initiation à Node.js.

## Démarrage

```bash
npm run seed
npm start
```

Le script `seed` récupère les publications depuis JSONPlaceholder et les enregistre dans `posts.json`. Le serveur démarre ensuite sur `http://localhost:3000`.

Ouvrez `client/index.html` dans un navigateur pour utiliser l'interface web, ou `api-tests.http` avec l'extension REST Client de VS Code.

## Routes disponibles

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/posts` | Lister les publications |
| GET | `/api/posts/:id` | Lire une publication |
| POST | `/api/posts` | Créer une publication |
| PUT | `/api/posts/:id` | Modifier une publication |
| DELETE | `/api/posts/:id` | Supprimer une publication |

Les requêtes POST et PUT attendent un objet JSON avec `userId`, `title` et `body`.
