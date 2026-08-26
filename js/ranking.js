/* Ranking del Odiómetro y ficha por candidata.
   Lee el mismo estado.json que el tablero; no calcula nada que el backend no
   haya calculado ya. Sin volúmenes: sólo magnitudes, porcentajes y razones. */
(function () {
  "use strict";

  var RANGO = "15d";                       // la ventana del padrón completo
  var BANDAS = [[0, 2, "Calma", "--b1"], [2, 3.5, "Murmullo", "--b2"], [3.5, 5, "Tensión", "--b3"],
                [5, 7, "Hostigamiento", "--b4"], [7, 11, "Linchamiento", "--b5"]];
  /* Paleta categórica validada: banda de luminosidad, saturación, separación
     para daltonismo entre vecinos y contraste 3:1 sobre blanco. */
  var COL = ["#7a3d94", "#c8761f", "#0a83a0", "#6f8f2a", "#d46aa8", "#2f4f8f"];

  var E = null, CAT = [], FICHAS = {};

  function es(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(".", ","); }
  function esc(t) { return String(t == null ? "" : t).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); }
  function banda(m) { for (var i = 0; i < BANDAS.length; i++) if (m >= BANDAS[i][0] && m < BANDAS[i][1]) return BANDAS[i]; return BANDAS[4]; }
  function $(id) { return document.getElementById(id); }

  /* ---------- vistas: #ranking (por defecto) y #tablero ---------- */
  var marcoCargado = false;
  function vista() {
    var tab = location.hash === "#tablero";
    document.body.classList.toggle("vista-tablero", tab);
    document.body.classList.toggle("vista-ranking", !tab);
    document.querySelectorAll(".vistas a").forEach(function (a) {
      var activa = (a.getAttribute("href") === "#tablero") === tab;
      if (activa) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (tab && !marcoCargado) {
      var f = document.querySelector(".tablero iframe[data-src]");
      if (f) { f.src = f.dataset.src; marcoCargado = true; }
    }
    if (!tab) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", vista);

  /* ---------- filas ---------- */
  function fila(pos, p) {
    var q = "<b>" + esc(p.n) + "</b><span>" + esc(p.r) + "</span>";
    var foto = function (col) {
      return '<span class="fila__foto"' + (col ? ' style="--b:var(' + col + ')"' : "") + ">" +
        (p.img ? '<img src="' + p.img + '" alt="">' : "") + "</span>";
    };
    if (p.mag == null) {
      return '<li class="fila fila--sin"><span class="fila__pos">—</span>' + foto() +
        '<span class="fila__quien">' + q + '</span><span class="fila__mag">—</span>' +
        '<span class="fila__barra"><i style="width:0"></i></span>' +
        '<span class="fila__leer"><b>Sin medición</b><span>muestra insuficiente, no cero</span></span></li>';
    }
    var b = banda(p.mag);
    if (!p.hostiles) {
      return '<li class="fila fila--irrel" data-n="' + esc(p.n) + '" tabindex="0"><span class="fila__pos">' + pos + "</span>" + foto() +
        '<span class="fila__quien">' + q + '</span><span class="fila__mag">—</span>' +
        '<span class="fila__barra"><i style="width:0"></i></span>' +
        '<span class="fila__leer"><b>Hostilidad irrelevante</b></span></li>';
    }
    var tend = p.d > .05 ? "▲" : p.d < -.05 ? "▼" : "=";
    var tcl = p.d > .05 ? "sube" : p.d < -.05 ? "baja" : "igual";
    var que = (p.desprop && p.desprop.razon >= 1)
      ? '<span class="fila__que"><i>' + esc(CAT[p.desprop.cat - 1]) + "</i> · <b>" + es(p.desprop.razon, 1) + "×</b></span>"
      : p.aislados ? '<span class="fila__que">ataques aislados</span>'
      : '<span class="fila__que">en ninguna categoría supera al control</span>';
    return '<li class="fila" data-n="' + esc(p.n) + '" tabindex="0"><span class="fila__pos">' + pos + "</span>" + foto(b[3]) +
      '<span class="fila__quien">' + q + "</span>" +
      '<span class="fila__mag" style="color:var(' + b[3] + ')">' + es(p.mag, 1) + "</span>" +
      '<span class="fila__barra" aria-label="magnitud ' + es(p.mag, 1) + ' de 10"><i style="width:' + (10 * p.mag).toFixed(1) + "%;background:var(" + b[3] + ')"></i></span>' +
      '<span class="fila__leer"><b>' + b[2] + (p.d == null ? "" : ' <small data-t="' + tcl + '" title="frente al periodo anterior">' + tend + " " + es(Math.abs(p.d), 1) + "</small>") + "</b>" + que + "</span></li>";
  }

  function pintar() {
    var r = E.rangos[RANGO];
    var gente = r.people.map(function (p, i) {
      return { n: p.n, r: p.r, img: p.img, mag: r.stations[i], d: r.stDelta[i],
               hostiles: p.incidencias || 0, desprop: (p.desprop && p.desprop.razon >= 1) ? p.desprop : null, aislados: !!p.aislados,
               tasa: p.tasa, cuota: p.cuotaHandle, razon: p.razonControl, cats: p.cats || [],
               top: p.concentraTop, atacantes: (p.atacantes || []).slice(0, 3) };
    });
    var medidas = gente.filter(function (p) { return p.mag != null; }).sort(function (a, b) { return b.mag - a.mag; });
    var sin = gente.filter(function (p) { return p.mag == null; });
    $("rkLista").innerHTML = medidas.map(function (p, i) { return fila(i + 1, p); }).join("") + sin.map(function (p) { return fila(null, p); }).join("");
    gente.forEach(function (p) { FICHAS[p.n] = p; });
    var cierre = E.cierre ? new Date(E.cierre) : null;
    var rot = $("rkActualizado");
    if (rot && cierre) rot.textContent = "Datos al " + cierre.getDate() + " " + ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][cierre.getMonth()] + ".";
  }

  /* ---------- ficha ---------- */
  function celda(rot, val, pie, txt) {
    return '<div class="ficha__c"><p class="rot">' + rot + "</p><b" + (txt ? ' class="txt"' : "") + ">" + val + "</b>" + (pie ? "<span>" + pie + "</span>" : "") + "</div>";
  }
  function donut(v) {
    var R = 54, C = 2 * Math.PI * R, off = 0, a = "", t = v.reduce(function (x, y) { return x + y; }, 0) || 1;
    for (var k = 0; k < v.length; k++) {
      var f = v[k] / t;
      if (f > 0) a += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + COL[k] + '" stroke-width="15" stroke-dasharray="' + Math.max(0, f * C - 2) + " " + C + '" stroke-dashoffset="' + (-off * C) + '"></circle>';
      off += f;
    }
    var iM = 0; for (var j = 1; j < v.length; j++) if (v[j] > v[iM]) iM = j;
    return '<svg width="152" height="152" viewBox="0 0 140 140" role="img" aria-label="Composición por categoría">' + a +
      '<text x="70" y="70" transform="rotate(90 70 70)" text-anchor="middle" dominant-baseline="central" font-family="Schibsted Grotesk, system-ui" font-size="27" font-weight="800" fill="#262427">' + Math.round(v[iM]) + "%</text></svg>";
  }
  function identicon(seed) { var h = ((seed || 100) * 2654435761) % 360; return '<i style="background:hsl(' + h + ',35%,78%)"></i>'; }

  var origenFoco = null;
  function abrir(nombre, origen) {
    var p = FICHAS[nombre]; if (!p) return;
    var b = p.mag == null ? null : banda(p.mag);
    $("fichaCab").innerHTML = '<span class="fila__foto" style="--b:var(' + (b ? b[3] : "--regla-2") + ')">' + (p.img ? '<img src="' + p.img + '" alt="">' : "") + "</span>" +
      "<div><h3 id='fichaNom'>" + esc(p.n) + "</h3><p class='ficha__rol'>" + esc(p.r) + "</p></div>";
    var razon = p.razon == null ? "sin comparación" : p.razon >= 1.05 ? es(p.razon, 1) + "× más" : p.razon <= .95 ? es(1 / p.razon, 1) + "× menos" : "igual";
    var fl = (p.mag == null || p.d == null) ? "—" : (p.d > .05 ? "▲ " : p.d < -.05 ? "▼ " : "= ") + es(Math.abs(p.d), 1);
    var desp = (p.desprop && p.desprop.razon >= 1) ? esc(CAT[p.desprop.cat - 1]) + " · " + es(p.desprop.razon, 1) + "×" : p.aislados ? "ataques aislados" : "en ninguna categoría";
    $("fichaCifras").innerHTML =
      celda("Magnitud", p.mag == null ? "—" : es(p.mag, 1), p.mag == null ? "sin medición" : (p.hostiles ? b[2] : "hostilidad irrelevante")) +
      celda("Hostilidad", p.tasa == null ? "—" : es(p.tasa, 1) + " %", "de lo que se dice de ella") +
      celda("Frente al control", razon, "en total, mismo periodo", p.razon == null) +
      celda("Qué se dispara", desp, "frente al grupo de control", true) +
      celda("Tendencia", fl, p.d == null ? "sin periodo anterior medido" : "vs. periodo anterior", p.d == null) +
      celda("A su cuenta", p.cuota == null ? "—" : Math.round(p.cuota * 100) + " %", "el resto la nombran");
    var hay = p.cats.some(function (x) { return x > 0; });
    $("fichaComp").innerHTML = "<h4>De qué está hecha su hostilidad</h4>" + (hay
      ? '<div class="ficha__don">' + donut(p.cats) + '<div class="ficha__ley">' + CAT.map(function (c, k) {
          return '<div data-cero="' + (p.cats[k] ? "no" : "si") + '"><i style="background:' + COL[k] + '"></i><span>' + esc(c) + "</span><b>" + p.cats[k] + " %</b></div>";
        }).join("") + "</div></div>"
      : '<p class="ficha__rol">Demasiado poca hostilidad para describirla.</p>');
    var fr = [];
    if (hay) { var iM = 0; for (var q = 1; q < p.cats.length; q++) if (p.cats[q] > p.cats[iM]) iM = q; fr.push("<b>" + esc(CAT[iM]) + "</b> concentra el <b>" + p.cats[iM] + " %</b> de lo que recibe"); }
    if (p.top != null && p.atacantes.length) fr.push("tres cuentas explican el <b>" + es(p.top, 1) + " %</b> de sus mensajes hostiles");
    if (p.razon != null) fr.push("y en total recibe <b>" + razon + "</b> que su control");
    $("fichaInsight").innerHTML = fr.length ? fr.join(", ").replace(/, y /, " y ") + "." : "Todavía no hay suficiente hostilidad para decir nada sobre ella.";
    $("fichaCuentas").innerHTML = p.atacantes.length
      ? "<h4>Quién la ataca más</h4>" + p.atacantes.map(function (a) {
          var parte = p.hostiles ? Math.round(100 * a.hostiles / p.hostiles) : 0;
          return '<div class="ficha__cta">' + identicon(a.s) + "<span>" + esc(a.h) + '</span><span class="n"><b>' + parte + " %</b> de lo hostil que recibe</span></div>";
        }).join("")
      : "";
    origenFoco = origen || null;
    $("fichaFondo").hidden = false;
    $("fichaX").focus();
  }
  function cerrar() { $("fichaFondo").hidden = true; if (origenFoco && origenFoco.focus) origenFoco.focus(); origenFoco = null; }

  /* ---------- arranque ---------- */
  function cablear() {
    $("rkLista").addEventListener("click", function (ev) {
      var f = ev.target.closest ? ev.target.closest(".fila[data-n]") : null;
      if (f) abrir(f.dataset.n, f);
    });
    $("rkLista").addEventListener("keydown", function (ev) {
      var f = ev.target.closest ? ev.target.closest(".fila[data-n]") : null;
      if (f && ev.key === "Enter") abrir(f.dataset.n, f);
    });
    $("fichaX").addEventListener("click", cerrar);
    $("fichaFondo").addEventListener("click", function (ev) { if (ev.target === this) cerrar(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !$("fichaFondo").hidden) cerrar(); });
  }

  vista();
  cablear();
  fetch("tablero/estado.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (e) { E = e; CAT = e.catNames || []; pintar(); })
    .catch(function () {
      $("rkLista").innerHTML = '<li class="rk__error">No se pudo cargar el ranking. Vuelve a intentarlo en un momento.</li>';
    });
})();
