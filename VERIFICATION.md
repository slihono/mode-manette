# Vérifications de la démo autonome

- 22 tests Node passent : profils, déplacements, caméra, dérive, apprentissage, déconnexions et coexistence des entrées.
- Les cinq modules JavaScript passent `node --check`.
- La page locale charge le dessin SVG, le CSS et les modules sans erreur de console.
- Le bouton « Vérifier le fonctionnement » confirme avancer, tirer, caméra et relâchement avec une entrée simulée. Une manette physique n'a pas été testée pendant cette extraction.
- La page fonctionne avec le serveur statique Python standard et un ArrayBuffer local, sans en-têtes d'isolation de contexte ni dépendance externe.
- Une liste explicite de fichiers manette est extraite. Aucun fichier du client tiers, moteur, archive de jeu ou script de récupération n'est inclus. L'historique Git amont n'est pas importé.
- Une recherche des formats courants de jetons GitHub, clés AWS/OpenAI et clés privées ne signale aucune correspondance dans les fichiers retenus. Ce contrôle ne constitue pas une garantie universelle de détection.
