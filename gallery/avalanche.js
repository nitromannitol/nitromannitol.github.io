/* Sandpile avalanches in two dimensions.  An exact stationary sample of the
   wired box [-64,64]^2: Wilson's algorithm draws a uniform spanning tree, and
   the burning bijection (neighbours in the order N, E, S, W) turns it into a
   uniform recurrent sandpile.  One grain at the origin starts an avalanche,
   which runs wave by wave: the origin topples once, then the other sites
   stabilize with the origin as a sink.  Over the sandpile we draw the tree
   the burning bijection pairs with it, the minimal subtree containing the
   marked sites (the origin, its four neighbours and (r,0)), the past of their
   common ancestor, its path to the sink, and the lattice edges counted by L. */
(function (root) {
    'use strict';
    const HALF = 64, N = 2 * HALF + 1, SITES = N * N, CENTER = HALF * N + HALF, GAP = 8;
    // Neighbours in compass order N, E, S, W; -1 is the sink.
    const NB = new Int32Array(4 * SITES);
    for (let i = 0; i < SITES; i++) {
        const x = i % N, y = (i / N) | 0;
        NB[4 * i] = y + 1 < N ? i + N : -1; NB[4 * i + 1] = x + 1 < N ? i + 1 : -1;
        NB[4 * i + 2] = y ? i - N : -1; NB[4 * i + 3] = x ? i - 1 : -1;
    }
    const STEP = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    function hash(n) {
        n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
        n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
        return (n ^ n >>> 16) >>> 0;
    }
    function random(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6d2b79f5) >>> 0;
            let n = Math.imul(a ^ a >>> 15, a | 1);
            n ^= n + Math.imul(n ^ n >>> 7, n | 61);
            return ((n ^ n >>> 14) >>> 0) / 4294967296;
        };
    }
    /* Wilson's algorithm: from each site not yet in the tree, a random walk runs
       until it hits the tree or the sink; retracing its last exits gives the
       loop erasure, which joins the tree. */
    function wilson(seed) {
        const rand = random(seed), parent = new Int32Array(SITES), dir = new Int8Array(SITES);
        const next = new Int32Array(SITES), nextDir = new Int8Array(SITES), inTree = new Uint8Array(SITES);
        for (let start = 0; start < SITES; start++) {
            if (inTree[start]) continue;
            let u = start;
            while (u !== -1 && !inTree[u]) { const d = (rand() * 4) | 0; nextDir[u] = d; next[u] = NB[4 * u + d]; u = next[u]; }
            u = start;
            while (u !== -1 && !inTree[u]) { inTree[u] = 1; parent[u] = next[u]; dir[u] = nextDir[u]; u = next[u]; }
        }
        return { parent, dir };
    }
    function depths(parent) {
        const depth = new Int32Array(SITES), stack = new Int32Array(SITES);
        for (let v = 0; v < SITES; v++) {
            if (depth[v]) continue;
            let k = 0, u = v;
            while (u !== -1 && !depth[u]) { stack[k++] = u; u = parent[u]; }
            let t = u === -1 ? 0 : depth[u];
            while (k > 0) depth[stack[--k]] = ++t;
        }
        return depth;
    }
    /* Inverse burning bijection: a site burns at its depth in the tree; its
       height records how many neighbours burned before it and which of the
       neighbours burned one step earlier is its parent. */
    function sandpileFromTree(tree) {
        const depth = depths(tree.parent), height = new Uint8Array(SITES);
        for (let v = 0; v < SITES; v++) {
            let smaller = 0, previous = 0, index = -1;
            for (let d = 0; d < 4; d++) {
                const u = NB[4 * v + d], du = u === -1 ? 0 : depth[u];
                if (du < depth[v]) { smaller++; if (du === depth[v] - 1) { if (d === tree.dir[v]) index = previous; previous++; } }
            }
            height[v] = 4 - smaller + index;
        }
        return height;
    }
    /* Burning: the sink burns at step zero, and each later step burns every
       unburned site whose height is at least its number of unburned neighbours.
       Every site burns exactly when the sandpile is recurrent; the burning
       order then gives the tree.  Returns null for a sandpile that is not
       recurrent. */
    function treeFromSandpile(height) {
        const unburned = new Int8Array(SITES), depth = new Int32Array(SITES), parent = new Int32Array(SITES), dir = new Int8Array(SITES);
        let frontier = [], burned = 0, step = 1;
        for (let v = 0; v < SITES; v++) {
            let c = 0; for (let d = 0; d < 4; d++) if (NB[4 * v + d] !== -1) c++;
            unburned[v] = c; if (height[v] >= c) frontier.push(v);
        }
        while (frontier.length) {
            const now = [];
            for (const v of frontier) if (!depth[v]) { depth[v] = step; now.push(v); }
            burned += now.length;
            const next = [];
            for (const v of now) for (let d = 0; d < 4; d++) {
                const u = NB[4 * v + d];
                if (u === -1 || depth[u]) continue;
                if (height[u] >= --unburned[u]) next.push(u);
            }
            frontier = next; step++;
        }
        if (burned < SITES) return null;
        for (let v = 0; v < SITES; v++) {
            let smaller = 0; const previous = [];
            for (let d = 0; d < 4; d++) {
                const u = NB[4 * v + d], du = u === -1 ? 0 : depth[u];
                if (du < depth[v]) { smaller++; if (du === depth[v] - 1) previous.push(d); }
            }
            const d = previous[height[v] - (4 - smaller)];
            dir[v] = d; parent[v] = NB[4 * v + d];
        }
        return { parent, dir };
    }
    /* One grain at the origin, stabilized wave by wave.  round[v] is the
       breadth-first round in which v topples during a wave, or -1. */
    function avalanche(height) {
        const h = Uint8Array.from(height), odometer = new Uint16Array(SITES), waves = [];
        h[CENTER]++;
        while (h[CENTER] >= 4) {
            const round = new Int16Array(SITES).fill(-1), sites = [];
            let frontier = [CENTER], r = 0, last = 0;
            while (frontier.length) {
                const next = [];
                for (const v of frontier) {
                    if (round[v] >= 0 || h[v] < 4) continue;
                    round[v] = r; last = r; h[v] -= 4; odometer[v]++; sites.push(v);
                    for (let d = 0; d < 4; d++) {
                        const u = NB[4 * v + d];
                        if (u === -1) continue;
                        h[u]++;
                        if (u !== CENTER && h[u] >= 4 && round[u] < 0) next.push(u);
                    }
                }
                frontier = next; r++;
            }
            waves.push({ round, sites, rounds: last + 1 });
        }
        let start = 0;
        for (const w of waves) { w.start = start; start += w.rounds + GAP; }
        let maxCount = 0, radius = 0, support = 0, topplings = 0;
        for (let v = 0; v < SITES; v++) if (odometer[v]) {
            support++; topplings += odometer[v]; maxCount = Math.max(maxCount, odometer[v]);
            radius = Math.max(radius, Math.abs(v % N - HALF), Math.abs(((v / N) | 0) - HALF));
        }
        return { waves, final: h, odometer, maxCount, radius, support, topplings, length: Math.max(0, start - GAP) };
    }
    /* Step 1 of the proof, for the tree paired with the sandpile: the minimal
       subtree K containing the marked sites, the past of their common ancestor,
       its path to the sink, and the lattice edges from K to sites outside the
       past (the sink lies outside every past). */
    function geometry(tree, r) {
        const marked = [CENTER, NB[4 * CENTER], NB[4 * CENTER + 1], NB[4 * CENTER + 2], NB[4 * CENTER + 3], HALF * N + HALF + r];
        const count = new Uint8Array(SITES);
        for (const s of marked) { let u = s; while (u !== -1) { count[u]++; u = tree.parent[u]; } }
        let ancestor = -1;
        for (let u = marked[0]; u !== -1; u = tree.parent[u]) if (count[u] === marked.length) { ancestor = u; break; }
        const inK = new Uint8Array(SITES), K = [];
        for (const s of marked) for (let u = s; u !== -1; u = tree.parent[u]) { if (!inK[u]) { inK[u] = 1; K.push(u); } if (u === ancestor) break; }
        const inPast = new Uint8Array(SITES), ray = [];
        let contacts = [];
        if (ancestor !== -1) {
            const head = new Int32Array(SITES).fill(-1), link = new Int32Array(SITES);
            for (let v = 0; v < SITES; v++) { const p = tree.parent[v]; if (p !== -1) { link[v] = head[p]; head[p] = v; } }
            const stack = [ancestor];
            while (stack.length) { const v = stack.pop(); inPast[v] = 1; for (let c = head[v]; c !== -1; c = link[c]) stack.push(c); }
            for (let u = ancestor; u !== -1; u = tree.parent[u]) ray.push(u);
            for (const v of K) for (let d = 0; d < 4; d++) { const u = NB[4 * v + d]; if (u === -1 || !inPast[u]) contacts.push([v, d]); }
        }
        const flow = new Uint32Array(SITES).fill(1), depth = depths(tree.parent), order = Array.from({ length: SITES }, (_, i) => i).sort((a, b) => depth[b] - depth[a]);
        for (const v of order) { const p = tree.parent[v]; if (p !== -1) flow[p] += flow[v]; }
        return { marked, ancestor, inK, K, inPast, ray, contacts, L: ancestor === -1 ? Infinity : contacts.length, flow };
    }

    function create() {
        const canvas = document.querySelector('#avalanche-canvas');
        if (!canvas) return { pause() {}, resume() {} };
        const ctx = canvas.getContext('2d'), scope = canvas.closest('.study') || document;
        const $ = selector => scope.querySelector(selector);
        const each = (selector, fn) => scope.querySelectorAll(selector).forEach(fn);
        const reduce = root.matchMedia('(prefers-reduced-motion: reduce)');
        const colors = { bg: '#15131a', field: [[21,19,26], [44,19,66], [143,32,86], [232,97,60], [255,212,126]],
            heights: ['#17151d', '#1c1a23', '#211f29', '#27242f'], outside: 'rgba(169,188,207,.30)', inside: 'rgba(92,200,226,.80)',
            contour: '#5cc8e2', ray: '#c993f0', K: '#ffffff', contact: '#c8f53a', front: '255,255,255', label: '#bbb0b8', frame: '#3a3644' };
        let seed = 0x6580ece8, grains = 1, sample = null, run = null, geo = null, r = 8;
        let progress = 0, userPaused = reduce.matches, suspended = true, view = 'both';
        let frame = 0, previous = 0, width = 900, height = 660, cssWidth = 900, treeLayer = null;
        const field = document.createElement('canvas'); field.width = field.height = N;
        const fctx = field.getContext('2d'), fimage = fctx.createImageData(N, N);
        const slider = $('#avalanche-time'), pauseButton = $('[data-avalanche-run="pause"]');
        const out = { wave: $('#avalanche-wave'), topplings: $('#avalanche-topplings'),
            radius: $('#avalanche-radius'), L: $('#avalanche-l'), note: $('#avalanche-note') };
        function pressed(selector, key, value) {
            each(selector, b => { const on = b.dataset[key] === value; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
        }
        function load(tree, height) {
            sample = { tree, height }; run = avalanche(height); geo = geometry(tree, r);
            progress = reduce.matches ? run.length : 0; treeLayer = null;
            if (slider) { slider.max = String(run.length); }
        }
        function fresh() { const tree = wilson(seed); load(tree, sandpileFromTree(tree)); grains = 1; }
        function addGrain() {
            const tree = treeFromSandpile(run.final);
            if (!tree) return;
            load(tree, run.final); grains++;
        }
        function state() {
            // The wave being shown and the round reached inside it.
            let wave = -1, z = 0;
            for (let i = 0; i < run.waves.length; i++) if (progress >= run.waves[i].start) { wave = i; z = progress - run.waves[i].start; }
            return { wave, z };
        }
        function counts(s) {
            const c = new Uint16Array(SITES);
            for (let i = 0; i <= s.wave; i++) {
                const w = run.waves[i];
                for (const v of w.sites) if (i < s.wave || w.round[v] <= s.z) c[v]++;
            }
            return c;
        }
        function layout() {
            const desktop = cssWidth > 600, side = desktop ? Math.min(height - 60, 560) : width - 40;
            return { desktop, side, left: desktop ? 26 : 20, top: desktop ? (height - side) / 2 : 20, cell: side / N };
        }
        function drawTreeLayer(L) {
            treeLayer = document.createElement('canvas'); treeLayer.width = canvas.width; treeLayer.height = canvas.height;
            const t = treeLayer.getContext('2d'), k = canvas.width / width;
            t.setTransform(k, 0, 0, k, 0, 0); t.lineCap = 'butt';
            const px = v => L.left + (v % N + .5) * L.cell, py = v => L.top + (N - ((v / N) | 0) - .5) * L.cell;
            const head = v => { const p = sample.tree.parent[v]; if (p !== -1) return [px(p), py(p)]; const s = STEP[sample.tree.dir[v]]; return [px(v) + s[0] * L.cell / 2, py(v) - s[1] * L.cell / 2]; };
            const skip = geo.inK, onRay = new Uint8Array(SITES); geo.ray.forEach(v => { onRay[v] = 1; });
            for (const inside of [false, true]) {
                t.strokeStyle = inside ? colors.inside : colors.outside;
                for (let v = 0; v < SITES; v++) {
                    if (skip[v] || onRay[v] || !!geo.inPast[v] !== inside || geo.flow[v] < 12) continue;
                    const h = head(v);
                    t.lineWidth = Math.max(.55, L.cell * Math.min(.24, .03 + .016 * Math.cbrt(geo.flow[v])));
                    t.beginPath(); t.moveTo(px(v), py(v)); t.lineTo(h[0], h[1]); t.stroke();
                }
            }
            const segment = (a, b, color, w, rim) => {
                t.lineCap = 'butt'; t.lineJoin = 'miter';
                if (rim) { t.strokeStyle = colors.bg; t.lineWidth = w + rim; t.beginPath(); t.moveTo(a[0], a[1]); t.lineTo(b[0], b[1]); t.stroke(); }
                t.strokeStyle = color; t.lineWidth = w; t.beginPath(); t.moveTo(a[0], a[1]); t.lineTo(b[0], b[1]); t.stroke();
            };
            // The past, its path to the sink and the edges counted by L exist only when
            // the common ancestor is a site; the minimal subtree is drawn in every case.
            if (geo.ancestor !== -1) {
                // Outline of the past of the common ancestor.
                t.strokeStyle = colors.contour; t.lineWidth = 1.25; t.beginPath();
                for (let v = 0; v < SITES; v++) if (geo.inPast[v]) {
                    const x = L.left + (v % N) * L.cell, y = L.top + (N - 1 - ((v / N) | 0)) * L.cell;
                    for (let d = 0; d < 4; d++) {
                        const u = NB[4 * v + d]; if (u !== -1 && geo.inPast[u]) continue;
                        if (d === 0) { t.moveTo(x, y); t.lineTo(x + L.cell, y); }
                        if (d === 1) { t.moveTo(x + L.cell, y); t.lineTo(x + L.cell, y + L.cell); }
                        if (d === 2) { t.moveTo(x, y + L.cell); t.lineTo(x + L.cell, y + L.cell); }
                        if (d === 3) { t.moveTo(x, y); t.lineTo(x, y + L.cell); }
                    }
                }
                t.stroke();
                for (const v of geo.ray) segment([px(v), py(v)], head(v), colors.ray, 1.9, 1.2);
                for (const [v, d] of geo.contacts) {
                    const u = NB[4 * v + d], s = STEP[d], b = u === -1 ? [px(v) + s[0] * L.cell / 2, py(v) - s[1] * L.cell / 2] : [px(u), py(u)];
                    segment([px(v), py(v)], b, colors.contact, 2.6, 1.8);
                }
            }
            for (const v of geo.K) if (v !== geo.ancestor) segment([px(v), py(v)], head(v), colors.K, 2.1, 1.3);
            for (const v of geo.marked) { t.fillStyle = colors.K; t.beginPath(); t.arc(px(v), py(v), Math.max(2.2, L.cell * .42), 0, Math.PI * 2); t.fill(); }
        }
        function draw() {
            const L = layout(), s = state(), c = counts(s);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
            // Heights before the grain in quiet tones; toppling counts in the warm ramp.
            const data = fimage.data, top = Math.max(1, run.maxCount), stops = colors.field;
            let sites = 0, topplings = 0, radius = 0;
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
                const v = (N - 1 - j) * N + i, o = (j * N + i) * 4, k = c[v];
                let rgb;
                if (k && view !== 'tree') {
                    const q = Math.pow(k / top, .82) * (stops.length - 1), m = Math.min(stops.length - 2, Math.floor(q)), a = q - m;
                    rgb = [0, 1, 2].map(ch => Math.round(stops[m][ch] + (stops[m + 1][ch] - stops[m][ch]) * a));
                } else {
                    const hex = colors.heights[sample.height[v]];
                    rgb = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
                }
                if (k) { sites++; topplings += k; radius = Math.max(radius, Math.abs(i - HALF), Math.abs(N - 1 - j - HALF)); }
                data[o] = rgb[0]; data[o + 1] = rgb[1]; data[o + 2] = rgb[2]; data[o + 3] = 255;
            }
            fctx.putImageData(fimage, 0, 0);
            ctx.imageSmoothingEnabled = true; ctx.drawImage(field, L.left, L.top, L.side, L.side);
            if (s.wave >= 0 && view !== 'tree' && s.z < run.waves[s.wave].rounds + 2) {
                const w = run.waves[s.wave];
                for (const v of w.sites) {
                    const age = s.z - w.round[v]; if (age < 0 || age > 5) continue;
                    ctx.fillStyle = `rgba(${colors.front},${.75 * (1 - age / 5)})`;
                    ctx.fillRect(L.left + (v % N) * L.cell, L.top + (N - 1 - ((v / N) | 0)) * L.cell, L.cell + .4, L.cell + .4);
                }
            }
            if (view !== 'avalanche') { if (!treeLayer) drawTreeLayer(L); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(treeLayer, 0, 0); ctx.restore(); }
            ctx.strokeStyle = colors.frame; ctx.lineWidth = 1; ctx.strokeRect(L.left - .5, L.top - .5, L.side + 1, L.side + 1);
            legend(L);
            updateReadout(s, sites, topplings, radius);
        }
        function legend(L) {
            const size = L.desktop ? 11.5 : 20, x = L.desktop ? L.left + L.side + 28 : L.left, y0 = L.desktop ? L.top + 10 : L.top + L.side + 36;
            const rows = [['field', 'Topplings at a site'], ['tree', 'Edges of the spanning tree'], ['K', 'Minimal subtree'], ['contour', 'Past of the common ancestor'], ['ray', 'Path to the sink'], ['contact', 'Edges counted by ℒ']];
            ctx.font = size + 'px ui-monospace, monospace'; ctx.textBaseline = 'middle';
            rows.forEach(([key, label], i) => {
                const col = 0, row = i;
                const lx = x + col, ly = y0 + row * size * (L.desktop ? 2.4 : 1.75), w = size * 2.2;
                if (key === 'field') { const g = ctx.createLinearGradient(lx, 0, lx + w, 0); colors.field.slice(1).forEach((c, k) => g.addColorStop(k / 3, `rgb(${c})`)); ctx.fillStyle = g; ctx.fillRect(lx, ly - size * .35, w, size * .7); }
                else if (key === 'tree') { ctx.strokeStyle = colors.inside; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + w, ly); ctx.stroke(); }
                else { ctx.strokeStyle = colors[key]; ctx.lineWidth = key === 'contour' ? 1.4 : 2.4; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + w, ly); ctx.stroke(); }
                ctx.fillStyle = colors.label; ctx.fillText(label, lx + w + size * .7, ly);
            });
            ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#8f8795';
            const lines = [`${N} × ${N} box, wired boundary conditions`, `distant marked site (${r}, 0)`];
            lines.forEach((t, i) => ctx.fillText(t, x, L.desktop ? L.top + L.side - 4 - (1 - i) * size * 1.6 : height - 22 - (1 - i) * size * 1.5));
        }
        function updateReadout(s, sites, topplings, radius) {
            const waves = run.waves.length, done = progress >= run.length;
            if (out.wave) out.wave.textContent = waves ? `${Math.max(0, s.wave + 1)} of ${waves}` : '0';
            if (out.topplings) out.topplings.textContent = topplings.toLocaleString();
            if (out.radius) out.radius.textContent = String(radius);
            if (out.L) out.L.textContent = geo.L === Infinity ? '∞' : String(geo.L);
            if (slider) { slider.value = String(Math.round(progress)); slider.setAttribute('aria-valuetext', `wave ${Math.max(0, s.wave + 1)} of ${waves}`); }
            if (pauseButton) { pauseButton.textContent = userPaused || done ? 'Play' : 'Pause'; pauseButton.classList.toggle('is-on', !userPaused && !done); }
            if (!out.note) return;
            if (!waves) out.note.textContent = `The origin held ${sample.height[CENTER]} ${sample.height[CENTER] === 1 ? 'grain' : 'grains'}, so no site topples · add another grain`;
            else if (!done) out.note.textContent = `Wave ${s.wave + 1} of ${waves} · the origin topples once, then the other sites stabilize with the origin as a sink`;
            else out.note.textContent = `${waves} ${waves === 1 ? 'wave' : 'waves'} · ${run.support.toLocaleString()} sites toppled · radius ${run.radius}${run.radius >= HALF ? ' (reached the boundary)' : ''}`;
        }
        function resize() {
            cssWidth = canvas.getBoundingClientRect().width || 900;
            width = cssWidth < 600 ? 600 : 900; height = cssWidth < 600 ? 900 : 660;
            const ratio = Math.min(2.5, Math.max(2, root.devicePixelRatio || 1)) * cssWidth / width;
            canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
            canvas.style.aspectRatio = width + ' / ' + height;
            ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0); treeLayer = null; draw();
        }
        function tick(t) {
            frame = 0;
            if (suspended || userPaused || document.hidden || progress >= run.length) { draw(); return; }
            const delta = previous ? Math.min(.07, (t - previous) / 1000) : 0; previous = t;
            progress = Math.min(run.length, progress + delta * Math.max(22, run.length / 18)); draw();
            frame = root.requestAnimationFrame(tick);
        }
        function start() { if (!frame && !suspended && !userPaused && !document.hidden && progress < run.length) { previous = 0; frame = root.requestAnimationFrame(tick); } }
        function stop() { root.cancelAnimationFrame(frame); frame = 0; previous = 0; }
        each('[data-avalanche-view]', b => b.addEventListener('click', () => { view = b.dataset.avalancheView; pressed('[data-avalanche-view]', 'avalancheView', view); draw(); }));
        each('[data-avalanche-r]', b => b.addEventListener('click', () => { r = Number(b.dataset.avalancheR); pressed('[data-avalanche-r]', 'avalancheR', b.dataset.avalancheR); geo = geometry(sample.tree, r); treeLayer = null; draw(); }));
        each('[data-avalanche-run]', b => b.addEventListener('click', () => {
            const action = b.dataset.avalancheRun;
            if (action === 'pause') { if (progress >= run.length) { progress = 0; userPaused = false; } else userPaused = !userPaused; }
            if (action === 'step') {
                userPaused = true; const s = state();
                const w = run.waves[s.wave], end = w ? w.start + w.rounds - 1 : 0;
                if (w && progress < end) progress = end; else if (run.waves[s.wave + 1]) progress = run.waves[s.wave + 1].start + run.waves[s.wave + 1].rounds - 1; else progress = run.length;
            }
            if (action === 'replay') { progress = 0; userPaused = false; }
            if (action === 'grain') { addGrain(); userPaused = reduce.matches; }
            if (action === 'new') { seed = hash(seed + 0x9e3779b9); fresh(); userPaused = reduce.matches; }
            stop(); draw(); start();
        }));
        if (slider) slider.addEventListener('input', () => { userPaused = true; progress = Math.max(0, Math.min(run.length, Number(slider.value))); stop(); draw(); });
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
        const onMotion = () => { if (reduce.matches) { userPaused = true; progress = run.length; stop(); draw(); } };
        if (reduce.addEventListener) reduce.addEventListener('change', onMotion);
        fresh();
        if (root.ResizeObserver) new root.ResizeObserver(resize).observe(canvas); else root.addEventListener('resize', resize);
        resize();
        return { pause() { suspended = true; stop(); }, resume() { suspended = false; resize(); start(); } };
    }
    root.AvalancheGallery = { create, wilson, sandpileFromTree, treeFromSandpile, avalanche, geometry, N, HALF, CENTER, NB };
})(globalThis);
