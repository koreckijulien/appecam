# ChromaKey

Application web installable pour remplacer une couleur dans une photo ou une
vidéo par une image. Servez le projet en HTTPS, puis ouvrez-le dans Chrome sur
Android et choisissez « Installer l'application » dans le menu du navigateur.
La caméra nécessite une connexion sécurisée.

Les boutons peuvent se répartir sur plusieurs lignes. Le menu « Paramètres »
permet de choisir la résolution de la caméra.

## Mises à jour

En ligne, l'application recherche la version la plus récente à son ouverture et
conserve une copie utilisable hors ligne. Une mise à jour du service worker
peut afficher un bouton « actualiser » : utilisez-le lorsque votre travail est
terminé, car l'actualisation interrompt la capture en cours.

Avant la première utilisation hors connexion, ouvrez l'application en ligne et
attendez que son installation soit terminée. La caméra et les fichiers présents
sur le téléphone restent utilisables hors connexion ; les médias sélectionnés
ne sont pas conservés automatiquement après la fermeture de l'application.

Pour une installation utilisant encore l'ancienne version, ouvrez l'application
avec une connexion Internet, puis fermez-la complètement et rouvrez-la si les
nouveautés n'apparaissent pas immédiatement. Les modifications doivent d'abord
être publiées sur le serveur qui héberge l'application.