/*
  Mini-jeux de « La Tournée » : L'Intrus, La Bombe, Plus ou Moins, Mots Express.
  Branché sur app.js via window.MINI (view, tiles, act, rules, stop, resume).
*/
(function () {
  "use strict";
  var W = window.MOTS;

  var GAMES = {
    intrus: {
      name: "L'Intrus", glyph: "?", min: 3, tag: "Bluff · 3 joueurs et +",
      pitch: "Tout le monde a le même mot secret… sauf un. Démasquez l'intrus avant qu'il devine votre mot.",
    },
    bombe: {
      name: "La Bombe", glyph: "✹", min: 2, tag: "Réflexes · 2 joueurs et +",
      pitch: "La mèche brûle. Dis un mot, passe le téléphone. Celui qui l'a en main quand ça explose prend.",
    },
    plusmoins: {
      name: "Plus ou Moins", glyph: "▲▼", min: 2, tag: "Cartes · 2 joueurs et +",
      pitch: "Plus haut ou plus bas ? Chaque bonne réponse fait grossir le pot. Une erreur, et tu prends tout.",
    },
    express: {
      name: "Mots Express", glyph: "45″", min: 2, tag: "Chrono · 2 joueurs et +",
      pitch: "Fais deviner 5 mots avant la fin du chrono : en expliquant, en mimant ou avec un seul mot.",
    },
  };
  var ORDER = ["intrus", "bombe", "plusmoins", "express"];

  var MODES = [
    { k: "explique", name: "Explique", sec: 45, d: "Fais deviner avec des phrases, sans dire le mot ni un mot de la même famille." },
    { k: "mime", name: "Mime", sec: 60, d: "Aucun son, aucun mot. Seulement des gestes." },
    { k: "unmot", name: "Un seul mot", sec: 45, d: "Un seul mot d'indice par mot à deviner. Choisis bien !" },
  ];
  var GOAL = 5;

  var C; // ctx d'app.js
  var lastKey = null;
  var timers = { list: [], iv: null, audio: null };

  // ---------- Outils ----------
  function m() { return C.state.mini; }
  function u(n) { return C.unit(n, m().opts.alcool); }
  function nm(i) { return C.esc(m().players[i].name); }
  function b(s) { return "<b>" + s + "</b>"; }

  function stop() {
    timers.list.forEach(clearTimeout);
    timers.list = [];
    if (timers.iv) { clearInterval(timers.iv); timers.iv = null; }
  }
  function later(fn, ms) { timers.list.push(setTimeout(fn, ms)); }

  function add(i, n) { var g = m(); g.players[i].score += n; }
  function addAllExcept(skip, n) { m().players.forEach(function (_, i) { if (i !== skip) add(i, n); }); }
  function applyPending() {
    var g = m();
    Object.keys(g.pending || {}).forEach(function (i) { add(+i, g.pending[i]); });
    g.pending = {};
  }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  // Son (démarré par un clic, sinon le navigateur le bloque)
  function audio() {
    if (timers.audio) return timers.audio;
    try {
      var A = window.AudioContext || window.webkitAudioContext;
      if (A) timers.audio = new A();
    } catch (e) {}
    return timers.audio;
  }
  function beep(freq, dur, vol) {
    if (!m() || m().sound === false) return;
    var a = audio(); if (!a) return;
    try {
      var o = a.createOscillator(), g = a.createGain();
      o.type = "square"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.06, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + dur);
    } catch (e) {}
  }
  function boomSound() {
    if (!m() || m().sound === false) return;
    var a = audio(); if (!a) return;
    try {
      var len = a.sampleRate * 1.2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "lowpass"; f.frequency.value = 600; g.gain.value = 0.9;
      s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
    } catch (e) {}
  }

  function who(label, step) {
    var g = m();
    var any = Object.keys(g.pending).length > 0;
    return '<div class="who">' +
      '<div class="label"><span>' + label + " (+" + u(step) + " par touche)</span>" +
      (any ? '<button class="link" type="button" data-act="m-reset" style="padding:0">Effacer</button>' : "") + "</div>" +
      '<div class="who-chips">' + g.players.map(function (p, i) {
        var a = g.pending[i] || 0;
        return '<button type="button" class="who-chip' + (a ? " on" : "") + '" data-act="m-give" data-i="' + i + '" data-step="' + step + '">' +
          C.esc(p.name) + (a ? '<span class="plus">+' + a + "</span>" : "") + "</button>";
      }).join("") + "</div></div>";
  }

  // ---------- Démarrage ----------
  function start(key) {
    stop();
    var s = C.state.setup;
    var g = {
      game: key,
      players: s.names.map(function (n) { return { name: n, score: 0 }; }),
      opts: { alcool: s.alcool },
      turn: 0, pending: {}, round: 0, sound: true,
    };
    C.state.mini = g;
    C.state.screen = "mini";
    C.state.sheet = null;
    if (key === "intrus") intrusRound();
    if (key === "bombe") bombeReady();
    if (key === "plusmoins") pmInit();
    if (key === "express") exReady();
    C.render(); C.scrollTop();
  }

  // ---------- L'Intrus ----------
  function intrusRound() {
    var g = m();
    var pair = C.pick(W.paires).slice();
    if (Math.random() < 0.5) pair.reverse();
    g.words = pair;
    g.intrus = C.rnd(g.players.length);
    g.first = C.rnd(g.players.length);
    g.seen = 0; g.showing = false; g.suspect = null; g.outcome = null;
    g.phase = "distrib";
    g.round++;
  }

  function viewIntrus() {
    var g = m(), n = g.players.length;
    if (g.phase === "distrib") {
      var i = g.seen;
      if (!g.showing) {
        return '<div class="panel center">' +
          '<p class="kicker">Passe le téléphone à</p>' +
          '<p class="big-name">' + nm(i) + "</p>" +
          '<p class="hint dark">Les autres, ne regardez pas l\'écran.</p>' +
          '<button class="btn" type="button" data-act="m-show">C\'est moi, voir mon mot</button>' +
          '<p class="hint dark">' + (i + 1) + " / " + n + "</p></div>";
      }
      var word = i === g.intrus ? g.words[1] : g.words[0];
      return '<div class="panel center">' +
        '<p class="kicker">' + nm(i) + ", ton mot secret</p>" +
        '<p class="big-word">' + C.esc(word) + "</p>" +
        '<p class="hint dark">Retiens-le bien. Attention : personne ne sait s\'il est l\'intrus, toi non plus.</p>' +
        '<button class="btn" type="button" data-act="m-hide">' +
          (i + 1 < n ? "Cacher et passer à " + nm(i + 1) : "Cacher et commencer") + "</button></div>";
    }
    if (g.phase === "talk") {
      return '<div class="panel">' +
        '<p class="kicker">Manche ' + g.round + " · les indices</p>" +
        "<h3>À partir de " + nm(g.first) + ", chacun dit UN mot en rapport avec son mot secret.</h3>" +
        '<ul class="tips">' +
          "<li><b>Trop précis</b> : l'intrus va deviner votre mot.</li>" +
          "<li><b>Trop vague</b> : on va vous soupçonner.</li>" +
          "<li>Faites 2 tours d'indices, discutez, puis votez.</li>" +
        "</ul>" +
        '<button class="btn" type="button" data-act="m-vote">On passe au vote</button></div>';
    }
    if (g.phase === "vote") {
      return '<div class="panel">' +
        '<p class="kicker">Le vote</p><h3>Qui est l\'intrus ?</h3>' +
        '<p class="hint dark">Mettez-vous d\'accord (ou votez à main levée), puis touchez le suspect.</p>' +
        '<div class="who-chips">' + g.players.map(function (p, i) {
          return '<button type="button" class="who-chip light" data-act="m-accuse" data-i="' + i + '">' + C.esc(p.name) + "</button>";
        }).join("") + "</div></div>";
    }
    if (g.phase === "guess") {
      return '<div class="panel center">' +
        '<p class="kicker">Démasqué !</p>' +
        '<p class="big-name">' + nm(g.intrus) + "</p>" +
        "<p>était bien l'intrus, avec le mot " + b(C.esc(g.words[1])) + ".</p>" +
        '<p class="hint dark">Dernière chance : ' + nm(g.intrus) + ", devine à voix haute le mot des autres.</p>" +
        '<div class="btn-row"><button class="btn ghost dark" type="button" data-act="m-miss">Raté</button>' +
        '<button class="btn" type="button" data-act="m-found">Trouvé</button></div></div>';
    }
    // result
    return '<div class="panel center">' +
      '<p class="kicker">Résultat</p>' +
      '<p class="result-text">' + g.outcome + "</p>" +
      '<div class="words"><span>Mot des autres<b>' + C.esc(g.words[0]) + "</b></span><span>Mot de l'intrus<b>" + C.esc(g.words[1]) + "</b></span></div>" +
      '<button class="btn" type="button" data-act="m-next">Nouvelle manche</button></div>';
  }

  // ---------- La Bombe ----------
  function bombeReady() {
    var g = m();
    var cur = g.ch;
    do { g.ch = C.pick(W.bombe); } while (W.bombe.length > 1 && g.ch === cur);
    g.phase = "ready";
  }
  function bombeLight() {
    var g = m();
    audio();
    if (timers.audio && timers.audio.resume) { try { timers.audio.resume(); } catch (e) {} }
    g.phase = "live";
    g.round++;
    var dur = 15000 + C.rnd(25000), t0 = Date.now();
    var tick = function () {
      if (!m() || m().phase !== "live") return;
      var el = Date.now() - t0;
      if (el >= dur) {
        m().phase = "boom";
        boomSound(); vibrate([400, 120, 400]);
        C.render();
        return;
      }
      var left = 1 - el / dur;
      beep(left < 0.25 ? 1100 : 880, 0.05);
      var bomb = document.querySelector(".bomb");
      if (bomb) bomb.style.animationDuration = Math.max(0.18, left * 0.9) + "s";
      later(tick, 140 + left * 620);
    };
    C.render();
    tick();
  }

  function viewBombe() {
    var g = m(), ch = g.ch;
    if (g.phase === "ready") {
      return '<div class="panel center">' +
        '<p class="kicker">' + C.esc(ch.t) + "</p>" +
        '<p class="big-word">' + C.esc(ch.m) + "</p>" +
        '<p class="hint dark">Le premier qui tient le téléphone dit un mot, puis le passe à sa gauche. Pas de répétition, pas d\'hésitation. La bombe explose au hasard, entre 15 et 40 secondes.</p>' +
        '<button class="btn" type="button" data-act="m-light">Allumer la mèche</button>' +
        '<div class="btn-row"><button class="btn ghost dark small" type="button" data-act="m-reroll">Autre thème</button>' +
        '<button class="btn ghost dark small" type="button" data-act="m-sound">Son : ' + (g.sound ? "activé" : "coupé") + "</button></div></div>";
    }
    if (g.phase === "live") {
      return '<div class="panel center live">' +
        '<div class="bomb" aria-hidden="true"><span></span></div>' +
        '<p class="kicker">' + C.esc(ch.t) + "</p>" +
        '<p class="big-word">' + C.esc(ch.m) + "</p>" +
        '<p class="hint dark">Dis un mot et passe le téléphone !</p></div>';
    }
    return '<div class="panel center boom">' +
      '<p class="boom-text">BOUM !</p>' +
      "<h3>Qui avait le téléphone en main ?</h3>" +
      '<p class="hint dark">Il ou elle prend ' + u(2) + ".</p>" +
      '<div class="who-chips centered">' + g.players.map(function (p, i) {
        return '<button type="button" class="who-chip light" data-act="m-boom" data-i="' + i + '">' + C.esc(p.name) + "</button>";
      }).join("") + "</div></div>";
  }

  // ---------- Plus ou Moins ----------
  function newDeck() {
    var d = [];
    ["h", "d", "c", "s"].forEach(function (s) { for (var v = 1; v <= 13; v++) d.push({ s: s, v: v }); });
    return C.shuffle(d);
  }
  function pmDraw() {
    var g = m();
    if (!g.deck.length) { g.deck = newDeck(); g.reshuffled = true; }
    return g.deck.pop();
  }
  function rank(v) { return v === 1 ? 14 : v; }
  function cardLabel(c) { return C.VALUES[c.v - 1] + C.SUITS[c.s].sym; }
  function pmInit() {
    var g = m();
    g.deck = newDeck(); g.card = pmDraw(); g.pot = 1; g.streak = 0; g.turn = 0; g.msg = null; g.phase = "play";
  }
  function pmNextPlayer() { var g = m(); g.turn = (g.turn + 1) % g.players.length; g.streak = 0; }
  function pmGuess(dir) {
    var g = m();
    applyPending();
    var prev = g.card, next = pmDraw();
    var a = rank(prev.v), z = rank(next.v);
    var me = g.turn;
    g.card = next;
    if (a === z) {
      g.msg = { kind: "eq", prev: prev, text: "Égalité ! " + nm(me) + " distribue le pot : " + b(u(g.pot)) + "." , give: true };
      g.pot = 1; pmNextPlayer();
    } else if ((dir === "up" && z > a) || (dir === "down" && z < a)) {
      g.pot++; g.streak++;
      g.msg = { kind: "ok", prev: prev, text: "Bien vu ! Le pot monte à " + b(u(g.pot)) + "." };
    } else {
      add(me, g.pot);
      g.msg = { kind: "ko", prev: prev, text: "Raté ! " + nm(me) + " prend " + b(u(g.pot)) + "." };
      g.pot = 1; pmNextPlayer();
    }
  }
  function bigCard(c) {
    var red = C.SUITS[c.s].red, v = C.VALUES[c.v - 1], s = C.SUITS[c.s].sym;
    return '<div class="card pm-card' + (red ? " red" : "") + '">' +
      '<div class="corner tl"><span class="v">' + v + '</span><span class="s">' + s + "</span></div>" +
      '<div class="corner br"><span class="v">' + v + '</span><span class="s">' + s + "</span></div>" +
      '<div class="pm-center"><span>' + v + "</span><span>" + s + "</span></div></div>";
  }
  function viewPM() {
    var g = m();
    var left = Math.max(0, 2 - g.streak);
    var msg = "";
    if (g.msg) {
      msg = '<div class="banner ' + g.msg.kind + '"><p>' + g.msg.text + '</p><p class="small">Carte d\'avant : ' + cardLabel(g.msg.prev) + "</p>" +
        (g.msg.give ? who("Qui prend ?", 1) : "") + "</div>";
    }
    return msg +
      '<div class="stage">' + bigCard(g.card) + "</div>" +
      '<div class="pot">Pot : <b>' + u(g.pot) + "</b></div>" +
      '<p class="hint" style="text-align:center">La prochaine carte sera…</p>' +
      '<div class="btn-row">' +
        '<button class="btn" type="button" data-act="m-down">▼ Plus basse</button>' +
        '<button class="btn" type="button" data-act="m-up">▲ Plus haute</button>' +
      "</div>" +
      '<button class="btn ghost" type="button" data-act="m-pass"' + (left ? " disabled" : "") + ">" +
        (left ? "Passer la main (encore " + left + " bonne" + (left > 1 ? "s" : "") + " réponse" + (left > 1 ? "s" : "") + ")" : "Passer la main au suivant") + "</button>" +
      '<p class="hint" style="text-align:center">L\'As est la carte la plus forte. Égalité : tu distribues le pot.</p>';
  }

  // ---------- Mots Express ----------
  function exReady() {
    var g = m();
    g.mode = C.pick(MODES);
    g.phase = "ready";
    g.found = []; g.skipped = [];
  }
  function exWord() {
    var g = m();
    if (!g.pool || !g.pool.length) g.pool = C.shuffle(W.express.slice());
    g.word = g.pool.pop();
  }
  function exGo() {
    var g = m();
    audio();
    exWord();
    g.phase = "live";
    g.end = Date.now() + g.mode.sec * 1000;
    var lastBeep = null;
    C.render();
    timers.iv = setInterval(function () {
      var gg = m();
      if (!gg || gg.phase !== "live") { clearInterval(timers.iv); timers.iv = null; return; }
      var left = Math.ceil((gg.end - Date.now()) / 1000);
      var el = document.getElementById("m-timer");
      if (el) { el.textContent = Math.max(0, left); el.classList.toggle("hurry", left <= 5); }
      if (left <= 5 && left > 0 && left !== lastBeep) { lastBeep = left; beep(660, 0.08, 0.05); }
      if (left <= 0) {
        clearInterval(timers.iv); timers.iv = null;
        exDone();
      }
    }, 200);
  }
  function exDone() {
    var g = m();
    g.phase = "done";
    var k = g.found.length;
    if (k < GOAL) add(g.turn, GOAL - k);
    beep(330, 0.4, 0.08); vibrate(300);
    C.render();
  }
  function viewExpress() {
    var g = m(), md = g.mode;
    if (g.phase === "ready") {
      return '<div class="panel center">' +
        '<p class="kicker">C\'est au tour de</p>' +
        '<p class="big-name">' + nm(g.turn) + "</p>" +
        '<p class="mode-name">' + md.name + "</p>" +
        "<p>" + C.esc(md.d) + "</p>" +
        '<p class="hint dark">Objectif : <b>' + GOAL + " mots en " + md.sec + " secondes</b>. Les autres devinent. Ne montre pas l'écran !</p>" +
        '<button class="btn" type="button" data-act="m-go">Go !</button></div>';
    }
    if (g.phase === "live") {
      return '<div class="panel center">' +
        '<div class="ex-top"><span class="mode-name">' + md.name + '</span><span id="m-timer" class="timer">' +
          Math.max(0, Math.ceil((g.end - Date.now()) / 1000)) + "</span></div>" +
        '<p class="big-word">' + C.esc(g.word) + "</p>" +
        '<p class="hint dark">Trouvés : ' + g.found.length + " / " + GOAL + "</p>" +
        '<div class="btn-row"><button class="btn ghost dark" type="button" data-act="m-skip">Passer</button>' +
        '<button class="btn" type="button" data-act="m-ok">Trouvé !</button></div></div>';
    }
    var k = g.found.length, miss = GOAL - k;
    var res = k >= GOAL
      ? "Objectif atteint ! " + nm(g.turn) + " distribue " + b(u(2)) + "."
      : "Il en manquait " + miss + " : " + nm(g.turn) + " prend " + b(u(miss)) + ".";
    return '<div class="panel center">' +
      '<p class="kicker">Temps écoulé</p>' +
      '<p class="big-name">' + k + " mot" + (k > 1 ? "s" : "") + "</p>" +
      '<p class="result-text">' + res + "</p>" +
      (g.found.length ? '<p class="hint dark">Trouvés : ' + g.found.map(C.esc).join(", ") + "</p>" : "") +
      (g.skipped.length ? '<p class="hint dark">Passés : ' + g.skipped.map(C.esc).join(", ") + "</p>" : "") +
      (k >= GOAL ? who("À qui ?", 1) : "") +
      '<button class="btn" type="button" data-act="m-next">Joueur suivant : ' + nm((g.turn + 1) % g.players.length) + "</button></div>";
  }

  // ---------- Fin ----------
  function viewEnd() {
    var g = m();
    var rk = C.ranking(g);
    var max = rk[0].score;
    var top = rk.filter(function (r) { return r.score === max; }).map(function (r) { return C.esc(r.name); });
    var whoTxt = top.length > 1 ? top.slice(0, -1).join(", ") + " et " + top[top.length - 1] : top[0];
    var block;
    if (max === 0) block = "<p>Personne n'a rien pris. Respect.</p>";
    else if (g.opts.alcool) block = "<p>" + whoTxt + (top.length > 1 ? " ont" : " a") + " pris le plus de gorgées (" + max + "). Un grand verre d'eau pour tout le monde.</p>";
    else block = "<p>" + whoTxt + (top.length > 1 ? " ont" : " a") + " le plus de points (" + max + "). Gage final :</p>" +
      '<p class="gage">' + C.esc(g.gage) + "</p>" +
      '<button class="btn ghost small" type="button" data-act="m-gage">Tirer un autre gage</button>';
    return '<div class="end-card"><h2>' + GAMES[g.game].name + " : fini !</h2>" + block + "</div>" +
      '<section class="section"><div class="label"><span>Classement</span></div>' + C.scoreRows(g, false) + "</section>" +
      '<div class="section">' +
        '<button class="btn" type="button" data-act="m-start" data-g="' + g.game + '">Rejouer à ' + GAMES[g.game].name + "</button>" +
        '<button class="btn ghost" type="button" data-act="m-menu">Choisir un autre mini-jeu</button></div>';
  }

  // ---------- Vues publiques ----------
  function view(ctx) {
    C = ctx;
    var g = m(), info = GAMES[g.game];
    var top = '<div class="topbar">' +
      '<div class="brand">' + info.name + "</div>" +
      '<div class="icon-btns">' +
        '<button class="icon-btn" type="button" data-act="sheet" data-sheet="scores">Scores</button>' +
        '<button class="icon-btn" type="button" data-act="sheet" data-sheet="mini-rules">Règles</button>' +
        (g.phase === "end" ? "" : '<button class="icon-btn" type="button" data-act="sheet" data-sheet="quit">Fin</button>') +
      "</div></div>";
    if (g.phase === "end") return top + viewEnd();
    var body;
    if (g.game === "intrus") body = viewIntrus();
    else if (g.game === "bombe") body = viewBombe();
    else if (g.game === "plusmoins") body = '<div class="turn"><h2>À toi, ' + nm(g.turn) + "</h2></div>" + viewPM();
    else body = viewExpress();
    // L'animation d'entrée ne joue que quand on change d'étape
    var key = [g.game, g.phase, g.seen, g.showing, g.round, g.turn].join("|");
    if (key !== lastKey) body = body.replace('class="panel', 'class="panel enter');
    lastKey = key;
    return top + body;
  }

  function tiles(ctx) {
    C = ctx;
    var nb = ctx.state.setup.names.length;
    return '<section class="section">' +
      '<div class="label"><span>Choisis un mini-jeu</span></div>' +
      '<div class="tiles">' + ORDER.map(function (k) {
        var gm = GAMES[k], ok = nb >= gm.min;
        return '<button type="button" class="tile" data-act="m-start" data-g="' + k + '"' + (ok ? "" : " disabled") + ">" +
          '<span class="glyph" aria-hidden="true">' + gm.glyph + "</span>" +
          '<span class="tile-name">' + gm.name + "</span>" +
          '<span class="tile-pitch">' + gm.pitch + "</span>" +
          '<span class="tile-tag">' + (ok ? gm.tag : "Il faut au moins " + gm.min + " joueurs") + "</span>" +
        "</button>";
      }).join("") + "</div></section>";
  }

  function rules(ctx) {
    C = ctx;
    var g = m(), U = function (n) { return C.unit(n, g.opts.alcool); };
    var t = {
      intrus: "<h2>L'Intrus</h2>" +
        "<p>Chacun regarde son mot secret, en se passant le téléphone. Tout le monde a le même mot, sauf l'intrus, qui a un mot proche. Personne ne sait qui est l'intrus, même pas lui.</p>" +
        "<ul><li>Chacun son tour, dites un mot-indice. 2 tours.</li><li>Discutez, puis désignez un suspect.</li>" +
        "<li>Intrus démasqué : il peut encore deviner le mot des autres. S'il rate, il prend " + U(3) + ". S'il trouve, tous les autres prennent " + U(1) + ".</li>" +
        "<li>Mauvais suspect : tous les autres prennent " + U(2) + ".</li></ul>",
      bombe: "<h2>La Bombe</h2>" +
        "<p>Un thème s'affiche. Le joueur qui tient le téléphone dit un mot qui colle au thème, puis passe le téléphone à sa gauche.</p>" +
        "<ul><li>Pas de répétition, pas d'hésitation : sinon le groupe peut vous forcer à garder le téléphone.</li>" +
        "<li>La bombe explose au hasard entre 15 et 40 secondes. Le tic-tac accélère.</li>" +
        "<li>Celui qui a le téléphone en main au « BOUM » prend " + U(2) + ".</li></ul>",
      plusmoins: "<h2>Plus ou Moins</h2>" +
        "<p>Une carte est posée. Devine si la suivante sera plus haute ou plus basse. L'As est la plus forte.</p>" +
        "<ul><li>Bonne réponse : le pot monte de 1 et tu continues.</li>" +
        "<li>Après 2 bonnes réponses, tu peux passer la main : le suivant hérite du pot.</li>" +
        "<li>Mauvaise réponse : tu prends tout le pot, et il repart à 1.</li>" +
        "<li>Égalité : tu distribues le pot.</li></ul>",
      express: "<h2>Mots Express</h2>" +
        "<p>Chacun son tour, un joueur fait deviner des mots aux autres, en " + GOAL + " mots minimum avant la fin du chrono.</p>" +
        "<ul><li>Le mode change à chaque tour : <b>Explique</b> (sans dire le mot), <b>Mime</b> (sans un bruit) ou <b>Un seul mot</b> d'indice.</li>" +
        "<li>Objectif atteint : tu distribues " + U(2) + ".</li>" +
        "<li>Objectif raté : tu prends 1 par mot manquant.</li></ul>",
    };
    return t[g.game];
  }

  function act(a, el, ctx) {
    C = ctx;
    var g = m();
    switch (a) {
      case "m-start": start(el.dataset.g); return;
      case "m-menu":
        stop(); C.state.screen = "setup"; C.state.setup.tab = "mini"; C.state.mini = null; C.render(); C.scrollTop(); return;
      case "m-end":
        stop(); applyPending(); g.phase = "end"; g.gage = C.pick(C.gages); C.state.sheet = null; C.render(); C.scrollTop(); return;
      case "m-gage": {
        var cur = g.gage; while (g.gage === cur && C.gages.length > 1) g.gage = C.pick(C.gages); break;
      }
      case "m-give": g.pending[el.dataset.i] = (g.pending[el.dataset.i] || 0) + (+el.dataset.step || 1); break;
      case "m-reset": g.pending = {}; break;
      // Intrus
      case "m-show": g.showing = true; break;
      case "m-hide":
        g.showing = false; g.seen++;
        if (g.seen >= g.players.length) g.phase = "talk";
        break;
      case "m-vote": g.phase = "vote"; break;
      case "m-accuse": {
        var s = +el.dataset.i;
        g.suspect = s;
        if (s === g.intrus) g.phase = "guess";
        else {
          addAllExcept(g.intrus, 2);
          g.outcome = "Raté ! " + b(nm(s)) + " n'était pas l'intrus. C'était " + b(nm(g.intrus)) + ". Tous les autres prennent " + b(u(2)) + ".";
          g.phase = "result";
        }
        break;
      }
      case "m-miss":
        add(g.intrus, 3);
        g.outcome = b(nm(g.intrus)) + " n'a pas trouvé le mot. L'intrus prend " + b(u(3)) + ".";
        g.phase = "result"; break;
      case "m-found":
        addAllExcept(g.intrus, 1);
        g.outcome = b(nm(g.intrus)) + " a trouvé votre mot ! Tous les autres prennent " + b(u(1)) + ".";
        g.phase = "result"; break;
      // Bombe
      case "m-light": bombeLight(); return;
      case "m-reroll": bombeReady(); break;
      case "m-sound": g.sound = !g.sound; break;
      case "m-boom": add(+el.dataset.i, 2); bombeReady(); break;
      // Plus ou moins
      case "m-up": pmGuess("up"); break;
      case "m-down": pmGuess("down"); break;
      case "m-pass": {
        if (g.streak < 2) return;
        applyPending();
        var from = g.turn; pmNextPlayer();
        g.msg = { kind: "ok", prev: g.card, text: nm(from) + " passe la main. " + nm(g.turn) + " reprend avec un pot de " + b(u(g.pot)) + "." };
        break;
      }
      // Mots Express
      case "m-go": exGo(); return;
      case "m-ok": g.found.push(g.word); exWord(); if (g.found.length === GOAL) beep(1200, 0.15, 0.06); break;
      case "m-skip": g.skipped.push(g.word); exWord(); break;
      // Suivant (Intrus, Express)
      case "m-next":
        applyPending();
        if (g.game === "intrus") intrusRound();
        if (g.game === "express") { g.turn = (g.turn + 1) % g.players.length; exReady(); }
        C.render(); C.scrollTop(); return;
    }
    C.render();
  }

  // Après une mise à jour à chaud, les chronos sont perdus : on revient à l'étape d'avant.
  function resume(ctx) {
    C = ctx;
    var g = m(); if (!g) return;
    if (g.game === "bombe" && (g.phase === "live")) g.phase = "ready";
    if (g.game === "express" && g.phase === "live") g.phase = "ready";
  }

  window.MINI = { view: view, tiles: tiles, rules: rules, act: act, stop: stop, resume: resume };
})();
