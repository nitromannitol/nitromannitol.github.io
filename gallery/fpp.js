/* Rotationally invariant first-passage percolation in the plane.  White
   noise is approximated by independent standard Gaussian variables at the
   points of the grid hZ^2, h = 1/R; phi = chi * omega with the smooth bump
   chi(x) = exp(1 - 1/(1-|x|^2)) on the unit disk, normalized to unit
   variance, and rho =
   exp(sigma tanh(phi/2)), so that e^{-sigma} <= rho <= e^{sigma} and rho at a
   point depends only on the noise within unit distance.  Passage times from
   the origin are computed by Dijkstra's algorithm, each grid point being
   joined to its 32 neighbours at the displacements h(1,0), h(1,1), h(2,1),
   h(3,1), h(3,2) and their images under the symmetries of the square; the
   edge from u to v has weight |v-u|(rho(u)+rho(v))/2.  With these 32
   directions the grid distance in a homogeneous medium is within 1.3 percent
   of the Euclidean distance.  The film reveals the ball {x : T(0,x) <= t} as t grows. */
(function (root) {
    'use strict';
    const TAU = 2 * Math.PI, SIGMAS = [.8, 1.6, 2.4], DURATION = 15, RAYS = 180;
    // Displacements h(a,b) for (a,b) = (1,0), (1,1), (2,1), (3,1), (3,2) and
    // their images under the eight symmetries of the square: 32 directions.
    const OFF = [];
    for (const [a, b] of [[1, 0], [1, 1], [2, 1], [3, 1], [3, 2]]) {
        const seen = new Set();
        for (const [x, y] of [[a, b], [b, a]]) for (const sx of [1, -1]) for (const sy of [1, -1]) {
            const key = sx * x + ',' + sy * y;
            if (!seen.has(key)) { seen.add(key); OFF.push([sx * x, sy * y]); }
        }
    }
    function random(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6d2b79f5) >>> 0;
            let t = Math.imul(s ^ s >>> 15, s | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function noise(seed) {
        const uniform = random(seed); let spare = null;
        return function () {
            if (spare !== null) { const z = spare; spare = null; return z; }
            const r = Math.sqrt(-2 * Math.log(Math.max(1e-12, uniform()))), a = TAU * uniform();
            spare = r * Math.sin(a); return r * Math.cos(a);
        };
    }
    function niceStep(x) {
        const p = 10 ** Math.floor(Math.log10(x)), m = x / p;
        return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
    }

    /* One sample: the density, the passage times from the centre, the
       Dijkstra tree, and the order in which the grid points are reached. */
    function makeSample({ N = 421, R = 6, sigma = 1.6, seed = 0x46505031 } = {}) {
        const h = 1 / R, M = N + 2 * R, gauss = noise(seed), NN = N * N, c = (N - 1) >> 1;
        const w = new Float32Array(M * M);
        for (let k = 0; k < M * M; k++) w[k] = gauss();
        const kv = [], ko = []; let norm = 0;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const r2 = (dx * dx + dy * dy) / (R * R);
            if (r2 >= 1) continue;
            const v = Math.exp(1 - 1 / (1 - r2)); kv.push(v); ko.push(dy * M + dx); norm += v * v;
        }
        norm = Math.sqrt(norm);
        const K = kv.length, KV = Float32Array.from(kv), KO = Int32Array.from(ko);
        const phi = new Float32Array(NN), rho = new Float32Array(NN);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const base = (j + R) * M + i + R; let s = 0;
            for (let k = 0; k < K; k++) s += KV[k] * w[base + KO[k]];
            const p = s / norm; phi[j * N + i] = p; rho[j * N + i] = Math.exp(sigma * Math.tanh(p / 2));
        }
        const T = new Float64Array(NN).fill(Infinity), parent = new Int32Array(NN).fill(-1);
        const order = new Int32Array(NN), done = new Uint8Array(NN);
        let cap = 1 << 16, hk = new Float64Array(cap), hv = new Int32Array(cap), size = 0;
        function push(key, v) {
            if (size === cap) {
                cap *= 2; const a = new Float64Array(cap), b = new Int32Array(cap);
                a.set(hk); b.set(hv); hk = a; hv = b;
            }
            let i = size++;
            while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= key) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; }
            hk[i] = key; hv[i] = v;
        }
        function pop() {
            const top = hv[0], key = hk[--size], v = hv[size]; let i = 0;
            for (;;) {
                let l = 2 * i + 1; if (l >= size) break;
                if (l + 1 < size && hk[l + 1] < hk[l]) l++;
                if (hk[l] >= key) break;
                hk[i] = hk[l]; hv[i] = hv[l]; i = l;
            }
            hk[i] = key; hv[i] = v; return top;
        }
        const DI = OFF.map(o => o[0]), DJ = OFF.map(o => o[1]), LEN = OFF.map(o => Math.hypot(o[0], o[1]) * h / 2);
        const src = c * N + c; let count = 0;
        T[src] = 0; push(0, src);
        while (size) {
            const key = hk[0], p = pop();
            if (done[p]) continue;
            done[p] = 1; order[count++] = p;
            const pi = p % N, pj = (p - pi) / N, rp = rho[p];
            for (let e = 0; e < OFF.length; e++) {
                const qi = pi + DI[e], qj = pj + DJ[e];
                if (qi < 0 || qj < 0 || qi >= N || qj >= N) continue;
                const q = qj * N + qi; if (done[q]) continue;
                const nt = key + LEN[e] * (rp + rho[q]);
                if (nt < T[q]) { T[q] = nt; parent[q] = p; push(nt, q); }
            }
        }
        const dist = new Float32Array(NN);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) dist[j * N + i] = Math.hypot(i - c, j - c) * h;
        // outer[k]: largest |x| among the first k+1 points reached;
        // inner[k]: smallest |x| among the points reached after them.
        const outer = new Float32Array(NN), inner = new Float32Array(NN + 1);
        let m = 0;
        for (let k = 0; k < NN; k++) { m = Math.max(m, dist[order[k]]); outer[k] = m; }
        inner[NN] = Infinity; m = Infinity;
        for (let k = NN - 1; k >= 0; k--) { m = Math.min(m, dist[order[k]]); inner[k] = m; }
        const limit = .46 * c * h;
        let kMax = 0; while (kMax + 1 < NN && outer[kMax + 1] <= limit) kMax++;
        const tMax = T[order[kMax]];
        // The time constant estimated from this sample: the mean of T(0,x)/|x|
        // over the grid points x with .7 limit <= |x| <= .8 limit.
        let mean = 0, n = 0;
        for (let k = 0; k < NN; k++) if (dist[k] >= .7 * limit && dist[k] <= .8 * limit) { mean += T[k] / dist[k]; n++; }
        const mu = mean / n;
        return { N, R, h, c, sigma, seed, phi, rho, T, parent, order, dist, outer, inner, kMax, tMax, mu, limit,
                 step: niceStep(tMax / 11) };
    }
    /* Number of grid points with T <= t. */
    function reached(s, t) {
        let lo = 0, hi = s.kMax + 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (s.T[s.order[m]] <= t) lo = m + 1; else hi = m; }
        return lo;
    }
    /* The farthest point of B(t) on the ray from the centre in direction
       theta; the next grid point outward is outside B(t), so it lies on the
       boundary of B(t). */
    function rayEnd(s, t, theta) {
        const { N, c, T } = s, cs = Math.cos(theta), sn = Math.sin(theta);
        const k = reached(s, t), reach = Math.min(c - 1, (k ? s.outer[k - 1] : 0) / s.h + 2);
        let last = c * N + c;
        for (let r = .5; r <= reach; r += .5) {
            const p = Math.round(c + r * sn) * N + Math.round(c + r * cs);
            if (T[p] <= t) last = p;
        }
        return last;
    }
    /* Marching squares for the level set {T = level}, in the box of half
       width `reach` grid steps about the centre, in physical coordinates. */
    function contour(s, level, reach, path = new Path2D()) {
        const { N, c, h, T } = s, lo = Math.max(0, c - reach), hi = Math.min(N - 2, c + reach);
        const X = i => (i - c) * h;
        for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) {
            const v0 = T[j * N + i] - level, v1 = T[j * N + i + 1] - level;
            const v2 = T[(j + 1) * N + i + 1] - level, v3 = T[(j + 1) * N + i] - level;
            const n0 = v0 <= 0, n1 = v1 <= 0, n2 = v2 <= 0, n3 = v3 <= 0;
            if (n0 === n1 && n1 === n2 && n2 === n3) continue;
            const pts = [];
            if (n0 !== n1) pts.push(i + v0 / (v0 - v1), j);
            if (n1 !== n2) pts.push(i + 1, j + v1 / (v1 - v2));
            if (n2 !== n3) pts.push(i + 1 - v2 / (v2 - v3), j + 1);
            if (n3 !== n0) pts.push(i, j + 1 - v3 / (v3 - v0));
            path.moveTo(X(pts[0]), X(pts[1])); path.lineTo(X(pts[2]), X(pts[3]));
            if (pts.length === 8) { path.moveTo(X(pts[4]), X(pts[5])); path.lineTo(X(pts[6]), X(pts[7])); }
        }
        return path;
    }
    /* Half height of the view at time t: the ball fills the frame as it grows. */
    function viewHalf(s, t) {
        const end = 1.22 * s.tMax / s.mu + 1.2;
        return Math.min(end, Math.max(3.2, 1.22 * t / s.mu + 1.2));
    }

    const THEMES = {
        void: { base: [18, 21, 29], fast: [76, 141, 165], slow: [161, 107, 137], wash: .3,
                ramp: [[52, 92, 128], [75, 141, 178], [118, 108, 206], [184, 92, 120]], ball: .5,
                level: '#7f8fa0', front: '#cfe8f1', tree: '#f2c67b', fresh: '#fff0cb', circle: '#a2a3ac',
                label: '#b9b3bb', bar: '#95939d' },
        paper: { base: [250, 249, 245], fast: [76, 141, 165], slow: [161, 107, 137], wash: .16,
                 ramp: [[150, 190, 210], [92, 150, 182], [130, 118, 206], [190, 112, 138]], ball: .34,
                 level: '#8d98a3', front: '#2f6f8f', tree: '#a46525', fresh: '#562c25', circle: '#777383',
                 label: '#69636c', bar: '#807b85' }
    };

    function createPainter(s, { dark = true } = {}) {
        const th = dark ? THEMES.void : THEMES.paper, N = s.N, base = `rgb(${th.base})`;
        const wash = document.createElement('canvas'); wash.width = wash.height = N;
        {
            const wc = wash.getContext('2d'), image = wc.createImageData(N, N);
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
                // Blue where rho is small (fast), rose where it is large (slow).
                const u = Math.max(0, Math.min(1, (Math.tanh(s.phi[j * N + i] / 2) / Math.tanh(1.25) + 1) / 2)), a = th.wash * (.45 + 1.1 * Math.abs(u - .5));
                const o = ((N - 1 - j) * N + i) * 4;
                for (let ch = 0; ch < 3; ch++) {
                    const tint = th.fast[ch] + (th.slow[ch] - th.fast[ch]) * u;
                    image.data[o + ch] = Math.round(th.base[ch] * (1 - a) + tint * a);
                }
                image.data[o + 3] = 255;
            }
            wc.putImageData(image, 0, 0);
        }
        const ball = document.createElement('canvas'); ball.width = ball.height = N;
        const bc = ball.getContext('2d'), bimg = bc.createImageData(N, N), words = new Uint32Array(bimg.data.buffer);
        const NB = 96, colours = new Uint32Array(NB);
        for (let b = 0; b < NB; b++) {
            const q = b / (NB - 1) * (th.ramp.length - 1), i = Math.min(th.ramp.length - 2, Math.floor(q)), a = q - i;
            const col = [0, 1, 2].map(k => Math.round(th.ramp[i][k] + (th.ramp[i + 1][k] - th.ramp[i][k]) * a));
            colours[b] = ((Math.round(255 * th.ball) << 24) | (col[2] << 16) | (col[1] << 8) | col[0]) >>> 0;
        }
        let shown = 0;
        function fillBall(k) {
            if (k < shown) { words.fill(0); shown = 0; }
            if (k === shown) return;
            for (let m = shown; m < k; m++) {
                const p = s.order[m], i = p % N, j = (p - i) / N;
                words[(N - 1 - j) * N + i] = colours[Math.min(NB - 1, (s.T[p] / s.tMax * NB) | 0)];
            }
            shown = k; bc.putImageData(bimg, 0, 0);
        }
        const levels = [];
        function levelPath(l) {
            if (!levels[l]) {
                const k = reached(s, l * s.step);
                levels[l] = contour(s, l * s.step, Math.ceil(s.outer[Math.max(0, k - 1)] / s.h) + 3);
            }
            return levels[l];
        }
        const uses = new Uint16Array(N * N), touched = new Int32Array(N * N);
        return function paint(ctx, W, Hc, t, { cssWidth = W, view = 'ball', labels = true, half = null } = {}) {
            t = Math.max(0, Math.min(s.tMax, t));
            const k = reached(s, t), hv = half || viewHalf(s, t), scale = Hc / (2 * hv), pixel = W / Math.max(1, cssWidth);
            const sx = x => W / 2 + x * scale, sy = y => Hc / 2 - y * scale;
            ctx.save(); ctx.fillStyle = base; ctx.fillRect(0, 0, W, Hc);
            const L = (N - 1) / 2 * s.h + s.h / 2, side = 2 * L * scale;
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(wash, sx(-L), sy(L), side, side);
            fillBall(k);
            ctx.globalAlpha = view === 'ball' ? 1 : .45;
            ctx.drawImage(ball, sx(-L), sy(L), side, side);
            ctx.globalAlpha = 1;
            ctx.save(); ctx.translate(W / 2, Hc / 2); ctx.scale(scale, -scale);
            const unit = pixel / scale;
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            const top = Math.floor(t / s.step);
            if (view === 'ball') {
                ctx.strokeStyle = th.level; ctx.lineWidth = .9 * unit; ctx.globalAlpha = dark ? .55 : .6;
                for (let l = 1; l <= top; l++) ctx.stroke(levelPath(l));
            }
            // The geodesic tree: geodesics from the origin to RAYS points of the
            // boundary of B(t), each Dijkstra edge drawn wider when more of the
            // geodesics use it.
            let nt = 0;
            const ends = [];
            if (t > 0) {
                for (let r = 0; r < RAYS; r++) ends.push(rayEnd(s, t, TAU * r / RAYS));
                for (const e of ends) for (let p = e; p >= 0; p = s.parent[p]) { if (!uses[p]++) touched[nt++] = p; }
            }
            const X = p => (p % N - s.c) * s.h, Y = p => (Math.floor(p / N) - s.c) * s.h;
            const bins = [];
            for (let m = 0; m < nt; m++) {
                const p = touched[m], q = s.parent[p];
                if (q >= 0) {
                    const b = Math.min(7, Math.floor(Math.log2(uses[p])));
                    (bins[b] || (bins[b] = new Path2D())).moveTo(X(p), Y(p));
                    bins[b].lineTo(X(q), Y(q));
                }
            }
            for (let m = 0; m < nt; m++) uses[touched[m]] = 0;
            const treeAlpha = view === 'ball' ? .55 : .9, treeWidth = view === 'ball' ? .8 : 1.05;
            ctx.strokeStyle = th.tree;
            for (let b = 0; b < bins.length; b++) if (bins[b]) {
                ctx.globalAlpha = Math.min(1, treeAlpha * (.55 + .09 * b)); ctx.lineWidth = treeWidth * (1 + .5 * b) * unit;
                ctx.stroke(bins[b]);
            }
            // The front {T = t}.
            if (t > 0) {
                ctx.globalAlpha = .95; ctx.strokeStyle = th.front; ctx.lineWidth = 1.5 * unit;
                ctx.stroke(contour(s, t, Math.ceil(s.outer[Math.max(0, k - 1)] / s.h) + 3));
            }
            // The geodesic to the boundary point on the positive horizontal axis.
            if (ends.length) {
                const g = new Path2D(); let first = true;
                for (let p = ends[0]; p >= 0; p = s.parent[p]) { if (first) { g.moveTo(X(p), Y(p)); first = false; } else g.lineTo(X(p), Y(p)); }
                ctx.globalAlpha = .9; ctx.strokeStyle = `rgb(${th.base})`; ctx.lineWidth = 4.4 * unit; ctx.stroke(g);
                ctx.globalAlpha = 1; ctx.strokeStyle = th.fresh; ctx.lineWidth = 2.2 * unit; ctx.stroke(g);
            }
            // The circle of radius t / mu.
            if (t > 0) {
                ctx.globalAlpha = .85; ctx.strokeStyle = th.circle; ctx.lineWidth = 1.1 * unit;
                ctx.setLineDash([5 * unit, 5 * unit]); ctx.beginPath(); ctx.arc(0, 0, t / s.mu, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
            }
            ctx.restore();
            ctx.globalAlpha = 1;
            if (ends.length) {
                const e = ends[0], ex = sx(X(e)), ey = sy(Y(e));
                ctx.beginPath(); ctx.arc(ex, ey, 3.6 * pixel, 0, TAU); ctx.fillStyle = th.fresh; ctx.fill();
                ctx.strokeStyle = base; ctx.lineWidth = 1.3 * pixel; ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(sx(0), sy(0), 3.4 * pixel, 0, TAU);
            ctx.fillStyle = base; ctx.fill(); ctx.strokeStyle = th.fresh; ctx.lineWidth = 1.6 * pixel; ctx.stroke();
            if (labels) {
                const u = 2 ** Math.max(0, Math.floor(Math.log2(hv / 3))), bar = u * scale;
                const left = 24 * pixel, bottom = Hc - 24 * pixel;
                ctx.strokeStyle = th.bar; ctx.lineWidth = pixel;
                ctx.beginPath(); ctx.moveTo(left, bottom - 4 * pixel); ctx.lineTo(left, bottom);
                ctx.lineTo(left + bar, bottom); ctx.lineTo(left + bar, bottom - 4 * pixel); ctx.stroke();
                ctx.fillStyle = th.label; ctx.font = (10 * pixel) + 'px ui-monospace, monospace';
                ctx.textAlign = 'left'; ctx.fillText(u + (u === 1 ? ' unit' : ' units'), left, bottom - 9 * pixel);
                ctx.textAlign = 'right'; ctx.fillText(view === 'ball' ? 'BALL AND EARLIER FRONTS' : 'GEODESIC TREE', W - 24 * pixel, bottom);
            }
            ctx.restore();
            return k;
        };
    }

    function create_instrument() {
        const canvas = document.getElementById('fpp-canvas');
        if (!canvas) return null;
        const reduce = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
        const scope = canvas.closest('.study') || document, ctx = canvas.getContext('2d');
        const $ = selector => scope.querySelector(selector);
        const each = (selector, fn) => scope.querySelectorAll(selector).forEach(fn);
        let seed = 0x46505031, sigma = 1.6, sample = null, paintSample = null, view = 'ball';
        let t = 0, paused = reduce.matches, awake = false, running = false, raf = 0, last = 0, cssWidth = 720;
        const note = $('#fpp-note'), timeOut = $('#fpp-time'), outerOut = $('#fpp-outer'), innerOut = $('#fpp-inner'), circleOut = $('#fpp-circle'), timeBar = $('#fpp-time-input');
        function paint() {
            const k = paintSample(ctx, canvas.width, canvas.height, t, { cssWidth, view });
            const outer = k ? sample.outer[k - 1] : 0, inner = sample.inner[k];
            canvas.dataset.time = t.toFixed(3); canvas.dataset.sigma = String(sigma); canvas.dataset.view = view;
            canvas.dataset.running = String(running); canvas.dataset.reached = String(k);
            if (timeOut) timeOut.textContent = t.toFixed(1);
            if (outerOut) outerOut.textContent = outer.toFixed(1);
            if (innerOut) innerOut.textContent = inner.toFixed(1);
            if (circleOut) circleOut.textContent = (t / sample.mu).toFixed(1);
            if (timeBar) timeBar.value = String(Math.round(1000 * t / sample.tMax));
        }
        function sync() {
            each('[data-fpp-view]', b => { const on = b.dataset.fppView === view; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
            each('[data-fpp-sigma]', b => { const on = Number(b.dataset.fppSigma) === sigma; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
            const toggle = $('[data-fpp-run="pause"]');
            const finished = sample && t >= sample.tMax;
            if (toggle) { toggle.textContent = paused || finished ? 'Play' : 'Pause'; toggle.classList.toggle('is-on', !paused && !finished); toggle.setAttribute('aria-pressed', String(!paused && !finished)); }
            if (note) note.textContent = finished ? 'The ball has reached the edge of the sample · Replay or New sample'
                : (paused ? 'Paused' : 'Growing') + ' · μ̂ = ' + (sample ? sample.mu.toFixed(3) : '');
        }
        function reset() {
            sample = makeSample({ seed, sigma }); paintSample = createPainter(sample, { dark: true });
            t = paused && reduce.matches ? sample.tMax : 0; last = 0; sync(); paint();
        }
        function resize() {
            cssWidth = Math.max(240, canvas.getBoundingClientRect().width || 720);
            const dpr = Math.max(2, Math.min(3, root.devicePixelRatio || 1));
            const size = Math.round(cssWidth * dpr), height = Math.round(size * (cssWidth < 560 ? 1.05 : .70));
            if (canvas.width !== size || canvas.height !== height) { canvas.width = size; canvas.height = height; }
            if (sample) paint();
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; last = 0; canvas.dataset.running = 'false'; }
        function frame(now) {
            if (!running) return;
            const elapsed = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 0; last = now;
            t = Math.min(sample.tMax, t + elapsed * sample.tMax / DURATION);
            paint();
            if (t >= sample.tMax) { stop(); sync(); return; }
            raf = requestAnimationFrame(frame);
        }
        function start() {
            if (running || paused || !awake || document.hidden || t >= sample.tMax) return;
            running = true; last = 0; canvas.dataset.running = 'true'; sync(); raf = requestAnimationFrame(frame);
        }
        each('[data-fpp-run]', b => b.addEventListener('click', () => {
            const action = b.dataset.fppRun;
            if (action === 'pause') {
                if (t >= sample.tMax) { t = 0; paused = false; start(); }
                else { paused = !paused; if (paused) stop(); else start(); }
            }
            if (action === 'replay' || action === 'new') {
                stop();
                if (action === 'new') seed = (seed + 0x9e3779b9) >>> 0;
                paused = false;
                if (action === 'new') reset(); else { t = 0; paint(); }
                start();
            }
            sync(); paint();
        }));
        each('[data-fpp-view]', b => b.addEventListener('click', () => {
            view = b.dataset.fppView === 'geodesics' ? 'geodesics' : 'ball'; sync(); paint();
        }));
        each('[data-fpp-sigma]', b => b.addEventListener('click', () => {
            const next = Number(b.dataset.fppSigma);
            if (!SIGMAS.includes(next) || next === sigma) return;
            stop(); sigma = next; paused = false; reset(); start();
        }));
        if (timeBar) timeBar.addEventListener('input', () => {
            stop(); paused = true; t = sample.tMax * Number(timeBar.value) / 1000; sync(); paint();
        });
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
        const onMotion = () => { if (reduce.matches) { paused = true; stop(); sync(); paint(); } };
        if (reduce.addEventListener) reduce.addEventListener('change', onMotion);
        reset(); resize();
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
        return { pause() { awake = false; stop(); sync(); }, resume() { awake = true; start(); } };
    }

    root.FirstPassageGallery = { create: create_instrument,
        model: { makeSample, createPainter, reached, rayEnd, contour, viewHalf, SIGMAS, DURATION } };
}(globalThis));
