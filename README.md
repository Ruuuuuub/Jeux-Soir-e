# La Tournée

Un jeu de cartes de soirée qui tourne dans le navigateur (téléphone ou ordi).
De 2 joueurs à autant que vous voulez. Avec ou sans alcool.

## Comment on joue

Chacun son tour, on tire une carte.

- **La couleur dit quoi faire**
  - ♥ Cœur : **Vérité** (tu réponds à une question)
  - ♦ Carreau : **Défi** (tu fais le défi)
  - ♣ Trèfle : **Tout le monde** (« Je n'ai jamais », votes, mini-jeux)
  - ♠ Pique : **Duel** (toi contre un autre joueur)
  - As : **Pouvoir** (une règle spéciale qui reste affichée)
  - Joker : tu distribues 4 gorgées / points
- **La valeur dit combien** : 2 à 6 = 1, 7 à 10 = 2, Valet/Dame/Roi = 3.
  Tu refuses une vérité ou un défi ? C'est le double.

## Les options (écran d'accueil)

| Option | Choix |
| --- | --- |
| Boissons | Avec alcool (gorgées) / Sans alcool (points + gage final pour le perdant) |
| Cartes | Cartes de l'appli / Mon vrai paquet (on tire une vraie carte et on la tape dans l'appli) |
| Durée | 20 cartes, 40 cartes ou paquet entier (cartes de l'appli seulement) |
| Ambiance | Tranquille / Épicé (questions plus osées) |
| Types de cartes | Vérité, Défi, Tout le monde, Duel, Pouvoir : on active ce qu'on veut |

En mode alcool, une pause eau arrive toutes les 12 cartes. Personne n'est obligé de boire.

## Lancer le jeu

Aucun outil à installer : ouvrez `index.html` dans un navigateur.

Pour l'avoir en ligne gratuitement : sur GitHub, **Settings → Pages → Deploy from a branch**,
choisissez la branche et le dossier `/ (root)`. Le site s'ouvre ensuite sur téléphone,
et on peut l'ajouter à l'écran d'accueil comme une appli.

## Fichiers

- `index.html` : la page
- `style.css` : le design
- `cards.js` : toutes les questions, défis, duels… (facile à modifier pour ajouter les vôtres)
- `app.js` : le fonctionnement du jeu
- `sw.js`, `manifest.webmanifest`, `icon.svg` : installation sur téléphone et jeu hors ligne
