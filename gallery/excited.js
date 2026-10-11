/* Kozma's centrally excited random walk on Z^2. On its first departure from a
   site x != 0, the walk moves to x +- e_i with probability 1/4 -+ (kappa/2) xi_i(x),
   where xi(x) is a subgradient of the chosen norm at x (x/|x| for the
   Euclidean norm); every other departure is a simple-random-walk step.
   The range A_n is the set of sites left before time n, and the local time
   l_n(x) counts the departures from x before time n. */
(function (root) {
    'use strict';
    const TAU = Math.PI * 2, KAPPA = 0.4, L = 420, S = 2 * L + 1, TOTAL = 4000000, TRAIL = 600;
    const NORMS = {
        euclid: { area: Math.PI, label: 'Euclidean',
            value: (x, y) => Math.hypot(x, y),
            xi(x, y, out) { const r = Math.hypot(x, y); out[0] = x / r; out[1] = y / r; } },
        l1: { area: 2, label: 'ℓ¹',
            value: (x, y) => Math.abs(x) + Math.abs(y),
            xi(x, y, out) { out[0] = Math.sign(x); out[1] = Math.sign(y); } },
        linf: { area: 4, label: 'ℓ∞',
            value: (x, y) => Math.max(Math.abs(x), Math.abs(y)),
            xi(x, y, out) {
                const ax = Math.abs(x), ay = Math.abs(y);
                if (ax > ay) { out[0] = Math.sign(x); out[1] = 0; }
                else if (ay > ax) { out[0] = 0; out[1] = Math.sign(y); }
                else { out[0] = Math.sign(x) / 2; out[1] = Math.sign(y) / 2; }
            } }
    };
    function random(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6d2b79f5) >>> 0;
            let n = Math.imul(a ^ a >>> 15, a | 1);
            n ^= n + Math.imul(n ^ n >>> 7, n | 61);
            return ((n ^ n >>> 14) >>> 0) / 4294967296;
        };
    }
    function hash(n) {
        n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
        n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
        return (n ^ n >>> 16) >>> 0;
    }
    // r_n = ((d+1) n / (2 d kappa |B|))^(1/(d+1)) with d = 2.
    function radius(n, norm) { return Math.cbrt(3 * Math.max(n, 1) / (4 * KAPPA * NORMS[norm].area)); }
    function createRun(seed = 0x43455257, norm = 'euclid') {
        return { seed, norm, rand: random(seed), first: new Uint32Array(S * S), local: new Uint32Array(S * S),
            x: 0, y: 0, n: 0, distinct: 0, outer: 0, done: false,
            trailX: new Int16Array(TRAIL), trailY: new Int16Array(TRAIL), trailCount: 1, trailHead: 0 };
    }
    // first[x] = t_x + 1, where t_x is the first-departure time of x.
    function advance(run, count) {
        const first = run.first, local = run.local, rand = run.rand, norm = NORMS[run.norm], xi = [0, 0], h = KAPPA / 2;
        let x = run.x, y = run.y, n = run.n, outer = run.outer;
        for (let k = 0; k < count && n < TOTAL && !run.done; k++) {
            const idx = (x + L) + (y + L) * S, u = rand();
            let dx = 0, dy = 0;
            if (first[idx] === 0 && (x !== 0 || y !== 0)) {
                first[idx] = n + 1; run.distinct++;
                norm.xi(x, y, xi);
                const a = .25 - h * xi[0], b = a + .25 + h * xi[0], c = b + .25 - h * xi[1];
                if (u < a) dx = 1; else if (u < b) dx = -1; else if (u < c) dy = 1; else dy = -1;
            } else {
                if (first[idx] === 0) { first[idx] = n + 1; run.distinct++; }
                if (u < .25) dx = 1; else if (u < .5) dx = -1; else if (u < .75) dy = 1; else dy = -1;
            }
            local[idx]++;
            x += dx; y += dy; n++;
            const r = norm.value(x, y); if (r > outer) outer = r;
            run.trailHead = (run.trailHead + 1) % TRAIL; run.trailX[run.trailHead] = x; run.trailY[run.trailHead] = y;
            if (run.trailCount < TRAIL) run.trailCount++;
            if (Math.abs(x) >= L - 2 || Math.abs(y) >= L - 2) run.done = true;
        }
        run.x = x; run.y = y; run.n = n; run.outer = outer;
        return run;
    }
    // Smallest norm of a site not yet left: the largest norm ball inside A_n.
    function innerRadius(run) {
        const norm = NORMS[run.norm], first = run.first, R = Math.min(L - 2, Math.ceil(run.outer) + 2);
        let best = Infinity;
        for (let y = -R; y <= R; y++) {
            const row = (y + L) * S + L;
            for (let x = -R; x <= R; x++) {
                if (first[row + x]) continue;
                const v = norm.value(x, y); if (v < best) best = v;
            }
        }
        return best === Infinity ? 0 : best;
    }
    function ramp(stops, q) {
        q = Math.max(0, Math.min(1, q)) * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(q)), a = q - i, s = stops[i], t = stops[i + 1];
        return [0, 1, 2].map(c => Math.round(s[c] + (t[c] - s[c]) * a));
    }
    function lut(stops) {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) { const c = ramp(stops, i / 255); table[i] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]; }
        return table;
    }
    const RANGE_STOPS = [[44, 96, 150], [80, 140, 190], [168, 124, 186], [220, 130, 160]];
    const LOCAL_STOPS = [[38, 42, 66], [69, 111, 156], [141, 205, 221], [245, 237, 226]];
    const RANGE_LUT = lut(RANGE_STOPS), LOCAL_LUT = lut(LOCAL_STOPS), LOCAL_MAX = 1.25;

    function create() {
        const canvas = document.querySelector('#excited-canvas');
        if (!canvas) return { pause() {}, resume() {} };
        const ctx = canvas.getContext('2d'), scope = canvas.closest('.study') || document;
        const $ = selector => scope.querySelector(selector);
        const each = (selector, fn) => scope.querySelectorAll(selector).forEach(fn);
        const reduce = root.matchMedia('(prefers-reduced-motion: reduce)');
        let seed = 0x43455257, norm = 'euclid', view = 'range', pace = 'explore';
        let run = createRun(seed, norm), userPaused = reduce.matches, suspended = true, ended = false;
        let frame = 0, previous = 0, carry = 0, width = 900, height = 660, cssWidth = 900, inner = 0, innerAt = -1;
        if (reduce.matches) advance(run, 200000);
        const pauseButton = $('[data-excited-run="pause"]');
        const out = { steps: $('#excited-steps'), sites: $('#excited-sites'), radius: $('#excited-radius'), radii: $('#excited-radii'), note: $('#excited-note') };
        const colors = { bg: '#15131a', line: '#2c2934', arrows: '#77738a', trail: '#9b95a6', gold: '#f3c577', white: '#f5ede2' };
        const off = document.createElement('canvas'), offCtx = off.getContext('2d');
        let image = null;
        function pressed(selector, key, value) {
            each(selector, b => {
                const on = b.dataset[key] === value;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
        }
        function updateReadout(r) {
            if (innerAt !== run.n) { inner = innerRadius(run); innerAt = run.n; }
            if (out.steps) out.steps.textContent = run.n.toLocaleString();
            if (out.sites) out.sites.textContent = run.distinct.toLocaleString();
            if (out.radius) out.radius.textContent = r.toFixed(1);
            if (out.radii) out.radii.textContent = run.n ? (inner / r).toFixed(2) + ' – ' + (run.outer / r).toFixed(2) : '–';
            const stopped = run.n >= TOTAL || run.done;
            if (pauseButton) { pauseButton.textContent = userPaused || stopped ? 'Play' : 'Pause'; pauseButton.classList.toggle('is-on', !userPaused && !stopped); }
            if (out.note) {
                out.note.textContent = stopped ? run.n.toLocaleString() + ' steps · replay or sample another walk'
                    : view === 'local' ? 'Local time divided by 4κrₙ, which approximates the cone (1 − ‖x‖/rₙ)₊'
                    : run.n < 400 ? 'Arrows: mean of the first step from each site x ≠ 0 not in Aₙ · every other step is a step of simple random walk'
                    : 'Colour: first-departure time, blue (early) to rose (recent)';
            }
        }
        function ball(r, sx, sy, s) {
            ctx.beginPath();
            if (norm === 'euclid') ctx.arc(sx(0), sy(0), r * s, 0, TAU);
            else if (norm === 'l1') { ctx.moveTo(sx(r), sy(0)); ctx.lineTo(sx(0), sy(r)); ctx.lineTo(sx(-r), sy(0)); ctx.lineTo(sx(0), sy(-r)); ctx.closePath(); }
            else ctx.rect(sx(-r), sy(r), 2 * r * s, 2 * r * s);
        }
        function arrow(px, py, dx, dy, length) {
            const qx = -dy, qy = dx, ex = px + dx * length, ey = py + dy * length;
            ctx.beginPath(); ctx.moveTo(px - dx * length * .35, py - dy * length * .35); ctx.lineTo(ex, ey);
            ctx.moveTo(ex - dx * 4 + qx * 3, ey - dy * 4 + qy * 3); ctx.lineTo(ex, ey); ctx.lineTo(ex - dx * 4 - qx * 3, ey - dy * 4 - qy * 3);
            ctx.stroke();
        }
        function draw() {
            const n = run.n, r = radius(n, norm), desktop = cssWidth > 600, labelSize = desktop ? 12 : 20;
            const s = Math.max(.6, Math.min(44, (norm === 'linf' ? .32 : .35) * Math.min(width, height) / Math.max(r, 1)));
            const sx = x => width / 2 + x * s, sy = y => height / 2 - y * s;
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
            const hx = Math.min(L - 2, Math.ceil(width / (2 * s)) + 1), hy = Math.min(L - 2, Math.ceil(height / (2 * s)) + 1);
            const w = 2 * hx + 1, hgt = 2 * hy + 1;
            if (!image || image.width !== w || image.height !== hgt) { off.width = w; off.height = hgt; image = offCtx.createImageData(w, hgt); }
            const pixels = new Uint32Array(image.data.buffer), first = run.first, local = run.local;
            const inv = 1 / Math.max(1, n), cone = 1 / (4 * KAPPA * r);
            for (let j = 0; j < hgt; j++) {
                const y = hy - j, row = (y + L) * S + L, base = j * w;
                for (let i = 0; i < w; i++) {
                    const x = i - hx, f = first[row + x];
                    if (!f) { pixels[base + i] = 0; continue; }
                    if (view === 'range') pixels[base + i] = RANGE_LUT[Math.min(255, Math.round(255 * Math.cbrt((f - 1) * inv)))];
                    else pixels[base + i] = LOCAL_LUT[Math.min(255, Math.round(255 * local[row + x] * cone / LOCAL_MAX))];
                }
            }
            offCtx.putImageData(image, 0, 0);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(off, sx(-hx - .5), sy(hy + .5), w * s, hgt * s);
            ctx.imageSmoothingEnabled = true;
            if (s >= 12) {
                ctx.strokeStyle = colors.line; ctx.lineWidth = .8; ctx.beginPath();
                for (let x = -hx; x <= hx + 1; x++) { ctx.moveTo(sx(x - .5), 0); ctx.lineTo(sx(x - .5), height); }
                for (let y = -hy; y <= hy + 1; y++) { ctx.moveTo(0, sy(y - .5)); ctx.lineTo(width, sy(y - .5)); }
                ctx.stroke();
            }
            if (s >= 20) {
                // The mean first step -kappa xi(x) at every site not yet left.
                const xi = [0, 0]; ctx.strokeStyle = colors.arrows; ctx.lineWidth = 1.1;
                for (let y = -hy; y <= hy; y++) for (let x = -hx; x <= hx; x++) {
                    if ((!x && !y) || first[(y + L) * S + L + x]) continue;
                    NORMS[norm].xi(x, y, xi);
                    arrow(sx(x), sy(y), -xi[0], xi[1], s * KAPPA * .8);
                }
            }
            if (s >= 5 && run.trailCount > 1) {
                const count = Math.min(run.trailCount, s >= 16 ? 60 : TRAIL);
                ctx.strokeStyle = colors.trail; ctx.globalAlpha = .75; ctx.lineWidth = Math.max(1, Math.min(2.4, s * .1));
                ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
                for (let k = count - 1; k >= 0; k--) {
                    const i = (run.trailHead - k + TRAIL) % TRAIL, px = sx(run.trailX[i]), py = sy(run.trailY[i]);
                    if (k === count - 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.globalAlpha = 1;
            }
            if (view === 'local' && n > 0) {
                ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(245,237,226,.7)'; ctx.lineWidth = 1.2;
                for (const level of [.25, .5, .75]) { ball(r * (1 - level), sx, sy, s); ctx.stroke(); }
                ctx.setLineDash([]);
            }
            if (n > 0) {
                ball(r, sx, sy, s); ctx.strokeStyle = 'rgba(245,237,226,.82)'; ctx.lineWidth = 1.4; ctx.stroke();
                ctx.fillStyle = 'rgba(245,237,226,.82)'; ctx.font = labelSize + 'px ui-monospace, monospace'; ctx.textAlign = 'left';
                const text = 'radius rₙ', tw = ctx.measureText(text).width;
                const ax = norm === 'linf' ? sx(r) : norm === 'l1' ? sx(r / 2) + 8 : sx(r * Math.SQRT1_2) + 6;
                const ay = norm === 'linf' ? sy(r) - 8 : norm === 'l1' ? sy(r / 2) - 8 : sy(r * Math.SQRT1_2) - 6;
                const lx = Math.max(8, Math.min(width - 8 - tw, norm === 'linf' ? ax - tw : ax));
                if (ay > 16) ctx.fillText(text, lx, ay);
            }
            ctx.strokeStyle = colors.white; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(sx(0), sy(0), Math.max(3, Math.min(6, s * .3)), 0, TAU); ctx.stroke();
            const px = sx(run.x), py = sy(run.y);
            ctx.fillStyle = 'rgba(243,197,119,.18)'; ctx.beginPath(); ctx.arc(px, py, 12, 0, TAU); ctx.fill();
            ctx.fillStyle = colors.gold; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, TAU); ctx.fill();
            if (view === 'local' && n > 400) inset(r, desktop);
            let scaleUnits = 1;
            for (const u of [1, 2, 5, 10, 20, 50, 100, 200, 500]) if (u * s <= 130) scaleUnits = u;
            const scalePixels = scaleUnits * s, right = width - 25, bottom = height - 26;
            ctx.strokeStyle = '#b8aeb7'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(right - scalePixels, bottom - 4); ctx.lineTo(right - scalePixels, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, bottom - 4); ctx.stroke();
            ctx.font = labelSize + 'px ui-monospace, monospace'; ctx.textAlign = 'right';
            const scaleText = scaleUnits + (scaleUnits === 1 ? ' lattice unit' : ' lattice units'), stw = ctx.measureText(scaleText).width;
            if (s >= 20) { ctx.fillStyle = 'rgba(21,19,26,.88)'; ctx.fillRect(right - stw - 8, bottom - 12 - labelSize, stw + 16, labelSize + 18); }
            ctx.fillStyle = '#bbb0b8'; ctx.fillText(scaleText, right, bottom - 10); ctx.textAlign = 'left';
            updateReadout(r);
        }
        // Profile: local time / (4 kappa r_n) against ||x|| / r_n, with the line 1 - s.
        function inset(r, desktop) {
            const iw = desktop ? 196 : 250, ih = desktop ? 136 : 172, left = 18, top = height - ih - 18;
            const pl = left + 30, pr = left + iw - 10, pt = top + 26, pb = top + ih - 22;
            const X = v => pl + (pr - pl) * v / 1.3, Y = v => pb - (pb - pt) * v / LOCAL_MAX;
            ctx.fillStyle = 'rgba(21,19,26,.94)'; ctx.fillRect(left, top, iw, ih);
            ctx.strokeStyle = '#514a59'; ctx.lineWidth = 1; ctx.strokeRect(left + .5, top + .5, iw - 1, ih - 1);
            const fs = desktop ? 10 : 14;
            ctx.fillStyle = '#b0a4ad'; ctx.font = fs + 'px ui-monospace, monospace';
            ctx.fillText('ℓₙ(x)/(4κrₙ) vs ‖x‖/rₙ', left + 9, top + 16);
            ctx.strokeStyle = '#3b3644'; ctx.beginPath(); ctx.moveTo(pl, pt); ctx.lineTo(pl, pb); ctx.lineTo(pr, pb); ctx.stroke();
            ctx.fillText('0', pl - 4, pb + fs + 2); ctx.fillText('1', X(1) - 3, pb + fs + 2);
            const value = NORMS[norm].value, R = Math.min(L - 2, Math.ceil(run.outer) + 1), step = Math.max(1, Math.round(R / 34));
            ctx.fillStyle = 'rgba(141,205,221,.55)';
            for (let y = -R; y <= R; y += step) for (let x = -R; x <= R; x += step) {
                const l = run.local[(y + L) * S + L + x]; if (!l) continue;
                const a = value(x, y) / r, b = l / (4 * KAPPA * r); if (a > 1.3 || b > LOCAL_MAX) continue;
                ctx.fillRect(X(a) - 1, Y(b) - 1, 2, 2);
            }
            ctx.strokeStyle = colors.gold; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X(0), Y(1)); ctx.lineTo(X(1), Y(0)); ctx.lineTo(X(1.3), Y(0)); ctx.stroke();
        }
        function resize() {
            cssWidth = canvas.getBoundingClientRect().width || 900;
            width = cssWidth < 600 ? 600 : 900; height = cssWidth < 600 ? 700 : 660;
            const ratio = Math.min(2.5, Math.max(2, root.devicePixelRatio || 1)) * cssWidth / width;
            canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
            canvas.style.aspectRatio = width + ' / ' + height;
            ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0); draw();
        }
        function rate() { return pace === 'watch' ? 10 : Math.max(30, .85 * run.n); }
        function tick(t) {
            frame = 0;
            if (suspended || userPaused || document.hidden || run.n >= TOTAL || run.done) return;
            const delta = previous ? Math.min(.07, (t - previous) / 1000) : 0; previous = t;
            carry += delta * rate(); const steps = Math.floor(carry); carry -= steps;
            if (steps) advance(run, steps);
            draw();
            frame = root.requestAnimationFrame(tick);
        }
        function start() {
            if (!frame && !suspended && !userPaused && !document.hidden && run.n < TOTAL && !run.done) { previous = 0; frame = root.requestAnimationFrame(tick); }
        }
        function stop() { root.cancelAnimationFrame(frame); frame = 0; previous = 0; }
        function restart(newSeed) {
            if (newSeed !== undefined) seed = newSeed;
            run = createRun(seed, norm); carry = 0; innerAt = -1;
            if (reduce.matches) advance(run, 200000);
        }
        each('[data-excited-norm]', b => b.addEventListener('click', () => {
            norm = b.dataset.excitedNorm; pressed('[data-excited-norm]', 'excitedNorm', norm); restart(); stop(); draw(); start();
        }));
        each('[data-excited-view]', b => b.addEventListener('click', () => { view = b.dataset.excitedView; pressed('[data-excited-view]', 'excitedView', view); draw(); }));
        each('[data-excited-pace]', b => b.addEventListener('click', () => { pace = b.dataset.excitedPace; pressed('[data-excited-pace]', 'excitedPace', pace); }));
        each('[data-excited-run]', b => b.addEventListener('click', () => {
            const action = b.dataset.excitedRun;
            if (action === 'pause') { if (run.n >= TOTAL || run.done) { restart(); userPaused = false; } else userPaused = !userPaused; }
            if (action === 'step') { userPaused = true; advance(run, 1); }
            if (action === 'replay') { restart(); userPaused = false; }
            if (action === 'new') { restart(hash(seed + 0x9e3779b9)); userPaused = false; }
            stop(); draw(); start();
        }));
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
        const onMotion = () => { if (reduce.matches) { userPaused = true; stop(); draw(); } };
        if (reduce.addEventListener) reduce.addEventListener('change', onMotion);
        if (root.ResizeObserver) new root.ResizeObserver(resize).observe(canvas); else root.addEventListener('resize', resize);
        resize();
        return { pause() { suspended = true; stop(); }, resume() { suspended = false; resize(); start(); } };
    }
    root.ExcitedGallery = { create, createRun, advance, radius, innerRadius, NORMS, KAPPA, TOTAL };
})(globalThis);
