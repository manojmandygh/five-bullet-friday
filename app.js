(function () {
  "use strict";
  var PALETTE = [
    ["#B45830", "#7a3418"], ["#7A8B6F", "#4f5c46"], ["#4A6C8C", "#2f4459"],
    ["#8C6B4A", "#5c4630"], ["#6B5B95", "#463a63"], ["#3F6B5A", "#284439"],
    ["#9C5B6B", "#663843"], ["#5A6B8C", "#3a4459"], ["#A66A2E", "#6e4519"]
  ];
  var KIND = { book: "Book", music: "Music" };
  var PAGE = 60;

  function hash(s) { var h = 0; s = s || ""; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function coverSrc(item) {
    var c = item.cover || "";
    if (window.__THUMBS && window.__THUMBS[c]) return window.__THUMBS[c];
    if (c.indexOf("assets/") === 0) return c;
    return null;
  }
  function metaLine(item) {
    var m = item.author ? esc(item.author) : "";
    if (item.year) m += (m ? " \u00b7 " : "") + esc(item.year);
    return m;
  }

  // ---- cover cards (books, music) ----
  function coverCard(item, type) {
    var a = document.createElement("a");
    a.className = "card"; a.setAttribute("data-media", type);
    a.href = item.link || "#"; a.target = "_blank"; a.rel = "noopener";
    var pal = PALETTE[hash(item.title) % PALETTE.length];
    var fb = '<div class="cover-fallback" style="background:linear-gradient(150deg,' + pal[0] + "," + pal[1] + ')">' +
      '<span class="fb-kind">' + (KIND[type] || "") + "</span>" +
      "<div><div class=\"fb-title\">" + esc(item.title) + "</div>" +
      (item.author ? '<div class="fb-author">' + esc(item.author) + "</div>" : "") + "</div></div>";
    var cover = document.createElement("div");
    cover.className = "cover"; cover.innerHTML = fb;
    var src = coverSrc(item);
    if (src) {
      var img = new Image(); img.alt = item.title || ""; img.loading = "lazy";
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      img.src = src; cover.appendChild(img);
    } else { a.setAttribute("data-enhance", "1"); }
    a.appendChild(cover);
    var m = document.createElement("div"); m.className = "card-meta";
    m.innerHTML = '<div class="card-title">' + esc(item.title) + "</div>" +
      (metaLine(item) ? '<div class="card-author">' + metaLine(item) + "</div>" : "");
    a.appendChild(m);
    a._item = item; a._type = type;
    return a;
  }

  // ---- list rows (videos, podcasts, tools, essays, people, other) ----
  function listRow(item) {
    var a = document.createElement("a");
    a.className = "row"; a.href = item.link || "#"; a.target = "_blank"; a.rel = "noopener";
    var meta = [];
    if (item.author) meta.push(esc(item.author));
    if (item.year) meta.push(esc(item.year));
    a.innerHTML = '<span class="r-mark">\u25AA</span>' +
      '<div class="r-body"><div class="r-title">' + esc(item.title) + "</div>" +
      (item.note ? '<div class="r-note">' + esc(item.note) + "</div>" : "") +
      (meta.length ? '<div class="r-meta">' + meta.join(" \u00b7 ") + "</div>" : "") +
      "</div><span class=\"r-arrow\">\u2192</span>";
    return a;
  }

  // ---- quote cards ----
  function quoteCard(item) {
    var fig = document.createElement("figure");
    fig.className = "quote";
    var cap = item.author ? '<figcaption>\u2014 ' + esc(item.author) + (item.year ? ' <span class="q-year">' + esc(item.year) + "</span>" : "") + "</figcaption>" : "";
    fig.innerHTML = "<blockquote>" + esc(item.title) + "</blockquote>" + cap;
    return fig;
  }

  function renderSection(cat) {
    var sec = document.querySelector('section[data-type="' + cat.type + '"]');
    if (!sec) return;
    var grid = sec.querySelector("[data-grid]");
    grid.innerHTML = "";
    var mode = (cat.type === "book" || cat.type === "music") ? "cover" : (cat.type === "quote" ? "quote" : "list");
    var items = cat.items || [];
    var shown = 0, btn = null;
    function make(it) { return mode === "cover" ? coverCard(it, cat.type) : mode === "quote" ? quoteCard(it) : listRow(it); }
    function draw(n) {
      var frag = document.createDocumentFragment();
      var end = Math.min(shown + n, items.length);
      for (var i = shown; i < end; i++) frag.appendChild(make(items[i]));
      grid.appendChild(frag); shown = end;
      if (btn) btn.style.display = shown >= items.length ? "none" : "block";
      if (mode === "cover") observeEnhance(grid);
    }
    if (items.length > PAGE) {
      btn = document.createElement("button");
      btn.className = "more"; btn.type = "button";
      btn.textContent = "Show more \u2014 " + items.length + " total";
      btn.addEventListener("click", function () { draw(PAGE); });
      sec.appendChild(btn);
    }
    draw(PAGE);
  }

  // ---- client-side progressive cover enhancement (live site only) ----
  var io = null;
  function observeEnhance(grid) {
    if (!("IntersectionObserver" in window)) return;
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); enhance(e.target); } });
      }, { rootMargin: "300px" });
    }
    grid.querySelectorAll('.card[data-enhance="1"]').forEach(function (c) { c.removeAttribute("data-enhance"); io.observe(c); });
  }
  function jget(url) { return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function q(item) { return encodeURIComponent((item.title + " " + (item.author || "")).trim()); }
  function enhance(card) {
    var item = card._item, type = card._type, cover = card.querySelector(".cover");
    if (!item || !cover) return;
    var getter = type === "music"
      ? jget("https://itunes.apple.com/search?limit=1&media=music&term=" + q(item)).then(function (d) {
          var r = d && d.results && d.results[0]; return r && r.artworkUrl100 ? r.artworkUrl100.replace("100x100", "400x400") : null; })
      : jget("https://openlibrary.org/search.json?limit=1&fields=cover_i&q=" + q(item)).then(function (d) {
          var r = d && d.docs && d.docs[0]; return r && r.cover_i ? "https://covers.openlibrary.org/b/id/" + r.cover_i + "-L.jpg" : null; });
    getter.then(function (url) {
      if (!url) return;
      var img = new Image(); img.alt = item.title || ""; img.loading = "lazy";
      img.onload = function () { cover.appendChild(img); }; img.src = url;
    });
  }

  function buildJump(data) {
    var jump = document.querySelector(".jump");
    if (!jump) return;
    var idmap = { book: "books", music: "music", video: "videos", podcast: "podcasts", tool: "tools", essay: "essays", quote: "quotes", people: "people", other: "other" };
    data.categories.forEach(function (cat) {
      if (!cat.items || !cat.items.length) return;
      var a = document.createElement("a");
      a.href = "#" + (idmap[cat.type] || cat.type);
      a.innerHTML = esc(cat.name) + ' <span class="n">' + cat.items.length + "</span>";
      jump.appendChild(a);
    });
  }

  function boot(data) { buildJump(data); data.categories.forEach(renderSection); }

  if (window.__DATA) { boot(window.__DATA); }
  else {
    fetch("data.json").then(function (r) { return r.json(); }).then(boot).catch(function () {
      document.querySelectorAll("[data-grid]").forEach(function (g) { g.innerHTML = '<p class="loading">Could not load data.</p>'; });
    });
  }
})();
