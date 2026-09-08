/* Randomly oriented Manhattan lattice. A coin orients a whole row or column;
   a separate stream chooses between the two outgoing edges at every step. */
(function (root) {
    'use strict';
    const TOTAL = 20000, TAU = Math.PI * 2;
    function hash(n) {
        n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
        n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
        return (n ^ n >>> 16) >>> 0;
    }
    function orientation(seed, axis, line) {
        return hash((seed ^ Math.imul(line, 0x9e3779b1) ^ (axis ? 0x63d83595 : 0xa511e9b3)) >>> 0) < 0x80000000 ? -1 : 1;
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
    function generate({ seed = 0x4d616e68, steps = TOTAL } = {}) {
        const x = new Int32Array(steps + 1), y = new Int32Array(steps + 1);
        const xMin = new Int32Array(steps + 1), xMax = new Int32Array(steps + 1);
        const yMin = new Int32Array(steps + 1), yMax = new Int32Array(steps + 1);
        const visited = new Uint32Array(steps + 1), returns = new Uint32Array(steps + 1);
        const seen = new Set(['0,0']), coin = random(seed ^ 0xb5297a4d);
        visited[0] = 1;
        for (let n = 1; n <= steps; n++) {
            x[n] = x[n - 1]; y[n] = y[n - 1];
            if (coin() < .5) x[n] += orientation(seed, 0, y[n]);
            else y[n] += orientation(seed, 1, x[n]);
            seen.add(x[n] + ',' + y[n]); visited[n] = seen.size;
            returns[n] = returns[n - 1] + Number(x[n] === 0 && y[n] === 0);
            xMin[n] = Math.min(xMin[n - 1], x[n]); xMax[n] = Math.max(xMax[n - 1], x[n]);
            yMin[n] = Math.min(yMin[n - 1], y[n]); yMax[n] = Math.max(yMax[n - 1], y[n]);
        }
        return { seed, steps, x, y, xMin, xMax, yMin, yMax, visited, returns };
    }

    function create() {
        const canvas = document.querySelector('#manhattan-canvas');
        if (!canvas) return { pause() {}, resume() {} };
        const ctx = canvas.getContext('2d'), scope = canvas.closest('.study') || document;
        const $ = selector => scope.querySelector(selector);
        const each = (selector, fn) => scope.querySelectorAll(selector).forEach(fn);
        const reduce = root.matchMedia('(prefers-reduced-motion: reduce)');
        let run = generate(), progress = reduce.matches ? 280 : 0;
        let view = 'follow', pace = 'watch', userPaused = reduce.matches, suspended = true;
        let frame = 0, previous = 0, width = 900, height = 660, cssWidth = 900, camera = null;
        const slider = $('#manhattan-time'), pauseButton = $('[data-manhattan-run="pause"]');
        const out = { steps: $('#manhattan-steps'), visited: $('#manhattan-visited'), distance: $('#manhattan-distance'), note: $('#manhattan-note') };
        const colors = { bg: '#15131a', line: '#36333f', arrows: '#666477', cyan: '#8dcddd', rose: '#d88ba6', gold: '#f3c577', white: '#f5ede2' };
        function pressed(selector, key, value) {
            each(selector, b => {
                const on = b.dataset[key] === value;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
        }
        function updateReadout() {
            const n = Math.min(run.steps, Math.floor(progress));
            if (out.steps) out.steps.textContent = n.toLocaleString();
            if (out.visited) out.visited.textContent = run.visited[n].toLocaleString();
            if (out.distance) out.distance.textContent = Math.hypot(run.x[n], run.y[n]).toFixed(1);
            if (slider) { slider.value = String(n); slider.setAttribute('aria-valuetext', n.toLocaleString() + ' steps'); }
            if (pauseButton) { pauseButton.textContent = userPaused || n >= run.steps ? 'Play' : 'Pause'; pauseButton.classList.toggle('is-on', !userPaused && n < run.steps); }
            if (out.note) out.note.textContent = n >= run.steps ? '20,000 steps · replay or sample another field' : view === 'follow' ? 'One direction per street · two choices at every junction' : 'The full revealed path · colour runs from blue to rose';
        }
        function arrow(x, y, dx, dy, length, color, lineWidth = 1.1) {
            const px = -dy, py = dx;
            ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
            ctx.beginPath(); ctx.moveTo(x - dx * length, y - dy * length); ctx.lineTo(x + dx * length, y + dy * length);
            ctx.moveTo(x + dx * length - dx * 4 + px * 3, y + dy * length - dy * 4 + py * 3);
            ctx.lineTo(x + dx * length, y + dy * length);
            ctx.lineTo(x + dx * length - dx * 4 - px * 3, y + dy * length - dy * 4 - py * 3); ctx.stroke();
        }
        function path(n, sx, sy, cell, inset = false) {
            if (!n) return;
            const buckets = inset ? 7 : 18, bucketSize = Math.max(1, Math.ceil(n / buckets));
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (let first = 1; first <= n; first += bucketSize) {
                const end = Math.min(n, first + bucketSize - 1), age = end / Math.max(1, n);
                const red = Math.round(93 + 125 * age), green = Math.round(166 - 25 * age), blue = Math.round(186 - 21 * age);
                ctx.strokeStyle = `rgba(${red},${green},${blue},${inset ? .9 : .43 + .47 * age})`;
                ctx.lineWidth = inset ? 1.15 : Math.max(1.3, Math.min(3.7, cell * .15));
                ctx.beginPath(); ctx.moveTo(sx(run.x[first - 1]), sy(run.y[first - 1]));
                for (let i = first; i <= end; i++) ctx.lineTo(sx(run.x[i]), sy(run.y[i]));
                ctx.stroke();
            }
        }
        function draw() {
            const n = Math.min(run.steps, Math.floor(progress)), fraction = progress - n;
            const hx = run.x[n] + (n < run.steps ? fraction * (run.x[n + 1] - run.x[n]) : 0);
            const hy = run.y[n] + (n < run.steps ? fraction * (run.y[n + 1] - run.y[n]) : 0);
            const desktop = cssWidth > 600, margin = desktop ? 52 : 38, labelSize = desktop ? 12 : 20;
            let cx, cy, cell;
            if (view === 'whole') {
                cell = Math.min((width - margin * 2) / Math.max(16, run.xMax[n] - run.xMin[n]), (height - margin * 2) / Math.max(14, run.yMax[n] - run.yMin[n]));
                cx = (run.xMax[n] + run.xMin[n]) / 2; cy = (run.yMax[n] + run.yMin[n]) / 2;
            } else {
                cell = desktop ? 27 : 30;
                if (!camera) camera = [hx, hy];
                // A dead zone makes consecutive steps easy to read; the camera
                // follows only when the walk moves beyond the central streets.
                const dx = hx - camera[0], dy = hy - camera[1];
                const freeX = width / cell * .13, freeY = height / cell * .13;
                if (Math.abs(dx) > freeX) camera[0] += (dx - Math.sign(dx) * freeX) * .12;
                if (Math.abs(dy) > freeY) camera[1] += (dy - Math.sign(dy) * freeY) * .12;
                cx = camera[0]; cy = camera[1];
            }
            const sx = x => width / 2 + (x - cx) * cell, sy = y => height / 2 - (y - cy) * cell;
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
            const lowX = Math.floor(cx - width / 2 / cell) - 1, highX = Math.ceil(cx + width / 2 / cell) + 1;
            const lowY = Math.floor(cy - height / 2 / cell) - 1, highY = Math.ceil(cy + height / 2 / cell) + 1;
            if (cell >= 8) {
                ctx.lineWidth = .8; ctx.strokeStyle = colors.line;
                ctx.beginPath();
                for (let x = lowX; x <= highX; x++) { ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), height); }
                for (let y = lowY; y <= highY; y++) { ctx.moveTo(0, sy(y)); ctx.lineTo(width, sy(y)); }
                ctx.stroke();
                if (cell >= 17) {
                    for (let y = lowY; y <= highY; y++) for (let x = lowX; x <= highX; x += 2) arrow(sx(x + .5), sy(y), orientation(run.seed, 0, y), 0, cell * .17, colors.arrows);
                    for (let x = lowX; x <= highX; x++) for (let y = lowY; y <= highY; y += 2) arrow(sx(x), sy(y + .5), 0, -orientation(run.seed, 1, x), cell * .17, colors.arrows);
                }
            } else {
                // At the overview scale, coarse guides retain orientation
                // without falsely drawing individual streets at altered spacing.
                const grid = 10 ** Math.floor(Math.log10(65 / cell));
                ctx.strokeStyle = '#25222d'; ctx.lineWidth = 1; ctx.beginPath();
                for (let x = Math.ceil(lowX / grid) * grid; x < highX; x += grid) { ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), height); }
                for (let y = Math.ceil(lowY / grid) * grid; y < highY; y += grid) { ctx.moveTo(0, sy(y)); ctx.lineTo(width, sy(y)); } ctx.stroke();
            }
            path(n, sx, sy, cell);
            if (fraction && n < run.steps) { ctx.strokeStyle = colors.rose; ctx.lineWidth = Math.max(1.8, Math.min(4, cell * .16)); ctx.beginPath(); ctx.moveTo(sx(run.x[n]), sy(run.y[n])); ctx.lineTo(sx(hx), sy(hy)); ctx.stroke(); }
            const ox = sx(0), oy = sy(0);
            if (ox > 12 && ox < width - 12 && oy > 12 && oy < height - 12) {
                ctx.strokeStyle = colors.white; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, TAU); ctx.stroke();
                ctx.fillStyle = colors.white; ctx.font = labelSize + 'px ui-monospace, monospace';
                const labelLeft = ox > width - 85; ctx.textAlign = labelLeft ? 'right' : 'left';
                ctx.fillText('start', ox + (labelLeft ? -11 : 11), oy - 9); ctx.textAlign = 'left';
            }
            if (cell >= 17 && (userPaused || pace === 'watch')) {
                const x = run.x[n], y = run.y[n], dx = orientation(run.seed, 0, y), dy = orientation(run.seed, 1, x);
                arrow(sx(x + dx * .52), sy(y), dx, 0, cell * .32, colors.gold, 2);
                arrow(sx(x), sy(y + dy * .52), 0, -dy, cell * .32, colors.gold, 2);
            }
            const px = sx(hx), py = sy(hy);
            ctx.fillStyle = 'rgba(243,197,119,.16)'; ctx.beginPath(); ctx.arc(px, py, 12, 0, TAU); ctx.fill();
            ctx.fillStyle = colors.gold; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, TAU); ctx.fill();
            // A quiet locator keeps the accumulated geometry visible in Follow.
            if (view === 'follow' && n > 0) {
                const iw = desktop ? 166 : 168, ih = desktop ? 128 : 128, left = 18, top = height - ih - 18;
                ctx.fillStyle = 'rgba(21,19,26,.94)'; ctx.fillRect(left, top, iw, ih);
                ctx.strokeStyle = '#514a59'; ctx.lineWidth = 1; ctx.strokeRect(left + .5, top + .5, iw - 1, ih - 1);
                const miniCell = Math.min((iw - 22) / Math.max(12, run.xMax[n] - run.xMin[n]), (ih - 34) / Math.max(10, run.yMax[n] - run.yMin[n]));
                const mx = (run.xMax[n] + run.xMin[n]) / 2, my = (run.yMax[n] + run.yMin[n]) / 2;
                const msx = x => left + iw / 2 + (x - mx) * miniCell, msy = y => top + 21 + (ih - 22) / 2 - (y - my) * miniCell;
                ctx.fillStyle = '#b0a4ad'; ctx.font = (desktop ? 10 : 14) + 'px ui-monospace, monospace'; ctx.fillText('WHOLE PATH', left + 9, top + 15);
                ctx.save(); ctx.beginPath(); ctx.rect(left + 4, top + 23, iw - 8, ih - 27); ctx.clip();
                path(n, msx, msy, miniCell, true);
                ctx.strokeStyle = '#c9c1b755'; ctx.lineWidth = 1; ctx.strokeRect(msx(cx - width / cell / 2), msy(cy + height / cell / 2), width / cell * miniCell, height / cell * miniCell);
                ctx.fillStyle = colors.gold; ctx.beginPath(); ctx.arc(msx(hx), msy(hy), 2.5, 0, TAU); ctx.fill(); ctx.restore();
            }
            const scaleUnits = cell >= 17 ? 5 : 10 ** Math.ceil(Math.log10(60 / cell));
            const scalePixels = scaleUnits * cell, right = width - 25, bottom = height - 26;
            ctx.strokeStyle = '#b8aeb7'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(right - scalePixels, bottom - 4); ctx.lineTo(right - scalePixels, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, bottom - 4); ctx.stroke();
            ctx.fillStyle = '#bbb0b8'; ctx.font = labelSize + 'px ui-monospace, monospace'; ctx.textAlign = 'right'; ctx.fillText(scaleUnits + ' lattice units', right, bottom - 10); ctx.textAlign = 'left';
            updateReadout();
        }
        function resize() {
            cssWidth = canvas.getBoundingClientRect().width || 900;
            width = cssWidth < 600 ? 600 : 900; height = cssWidth < 600 ? 700 : 660;
            const ratio = Math.min(2.5, Math.max(2, root.devicePixelRatio || 1)) * cssWidth / width;
            canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
            canvas.style.aspectRatio = width + ' / ' + height;
            ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0); draw();
        }
        function tick(t) {
            frame = 0;
            if (suspended || userPaused || document.hidden || progress >= run.steps) return;
            const delta = previous ? Math.min(.07, (t - previous) / 1000) : 0; previous = t;
            progress = Math.min(run.steps, progress + delta * (pace === 'watch' ? 18 : 420)); draw();
            frame = root.requestAnimationFrame(tick);
        }
        function start() {
            if (!frame && !suspended && !userPaused && !document.hidden && progress < run.steps) { previous = 0; frame = root.requestAnimationFrame(tick); }
        }
        function stop() { root.cancelAnimationFrame(frame); frame = 0; previous = 0; }
        each('[data-manhattan-view]', b => b.addEventListener('click', () => { view = b.dataset.manhattanView; camera = null; pressed('[data-manhattan-view]', 'manhattanView', view); draw(); }));
        each('[data-manhattan-pace]', b => b.addEventListener('click', () => { pace = b.dataset.manhattanPace; pressed('[data-manhattan-pace]', 'manhattanPace', pace); }));
        each('[data-manhattan-run]', b => b.addEventListener('click', () => {
            const action = b.dataset.manhattanRun;
            if (action === 'pause') { if (progress >= run.steps) { progress = 0; camera = null; userPaused = false; } else userPaused = !userPaused; }
            if (action === 'step') { userPaused = true; progress = Math.min(run.steps, Math.floor(progress) + 1); }
            if (action === 'replay') { progress = 0; camera = null; userPaused = false; }
            if (action === 'new') { run = generate({ seed: hash(run.seed + 0x9e3779b9) }); progress = 0; camera = null; }
            stop(); draw(); start();
        }));
        if (slider) slider.addEventListener('input', () => { userPaused = true; progress = Math.max(0, Math.min(run.steps, Number(slider.value))); camera = null; stop(); draw(); });
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
        const onMotion = () => { if (reduce.matches) { userPaused = true; stop(); draw(); } };
        if (reduce.addEventListener) reduce.addEventListener('change', onMotion);
        if (root.ResizeObserver) new root.ResizeObserver(resize).observe(canvas); else root.addEventListener('resize', resize);
        resize();
        return { pause() { suspended = true; stop(); }, resume() { suspended = false; resize(); start(); } };
    }
    root.ManhattanGallery = { create, generate, orientation };
})(globalThis);
