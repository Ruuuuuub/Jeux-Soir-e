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

## L'onglet Mini-jeux

Quatre jeux différents, avec les mêmes joueurs et la même option alcool / sans alcool :

| Jeu | Le principe |
| --- | --- |
| **L'Intrus** (3 joueurs et +) | Tout le monde reçoit le même mot secret, sauf un joueur qui a un mot proche. Chacun donne un indice, puis on vote pour trouver l'intrus. |
| **La Bombe** | Un thème s'affiche (« un mot qui contient OU », « un pays »…). On dit un mot et on passe le téléphone. Elle explose au hasard : celui qui l'a en main prend. |
| **Plus ou Moins** | La prochaine carte sera plus haute ou plus basse ? Chaque bonne réponse fait monter le pot. Une erreur et tu prends tout. |
| **Mots Express** | Faire deviner 5 mots avant la fin du chrono, en expliquant, en mimant ou avec un seul mot. |

## Les options (écran d'accueil)

| Option | Choix |
| --- | --- |
| Boissons | Avec alcool (gorgées) / Sans alcool (points + gage final pour le perdant) |
| Cartes | Cartes de l'appli / Mon vrai paquet (on tire une vraie carte et on la tape dans l'appli) |
| Durée | 20 cartes, 40 cartes ou paquet entier (cartes de l'appli seulement) |
| Ambiance | Tranquille / Épicé (plus osé) / **Hard 18+** (sexe, alcool, drogues, secrets : réservé aux adultes, avec confirmation) |
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
- `cartes-hard.js` : les cartes du niveau Hard 18+
- `app.js` : le fonctionnement du jeu de cartes
- `mots.js` : les mots des mini-jeux (paires de l'Intrus, thèmes de la Bombe, mots de Mots Express)
- `minijeux.js` : le fonctionnement des mini-jeux
- `sw.js`, `manifest.webmanifest`, `icon.svg` : installation sur téléphone et jeu hors ligne
