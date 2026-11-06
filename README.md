# Mode Manette

Par **Seneve Lihono** ([slihono](https://github.com/slihono)) · [splihono2@ualr.edu](mailto:splihono2@ualr.edu).

Un outil autonome pour configurer une manette : lecture des commandes, profils personnalisables, schéma interactif et visualisation des entrées. L’interface et les profils fonctionnent hors ligne, sans compte ni service distant.

## Essayer

Sous Windows, double-cliquer sur `Demarrer-Mode-Manette.cmd`. Il faut Python 3.10 ou plus récent et un navigateur. Le lanceur ouvre la page locale et reste actif tant que sa fenêtre est ouverte. On peut également le démarrer depuis ce dossier :

```powershell
python -B serve_local.py
```

Ouvrir <http://127.0.0.1:8087/> dans Chrome ou Edge, brancher une manette puis appuyer sur un bouton. Choisir un mode, cliquer sur une commande du schéma puis utiliser « Changer cette touche ». Les réglages avancés permettent d'ajuster la zone morte et la sensibilité et d'importer/exporter les profils JSON.

La section « Tester les commandes » propose une vérification avec une entrée simulée. Les profils sont enregistrés dans le navigateur. Pour les conserver entre deux adresses ou ordinateurs, exporte-les puis importe-les au nouvel emplacement. Les profils sauvegardés dans l’ancienne démo restent lisibles à la même adresse.

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
