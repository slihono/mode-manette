# Vérifications de la démo autonome

Le 6 novembre 2026, le ZIP **Mode Manette** extrait a été lancé dans Chromium. La page et ses ressources se sont chargées sans requête externe. Le test simulé a réussi et les anciens réglages de profil et de symboles ont été relus à la même adresse. Le serveur ne sert que la page et ses ressources ; les chemins privés testés renvoient 404.

- 22 tests Node passent : profils, déplacements, caméra, dérive, apprentissage, déconnexions et coexistence des entrées.
- Les cinq modules JavaScript passent `node --check`.
- La page locale charge le dessin SVG, le CSS et les modules sans erreur de console.
- Le bouton « Vérifier le fonctionnement » confirme avancer, tirer, caméra et relâchement avec une entrée simulée. Une manette physique n'a pas été testée pendant cette extraction.
- La page fonctionne avec la bibliothèque standard de Python et un ArrayBuffer local, sans en-têtes d'isolation de contexte ni dépendance externe.
- Une liste explicite de fichiers manette est extraite. Aucun fichier du client tiers, moteur, archive de jeu ou script de récupération n'est inclus. L'historique Git amont n'est pas importé.
- Une recherche des formats courants de jetons GitHub, clés AWS/OpenAI et clés privées ne signale aucune correspondance dans les fichiers retenus. Ce contrôle ne constitue pas une garantie universelle de détection.
