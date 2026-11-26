/* Shared page behaviour for the site. publications.js (loaded first) defines publicationTopics and publications. */
(function () {
  "use strict";

  const SELF = "Ahmed Bou-Rabee";
  // Selected work on the homepage, chosen by the author; shown newest first.
  const SELECTED = ["sandpile-avalanches-finite", "eulerian-walkers", "algebraic-sd", "superdiffusive-clt-brownian-particle", "integer-superharmonic-matrices", "dynamic-dimensional-reduction"];
  // Palomar registry entries, from data.palomar-registry.org/repositories/{owner}/{repo}.json (checked 2026-11-26).
  const PALOMAR = {
    "nitromannitol/dynamic-dimensional-reduction": "PALOMAR-2026-10-27-000012",
    "nitromannitol/fpp-variance": "PALOMAR-2026-11-01-000017",
    "nitromannitol/orrw-lower-bound": "PALOMAR-2026-10-27-000011",
    "nitromannitol/random-walk-on-sphere-packings": "PALOMAR-2026-10-27-000015",
    "nitromannitol/subdiffusive-process": "PALOMAR-2026-10-11-000009",
    "nitromannitol/unique-continuation-planar": "PALOMAR-2026-10-27-000010",
    "scottnarmstrong/superdiffusion": "PALOMAR-2026-09-18-000001",
    "scottnarmstrong/superdiffusionclt": "PALOMAR-2026-10-05-000008"
  };

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const pubs = typeof publications !== "undefined" ? publications : [];
  const byId = Object.fromEntries(pubs.map(p => [p.id, p]));
  const linkOf = (p, type) => (p.links.find(l => l.type === type) || {}).url;
  const external = u => /^https?:/.test(u);
  const attrs = u => external(u) ? ' rel="noopener"' : "";
  const a = (href, html, cls) => `<a href="${href}"${cls ? ` class="${cls}"` : ""}${attrs(href)}>${html}</a>`;
  const newestFirst = (x, y) => (y.posted || String(y.year)).localeCompare(x.posted || String(x.year));

  function fullDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  }
  function names(list) {
    const html = list.map(au => au.url ? a(au.url, au.name) : au.name);
    if (html.length === 1) return html[0];
    if (html.length === 2) return `${html[0]} and ${html[1]}`;
    return `${html.slice(0, -1).join(", ")}, and ${html[html.length - 1]}`;
  }
  function journalText(p) {
    if (!p.journal) return "";
    let s = p.journal;
    if (p.volume) s += " " + p.volume;
    if (p.pages) s += ", " + String(p.pages).replace(/(\d)-(\d)/g, "$1–$2");
    return s.replace(/\.$/, "");
  }
  function thumbSrc(p) {
    if (!p.thumbnail) return "";
    const m = p.thumbnail.match(/([^/]+)\.png$/);
    return m ? `images/thumbs/${m[1]}.webp` : p.thumbnail;
  }

  // ---------- one entry ----------
  function linkRow(p, withTools) {
    const items = p.links.filter(l => l.type !== "arXiv")
      .sort((x, y) => (x.type === "Journal" ? -1 : 0) - (y.type === "Journal" ? -1 : 0))
      .map(l => a(l.url, l.label || l.type));
    if (withTools) {
      if (p.abstract) items.push(`<button type="button" data-summary="${p.id}" aria-expanded="false" aria-controls="sum-${withTools}-${p.id}">Summary</button>`);
      items.push(`<button type="button" data-bibtex="${p.id}">BibTeX</button>`);
      items.push(`<button type="button" data-permalink="${p.id}">Copy link</button>`);
    }
    return items.length ? ` <span class="links">${items.map(x => `<span>${x}</span>`).join("")}</span>` : "";
  }
  function summaryBox(p, key) {
    return key && p.abstract ? `<div class="abstract" id="sum-${key}-${p.id}" hidden>${p.abstract}</div>` : "";
  }
  function citation(p, key) {
    const arxiv = linkOf(p, "arXiv");
    const others = p.authors.filter(au => au.name !== SELF);
    let s = a(arxiv, p.title, "t");
    if (others.length) s += ` (with ${names(others)})`;
    s += ".";
    const j = journalText(p);
    if (j) s += ` <span class="journal">${j}</span>.`;
    if (p.posted) s += ` ${a(arxiv, `arXiv, ${fullDate(p.posted)}`, "posted")}.`;
    s += linkRow(p, key) + summaryBox(p, key);
    return `<li${key === "list" ? ` id="pub-${p.id}"` : ""}>${s}</li>`;
  }
  function card(p) {
    const arxiv = linkOf(p, "arXiv");
    const others = p.authors.filter(au => au.name !== SELF);
    const meta = [others.length ? `with ${names(others)}` : "", journalText(p), p.posted ? a(arxiv, `arXiv, ${fullDate(p.posted)}`, "posted") : ""].filter(Boolean).join(" · ");
    const src = thumbSrc(p);
    const thumb = src
      ? `<a class="thumb" href="${arxiv}" tabindex="-1" aria-hidden="true"${attrs(arxiv)}><img src="${src}" alt="" loading="lazy" decoding="async" width="124" height="124">${p.thumbnailAnimation ? `<canvas data-kind="${p.thumbnailAnimation}" aria-hidden="true" hidden></canvas>` : ""}</a>`
      : `<span class="thumb" aria-hidden="true"></span>`;
    return `<li class="card" id="card-${p.id}">${thumb}<div class="card-body">${a(arxiv, p.title, "t")}<span class="meta">${meta}</span>${linkRow(p, "card")}${summaryBox(p, "card")}</div></li>`;
  }

  // ---------- BibTeX and copying (as on the earlier homepage) ----------
  function plain(html) { const t = document.createElement("template"); t.innerHTML = html; return (t.content.textContent || "").trim(); }
  function bibtex(p) {
    const arxiv = linkOf(p, "arXiv");
    const eprint = arxiv ? arxiv.replace(/.*arxiv\.org\/abs\//i, "").replace(/\/$/, "") : null;
    const published = !!p.journal && !p.status;
    const lines = [`@${published ? "article" : "unpublished"}{${p.id.replace(/-/g, "_")},`];
    lines.push(`  author  = {${p.authors.map(au => au.name).join(" and ")}},`);
    lines.push(`  title   = {${p.bibtexTitle || plain(p.title)}},`);
    if (p.journal) lines.push(`  journal = {${p.journal}},`);
    if (p.volume) lines.push(`  volume  = {${p.volume}},`);
    if (p.pages) lines.push(`  pages   = {${p.pages}},`);
    if (p.year) lines.push(`  year    = {${p.year}},`);
    if (p.status) lines.push(`  note    = {${p.status}},`);
    if (eprint) lines.push(`  eprint  = {${eprint}},\n  archivePrefix = {arXiv},`);
    lines.push("}");
    return lines.join("\n");
  }
  function copy(text, btn) {
    const label = btn.textContent;
    const flash = msg => { btn.textContent = msg; btn.classList.add("done"); setTimeout(() => { btn.textContent = label; btn.classList.remove("done"); }, 1500); };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove(); return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash("Copied"), () => flash(fallback() ? "Copied" : "Copy failed"));
    } else flash(fallback() ? "Copied" : "Copy failed");
  }
  document.addEventListener("click", e => {
    const s = e.target.closest("button[data-summary]");
    if (s) {
      const box = document.getElementById(s.getAttribute("aria-controls"));
      const open = s.getAttribute("aria-expanded") !== "true";
      s.setAttribute("aria-expanded", String(open)); box.hidden = !open;
      return;
    }
    const b = e.target.closest("button[data-bibtex]");
    if (b) { copy(bibtex(byId[b.dataset.bibtex]), b); return; }
    const l = e.target.closest("button[data-permalink]");
    if (l) {
      const url = location.href.split("#")[0] + "#pub-" + l.dataset.permalink;
      copy(url, l);
      history.replaceState(null, "", "#pub-" + l.dataset.permalink);
    }
  });

  // ---------- menu: mark the current page ----------
  const page = document.body.dataset.page;
  document.querySelectorAll(".menu a").forEach(m => { if (m.dataset.page === page) m.setAttribute("aria-current", "page"); });

  // ---------- homepage ----------
  const selected = document.getElementById("selected");
  if (selected) selected.innerHTML = SELECTED.map(id => byId[id]).filter(Boolean).sort(newestFirst).map(p => citation(p, "")).join("");

  // ---------- publications page ----------
  const topicList = document.getElementById("topic-list");
  if (topicList) {
    topicList.innerHTML = publicationTopics.map(t => {
      const items = pubs.filter(p => p.topic === t.id).sort(newestFirst);
      if (!items.length) return "";
      return `<section class="topic" id="pub-topic-${t.id}"><h2><button type="button" class="topic-toggle" aria-expanded="false" aria-controls="topic-body-${t.id}">${t.title}<span class="chev" aria-hidden="true"></span></button></h2>` +
        `<div class="topic-body" id="topic-body-${t.id}" hidden>` +
        `<ul class="cites pub-list">${items.map(p => citation(p, "list")).join("")}</ul>` +
        `<ul class="cards pub-cards" hidden>${items.map(card).join("")}</ul></div></section>`;
    }).join("");

    const anim = window.PublicationThumbnailAnimations;
    if (anim) document.querySelectorAll(".card canvas[data-kind]").forEach(c => anim.attach(c, c.dataset.kind, c.previousElementSibling));

    const setView = v => {
      document.querySelectorAll(".pub-list").forEach(el => { el.hidden = v !== "list"; });
      document.querySelectorAll(".pub-cards").forEach(el => { el.hidden = v !== "pictures"; });
      document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
      try { localStorage.setItem("pub-view", v); } catch (e) { /* storage unavailable */ }
    };
    document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
    try { const v = localStorage.getItem("pub-view"); if (v === "list" || v === "pictures") setView(v); } catch (e) { /* storage unavailable */ }

    // topic headings open and close their papers; all start closed, as on the earlier homepage
    const setTopic = (section, open) => {
      const btn = section.querySelector(".topic-toggle");
      btn.setAttribute("aria-expanded", String(open));
      section.querySelector(".topic-body").hidden = !open;
    };
    topicList.addEventListener("click", e => {
      const btn = e.target.closest(".topic-toggle");
      if (btn) setTopic(btn.closest(".topic"), btn.getAttribute("aria-expanded") !== "true");
    });

    const showHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (!h) return;
      let el = document.getElementById(h);
      if (!el) return;
      const topic = el.closest(".topic");
      if (topic) setTopic(topic, true);
      if (h.startsWith("pub-") && !h.startsWith("pub-topic-") && el.closest("[hidden]")) setView("list");
      el = document.getElementById(h);
      el.scrollIntoView();
      el.classList.remove("target"); void el.offsetWidth; el.classList.add("target");
    };
    window.addEventListener("hashchange", showHash);
    showHash();
  }

  // ---------- Lean page ----------
  const leanList = document.getElementById("lean-list");
  if (leanList) {
    const formalized = pubs.filter(p => linkOf(p, "Lean"));
    const pct = (100 * formalized.length / pubs.length).toFixed(2);
    document.getElementById("tracker").innerHTML =
      `<span class="count">${formalized.length}/${pubs.length}</span><span class="bar" aria-hidden="true"><span style="width: ${pct}%"></span></span>`;
    document.getElementById("tracker").setAttribute("aria-label", `${formalized.length} of ${pubs.length} papers formalized`);
    leanList.innerHTML = formalized.slice().sort(newestFirst).map(p => {
      const repo = linkOf(p, "Lean");
      const key = repo.replace("https://github.com/", "").replace(/\/tree\/.*$/, "").toLowerCase();
      const entry = PALOMAR[key];
      return `<li><span>${a(repo, p.title, "t")}</span><span class="links">${entry ? `<span>${a("https://palomar-registry.org/entry?id=" + entry, "Palomar")}</span>` : ""}</span></li>`;
    }).join("");
  }
}());
