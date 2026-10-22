/* Les 7 Sartôts : données de démonstration pour le panneau de réservation OBT (maquette).
 *
 * Le panneau est le vrai script de l'application (obt-gestion.com/blocks/obt-booking.js), le même que
 * sur le site de T'Nature. Les 7 Sartôts n'ont pas encore de compte dans l'application : ce fichier
 * répond à sa place, dans le navigateur, pour une adresse factice (DEMO_API). Rien n'est lu dans
 * l'application et rien n'y est écrit ; la demande finale n'est envoyée nulle part.
 *
 * Tarifs, fermetures et capacités : ceux du site actuel des 7 Sartôts (octobre 2026).
 * Les séjours déjà pris sont inventés, pour montrer le planning.
 */
(function () {
  "use strict";
  var DEMO_API = "https://demo-sartots.obt.invalid";
  var DEMO_ENVOI = "https://demo-sartots.obt.invalid/envoi";

  var JOUR = 86400000;
  var iso = function (d) { return d.toISOString().slice(0, 10); };
  var date = function (s) { return new Date(s + "T00:00:00Z"); };
  var auj = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  var plus = function (n) { return iso(new Date(auj.getTime() + n * JOUR)); };
  var an = auj.getUTCFullYear();

  // Saison d'une nuit : hiver (octobre à mars), printemps (avril et mai), été (juin à septembre)
  var saison = function (s) { var m = date(s).getUTCMonth() + 1; return m >= 6 && m <= 9 ? "ete" : m >= 4 && m <= 5 ? "printemps" : "hiver"; };
  var vacances = function (s) { return saison(s) !== "hiver"; };

  var IMG = "images/";
  var LOGEMENTS = [
    { id: "l-ecurie", name: "L’Écurie", kind: "gite", capacity: 2, note: "1 lit 160 en mezzanine, poêle à bois, terrasse 15 m²", image: IMG + "ecurie/terrasse.jpg", minNights: 1, contains: [],
      nuit: { hiver: 8000, printemps: 8500, ete: 9500 }, semaine: { hiver: 53000, printemps: 56500, ete: 59500 } },
    { id: "le-pressoir", name: "Le Pressoir", kind: "gite", capacity: 2, note: "1 lit 160, pierre et chaux, terrasse 15 m²", image: IMG + "pressoir/chambre.jpg", minNights: 1, contains: [],
      nuit: { printemps: 9000, ete: 10000 }, semaine: { printemps: 58000, ete: 65000 } },
    { id: "le-guesthouse", name: "Le Guesthouse", kind: "gite", capacity: 3, note: "1 lit 140 et 1 lit 80, poêle à bois, rez-de-chaussée de Cloudelin", image: IMG + "guesthouse/facade.jpg", minNights: 1, contains: [],
      nuit: { hiver: 9000, printemps: 9500, ete: 11000 }, semaine: { hiver: 57000, printemps: 61000, ete: 67000 }, comprises: 2, supplement: 1500 },
    { id: "cloudelin", name: "Cloudelin", kind: "gite", capacity: 7, note: "4 chambres, 2 salles de bain, le gîte entier", image: IMG + "cloudelin/maison.jpg", minNights: 2, contains: ["le-guesthouse"],
      forfaits: { 2: [35000, 35000], 3: [40000, 40000], 4: [45000, 48000], 5: [55000, 58000], 6: [65000, 68000], 7: [74000, 79000] } },
  ];

  // Fermetures du site actuel, puis quelques séjours inventés autour d'aujourd'hui
  var OCCUPE = { "l-ecurie": [], "le-pressoir": [], "le-guesthouse": [], cloudelin: [] };
  [an - 1, an, an + 1].forEach(function (a) {
    OCCUPE["le-pressoir"].push({ start: a + "-10-01", end: (a + 1) + "-04-01" });
    OCCUPE.cloudelin.push({ start: a + "-06-15", end: a + "-09-15" });
  });
  OCCUPE["l-ecurie"].push({ start: plus(3), end: plus(6) }, { start: plus(12), end: plus(14) }, { start: plus(24), end: plus(31) });
  OCCUPE["le-pressoir"].push({ start: plus(5), end: plus(8) }, { start: plus(19), end: plus(22) });
  OCCUPE["le-guesthouse"].push({ start: plus(9), end: plus(13) });
  OCCUPE.cloudelin.push({ start: plus(16), end: plus(20) });

  var OPTIONS = [
    { id: "taxe", name: "Taxe de séjour", priceCents: 187, unit: "personne_nuit", mandatory: true },
    { id: "draps", name: "Draps fournis, lits faits à l’arrivée", priceCents: 0, unit: "sejour", included: true },
    { id: "petit-dejeuner", name: "Petit déjeuner maison, face à la vue", priceCents: 1000, unit: "personne_nuit" },
    { id: "diner", name: "Dîner à la table d’hôtes (un soir, apéritif offert)", priceCents: 2500, unit: "personne" },
    { id: "menage-ecurie", name: "Forfait ménage", priceCents: 4000, unit: "sejour", logementIds: ["l-ecurie"] },
    { id: "menage-pressoir", name: "Forfait ménage", priceCents: 5000, unit: "sejour", logementIds: ["le-pressoir"] },
    { id: "menage-guesthouse", name: "Forfait ménage", priceCents: 6000, unit: "sejour", logementIds: ["le-guesthouse"] },
    { id: "menage-cloudelin", name: "Forfait ménage", priceCents: 8000, unit: "sejour", logementIds: ["cloudelin"] },
    { id: "linge-toilette", name: "Linge de toilette", priceCents: 500, unit: "personne", logementIds: ["cloudelin"] },
  ].map(function (o) {
    return { id: o.id, name: o.name, priceCents: o.priceCents, unit: o.unit, logementIds: o.logementIds || [], appliesTo: "all",
      minGuests: null, minNights: null, included: !!o.included, mandatory: !!o.mandatory, maxGuests: null, maxNights: null,
      periodStart: null, periodEnd: null, includedGuests: null, adultsOnly: false };
  });

  var CONDITIONS = [
    { id: "arrivee", title: "Arrivée et départ", body: "Arrivée de 16 h à 19 h (prévenez-nous si vous arrivez plus tard).\nDépart à 10 h 30 à L’Écurie et au Pressoir (10 h en été), à 10 h au Guesthouse et à Cloudelin." },
    { id: "adultes", title: "Une maison pensée pour les adultes", body: "La piscine est réservée aux plus de 18 ans et les hébergements n’ont pas d’équipement pour les enfants. Les animaux ne sont pas admis. Toute la propriété est non-fumeur : la télécabine sert de fumoir." },
    { id: "arrhes", title: "Confirmation", body: "La réservation est confirmée par des arrhes de 30 % du séjour, par chèque ou virement. Paiement en espèces, par chèque ou par virement." },
  ];
  var QUESTIONS = [
    { id: "allergies", label: "Avez-vous des allergies alimentaires (petit déjeuner, table d’hôtes) ?" },
    { id: "heure", label: "À quelle heure pensez-vous arriver ?" },
    { id: "velos", label: "Venez-vous avec des vélos à mettre à l’abri ?" },
  ];

  var nuits = function (a, b) { return Math.round((date(b) - date(a)) / JOUR); };
  var chevauche = function (a, b, r) { return a < r.end && r.start < b; };
  var byId = function (id) { return LOGEMENTS.filter(function (l) { return l.id === id; })[0]; };
  var lies = function (l) { return [l.id].concat(l.contains, LOGEMENTS.filter(function (o) { return o.contains.indexOf(l.id) >= 0; }).map(function (o) { return o.id; })); };
  var libre = function (l, a, b) { return !lies(l).some(function (id) { return OCCUPE[id].some(function (r) { return chevauche(a, b, r); }); }); };

  // Prix de l'hébergement, nuit par nuit, selon les grilles du site actuel
  function prixNuits(l, a, b, personnes) {
    var n = nuits(a, b), dates = [];
    for (var i = 0; i < n; i++) dates.push(iso(new Date(date(a).getTime() + i * JOUR)));
    var parNuit;
    if (l.forfaits) {
      var col = vacances(a) ? 1 : 0;
      var total = n <= 7 ? l.forfaits[Math.max(2, n)][col] : Math.round(l.forfaits[7][col] / 7 * n);
      parNuit = dates.map(function (d, i) { return Math.floor(total / n) + (i === n - 1 ? total % n : 0); });
    } else {
      var s = saison(a), semaines = Math.floor(n / 7);
      parNuit = dates.map(function (d, i) {
        var p = i < semaines * 7 ? Math.round(l.semaine[s] / 7) : l.nuit[saison(d)] || l.nuit[s];
        if (l.supplement && personnes > l.comprises) p += (personnes - l.comprises) * l.supplement;
        return p;
      });
    }
    return dates.map(function (d, i) { return { date: d, priceCents: parNuit[i] }; });
  }
  var somme = function (t) { return t.reduce(function (s, x) { return s + x.priceCents; }, 0); };

  function planning() {
    return { hidden: false, today: iso(auj), privacyUrl: null, questions: QUESTIONS, conditions: CONDITIONS, options: OPTIONS,
      logements: LOGEMENTS.map(function (l) {
        return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
          minNights: l.minNights, minStays: [], contains: l.contains, occupied: OCCUPE[l.id] };
      }) };
  }

  function disponibilites(p) {
    var a = p.get("start"), b = p.get("end"), g = +p.get("guests") || 1, n = nuits(a, b);
    return { hidden: false, nights: n, guests: g, logements: LOGEMENTS.map(function (l) {
      var ok = libre(l, a, b), assez = n >= l.minNights;
      return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
        fits: g <= l.capacity, minNights: l.minNights, available: ok && assez,
        reason: !ok ? "occupe" : !assez ? "nuits_minimum" : g > l.capacity ? "places" : null,
        accommodationCents: ok && assez ? somme(prixNuits(l, a, b, Math.min(g, l.capacity))) : null };
    }) };
  }

  function devis(p) {
    var ids = (p.get("logement") || "").split(",").filter(Boolean), a = p.get("start"), b = p.get("end");
    var g = +p.get("guests") || 1, enfants = +p.get("children") || 0, n = nuits(a, b);
    var choisis = ids.map(byId).filter(Boolean);
    var dispo = choisis.length > 0 && choisis.every(function (l) { return libre(l, a, b) && n >= l.minNights; });
    var places = choisis.reduce(function (s, l) { return s + l.capacity; }, 0);
    var reste = g, lignes = [], nuitees = {};
    choisis.forEach(function (l) {
      var ici = Math.min(reste, l.capacity); reste -= ici;
      var t = prixNuits(l, a, b, ici);
      t.forEach(function (x) { nuitees[x.date] = (nuitees[x.date] || 0) + x.priceCents; });
      lignes.push({ id: l.id, name: l.name, accommodationCents: somme(t) });
    });
    var hebergement = lignes.reduce(function (s, x) { return s + x.accommodationCents; }, 0);
    var voulues = (p.get("options") || "").split(",").filter(Boolean);
    var extras = OPTIONS.filter(function (o) {
      var permise = !o.logementIds.length || choisis.some(function (l) { return o.logementIds.indexOf(l.id) >= 0; });
      return permise && (o.mandatory || o.included || voulues.indexOf(o.id) >= 0);
    }).map(function (o) {
      var q = o.unit === "sejour" ? 1 : o.unit === "personne" ? g : o.unit === "personne_nuit" ? g * n : n;
      var e = { id: o.id, name: o.name, unit: o.unit, quantity: q, unitPriceCents: o.priceCents, totalCents: o.priceCents * q };
      if (o.mandatory) e.mandatory = true;
      if (o.included) e.included = true;
      return e;
    });
    return { hidden: false, available: dispo && g <= places, nights: n, guests: g, children: enfants,
      minNights: Math.max.apply(null, choisis.map(function (l) { return l.minNights; }).concat(1)), capacity: places,
      nightly: Object.keys(nuitees).sort().map(function (d) { return { date: d, priceCents: nuitees[d] }; }),
      lines: lignes, accommodationCents: hebergement, extras: extras,
      totalCents: hebergement + extras.reduce(function (s, e) { return s + e.totalCents; }, 0) };
  }

  var repondre = function (corps) {
    return Promise.resolve(new Response(JSON.stringify(corps), { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  var vraiFetch = window.fetch.bind(window);
  window.fetch = function (entree, init) {
    var url = typeof entree === "string" ? entree : entree && entree.url;
    if (!url || url.indexOf(DEMO_API) !== 0) return vraiFetch(entree, init);
    var u = new URL(url);
    // Maquette : la demande et l'e-mail ne partent nulle part, le visiteur voit simplement « Merci »
    if (url.indexOf(DEMO_ENVOI) === 0 || /\/requests$/.test(u.pathname)) return repondre({ success: true, demo: true });
    if (/\/image\//.test(u.pathname)) return vraiFetch(entree, init);
    if (/\/planning$/.test(u.pathname)) return repondre(planning());
    if (/\/availability$/.test(u.pathname)) return repondre(disponibilites(u.searchParams));
    if (/\/quote$/.test(u.pathname)) return repondre(devis(u.searchParams));
    return Promise.resolve(new Response("{}", { status: 404 }));
  };
})();
