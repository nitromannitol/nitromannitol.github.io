/* Once-reinforced random walk on Z². The model is unbounded: no torus,
   reflecting box, discarded excursions, or time change. Every move is recorded. */
(function (root) {
    'use strict';
    const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const DEFAULT_SEED = 0x2545f491;
    const STEPS = 24000;
    const TAU = Math.PI * 2;
    function random(seed) {
        let state = seed >>> 0;
        return function () {
            state = (state + 0x6D2B79F5) >>> 0;
            let z = Math.imul(state ^ state >>> 15, 1 | state);
            z ^= z + Math.imul(z ^ z >>> 7, 61 | z);
            return ((z ^ z >>> 14) >>> 0) / 4294967296;
        };
    }
    function edgeKey(x, y, nx, ny) {
        return x < nx || (x === nx && y < ny)
            ? x + ',' + y + '|' + nx + ',' + ny
            : nx + ',' + ny + '|' + x + ',' + y;
    }
    function weightsAt(x, y, seen, beta) {
        return DIRECTIONS.map(([dx, dy]) => seen.has(edgeKey(x, y, x + dx, y + dy)) ? beta : 1);
    }
    function generate(options = {}) {
        const beta = options.beta === undefined ? 4 : Number(options.beta);
        const steps = options.steps === undefined ? STEPS : Number(options.steps);
        const seed = options.seed === undefined ? DEFAULT_SEED : options.seed >>> 0;
        if (!Number.isFinite(beta) || beta < 1) throw new RangeError('Reinforcement must be at least one.');
        if (!Number.isInteger(steps) || steps < 0 || steps > 1000000) throw new RangeError('Invalid step count.');
        const rng = random(seed), seen = new Map(), visited = new Set(['0,0']);
        const path = new Int32Array((steps + 1) * 2), edgeAt = new Int32Array(steps + 1);
        const range = new Uint32Array(steps + 1), edgeCount = new Uint32Array(steps + 1);
        const bounds = new Int32Array((steps + 1) * 4), edges = [];
        range[0] = 1; edgeAt[0] = -1;
        let x = 0, y = 0, xmin = 0, xmax = 0, ymin = 0, ymax = 0;
        for (let n = 1; n <= steps; n++) {
            const weights = weightsAt(x, y, seen, beta);
            let r = rng() * weights.reduce((sum, w) => sum + w, 0), choice = 0;
            while (choice < 3 && r >= weights[choice]) r -= weights[choice++];
            const nx = x + DIRECTIONS[choice][0], ny = y + DIRECTIONS[choice][1];
            const key = edgeKey(x, y, nx, ny);
            if (!seen.has(key)) {
                seen.set(key, edges.length);
                edges.push({ x, y, nx, ny, born: n });
            }
            edgeAt[n] = seen.get(key);
            visited.add(nx + ',' + ny);
            x = nx; y = ny; path[2 * n] = x; path[2 * n + 1] = y;
            range[n] = visited.size; edgeCount[n] = edges.length;
            xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
            ymin = Math.min(ymin, y); ymax = Math.max(ymax, y);
            bounds.set([xmin, xmax, ymin, ymax], 4 * n);
        }
        return { beta, steps, seed, path, edgeAt, range, edgeCount, edges, bounds };
    }
    function cameraAt(run, progress, width, height) {
        const n = Math.min(run.steps, Math.ceil(Math.max(0, progress))), b = 4 * n;
        const xmin = run.bounds[b], xmax = run.bounds[b + 1];
        const ymin = run.bounds[b + 2], ymax = run.bounds[b + 3];
        const pad = width < 500 ? 35 : 58;
        return { x: (xmin + xmax) / 2, y: (ymin + ymax) / 2,
            scale: Math.min((width - 2 * pad) / Math.max(16, xmax - xmin + 5),
                (height - 2 * pad) / Math.max(16, ymax - ymin + 5)) };
    }
    function paint(ctx, width, height, run, progress, options = {}) {
        const dark = options.dark !== false;
        const n = Math.max(0, Math.min(run.steps, Math.floor(progress)));
        const next = Math.min(run.steps, n + 1), fraction = Math.max(0, Math.min(1, progress - n));
        const camera = options.camera || cameraAt(run, progress, width, height);
        const cell = camera.scale;
        const sx = x => width / 2 + (x - camera.x) * cell;
        const sy = y => height / 2 - (y - camera.y) * cell;
        ctx.save();
        ctx.fillStyle = dark ? '#101219' : '#F4F0E6'; ctx.fillRect(0, 0, width, height);
        const glow = ctx.createRadialGradient(width * .5, height * .48, 0, width * .5, height * .48, width * .64);
        glow.addColorStop(0, dark ? '#17212B' : '#E6EADF');
        glow.addColorStop(1, dark ? '#101219' : '#F4F0E6');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
        if (cell >= 6) {
            ctx.fillStyle = dark ? 'rgba(170,194,207,.13)' : 'rgba(34,60,71,.13)';
            const left = Math.ceil(camera.x - width / (2 * cell)), right = Math.floor(camera.x + width / (2 * cell));
            const bottom = Math.ceil(camera.y - height / (2 * cell)), top = Math.floor(camera.y + height / (2 * cell));
            ctx.beginPath();
            for (let y = bottom; y <= top; y++) for (let x = left; x <= right; x++) {
                ctx.moveTo(sx(x) + .65, sy(y)); ctx.arc(sx(x), sy(y), .65, 0, TAU);
            }
            ctx.fill();
        }
        const count = run.edgeCount[n];
        const colors = dark ? ['#31546F', '#3D819A', '#69BBC2', '#A2DED3']
            : ['#9CBAC1', '#5F99A5', '#317786', '#205A67'];
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(1.5, Math.min(8, cell * .32));
        for (let bucket = 0; bucket < 4; bucket++) {
            ctx.beginPath(); ctx.strokeStyle = colors[bucket];
            for (let i = 0; i < count; i++) {
                const edge = run.edges[i];
                if (Math.min(3, Math.floor(4 * i / Math.max(1, count))) !== bucket) continue;
                ctx.moveTo(sx(edge.x), sy(edge.y)); ctx.lineTo(sx(edge.nx), sy(edge.ny));
            }
            ctx.stroke();
        }
        // All recorded steps, including repeated crossings, drive the live head.
        ctx.beginPath();
        const tail = Math.max(0, n - 32);
        ctx.moveTo(sx(run.path[2 * tail]), sy(run.path[2 * tail + 1]));
        for (let i = tail + 1; i <= n; i++) ctx.lineTo(sx(run.path[2 * i]), sy(run.path[2 * i + 1]));
        const headX = run.path[2 * n] * (1 - fraction) + run.path[2 * next] * fraction;
        const headY = run.path[2 * n + 1] * (1 - fraction) + run.path[2 * next + 1] * fraction;
        ctx.lineTo(sx(headX), sy(headY));
        ctx.strokeStyle = dark ? '#F1C877' : '#B66537';
        ctx.lineWidth = Math.max(2, Math.min(7, cell * .24)); ctx.stroke();
        // A short light pulse marks first crossings; it does not change edge weights.
        ctx.beginPath();
        for (let i = count - 1; i >= 0 && run.edges[i].born > n - 65; i--) {
            const edge = run.edges[i];
            ctx.moveTo(sx(edge.x), sy(edge.y)); ctx.lineTo(sx(edge.nx), sy(edge.ny));
        }
        ctx.strokeStyle = dark ? 'rgba(182,240,222,.7)' : 'rgba(34,111,119,.5)';
        ctx.lineWidth = Math.max(1.5, Math.min(5, cell * .2)); ctx.stroke();
        if (options.choices && cell > 10) {
            const atX = run.path[2 * n], atY = run.path[2 * n + 1];
            const incident = new Set();
            for (let i = 0; i < count; i++) {
                const e = run.edges[i]; incident.add(edgeKey(e.x, e.y, e.nx, e.ny));
            }
            const weights = weightsAt(atX, atY, incident, run.beta);
            DIRECTIONS.forEach(([dx, dy], i) => {
                ctx.beginPath(); ctx.setLineDash(weights[i] === 1 && run.beta > 1 ? [3, 4] : []);
                ctx.moveTo(sx(atX), sy(atY)); ctx.lineTo(sx(atX + dx), sy(atY + dy));
                ctx.lineWidth = 2; ctx.strokeStyle = weights[i] > 1 ? '#F1C877' : '#B6C5CD'; ctx.stroke();
                if (cell >= 21) {
                    ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = dark ? '#E8DED0' : '#3A4650';
                    ctx.fillText(String(weights[i]), sx(atX + dx * 1.3), sy(atY + dy * 1.3) + 4);
                }
            });
            ctx.setLineDash([]);
        }
        if (options.labels !== false) {
            ctx.beginPath(); ctx.arc(sx(0), sy(0), 4, 0, TAU);
            ctx.fillStyle = dark ? '#101219' : '#F4F0E6'; ctx.fill();
            ctx.strokeStyle = dark ? '#CBD2D6' : '#4D6470'; ctx.lineWidth = 1.3; ctx.stroke();
        }
        const halo = ctx.createRadialGradient(sx(headX), sy(headY), 0, sx(headX), sy(headY), 20);
        halo.addColorStop(0, dark ? 'rgba(248,206,126,.48)' : 'rgba(205,130,67,.28)');
        halo.addColorStop(1, 'rgba(248,206,126,0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx(headX), sy(headY), 20, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(sx(headX), sy(headY), Math.max(3.5, Math.min(6, cell * .28)), 0, TAU);
        ctx.fillStyle = dark ? '#FFE4A3' : '#AB4B2D'; ctx.fill();
        ctx.strokeStyle = dark ? '#3B3024' : '#F4F0E6'; ctx.lineWidth = 1.3; ctx.stroke();
        if (options.labels !== false) {
            const spacing = [1, 2, 5, 10, 20, 50, 100].find(v => v * cell >= 45) || 100;
            const pad = width < 500 ? 22 : 30, y = height - pad - 18;
            ctx.strokeStyle = dark ? '#7F929F' : '#657983'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad, y - 3); ctx.lineTo(pad, y + 3);
            ctx.moveTo(pad, y); ctx.lineTo(pad + spacing * cell, y);
            ctx.moveTo(pad + spacing * cell, y - 3); ctx.lineTo(pad + spacing * cell, y + 3); ctx.stroke();
            ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
            ctx.fillStyle = dark ? '#ACBBC3' : '#536D78';
            ctx.fillText(spacing + (spacing === 1 ? ' lattice spacing' : ' lattice spacings'), pad, y + 18);
        }
        ctx.restore();
    }
    function create() {
        const canvas = document.getElementById('orrw-canvas');
        if (!canvas) return null;
        const scope = canvas.closest('.study') || document, ctx = canvas.getContext('2d');
        const $ = selector => scope.querySelector(selector);
        const $$ = selector => Array.from(scope.querySelectorAll(selector));
        const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        const outputs = { step: $('#orrw-step'), range: $('#orrw-range'), edges: $('#orrw-edges') };
        const slider = $('#orrw-time'), pauseButton = $('[data-orrw-run="pause"]'), note = $('#orrw-note');
        const format = new Intl.NumberFormat('en-US');
        let beta = 4, seed = DEFAULT_SEED, run = generate({ beta, seed });
        let progress = reduced ? 7000 : 0, userPaused = reduced, awake = true, inView = true;
        let raf = 0, last = 0, width = 900, height = 620, camera;
        function setStatus(text) { if (note && note.textContent !== text) note.textContent = text; }
        function report() {
            const n = Math.min(run.steps, Math.floor(progress));
            if (outputs.step) outputs.step.textContent = format.format(n);
            if (outputs.range) outputs.range.textContent = format.format(run.range[n]);
            if (outputs.edges) outputs.edges.textContent = format.format(run.edgeCount[n]);
            if (slider) { slider.value = String(n); slider.setAttribute('aria-valuetext', format.format(n) + ' steps, ' + format.format(run.range[n]) + ' sites visited'); }
            if (pauseButton) {
                pauseButton.textContent = userPaused || progress >= run.steps ? 'Play' : 'Pause';
                pauseButton.classList.toggle('is-on', !userPaused && progress < run.steps);
                pauseButton.setAttribute('aria-pressed', String(!userPaused && progress < run.steps));
            }
            $$('[data-orrw-beta]').forEach(button => {
                const active = Number(button.dataset.orrwBeta) === beta;
                button.classList.toggle('is-on', active); button.setAttribute('aria-pressed', String(active));
            });
        }
        function draw(snap = false, dt = 16) {
            const desired = cameraAt(run, progress, width, height);
            if (!camera || snap) camera = desired;
            else {
                const blend = 1 - Math.exp(-dt / 170);
                camera.x += (desired.x - camera.x) * blend;
                camera.y += (desired.y - camera.y) * blend;
                camera.scale += (desired.scale - camera.scale) * blend;
            }
            paint(ctx, width, height, run, progress, { camera, choices: userPaused });
            report();
        }
        function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
        function canRun() { return awake && inView && !document.hidden && !userPaused && progress < run.steps; }
        function frame(now) {
            raf = 0;
            if (!canRun()) { last = 0; return; }
            const dt = last ? Math.min(70, now - last) : 0; last = now;
            // The first moves are legible; the same exact walk then runs faster.
            const rate = progress < 160 ? 45 : progress < 1600 ? 240 : 720;
            progress = Math.min(run.steps, progress + dt * rate / 1000);
            draw(false, dt);
            if (progress >= run.steps) {
                userPaused = true; setStatus('24,000 steps complete. Scrub the walk or replay it.'); report();
            } else raf = requestAnimationFrame(frame);
        }
        function start() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }
        function resize() {
            const rect = canvas.getBoundingClientRect();
            if (rect.width <= 0) return;
            width = rect.width; height = width * (width < 540 ? 1.08 : 620 / 900);
            const dpr = Math.max(2, Math.min(3, root.devicePixelRatio || 1));
            canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
            canvas.style.height = height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw(true);
        }
        function reset(newSeed = false) {
            stop(); if (newSeed) seed = (seed + 0x9E3779B9) >>> 0;
            run = generate({ beta, seed }); progress = 0; camera = null;
            setStatus(beta === 1 ? 'Every edge has weight 1: simple random walk.' : 'A first crossing changes an edge’s weight from 1 to ' + beta + '.');
            draw(true); start();
        }
        $$('[data-orrw-beta]').forEach(button => button.addEventListener('click', () => {
            const selected = Number(button.dataset.orrwBeta);
            if (![1, 4, 16].includes(selected) || selected === beta) return;
            beta = selected; reset();
            if (reduced && userPaused) { progress = 7000; draw(true); }
        }));
        $$('[data-orrw-run]').forEach(button => button.addEventListener('click', () => {
            const action = button.dataset.orrwRun;
            if (action === 'pause') {
                if (progress >= run.steps) progress = 0;
                userPaused = !userPaused;
                if (userPaused) { progress = Math.floor(progress); stop(); draw(true); }
                else { setStatus('Following every move, including repeated crossings.'); start(); report(); }
            } else if (action === 'step') {
                userPaused = true; stop(); progress = Math.min(run.steps, Math.floor(progress) + 1);
                setStatus('Paused. The four incident edges determine the next-step probabilities.'); draw(true);
            } else if (action === 'replay' || action === 'new') {
                if (action === 'replay') userPaused = false;
                reset(action === 'new');
                if (reduced && userPaused && action === 'new') { progress = 7000; draw(true); }
            }
        }));
        if (slider) slider.addEventListener('input', () => {
            userPaused = true; stop(); progress = Math.max(0, Math.min(run.steps, Number(slider.value) || 0));
            setStatus('Paused at the selected step. Press Play to continue.'); draw(true);
        });
        if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas.parentElement);
        if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => {
            inView = entries.some(entry => entry.isIntersecting);
            if (inView) start(); else stop();
        }, { threshold: .05 }).observe(canvas);
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
        resize(); report();
        setStatus(reduced ? 'Paused at 7,000 steps. Press Play to animate.' : 'A first crossing changes an edge’s weight from 1 to 4.');
        start();
        return { pause() { awake = false; stop(); }, resume() { awake = true; resize(); start(); } };
    }
    root.OrrwGallery = { create, generate, paint, cameraAt, edgeKey, weightsAt, random };
})(globalThis);
