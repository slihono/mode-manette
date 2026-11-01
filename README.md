# FivePlay Controller — démo autonome

Par **Seneve Lihono** ([slihono](https://github.com/slihono)).

Un projet personnel de programmation des commandes de jeu dans le navigateur : lecture de manettes, profils personnalisables, schéma interactif et visualisation des entrées. Cette version publique contient uniquement mes ajouts pour les manettes et leurs tests. Elle fonctionne sans moteur ni données de jeu.

## Essayer

Avec Python 3 installé, depuis ce dossier :

```powershell
python -m http.server 8087 --bind 127.0.0.1
```

Ouvrir <http://127.0.0.1:8087/> dans Chrome ou Edge, brancher une manette puis appuyer sur un bouton. Choisir un mode, cliquer sur une commande du schéma puis utiliser « Changer cette touche ». Les réglages avancés permettent d'ajuster la zone morte et la sensibilité et d'importer/exporter les profils JSON.

La section « Tester les commandes » propose une vérification avec une entrée simulée. Elle vérifie le branchement des commandes, sans prétendre remplacer un essai avec une manette physique. Les profils sont enregistrés dans le stockage local du navigateur ; aucune donnée n'est envoyée à un serveur.

## Vérifier le code

Avec Node.js 20 ou plus récent, sans installation de dépendances :

```powershell
npm run check
npm test
```

Les tests couvrent les déplacements, la caméra, la dérive des sticks, les profils, les axes personnalisés, les déconnexions et la coexistence clavier/souris/manette. Les essais matériels et l'intégration dans un jeu réel restent à effectuer séparément.

## Portée

Les profils proposent des correspondances de touches conçues pour GTA V. Ce dépôt est une démonstration indépendante de configuration et de lecture de commandes, pas une copie jouable du jeu. Il ne contient ni fichiers du jeu, ni client tiers archivé, ni moteur, ni script de téléchargement de ces éléments. Les noms PlayStation, Xbox et GTA V servent à identifier les dispositions ou correspondances de commandes.

Voir [PROVENANCE.md](PROVENANCE.md) pour les fichiers retenus et les adaptations de cette version publique.
