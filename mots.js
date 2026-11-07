/*
  Contenu des mini-jeux. Facile à compléter : ajoutez vos lignes.
*/
window.MOTS = {
  // L'Intrus : paires de mots proches. La plupart des joueurs reçoivent le premier, l'intrus le second (ou l'inverse).
  paires: [
    ["Plage", "Piscine"], ["Pizza", "Burger"], ["Chat", "Chien"], ["Café", "Thé"], ["Avion", "Hélicoptère"],
    ["Bière", "Cidre"], ["Vin rouge", "Vin rosé"], ["Netflix", "YouTube"], ["Instagram", "TikTok"], ["Ski", "Snowboard"],
    ["Mariage", "Anniversaire"], ["Vampire", "Zombie"], ["Paris", "Londres"], ["Football", "Rugby"], ["Guitare", "Violon"],
    ["Dentiste", "Médecin"], ["Camping", "Hôtel"], ["Croissant", "Pain au chocolat"], ["Montagne", "Volcan"], ["Pirate", "Viking"],
    ["Sushi", "Ramen"], ["Fourchette", "Cuillère"], ["Lune", "Soleil"], ["Pompier", "Policier"], ["Train", "Métro"],
    ["Cinéma", "Théâtre"], ["Licorne", "Dragon"], ["Boîte de nuit", "Bar"], ["Chocolat", "Caramel"], ["Tennis", "Ping-pong"],
    ["Requin", "Dauphin"], ["Noël", "Halloween"], ["Moustache", "Barbe"], ["Lunettes", "Lentilles"], ["Raclette", "Fondue"],
    ["Prison", "École"], ["Fantôme", "Sorcière"], ["Douche", "Bain"], ["Karaoké", "Concert"], ["Tatouage", "Piercing"],
    ["Vélo", "Trottinette"], ["Banane", "Mangue"], ["Rêve", "Cauchemar"], ["Facteur", "Livreur"], ["Désert", "Banquise"],
  ],

  // La Bombe : défis à enchaîner pendant que la mèche brûle.
  bombe: [
    { t: "Un mot qui contient", m: "OU" }, { t: "Un mot qui contient", m: "AN" }, { t: "Un mot qui contient", m: "CH" },
    { t: "Un mot qui contient", m: "TR" }, { t: "Un mot qui contient", m: "ON" }, { t: "Un mot qui contient", m: "IN" },
    { t: "Un mot qui contient", m: "PL" }, { t: "Un mot qui finit par", m: "-TION" }, { t: "Un mot qui finit par", m: "-ETTE" },
    { t: "Un mot qui commence par", m: "MA" }, { t: "Un mot qui commence par", m: "BO" }, { t: "Un mot qui commence par", m: "PA" },
    { t: "Cite", m: "un pays" }, { t: "Cite", m: "une marque" }, { t: "Cite", m: "un fruit ou un légume" },
    { t: "Cite", m: "un animal" }, { t: "Cite", m: "un film" }, { t: "Cite", m: "un chanteur ou une chanteuse" },
    { t: "Cite", m: "un métier" }, { t: "Cite", m: "un sport" }, { t: "Cite", m: "une ville de France" },
    { t: "Cite", m: "un truc qu'on trouve dans une cuisine" }, { t: "Cite", m: "un personnage de dessin animé" },
    { t: "Cite", m: "une boisson" }, { t: "Cite", m: "un mot anglais" }, { t: "Cite", m: "une partie du corps" },
    { t: "Cite", m: "un objet de salle de bain" }, { t: "Cite", m: "une série" }, { t: "Cite", m: "un prénom de fille" },
    { t: "Cite", m: "un prénom de garçon" }, { t: "Cite", m: "une couleur" }, { t: "Cite", m: "un plat" },
  ],

  // Mots Express : mots à faire deviner.
  express: [
    "Astronaute", "Brosse à dents", "Château", "Dinosaure", "Escalator", "Feu d'artifice", "Gâteau", "Hamac", "Igloo",
    "Jongleur", "Kangourou", "Lave-vaisselle", "Magicien", "Nuage", "Ordinateur", "Parapluie", "Quai de gare", "Robot",
    "Sirène", "Tondeuse", "Ukulélé", "Valise", "Wifi", "Yoga", "Zèbre", "Ascenseur", "Baleine", "Cactus", "Dentifrice",
    "Éléphant", "Frigo", "Girafe", "Hérisson", "Infirmier", "Jacuzzi", "Klaxon", "Lampadaire", "Montgolfière", "Ninja",
    "Ours polaire", "Pingouin", "Râteau", "Sous-marin", "Toboggan", "Vampire", "Arc-en-ciel", "Bouée", "Chaussette",
    "Dragon", "Épouvantail", "Fantôme", "Grenouille", "Hippopotame", "Île déserte", "Jumelles", "Koala", "Licorne",
    "Marteau", "Nain de jardin", "Oreiller", "Pompier", "Sauna", "Tracteur", "Volcan", "Bowling", "Caméléon", "Danseuse",
    "Escargot", "Fourmi", "Guitare", "Horloge", "Karaté", "Loup-garou", "Moustique", "Perroquet", "Requin", "Squelette",
    "Tortue", "Ventilateur", "Barbecue", "Chewing-gum", "Dentiste", "Embouteillage", "Fusée", "Gorille", "Hamburger",
    "Lessive", "Mammouth", "Noël", "Patin à glace", "Pyramide", "Sandwich", "Télécommande", "Trampoline", "Aspirateur",
    "Boxeur", "Coiffeur", "Détective", "Extraterrestre", "Flamant rose", "Grille-pain", "Hôpital", "Imprimante",
    "Mariage", "Manège", "Paparazzi", "Plongeur", "Selfie", "Surfeur", "Taupe", "Tempête", "Bougie", "Cerf-volant",
    "Clown", "Crocodile", "Douanier", "Fakir", "Gladiateur", "Hypnotiseur", "Lasagnes", "Micro-ondes", "Momie",
    "Pirate", "Popcorn", "Radar", "Serpent", "Sorcière", "Statue", "Tatouage", "Tour Eiffel", "Arbitre", "Bébé",
  ],
};
