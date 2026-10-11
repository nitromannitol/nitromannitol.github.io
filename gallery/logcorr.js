/* Brownian particle in a log-correlated potential.  The path solves
   dX = grad P(X) dt + sqrt(2) dW in the plane, P = sigma * sum_{k=1..4} g_k,
   where the g_k are independent smooth random fields of equal strength, g_k
   varying on length scale 3^k (gradient noise with quintic interpolation on
   a randomly rotated lattice of spacing 3^k).  P plays the role of log a: the
   generator is a^{-1} div(a grad) and the reversible measure is a(x) dx.  A
   finite number of scales illustrates the model; the theorem concerns
   infinitely many scales at weak disorder.  The potential is drawn as in the
   flow pages: a low-contrast wash by its sign and its level lines, computed
   in tiles as the camera reaches them. */
(function (root) {
    'use strict';
    const TAU = 2 * Math.PI, DT = .004, OCT = 4, PACE = 2.4, CH = 12, H = .2, FOLLOW_HALF = 8;
    const STRENGTHS = [1.2, 2.4, 3.6];
    function hash2(x, y, seed) {
        let z = (Math.imul((x | 0) + 0x51ed, 0x45d9f3b) ^
                 Math.imul((y | 0) + 0x7f4a, 0x119de1f3) ^ (seed | 0)) >>> 0;
        z = Math.imul(z ^ (z >>> 16), 0x45d9f3b) >>> 0;
        return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
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
    const GX = [], GY = [];
    for (let i = 0; i < 16; i++) { GX.push(Math.cos(TAU * (i + .5) / 16)); GY.push(Math.sin(TAU * (i + .5) / 16)); }

    /* The unscaled field sum_k g_k and its exact gradient. */
    function makeField(fieldSeed) {
        const pick = random(fieldSeed ^ 0x10c0), octaves = [];
        for (let k = 1; k <= OCT; k++) {
            const th = TAU * pick();
            octaves.push({ s: 3 ** k, c: Math.cos(th), n: Math.sin(th), ox: 1000 * pick(), oy: 1000 * pick(), seed: (fieldSeed * 31 + k * 0x9e37) | 0 });
        }
        const out = [0, 0, 0];
        function sample(x, y) {
            let v = 0, gx = 0, gy = 0;
            for (let k = 0; k < OCT; k++) {
                const o = octaves[k], u = (o.c * x - o.n * y) / o.s + o.ox, w = (o.n * x + o.c * y) / o.s + o.oy;
                const i = Math.floor(u), j = Math.floor(w), fu = u - i, fw = w - j;
                const a00 = (16 * hash2(i, j, o.seed)) | 0, a10 = (16 * hash2(i + 1, j, o.seed)) | 0;
                const a01 = (16 * hash2(i, j + 1, o.seed)) | 0, a11 = (16 * hash2(i + 1, j + 1, o.seed)) | 0;
                const n00 = GX[a00] * fu + GY[a00] * fw, n10 = GX[a10] * (fu - 1) + GY[a10] * fw;
                const n01 = GX[a01] * fu + GY[a01] * (fw - 1), n11 = GX[a11] * (fu - 1) + GY[a11] * (fw - 1);
                const su = fu * fu * fu * (fu * (fu * 6 - 15) + 10), sw = fw * fw * fw * (fw * (fw * 6 - 15) + 10);
                const du = 30 * fu * fu * (fu - 1) * (fu - 1), dw = 30 * fw * fw * (fw - 1) * (fw - 1);
                const A = n00 + (n10 - n00) * su, B = n01 + (n11 - n01) * su;
                const Au = GX[a00] + (GX[a10] - GX[a00]) * su + du * (n10 - n00), Bu = GX[a01] + (GX[a11] - GX[a01]) * su + du * (n11 - n01);
                const Aw = GY[a00] + (GY[a10] - GY[a00]) * su, Bw = GY[a01] + (GY[a11] - GY[a01]) * su;
                const nu = Au + (Bu - Au) * sw, nw = Aw + (Bw - Aw) * sw + dw * (B - A);
                v += A + (B - A) * sw; gx += (nu * o.c + nw * o.n) / o.s; gy += (nw * o.c - nu * o.n) / o.s;
            }
            out[0] = v; out[1] = gx; out[2] = gy; return out;
        }
        // Root mean square of the field, for the wash and the level spacing.
        const r = random(fieldSeed ^ 0x5eed); let square = 0;
        for (let i = 0; i < 4000; i++) { const v = sample(600 * r() - 300, 600 * r() - 300)[0]; square += v * v; }
        return { sample, rms: Math.sqrt(square / 4000), seed: fieldSeed };
    }

    function create({ fieldSeed = 0x10c0, seed = 0x6c6f6763, sigma = 3.6, field = null } = {}) {
        const f = field && field.seed === fieldSeed ? field : makeField(fieldSeed);
        return { field: f, sigma, seed, normal: noise(seed ^ 0xb5297a4d), x: 0, y: 0, steps: 0, time: 0,
            minX: 0, maxX: 0, minY: 0, maxY: 0, trail: [[0, 0, 0]] };
    }
    function advance(run, count) {
        const sq = Math.sqrt(2 * DT), s = run.sigma;
        for (let i = 0; i < count; i++) {
            const g = run.field.sample(run.x, run.y);
            run.x += s * g[1] * DT + sq * run.normal();
            run.y += s * g[2] * DT + sq * run.normal();
            run.steps++; run.time = run.steps * DT;
            if (run.x < run.minX) run.minX = run.x; if (run.x > run.maxX) run.maxX = run.x;
            if (run.y < run.minY) run.minY = run.y; if (run.y > run.maxY) run.maxY = run.y;
            run.trail.push([run.x, run.y, run.steps]);
            if (run.trail.length > 65536) {
                const old = run.trail.slice(0, -32768).filter((_, j) => !(j & 1));
                run.trail = old.concat(run.trail.slice(-32768));
            }
        }
        return run;
    }
    function camera(run, prior, view = 'follow', elapsed = 1 / 60) {
        if (view === 'whole') return {
            x: (run.minX + run.maxX) / 2, y: (run.minY + run.maxY) / 2,
            half: Math.max(FOLLOW_HALF, .60 * Math.max(run.maxX - run.minX, run.maxY - run.minY) + 1)
        };
        const c = prior && prior.half === FOLLOW_HALF ? { x: prior.x, y: prior.y, half: FOLLOW_HALF } : { x: run.x, y: run.y, half: FOLLOW_HALF };
        const blend = 1 - Math.exp(-4 * Math.max(0, elapsed)), dead = 1.2, reach = .6 * FOLLOW_HALF;
        for (const axis of ['x', 'y']) {
            const delta = run[axis] - c[axis];
            if (Math.abs(delta) > dead) c[axis] += (delta - Math.sign(delta) * dead) * blend;
            c[axis] = Math.max(run[axis] - reach, Math.min(run[axis] + reach, c[axis]));
        }
        return c;
    }

    /* Tiles of the potential: a wash by sign and level lines at every
       multiple of 0.35 rms, split into major (every third) and minor lines. */
    function makeTiles(field, dark) {
        const tiles = new Map(), N = Math.round(CH / H), rms = field.rms, step = .35 * rms;
        const base = dark ? [18, 21, 29] : [250, 249, 245];
        function build(ti, tj) {
            const X0 = ti * CH, Y0 = tj * CH, values = new Float32Array((N + 1) * (N + 1));
            for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) values[j * (N + 1) + i] = field.sample(X0 + i * H, Y0 + j * H)[0];
            const wash = document.createElement('canvas'); wash.width = wash.height = N;
            const wc = wash.getContext('2d'), image = wc.createImageData(N, N);
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
                const v = (values[j * (N + 1) + i] + values[j * (N + 1) + i + 1] + values[(j + 1) * (N + 1) + i] + values[(j + 1) * (N + 1) + i + 1]) / (4 * rms);
                const alpha = Math.min(.14, Math.abs(v) * .047), o = ((N - 1 - j) * N + i) * 4, tint = v < 0 ? [161, 107, 137] : [76, 141, 165];
                for (let ch = 0; ch < 3; ch++) image.data[o + ch] = Math.round(base[ch] * (1 - alpha) + tint[ch] * alpha);
                image.data[o + 3] = 255;
            }
            wc.putImageData(image, 0, 0);
            // paths: [minor negative, minor positive, major negative, major positive, zero]
            const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
            const seg = (p, ax, ay, bx, by) => { p.moveTo(X0 + ax * H, Y0 + ay * H); p.lineTo(X0 + bx * H, Y0 + by * H); };
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
                const v0 = values[j * (N + 1) + i], v1 = values[j * (N + 1) + i + 1], v2 = values[(j + 1) * (N + 1) + i + 1], v3 = values[(j + 1) * (N + 1) + i];
                const lo = Math.min(v0, v1, v2, v3), hi = Math.max(v0, v1, v2, v3);
                for (let li = Math.ceil(lo / step); li * step < hi; li++) {
                    const level = li * step, a = v0 - level, b = v1 - level, d = v2 - level, e = v3 - level, pts = [];
                    if ((a <= 0) !== (b <= 0)) pts.push(i + a / (a - b), j);
                    if ((b <= 0) !== (d <= 0)) pts.push(i + 1, j + b / (b - d));
                    if ((d <= 0) !== (e <= 0)) pts.push(i + 1 - d / (d - e), j + 1);
                    if ((e <= 0) !== (a <= 0)) pts.push(i, j + 1 - e / (e - a));
                    if (pts.length < 4) continue;
                    const kind = li === 0 ? 4 : (li % 3 === 0 ? 2 : 0) + (li > 0 ? 1 : 0);
                    seg(paths[kind], pts[0], pts[1], pts[2], pts[3]);
                    if (pts.length === 8) seg(paths[kind], pts[4], pts[5], pts[6], pts[7]);
                }
            }
            return { wash, paths, used: 0 };
        }
        let clock = 0;
        return {
            get(ti, tj, allowBuild) {
                const key = ti + ',' + tj; let t = tiles.get(key);
                if (!t && allowBuild) { t = build(ti, tj); tiles.set(key, t); }
                if (t) t.used = ++clock;
                if (tiles.size > 360) {
                    const oldest = [...tiles.entries()].sort((p, q) => p[1].used - q[1].used).slice(0, 60);
                    oldest.forEach(([k]) => tiles.delete(k));
                }
                return t || null;
            }
        };
    }

    function createPainter(run, { dark = true } = {}) {
        const tiles = makeTiles(run.field, dark), base = dark ? '#12151d' : '#faf9f5';
        const colors = dark ? ['#655363', '#476573'] : ['#c9b9bf', '#b5c7ca'];
        const gold = dark ? '#f2c67b' : '#a46525', fresh = dark ? '#fff0cb' : '#562c25';
        return function paint(ctx, W, Hc, c, { cssWidth = W, view = 'follow', budget = 8, labels = true } = {}) {
            const scale = Math.min(W, Hc) / (2 * c.half), pixel = W / Math.max(1, cssWidth), cssScale = scale / pixel;
            const sx = x => W / 2 + (x - c.x) * scale, sy = y => Hc / 2 - (y - c.y) * scale;
            ctx.save(); ctx.fillStyle = base; ctx.fillRect(0, 0, W, Hc);
            const i0 = Math.floor((c.x - W / (2 * scale)) / CH), i1 = Math.floor((c.x + W / (2 * scale)) / CH);
            const j0 = Math.floor((c.y - Hc / (2 * scale)) / CH), j1 = Math.floor((c.y + Hc / (2 * scale)) / CH);
            const start = performance.now(), visible = [];
            // Nearest tiles first, so a frame with a limited budget fills the centre.
            const order = [];
            for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) order.push([i, j, (i + .5) * CH - c.x, (j + .5) * CH - c.y]);
            order.sort((p, q) => (p[2] * p[2] + p[3] * p[3]) - (q[2] * q[2] + q[3] * q[3]));
            for (const [i, j] of order) {
                const t = tiles.get(i, j, performance.now() - start < budget);
                if (t) visible.push([i, j, t]);
            }
            ctx.imageSmoothingEnabled = true;
            for (const [i, j, t] of visible) ctx.drawImage(t.wash, sx(i * CH), sy((j + 1) * CH), CH * scale + .5, CH * scale + .5);
            if (cssScale >= 4) {
                const majorOnly = cssScale < 14;
                ctx.save(); ctx.translate(W / 2 - c.x * scale, Hc / 2 + c.y * scale); ctx.scale(scale, -scale);
                ctx.lineWidth = .8 * pixel / scale;
                const kinds = majorOnly ? [2, 3, 4] : [0, 1, 2, 3, 4];
                for (const k of kinds) {
                    ctx.strokeStyle = k === 4 ? colors[1] : colors[k & 1]; ctx.globalAlpha = k === 4 ? .9 : .6;
                    for (const v of visible) ctx.stroke(v[2].paths[k]);
                }
                ctx.restore();
            }
            const path = run.trail, end = path.length - 1;
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            function stroke(first, last, color, width, alpha, stride = 1) {
                if (last <= first) return;
                ctx.beginPath(); ctx.moveTo(sx(path[first][0]), sy(path[first][1]));
                for (let i = first + stride; i <= last; i += stride) ctx.lineTo(sx(path[i][0]), sy(path[i][1]));
                ctx.lineTo(sx(path[last][0]), sy(path[last][1]));
                ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.stroke();
            }
            const recent = Math.max(0, end - 1800), freshFrom = Math.max(0, end - 150), width = 1.45 * pixel;
            stroke(0, recent, gold, width * .8, dark ? .31 : .36, Math.max(1, Math.floor(recent / 16000)));
            stroke(recent, end, base, width + 2.2 * pixel, .85);
            stroke(recent, end, gold, width, .88);
            stroke(freshFrom, end, fresh, width * 1.08, 1);
            ctx.globalAlpha = 1;
            const ox = sx(0), oy = sy(0);
            if (ox > 14 * pixel && ox < W - 14 * pixel && oy > 14 * pixel && oy < Hc - 14 * pixel) {
                ctx.beginPath(); ctx.arc(ox, oy, 3 * pixel, 0, TAU);
                ctx.strokeStyle = dark ? '#a2a3ac' : '#777383'; ctx.lineWidth = pixel; ctx.stroke();
            }
            const px = sx(run.x), py = sy(run.y), r = 4.2 * pixel;
            ctx.beginPath(); ctx.arc(px, py, r * 2.7, 0, TAU);
            ctx.fillStyle = dark ? 'rgba(242,198,123,.13)' : 'rgba(164,101,37,.10)'; ctx.fill();
            ctx.beginPath(); ctx.arc(px, py, r, 0, TAU);
            ctx.fillStyle = fresh; ctx.fill(); ctx.strokeStyle = base; ctx.lineWidth = 1.4 * pixel; ctx.stroke();
            if (labels) {
                const unit = 2 ** Math.max(0, Math.floor(Math.log2(c.half / 4))), bar = unit * scale;
                const left = 24 * pixel, bottom = Hc - 24 * pixel;
                ctx.strokeStyle = dark ? '#95939d' : '#807b85'; ctx.lineWidth = pixel;
                ctx.beginPath(); ctx.moveTo(left, bottom - 4 * pixel); ctx.lineTo(left, bottom);
                ctx.lineTo(left + bar, bottom); ctx.lineTo(left + bar, bottom - 4 * pixel); ctx.stroke();
                ctx.fillStyle = dark ? '#b9b3bb' : '#69636c'; ctx.font = (10 * pixel) + 'px ui-monospace, monospace';
                ctx.textAlign = 'left'; ctx.fillText(unit + (unit === 1 ? ' unit' : ' units'), left, bottom - 9 * pixel);
                ctx.textAlign = 'right'; ctx.fillText(view === 'whole' ? 'WHOLE PATH' : 'FOLLOWING THE PARTICLE', W - 24 * pixel, bottom);
            }
            ctx.restore();
            return visible.length === order.length;
        };
    }

    function create_instrument() {
        const canvas = document.getElementById('logcorr-canvas');
        if (!canvas) return null;
        const reduce = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
        const scope = canvas.closest('.study') || document, ctx = canvas.getContext('2d');
        const $ = selector => scope.querySelector(selector);
        const each = (selector, fn) => scope.querySelectorAll(selector).forEach(fn);
        let fieldSeed = 0x10c0, seed = 0x6c6f6763, sigma = 3.6, field = null, run, paintRun, cam;
        let view = 'follow', paused = reduce.matches, awake = false, running = false, raf = 0, last = 0, carry = 0, cssWidth = 720;
        const note = $('#logcorr-note'), time = $('#logcorr-time'), dist = $('#logcorr-distance'), brown = $('#logcorr-brownian');
        function paint(budget) {
            const complete = paintRun(ctx, canvas.width, canvas.height, cam, { cssWidth, view, budget });
            canvas.dataset.time = run.time.toFixed(3); canvas.dataset.steps = String(run.steps);
            canvas.dataset.sigma = String(sigma); canvas.dataset.view = view; canvas.dataset.running = String(running);
            if (time) time.textContent = run.time.toFixed(1);
            if (dist) dist.textContent = Math.hypot(run.x, run.y).toFixed(1);
            if (brown) brown.textContent = Math.sqrt(4 * run.time).toFixed(1);
            return complete;
        }
        function sync() {
            each('[data-logcorr-view]', b => { const on = b.dataset.logcorrView === view; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
            each('[data-logcorr-disorder]', b => { const on = Number(b.dataset.logcorrDisorder) === sigma; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
            const toggle = $('[data-logcorr-run="pause"]');
            if (toggle) { toggle.textContent = paused ? 'Play' : 'Pause'; toggle.classList.toggle('is-on', !paused); toggle.setAttribute('aria-pressed', String(!paused)); }
            if (note) note.textContent = (paused ? 'Paused' : 'One numerical path') + ' · ' + (view === 'follow' ? 'fixed scale' : 'whole path');
        }
        // A frame whose tiles are not all built yet is repainted on the next
        // animation frame, so a paused view still fills in without one long task.
        let fill = 0;
        function paintUntilComplete() {
            cancelAnimationFrame(fill); fill = 0;
            if (!paint(8) && !running) fill = requestAnimationFrame(paintUntilComplete);
        }
        function reset() {
            run = create({ fieldSeed, seed, sigma, field }); field = run.field; paintRun = createPainter(run);
            if (paused && reduce.matches) advance(run, 3500);
            cam = camera(run, null, view); carry = 0; last = 0; sync(); paintUntilComplete();
        }
        function resize() {
            cssWidth = Math.max(240, canvas.getBoundingClientRect().width || 720);
            const dpr = Math.max(2, Math.min(3, root.devicePixelRatio || 1));
            const size = Math.round(cssWidth * dpr), height = Math.round(size * (cssWidth < 560 ? 1.05 : .70));
            if (canvas.width !== size || canvas.height !== height) { canvas.width = size; canvas.height = height; }
            paintUntilComplete();
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; last = 0; canvas.dataset.running = 'false'; }
        function frame(now) {
            if (!running) return;
            const elapsed = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 0; last = now;
            carry += elapsed * PACE / DT;
            const steps = Math.floor(carry); carry -= steps;
            if (steps) advance(run, steps);
            cam = camera(run, cam, view, elapsed); paint(6); raf = requestAnimationFrame(frame);
        }
        function start() {
            if (running || paused || !awake || document.hidden) return;
            running = true; last = 0; canvas.dataset.running = 'true'; raf = requestAnimationFrame(frame);
        }
        each('[data-logcorr-run]', b => b.addEventListener('click', () => {
            const action = b.dataset.logcorrRun;
            if (action === 'pause') { paused = !paused; if (paused) stop(); else start(); }
            if (action === 'replay' || action === 'new') {
                stop();
                if (action === 'new') { fieldSeed = (fieldSeed + 0x9e3779b9) >>> 0; seed = (seed + 0x7f4a7c15) >>> 0; field = null; }
                paused = false; reset(); start();
            }
            sync(); paintUntilComplete();
        }));
        each('[data-logcorr-view]', b => b.addEventListener('click', () => {
            view = b.dataset.logcorrView === 'whole' ? 'whole' : 'follow';
            cam = camera(run, null, view); sync(); paintUntilComplete();
        }));
        each('[data-logcorr-disorder]', b => b.addEventListener('click', () => {
            const next = Number(b.dataset.logcorrDisorder);
            if (!STRENGTHS.includes(next) || next === sigma) return;
            stop(); sigma = next; reset(); start();
        }));
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
        const onMotion = () => { if (reduce.matches) { paused = true; stop(); sync(); paintUntilComplete(); } };
        if (reduce.addEventListener) reduce.addEventListener('change', onMotion);
        reset(); resize();
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
        return { pause() { awake = false; stop(); }, resume() { awake = true; paintUntilComplete(); start(); } };
    }

    root.LogCorrelatedGallery = { create: create_instrument, model: { create, advance, camera, createPainter, makeField, DT, PACE } };
}(globalThis));
