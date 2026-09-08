/* Finite random Fourier illustrations of incompressible advection-diffusion.
   Five independent frequency bands approximate equal stream-function variance
   per octave (gamma = 0), or variance proportional to 2^(-2 gamma j).
   A finite periodic field does not establish an infinite-model scaling law. */
(function (root) {
    'use strict';
    const TAU = 2 * Math.PI, PERIOD = 48, DT = .004, KAPPA = .30;
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
    function create({ seed = 0xc8171c, fieldSeed = seed, gamma = 0, kappa = KAPPA } = {}) {
        const choose = random(fieldSeed ^ 0x26ab319), gaussian = noise(fieldSeed ^ 0x63d83595), modes = [];
        for (let band = 0; band < 5; band++) {
            const radius = 2 ** band, amplitude = .55 * 2 ** (-gamma * band) / 2;
            for (let m = 0; m < 4; m++) {
                const angle = TAU * (m + choose()) / 4;
                let nx = Math.round(radius * Math.cos(angle)), ny = Math.round(radius * Math.sin(angle));
                if (!nx && !ny) nx = 1;
                modes.push({ kx: TAU * nx / PERIOD, ky: TAU * ny / PERIOD,
                    a: amplitude * gaussian(), b: amplitude * gaussian(), band });
            }
        }
        return { seed: seed >>> 0, fieldSeed: fieldSeed >>> 0, gamma, kappa, dt: DT, modes, normal: noise(seed ^ 0xb5297a4d),
            x: 0, y: 0, steps: 0, time: 0, minX: 0, maxX: 0, minY: 0, maxY: 0,
            trail: [[0, 0, 0]] };
    }
    function field(run, x, y) {
        let psi = 0, bx = 0, by = 0;
        for (let i = 0; i < run.modes.length; i++) {
            const m = run.modes[i], phase = m.kx * x + m.ky * y;
            const s = Math.sin(phase), c = Math.cos(phase), derivative = -m.a * s + m.b * c;
            psi += m.a * c + m.b * s;
            bx += m.ky * derivative; by -= m.kx * derivative;
        }
        return [psi, bx, by];
    }
    function advance(run, count) {
        const sq = Math.sqrt(2 * run.kappa * run.dt);
        for (let i = 0; i < count; i++) {
            const b = field(run, run.x, run.y);
            run.x += b[1] * run.dt + sq * run.normal();
            run.y += b[2] * run.dt + sq * run.normal();
            run.steps++; run.time = run.steps * run.dt;
            run.minX = Math.min(run.minX, run.x); run.maxX = Math.max(run.maxX, run.x);
            run.minY = Math.min(run.minY, run.y); run.maxY = Math.max(run.maxY, run.y);
            run.trail.push([run.x, run.y, run.steps]);
            // Compress at fixed record counts, independent of RAF batching.
            // The latest 32,768 increments always retain every Euler sample.
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
            half: Math.max(6, .60 * Math.max(run.maxX - run.minX, run.maxY - run.minY) + 1)
        };
        const c = prior ? { x: prior.x, y: prior.y, half: 6 } : { x: run.x, y: run.y, half: 6 };
        const blend = 1 - Math.exp(-4 * Math.max(0, elapsed)), dead = 1.0;
        for (const axis of ['x', 'y']) {
            const delta = run[axis] - c[axis];
            if (Math.abs(delta) > dead) c[axis] += (delta - Math.sign(delta) * dead) * blend;
            // A delayed frame may slow playback, but cannot lose the walker.
            c[axis] = Math.max(run[axis] - 3.8, Math.min(run[axis] + 3.8, c[axis]));
        }
        return c;
    }

    function createPainter(run, { dark = true, compact = false } = {}) {
        const N = compact ? 192 : 384, SIZE = compact ? 768 : 1152;
        const tile = document.createElement('canvas'); tile.width = tile.height = SIZE;
        const t = tile.getContext('2d'), values = new Float32Array((N + 1) ** 2), contours = [];
        let square = 0;
        for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) {
            const v = field(run, x * PERIOD / N, y * PERIOD / N)[0];
            values[y * (N + 1) + x] = v; square += v * v;
        }
        const rms = Math.sqrt(square / values.length), base = dark ? '#12151d' : '#faf9f5';
        // A low-contrast wash makes the fixed flow legible without competing
        // with the particle. Isolines and sparse arrows share its coordinates.
        const wash = document.createElement('canvas'); wash.width = wash.height = N;
        const washContext = wash.getContext('2d'), washImage = washContext.createImageData(N, N);
        const background = dark ? [18,21,29] : [250,249,245];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const v = values[y * (N + 1) + x] / Math.max(.001, rms);
            const alpha = Math.min(.14, Math.abs(v) * .047), offset = ((N - 1 - y) * N + x) * 4;
            const tint = v < 0 ? [161,107,137] : [76,141,165];
            for (let channel = 0; channel < 3; channel++)
                washImage.data[offset + channel] = Math.round(background[channel] * (1-alpha) + tint[channel] * alpha);
            washImage.data[offset + 3] = 255;
        }
        washContext.putImageData(washImage, 0, 0); t.drawImage(wash, 0, 0, SIZE, SIZE);
        for (let levelIndex = -5; levelIndex <= 5; levelIndex++) {
            const level = levelIndex * rms * .35, path = new Path2D();
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                const indices = [y * (N + 1) + x, y * (N + 1) + x + 1,
                    (y + 1) * (N + 1) + x + 1, (y + 1) * (N + 1) + x];
                const corners = [[x,y], [x+1,y], [x+1,y+1], [x,y+1]], cuts = [];
                for (let e = 0; e < 4; e++) {
                    const f = (e + 1) & 3, a = values[indices[e]] - level, b = values[indices[f]] - level;
                    if ((a <= 0 && b > 0) || (a > 0 && b <= 0)) {
                        const q = a / (a - b), p = corners[e], r = corners[f];
                        cuts.push([(p[0] + (r[0] - p[0]) * q) * PERIOD / N,
                            (p[1] + (r[1] - p[1]) * q) * PERIOD / N]);
                    }
                }
                for (let e = 0; e + 1 < cuts.length; e += 2) {
                    path.moveTo(cuts[e][0], cuts[e][1]); path.lineTo(cuts[e+1][0], cuts[e+1][1]);
                }
            }
            contours.push({ path, color: dark ? (levelIndex < 0 ? '#655363' : '#476573') : (levelIndex < 0 ? '#c9b9bf' : '#b5c7ca'), alpha: levelIndex ? .6 : .9 });
        }
        const gold = dark ? '#f2c67b' : '#a46525', fresh = dark ? '#fff0cb' : '#562c25';
        return function paint(ctx, W, H, c, { cssWidth = W, view = 'follow' } = {}) {
            const scale = Math.min(W, H) / (2 * c.half), pixel = W / Math.max(1, cssWidth);
            const sx = x => W / 2 + (x - c.x) * scale, sy = y => H / 2 - (y - c.y) * scale;
            ctx.save(); ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
            const xLo = Math.floor((c.x - W / (2 * scale)) / PERIOD);
            const xHi = Math.floor((c.x + W / (2 * scale)) / PERIOD);
            const yLo = Math.floor((c.y - H / (2 * scale)) / PERIOD);
            const yHi = Math.floor((c.y + H / (2 * scale)) / PERIOD);
            ctx.imageSmoothingEnabled = true;
            for (let y = yLo; y <= yHi; y++) for (let x = xLo; x <= xHi; x++) {
                ctx.drawImage(tile, sx(x * PERIOD), sy((y + 1) * PERIOD), PERIOD * scale, PERIOD * scale);
                ctx.save(); ctx.translate(sx(x * PERIOD), sy(y * PERIOD)); ctx.scale(scale, -scale);
                ctx.lineWidth = (compact ? 1 : .8 * pixel) / scale;
                for (const contour of contours) {
                    ctx.strokeStyle = contour.color; ctx.globalAlpha = contour.alpha; ctx.stroke(contour.path);
                }
                ctx.restore();
            }
            if (!compact && c.half <= 10) {
                ctx.strokeStyle = dark ? 'rgba(162,187,196,.27)' : 'rgba(69,93,99,.27)'; ctx.lineWidth = .8 * pixel;
                const gap = 2;
                for (let y = Math.ceil((c.y - c.half) / gap) * gap; y < c.y + c.half; y += gap)
                    for (let x = Math.ceil((c.x - c.half) / gap) * gap; x < c.x + c.half; x += gap) {
                        const b = field(run, x, y), angle = Math.atan2(-b[2], b[1]);
                        const len = Math.min(13 * pixel, Math.hypot(b[1], b[2]) * 12 * pixel);
                        const px = sx(x), py = sy(y), ex = px + len * Math.cos(angle), ey = py + len * Math.sin(angle);
                        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey);
                        ctx.moveTo(ex - 3 * pixel * Math.cos(angle - .5), ey - 3 * pixel * Math.sin(angle - .5));
                        ctx.lineTo(ex, ey); ctx.lineTo(ex - 3 * pixel * Math.cos(angle + .5), ey - 3 * pixel * Math.sin(angle + .5)); ctx.stroke();
                    }
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
            const recent = Math.max(0, end - 1800), freshFrom = Math.max(0, end - 150);
            const width = (compact ? 1.05 : 1.45) * pixel;
            stroke(0, recent, gold, width * .8, dark ? .31 : .36, Math.max(1, Math.floor(recent / 16000)));
            stroke(recent, end, base, width + (compact ? 2 : 2.2 * pixel), .85);
            stroke(recent, end, gold, width, .88);
            stroke(freshFrom, end, fresh, width * 1.08, 1);
            ctx.globalAlpha = 1;
            const ox = sx(0), oy = sy(0);
            if (!compact && ox > 14 * pixel && ox < W - 14 * pixel && oy > 14 * pixel && oy < H - 14 * pixel) {
                ctx.beginPath(); ctx.arc(ox, oy, 3 * pixel, 0, TAU);
                ctx.strokeStyle = dark ? '#a2a3ac' : '#777383'; ctx.lineWidth = pixel; ctx.stroke();
            }
            const px = sx(run.x), py = sy(run.y), r = (compact ? 3 : 4.2) * pixel;
            ctx.beginPath(); ctx.arc(px, py, r * 2.7, 0, TAU);
            ctx.fillStyle = dark ? 'rgba(242,198,123,.13)' : 'rgba(164,101,37,.10)'; ctx.fill();
            ctx.beginPath(); ctx.arc(px, py, r, 0, TAU);
            ctx.fillStyle = fresh; ctx.fill(); ctx.strokeStyle = base; ctx.lineWidth = compact ? 1.5 : 1.4 * pixel; ctx.stroke();
            if (!compact) {
                const unit = 2 ** Math.max(0, Math.floor(Math.log2(c.half / 4))), bar = unit * scale;
                const left = 24 * pixel, bottom = H - 24 * pixel;
                ctx.strokeStyle = dark ? '#95939d' : '#807b85'; ctx.lineWidth = pixel;
                ctx.beginPath(); ctx.moveTo(left, bottom - 4 * pixel); ctx.lineTo(left, bottom);
                ctx.lineTo(left + bar, bottom); ctx.lineTo(left + bar, bottom - 4 * pixel); ctx.stroke();
                ctx.fillStyle = dark ? '#b9b3bb' : '#69636c'; ctx.font = (10 * pixel) + 'px ui-monospace, monospace';
                ctx.textAlign = 'left'; ctx.fillText(unit + (unit === 1 ? ' unit' : ' units'), left, bottom - 9 * pixel);
                ctx.textAlign = 'right'; ctx.fillText(view === 'whole' ? 'WHOLE PATH' : 'FOLLOWING THE WALK', W - 24 * pixel, bottom);
            }
            ctx.restore();
        };
    }

    function mount({ canvas, prefix, gamma = 0, reduced = false }) {
        if (!canvas) return null;
        const scope = canvas.closest('.study') || document, ctx = canvas.getContext('2d');
        const $ = selector => scope.querySelector(selector);
        const each = (selector, fn) => scope.querySelectorAll(selector).forEach(fn);
        const attribute = name => 'data-' + prefix + '-' + name;
        const buttons = name => '[' + attribute(name) + ']';
        const fieldSeed = gamma ? 0xa16eb2 : 0xc8171c;
        let seed = fieldSeed, run, paintRun, cam;
        let view = 'follow', pace = 1, paused = reduced, awake = false, running = false;
        let raf = 0, last = 0, carry = 0, cssWidth = 720;
        const note = $('#' + (prefix === 'sd' ? 'sd' : 'algebraic-sd') + '-note');
        const time = $('#' + (prefix === 'sd' ? 'sd' : 'algebraic-sd') + '-time');
        function paint() {
            paintRun(ctx, canvas.width, canvas.height, cam, { cssWidth, view });
            canvas.dataset.time = run.time.toFixed(3); canvas.dataset.steps = String(run.steps);
            canvas.dataset.x = String(run.x); canvas.dataset.y = String(run.y);
            canvas.dataset.seed = String(seed); canvas.dataset.view = view; canvas.dataset.running = String(running);
            canvas.dataset.cameraHalf = String(cam.half);
            if (time) time.textContent = run.time.toFixed(1);
        }
        function sync() {
            for (const [key, value] of [['view', view], ['speed', String(pace)], ['gamma', gamma]]) {
                each(buttons(key), button => {
                    const actual = button.getAttribute(attribute(key));
                    const selected = key === 'gamma' ? Number(actual) === value : actual === value;
                    button.classList.toggle('is-on', selected); button.setAttribute('aria-pressed', String(selected));
                });
            }
            const toggle = $('[' + attribute('run') + '="pause"]');
            if (toggle) {
                toggle.textContent = paused ? 'Play' : 'Pause';
                toggle.classList.toggle('is-on', !paused); toggle.setAttribute('aria-pressed', String(!paused));
            }
            if (note) note.textContent = (paused ? 'Paused' : 'One continuous random walk') + ' · ' + (view === 'follow' ? 'fixed scale' : 'full history');
        }
        function reset() {
            run = create({ seed, fieldSeed, gamma }); paintRun = createPainter(run);
            if (reduced && paused) advance(run, 3500);
            cam = camera(run, null, view); carry = 0; last = 0; sync(); paint();
        }
        function resize() {
            cssWidth = Math.max(240, canvas.getBoundingClientRect().width || 720);
            const dpr = Math.max(2, Math.min(3, root.devicePixelRatio || 1));
            const size = Math.round(cssWidth * dpr), height = Math.round(size * (cssWidth < 560 ? 1.05 : .70));
            if (canvas.width !== size || canvas.height !== height) { canvas.width = size; canvas.height = height; }
            paint();
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; last = 0; canvas.dataset.running = 'false'; }
        function frame(now) {
            if (!running) return;
            const elapsed = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 0; last = now;
            // Constant physical time, independent of the shape or speed of the
            // path. Every Euler increment remains in chronological order.
            carry += elapsed * 2.4 * pace / DT;
            const steps = Math.floor(carry); carry -= steps;
            if (steps) advance(run, steps);
            cam = camera(run, cam, view, elapsed); paint(); raf = requestAnimationFrame(frame);
        }
        function start() {
            if (running || paused || !awake || document.hidden) return;
            running = true; last = 0; canvas.dataset.running = 'true'; raf = requestAnimationFrame(frame);
        }
        each(buttons('run'), button => button.addEventListener('click', () => {
            const action = button.getAttribute(attribute('run'));
            if (action === 'pause') { paused = !paused; if (paused) stop(); else start(); }
            if (action === 'replay' || action === 'new') {
                stop(); if (action === 'new') seed = (seed + 0x9e3779b9) >>> 0;
                paused = false; reset(); start();
            }
            sync(); paint();
        }));
        each(buttons('view'), button => button.addEventListener('click', () => {
            view = button.getAttribute(attribute('view')) === 'whole' ? 'whole' : 'follow';
            cam = camera(run, null, view); sync(); paint();
        }));
        each(buttons('speed'), button => button.addEventListener('click', () => {
            pace = Number(button.getAttribute(attribute('speed'))) === 3 ? 3 : 1; sync();
        }));
        each(buttons('gamma'), button => button.addEventListener('click', () => {
            const next = Number(button.getAttribute(attribute('gamma')));
            if (![.05, .10, .15].includes(next) || next === gamma) return;
            stop(); gamma = next; reset(); start();
        }));
        reset(); resize();
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
        return { pause() { awake = false; stop(); }, resume() { awake = true; paint(); start(); } };
    }
    root.FlowWalk = { create, field, advance, camera, createPainter, mount, noise, DT, KAPPA, PERIOD };
}(globalThis));
