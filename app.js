(function () {
  "use strict";

  var C = window.CARDS;
  var STORE_KEY = "la-tournee-setup-v1";

  var SUITS = {
    h: { sym: "♥", red: true, name: "Cœur" },
    d: { sym: "♦", red: true, name: "Carreau" },
    c: { sym: "♣", red: false, name: "Trèfle" },
    s: { sym: "♠", red: false, name: "Pique" },
  };
  var SUIT_CAT = { h: "verite", d: "defi", c: "tous", s: "duel" };
  var CAT = {
    verite: { name: "Vérité", color: "var(--c-verite)", sym: "♥" },
    defi: { name: "Défi", color: "var(--c-defi)", sym: "♦" },
    tous: { name: "Tout le monde", color: "var(--c-tous)", sym: "♣" },
    duel: { name: "Duel", color: "var(--c-duel)", sym: "♠" },
    pouvoir: { name: "Pouvoir", color: "var(--c-pouvoir)", sym: "A" },
    joker: { name: "Joker", color: "var(--c-joker)", sym: "★" },
    eau: { name: "Pause eau", color: "var(--c-tous)", sym: "" },
  };
  var MAIN_CATS = ["verite", "defi", "tous", "duel"];
  var VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R"];
  var WATER_EVERY = 12;

  // ---------- État ----------
  function defaultSetup() {
    return {
      names: [],
      tab: "cartes", // "cartes" ou "mini"
      alcool: true,
      deck: "virtuel", // "virtuel" ou "reel"
      epice: false,
      duree: 40, // 20, 40 ou 0 (= paquet entier)
      cats: { verite: true, defi: true, tous: true, duel: true, pouvoir: true },
    };
  }

  var state = {
    screen: "setup", // setup | game | end
    setup: loadSetup(),
    sheet: null, // rules | scores | quit
    game: null,
  };

  function loadSetup() {
    var s = defaultSetup();
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var k in s) if (saved[k] !== undefined) s[k] = saved[k];
      }
    } catch (e) {}
    return s;
  }
  function saveSetup() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.setup)); } catch (e) {}
  }

  // ---------- Outils ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rnd(arr.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function unit(n, alcool) {
    if (alcool) return n + (n > 1 ? " gorgées" : " gorgée");
    return n + (n > 1 ? " points" : " point");
  }
  function penaltyFor(v) {
    if (v >= 11) return 3;
    if (v >= 7) return 2;
    if (v >= 2) return 1;
    return 3; // As sans pouvoir
  }

  // ---------- Paquets de textes ----------
  function buildPools(g) {
    var pools = {};
    ["verite", "defi", "tous", "duel", "pouvoir", "joker"].forEach(function (cat) {
      pools[cat] = [];
    });
    g.pools = pools;
  }
  function eligible(cat, g) {
    return C[cat].filter(function (c) {
      if (c.hot && !g.opts.epice) return false;
      if (c.min && g.players.length < c.min) return false;
      return true;
    });
  }
  function drawText(cat, g) {
    if (!g.pools[cat].length) g.pools[cat] = shuffle(eligible(cat, g).slice());
    return g.pools[cat].pop();
  }

  // ---------- Construction d'une carte ----------
  function resolveCat(suit, v, g) {
    if (suit === "joker") return "joker";
    if (v === 1 && g.opts.cats.pouvoir) return "pouvoir";
    var cat = SUIT_CAT[suit];
    if (!g.opts.cats[cat]) {
      var on = MAIN_CATS.filter(function (c) { return g.opts.cats[c]; });
      cat = pick(on);
    }
    return cat;
  }

  function makeCard(suit, v, g) {
    var cat = resolveCat(suit, v, g);
    var n = suit === "joker" ? 4 : penaltyFor(v);
    var tpl = drawText(cat, g);
    var me = g.turn;
    var others = g.players.map(function (_, i) { return i; }).filter(function (i) { return i !== me; });
    shuffle(others);
    var a = others[0], a2 = others[1] !== undefined ? others[1] : others[0];
    var alcool = g.opts.alcool;
    var name = function (i) { return "<b>" + esc(g.players[i].name) + "</b>"; };

    function fill(t) {
      return t
        .replace(/\{j\}/g, name(me))
        .replace(/\{a2\}/g, name(a2))
        .replace(/\{a\}/g, name(a))
        .replace(/\{n(?::(\d+))?\}/g, function (_, x) { return "<b>" + unit(x ? +x : n, alcool) + "</b>"; })
        .replace(/\{lettre\}/g, pick(C.lettres.split("")))
        .replace(/\{cat\}/g, esc(pick(C.categories)));
    }

    var card = {
      suit: suit, v: v, cat: cat, n: n,
      html: fill(tpl.t),
      step: tpl.step || n,
      rule: tpl.rule ? fill(tpl.rule).replace(/<\/?b>/g, "") : null,
      opp: cat === "duel" ? a : null,
    };
    if (cat === "duel") {
      card.html = '<span class="vs">' + esc(g.players[me].name) + " <small style=\"display:inline;color:inherit;font-size:.7em\">contre</small> " + esc(g.players[a].name) + "</span>" + card.html;
    }
    if (cat === "pouvoir") card.step = 1;
    return card;
  }

  // ---------- Partie ----------
  function startGame() {
    var s = state.setup;
    var players = s.names.map(function (nm) { return { name: nm, score: 0 }; });
    var g = {
      opts: JSON.parse(JSON.stringify(s)),
      players: players,
      turn: 0,
      drawn: 0,
      deck: [],
      card: null,
      pending: {},
      rules: [],
      water: false,
      picker: { suit: null },
      gage: null,
    };
    if (g.opts.deck === "virtuel") {
      var deck = [];
      Object.keys(SUITS).forEach(function (su) {
        var suitOn = g.opts.cats[SUIT_CAT[su]];
        for (var v = 1; v <= 13; v++) {
          if (suitOn || (v === 1 && g.opts.cats.pouvoir)) deck.push({ suit: su, v: v });
        }
      });
      deck.push({ suit: "joker", v: 0 }, { suit: "joker", v: 0 });
      shuffle(deck);
      if (g.opts.duree && g.opts.duree < deck.length) deck = deck.slice(0, g.opts.duree);
      g.deck = deck;
    }
    buildPools(g);
    state.game = g;
    state.screen = "game";
    state.sheet = null;
    render();
    window.scrollTo(0, 0);
  }

  function reveal(suit, v) {
    var g = state.game;
    g.card = makeCard(suit, v, g);
    g.pending = {};
    g.drawn++;
    render();
  }

  function drawVirtual() {
    var g = state.game;
    var c = g.deck[g.drawn];
    if (!c) return endGame();
    reveal(c.suit, c.v);
  }

  function applyPending() {
    var g = state.game;
    Object.keys(g.pending).forEach(function (i) { g.players[i].score += g.pending[i]; });
    g.pending = {};
  }

  function nextTurn() {
    var g = state.game;
    applyPending();
    if (g.card && g.card.rule) g.rules.push(g.card.rule);
    g.card = null;
    g.picker = { suit: null };
    g.turn = (g.turn + 1) % g.players.length;
    if (g.opts.deck === "virtuel" && g.drawn >= g.deck.length) return endGame();
    if (g.opts.alcool && g.drawn > 0 && g.drawn % WATER_EVERY === 0) g.water = true;
    render();
    window.scrollTo(0, 0);
  }

  function endGame() {
    var g = state.game;
    if (g) applyPending();
    if (g && g.card && g.card.rule) g.rules.push(g.card.rule);
    if (g) { g.card = null; g.gage = pick(C.gages); }
    state.screen = "end";
    state.sheet = null;
    render();
    window.scrollTo(0, 0);
  }

  // Outils partagés avec les mini-jeux (minijeux.js)
  var ctx = {
    get state() { return state; },
    render: function () { render(); },
    renderSheet: function () { renderSheet(); },
    scrollTop: function () { window.scrollTo(0, 0); },
    esc: esc, rnd: rnd, pick: pick, shuffle: shuffle, unit: unit,
    scoreRows: function (g, ed) { return scoreRows(g, ed); },
    ranking: function (g) { return ranking(g); },
    SUITS: SUITS, VALUES: VALUES, gages: C.gages,
  };

  // ---------- Rendu ----------
  var root = document.getElementById("app");
  var sheetRoot = document.getElementById("sheet");

  function render() {
    if (state.screen === "setup") root.innerHTML = viewSetup();
    else if (state.screen === "game") root.innerHTML = viewGame();
    else if (state.screen === "mini") root.innerHTML = window.MINI.view(ctx);
    else root.innerHTML = viewEnd();
    renderSheet();
  }

  function seg(name, value, options) {
    return '<div class="seg' + (options.length === 3 ? " three" : "") + '" role="group">' +
      options.map(function (o) {
        return '<button type="button" data-act="opt" data-opt="' + name + '" data-val="' + o.v + '" aria-pressed="' + (String(value) === String(o.v)) + '">' +
          esc(o.label) + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</button>";
      }).join("") + "</div>";
  }

  function viewSetup() {
    var s = state.setup;
    var nb = s.names.length;
    var mainOn = MAIN_CATS.some(function (c) { return s.cats[c]; });
    var canStart = nb >= 2 && mainOn;
    var chips = s.names.map(function (nm, i) {
      return '<span class="player-chip">' + esc(nm) +
        '<button type="button" data-act="del-player" data-i="' + i + '" aria-label="Retirer ' + esc(nm) + '">×</button></span>';
    }).join("");

    return '' +
      '<header class="hero">' +
        '<div class="suits" aria-hidden="true"><span class="r">♥</span>♠<span class="r">♦</span>♣</div>' +
        "<h1>La Tour<span>née</span></h1>" +
        "<p>" + (s.tab === "mini"
          ? "Des jeux rapides à se passer de main en main : bluff, bombe, cartes et chrono."
          : "Le jeu de cartes de soirée. Vérités, défis, duels et votes, de 2 joueurs à toute la bande.") + "</p>" +
      "</header>" +

      '<nav class="tabs" aria-label="Choix du jeu">' +
        '<button type="button" data-act="tab" data-tab="cartes" aria-pressed="' + (s.tab !== "mini") + '">Jeu de cartes</button>' +
        '<button type="button" data-act="tab" data-tab="mini" aria-pressed="' + (s.tab === "mini") + '">Mini-jeux <span class="new">4 jeux</span></button>' +
      "</nav>" +

      '<section class="section">' +
        '<div class="label"><span>Joueurs</span><span>' + nb + (nb > 1 ? " joueurs" : " joueur") + "</span></div>" +
        '<form class="add-row" id="add-form" autocomplete="off">' +
          '<input id="new-player" type="text" maxlength="20" placeholder="Prénom, puis Entrée" aria-label="Prénom du joueur">' +
          '<button class="btn small" type="submit">Ajouter</button>' +
        "</form>" +
        (nb ? '<div class="players">' + chips + "</div>" : '<p class="hint">Ajoute au moins 2 joueurs, dans l\'ordre où vous êtes assis.</p>') +
      "</section>" +

      '<section class="section">' +
        '<div class="label"><span>Boissons</span></div>' +
        seg("alcool", s.alcool, [
          { v: true, label: "Avec alcool", sub: "on boit des gorgées" },
          { v: false, label: "Sans alcool", sub: "on compte des points" },
        ]) +
        (s.alcool
          ? '<p class="note">Bois avec modération. Personne n\'est obligé de boire : une gorgée peut toujours se prendre avec un soft. Pensez à boire de l\'eau entre les verres.</p>'
          : '<p class="note">Chaque pénalité donne des points. À la fin, celui qui en a le plus fait un gage final.</p>') +
      "</section>" +
      (s.tab === "mini" ? window.MINI.tiles(ctx) : viewCardOptions(s, nb, mainOn, canStart));
  }

  function viewCardOptions(s, nb, mainOn, canStart) {
    return '' +
      '<section class="section">' +
        '<div class="label"><span>Les cartes</span></div>' +
        seg("deck", s.deck, [
          { v: "virtuel", label: "Cartes de l'appli", sub: "rien à sortir" },
          { v: "reel", label: "Mon vrai paquet", sub: "on tire, on tape la carte" },
        ]) +
        (s.deck === "virtuel"
          ? '<div class="label" style="margin-top:6px"><span>Durée</span></div>' +
            seg("duree", s.duree, [
              { v: 20, label: "Courte", sub: "20 cartes" },
              { v: 40, label: "Normale", sub: "40 cartes" },
              { v: 0, label: "Paquet entier", sub: "54 cartes" },
            ])
          : '<p class="hint">Prenez un jeu de 52 cartes (jokers acceptés). Le joueur tire une carte et l\'indique dans l\'appli.</p>') +
      "</section>" +

      '<section class="section">' +
        '<div class="label"><span>Ambiance</span></div>' +
        seg("epice", s.epice, [
          { v: false, label: "Tranquille", sub: "pour tout le monde" },
          { v: true, label: "Épicé", sub: "questions plus osées" },
        ]) +
      "</section>" +

      '<section class="section">' +
        '<div class="label"><span>Types de cartes</span><span>touche pour activer</span></div>' +
        '<div class="toggles">' +
          ["verite", "defi", "tous", "duel", "pouvoir"].map(function (c) {
            return '<button type="button" class="toggle" data-act="cat" data-cat="' + c + '" aria-pressed="' + !!s.cats[c] + '">' +
              '<span class="sym">' + CAT[c].sym + "</span>" + CAT[c].name + "</button>";
          }).join("") +
        "</div>" +
        (!mainOn ? '<p class="hint" style="color:var(--accent)">Active au moins un type parmi Vérité, Défi, Tout le monde ou Duel.</p>' : "") +
      "</section>" +

      '<div class="section">' +
        '<button class="btn" type="button" data-act="start"' + (canStart ? "" : " disabled") + ">" +
          (nb < 2 ? "Ajoute au moins 2 joueurs" : "Lancer la partie") + "</button>" +
        '<button class="link" type="button" data-act="sheet" data-sheet="rules">Comment on joue ?</button>' +
      "</div>";
  }

  function viewGame() {
    var g = state.game;
    var p = g.players[g.turn];
    var count = g.opts.deck === "virtuel"
      ? "Carte " + Math.min(g.drawn + (g.card ? 0 : 1), g.deck.length) + " / " + g.deck.length
      : g.drawn + (g.drawn > 1 ? " cartes jouées" : " carte jouée");

    var rules = g.rules.length
      ? '<div class="rules-strip" aria-label="Règles en cours">' + g.rules.map(function (r, i) {
          return '<span class="rule-chip">' + esc(r) + '<button type="button" data-act="del-rule" data-i="' + i + '" aria-label="Retirer la règle">×</button></span>';
        }).join("") + "</div>"
      : "";

    var top = '<div class="topbar">' +
        '<div class="brand">La Tour<span>née</span></div>' +
        '<div class="icon-btns">' +
          '<button class="icon-btn" type="button" data-act="sheet" data-sheet="scores">Scores</button>' +
          '<button class="icon-btn" type="button" data-act="sheet" data-sheet="rules">Règles</button>' +
          '<button class="icon-btn" type="button" data-act="sheet" data-sheet="quit">Fin</button>' +
        "</div></div>" + rules;

    if (g.water) {
      return top +
        '<div class="turn"><h2>Pause eau</h2><span class="count">' + count + "</span></div>" +
        '<div class="stage"><div class="card tall" style="--cat:var(--c-tous)">' +
          '<div class="cat">Pause eau</div>' +
          '<div class="body">Tout le monde boit un verre d\'eau.<small>Ça fait ' + WATER_EVERY + " cartes que vous jouez. On s'hydrate, on reprend après.</small></div>" +
        "</div></div>" +
        '<div class="actions"><button class="btn" type="button" data-act="water-ok">C\'est bu, on continue</button></div>';
    }

    var turn = '<div class="turn"><h2>À toi, ' + esc(p.name) + '</h2><span class="count">' + count + "</span></div>";

    if (!g.card) {
      if (g.opts.deck === "virtuel") {
        return top + turn +
          '<div class="stage"><button class="pile" type="button" data-act="draw" aria-label="Tirer une carte">' +
            '<div class="back"></div><div class="back"></div><div class="back"><span>Touche pour tirer</span></div>' +
          "</button></div>";
      }
      return top + turn + viewPicker(g);
    }
    return top + turn + viewCard(g) + viewActions(g);
  }

  function viewPicker(g) {
    var sel = g.picker.suit;
    var suits = Object.keys(SUITS).map(function (k) {
      var su = SUITS[k];
      return '<button type="button" class="pk' + (su.red ? " red" : "") + '" data-act="pk-suit" data-suit="' + k + '" aria-pressed="' + (sel === k) + '" aria-label="' + su.name + '">' +
        su.sym + "<small>" + CAT[SUIT_CAT[k]].name.split(" ")[0] + "</small></button>";
    }).join("") +
      '<button type="button" class="pk" data-act="pk-joker" aria-label="Joker">★<small>Joker</small></button>';

    var vals = VALUES.map(function (v, i) {
      return '<button type="button" class="pk' + (sel && SUITS[sel].red ? " red" : "") + '" data-act="pk-val" data-v="' + (i + 1) + '"' + (sel ? "" : " disabled") + ">" + v + "</button>";
    }).join("");

    return '<div class="picker">' +
      "<p>" + (sel ? "Et la valeur ?" : "Tire une carte de ton paquet, puis touche sa couleur.") + "</p>" +
      '<div class="suit-row">' + suits + "</div>" +
      '<div class="val-row">' + vals + "</div>" +
    "</div>";
  }

  function viewCard(g) {
    var c = g.card;
    var corner;
    var red = false;
    if (c.suit === "joker") corner = { v: "★", s: "" };
    else { corner = { v: VALUES[c.v - 1], s: SUITS[c.suit].sym }; red = SUITS[c.suit].red; }
    var pen = "";
    if (c.cat === "verite" || c.cat === "defi") pen = "Tu refuses ? Tu prends " + unit(c.n * 2, g.opts.alcool) + ".";
    else if (c.cat === "duel") pen = "Le perdant prend " + unit(c.n, g.opts.alcool) + ".";
    else if (c.cat === "pouvoir") pen = "La règle reste affichée en haut de l'écran.";

    return '<div class="stage"><div class="card tall' + (red ? " red" : "") + '" style="--cat:' + CAT[c.cat].color + '">' +
      '<div class="corner tl"><span class="v">' + corner.v + '</span><span class="s">' + corner.s + "</span></div>" +
      '<div class="corner br"><span class="v">' + corner.v + '</span><span class="s">' + corner.s + "</span></div>" +
      '<div class="cat">' + CAT[c.cat].name + "</div>" +
      '<div class="body">' + c.html + "</div>" +
      (pen ? '<div class="pen">' + esc(pen) + "</div>" : "") +
    "</div></div>";
  }

  function viewActions(g) {
    var c = g.card;
    var any = Object.keys(g.pending).length > 0;
    var chips = g.players.map(function (pl, i) {
      var add = g.pending[i] || 0;
      return '<button type="button" class="who-chip' + (add ? " on" : "") + '" data-act="give" data-i="' + i + '">' + esc(pl.name) +
        (add ? '<span class="plus">+' + add + "</span>" : "") + "</button>";
    }).join("");
    var who = '<div class="who">' +
      '<div class="label"><span>Qui prend ? Touche son prénom (+' + unit(c.step, g.opts.alcool) + ")</span>" +
      (any ? '<button class="link" type="button" data-act="reset-give" style="padding:0">Effacer</button>' : "") + "</div>" +
      '<div class="who-chips">' + chips + "</div></div>";

    var buttons;
    if (c.cat === "verite" || c.cat === "defi") {
      buttons = '<div class="btn-row">' +
        '<button class="btn ghost" type="button" data-act="refuse">Je refuse (+' + c.n * 2 + ")</button>" +
        '<button class="btn" type="button" data-act="next">' + (c.cat === "defi" ? "Défi fait" : "J'ai répondu") + "</button>" +
        "</div>";
    } else {
      buttons = '<button class="btn" type="button" data-act="next">Joueur suivant</button>';
    }
    return '<div class="actions">' + who + buttons + "</div>";
  }

  function ranking(g) {
    return g.players.map(function (p, i) { return { name: p.name, score: p.score, i: i }; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  function scoreRows(g, editable) {
    return '<div class="scores">' + ranking(g).map(function (r, k) {
      return '<div class="score-row"><span class="rank">' + (k + 1) + '</span><span class="name">' + esc(r.name) + "</span>" +
        '<span class="pts">' + unit(r.score, g.opts.alcool) + "</span>" +
        (editable
          ? '<button type="button" data-act="score" data-i="' + r.i + '" data-d="-1" aria-label="Retirer 1">−</button>' +
            '<button type="button" data-act="score" data-i="' + r.i + '" data-d="1" aria-label="Ajouter 1">+</button>'
          : "<span></span><span></span>") +
        "</div>";
    }).join("") + "</div>";
  }

  function viewEnd() {
    var g = state.game;
    var rk = ranking(g);
    var max = rk[0].score;
    var top = rk.filter(function (r) { return r.score === max; }).map(function (r) { return esc(r.name); });
    var who = top.length > 1 ? top.slice(0, -1).join(", ") + " et " + top[top.length - 1] : top[0];
    var block;
    if (max === 0) {
      block = '<div class="end-card"><h2>Partie terminée</h2><p>Personne n\'a pris de pénalité. Une partie de saints !</p></div>';
    } else if (g.opts.alcool) {
      block = '<div class="end-card"><h2>Partie terminée</h2>' +
        "<p>" + who + (top.length > 1 ? " ont" : " a") + " pris le plus de gorgées (" + max + ").</p>" +
        "<p><b>Dernière règle :</b> tout le monde boit un grand verre d'eau. Et personne ne prend le volant.</p></div>";
    } else {
      block = '<div class="end-card"><h2>Gage final</h2>' +
        "<p>" + who + (top.length > 1 ? " ont" : " a") + " le plus de points (" + max + "). Le gage :</p>" +
        '<p class="gage">' + esc(g.gage) + "</p>" +
        '<button class="btn ghost small" type="button" data-act="new-gage">Tirer un autre gage</button></div>';
    }
    return '<header class="hero"><div class="suits" aria-hidden="true"><span class="r">♥</span>♠<span class="r">♦</span>♣</div><h1>La Tour<span>née</span></h1></header>' +
      block +
      '<section class="section"><div class="label"><span>Classement</span><span>' + g.drawn + " cartes jouées</span></div>" + scoreRows(g, false) + "</section>" +
      '<div class="section"><button class="btn" type="button" data-act="replay">Rejouer avec les mêmes</button>' +
      '<button class="btn ghost" type="button" data-act="home">Changer les joueurs ou les options</button></div>';
  }

  function renderSheet() {
    if (!state.sheet) { sheetRoot.hidden = true; sheetRoot.innerHTML = ""; return; }
    var html = "";
    var cur = state.screen === "mini" ? state.mini : state.game;
    var alcool = cur ? cur.opts.alcool : state.setup.alcool;
    if (state.sheet === "rules") {
      var u = alcool ? "gorgées" : "points";
      html = "<h2>Comment on joue</h2>" +
        "<p>Chacun son tour, on tire une carte. Sa <b>couleur</b> dit quoi faire, sa <b>valeur</b> dit combien de " + u + " sont en jeu.</p>" +
        '<div class="legend">' +
          '<span class="s r">♥</span><span><b>Cœur : Vérité.</b> Tu réponds honnêtement à une question.</span>' +
          '<span class="s r">♦</span><span><b>Carreau : Défi.</b> Tu fais le défi.</span>' +
          '<span class="s">♣</span><span><b>Trèfle : Tout le monde.</b> « Je n\'ai jamais », votes, mini-jeux de groupe.</span>' +
          '<span class="s">♠</span><span><b>Pique : Duel.</b> Toi contre un autre joueur. Le perdant prend.</span>' +
          '<span class="s">A</span><span><b>As : Pouvoir.</b> Une règle spéciale qui reste en jeu (affichée en haut).</span>' +
          '<span class="s">★</span><span><b>Joker :</b> tu distribues 4 ' + u + " comme tu veux.</span>" +
        "</div>" +
        "<h3>Combien ?</h3>" +
        "<ul><li>2 à 6 : 1 " + (alcool ? "gorgée" : "point") + "</li><li>7 à 10 : 2 " + u + "</li><li>Valet, Dame, Roi : 3 " + u + "</li>" +
        "<li>Tu refuses une vérité ou un défi : c'est le double.</li></ul>" +
        "<h3>Compter les " + u + "</h3>" +
        "<p>Sous chaque carte, touche le prénom de ceux qui prennent. L'appli garde les scores.</p>" +
        (alcool
          ? "<p class=\"note\">Personne n'est forcé de boire. Une gorgée peut se prendre avec un soft. Buvez de l'eau entre les verres.</p>"
          : "<p class=\"note\">À la fin, celui qui a le plus de points tire un gage final.</p>") +
        '<button class="btn" type="button" data-act="close">Compris</button>';
    } else if (state.sheet === "scores") {
      html = "<h2>Scores</h2>" +
        '<p class="hint">Corrige avec − et + si besoin.</p>' +
        scoreRows(state.screen === "mini" ? state.mini : state.game, true) +
        '<button class="btn" type="button" data-act="close">Fermer</button>';
    } else if (state.sheet === "mini-rules") {
      html = window.MINI.rules(ctx) + '<button class="btn" type="button" data-act="close">Compris</button>';
    } else if (state.sheet === "quit") {
      html = "<h2>Finir la partie ?</h2><p>On passe directement au classement" + (alcool ? "." : " et au gage final.") + "</p>" +
        '<div class="btn-row"><button class="btn ghost" type="button" data-act="close">Continuer</button>' +
        '<button class="btn" type="button" data-act="' + (state.screen === "mini" ? "m-end" : "end") + '">Terminer</button></div>';
    }
    sheetRoot.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + "</div>";
    sheetRoot.hidden = false;
  }

  // ---------- Événements ----------
  function onClick(e) {
    var t = e.target.closest("[data-act]");
    if (!t) {
      if (e.target === sheetRoot) { state.sheet = null; renderSheet(); }
      return;
    }
    var act = t.getAttribute("data-act");
    var s = state.setup, g = state.game;

    switch (act) {
      case "del-player":
        s.names.splice(+t.dataset.i, 1); saveSetup(); render(); break;
      case "opt": {
        var k = t.dataset.opt, v = t.dataset.val;
        s[k] = v === "true" ? true : v === "false" ? false : isNaN(+v) ? v : +v;
        saveSetup(); render(); break;
      }
      case "cat":
        s.cats[t.dataset.cat] = !s.cats[t.dataset.cat]; saveSetup(); render(); break;
      case "start":
        if (s.names.length >= 2) startGame(); break;
      case "sheet":
        state.sheet = t.dataset.sheet; renderSheet(); break;
      case "close":
        state.sheet = null; renderSheet(); break;
      case "draw":
        drawVirtual(); break;
      case "pk-suit":
        g.picker.suit = t.dataset.suit; render(); break;
      case "pk-joker":
        reveal("joker", 0); break;
      case "pk-val":
        if (g.picker.suit) reveal(g.picker.suit, +t.dataset.v); break;
      case "give": {
        var i = t.dataset.i;
        g.pending[i] = (g.pending[i] || 0) + g.card.step; render(); break;
      }
      case "reset-give":
        g.pending = {}; render(); break;
      case "refuse":
        g.pending[g.turn] = (g.pending[g.turn] || 0) + g.card.n * 2; nextTurn(); break;
      case "next":
        nextTurn(); break;
      case "water-ok":
        g.water = false; render(); break;
      case "del-rule":
        g.rules.splice(+t.dataset.i, 1); render(); break;
      case "tab":
        s.tab = t.dataset.tab; saveSetup(); render(); break;
      case "score": {
        var pl = (state.screen === "mini" ? state.mini : g).players[+t.dataset.i];
        pl.score = Math.max(0, pl.score + +t.dataset.d); renderSheet(); break;
      }
      case "end":
        endGame(); break;
      case "new-gage":
        var cur = g.gage, ng = cur;
        while (ng === cur && C.gages.length > 1) ng = pick(C.gages);
        g.gage = ng; render(); break;
      case "replay":
        startGame(); break;
      case "home":
        window.MINI.stop();
        state.screen = "setup"; state.game = null; state.mini = null; render(); window.scrollTo(0, 0); break;
      default:
        if (act.indexOf("m-") === 0) window.MINI.act(act, t, ctx);
    }
  }

  function onSubmit(e) {
    if (e.target.id !== "add-form") return;
    e.preventDefault();
    var input = document.getElementById("new-player");
    var nm = input.value.trim().replace(/\s+/g, " ");
    if (!nm) return;
    if (state.setup.names.some(function (x) { return x.toLowerCase() === nm.toLowerCase(); })) nm = nm + " " + (state.setup.names.length + 1);
    state.setup.names.push(nm);
    saveSetup();
    render();
    var again = document.getElementById("new-player");
    if (again) again.focus();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.sheet) { state.sheet = null; renderSheet(); }
  });

  // Mise à jour à chaud (aperçu claude.ai) : on garde la partie en cours
  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(function () { return { state: state }; });
  function boot(data) {
    if (data && data.state && data.state.setup) {
      state = data.state;
      if (!state.setup.tab) state.setup.tab = "cartes";
      if (state.screen === "mini") window.MINI.resume(ctx);
    }
    render();
  }
  if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data);

  // Installation sur téléphone (version hébergée)
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !(hot)) {
    try { navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) {}
  }
})();
