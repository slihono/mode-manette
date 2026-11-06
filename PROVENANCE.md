# Provenance de la version publique

Auteur des ajouts manette : **Seneve Lihono** ([slihono](https://github.com/slihono)).

Cette extraction provient des ajouts d'une adaptation locale antérieure, révision `c818a69807a691351378efb222b915f050cc3581`. Seuls les modules originaux `controller/`, leur dessin SVG, leur feuille de styles et les tests indépendants sont retenus. Ces fichiers n'existaient pas dans l'archive amont à la révision `2fb671adca55cd0317aa551b33ffd922f1639660`.

L'historique contenant le client tiers n'est pas importé. Les fichiers `homepage.html`, `game.js`, `loader.js`, `io_worker.js`, `wgpu_worker.js`, les scripts de récupération, les données et le moteur du jeu sont exclus.

Adaptations autonomes : la page de test devient `index.html`, les ressources du module utilisent des URL relatives, la démo utilise un ArrayBuffer local puisqu'elle n'a aucun worker partagé, et le seul test nécessitant la page du client tiers est exclu. Les autres tests des modules sont conservés.

Cette version ne revendique pas la création de GTA V ou du client archivé d'origine, et n'est affiliée à aucun de leurs titulaires.
