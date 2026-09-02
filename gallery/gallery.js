/* =========================================================================
   A Gallery of Mathematical Research
   -------------------------------------------------------------------------
   The wall shows plates as prints on paper. Opening one inverts the room:
   the ground goes dark and the same data becomes emitted light. Everything
   below serves that idea or the instruments inside each study.
   ========================================================================= */

'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PALETTE = {
    ink: '#15131A',
    inkRaised: '#1D1A24',
    paper: '#F2EDE2',
    rose: '#8E4257',
    cyan: '#A8D8E8',
    bone: '#C9BFA8',
    slate: '#4A4A5E'
};

/* height 0,1,2,3 as emitted light — the same table the baked plates use */
const HEIGHTS_VOID = ['#15131A', '#4A4A5E', '#8E4257', '#A8D8E8'];

/* Keep keyboard navigation in exactly the catalogue order assembled by
   build_gallery.py.  This list used to contain a removed `sandpile` study and
   an older ordering, so ArrowLeft from the first live page could target a
   nonexistent section. */
const SECTIONS = ['random-sandpile', 'dimensional-reduction', 'pareto-peeling',
                  'f-lattice', 'divisible', 'sandpile-rwrs', 'percolation',
                  'unique-continuation', 'superdiffusion', 'einstein-relation',
                  'sphere-packing', 'idla-cylinder', 'long-range-walk',
                  'rotor-walk', 'dla', 'idla', 'ust', 'rotor-aggregation',
                  'apollonian'];

/* A model page may host several instruments. Each dedicated research page
   mounts its animated definition first and its single-stage live model next. */
const PAGE_MAKERS = {
    'dimensional-reduction': ['dimredintro', 'dimredlive', 'dimredscale'],
    'apollonian':        ['apollointro', 'apollo'],
    'f-lattice':         ['flatticeintro', 'flattice', 'fareytree'],
    'random-sandpile':   ['randomintro', 'randombg', 'explosive', 'explosionproof'],
    'divisible':         ['divisibleintro', 'divisiblepanels', 'mcrtbuild', 'matedcrt',
                          'matedidla', 'lqgball'],
    'idla-cylinder':     ['cylinderintro', 'cylinder', 'cylinder3d'],
    'idla':              ['idlaintro', 'aggregation'],
    'rotor-aggregation': ['rotoraggintro', 'rotoraggregation'],
    'dla':               ['dlaintro', 'dla'],
    'ust':               ['wilsonintro', 'wilson'],
    'sphere-packing':    ['gmcintro', 'gmcwalk'],
    'rotor-walk':        ['rotorintro', 'rotorwalk'],
    'superdiffusion':    ['sdintro', 'sdlattice', 'sdrace', 'superdiffusion',
                          'algebraicsd'],
    'long-range-walk':   ['longrangeintro', 'longrange'],
    'pareto-peeling':    ['peelintro', 'peeling'],
    'percolation':       ['percolationintro', 'percpanels', 'harmonic', 'percgadget'],
    'einstein-relation': ['einsteinintro', 'einstein'],
    'sandpile-rwrs':     ['rwrsintro', 'rwrs'],
    'unique-continuation': ['uniqueintro', 'unique']
};

/* Playback belongs to the mathematical instrument that owns a node, not to
   the nth canvas in a study.  Several studies contain a static definition or
   a wide construction film before their live model, so positional matching
   can pause one maker while a different canvas is visible. */
const MAKER_TARGETS = {
    dimredintro: '#rule-dimensional-reduction', dimredlive: '#dimred-canvas',
    dimredscale: '#dimred-scale-canvas',
    apollointro: '#rule-apollonian', apollo: '#apollo-canvas',
    flatticeintro: '#rule-f-lattice', flattice: '#flattice-canvas', fareytree: '#ft-tree',
    randomintro: '#rule-random-sandpile', randombg: '#p6-canvas', explosive: '#p6x-canvas',
    explosionproof: '#explosion-proof-canvas',
    divisibleintro: '#rule-divisible', divisiblepanels: '#div-def-canvas',
    mcrtbuild: '#build-divisible', matedcrt: '#mcrt-canvas',
    matedidla: '#mcrt-idla-canvas', lqgball: '#lqg-ball-canvas',
    cylinderintro: '#rule-idla-cylinder', cylinder: '#cylinder-canvas',
    cylinder3d: '#cylinder3d-canvas',
    idlaintro: '#rule-idla', aggregation: '#idla-canvas',
    rotoraggintro: '#rule-rotor-aggregation', rotoraggregation: '#rotoragg-canvas',
    dlaintro: '#rule-dla', dla: '#dla-canvas',
    wilsonintro: '#rule-ust', wilson: '#wilson-canvas',
    gmcintro: '#rule-sphere-packing', gmcwalk: '#gw-canvas',
    rotorintro: '#rule-rotor-walk', rotorwalk: '#euler-canvas',
    sdintro: '#rule-superdiffusion', sdlattice: '#sd-lattice-canvas',
    sdrace: '#build-superdiffusion', superdiffusion: '#sd-canvas',
    algebraicsd: '#algebraic-sd-canvas',
    longrangeintro: '#rule-long-range-walk', longrange: '#longrange-canvas',
    peelintro: '#rule-pareto-peeling', peeling: '#peel-canvas',
    percolationintro: '#rule-percolation', percpanels: '#perc-def-canvas',
    harmonic: '#harmonic-canvas', percgadget: '#perc-gadget-canvas',
    einsteinintro: '#rule-einstein-relation', einstein: '#einstein-canvas',
    rwrsintro: '#rule-sandpile-rwrs', rwrs: '#rwrs-canvas',
    uniqueintro: '#rule-unique-continuation', unique: '#unique-canvas'
};

const TITLES = {
    'dimensional-reduction': 'Dynamic dimensional reduction',
    'apollonian': 'Integer superharmonic matrices on Z\u00b2',
    'f-lattice': 'Integer superharmonic matrices on the F-lattice',
    'random-sandpile': 'Sandpile on a random background',
    'divisible': 'Divisible sandpile on a mated-CRT map',
    'idla-cylinder': 'Internal DLA on cylinders',
    'idla': 'Internal DLA',
    'rotor-aggregation': 'Rotor-router aggregation',
    'dla': 'Diffusion-limited aggregation',
    'ust': 'Uniform spanning tree',
    'rotor-walk': 'Eulerian walkers on Z²',
    'superdiffusion': 'Brownian motion in an incompressible random drift',
    'long-range-walk': 'Critical long-range random conductance walk',
    'sphere-packing': 'Random walk on a sphere packing',
    'pareto-peeling': 'Pareto peeling',
    'percolation': 'Supercritical percolation cluster',
    'einstein-relation': 'Einstein relation in a random environment',
    'sandpile-rwrs': 'Sandpiles and random walk in random scenery',
    'unique-continuation': 'Unique continuation on planar graphs'
};

const nf = new Intl.NumberFormat('en-US');

function $(sel, root) { return (root || document).querySelector(sel); }
/* A status line is set in capitals by its style sheet; a Greek letter in it
   must keep its case, so runs of Greek are wrapped in a no-transform span. */
function setNote(el, text) {
    if (!el) return;
    if (!/[\u0370-\u03ff]/.test(text)) { el.textContent = text; return; }
    el.textContent = '';
    text.split(/([\u0370-\u03ff][\u0370-\u03ff\u207b\u00b2\u2070-\u209f]*)/).forEach(function (part, i) {
        if (!part) return;
        if (i % 2) { const s = document.createElement('span'); s.className = 'nocase'; s.textContent = part; el.appendChild(s); }
        else el.appendChild(document.createTextNode(part));
    });
}
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

function loadImage(src) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('could not load ' + src)); };
        img.src = src;
    });
}

/* =========================================================================
   Router — the invert
   ========================================================================= */

const Router = (function () {
    let current = null;
    let lastTrigger = null;

    function studyOf(id) { return document.getElementById('study-' + id); }
    /* The sheet's cards are the triggers now, and .plate no longer exists.
       Scoping to .card keeps the .study[data-plate] sections out
       of the match. */
    function cardOf(id) { return $('.card[data-plate="' + id + '"]'); }

    function open(id, trigger, silent) {
        const study = studyOf(id);
        if (!study || current === id) return;
        const wasOpen = current;
        lastTrigger = trigger || lastTrigger;

        if (wasOpen) {
            const prev = studyOf(wasOpen);
            prev.classList.remove('is-open');
            Instruments.sleep(wasOpen);   /* close() does this; open() must too */
            prev.hidden = true;
        } else {
            document.body.classList.add('is-locked', 'is-dark');
            $('main').setAttribute('aria-hidden', 'true');
        }

        current = id;
        study.hidden = false;
        /* Force a style flush so the transition has a starting frame. A
           requestAnimationFrame would do it too, but it never fires in a
           background tab, which would leave a deep link stuck half-open. */
        void study.offsetHeight;
        study.classList.add('is-open');
        study.scrollTop = 0;

        const close = $('[data-close]', study);
        if (close) close.focus({ preventScroll: true });
        /* Auto-render only walks the subtree it is handed, and a study is
           hidden until now, so each one is typeset the first time it opens. */
        if (!study.dataset.typeset && window.typeset) {
            window.typeset(study);
            study.dataset.typeset = '1';
        }
        Instruments.wake(id);

        if (!silent && location.hash !== '#' + id) {
            history.pushState({ plate: id }, '', '#' + id);
        }
        document.title = (TITLES[id] || id) + ' · A Gallery of Mathematical Research';
    }

    function close(silent) {
        if (!current) return;
        const study = studyOf(current);
        const id = current;
        current = null;

        study.classList.remove('is-open');
        Instruments.sleep(id);
        study.hidden = true;

        document.body.classList.remove('is-locked', 'is-dark');
        $('main').removeAttribute('aria-hidden');
        /* the card being returned to may live behind the other tab */
        if (window.__tabOf && window.__showTab) {
            const t = window.__tabOf(id);
            if (t) window.__showTab(t);
        }
        if (lastTrigger) lastTrigger.focus({ preventScroll: true });
        if (!silent) history.pushState({ plate: null }, '', location.pathname);
        document.title = 'A Gallery of Mathematical Research';
    }

    function fromHash(silent) {
        const id = location.hash.replace('#', '').toLowerCase();
        if (SECTIONS.indexOf(id) >= 0) {
            const trigger = cardOf(id);
            open(id, trigger, true);
        } else if (current) {
            close(true);
        }
        void silent;
    }

    function init() {
        $$('.card').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                open(a.dataset.plate, a, false);
            });
        });
        $$('[data-goto]').forEach(function (b) {
            b.addEventListener('click', function () {
                const id = b.dataset.goto;
                open(id, cardOf(id), false);
            });
        });
        $$('[data-plate-link]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                open(a.dataset.plateLink, cardOf(a.dataset.plateLink));
            });
        });
        $$('[data-close]').forEach(function (b) {
            b.addEventListener('click', function () { close(); });
        });
        document.addEventListener('keydown', function (e) {
            if (!current) return;
            if (e.key === 'Escape') { close(); return; }
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                if (e.target.tagName === 'INPUT') return;
                const i = SECTIONS.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
                if (i >= 0 && i < SECTIONS.length) {
                    open(SECTIONS[i], cardOf(SECTIONS[i]));
                }
            }
            if (e.key === 'Tab') trapFocus(e, studyOf(current));
        });
        window.addEventListener('popstate', function () { fromHash(true); });
        /* A bare fragment assignment fires hashchange but not popstate, so
           a link to #dla from outside the router did nothing. */
        window.addEventListener('hashchange', function () { fromHash(true); });
        fromHash(true);
    }

    function trapFocus(e, root) {
        const items = $$('a[href], button, input, summary, [tabindex]:not([tabindex="-1"])', root)
            .filter(function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    return { init: init, open: open, close: close };
})();

/* =========================================================================
   Sandpile arithmetic, for the live instruments
   ========================================================================= */

function makeBoard(size) {
    return { size: size, h: new Int32Array(size * size), odo: new Uint32Array(size * size) };
}

function unstableCount(b) {
    let c = 0;
    for (let i = 0; i < b.h.length; i++) if (b.h[i] >= 4) c++;
    return c;
}

/* one synchronous round: every unstable square fires once */
function round(b) {
    const n = b.size, h = b.h, fire = [];
    for (let i = 0; i < h.length; i++) if (h[i] >= 4) fire.push(i);
    for (let k = 0; k < fire.length; k++) {
        const i = fire[k], x = i % n, y = (i / n) | 0;
        h[i] -= 4; b.odo[i] += 1;
        if (x > 0) h[i - 1]++;
        if (x < n - 1) h[i + 1]++;
        if (y > 0) h[i - n]++;
        if (y < n - 1) h[i + n]++;
    }
    return fire.length;
}

/* =========================================================================
   Instruments
   ========================================================================= */

const Instruments = (function () {
    const built = {};
    const running = {};
    const visible = {};
    const active = {};
    const observers = {};

    const makers = {};

    function setActive(k, on) {
        on = !!on;
        if (active[k] === on) return;
        active[k] = on;
        if (!built[k]) return;
        if (on && built[k].resume) built[k].resume();
        if (!on && built[k].pause) built[k].pause();
    }

    function watchStudy(id, study, pairs) {
        if (observers[id]) observers[id].disconnect();
        if (!('IntersectionObserver' in window)) {
            pairs.forEach(function (p) { visible[p.k] = true; setActive(p.k, true); });
            return;
        }
        const byNode = new Map();
        pairs.forEach(function (p) { byNode.set(p.node, p.k); });
        /* An instrument runs once a third of it is on screen, not when its
           first pixel crosses a generous margin: a finite model used to be
           half over before the reader had scrolled down to it. */
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                const k = byNode.get(entry.target);
                if (!k) return;
                const seen = entry.isIntersecting && entry.intersectionRatio >= .3;
                visible[k] = seen;
                setActive(k, running[id] && !document.hidden && seen);
            });
        }, { root: study, rootMargin: '0px', threshold: [0, .3] });
        pairs.forEach(function (p) { io.observe(p.node); });
        observers[id] = io;
    }

    function wake(id) {
        const study = document.getElementById('study-' + id);
        if (study) $$('[data-diagram]', study).forEach(Diagrams.mount);
        running[id] = true;
        /* The maker order is also the visual order: animated definition first,
           then each live canvas below it. Building may begin asset decoding,
           but the observer alone owns playback, so a finite model cannot run
           to completion below the fold while its definition is being read. */
        const pairs = [];
        (PAGE_MAKERS[id] || []).forEach(function (k) {
            if (!makers[k]) {
                /* Three pages carried dead names here for a long time and
                   nothing said so: the controls simply did nothing. */
                console.warn('instrument ' + k + ' is named but not defined');
                return;
            }
            if (!built[k]) {
                try { built[k] = makers[k]() || {}; }
                catch (err) { built[k] = {}; console.warn('instrument ' + k + ':', err); }
            }
            /* Most constructors paint or start once. Quench that eager start;
               the first observer notification will resume only what is near
               the viewport. */
            if (built[k] && built[k].pause) built[k].pause();
            active[k] = false;
            visible[k] = false;
            const selector = MAKER_TARGETS[k];
            const node = selector && study ? $(selector, study) : null;
            if (node) pairs.push({ k: k, node: node });
            else {
                if (selector) console.warn('instrument target ' + selector + ' is missing');
                setActive(k, true);       /* static/non-canvas controller */
            }
        });
        if (study) watchStudy(id, study, pairs);
    }

    function sleep(id) {
        running[id] = false;
        if (observers[id]) observers[id].disconnect();
        (PAGE_MAKERS[id] || []).forEach(function (k) {
            visible[k] = false;
            setActive(k, false);
        });
    }

    document.addEventListener('visibilitychange', function () {
        Object.keys(running).forEach(function (id) {
            if (!running[id]) return;
            (PAGE_MAKERS[id] || []).forEach(function (k) {
                setActive(k, !document.hidden && !!visible[k]);
            });
        });
    });

    /* ---------------- Plate I — the rule ---------------- */

    /* Every instrument opens slowly enough to be read and then runs flat out.
       Hidden and offscreen instruments pause in place; completing a model is
       a mathematical event, never a side effect of browser throttling. One
       clock for all of them.

         o.watch  slow ticks to open with (0 for none)
         o.every  ms between slow ticks
         o.tick   one slow tick; false ends the slow phase
         o.frame  one fast frame; false ends the run
         o.finish complete the computation and the drawing, now */
    /* A 256-stop ramp, flat: RAMP[3i], RAMP[3i+1], RAMP[3i+2]. The bakes
       build the same thing in palette.py; this is the browser's copy, so a
       shade computed live matches a shade computed offline. */
    function rampOf(stops) {
        const out = new Uint8Array(256 * 3);
        for (let i = 0; i < 256; i++) {
            const u = i / 255 * (stops.length - 1);
            const lo = Math.min(stops.length - 1, Math.floor(u));
            const hi = Math.min(stops.length - 1, lo + 1);
            const f = u - lo;
            for (let c = 0; c < 3; c++) {
                out[i * 3 + c] = Math.round(stops[lo][c] + (stops[hi][c] - stops[lo][c]) * f);
            }
        }
        return out;
    }

    function paced(o) {
        let timer = 0, raf = 0, live = false, left = o.watch || 0;

        function stop() {
            live = false;
            clearInterval(timer); timer = 0;
            cancelAnimationFrame(raf);
        }
        function schedule() {
            cancelAnimationFrame(raf);
            /* Native rAF already pauses in a hidden/throttled document and
               resumes on return. A former 900ms watchdog interpreted Safari
               throttling as mathematical completion and stranded simulations
               at their last (or, for IDLA, a mid-run) frame. */
            raf = requestAnimationFrame(fast);
        }
        function fast() {
            if (!live) return;
            if (o.frame() === false) { stop(); return; }
            schedule();
        }
        function slowPhase() {
            timer = setInterval(function () {
                if (!live) return;
                if (document.hidden) return;
                left--;
                if (o.tick() === false || left <= 0) {
                    clearInterval(timer); timer = 0;
                    schedule();
                }
            }, o.every);
        }
        function start() {
            stop();
            live = true;
            if (REDUCED) { live = false; o.finish(); return; }
            if (left > 0) slowPhase(); else schedule();
        }
        return {
            start: start, stop: stop,
            running: function () { return live; },
            /* re-enter the slow phase mid-run: the uniform spanning tree needs
               a second window once its walks are short enough to complete */
            slow: function (n) {
                left = n;
                if (live && !timer) {
                    cancelAnimationFrame(raf);
                    slowPhase();
                }
            }
        };
    }

    makers.board = function () {
        const canvas = $('#rule-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const N = 13, CELL = canvas.width / N;        /* small enough to read */
        let b = makeBoard(N);
        let fires = 0, roundNo = 0;
        /* The heights are the state of the model and must repaint: firing,
           receiving and re-firing is the whole subject, and a height that
           never changed would be a different model. The permanent record
           lives elsewhere -- the round in which a square FIRST fired, written
           once and drawn as a bone outline that no later round touches. */
        let firstFired = new Int32Array(N * N);

        const elGrains = $('#rule-grains'), elUnstable = $('#rule-unstable'),
              elFires = $('#rule-fires'), note = $('#rule-note');

        /* Stable heights use the exact colour table of the plates. An
           unstable square is paper-white with its count in ink: the register
           the gallery keeps for whatever is about to move, 33 luminance units
           above height-3 cyan. The old bone highlight sat 15 BELOW cyan, so
           "3" and "4 or more" were the two most confusable cells on the
           board. */
        const FILL = [PALETTE.inkRaised, PALETTE.slate, PALETTE.rose, PALETTE.cyan];
        const INK_ON = ['rgba(239,233,220,.30)', 'rgba(239,233,220,.85)', '#F6F1E6', '#15131A'];

        function total() {
            let s = 0;
            for (let i = 0; i < b.h.length; i++) s += b.h[i];
            return s;
        }

        function markFirstFires() {
            for (let i = 0; i < b.odo.length; i++) {
                if (!firstFired[i] && b.odo[i]) firstFired[i] = roundNo;
            }
        }

        function paint() {
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, canvas.width, canvas.width);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = Math.round(CELL * 0.44) + 'px "STIX Two Text", "Times New Roman", serif';
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < N; x++) {
                    const i = y * N + x;
                    const v = b.h[i];
                    const unstable = v >= 4;
                    ctx.fillStyle = unstable ? '#F6F1E6' : FILL[v];
                    ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
                    if (firstFired[i]) {
                        ctx.strokeStyle = 'rgba(201,191,168,.6)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
                    }
                    ctx.fillStyle = unstable ? '#15131A' : INK_ON[v];
                    ctx.fillText(String(v), (x + 0.5) * CELL, (y + 0.56) * CELL);
                }
            }
            ctx.strokeStyle = 'rgba(239,233,220,.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= N; i++) {
                ctx.moveTo(i * CELL + .5, 0); ctx.lineTo(i * CELL + .5, N * CELL);
                ctx.moveTo(0, i * CELL + .5); ctx.lineTo(N * CELL, i * CELL + .5);
            }
            ctx.stroke();

            elGrains.textContent = nf.format(total());
            const u = unstableCount(b);
            elUnstable.textContent = nf.format(u);
            elFires.textContent = nf.format(fires);
            note.textContent = u ? u + (u === 1 ? ' square at four or more' : ' squares at four or more')
                                 : (fires ? 'stable — the outlined squares have fired'
                                          : 'stable — every square holds three or fewer');
        }

        function oneRound() {
            const f = round(b);
            if (f) { fires += f; roundNo++; markFirstFires(); }
            return f;
        }

        function settleAll() {
            let f, guard = 0;
            while ((f = round(b)) && guard++ < 20000) { fires += f; roundNo++; }
            markFirstFires();
        }

        /* One round per slow tick until the board is stable: the halt is the
           event the model supplies, not a frame quota. In a background tab,
           or under reduced motion, the guard settles the board at once. */
        const runner = paced({
            watch: 1 << 30, every: 420,
            tick: function () { const f = oneRound(); paint(); return f > 0; },
            frame: function () { return false; },
            finish: function () { settleAll(); paint(); }
        });

        function add(i, k) {
            b.h[i] += k;
            paint();
            if (unstableCount(b)) runner.start();
        }
        function centre() { return ((N / 2) | 0) * N + ((N / 2) | 0); }

        canvas.addEventListener('click', function (e) {
            const r = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - r.left) / r.width * N);
            const y = Math.floor((e.clientY - r.top) / r.height * N);
            if (x < 0 || y < 0 || x >= N || y >= N) return;
            add(y * N + x, 1);
        });

        $$('[data-rule]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const a = btn.dataset.rule;
                if (a === 'clear') {
                    runner.stop();
                    b = makeBoard(N); fires = 0; roundNo = 0;
                    firstFired = new Int32Array(N * N);
                    paint(); return;
                }
                if (a === 'one') add(centre(), 1);
                if (a === 'four') add(centre(), 4);
                if (a === 'hundred') add(centre(), 40);
                if (a === 'step') { runner.stop(); oneRound(); paint(); return; }
                if (a === 'settle') { runner.stop(); settleAll(); paint(); return; }
            });
        });

        /* The board wakes holding four grains on the centre square; watching
           that round fire, unprompted, is the whole rule. */
        add(centre(), 4);
        return { pause: runner.stop };
    };

    /* ---------------- Plate II — the two orders ---------------- */

    makers.race = function () {
        const ca = $('#race-a'), cb = $('#race-b');
        if (!ca || !cb) return null;
        const xa = ca.getContext('2d'), xb = cb.getContext('2d');
        const N = 70, CHIPS = 4000, COHORT = 88;
        const W = ca.width;

        /* What the schedule owns is the HISTORY, so the history is what each
           board keeps: every square permanently wears the ring it joined,
           ring k being the k-th cohort of 88 squares to topple for the first
           time, rose and cyan by turns. A square is painted once and never
           repainted; the unstable squares of the moment ride on top in
           paper-white. The heights -- the thing the theorem says cannot
           differ -- are swept in over both boards when they rest. */
        const ROSE = [142, 66, 87], CYAN = [168, 216, 232], INKRGB = [21, 19, 26];
        const HTONES = [[21, 19, 26], [74, 74, 94], [142, 66, 87], [168, 216, 232]];

        let A, B, rounds = 0, firesA = 0, firesB = 0, view = 'rings';
        let wipe = 0, wipeGuard = 0, sweepT = 0, maxCheb = 0;
        const CTR = (N / 2) | 0;

        /* The window tracks the support, exactly as the rotor walk's does:
           the pile always fills the frame, and what you watch is rings being
           laid, not a disc shrinking into a fixed board. */
        function halfWidth() { return Math.max(9, Math.min(CTR, maxCheb + 3)); }

        const elA = $('#race-a-count'), elB = $('#race-b-count'), elR = $('#race-b-rounds'),
              elTA = $('#race-a-total'), elTB = $('#race-b-total'),
              elVerdict = $('#race-verdict'), elRings = $('#race-rings'),
              note = $('#race-note'), viewBtn = $('[data-race="view"]');

        function newSide() {
            const off = document.createElement('canvas');
            off.width = off.height = N;
            const ictx = off.getContext('2d');
            const img = ictx.createImageData(N, N);
            const d = img.data;
            for (let i = 0; i < N * N; i++) {
                d[i * 4] = INKRGB[0]; d[i * 4 + 1] = INKRGB[1];
                d[i * 4 + 2] = INKRGB[2]; d[i * 4 + 3] = 255;
            }
            return { h: new Int32Array(N * N), odo: new Uint32Array(N * N),
                     ring: new Int16Array(N * N).fill(-1), fired: 0,
                     off: off, ictx: ictx, img: img };
        }

        function fireAt(S, i) {                    /* one legal firing */
            if (!S.odo[i]) {                       /* first topple: join a ring */
                const r = (S.fired / COHORT) | 0;
                S.fired++;
                S.ring[i] = r;
                const c = (r & 1) ? CYAN : ROSE;
                const p = i * 4;
                S.img.data[p] = c[0]; S.img.data[p + 1] = c[1]; S.img.data[p + 2] = c[2];
                const ch = Math.max(Math.abs(i % N - CTR), Math.abs(((i / N) | 0) - CTR));
                if (ch > maxCheb) maxCheb = ch;
            }
            S.odo[i]++;
            S.h[i] -= 4;
            const x = i % N;
            if (x > 0) S.h[i - 1]++;
            if (x < N - 1) S.h[i + 1]++;
            if (i >= N) S.h[i - N]++;
            if (i < N * N - N) S.h[i + N]++;
        }

        const fireList = new Int32Array(N * N * 4);

        /* one synchronous round: every unstable square fires once */
        function parallelRound(S) {
            let n = 0;
            for (let i = 0; i < N * N; i++) if (S.h[i] >= 4) fireList[n++] = i;
            for (let k = 0; k < n; k++) fireAt(S, fireList[k]);
            return n;
        }

        /* budget single firings, each at a square chosen uniformly among the
           unstable ones */
        function randomFires(S, budget) {
            let n = 0;
            for (let i = 0; i < N * N; i++) if (S.h[i] >= 4) fireList[n++] = i;
            if (!n) return 0;
            let done = 0;
            while (done < budget && n) {
                const j = (Math.random() * n) | 0;
                const i = fireList[j];
                if (S.h[i] < 4) { fireList[j] = fireList[--n]; continue; }
                fireAt(S, i);
                done++;
                const x = i % N;
                if (x > 0 && S.h[i - 1] === 4) fireList[n++] = i - 1;
                if (x < N - 1 && S.h[i + 1] === 4) fireList[n++] = i + 1;
                if (i >= N && S.h[i - N] === 4) fireList[n++] = i - N;
                if (i < N * N - N && S.h[i + N] === 4) fireList[n++] = i + N;
                if (S.h[i] < 4) fireList[j] = fireList[--n];
            }
            return done;
        }

        /* shared scratch for the heights view; both boards are identical at
           rest, but each is drawn from its own integers */
        const resOff = document.createElement('canvas');
        resOff.width = resOff.height = N;
        const resCtx = resOff.getContext('2d');
        const resImg = resCtx.createImageData(N, N);

        function drawRings(cx, S) {
            const hw = halfWidth(), s0 = CTR - hw, scale = W / (2 * hw);
            S.ictx.putImageData(S.img, 0, 0);
            cx.imageSmoothingEnabled = false;
            cx.drawImage(S.off, s0, s0, 2 * hw, 2 * hw, 0, 0, W, W);
            cx.fillStyle = '#F6F1E6';                       /* the front */
            for (let i = 0; i < N * N; i++) {
                if (S.h[i] >= 4) {
                    cx.fillRect((i % N - s0) * scale, (((i / N) | 0) - s0) * scale,
                                scale, scale);
                }
            }
        }

        function drawHeights(cx, S) {
            const hw = halfWidth(), s0 = CTR - hw;
            const d = resImg.data;
            for (let i = 0; i < N * N; i++) {
                const c = HTONES[Math.min(3, S.h[i])];
                d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
            }
            resCtx.putImageData(resImg, 0, 0);
            cx.imageSmoothingEnabled = false;
            cx.drawImage(resOff, s0, s0, 2 * hw, 2 * hw, 0, 0, W, W);
        }

        function drawBoth() {
            const f = view === 'result' ? drawHeights : drawRings;
            f(xa, A);
            f(xb, B);
        }

        function update() {
            elA.textContent = nf.format(firesA);
            elB.textContent = nf.format(firesB);
            elR.textContent = nf.format(rounds);
            elTA.textContent = nf.format(firesA);
            elTB.textContent = nf.format(firesB);
        }

        function syncViewBtn() {
            if (viewBtn) viewBtn.setAttribute('aria-pressed', String(view === 'result'));
        }

        function stopSweep() {
            if (wipe) { cancelAnimationFrame(wipe); wipe = 0; }
            if (wipeGuard) { clearTimeout(wipeGuard); wipeGuard = 0; }
            if (sweepT) { clearTimeout(sweepT); sweepT = 0; }
        }

        /* At rest the two HEIGHT fields are equal, so the reveal is to sweep
           them in over both histories at once and let the two boards agree in
           front of the reader. */
        function sweep() {
            const T = 1400, t0 = performance.now();
            let done = false;
            function final() {
                if (done) return;
                done = true;
                wipe = 0;
                view = 'result';
                drawBoth();
                syncViewBtn();
            }
            (function fr(now) {
                const u = Math.min(1, (now - t0) / T);
                const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
                const edge = e * W;
                [[xa, A], [xb, B]].forEach(function (p) {
                    drawRings(p[0], p[1]);
                    p[0].save();
                    p[0].beginPath();
                    p[0].rect(0, 0, edge, W);
                    p[0].clip();
                    drawHeights(p[0], p[1]);
                    p[0].restore();
                    if (u < 1) {
                        p[0].strokeStyle = '#C9BFA8';
                        p[0].lineWidth = 1;
                        p[0].beginPath();
                        p[0].moveTo(edge + .5, 0);
                        p[0].lineTo(edge + .5, W);
                        p[0].stroke();
                    }
                });
                if (u < 1) wipe = requestAnimationFrame(fr);
                else final();
            })(t0);
            wipeGuard = setTimeout(final, T + 400);   /* a hidden tab still lands */
        }

        function rested() {
            let dh = 0, dr = 0, support = 0;
            for (let i = 0; i < N * N; i++) {
                if (A.h[i] !== B.h[i] || A.odo[i] !== B.odo[i]) dh++;
                if (B.ring[i] >= 0) support++;
                if (A.ring[i] !== B.ring[i]) dr++;
            }
            elVerdict.textContent = dh === 0 ? 'none of 4,900' : nf.format(dh);
            elRings.textContent = nf.format(dr) + ' of ' + nf.format(support);
            note.textContent = 'both stable — ' + nf.format((B.fired / COHORT | 0) + 1)
                + ' rings laid';
            if (!REDUCED) sweepT = setTimeout(sweep, 700);
        }

        /* Measured: this pile takes 296,360 firings under either order, which
           is 362 frames at 820 single firings against 8 rounds a frame, so
           the two boards rest at the same moment. */
        const runner = paced({
            watch: 14, every: 300,
            tick: function () {
                firesA += randomFires(A, 1);
                const r = parallelRound(B);
                if (r) { rounds++; firesB += r; }
                drawBoth(); update();
                return true;
            },
            frame: function () {
                const fa = randomFires(A, 820);
                let fb = 0;
                for (let k = 0; k < 8; k++) {
                    const r = parallelRound(B);
                    if (!r) break;
                    fb += r; rounds++;
                }
                firesA += fa; firesB += fb;
                drawBoth(); update();
                if (!fa && !fb) { rested(); return false; }
                return true;
            },
            finish: function () {
                let guard = 0;
                while (guard++ < 500000) {
                    const fa = randomFires(A, 1000000);
                    const r = parallelRound(B);
                    firesA += fa;
                    if (r) { rounds++; firesB += r; }
                    if (!fa && !r) break;
                }
                drawBoth(); update(); rested();
            }
        });

        function newPile() {
            runner.stop();
            stopSweep();
            A = newSide();
            B = newSide();
            const c = ((N / 2) | 0) * N + ((N / 2) | 0);
            A.h[c] = CHIPS;
            B.h[c] = CHIPS;
            rounds = 0; firesA = 0; firesB = 0; maxCheb = 0;
            view = 'rings';
            syncViewBtn();
            elVerdict.textContent = '—';
            elRings.textContent = '—';
            note.textContent = 'ready';
            drawBoth(); update();
        }

        $$('[data-race]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const a = btn.dataset.race;
                if (a === 'reset') { newPile(); return; }
                if (a === 'view') {
                    if (runner.running()) return;
                    stopSweep();
                    view = view === 'rings' ? 'result' : 'rings';
                    syncViewBtn();
                    drawBoth();
                    return;
                }
                newPile();
                runner.slow(14);
                runner.start();
            });
        });

        newPile();
        runner.start();
        return { pause: function () { runner.stop(); stopSweep(); } };
    };

    /* ---------------- Plate III — the pour, and one more grain ---------------- */

    makers.pile = function () {
        const canvas = $('#p3-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const frames = [];
        let manifest = null, layer = 'heights', fit = 'frame', mode = 'plates';
        let pageAwake = true;
        let idx = 0, zoom = 1, panX = 0, panY = 0, maxPx = 1;
        const layerImg = {};

        const scrub = $('#p3-scrub'), elN = $('#p3-n'), elMag = $('#p3-mag'),
              note = $('#p3-note'), layerNote = $('#p3-layer-note'),
              elRadius = $('#p3-radius'), elRatio = $('#p3-ratio'),
              elTop = $('#p3-ava-top'), elSites = $('#p3-ava-sites'),
              elRounds = $('#p3-ava-rounds'), avaNote = $('#p3-ava-note');

        const LAYER_TEXT = {
            heights: 'How many grains each square was left holding: nought, one, two or three.',
            odometer: 'How many times each square fired, less the average at its distance from the centre — rose more than its ring, cyan fewer, on a rank scale; the thin lines are level sets of the count itself.'
        };
        let uiPace = 'grow', uiView = 'follow', uiPaused = false;
        let focusX = null, focusY = null;

        function draw() {
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, W);
            let img = null, natural = maxPx, base = 1;
            if (mode === 'ava' && ava) {
                img = ava.canvas; natural = ava.P;
            } else if (layer === 'heights') {
                const f = frames[idx];
                if (!f || !f.img) return;
                img = f.img; natural = f.px;
                if (fit === 'grow') base = natural / maxPx;
            } else {
                img = layerImg[layer];
                if (!img) return;
                natural = img.naturalWidth;
            }
            const size = W * base * zoom;
            const x = (W - size) / 2 + panX * zoom;
            const y = (W - size) / 2 + panY * zoom;
            ctx.imageSmoothingEnabled = size / natural < 1.05;
            ctx.drawImage(img, x, y, size, size);
            elMag.textContent = (Math.round(zoom * 10) / 10) + '×';
            if (mode !== 'ava') note.textContent = uiView === 'follow' ? 'Follow' : 'Whole';
        }

        function update() {
            const f = manifest && manifest.frames[idx];
            if (!f) return;
            elN.textContent = nf.format(f.n);
            /* the baked plates carry one site per pixel with a one-site pad,
               so the support radius is read straight off the frame size */
            const r = Math.max(0, (f.px - 3) / 2);
            if (elRadius) elRadius.textContent = nf.format(r) + (r === 1 ? ' site' : ' sites');
            if (elRatio) elRatio.textContent = f.n > 1 ? (r / Math.sqrt(f.n)).toFixed(3) : '—';
        }

        /* -------- the pour: the baked ladder, replayed on a log clock ------
           Consecutive plates multiply n by about 1.4, so a fixed tick is
           constant proportional growth: the right clock for a sqrt(n) radius.
           There is no front and nothing accumulates from plate to plate,
           because consecutive plates are different piles: the convergence is
           weak-*, and the interior really does rearrange wholesale. The run
           halts where the bake halted. */
        const pour = paced({
            watch: 1 << 30, every: 320,
            tick: function () {
                if (!manifest) return true;
                if (idx >= manifest.frames.length - 1) {
                    note.textContent = 'Done · ' + nf.format(manifest.frames[idx].n);
                    return false;
                }
                if (!frames[idx + 1] || !frames[idx + 1].img) return true;  /* still loading */
                idx++;
                scrub.value = String(idx);
                update(); draw();
                return true;
            },
            frame: function () { return false; },
            finish: function () {
                if (!manifest) return;
                idx = manifest.frames.length - 1;
                scrub.value = String(idx);
                update(); draw();
            }
        });

        function setLayer(name) {
            layer = name;
            mode = 'plates';
            layerNote.textContent = LAYER_TEXT[name];
            $$('[data-p3-layer]').forEach(function (b) {
                b.setAttribute('aria-pressed', String(b.dataset.p3Layer === name));
            });
            scrub.disabled = name !== 'heights';
            scrub.style.opacity = name === 'heights' ? '' : '.35';
            if (name !== 'heights') {
                pour.stop();
                avaRun.stop();
                if (!layerImg[name]) {
                    loadImage('plates/p3-' + name + '-void.png')
                        .then(function (img) { layerImg[name] = img; draw(); })
                        .catch(function () { layerNote.textContent = 'This view is not available.'; });
                }
            }
            draw();
        }

        /* -------- one more grain, stabilised here ---------------------------
           The heights are decoded from the finished plate itself (four flat
           colours, one site per pixel), one grain is added, and the cascade
           runs in synchronous rounds in this tab. The record is write-once:
           a square joins a ring the first time it topples -- ring k is the
           k-th cohort of 2,000 squares -- rose and cyan by turns, and is
           never repainted. Paper-white marks the squares about to fire. */
        let ava = null, avaSites = null;
        const RINGK = 2000;
        const AVA_ROSE = [142, 66, 87], AVA_CYAN = [168, 216, 232], AVA_WHITE = [246, 241, 230];

        function buildAva() {
            const last = manifest && manifest.frames.length - 1;
            const f = manifest && frames[last];
            if (!f || !f.img) return null;
            const P = f.px, PAD = 80, L = P + 2 * PAD;
            const dec = document.createElement('canvas');
            dec.width = dec.height = P;
            const dctx = dec.getContext('2d', { willReadFrequently: true });
            dctx.drawImage(f.img, 0, 0);
            const px = dctx.getImageData(0, 0, P, P).data;
            /* nearest of the four plate colours, so a colour-managed browser
               that returns slightly perturbed pixels still decodes exactly */
            const LUT = [[21, 19, 26], [74, 74, 94], [142, 66, 87], [168, 216, 232]];
            const h0 = new Int8Array(L * L);
            const inPile = new Uint8Array(L * L);
            for (let y = 0; y < P; y++) {
                for (let x = 0; x < P; x++) {
                    const p = (y * P + x) * 4;
                    if (px[p + 3] < 128) continue;
                    const li = (y + PAD) * L + (x + PAD);
                    inPile[li] = 1;
                    let best = 0, bd = 1e9;
                    for (let k = 0; k < 4; k++) {
                        const d0 = px[p] - LUT[k][0], d1 = px[p + 1] - LUT[k][1],
                              d2 = px[p + 2] - LUT[k][2];
                        const d = d0 * d0 + d1 * d1 + d2 * d2;
                        if (d < bd) { bd = d; best = k; }
                    }
                    h0[li] = best;
                }
            }
            const rc = document.createElement('canvas');
            rc.width = rc.height = P;
            const rctx = rc.getContext('2d');
            return { P: P, PAD: PAD, L: L, h0: h0, h: new Int8Array(L * L),
                     inPile: inPile, mark: new Uint8Array(L * L),
                     inq: new Uint8Array(L * L), cur: [], nxt: [],
                     canvas: rc, rctx: rctx, rec: rctx.createImageData(P, P),
                     top: 0, sites: 0, rounds: 0, rpf: 2,
                     dx0: 0, dy0: 0, dx1: 0, dy1: 0 };
        }

        function avaReset() {
            ava.h.set(ava.h0);
            ava.mark.fill(0); ava.inq.fill(0);
            ava.cur.length = 0; ava.nxt.length = 0;
            ava.top = 0; ava.sites = 0; ava.rounds = 0; ava.rpf = 2;
            const d = ava.rec.data, P = ava.P, PAD = ava.PAD, L = ava.L;
            for (let y = 0; y < P; y++) {
                for (let x = 0; x < P; x++) {
                    const li = (y + PAD) * L + (x + PAD);
                    const p = (y * P + x) * 4;
                    if (ava.inPile[li]) { d[p] = 43; d[p + 1] = 44; d[p + 2] = 54; }
                    else { d[p] = 21; d[p + 1] = 19; d[p + 2] = 26; }
                    d[p + 3] = 255;
                }
            }
            ava.rctx.putImageData(ava.rec, 0, 0);
            ava.dx0 = P; ava.dy0 = P; ava.dx1 = 0; ava.dy1 = 0;
        }

        function setPix(li, c) {
            const L = ava.L, PAD = ava.PAD, P = ava.P;
            const x = li % L - PAD, y = (li / L | 0) - PAD;
            if (x < 0 || y < 0 || x >= P || y >= P) return;
            const p = (y * P + x) * 4;
            ava.rec.data[p] = c[0]; ava.rec.data[p + 1] = c[1]; ava.rec.data[p + 2] = c[2];
            if (x < ava.dx0) ava.dx0 = x;
            if (x > ava.dx1) ava.dx1 = x;
            if (y < ava.dy0) ava.dy0 = y;
            if (y > ava.dy1) ava.dy1 = y;
        }

        function cascadeRound() {
            const cur = ava.cur, nxt = ava.nxt, h = ava.h, inq = ava.inq,
                  mark = ava.mark, L = ava.L;
            if (!cur.length) return false;
            ava.rounds++;
            for (let k = 0; k < cur.length; k++) {         /* fire, once each */
                const i = cur[k];
                inq[i] = 0;
                h[i] -= 4;
                h[i - 1]++; h[i + 1]++; h[i - L]++; h[i + L]++;
                ava.top++;
                if (!mark[i]) {
                    mark[i] = ((ava.sites / RINGK | 0) & 1) ? 2 : 1;
                    ava.sites++;
                }
            }
            for (let k = 0; k < cur.length; k++) {         /* queue the next round */
                const i = cur[k];
                for (let q = 0; q < 5; q++) {
                    const j = q === 0 ? i : (q === 1 ? i - 1 : (q === 2 ? i + 1 : (q === 3 ? i - L : i + L)));
                    if (h[j] >= 4 && !inq[j]) {
                        inq[j] = 1;
                        nxt.push(j);
                        setPix(j, AVA_WHITE);              /* the front */
                    }
                }
            }
            for (let k = 0; k < cur.length; k++) {         /* retire into the record */
                const i = cur[k];
                if (!inq[i]) setPix(i, mark[i] === 2 ? AVA_CYAN : AVA_ROSE);
            }
            ava.cur = nxt;
            ava.nxt = cur;
            cur.length = 0;
            return true;
        }

        function avaDraw() {
            if (ava.dx1 >= ava.dx0) {
                ava.rctx.putImageData(ava.rec, 0, 0,
                    ava.dx0, ava.dy0, ava.dx1 - ava.dx0 + 1, ava.dy1 - ava.dy0 + 1);
            }
            draw();
            elTop.textContent = nf.format(ava.top);
            elSites.textContent = nf.format(ava.sites);
            elRounds.textContent = nf.format(ava.rounds);
        }

        function avaDone() {
            note.textContent = 'Stable';
            avaNote.textContent = ava.top
                ? 'settled: ' + nf.format(ava.top) + ' topplings over '
                  + nf.format(ava.sites) + ' squares in ' + nf.format(ava.rounds)
                  + ' rounds — ' + nf.format((Math.max(0, ava.sites - 1) / RINGK | 0) + 1) + ' rings'
                : 'the grain sat where it fell: no square fired';
        }

        const avaRun = paced({
            watch: 8, every: 300,
            tick: function () {
                if (!cascadeRound()) { avaDraw(); avaDone(); return false; }
                avaDraw();
                return true;
            },
            frame: function () {
                const t0 = ava.top;
                let r = 0;
                while (r < ava.rpf && ava.top - t0 < 60000) {
                    if (!cascadeRound()) { avaDraw(); avaDone(); return false; }
                    r++;
                }
                ava.rpf = Math.min(400, ava.rpf * 1.05);
                avaDraw();
                return true;
            },
            finish: function () {
                let guard = 0;
                while (cascadeRound() && guard++ < 200000) { }
                avaDraw(); avaDone();
            }
        });

        function dropGrain(x, y) {                 /* plate coordinates */
            if (!ava) return;
            pour.stop();
            avaRun.stop();
            mode = 'ava';
            scrub.disabled = true;
            scrub.style.opacity = '.35';
            avaReset();
            const li = (y + ava.PAD) * ava.L + (x + ava.PAD);
            ava.h[li]++;
            note.textContent = 'Grain · (' + (x - (ava.P - 1) / 2) + ', '
                + ((ava.P - 1) / 2 - y) + ')';
            if (ava.h[li] >= 4) {
                ava.inq[li] = 1;
                ava.cur.push(li);
                setPix(li, AVA_WHITE);
                avaDraw();
                avaNote.textContent = 'legal topplings in progress';
                avaRun.slow(8);
                avaRun.start();
            } else {
                avaDraw();
                elTop.textContent = '0';
                elSites.textContent = '0';
                elRounds.textContent = '0';
                avaNote.textContent = 'no toppling: the added grain remains at its site';
            }
        }

        function ensureAva() {
            if (!ava) ava = buildAva();
            return !!ava;
        }

        $$('[data-p3-ava]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ensureAva()) return;
                const a = b.dataset.p3Ava;
                if (a === 'largest' && avaSites && avaSites.sites.length) {
                    dropGrain(avaSites.sites[0].x, avaSites.sites[0].y);
                } else {
                    /* height-three squares make up 49 per cent of the pile */
                    let x, y, guard = 0;
                    do {
                        x = (Math.random() * ava.P) | 0;
                        y = (Math.random() * ava.P) | 0;
                    } while (ava.h0[(y + ava.PAD) * ava.L + (x + ava.PAD)] !== 3 && guard++ < 10000);
                    dropGrain(x, y);
                }
            });
        });

        fetch('plates/p3-avalanche-sites.json')
            .then(function (r) { return r.json(); })
            .then(function (m) { avaSites = m; })
            .catch(function () { avaSites = null; });

        fetch('plates/p3-growth.json').then(function (r) { return r.json(); }).then(function (m) {
            manifest = m;
            maxPx = m.frames[m.frames.length - 1].px;
            scrub.max = String(m.frames.length - 1);
            scrub.value = String(m.frames.length - 1);
            idx = m.frames.length - 1;
            m.frames.forEach(function (f, i) { frames[i] = { n: f.n, px: f.px, img: null }; });
            /* the finished plate first, so the instrument is usable at once */
            loadImage('plates/' + m.frames[idx].file).then(function (img) {
                frames[idx].img = img;
                update(); draw();
                m.frames.forEach(function (f, i) {
                    if (frames[i].img) return;
                    loadImage('plates/' + f.file).then(function (im) {
                        frames[i].img = im;
                        if (i === idx) { update(); draw(); }
                    }).catch(function () {});
                });
                /* then the pour, from one grain */
                idx = 0;
                scrub.value = '0';
                update();
                if (pageAwake && !uiPaused && !REDUCED) pour.start();
                else draw();
            });
        }).catch(function () { note.textContent = 'The plate could not be loaded.'; });

        scrub.addEventListener('input', function () {
            pour.stop();
            mode = 'plates';
            idx = parseInt(scrub.value, 10);
            update(); draw();
        });

        $$('[data-p3-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                avaRun.stop();
                pour.stop();
                mode = 'plates';
                if (layer !== 'heights') setLayer('heights');
                scrub.disabled = false;
                scrub.style.opacity = '';
                idx = 0;
                scrub.value = '0';
                update(); draw();
                pour.start();
            });
        });

        $$('[data-p3-fit]').forEach(function (b) {
            b.addEventListener('click', function () {
                fit = b.dataset.p3Fit;
                $$('[data-p3-fit]').forEach(function (o) {
                    o.setAttribute('aria-pressed', String(o.dataset.p3Fit === fit));
                });
                draw();
            });
        });

        $$('[data-p3-layer]').forEach(function (b) {
            b.addEventListener('click', function () { pour.stop(); avaRun.stop(); setLayer(b.dataset.p3Layer); });
        });

        function setZoom(z, cx, cy) {
            const prev = zoom;
            zoom = Math.min(24, Math.max(1, z));
            if (cx !== undefined) {
                const k = 1 / prev - 1 / zoom;
                panX -= (cx - canvas.width / 2) * k;
                panY -= (cy - canvas.width / 2) * k;
            }
            if (zoom === 1) { panX = 0; panY = 0; }
            draw();
        }

        $$('[data-p3-zoom]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.p3Zoom;
                if (a === 'reset') { zoom = 1; panX = 0; panY = 0; draw(); }
                else setZoom(a === 'in' ? zoom * 1.8 : zoom / 1.8);
            });
        });

        canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            const r = canvas.getBoundingClientRect();
            const cx = (e.clientX - r.left) / r.width * canvas.width;
            const cy = (e.clientY - r.top) / r.height * canvas.width;
            setZoom(zoom * (e.deltaY < 0 ? 1.16 : 1 / 1.16), cx, cy);
        }, { passive: false });

        let dragging = false, lx = 0, ly = 0, downX = 0, downY = 0;
        canvas.addEventListener('pointerdown', function (e) {
            downX = e.clientX; downY = e.clientY;
            if (zoom <= 1) return;
            dragging = true; lx = e.clientX; ly = e.clientY;
            canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            const r = canvas.getBoundingClientRect();
            panX += (e.clientX - lx) / r.width * canvas.width / zoom;
            panY += (e.clientY - ly) / r.width * canvas.width / zoom;
            lx = e.clientX; ly = e.clientY;
            draw();
        });
        canvas.addEventListener('pointerup', function () { dragging = false; });
        canvas.addEventListener('pointercancel', function () { dragging = false; });

        /* in the cascade view a click drops the grain yourself */
        canvas.addEventListener('click', function (e) {
            if (mode !== 'ava' || !ava) return;
            if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) return;
            const r = canvas.getBoundingClientRect();
            const cx = (e.clientX - r.left) / r.width * W;
            const cy = (e.clientY - r.top) / r.height * W;
            const size = W * zoom;
            const ox = (W - size) / 2 + panX * zoom;
            const oy = (W - size) / 2 + panY * zoom;
            const x = Math.floor((cx - ox) / size * ava.P);
            const y = Math.floor((cy - oy) / size * ava.P);
            if (x < 0 || y < 0 || x >= ava.P || y >= ava.P) return;
            dropGrain(x, y);
        });

        function syncSpControls() {
            $$('[data-sp-pace]').forEach(function (b) {
                const on = b.dataset.spPace === uiPace;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-sp-view]').forEach(function (b) {
                const on = b.dataset.spView === uiView;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', String(on));
            });
            const pause = $('[data-sp-run="pause"]');
            if (pause) {
                pause.textContent = REDUCED ? 'Paused' : (uiPaused ? 'Resume' : 'Pause');
                pause.classList.toggle('is-on', !uiPaused);
                pause.disabled = REDUCED;
            }
        }

        function applySpView() {
            if (mode !== 'ava') {
                fit = uiView === 'follow' ? 'frame' : 'grow';
                zoom = 1; panX = 0; panY = 0; draw(); return;
            }
            if (uiView === 'whole' || !ava || focusX === null) {
                zoom = 1; panX = 0; panY = 0; draw(); return;
            }
            zoom = canvas.getBoundingClientRect().width <= 500 ? 9 : 12;
            panX = -W * ((focusX + .5) / ava.P - .5);
            panY = -W * ((focusY + .5) / ava.P - .5);
            draw();
        }

        function watchSite() {
            if (!ava) return null;
            let bx = 0, by = 0, bd = Infinity;
            const mid = (ava.P - 1) / 2;
            for (let y = 0; y < ava.P; y++) {
                for (let x = 0; x < ava.P; x++) {
                    if (ava.h0[(y + ava.PAD) * ava.L + (x + ava.PAD)] !== 3) continue;
                    const d = Math.hypot(x - mid, y - mid);
                    if (d < bd) { bd = d; bx = x; by = y; }
                }
            }
            return [bx, by];
        }

        function startWatch(run) {
            if (!ensureAva()) { note.textContent = 'Loading'; return; }
            uiPace = 'watch'; uiPaused = !run;
            /* Use the audited largest-avalanche witness when it is ready.
               A nearest height-three site usually fires only five squares,
               which is correct but makes the cascade mechanism invisible. */
            const q = avaSites && avaSites.sites && avaSites.sites.length
                ? [avaSites.sites[0].x, avaSites.sites[0].y]
                : watchSite();
            if (!q) { note.textContent = 'No unstable site'; syncSpControls(); return; }
            focusX = q[0]; focusY = q[1];
            dropGrain(q[0], q[1]);
            if (!run) avaRun.stop();
            applySpView(); syncSpControls();
        }

        function startGrow(run) {
            avaRun.stop(); pour.stop();
            uiPace = 'grow'; uiPaused = !run;
            mode = 'plates'; layer = 'heights'; zoom = 1; panX = panY = 0;
            fit = uiView === 'follow' ? 'frame' : 'grow';
            idx = 0; scrub.value = '0'; scrub.disabled = false; scrub.style.opacity = '';
            update(); draw();
            if (run) { pour.slow(1 << 30); pour.start(); }
            note.textContent = run ? 'Grow' : 'Paused';
            syncSpControls();
        }

        $$('[data-sp-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                const run = !uiPaused && !REDUCED;
                if (b.dataset.spPace === 'watch') startWatch(run);
                else startGrow(run);
            });
        });
        $$('[data-sp-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                uiView = b.dataset.spView; applySpView(); syncSpControls();
            });
        });
        $$('[data-sp-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const action = b.dataset.spRun;
                if (action === 'pause') {
                    if (uiPaused) {
                        uiPaused = false;
                        if (uiPace === 'watch') avaRun.start(); else pour.start();
                    } else {
                        uiPaused = true; avaRun.stop(); pour.stop(); note.textContent = 'Paused';
                    }
                } else if (action === 'step') {
                    uiPaused = true; avaRun.stop(); pour.stop();
                    if (uiPace === 'watch') {
                        if (!ava || mode !== 'ava') startWatch(false);
                        else if (cascadeRound()) { avaDraw(); note.textContent = 'Topple'; }
                        else avaDone();
                    } else if (manifest && idx < frames.length - 1 && frames[idx + 1].img) {
                        idx++; scrub.value = String(idx); update(); draw(); note.textContent = 'Grow';
                    }
                } else if (action === 'reset') {
                    if (uiPace === 'watch') startWatch(!REDUCED); else startGrow(!REDUCED);
                }
                syncSpControls();
            });
        });

        setLayer('heights');
        syncSpControls();
        return {
            pause: function () { pageAwake = false; pour.stop(); avaRun.stop(); },
            resume: function () {
                pageAwake = true;
                if (uiPaused || REDUCED) return;
                if (uiPace === 'watch') avaRun.start(); else pour.start();
            }
        };
    };

    /* ---------------- Plate IV — the packing ---------------- */

    /* The Apollonian BAND packing: two parallel walls, the chain of unit
       circles wedged between them, and every circle the Descartes rule then
       forces. A band and not a bounded packing because the object it stands
       for — the sandpile's fractal structure on all of Z² — has no outer
       circle to be bounded by; the band is what Levine, Pegden and Smart's
       Apollonian triangulation is read off.

       Circles AND walls are carried in augmented curvature-centre coordinates

              W = (b̄, b, b·x, b·y),     b = 1/r,   b̄ = b·|z|² − r,

       a wall {⟨z,n⟩ = d} with n pointing OUT of the band as (2d, 0, nx, ny).
       Descartes reflection is linear in these four numbers,

              W' = 2(W_b + W_c + W_d) − W_a,

       so a wall recurses as an ordinary object. The curvature-centre triple
       (b, bx, by) used for a bounded packing cannot do this: a wall has b = 0,
       its triple is (0,0,0), and the wall is simply forgotten.

       The sign convention is not cosmetic. Both normals pointing inward makes
       the reflection return the solution belonging to the OPPOSITE gap — the
       top gap's child lands at y = −0.75 instead of +0.75 — and the whole
       recursion then builds the wrong half of the band. Normals point out.

       Nothing here is trusted: Q(W) = (b·x)² + (b·y)² − b·b̄ is asserted to be
       1 on every object produced, and every curvature is asserted whole. */
    makers.apollo = function () {
        const canvas = $('#apollo-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        /* Walls and circles use the same augmented curvature-centre vector.
           Descartes reflection is consequently one exact linear operation,
           including when the object being replaced is a wall. */
        function accCircle(x, y, r) {
            const b = 1 / r;
            return [b * (x * x + y * y) - r, b, b * x, b * y];
        }
        function accWall(nx, ny, d) { return [2 * d, 0, nx, ny]; }
        function refl(a, b, c, d) {
            return [2 * (b[0] + c[0] + d[0]) - a[0],
                    2 * (b[1] + c[1] + d[1]) - a[1],
                    2 * (b[2] + c[2] + d[2]) - a[2],
                    2 * (b[3] + c[3] + d[3]) - a[3]];
        }
        function form(a) { return a[2] * a[2] + a[3] * a[3] - a[1] * a[0]; }
        function isWall(a) { return Math.abs(a[1]) < 1e-9; }
        function cx(a) { return a[2] / a[1]; }
        function cy(a) { return a[3] / a[1]; }
        function radius(a) { return 1 / a[1]; }
        function curvature(a) { return isWall(a) ? 0 : Math.round(a[1]); }

        const TOP = accWall(0, 1, 1), BOT = accWall(0, -1, 1);
        const U0 = accCircle(-1, 0, 1), U1 = accCircle(1, 0, 1);
        const K4 = refl(BOT, TOP, U0, U1);
        const K9 = refl(U0, TOP, U1, K4);
        const K28 = refl(TOP, U1, K4, K9);
        const K81 = refl(U1, K4, K9, K28);
        const tour = [
            { W: K4, par: [TOP, U0, U1], other: BOT, gen: 1 },
            { W: K9, par: [TOP, U1, K4], other: U0, gen: 2 },
            { W: K28, par: [U1, K4, K9], other: TOP, gen: 3 },
            { W: K81, par: [K4, K9, K28], other: U1, gen: 4 }
        ];
        const expected = [4, 9, 28, 81];
        tour.forEach(function (c, i) {
            if (curvature(c.W) !== expected[i] || Math.abs(form(c.W) - 1) > 1e-8) {
                throw new Error('invalid Apollonian reflection tour');
            }
        });

        /* A finite, exact window of the infinite band supplies the context.
           Curvature 500 is already sub-pixel in the opening view and remains
           richly resolved at the tour's final ninefold camera scale. */
        const packing = [];
        const chain = [];
        for (let n = -6; n <= 6; n++) chain.push(accCircle(2 * n + 1, 0, 1));
        function add(a, par, gen) {
            if (Math.abs(form(a) - 1) > 1e-6 ||
                Math.abs(a[1] - Math.round(a[1])) > 1e-6) {
                throw new Error('invalid Apollonian circle');
            }
            packing.push({ W: a, par: par, gen: gen, x: cx(a), y: cy(a),
                           r: radius(a), k: Math.round(a[1]) });
        }
        function descend(a, b, c, other, gen) {
            if (packing.length >= 16000) return;
            const child = refl(other, a, b, c);
            if (child[1] <= 0 || child[1] > 500 || gen > 24) return;
            add(child, [a, b, c], gen);
            descend(child, b, c, a, gen + 1);
            descend(a, child, c, b, gen + 1);
            descend(a, b, child, c, gen + 1);
        }
        chain.forEach(function (a, i) {
            add(a, [TOP, BOT, chain[i ? i - 1 : i + 1]], 0);
            if (i + 1 < chain.length) {
                descend(TOP, a, chain[i + 1], BOT, 1);
                descend(BOT, a, chain[i + 1], TOP, 1);
            }
        });
        packing.sort(function (a, b) { return a.k - b.k; });

        const elGeneration = $('#apollo-generation'), elCurv = $('#apollo-curv'),
              elParents = $('#apollo-parents'), elWall = $('#apollo-wall'),
              elNote = $('#apollo-note');
        const cameras = [
            { x: 0, y: .32, z: 1.05 },
            { x: .14, y: .59, z: 1.85 },
            { x: .27, y: .75, z: 4.1 },
            { x: .27, y: .79, z: 9.0 }
        ];
        const homeCamera = { x: 0, y: 0, z: 1 };
        const DURATION = 3100;
        let mode = 'tour', scene = 0, phase = REDUCED ? 1 : 0, endedAt = 0;
        let selected = tour[0], scale = H / 2.55, ox = W / 2, oy = H / 2;
        let userPaused = REDUCED, running = false, raf = 0, last = 0;
        let dragging = false, lx = 0, ly = 0, moved = 0;

        function clamp01(x) { return Math.max(0, Math.min(1, x)); }
        function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
        function mix(a, b, t) { return a + (b - a) * t; }
        function baseScale() { return H / 2.55; }
        function sx(x) { return ox + x * scale; }
        function sy(y) { return oy - y * scale; }
        function sameCircle(a, b) {
            return !isWall(a) && !isWall(b) && Math.abs(a[1] - b[1]) < 1e-7 &&
                   Math.abs(cx(a) - cx(b)) < 1e-7 && Math.abs(cy(a) - cy(b)) < 1e-7;
        }
        function hasWall(c) { return c.par.some(isWall); }
        function cameraTo(c) {
            scale = baseScale() * c.z;
            ox = W * .5 - c.x * scale;
            oy = H * .52 + c.y * scale;
        }
        function tourCamera() {
            const a = scene ? cameras[scene - 1] : homeCamera;
            const b = cameras[scene];
            const t = ease(phase / .28);
            cameraTo({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });
        }

        function report(c) {
            const k = curvature(c.W);
            if (elGeneration) elGeneration.textContent = mode === 'tour'
                ? c.gen + ' / ' + tour.length : String(c.gen);
            if (elCurv) elCurv.textContent = nf.format(k);
            if (elParents) elParents.textContent = c.par.map(curvature).join(' · ');
            if (elWall) elWall.textContent = hasWall(c) ? 'yes' : 'no';
        }

        function objectPath(a, grow) {
            ctx.beginPath();
            if (isWall(a)) {
                const y = sy(a[3] > 0 ? 1 : -1);
                ctx.moveTo(0, y); ctx.lineTo(W, y);
            } else {
                ctx.arc(sx(cx(a)), sy(cy(a)), Math.abs(radius(a) * scale) * grow,
                        0, Math.PI * 2);
            }
        }
        function highlight(a, colour, width, alpha, dash, grow) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = colour;
            ctx.lineWidth = width;
            ctx.setLineDash(dash || []);
            objectPath(a, grow == null ? 1 : grow);
            ctx.stroke();
            ctx.restore();
        }

        function draw() {
            if (mode === 'tour') tourCamera();
            const focus = selected || tour[scene];
            const reveal = mode === 'tour' ? ease((phase - .28) / .32) : 1;
            ctx.fillStyle = '#08090E'; ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(255,249,232,.35)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, sy(1)); ctx.lineTo(W, sy(1));
            ctx.moveTo(0, sy(-1)); ctx.lineTo(W, sy(-1));
            ctx.stroke();

            /* faint tints of the site's own palette by curvature octave; the
               strokes carry the structure */
            const colours = ['118,103,168', '204,121,167', '86,180,233',
                             '230,159,0', '150,205,240'];
            for (let i = 0; i < packing.length; i++) {
                const c = packing[i], r = c.r * scale;
                const x = sx(c.x), y = sy(c.y);
                if (r < .55 || x + r < -3 || x - r > W + 3 ||
                    y + r < -3 || y - r > H + 3) continue;
                if (mode === 'tour' && sameCircle(c.W, focus.W)) continue;
                const rgb = colours[Math.min(colours.length - 1,
                    Math.floor(Math.log2(Math.max(1, c.k))) % colours.length)];
                if (r > 2.4) {
                    ctx.fillStyle = 'rgba(' + rgb + ',' + (r > 16 ? .09 : .05) + ')';
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
                }
                ctx.strokeStyle = 'rgba(' + rgb + ',' + (r > 5 ? .68 : .40) + ')';
                ctx.lineWidth = Math.max(1, Math.min(2.6, r * .045));
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
            }

            /* Cyan is exactly the current Descartes triple. The fading rose
               object is the member of the quadruple replaced by reflection. */
            focus.par.forEach(function (a) { highlight(a, '#A8D8E8', 4, .96, null, 1); });
            if (mode === 'tour' && reveal < .98) {
                highlight(focus.other, '#8E4257', 3, .72 * (1 - reveal), [14, 13], 1);
            }

            if (!isWall(focus.W)) {
                const x = sx(cx(focus.W)), y = sy(cy(focus.W));
                focus.par.forEach(function (a) {
                    if (isWall(a)) return;
                    const dx = cx(a) - cx(focus.W), dy = cy(a) - cy(focus.W);
                    const d = Math.hypot(dx, dy) || 1;
                    const tx = cx(focus.W) + radius(focus.W) * dx / d;
                    const ty = cy(focus.W) + radius(focus.W) * dy / d;
                    ctx.strokeStyle = 'rgba(255,248,232,.55)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(sx(tx), sy(ty)); ctx.stroke();
                });
                const rr = Math.abs(radius(focus.W) * scale) * Math.max(.04, reveal);
                ctx.save();
                ctx.fillStyle = 'rgba(240,228,66,.12)';
                ctx.strokeStyle = '#F0E442'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.restore();
            }

            if (elNote) {
                if (mode === 'explore') setNote(elNote, 'Explore \u00b7 click a circle, drag, scroll');
                else if (phase < .28) setNote(elNote, 'Three tangent parents');
                else if (phase < .67) setNote(elNote,
                    'Reflection \u03ba ' + curvature(focus.other) + ' \u2192 ' + curvature(focus.W));
                else setNote(elNote, '\u03ba = ' + curvature(focus.W));
            }
        }

        function sync() {
            $$('[data-apollo-mode]').forEach(function (b) {
                const on = b.dataset.apolloMode === mode;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-apollo-run="pause"]');
            if (play) {
                play.textContent = running ? 'Pause' : 'Play';
                play.classList.toggle('is-on', running);
                play.disabled = mode !== 'tour';
            }
            const step = $('[data-apollo-run="step"]');
            if (step) step.disabled = mode !== 'tour';
        }

        function stop(markPaused) {
            running = false; cancelAnimationFrame(raf); raf = 0; last = 0;
            if (markPaused) userPaused = true;
            sync();
        }
        function animate(now) {
            if (!running) return;
            if (!last) last = now;
            phase += Math.min(80, now - last) / DURATION;
            last = now;
            if (phase >= 1) {
                if (scene < tour.length - 1) {
                    scene++; phase = 0; selected = tour[scene]; report(selected);
                } else {
                    /* hold the last reflection, then go round again */
                    phase = 1;
                    if (!endedAt) endedAt = now;
                    if (now - endedAt > 2600) {
                        endedAt = 0; scene = 0; phase = 0; selected = tour[0]; report(selected);
                    }
                }
            }
            draw();
            raf = requestAnimationFrame(animate);
        }
        function start(markPlaying) {
            if (mode !== 'tour' || REDUCED) return;
            cancelAnimationFrame(raf);
            if (markPlaying) userPaused = false;
            running = true; last = 0; sync();
            raf = requestAnimationFrame(animate);
        }
        function replay() {
            stop(false); endedAt = 0;
            mode = 'tour'; scene = 0; phase = REDUCED ? 1 : 0;
            selected = tour[0]; userPaused = REDUCED;
            report(selected); draw(); sync();
            if (!REDUCED) start(true);
        }
        function stepOnce() {
            stop(true);
            if (phase < 1) phase = 1;
            else if (scene < tour.length - 1) { scene++; phase = 1; }
            selected = tour[scene]; report(selected); draw(); sync();
        }

        function pick(px, py) {
            let best = null;
            for (let i = 0; i < packing.length; i++) {
                const c = packing[i], r = c.r * scale;
                if (r < 4 || Math.hypot(px - sx(c.x), py - sy(c.y)) > r) continue;
                if (!best || c.r < best.r) best = c;
            }
            return best;
        }
        function zoomAt(f, px, py) {
            const wx = (px - ox) / scale, wy = (oy - py) / scale;
            scale = Math.max(baseScale() * .72, Math.min(baseScale() * 40, scale * f));
            ox = px - wx * scale; oy = py + wy * scale;
            draw();
        }

        canvas.addEventListener('wheel', function (e) {
            if (mode !== 'explore') return;
            e.preventDefault();
            const r = canvas.getBoundingClientRect();
            zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18,
                   (e.clientX - r.left) / r.width * W,
                   (e.clientY - r.top) / r.height * H);
        }, { passive: false });
        canvas.addEventListener('pointerdown', function (e) {
            if (mode !== 'explore') return;
            dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
            canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            const r = canvas.getBoundingClientRect();
            moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
            ox += (e.clientX - lx) / r.width * W;
            oy += (e.clientY - ly) / r.height * H;
            lx = e.clientX; ly = e.clientY; draw();
        });
        canvas.addEventListener('pointerup', function (e) {
            if (!dragging) return;
            dragging = false;
            if (moved > 4) return;
            const r = canvas.getBoundingClientRect();
            const c = pick((e.clientX - r.left) / r.width * W,
                           (e.clientY - r.top) / r.height * H);
            if (c) { selected = c; report(c); draw(); }
        });
        canvas.addEventListener('pointercancel', function () { dragging = false; });

        $$('[data-apollo-mode]').forEach(function (b) {
            b.addEventListener('click', function () {
                const next = b.dataset.apolloMode;
                if (next === mode) return;
                stop(true); mode = next;
                if (mode === 'tour') {
                    scene = 0; phase = REDUCED ? 1 : 0; selected = tour[0];
                    report(selected); draw();
                    if (!REDUCED) start(true);
                } else {
                    report(selected); draw(); sync();
                }
            });
        });
        $$('[data-apollo-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const action = b.dataset.apolloRun;
                if (action === 'pause') {
                    if (running) stop(true); else start(true);
                } else if (action === 'step') stepOnce();
                else replay();
            });
        });

        report(selected); draw(); sync();
        if (!REDUCED) start(true);
        return {
            pause: function () { stop(false); },
            resume: function () { draw(); if (!userPaused) start(false); }
        };
    };

    /* ---------------- Plates V and VI — swapping the board ---------------- */

    /* A swap between two stills is a discrete change of board, not a dissolve
       between unrelated pictures. Every variant is decoded when the study wakes,
       and the incoming plate fades in ON TOP of the outgoing one, so the frame
       is never empty and the scale, centre and crop never move. */
    function imageSwitcher(attr, imgId, noteId, capId, options) {
        return function () {
            const base = document.getElementById(imgId);
            const over = document.getElementById(imgId + '-over');
            if (!base || !over) return null;
            const note = document.getElementById(noteId), cap = document.getElementById(capId);
            const key = attr;
            const ready = {};
            let current = null;

            Object.keys(options).forEach(function (k) {
                loadImage(options[k].src)
                    .then(function () { ready[k] = true; })
                    .catch(function () { ready[k] = false; });
            });

            function show(k) {
                const o = options[k];
                if (!o || current === k) return;
                current = k;
                $$('[data-' + attr + ']').forEach(function (x) {
                    x.setAttribute('aria-pressed', String(x.dataset[key] === k));
                });
                /* the words change on the same frame the picture starts to */
                if (note) note.textContent = o.note;
                if (cap) cap.textContent = o.caption;

                if (REDUCED || ready[k] === false) {
                    base.src = o.src; base.alt = o.alt;
                    return;
                }
                /* Driven by the animation API rather than a CSS transition: a
                   transition started in the same task as a src change is not
                   reliably observed, and a dropped one leaves the frame blank. */
                over.getAnimations().forEach(function (an) { an.cancel(); });
                over.src = o.src;
                over.style.opacity = '0';
                const anim = over.animate([{ opacity: 0 }, { opacity: 1 }],
                                          { duration: 160, easing: 'linear', fill: 'forwards' });
                /* Settled by whichever arrives first. An animation in a hidden or
                   unfocused tab may never finish, and the swap must still land. */
                let settled = false;
                const settle = function () {
                    if (settled || current !== k) return;
                    settled = true;
                    base.src = o.src;
                    base.alt = o.alt;
                    over.getAnimations().forEach(function (an) { an.cancel(); });
                    over.style.opacity = '0';
                };
                anim.finished.then(settle).catch(function () {});
                setTimeout(settle, 220);
            }

            $$('[data-' + attr + ']').forEach(function (b2) {
                b2.addEventListener('click', function () { show(b2.dataset[key]); });
            });

            const first = $('[data-' + attr + '][aria-pressed="true"]');
            current = first ? first.dataset[key] : null;
            return {};
        };
    }

    makers.lattices = imageSwitcher('p5', 'p5-img', 'p5-note', 'p5-caption', {
        square: { src: 'plates/p5-square-hero-void.png', note: 'the square lattice',
            caption: 'Degree 4, threshold 4, stable heights 0 to 3.',
            alt: 'A sandpile on the square lattice.' },
        triangular: { src: 'plates/p5-triangular-hero-void.png', note: 'the triangular lattice',
            caption: 'Degree 6, threshold 6, stable heights 0 to 5.',
            alt: 'A sandpile on the triangular lattice.' },
        hexagonal: { src: 'plates/p5-hexagonal-hero-void.png', note: 'the honeycomb lattice',
            caption: 'Degree 3, threshold 3, stable heights 0 to 2.',
            alt: 'A sandpile on the honeycomb lattice.' },
        flattice: { src: 'plates/p5-flattice-hero-void.png', note: 'the F-lattice',
            caption: 'Out-degree 2, threshold 2, stable heights 0 and 1.',
            alt: 'A sandpile on the F-lattice.' }
    });

    /* One maker serves two panels: the compact-growth backgrounds (empty and
       random holes) and, in its own panel, the explosive background. */
    function randomBackgroundMaker(cfg) {
        const P = cfg.prefix;
        const canvas = $('#' + P + '-canvas');
        if (!canvas) return null;
        const note = $('#' + P + '-note'), outRound = $('#' + P + '-round'),
              roundLabel = $('#' + P + '-round-label'), outFired = $('#' + P + '-fired'),
              keyTitle = $('#' + P + '-key-title'), timeItems = $('#' + P + '-time-items'),
              heightItems = $('#' + P + '-height-items');
        const assets = window.galleryAssets || {};
        const plates = {
            empty: {
                final: assets.randomEmpty || 'plates/p6-deterministic-hero-void.png',
                mask: assets.randomFrontEmpty || 'plates/p6-front-empty.png',
                background: assets.randomBackgroundEmpty || 'plates/p6-background-empty.png',
                kind: 0, duration: 16000
            },
            random: {
                final: assets.randomHoles || 'plates/p6-random-hero-void.png',
                mask: assets.randomFrontHoles || 'plates/p6-front-random.png',
                background: assets.randomBackgroundHoles || 'plates/p6-background-random.png',
                kind: 1, duration: 16000
            },
            exploding: {
                final: assets.randomExploding || 'plates/p6-exploding-hero-void.png',
                mask: assets.randomFrontExploding || 'plates/p6-front-exploding.png',
                background: assets.randomBackgroundExploding || 'plates/p6-background-exploding.png',
                kind: 2, duration: 15000
            }
        };
        const metadataUrl = assets.randomFrontMetadata || 'plates/p6-fronts.json';
        let mode = cfg.mode, metadata = null, model = null, textures = [];
        let phase = REDUCED ? .88 : 0, ready = false, failed = false;
        let pageAwake = true, userPaused = REDUCED, raf = 0, lastNow = 0;
        let loadToken = 0, imageSize = 1505;

        function clamp01(x) { return Math.max(0, Math.min(1, x)); }
        function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }

        const gl = canvas.getContext('webgl', {
            alpha: false, antialias: false, depth: false,
            stencil: false, preserveDrawingBuffer: false
        }) || canvas.getContext('experimental-webgl');

        /* A static exact plate is still preferable to an invented animation
           on the rare browser where WebGL is unavailable. */
        if (!gl) {
            const ctx = canvas.getContext('2d');
            function showStatic(name) {
                mode = name; note.textContent = 'Exact computed configuration';
                loadImage(plates[name].final).then(function (img) {
                    ctx.fillStyle = '#07080D'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                });
                $$('[data-' + P + '-mode]').forEach(function (b) {
                    const on = b.getAttribute('data-' + P + '-mode') === name;
                    b.classList.toggle('is-on', on);
                    b.setAttribute('aria-pressed', String(on));
                });
            }
            $$('[data-' + P + '-mode]').forEach(function (b) {
                b.addEventListener('click', function () { showStatic(b.getAttribute('data-' + P + '-mode')); });
            });
            showStatic(mode);
            return { pause: function () {}, resume: function () {} };
        }

        const vertexSource = [
            'attribute vec2 a_position;',
            'attribute vec2 a_uv;',
            'varying vec2 v_uv;',
            'void main(){v_uv=a_uv;gl_Position=vec4(a_position,0.0,1.0);}'
        ].join('\n');
        const fragmentSource = [
            'precision highp float;',
            'varying vec2 v_uv;',
            'uniform sampler2D u_final;',
            'uniform sampler2D u_mask;',
            'uniform sampler2D u_background;',
            'uniform vec4 u_rect;',
            'uniform float u_threshold;',
            'uniform float u_band_max;',
            'uniform float u_settle;',
            'uniform float u_kind;',
            'uniform float u_bg_alpha;',
            'uniform float u_source_alpha;',
            'uniform float u_image_size;',
            'uniform float u_blackout;',
            'uniform float u_contour;',
            /* has the site at q toppled by the current sweep? */
            'float toppled(vec2 q){',
            '  float mm=floor(texture2D(u_mask,q).r*255.0+0.5);',
            '  return step(0.5,mm)*step(mm,u_threshold+0.5)*step(mm,u_band_max+0.5);',
            '}',
            'void main(){',
            '  vec2 uv=u_rect.xy+v_uv*u_rect.zw;',
            '  vec3 ground=vec3(0.040,0.044,0.064);',
            '  float b=floor(texture2D(u_background,uv).r*255.0+0.5);',
            /* The background is the ground: holes and heavy sites are read as
               tones of the same dark grey, not as a second coloured picture. */
            '  vec3 base=ground;',
            '  if(u_kind>0.5&&u_kind<1.5){',
            '    base=b<0.5?vec3(0.160,0.168,0.205):vec3(0.058,0.062,0.086);',
            '  }else if(u_kind>1.5){',
            '    base=b>2.5?vec3(0.190,0.225,0.280):vec3(0.080,0.090,0.125);',
            '  }',
            '  base=mix(ground,base,u_bg_alpha);',
            '  float m=floor(texture2D(u_mask,uv).r*255.0+0.5);',
            '  float fired=step(0.5,m)*step(m,u_threshold+0.5)*step(m,u_band_max+0.5);',
            /* The pattern itself grows: every site that has toppled by the
               current sweep shows its stable height, so the reader watches the
               final picture spread outward from the origin. A thin cream edge
               marks the sites toppling now. */
            /* the front is the one-site-thick edge of the toppled region */
            '  vec2 tx=vec2(1.0/u_image_size,0.0), ty=vec2(0.0,1.0/u_image_size);',
            '  float inside=toppled(uv+tx)*toppled(uv-tx)*toppled(uv+ty)*toppled(uv-ty);',
            '  float front=fired*(1.0-inside)*(1.0-u_settle);',
            '  vec3 colour=mix(base,texture2D(u_final,uv).rgb,fired);',
            '  float touched=step(0.5,m);',
            '  colour=mix(colour,texture2D(u_final,uv).rgb,u_settle*touched);',
            '  colour=mix(colour,vec3(0.965,0.925,0.780),front);',
            '  colour=colour+0.0*u_contour;',
            '  vec2 site=abs((uv-vec2(0.5))*u_image_size);',
            '  float source=(1.0-step(0.55,max(site.x,site.y)))*u_source_alpha;',
            '  colour=mix(colour,vec3(1.0,0.940,0.650),source);',
            '  colour=mix(colour,ground,u_blackout);',
            '  gl_FragColor=vec4(colour,1.0);',
            '}'
        ].join('\n');

        function compile(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source); gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(shader) || 'shader compilation failed');
            }
            return shader;
        }
        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) || 'shader link failed');
        }
        gl.useProgram(program);
        const vertices = new Float32Array([
            -1,-1, 0,0,  1,-1, 1,0,  -1,1, 0,1,
            -1, 1, 0,1,  1,-1, 1,0,   1,1, 1,1
        ]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const aPosition = gl.getAttribLocation(program, 'a_position');
        const aUv = gl.getAttribLocation(program, 'a_uv');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
        const uniform = {};
        ['final','mask','background','rect','threshold','band_max','settle','kind','bg_alpha',
         'source_alpha','image_size','blackout','contour'].forEach(function (name) {
            uniform[name] = gl.getUniformLocation(program, 'u_' + name);
        });
        gl.uniform1i(uniform.final, 0);
        gl.uniform1i(uniform.mask, 1);
        gl.uniform1i(uniform.background, 2);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if (gl.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        }

        function upload(image, unit) {
            const texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                          gl.UNSIGNED_BYTE, image);
            return texture;
        }
        function releaseTextures() {
            textures.forEach(function (t) { gl.deleteTexture(t); });
            textures = [];
        }

        const metadataPromise = fetch(metadataUrl).then(function (r) {
            if (!r.ok) throw new Error('random-front metadata ' + r.status);
            return r.json();
        });

        function stop() {
            if (raf) cancelAnimationFrame(raf);
            raf = 0; lastNow = 0;
        }
        function start() {
            stop();
            if (!ready || !pageAwake || userPaused || REDUCED) { sync(); return; }
            raf = requestAnimationFrame(frame); sync();
        }
        function frame(now) {
            if (!lastNow) lastNow = now;
            const dt = Math.min(50, now - lastNow); lastNow = now;
            phase += dt / plates[mode].duration;
            if (phase >= 1) phase -= Math.floor(phase);
            paint(); raf = requestAnimationFrame(frame);
        }

        function valuesAt(p) {
            const q = ease((p - .16) / .58);
            const stable = mode !== 'exploding';
            const settle = stable ? ease((p - .74) / .10) : 0;
            const camera = ease((p - .12) / .58);
            const width = Math.exp(Math.log(112) * (1 - camera) +
                                   Math.log(imageSize) * camera);
            /* the background speckle is shown while the pile grows and fades
               as it settles, so the final frame is the toppled set alone on
               the plain ground, as in the plates */
            const backgroundAlpha = ease(p / .055) * (stable ? 1 - ease((p - .70) / .10) : 1);
            const sourceAlpha = ease((p - .075) / .025) *
                                (1 - ease((p - .16) / .025));
            const blackout = ease((p - .955) / .04);
            /* the frozen contours outlive the settle by a beat, then fade */
            const contour = stable ? 1 - ease((p - .86) / .07) : 1;
            return { q: q, settle: settle, width: width,
                     backgroundAlpha: backgroundAlpha,
                     sourceAlpha: sourceAlpha, blackout: blackout, contour: contour };
        }

        function report(v, band) {
            if (!model) return;
            const times = mode === 'exploding'
                ? model.reveal_parallel_round_by_band : model.reveal_sweep_by_band;
            const counts = model.reveal_sites_by_band;
            const t = times ? times[band] : Math.round((mode === 'exploding'
                ? model.first_parallel_step_max : model.first_sweep_max) * v.q);
            const n = counts ? counts[band] : Math.round(model.fired_sites * v.q);
            if (outRound) outRound.textContent = nf.format(t || 0);
            if (outFired) outFired.textContent = nf.format(n || 0);
            if (roundLabel) roundLabel.textContent = mode === 'exploding'
                ? 'Parallel round' : 'Toppling sweep';
            if (keyTitle) keyTitle.textContent = 'Stable height';
            if (timeItems) timeItems.hidden = true;
            if (heightItems) heightItems.hidden = false;

            if (phase < .075) {
                note.textContent = mode === 'empty' ? 'Background η = 0'
                    : mode === 'random' ? 'Background η ∈ {−1, 0}'
                    : 'Background σ ∈ {2, 3}';
            } else if (phase < .16) {
                note.textContent = mode === 'exploding'
                    ? 'Add 2 grains at the origin' : 'Add 4,200,000 grains at the origin';
            } else if (v.q < .999) {
                note.textContent = 'Toppling';
            } else if (mode === 'exploding') {
                note.textContent = 'Still active at round 1,858';
            } else if (v.settle < .9) {
                note.textContent = 'Final stable heights';
            } else {
                note.textContent = 'Stable';
            }
        }

        function paint() {
            /* while a background's assets load the last picture stays up */
            if (!ready || !model) {
                note.textContent = failed ? 'Data unavailable' : 'Loading data';
                return;
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(.040, .044, .064, 1); gl.clear(gl.COLOR_BUFFER_BIT);
            const v = valuesAt(phase);
            const bandMax = model.display_band_max || 254;
            const bandFloat = Math.max(0, Math.min(bandMax, v.q * bandMax));
            const band = Math.floor(bandFloat);
            const cameraWidths = model.reveal_camera_width_by_band;
            if (cameraWidths && cameraWidths.length > band) {
                const next = Math.min(bandMax, band + 1), a = bandFloat - band;
                v.width = cameraWidths[band] * (1 - a) + cameraWidths[next] * a;
            }
            const span = v.width / imageSize;
            gl.useProgram(program);
            gl.uniform4f(uniform.rect, .5 - span / 2, .5 - span / 2, span, span);
            gl.uniform1f(uniform.threshold, band);
            gl.uniform1f(uniform.band_max, bandMax);
            gl.uniform1f(uniform.settle, v.settle);
            gl.uniform1f(uniform.kind, plates[mode].kind);
            gl.uniform1f(uniform.bg_alpha, v.backgroundAlpha);
            gl.uniform1f(uniform.source_alpha, v.sourceAlpha);
            gl.uniform1f(uniform.image_size, imageSize);
            gl.uniform1f(uniform.blackout, v.blackout);
            gl.uniform1f(uniform.contour, v.contour);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            report(v, band);
        }

        function sync() {
            $$('[data-' + P + '-mode]').forEach(function (b) {
                const on = b.getAttribute('data-' + P + '-mode') === mode;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', String(on));
                b.disabled = !ready && b.getAttribute('data-' + P + '-mode') === mode;
            });
            const play = $('[data-' + P + '-run="pause"]');
            if (play) {
                const running = !!raf && !userPaused;
                play.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                play.classList.toggle('is-on', running);
                play.setAttribute('aria-pressed', String(running));
                play.disabled = REDUCED || !ready;
            }
        }

        function select(name, replay) {
            if (!plates[name]) return;
            mode = name; phase = REDUCED ? .88 : 0; ready = false; failed = false;
            model = null; stop(); releaseTextures(); paint(); sync();
            const token = ++loadToken, plate = plates[name];
            Promise.all([
                metadataPromise,
                loadImage(plate.final), loadImage(plate.mask), loadImage(plate.background)
            ]).then(function (result) {
                if (token !== loadToken) return;
                metadata = result[0]; model = metadata.models[name];
                if (!model || result[1].width !== result[2].width ||
                    result[1].width !== result[3].width) {
                    throw new Error('random-background assets do not share a lattice');
                }
                imageSize = result[1].width;
                textures = [upload(result[1], 0), upload(result[2], 1), upload(result[3], 2)];
                ready = true;
                if (replay && !REDUCED) userPaused = false;
                paint(); sync(); start();
            }).catch(function (err) {
                if (token !== loadToken) return;
                console.warn('random background:', err);
                failed = true; paint(); sync();
            });
        }

        $$('[data-' + P + '-mode]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (b.getAttribute('data-' + P + '-mode') !== mode) select(b.getAttribute('data-' + P + '-mode'), true);
            });
        });
        $$('[data-' + P + '-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (b.getAttribute('data-' + P + '-run') === 'replay') {
                    phase = 0; userPaused = REDUCED; paint();
                    if (!REDUCED) { userPaused = false; start(); }
                } else if (raf) {
                    userPaused = true; stop(); paint(); sync();
                } else {
                    userPaused = false; start();
                }
            });
        });

        paint(); sync(); select(mode, !REDUCED);
        return {
            pause: function () { pageAwake = false; stop(); sync(); },
            resume: function () {
                pageAwake = true; paint();
                if (!userPaused) start();
            }
        };
    }
    makers.randombg = function () { return randomBackgroundMaker({ prefix: 'p6', mode: 'random' }); };
    makers.explosive = function () { return randomBackgroundMaker({ prefix: 'p6x', mode: 'exploding' }); };

    /* ---------------------------------------------------------------------
       Animated definitions

       Every model opens with one square piece of visual grammar. The loops
       share an artboard and semantic colours, but not a generic choreography:
       the verb must be unmistakable before the larger instrument begins.
       Discrete state changes happen atomically; only agents, flux and camera
       position interpolate between them. */

    const RULE_VIS = {
        paper: '#F2EDE2', ink: '#27242A', quiet: '#8E8875', grid: '#D3C9B7',
        yellow: '#A18D00', cyan: '#397F9A', cyanBright: '#0072B2',
        rose: '#8E4257', violet: '#7667A8', orange: '#C85816', green: '#007D5B',
        bone: '#C9BFA8', white: '#FFF8E8', erase: '#C94F3D', key: '#15131A'
    };

    function ruleClamp(v) { return Math.max(0, Math.min(1, v)); }
    function ruleEase(v) {
        v = ruleClamp(v);
        return v * v * (3 - 2 * v);
    }
    function ruleOut(v) {
        v = ruleClamp(v);
        return 1 - Math.pow(1 - v, 3);
    }
    function ruleMix(a, b, t) { return a + (b - a) * t; }

    function ruleBackground(ctx, W) {
        ctx.fillStyle = RULE_VIS.paper;
        ctx.fillRect(0, 0, W, W);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    /* The definition immediately above each canvas already names the rule.
       Repeating phase words and formulas inside every film made the moving
       mechanism compete with a second caption. */
    function rulePhase() {}

    function ruleGrid(ctx, W, n, top, size) {
        top = top === undefined ? W * .153 : top;
        size = size === undefined ? W * .694 : size;
        const left = (W - size) / 2, cell = size / n;
        ctx.beginPath();
        for (let q = 0; q <= n; q++) {
            const x = left + q * cell, y = top + q * cell;
            ctx.moveTo(x, top); ctx.lineTo(x, top + size);
            ctx.moveTo(left, y); ctx.lineTo(left + size, y);
        }
        ctx.strokeStyle = RULE_VIS.grid;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return { left: left, top: top, size: size, cell: cell };
    }

    function ruleArrow(ctx, cx, cy, angle, reach, color, width, halo) {
        const ux = Math.cos(angle), uy = Math.sin(angle), px = -uy, py = ux;
        const tx = cx + ux * reach, ty = cy + uy * reach;
        function path() {
            ctx.beginPath();
            ctx.moveTo(cx - ux * reach * .62, cy - uy * reach * .62);
            ctx.lineTo(tx, ty);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * reach * .36 + px * reach * .23,
                       ty - uy * reach * .36 + py * reach * .23);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * reach * .36 - px * reach * .23,
                       ty - uy * reach * .36 - py * reach * .23);
        }
        if (halo) {
            path(); ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = width + halo; ctx.stroke();
        }
        path(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    }

    function ruleBiArrow(ctx, cx, cy, vertical, reach, color, width) {
        ruleArrow(ctx, cx, cy, vertical ? Math.PI / 2 : 0, reach, color, width);
        ruleArrow(ctx, cx, cy, vertical ? -Math.PI / 2 : Math.PI, reach, color, width);
    }

    /* A particle is a small disc with a hairline, not a badge: the old five-
       pixel outline was the heaviest stroke in every rule figure. */
    function ruleParticle(ctx, x, y, r, fill) {
        r = Math.max(6.5, r * .8);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill || RULE_VIS.white; ctx.fill();
        ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = Math.max(2.2, r * .18); ctx.stroke();
    }

    function rulePathPoint(points, t) {
        const lens = [], total = points.slice(1).reduce(function (sum, p, i) {
            const d = Math.hypot(p[0] - points[i][0], p[1] - points[i][1]);
            lens.push(d); return sum + d;
        }, 0);
        let target = ruleClamp(t) * total;
        for (let i = 0; i < lens.length; i++) {
            if (target <= lens[i]) {
                const u = lens[i] ? target / lens[i] : 0;
                return { x: ruleMix(points[i][0], points[i + 1][0], u),
                         y: ruleMix(points[i][1], points[i + 1][1], u), index: i, u: u };
            }
            target -= lens[i];
        }
        return { x: points[points.length - 1][0], y: points[points.length - 1][1],
                 index: points.length - 2, u: 1 };
    }

    function ruleTrace(ctx, points, pos, color, width) {
        width = Math.min(width, 3.2);
        ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i <= pos.index; i++) ctx.lineTo(points[i][0], points[i][1]);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = 'rgba(21,19,26,.45)'; ctx.lineWidth = width + 2; ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    }

    function loopingRule(id, duration, painter, still) {
        const canvas = $('#rule-' + id);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, LOGICAL = 720;
        let raf = null, elapsed = 0, lastNow = 0, running = false;

        function draw(p) {
            /* Rule diagrams are authored on a 720-square logical stage. Their
               backing store is 3x the displayed width for mobile Retina, so
               scale the whole drawing rather than shrinking every fixed
               stroke, label and particle when the backing resolution rises. */
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, W, W);
            const q = W / LOGICAL;
            ctx.save(); ctx.scale(q, q);
            ruleBackground(ctx, LOGICAL);
            painter(ctx, LOGICAL, ruleClamp(p));
            ctx.restore();
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            /* Rule animations also lag after a dropped/offscreen frame. A
               browser stall must not seek past the mechanism being shown. */
            const dt = Math.min(14, Math.max(0, now - lastNow));
            lastNow = now; elapsed = (elapsed + dt) % duration;
            draw(elapsed / duration);
            raf = requestAnimationFrame(frame);
        }
        function pause() {
            running = false;
            if (raf !== null) cancelAnimationFrame(raf);
            raf = null; lastNow = 0;
        }
        function resume() {
            if (REDUCED || running) return;
            running = true; lastNow = 0; raf = requestAnimationFrame(frame);
        }
        draw(REDUCED ? (still === undefined ? .88 : still) : 0);
        if (!REDUCED) resume();
        return { pause: pause, resume: resume };
    }

    /* What the theorem is about, before any pile is drawn: a cube, its central
       plane lifted out, and the square that plane turns out to follow. No
       toppling here -- the mechanism film next to the definition names the
       objects; the instrument below runs them. */
    /* The rule itself, in both dimensions at once: a site holding its own
       threshold fires, and sends one grain along every edge. Six edges in the
       cube, four in the square. The two fire together because the instrument
       below is about exactly that comparison; nothing here is a slice or a
       theorem, only what one site does. */
    makers.dimredintro = function () {
        return loopingRule('dimensional-reduction', 5200, function (ctx, W, p) {
            const fire = ruleEase(ruleClamp((p - .42) / .30));
            const fill = ruleEase(ruleClamp(p / .34));
            const D3 = [[52,26],[-52,-26],[-52,26],[52,-26],[0,-60],[0,60]];
            const D2 = [[62,0],[-62,0],[0,62],[0,-62]];

            function site(cx, cy, dirs, n) {
                /* the edges, then the grains leaving along them */
                ctx.strokeStyle = RULE_VIS.grid;
                ctx.lineWidth = 4;
                dirs.forEach(function (d) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + d[0] * 1.55, cy + d[1] * 1.55);
                    ctx.stroke();
                });
                dirs.forEach(function (d) {
                    ctx.beginPath();
                    ctx.arc(cx + d[0] * 1.55, cy + d[1] * 1.55, 15, 0, Math.PI * 2);
                    ctx.fillStyle = RULE_VIS.paper;
                    ctx.fill();
                    ctx.strokeStyle = RULE_VIS.grid;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                });
                if (fire > 0) {
                    dirs.forEach(function (d) {
                        ctx.beginPath();
                        ctx.arc(cx + d[0] * 1.55 * fire, cy + d[1] * 1.55 * fire, 9, 0, Math.PI * 2);
                        ctx.fillStyle = RULE_VIS.cyanBright;
                        ctx.fill();
                    });
                }
                const held = fire > .04 ? 0 : Math.round(n * fill);
                ctx.beginPath();
                ctx.arc(cx, cy, 40, 0, Math.PI * 2);
                ctx.fillStyle = held >= n ? 'rgba(57,127,154,.20)' : 'rgba(211,201,183,.35)';
                ctx.fill();
                ctx.strokeStyle = held >= n ? RULE_VIS.cyanBright : RULE_VIS.quiet;
                ctx.lineWidth = held >= n ? 6 : 4;
                ctx.stroke();
                ctx.fillStyle = RULE_VIS.ink;
                ctx.font = '600 40px "IBM Plex Mono", ui-monospace, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(held), cx, cy + 2);
            }

            site(224, 360, D3, 6);
            site(520, 360, D2, 4);
        }, .30);
    };
    makers.cylinderintro = function () {
        const walk = [[4,0],[4,-1],[5,-1],[5,0],[5,1],
                      [6,1],[6,2],[7,2],[7,3],[7,4]];
        return loopingRule('idla-cylinder', 6200, function (ctx, W, p) {
            const n = 14, left = 62, right = W - 62, cell = (right-left)/n;
            const base = 568, top = 154, bottom = 650;
            const heights = [2,2,3,3,2,2,3,3,4,3,2,3,2,2];
            const colours = ['#397F9A','#557CB4','#7667A8','#9A5F91','#C36A72','#D88A3A'];
            function sx(x) { return left + (x + .5) * cell; }
            function sy(y) { return base - (y + .5) * cell; }

            /* R_0: every layer at height at most zero is already occupied. */
            ctx.fillStyle = '#27242D';
            ctx.fillRect(left, sy(0)-cell/2, right-left, bottom-(sy(0)-cell/2));
            ctx.strokeStyle = 'rgba(110,103,122,.28)'; ctx.lineWidth = 1.5;
            for (let x = 0; x <= n; x++) {
                const xx = left + x*cell;
                ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, bottom); ctx.stroke();
            }
            for (let y = -2; y <= 7; y++) {
                const yy = sy(y)-cell/2;
                ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(right, yy); ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(0,114,178,.48)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom);
            ctx.moveTo(right, top); ctx.lineTo(right, bottom); ctx.stroke();
            ctx.strokeStyle = 'rgba(240,228,188,.64)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(left, sy(0)-cell/2);
            ctx.lineTo(right, sy(0)-cell/2); ctx.stroke();

            for (let x = 0; x < n; x++) for (let y = 1; y <= heights[x]; y++) {
                ctx.fillStyle = colours[Math.min(colours.length-1, y-1 + (x%3))];
                ctx.fillRect(sx(x)-cell*.43, sy(y)-cell*.43, cell*.86, cell*.86);
            }

            /* Uniform source layer: one of the equally marked sites is selected. */
            for (let x = 0; x < n; x++) {
                ctx.beginPath(); ctx.arc(sx(x), sy(0), 4.5, 0, Math.PI*2);
                ctx.fillStyle = x === walk[0][0] ? '#FFF8E8' : 'rgba(255,248,232,.42)';
                ctx.fill();
            }

            const points = walk.map(function (q) { return [sx(q[0]), sy(q[1])]; });
            const travel = ruleEase((p-.14)/.68), pos = rulePathPoint(points, travel);
            if (p >= .10) ruleTrace(ctx, points, pos, '#0072B2', 4);

            const settle = ruleEase((p-.82)/.10);
            if (settle > 0) {
                ctx.globalAlpha = settle; ctx.fillStyle = '#F0E442';
                ctx.fillRect(sx(7)-cell*.43, sy(4)-cell*.43, cell*.86, cell*.86);
                ctx.globalAlpha = 1;
            }
            if (p < .90) ruleParticle(ctx, pos.x, pos.y, 12, '#FFF8E8');
        }, .91);
    };

    makers.longrangeintro = function () {
        const pts = [[126,472],[164,444],[204,464],[244,424],[280,449],
                     [322,410],[360,432],[548,212],[584,246],[616,220]];
        return loopingRule('long-range-walk', 5400, function (ctx, W, p) {
            /* the lattice the jumps are between, visible */
            ctx.fillStyle = '#B9B3A4';
            for (let y = 96; y < 630; y += 34) for (let x = 92; x < 640; x += 34) {
                ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
            }
            const u = ruleEase((p - .06) / .79) * (pts.length - 1);
            const leg = Math.min(pts.length - 2, Math.floor(u));
            const f = u - leg;
            for (let i = 0; i <= leg; i++) {
                const q = i < leg ? 1 : f;
                const a = pts[i], b = pts[i + 1];
                const age = Math.max(0, (leg - i) / 7);
                const r = Math.round(ruleMix(230, 86, age));
                const g = Math.round(ruleMix(159, 180, age));
                const bl = Math.round(ruleMix(0, 233, age));
                const long = Math.hypot(b[0] - a[0], b[1] - a[1]) > 100;
                ctx.beginPath(); ctx.moveTo(a[0], a[1]);
                ctx.lineTo(ruleMix(a[0], b[0], q), ruleMix(a[1], b[1], q));
                ctx.strokeStyle = (i === leg && long) ? '#F0E442'
                    : 'rgb(' + r + ',' + g + ',' + bl + ')';
                ctx.lineWidth = long ? 4 : 2.6; ctx.stroke();
            }
            const a = pts[leg], b = pts[leg + 1];
            ruleParticle(ctx, ruleMix(a[0], b[0], f), ruleMix(a[1], b[1], f),
                         13, '#FFF8E8');
        }, .89);
    };

    makers.sandpileintro = function () {
        const n = 7, centre = 3;
        const base = new Int8Array(n * n);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
            base[y * n + x] = (x * 2 + y * 3 + x * y) & 3;
        base[centre * n + centre] = 3;
        const neighbours = [[centre, centre - 1], [centre + 1, centre],
                            [centre, centre + 1], [centre - 1, centre]];
        return loopingRule('sandpile', 6000, function (ctx, W, p) {
            const phase = p < .16 ? 'SET' : p < .30 ? 'ADD' : p < .56 ? 'FIRE'
                        : p < .74 ? 'RECEIVE' : 'STABLE';
            rulePhase(ctx, W, phase, p < .38 ? '3 + 1' : p < .68 ? '4 → 0' : 'N E S W  +1');
            const g = ruleGrid(ctx, W, n);
            const addDone = p >= .26, fired = p >= .38, received = p >= .68;
            const colors = ['#E8E0D0', '#BFD8D8', '#C99AAC', '#B8AF97'];
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                let v = base[y * n + x];
                if (x === centre && y === centre) v = !addDone ? 3 : (!fired ? 4 : 0);
                if (received && neighbours.some(function (q) { return q[0] === x && q[1] === y; })) v++;
                const sx = g.left + x * g.cell, sy = g.top + y * g.cell;
                ctx.fillStyle = v >= 4 ? '#FFF8E8' : colors[v & 3];
                ctx.fillRect(sx + 2, sy + 2, g.cell - 4, g.cell - 4);
                if ((x === centre && y === centre) ||
                    neighbours.some(function (q) { return q[0] === x && q[1] === y; })) {
                    ctx.fillStyle = RULE_VIS.ink;
                    ctx.font = '500 ' + Math.round(g.cell * .34) + 'px "IBM Plex Mono", monospace';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(String(v), sx + g.cell / 2, sy + g.cell / 2);
                }
            }
            const cx = g.left + (centre + .5) * g.cell, cy = g.top + (centre + .5) * g.cell;
            if (p >= .16 && p < .74) {
                ctx.fillStyle = 'rgba(161,141,0,.10)';
                ctx.fillRect(cx - g.cell / 2, cy - g.cell / 2, g.cell, g.cell);
                ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 4;
                ctx.strokeRect(cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4);
            }
            if (p >= .16 && p < .26) {
                const t = ruleOut((p - .16) / .10);
                ruleParticle(ctx, cx, ruleMix(g.top - 30, cy, t), g.cell * .10, RULE_VIS.white);
            }
            if (p >= .30 && p < .68) {
                const t = ruleEase((p - .30) / .38);
                [[0,-1],[1,0],[0,1],[-1,0]].forEach(function (d) {
                    ctx.beginPath();
                    ctx.arc(cx + d[0] * g.cell * t, cy + d[1] * g.cell * t,
                            g.cell * .085, 0, Math.PI * 2);
                    ctx.fillStyle = RULE_VIS.cyanBright; ctx.fill();
                    ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = 3; ctx.stroke();
                });
            }
        }, .86);
    };

    makers.apollointro = function () {
        return loopingRule('apollonian', 6400, function (ctx, W, p) {
            const phase = p < .18 ? 'PARENTS' : p < .34 ? 'GAP' : p < .62 ? 'INSERT'
                        : p < .76 ? 'CURVATURE' : 'RECURSE';
            rulePhase(ctx, W, phase, p < .62 ? 'fill one tangent gap' : 'κ = 4');
            const top = W * .292, bottom = W * .708, r = W * .208;
            const cy = W * .5, x0 = W * .292, x1 = W * .708;
            /* the parents are always there: a loop that grew them from nothing
               read as a broken frame */
            const settle = 1;
            ctx.globalAlpha = Math.min(1, settle);
            ctx.beginPath(); ctx.moveTo(W * .07, top); ctx.lineTo(W * .93, top);
            ctx.moveTo(W * .07, bottom); ctx.lineTo(W * .93, bottom);
            ctx.strokeStyle = RULE_VIS.quiet; ctx.lineWidth = 4; ctx.stroke();
            [x0, x1].forEach(function (x) {
                ctx.beginPath(); ctx.arc(x, cy, r * settle, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(118,103,168,.10)'; ctx.fill();
                ctx.strokeStyle = p >= .18 && p < .90 ? RULE_VIS.cyanBright : RULE_VIS.violet;
                ctx.lineWidth = p >= .18 && p < .90 ? 3.5 : 2.5; ctx.stroke();
            });
            ctx.globalAlpha = 1;
            const nr = r / 4, nx = W / 2, ny = top + nr;
            if (p >= .18 && p < .62) {
                ctx.beginPath(); ctx.arc(nx, ny, 8, 0, Math.PI * 2);
                ctx.fillStyle = RULE_VIS.yellow; ctx.fill();
            }
            if (p >= .34) {
                const t = ruleOut((p - .34) / .28);
                ctx.beginPath(); ctx.arc(nx, ny, nr * t, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(204,121,167,.18)'; ctx.fill();
                ctx.globalAlpha = p < .93 ? 1 : 1 - ruleEase((p - .93) / .07);
                ctx.strokeStyle = p < .76 ? RULE_VIS.yellow : RULE_VIS.violet;
                ctx.lineWidth = 3.5; ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }, .88);
    };

    makers.flatticeintro = function () {
        const n = 5, c = 2;
        return loopingRule('f-lattice', 5800, function (ctx, W, p) {
            const evenStage = p >= .12 && p < .50;
            const oddStage = p >= .50 && p < .88;
            const phase = p < .12 ? 'PARITY' : evenStage ? 'EVEN SITE'
                        : oddStage ? 'ODD SITE' : 'ORIENTATION';
            const detail = p < .12 ? '(x₁+x₂) mod 2'
                         : evenStage ? '2 → 1 + 1 vertically'
                         : oddStage ? '2 → 1 + 1 horizontally'
                         : 'even ↕    odd ↔';
            rulePhase(ctx, W, phase, detail);
            const g = ruleGrid(ctx, W, n);
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                const even = ((x + y) & 1) === 0;
                const sx = g.left + x * g.cell, sy = g.top + y * g.cell;
                const cx = sx + g.cell / 2, cy = sy + g.cell / 2;
                ctx.fillStyle = even ? 'rgba(86,180,233,.13)' : 'rgba(204,121,167,.13)';
                ctx.fillRect(sx + 3, sy + 3, g.cell - 6, g.cell - 6);
                const focus = (evenStage && x === c && y === c) ||
                              (oddStage && x === c + 1 && y === c);
                if (focus || p >= .88) {
                    ruleBiArrow(ctx, cx, cy, even, g.cell * .22,
                                focus ? RULE_VIS.yellow
                                      : (even ? RULE_VIS.cyanBright : RULE_VIS.rose),
                                focus ? 4 : 2.1);
                }
            }
            const fx = evenStage ? c : c + 1;
            const cx = g.left + (fx + .5) * g.cell, cy = g.top + (c + .5) * g.cell;
            if (evenStage || oddStage) {
                ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 4;
                ctx.strokeRect(cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4);
                const local = evenStage ? (p - .12) / .38 : (p - .50) / .38;
                const move = ruleEase((local - .30) / .45);
                const axis = evenStage ? [0, 1] : [1, 0];
                [-1, 1].forEach(function (sign) {
                    ctx.beginPath();
                    ctx.arc(cx + axis[0] * sign * g.cell * move,
                            cy + axis[1] * sign * g.cell * move,
                            g.cell * .075, 0, Math.PI * 2);
                    ctx.fillStyle = RULE_VIS.cyanBright; ctx.fill();
                    ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = 3; ctx.stroke();
                });
                ctx.fillStyle = RULE_VIS.paper;
                ctx.font = '600 ' + Math.round(g.cell * .22) + 'px "IBM Plex Mono", monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(local < .30 ? '2' : '0', cx, cy);
            }
        }, .86);
    };

    makers.randomintro = function () {
        const n = 11, centre = n >> 1, CHIPS = 80;
        let seed = 777;
        function randomWord() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return seed >>> 0;
        }
        const eta = new Int16Array(n * n);
        for (let i = 0; i < eta.length; i++) eta[i] = (randomWord() & 1) ? 0 : -1;

        /* Exact finite-box parallel toppling. Every unstable site fires once
           in a round; chips crossing the edge dissipate. The stored states,
           firing sets and travelling chips are all from this replay. */
        const frames = [];
        let h = new Int16Array(eta);
        h[centre * n + centre] += CHIPS;
        for (let round = 0; round < 200; round++) {
            const fired = new Uint8Array(n * n);
            let count = 0;
            for (let i = 0; i < h.length; i++) {
                if (h[i] >= 4) { fired[i] = 1; count++; }
            }
            if (!count) break;
            frames.push({ h: new Int16Array(h), fired: fired });
            const next = new Int16Array(h);
            for (let i = 0; i < h.length; i++) {
                if (!fired[i]) continue;
                const y = Math.floor(i / n), x = i - y * n;
                next[i] -= 4;
                if (x) next[i - 1]++;
                if (x + 1 < n) next[i + 1]++;
                if (y) next[i - n]++;
                if (y + 1 < n) next[i + n]++;
            }
            h = next;
        }
        const stable = new Int16Array(h);
        frames.push({ h: stable, fired: new Uint8Array(n * n) });
        for (let i = 0; i < stable.length; i++) {
            if (stable[i] >= 4) throw new Error('random-background intro did not stabilise');
        }

        return loopingRule('random-sandpile', 6600, function (ctx, W, p) {
            let state = eta, fired = null, sub = 0, frameNo = 0;
            if (p >= .30 && p < .84) {
                const at = ruleEase((p - .30) / .54) * (frames.length - 1);
                frameNo = Math.min(frames.length - 1, Math.floor(at));
                sub = at - frameNo;
                state = frames[frameNo].h; fired = frames[frameNo].fired;
            } else if (p >= .84) {
                state = stable; frameNo = frames.length - 1;
                fired = frames[frameNo].fired;
            }
            const phase = p < .18 ? 'SAMPLE' : p < .30 ? 'SOURCE'
                        : p < .84 ? 'PARALLEL' : 'STABLE';
            const detail = p < .18 ? 'η = 0 or −1 · 1/2' : p < .30 ? '+ 80 at 0'
                         : p < .84 ? 'round ' + (frameNo + 1) : 'all heights < 4';
            rulePhase(ctx, W, phase, detail);
            const g = ruleGrid(ctx, W, n);
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                const i = y * n + x, v = state[i];
                const order = i / (n * n);
                const reveal = p < .18 ? ruleEase((p - order * .11) / .07) : 1;
                const sx = g.left + x * g.cell, sy = g.top + y * g.cell;
                ctx.globalAlpha = reveal;
                ctx.fillStyle = v < 0 ? '#0072B2' : v === 0 ? '#24232D'
                    : v === 1 ? '#7668A6' : v === 2 ? '#8E4257'
                    : v === 3 ? '#A8D8E8' : '#E69F00';
                ctx.fillRect(sx + 2, sy + 2, g.cell - 4, g.cell - 4);
                if (fired && fired[i]) {
                    ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 3;
                    ctx.strokeRect(sx + 3, sy + 3, g.cell - 6, g.cell - 6);
                }
                if (v >= 4) {
                    ctx.fillStyle = v < 0 || v >= 3 ? RULE_VIS.white : '#FFF9E8';
                    ctx.font = '500 ' + Math.round(g.cell * .25) + 'px "IBM Plex Mono", monospace';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(String(v).replace('-', '−'), sx + g.cell / 2, sy + g.cell / 2);
                }
                ctx.globalAlpha = 1;
            }

            if (p >= .18 && p < .30) {
                const t = ruleOut((p - .18) / .12);
                const cx = g.left + (centre + .5) * g.cell;
                const cy = g.top + (centre + .5) * g.cell;
                ctx.beginPath(); ctx.arc(cx, ruleMix(g.top - 42, cy, t), g.cell * .19,
                                         0, Math.PI * 2);
                ctx.fillStyle = RULE_VIS.yellow; ctx.fill();
                ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = 3; ctx.stroke();
                ctx.fillStyle = RULE_VIS.key;
                ctx.font = '600 ' + Math.round(g.cell * .22) + 'px "IBM Plex Mono", monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('+80', cx, ruleMix(g.top - 42, cy, t));
            }

            if (fired && sub > 0) {
                const t = ruleEase(sub);
                const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
                for (let i = 0; i < fired.length; i++) {
                    if (!fired[i]) continue;
                    const y = Math.floor(i / n), x = i - y * n;
                    const x0 = g.left + (x + .5) * g.cell;
                    const y0 = g.top + (y + .5) * g.cell;
                    dirs.forEach(function (d) {
                        ctx.beginPath();
                        ctx.arc(x0 + d[0] * g.cell * t, y0 + d[1] * g.cell * t,
                                Math.max(3.5, g.cell * .07), 0, Math.PI * 2);
                        ctx.fillStyle = RULE_VIS.white; ctx.fill();
                        ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = 1.5; ctx.stroke();
                    });
                }
            }
        }, .88);
    };

    makers.divisibleintro = function () {
        const nodes = [[.50,.49],[.22,.30],[.48,.20],[.76,.29],[.79,.61],[.53,.74],[.20,.66]];
        const masses = [2.4,.18,.55,.72,.33,.86,.41];
        return loopingRule('divisible', 6000, function (ctx, W, p) {
            const phase = p < .18 ? 'MASS' : p < .34 ? 'UNSTABLE' : p < .58 ? 'DIVIDE'
                        : p < .76 ? 'RECEIVE' : 'CONSERVE';
            rulePhase(ctx, W, phase, p < .34 ? 'm(v) > 1' : p < .76 ? '(m−1) / deg(v)' : 'Σm unchanged');
            const ox = W * .13, oy = W * .15, size = W * .74;
            const pts = nodes.map(function (q) { return [ox + q[0] * size, oy + q[1] * size]; });
            const push = .05 * ruleEase((p - .18) / .16);
            ctx.save(); ctx.translate(pts[0][0], pts[0][1]); ctx.scale(1 + push, 1 + push);
            ctx.translate(-pts[0][0], -pts[0][1]);
            ctx.beginPath();
            for (let i = 1; i < pts.length; i++) {
                ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[i][0], pts[i][1]);
                const j = i === pts.length - 1 ? 1 : i + 1;
                ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]);
            }
            ctx.strokeStyle = RULE_VIS.grid; ctx.lineWidth = 4; ctx.stroke();
            const sent = p >= .64;
            pts.forEach(function (q, i) {
                const m = i === 0 ? (p < .40 ? masses[0] : 1) : masses[i] + (sent ? .28 : 0);
                const rr = i === 0 ? 43 : 34;
                ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, Math.PI * 2);
                ctx.fillStyle = i === 0 && p >= .18 && p < .58 ? 'rgba(161,141,0,.18)'
                    : 'rgba(118,103,168,' + (.10 + Math.min(1, m) * .22).toFixed(2) + ')';
                ctx.fill();
                ctx.strokeStyle = i === 0 && p >= .18 && p < .58 ? RULE_VIS.yellow : RULE_VIS.violet;
                ctx.lineWidth = i === 0 ? 5 : 3; ctx.stroke();
                if (i === 0) {
                    ctx.fillStyle = RULE_VIS.ink;
                    ctx.font = '500 25px "IBM Plex Mono", monospace';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(m.toFixed(m === 1 ? 0 : 1), q[0], q[1]);
                }
            });
            if (p >= .34 && p < .70) {
                const t = ruleEase((p - .34) / .36);
                for (let i = 1; i < pts.length; i++) {
                    ctx.beginPath();
                    ctx.arc(ruleMix(pts[0][0], pts[i][0], t), ruleMix(pts[0][1], pts[i][1], t),
                            8, 0, Math.PI * 2);
                    ctx.fillStyle = RULE_VIS.cyanBright; ctx.fill();
                    ctx.strokeStyle = RULE_VIS.key; ctx.lineWidth = 3; ctx.stroke();
                }
            }
            ctx.restore();
        }, .88);
    };

    makers.idlaintro = function () {
        const n = 9, occupied = new Set(), cx0 = 4, cy0 = 4;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
            if (Math.hypot(x - cx0, y - cy0) < 2.55) occupied.add(x + ',' + y);
        const pathCells = [[4,4],[5,4],[5,3],[4,3],[4,2],[5,2],[6,2]];
        return loopingRule('idla', 6200, function (ctx, W, p) {
            const phase = p < .14 ? 'CLUSTER' : p < .26 ? 'RELEASE' : p < .62 ? 'WALK'
                        : p < .78 ? 'FIRST EMPTY' : 'SETTLE';
            rulePhase(ctx, W, phase, p < .78 ? 'origin → first empty' : 'stop');
            const g = ruleGrid(ctx, W, n);
            function center(q) { return [g.left + (q[0] + .5) * g.cell,
                                         g.top + (q[1] + .5) * g.cell]; }
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                if (!occupied.has(x + ',' + y) && !(p >= .76 && x === 6 && y === 2)) continue;
                const d = Math.hypot(x - cx0, y - cy0);
                const col = d < 1.2 ? RULE_VIS.violet : d < 2.1 ? RULE_VIS.rose : RULE_VIS.orange;
                ctx.fillStyle = col; ctx.globalAlpha = .68;
                ctx.fillRect(g.left + x * g.cell + 3, g.top + y * g.cell + 3,
                             g.cell - 6, g.cell - 6); ctx.globalAlpha = 1;
            }
            const pts = pathCells.map(center);
            let pos = { x: pts[0][0], y: pts[0][1], index: 0, u: 0 };
            if (p >= .26) pos = rulePathPoint(pts, ruleEase((p - .26) / .50));
            if (p >= .26 && p < .80) ruleTrace(ctx, pts, pos, RULE_VIS.cyanBright, 3.5);
            if (p >= .14 && p < .78) ruleParticle(ctx, pos.x, pos.y, 14, RULE_VIS.white);
        }, .88);
    };

    makers.rotoraggintro = function () {
        /* Particle eight in the exact all-east process. Particles one through
           seven made this occupied mask and rotor state; the displayed route
           is then forced, not an illustrative hand-picked pattern. */
        const n = 7, pathCells = [[3,3],[3,2],[3,3],[4,3],[4,4]];
        const occupied0 = [[3,3],[3,4],[2,3],[3,2],[4,3],[3,5],[2,4]];
        const initial = {'3,3':2, '3,4':1, '2,3':1};
        const oldDirs = [2, 0, 3, 0], newDirs = [3, 1, 0, 1];
        const dcol = [RULE_VIS.cyanBright, RULE_VIS.orange, RULE_VIS.green, RULE_VIS.rose];
        return loopingRule('rotor-aggregation', 6800, function (ctx, W, p) {
            const phase = p < .14 ? 'RELEASE' : p < .70 ? 'TURN · MOVE' : 'SETTLE';
            rulePhase(ctx, W, phase, p < .70 ? 'particle 8 · all-east start' : 'first empty → stop');
            const g = ruleGrid(ctx, W, n);
            function cc(q) { return [g.left + (q[0] + .5) * g.cell,
                                      g.top + (q[1] + .5) * g.cell]; }
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                const occupied = occupied0.some(function (q) { return q[0] === x && q[1] === y; });
                const sx = g.left + x * g.cell, sy = g.top + y * g.cell;
                if (occupied || (p >= .80 && x === 4 && y === 4)) {
                    ctx.fillStyle = 'rgba(118,103,168,.15)';
                    ctx.fillRect(sx + 2, sy + 2, g.cell - 4, g.cell - 4);
                }
                if (!occupied) continue;
                let d = initial[x + ',' + y] || 0;
                for (let k = 0; k < pathCells.length - 1; k++) {
                    if (p > .14 + (k + 1) * .56 / 4 &&
                        pathCells[k][0] === x && pathCells[k][1] === y)
                        d = newDirs[k];
                }
                const a = Math.atan2([0,1,0,-1][d], [1,0,-1,0][d]);
                ruleArrow(ctx, sx + g.cell / 2, sy + g.cell / 2, a, g.cell * .25,
                          dcol[d], 3.2);
            }
            let walker = cc(pathCells[0]), active = pathCells[0], turn = 0, leg = 0;
            if (p >= .14 && p < .70) {
                const route = ruleClamp((p - .14) / .56) * 4;
                leg = Math.min(3, Math.floor(route));
                const u = route - leg;
                active = pathCells[leg];
                turn = ruleEase(u / .45);
                const move = ruleEase((u - .45) / .55);
                const a = cc(pathCells[leg]), b = cc(pathCells[leg + 1]);
                walker = [ruleMix(a[0], b[0], move), ruleMix(a[1], b[1], move)];
                const angle0 = oldDirs[leg] * Math.PI / 2;
                const ac = cc(active);
                ruleArrow(ctx, ac[0], ac[1], angle0, g.cell * .31,
                          'rgba(39,36,42,.25)', 3);
                ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 4;
                ctx.strokeRect(ac[0] - g.cell / 2 + 2, ac[1] - g.cell / 2 + 2,
                               g.cell - 4, g.cell - 4);
                ruleArrow(ctx, ac[0], ac[1], angle0 + Math.PI / 2 * turn,
                          g.cell * .31, RULE_VIS.yellow, 5, 5);
            } else if (p >= .70) {
                walker = cc(pathCells[pathCells.length - 1]);
            }
            const routePts = pathCells.map(cc);
            const tracePos = p < .70
                ? rulePathPoint(routePts, ruleClamp((p - .14) / .56))
                : rulePathPoint(routePts, 1);
            if (p >= .14 && p < .90) ruleTrace(ctx, routePts, tracePos, RULE_VIS.cyanBright, 5);
            const dest = cc(pathCells[pathCells.length - 1]);
            if (p >= .70 && p < .90) {
                ctx.fillStyle = 'rgba(161,141,0,.12)';
                ctx.fillRect(dest[0] - g.cell / 2, dest[1] - g.cell / 2, g.cell, g.cell);
                ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 4;
                ctx.strokeRect(dest[0] - g.cell / 2 + 2, dest[1] - g.cell / 2 + 2,
                               g.cell - 4, g.cell - 4);
            }
            if (p < .82) ruleParticle(ctx, walker[0], walker[1], 15, RULE_VIS.white);
        }, .88);
    };

    makers.dlaintro = function () {
        const n = 13;
        const cluster = [[6,6],[6,5],[6,4],[7,4],[8,4],[5,6],[4,6],[4,7],
                         [3,7],[6,7],[7,8],[8,9],[7,6],[5,5]];
        /* Every leg is a nearest-neighbour lattice step.  The previous
           illustrative route slipped diagonally twice, which quietly taught
           a different walk from the one the model uses. */
        const walk = [[11,1],[10,1],[10,2],[9,2],[9,3],[10,3],[10,4],[9,4]];
        return loopingRule('dla', 7000, function (ctx, W, p) {
            const phase = p < .18 ? 'RELEASE' : p < .58 ? 'WANDER'
                        : p < .72 ? 'CONTACT' : p < .84 ? 'STICK' : 'SCREEN';
            rulePhase(ctx, W, phase, p < .72 ? 'outside → first contact' : 'stick');
            const g = ruleGrid(ctx, W, n);
            function cc(q) { return [g.left + (q[0] + .5) * g.cell,
                                      g.top + (q[1] + .5) * g.cell]; }
            cluster.forEach(function (q, i) {
                const c = cc(q), t = i / Math.max(1, cluster.length - 1);
                const rgb = t < .5 ? RULE_VIS.violet : (t < .8 ? RULE_VIS.rose : RULE_VIS.orange);
                const reveal = ruleOut((p - i * .005) / .10);
                ctx.fillStyle = rgb; ctx.globalAlpha = (.62 + .28 * t) * reveal;
                ctx.fillRect(c[0] - g.cell / 2 + 2, c[1] - g.cell / 2 + 2,
                             g.cell - 4, g.cell - 4); ctx.globalAlpha = 1;
            });
            const points = walk.map(cc);
            const pos = rulePathPoint(points, ruleEase((p - .18) / .54));
            if (p >= .18 && p < .86) ruleTrace(ctx, points, pos, RULE_VIS.cyanBright, 5);
            const dest = cc(walk[walk.length - 1]);
            if (p >= .58 && p < .86) {
                ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 4;
                ctx.strokeRect(dest[0] - g.cell / 2 + 2, dest[1] - g.cell / 2 + 2,
                               g.cell - 4, g.cell - 4);
            }
            if (p >= .78) {
                ctx.fillStyle = RULE_VIS.orange; ctx.globalAlpha = .9;
                ctx.fillRect(dest[0] - g.cell / 2 + 3, dest[1] - g.cell / 2 + 3,
                             g.cell - 6, g.cell - 6); ctx.globalAlpha = 1;
            }
            if (p >= .18 && p < .80) ruleParticle(ctx, pos.x, pos.y, 14, RULE_VIS.white);
        }, .90);
    };

    makers.wilsonintro = function () {
        const loop = [[150,175],[235,175],[235,255],[150,255],[150,175]];
        const survive = [[150,175],[285,300],[370,365],[455,430]];
        const tree = [[[455,430],[520,500]],[[520,500],[580,420]],
                      [[520,500],[610,545]],[[520,500],[430,555]]];
        return loopingRule('ust', 7200, function (ctx, W, p) {
            const phase = p < .14 ? 'ROOT' : p < .40 ? 'WALK' : p < .52 ? 'LOOP'
                        : p < .66 ? 'ERASE' : p < .80 ? 'WALK' : p < .92 ? 'ATTACH' : 'KEEP';
            rulePhase(ctx, W, phase, '');
            tree.forEach(function (e, i) {
                ctx.beginPath(); ctx.moveTo(e[0][0], e[0][1]); ctx.lineTo(e[1][0], e[1][1]);
                ctx.strokeStyle = i & 1 ? RULE_VIS.cyanBright : RULE_VIS.violet;
                ctx.lineWidth = 5; ctx.stroke();
            });
            ctx.beginPath(); ctx.arc(520, 500, 10, 0, Math.PI * 2);
            ctx.fillStyle = RULE_VIS.yellow; ctx.fill();
            if (p >= .14 && p < .40) {
                const pos = rulePathPoint(loop, ruleEase((p - .14) / .26));
                ruleTrace(ctx, loop, pos, RULE_VIS.cyanBright, 6);
                ruleParticle(ctx, pos.x, pos.y, 13, RULE_VIS.white);
            }
            if (p >= .40 && p < .52) {
                const pos = rulePathPoint(loop, 1);
                ruleTrace(ctx, loop, pos, RULE_VIS.erase, 8);
                ruleParticle(ctx, loop[0][0], loop[0][1], 13, RULE_VIS.white);
            }
            if (p >= .52 && p < .66) {
                const keep = 1 - ruleEase((p - .52) / .14);
                const pos = rulePathPoint(loop, keep);
                if (keep > .015) ruleTrace(ctx, loop, pos, RULE_VIS.erase, 8);
                ruleParticle(ctx, loop[0][0], loop[0][1], 13, RULE_VIS.white);
            }
            if (p >= .66 && p < .80) {
                const pos = rulePathPoint(survive, ruleEase((p - .66) / .14));
                ruleTrace(ctx, survive, pos, RULE_VIS.cyanBright, 6);
                ruleParticle(ctx, pos.x, pos.y, 13, RULE_VIS.white);
            }
            if (p >= .80) {
                const pos = rulePathPoint(survive, 1);
                const colour = p < .87 ? RULE_VIS.white : RULE_VIS.rose;
                ruleTrace(ctx, survive, pos, colour, p < .87 ? 7 : 6);
                if (p < .87) {
                    ctx.beginPath(); ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
                    ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 5; ctx.stroke();
                    ruleParticle(ctx, pos.x, pos.y, 13, RULE_VIS.white);
                }
            }
        }, .90);
    };

    makers.sdintro = function () {
        return loopingRule('superdiffusion', 6600, function (ctx, W, p) {
            const phase = p < .10 ? 'EDDY' : p < .40 ? 'FOLLOW' : p < .58 ? 'NOISE'
                        : p < .76 ? 'ESCAPE' : 'LARGER EDDY';
            rulePhase(ctx, W, phase, '∇⊥ψ  +  √2 dW');

            /* This is a mechanism, not a vector-addition diagram. The amber
               pieces are tangent to actual-looking closed streamlines; the
               cyan bridge is the only cross-contour move. Pulling back then
               reveals that the same geometry waits at the next scale. */
            function eddyPoint(cx, cy, rx, ry, a, seed) {
                const wobble = 1 + .075 * Math.sin(3 * a + seed)
                                 + .035 * Math.sin(5 * a - seed * .7);
                return [cx + rx * wobble * Math.cos(a) + 8 * Math.sin(2 * a + seed),
                        cy + ry * wobble * Math.sin(a) + 6 * Math.cos(3 * a - seed)];
            }
            function eddy(cx, cy, rx, ry, seed, alpha, active) {
                ctx.beginPath();
                for (let q = 0; q <= 112; q++) {
                    const z = eddyPoint(cx, cy, rx, ry, q / 112 * Math.PI * 2, seed);
                    if (!q) ctx.moveTo(z[0], z[1]); else ctx.lineTo(z[0], z[1]);
                }
                ctx.strokeStyle = active ? 'rgba(198,88,22,' + alpha + ')'
                                         : 'rgba(57,127,154,' + Math.min(1, alpha * 1.6) + ')';
                ctx.lineWidth = active ? 3 : 1.8;
                ctx.stroke();
            }
            function arc(cx, cy, rx, ry, seed, a0, a1, t, color, width) {
                const stop = ruleMix(a0, a1, ruleClamp(t));
                ctx.beginPath();
                for (let q = 0; q <= 72; q++) {
                    const a = ruleMix(a0, stop, q / 72), z = eddyPoint(cx, cy, rx, ry, a, seed);
                    if (!q) ctx.moveTo(z[0], z[1]); else ctx.lineTo(z[0], z[1]);
                }
                ctx.strokeStyle = 'rgba(21,19,26,.4)'; ctx.lineWidth = width + 2; ctx.stroke();
                ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
                return eddyPoint(cx, cy, rx, ry, stop, seed);
            }
            function unit(v) {
                const n = Math.hypot(v[0], v[1]) || 1;
                return [v[0] / n, v[1] / n];
            }
            function bridge(a, b, ta, tb, q) {
                const reach = Math.hypot(b[0] - a[0], b[1] - a[1]) * .32;
                const c1 = [a[0] + ta[0] * reach, a[1] + ta[1] * reach];
                const c2 = [b[0] - tb[0] * reach, b[1] - tb[1] * reach];
                q = ruleClamp(q);
                const ac = [ruleMix(a[0], c1[0], q), ruleMix(a[1], c1[1], q)];
                const ce = [ruleMix(c1[0], c2[0], q), ruleMix(c1[1], c2[1], q)];
                const eb = [ruleMix(c2[0], b[0], q), ruleMix(c2[1], b[1], q)];
                const ace = [ruleMix(ac[0], ce[0], q), ruleMix(ac[1], ce[1], q)];
                const ceb = [ruleMix(ce[0], eb[0], q), ruleMix(ce[1], eb[1], q)];
                const point = [ruleMix(ace[0], ceb[0], q), ruleMix(ace[1], ceb[1], q)];
                return { point: point, c1: ac, c2: ace };
            }

            const pull = ruleEase((p - .76) / .14);
            const zoom = ruleMix(1.12, .73, pull);
            ctx.save();
            ctx.translate(W * .49, W * .49); ctx.scale(zoom, zoom);
            ctx.translate(-W * .49, -W * .49);

            const appear = 1;
            ctx.globalAlpha = appear;
            /* Large contours sit outside the first camera. They become the
               dominant eddy only when the camera retreats. */
            const outerAlpha = .08 + .32 * pull;
            eddy(W * .47, W * .49, 352, 258, 2.1, outerAlpha, false);
            eddy(W * .47, W * .49, 254, 185, 2.1, outerAlpha, false);
            [0, 2].forEach(function (k) {
                eddy(W * .38, W * .51, 70 + k * 31, 49 + k * 22, .65,
                     .27 + k * .035, k === 2 && p < .58);
                eddy(W * .65, W * .39, 54 + k * 28, 42 + k * 21, 1.65,
                     .22 + k * .035, k === 2 && p >= .58);
            });
            ctx.globalAlpha = 1;

            /* the path and particle fade at the ends of the loop; the field
               stays, so the reset is never a blank frame */
            const pathAlpha = 1 - Math.max(1 - ruleEase(p / .05), ruleEase((p - .94) / .06));
            ctx.globalAlpha = pathAlpha;
            const first0 = -2.62, first1 = .45;
            const firstT = ruleClamp(p / .40);
            const firstEnd = arc(W * .38, W * .51, 132, 93, .65, first0, first1,
                                 firstT, RULE_VIS.orange, 3);
            let particle = firstEnd;

            const secondStart = eddyPoint(W * .65, W * .39, 110, 84, 2.84, 1.65);
            if (p >= .40) {
                const a0 = eddyPoint(W * .38, W * .51, 132, 93, first1 - .01, .65);
                const b1 = eddyPoint(W * .65, W * .39, 110, 84, 2.84 + .01, 1.65);
                const kick = ruleClamp((p - .40) / .18);
                const curve = bridge(firstEnd, secondStart,
                                     unit([firstEnd[0] - a0[0], firstEnd[1] - a0[1]]),
                                     unit([b1[0] - secondStart[0], b1[1] - secondStart[1]]), kick);
                ctx.beginPath(); ctx.moveTo(firstEnd[0], firstEnd[1]);
                ctx.bezierCurveTo(curve.c1[0], curve.c1[1], curve.c2[0], curve.c2[1],
                                  curve.point[0], curve.point[1]);
                ctx.strokeStyle = 'rgba(21,19,26,.5)'; ctx.lineWidth = 5; ctx.stroke();
                ctx.strokeStyle = RULE_VIS.cyanBright; ctx.lineWidth = 3; ctx.stroke();
                particle = curve.point;
            }
            if (p >= .58) {
                const secondT = ruleClamp((p - .58) / .42);
                particle = arc(W * .65, W * .39, 110, 84, 1.65, 2.84,
                               2.84 + Math.PI * 2.8, secondT, RULE_VIS.orange, 3);
            }

            ruleParticle(ctx, particle[0], particle[1], 13, RULE_VIS.yellow);
            ctx.globalAlpha = 1;
            ctx.restore();
        }, .88);
    };

    /* A fixed periodic cellular flow is the clean middle register between the
       SDE and the multiscale random field. Up close the particle orbits and
       crosses separatrices. On zooming out those completed orbits collapse to
       cell-centre steps: an ordinary-looking random walk with a larger
       effective diffusivity. */
    makers.sdlattice = function () {
        const canvas = $('#sd-lattice-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, LOGICAL = 720;
        const CLOSE_CELL = 145, FAR_CELL = 48;
        const SAFE_EXTENT = .40 * LOGICAL;
        let D = null, px = null, py = null, motionArc = null, cameraCell = null;
        let ready = false, raf = 0, running = false, userPaused = false;
        let pageAwake = false, playhead = 0, lastNow = 0;

        function contourShape(level, samples) {
            const points = [], span = Math.acos(level) / Math.PI;
            for (let i = 0; i <= samples; i++) {
                const x = ruleMix(-span, span, i / samples);
                const ratio = Math.max(-1, Math.min(1, level / Math.cos(Math.PI * x)));
                points.push([x, Math.acos(ratio) / Math.PI]);
            }
            for (let i = samples; i >= 0; i--) {
                const x = ruleMix(-span, span, i / samples);
                const ratio = Math.max(-1, Math.min(1, level / Math.cos(Math.PI * x)));
                points.push([x, -Math.acos(ratio) / Math.PI]);
            }
            return points;
        }
        const IDLE_CONTOUR = contourShape(.42, 32);
        const ACTIVE_CONTOUR = contourShape(.18, 48);

        function scheduledZoom(t) {
            return ruleEase((t - D.zoomAfter) / 8.0);
        }
        function scheduledCell(t) {
            return Math.exp(ruleMix(Math.log(CLOSE_CELL), Math.log(FAR_CELL), scheduledZoom(t)));
        }
        function cellSize(t) {
            if (!cameraCell) return scheduledCell(t);
            const z = ruleClamp(t / D.duration) * (cameraCell.length - 1);
            const i = Math.min(cameraCell.length - 2, Math.floor(z)), q = z - i;
            return ruleMix(cameraCell[i], cameraCell[i + 1], q);
        }
        function zoomFromCell(cellPx) {
            return ruleClamp(Math.log(CLOSE_CELL / cellPx) / Math.log(CLOSE_CELL / FAR_CELL));
        }
        function pointAt(t) {
            const z = ruleClamp(t / D.duration) * (px.length - 1);
            const i = Math.min(px.length - 2, Math.floor(z)), q = z - i;
            return [ruleMix(px[i], px[i + 1], q), ruleMix(py[i], py[i + 1], q)];
        }
        function screenPoint(point, cellPx) {
            return [LOGICAL / 2 + point[0] * cellPx,
                    LOGICAL / 2 + point[1] * cellPx];
        }
        function cellOf(point) {
            return [Math.floor(point[0] + .5), Math.floor(point[1] + .5)];
        }
        function activeAt(t) {
            let current = [0, 0], previous = current, changed = -Infinity;
            for (let i = 0; i < D.changes.length && D.changes[i].time <= t; i++) {
                previous = current; current = D.changes[i].cell; changed = D.changes[i].time;
            }
            return { current: current, previous: previous, age: t - changed };
        }
        function arcAt(t) {
            const z = ruleClamp(t / D.duration) * (motionArc.length - 1);
            const i = Math.min(motionArc.length - 2, Math.floor(z)), q = z - i;
            return ruleMix(motionArc[i], motionArc[i + 1], q);
        }
        function timeAtArc(arc) {
            const last = motionArc.length - 1;
            if (arc <= 0) return 0;
            if (arc >= motionArc[last]) return D.duration;
            let lo = 0, hi = last;
            while (lo + 1 < hi) {
                const mid = (lo + hi) >> 1;
                if (motionArc[mid] <= arc) lo = mid; else hi = mid;
            }
            const span = motionArc[hi] - motionArc[lo];
            return D.duration * (lo + (span ? (arc - motionArc[lo]) / span : 0)) / last;
        }
        function trailColour(t) {
            const stops = [[236,150,40], [242,160,38], [245,166,35], [248,190,70]];
            const z = ruleClamp(t) * 3, i = Math.min(2, Math.floor(z)), q = z - i;
            return 'rgb(' + Math.round(ruleMix(stops[i][0], stops[i + 1][0], q)) + ',' +
                            Math.round(ruleMix(stops[i][1], stops[i + 1][1], q)) + ',' +
                            Math.round(ruleMix(stops[i][2], stops[i + 1][2], q)) + ')';
        }

        function paint() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            if (!ready) return;

            const t = playhead, cellPx = cellSize(t), zoom = zoomFromCell(cellPx);
            const point = pointAt(t), particle = screenPoint(point, cellPx);
            const active = activeAt(t), rawCell = cellOf(point);
            const cssWidth = Math.max(1, canvas.getBoundingClientRect().width || 720);
            const U = LOGICAL / cssWidth, mobile = cssWidth < 500;
            const trailCase = (mobile ? 3.25 : 2.75) * U;
            const trailCore = (mobile ? 2 : 1.5) * U;
            const idleStroke = (mobile ? 1.5 : 1.25) * U;
            const sx = function (x) { return LOGICAL / 2 + x * cellPx; };
            const sy = function (y) { return LOGICAL / 2 + y * cellPx; };
            const radius = Math.ceil(LOGICAL / (2 * cellPx)) + 1;

            ctx.save(); ctx.scale(W / LOGICAL, W / LOGICAL);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            const fieldAlpha = 1 - .64 * zoom;

            /* Exact separatrices of psi(x,y)=cos(pi x)cos(pi y). */
            ctx.globalAlpha = fieldAlpha;
            ctx.beginPath();
            for (let i = -radius; i <= radius; i++) {
                const q = sx(i + .5), r = sy(i + .5);
                ctx.moveTo(q, 0); ctx.lineTo(q, LOGICAL);
                ctx.moveTo(0, r); ctx.lineTo(LOGICAL, r);
            }
            ctx.strokeStyle = 'rgba(126,119,139,.62)'; ctx.lineWidth = idleStroke; ctx.stroke();

            function appendContour(cell, shape) {
                for (let i = 0; i < shape.length; i++) {
                    const q = shape[i], x = sx(cell[0] + q[0]), y = sy(cell[1] + q[1]);
                    if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
            }

            for (let parity = 0; parity < 2; parity++) {
                ctx.beginPath();
                for (let y = -radius; y <= radius; y++) for (let x = -radius; x <= radius; x++) {
                    if (((x + y) & 1) !== parity) continue;
                    appendContour([x, y], IDLE_CONTOUR);
                }
                ctx.strokeStyle = parity ? 'rgba(204,121,167,.42)' : 'rgba(168,216,232,.46)';
                ctx.lineWidth = idleStroke; ctx.stroke();
            }
            ctx.globalAlpha = 1;

            /* Occupancy follows the SDE itself. A new cell is rose while the
               particle tests it and becomes cyan only after a sustained stay. */
            function activeContour(cell, alpha, colour) {
                ctx.beginPath(); appendContour(cell, ACTIVE_CONTOUR); ctx.globalAlpha = alpha;
                ctx.strokeStyle = colour === 'cyan' ? '#CDEBF4' : '#C4718A';
                ctx.lineWidth = 1.4 * U; ctx.stroke(); ctx.globalAlpha = 1;
            }
            activeContour(active.current, 1, 'cyan');

            const testing = rawCell[0] !== active.current[0] || rawCell[1] !== active.current[1];
            if (testing) activeContour(rawCell, .72, 'rose');

            /* Draw the authentic retained path. Old points may be decimated
               only below a one-pixel chord; the live head uses every point. */
            const endZ = t / D.duration * (px.length - 1);
            const end = Math.floor(endZ), skip = Math.max(1, Math.ceil(Math.max(1, end) / 4200));
            const tx = [], ty = [];
            for (let i = 0; i <= end; i += skip) {
                tx.push(sx(px[i])); ty.push(sy(py[i]));
            }
            if (!tx.length || tx[tx.length - 1] !== particle[0] || ty[ty.length - 1] !== particle[1]) {
                tx.push(particle[0]); ty.push(particle[1]);
            }
            if (tx.length > 1) {
                ctx.beginPath(); ctx.moveTo(tx[0], ty[0]);
                for (let i = 1; i < tx.length; i++) ctx.lineTo(tx[i], ty[i]);
                ctx.strokeStyle = 'rgba(8,7,11,.55)'; ctx.lineWidth = trailCase; ctx.stroke();
                const bins = Math.min(48, tx.length - 1);
                for (let b = 0; b < bins; b++) {
                    const a = Math.floor(b * (tx.length - 1) / bins);
                    const z = Math.max(a + 1, Math.floor((b + 1) * (tx.length - 1) / bins));
                    ctx.beginPath(); ctx.moveTo(tx[a], ty[a]);
                    for (let i = a + 1; i <= z; i++) ctx.lineTo(tx[i], ty[i]);
                    const age = (a + z) / (2 * Math.max(1, tx.length - 1));
                    ctx.strokeStyle = trailColour(age); ctx.globalAlpha = .30 + .70 * Math.pow(age, .7);
                    ctx.lineWidth = trailCore; ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;

            const particleR = (mobile ? 13 : 11) * U / 2;
            ctx.beginPath(); ctx.arc(particle[0], particle[1], particleR, 0, Math.PI * 2);
            ctx.fillStyle = '#F6D854'; ctx.fill();
            ctx.strokeStyle = 'rgba(8,7,11,.82)'; ctx.lineWidth = 1.5 * U; ctx.stroke();
            let curtain = 0, u = t / D.duration;
            if (u < .012) curtain = 1 - ruleEase(u / .012);
            if (u > .985) curtain = ruleEase((u - .985) / .015);
            if (curtain) {
                ctx.globalAlpha = curtain; ctx.fillStyle = '#0F0E13';
                ctx.fillRect(0, 0, LOGICAL, LOGICAL);
            }
            ctx.restore();
        }

        function prepare(data) {
            D = data; px = Float32Array.from(D.path.x); py = Float32Array.from(D.path.y);
            if (px.length < 2 || px.length !== py.length)
                throw new Error('periodic SDE path missing');
            /* The origin never moves. The view only widens, and it widens
               when the path asks it to: the camera fits the path's own reach
               with a margin, rather than pulling back on a clock and leaving
               the trajectory a squiggle in a field of empty cells. */
            cameraCell = new Float32Array(px.length);
            let prior = CLOSE_CELL;
            for (let i = 0; i < px.length; i++) {
                const reach = Math.max(.001, Math.abs(px[i]), Math.abs(py[i]));
                prior = Math.min(prior, SAFE_EXTENT / (1.25 * reach));
                cameraCell[i] = prior;
                if (reach * cameraCell[i] > SAFE_EXTENT + 1e-3)
                    throw new Error('periodic SDE camera containment failed');
            }
            motionArc = new Float64Array(px.length);
            let old = screenPoint([px[0], py[0]], cellSize(0));
            for (let i = 1; i < px.length; i++) {
                const t = D.duration * i / (px.length - 1), cellPx = cellSize(t);
                const q = screenPoint([px[i], py[i]], cellPx);
                motionArc[i] = motionArc[i - 1] + Math.hypot(q[0] - old[0], q[1] - old[1]);
                old = q;
            }
            ready = true; playhead = REDUCED ? D.duration * .72 : 0; paint();
            if (!REDUCED && !userPaused && pageAwake) resume();
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const dt = Math.min(.04, Math.max(0, (now - lastNow) / 1000));
            lastNow = now;
            if (playhead >= D.duration - 1e-7) playhead = 0;
            const current = arcAt(playhead);
            const allowed = Math.min(.0046 * LOGICAL, .20 * LOGICAL * dt);
            playhead = timeAtArc(Math.min(motionArc[motionArc.length - 1], current + allowed));
            paint(); raf = requestAnimationFrame(frame);
        }
        function pause() {
            pageAwake = false;
            running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0;
        }
        function resume() {
            pageAwake = true;
            if (REDUCED || running || !ready) return;
            running = true; lastNow = 0; raf = requestAnimationFrame(frame);
        }
        fetch('plates/p-sd-toy.json').then(function (r) {
            if (!r.ok) throw new Error('periodic SDE ' + r.status);
            return r.json();
        }).then(prepare).catch(function (err) { console.warn('periodic SDE:', err); });
        paint();
        return { pause: pause, resume: resume };
    };

    makers.gmcintro = function () {
        const nodes = [[.18,.25,.11],[.36,.18,.07],[.58,.22,.13],[.76,.34,.08],
                       [.26,.48,.14],[.49,.44,.09],[.68,.54,.12],[.20,.72,.08],
                       [.43,.70,.15],[.72,.76,.07]];
        const edges = [[0,1,2],[1,2,4],[0,4,1],[1,4,3],[1,5,5],[2,3,2],
                       [2,5,4],[2,6,1],[3,6,3],[4,5,4],[4,7,2],[4,8,1],
                       [5,6,5],[5,8,3],[6,8,2],[6,9,4],[7,8,2],[8,9,5]];
        return loopingRule('sphere-packing', 7000, function (ctx, W, p) {
            const phase = p < .18 ? 'SAMPLE' : p < .36 ? 'CONNECT' : p < .56 ? 'WEIGH'
                        : p < .72 ? 'CHOOSE' : 'ENTER';
            rulePhase(ctx, W, phase, p >= .36 && p < .72 ? 'c = ℓ / d' : '');
            const ox = W * .11, oy = W * .13, size = W * .78;
            function pt(i) { return [ox + nodes[i][0] * size, oy + nodes[i][1] * size]; }
            if (p >= .18) {
                ctx.globalAlpha = ruleEase((p - .18) / .18);
                edges.forEach(function (e) {
                    const a = pt(e[0]), b = pt(e[1]);
                    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
                    ctx.strokeStyle = '#B8AF9E'; ctx.lineWidth = 1.4; ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }
            const current = 5, selected = 6, cp = pt(current), sp = pt(selected);
            if (p >= .36) {
                edges.filter(function (e) { return e[0] === current || e[1] === current; })
                    .forEach(function (e) {
                        const other = e[0] === current ? e[1] : e[0], b = pt(other);
                        ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(b[0], b[1]);
                        /* the spoke's width is its conductance: the weighting is
                           the rule, so it must be seen */
                        ctx.strokeStyle = other === selected ? RULE_VIS.yellow : 'rgba(200,88,22,.72)';
                        ctx.lineWidth = 1 + e[2] * .55; ctx.stroke();
                    });
            }
            nodes.forEach(function (q, i) {
                const c = pt(i); ctx.beginPath(); ctx.arc(c[0], c[1], i === current ? 10 : 6, 0, Math.PI * 2);
                ctx.fillStyle = i === current && p >= .36 ? RULE_VIS.yellow : RULE_VIS.ink; ctx.fill();
            });
            if (p >= .56) {
                const t = ruleEase((p - .56) / .16);
                ctx.beginPath(); ctx.moveTo(cp[0], cp[1]);
                ctx.lineTo(ruleMix(cp[0], sp[0], t), ruleMix(cp[1], sp[1], t));
                ctx.strokeStyle = RULE_VIS.cyanBright; ctx.lineWidth = 2.5; ctx.stroke();
                ruleParticle(ctx, ruleMix(cp[0], sp[0], t), ruleMix(cp[1], sp[1], t), 12, RULE_VIS.white);
            }
        }, .88);
    };

    makers.peelintro = function () {
        let seed = 0x51f15e, points = [];
        function rnd() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
        for (let i = 0; i < 58; i++) points.push([.06 + .88 * rnd(), .06 + .88 * rnd(), i]);
        function front(active) {
            const out = new Set();
            [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(function (s) {
                active.forEach(function (i) {
                    const a = points[i];
                    const dominated = active.some(function (j) {
                        if (i === j) return false;
                        const b = points[j];
                        const bx = s[0] * b[0], by = s[1] * b[1];
                        const ax = s[0] * a[0], ay = s[1] * a[1];
                        return bx <= ax && by <= ay && (bx < ax || by < ay);
                    });
                    if (!dominated) out.add(i);
                });
            });
            return Array.from(out);
        }
        const all = points.map(function (_, i) { return i; });
        const first = front(all), left = all.filter(function (i) { return first.indexOf(i) < 0; });
        const second = front(left);
        return loopingRule('pareto-peeling', 6400, function (ctx, W, p) {
            const phase = p < .18 ? 'CLOUD' : p < .38 ? 'TEST' : p < .56 ? 'BOUNDARY'
                        : p < .72 ? 'PEEL' : 'NEXT';
            rulePhase(ctx, W, phase, p < .72 ? 'minimal → remove' : 'layer 2');
            const left0 = W * .17, top = W * .16, size = W * .66;
            ctx.strokeStyle = RULE_VIS.grid; ctx.lineWidth = 3;
            ctx.strokeRect(left0, top, size, size);
            function xy(i) { return [left0 + points[i][0] * size, top + points[i][1] * size]; }
            const peeled = p >= .56 ? ruleEase((p - .56) / .16) : 0;
            points.forEach(function (q, i) {
                const c = xy(i), isFirst = first.indexOf(i) >= 0,
                      isSecond = second.indexOf(i) >= 0;
                const reveal = ruleOut((p - i * .0018) / .07);
                ctx.beginPath(); ctx.arc(c[0], c[1], isFirst ? 6.5 : 5, 0, Math.PI * 2);
                if (isFirst && p >= .18 && p < .72) ctx.fillStyle = RULE_VIS.yellow;
                else if (isFirst && p >= .56) ctx.fillStyle = RULE_VIS.rose;
                else if (isSecond && p >= .72) ctx.fillStyle = RULE_VIS.yellow;
                else ctx.fillStyle = RULE_VIS.quiet;
                ctx.globalAlpha = (isFirst && p >= .56 ? .25 + .75 * (1 - peeled) : .82) * reveal;
                ctx.fill(); ctx.globalAlpha = 1;
            });
            const active = p >= .72 ? second : first;
            if (p >= .38) {
                /* The l1 front is four record staircases, one for each
                   quadrant cone. A polar polygon looks plausible but is not
                   the Pareto boundary. */
                [[1,1],[-1,1],[-1,-1],[1,-1]].forEach(function (s) {
                    const chain = active.filter(function (i) {
                        const a = points[i];
                        return !active.some(function (j) {
                            if (i === j) return false;
                            const b = points[j];
                            return s[0] * b[0] <= s[0] * a[0]
                                && s[1] * b[1] <= s[1] * a[1]
                                && (s[0] * b[0] < s[0] * a[0]
                                    || s[1] * b[1] < s[1] * a[1]);
                        });
                    }).sort(function (a, b) {
                        return s[0] * (points[a][0] - points[b][0]);
                    });
                    if (chain.length < 2) return;
                    let prev = xy(chain[0]);
                    ctx.beginPath(); ctx.moveTo(prev[0], prev[1]);
                    for (let k = 1; k < chain.length; k++) {
                        const cur = xy(chain[k]);
                        ctx.lineTo(cur[0], prev[1]);
                        ctx.lineTo(cur[0], cur[1]);
                        prev = cur;
                    }
                    ctx.strokeStyle = RULE_VIS.cyanBright;
                    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
                });
            }
        }, .88);
    };

    makers.percolationintro = function () {
        const n = 8, nodes = n * n, edges = [], adj = Array.from({length:nodes}, function(){return[];});
        function id(x,y) { return y * n + x; }
        /* One unforced Bernoulli(.62) sample. Seed 3 is chosen only because
           its largest component hits all four sides; no row or column is
           planted into the cluster. */
        function hash(x,y,d) {
            return ((x + 3) * 73856093 ^ (y + 5) * 19349663 ^
                    d * 83492791 ^ Math.imul(3, 2654435761)) >>> 0;
        }
        function add(a,b) { edges.push([a,b]); adj[a].push(b); adj[b].push(a); }
        for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
            if (x+1<n && hash(x,y,0)%100<62) add(id(x,y),id(x+1,y));
            if (y+1<n && hash(x,y,1)%100<62) add(id(x,y),id(x,y+1));
        }
        const component = new Uint8Array(nodes), stack=[id(4,3)]; component[stack[0]]=1;
        while(stack.length){const a=stack.pop();adj[a].forEach(function(b){if(!component[b]){component[b]=1;stack.push(b);}});}
        const original = Array.from({length:nodes}, function(_,i){return [i%n, (i/n)|0];});
        const anchor = new Uint8Array(nodes);
        for(let i=0;i<nodes;i++){const x=i%n,y=(i/n)|0;anchor[i]=component[i]&&(x===0||x===n-1||y===0||y===n-1)?1:0;}
        function iterate(pos, rounds) {
            let a=pos.map(function(q){return q.slice();});
            for(let r=0;r<rounds;r++){
                const b=a.map(function(q){return q.slice();});
                for(let i=0;i<nodes;i++) if(component[i]&&!anchor[i]&&adj[i].length){
                    let sx=0,sy=0,k=0;adj[i].forEach(function(j){if(component[j]){sx+=a[j][0];sy+=a[j][1];k++;}});
                    if(k)b[i]=[sx/k,sy/k];
                }
                a=b;
            }
            return a;
        }
        const states=[original,iterate(original,1),iterate(original,3),iterate(original,12),iterate(original,240)];
        return loopingRule('percolation', 6800, function (ctx,W,p) {
            const phase=p<.16?'CLUSTER':p<.30?'BOUNDARY':p<.58?'RELAX':p<.78?'COLLAPSE':'HARMONIC';
            rulePhase(ctx,W,phase,p<.30?'open bonds · p=.62':p<.78?'Δh = 0':'draw v at h(v)');
            let a=0,b=0,t=0;
            if(p<.30){a=b=0;} else if(p<.39){a=0;b=1;t=ruleEase((p-.30)/.09);}
            else if(p<.48){a=1;b=2;t=ruleEase((p-.39)/.09);}
            else if(p<.58){a=2;b=3;t=ruleEase((p-.48)/.10);}
            else if(p<.78){a=3;b=4;t=ruleEase((p-.58)/.20);} else {a=b=4;}
            const left=W*.18,top=W*.16,size=W*.64,step=size/(n-1);
            function at(i){return [left+ruleMix(states[a][i][0],states[b][i][0],t)*step,
                                  top+ruleMix(states[a][i][1],states[b][i][1],t)*step];}
            /* cluster edges in the instrument's blue; the pinned boundary
               vertices in the ochre that is yellow on the dark stage below */
            edges.forEach(function(e){const x=at(e[0]),y=at(e[1]);ctx.beginPath();ctx.moveTo(x[0],x[1]);ctx.lineTo(y[0],y[1]);ctx.strokeStyle=component[e[0]]&&component[e[1]]?'#3A5F8F':'rgba(142,136,117,.16)';ctx.lineWidth=component[e[0]]&&component[e[1]]?2.4:1.4;ctx.stroke();});
            for(let i=0;i<nodes;i++){
                const q=at(i);
                ctx.beginPath();ctx.arc(q[0],q[1],anchor[i]?7:4.2,0,Math.PI*2);
                ctx.fillStyle=!component[i]?'rgba(142,136,117,.22)':anchor[i]?'#B8960C':'#B8456F';ctx.fill();
            }
        }, .88);
    };

    /* ---------------- Plate VII — the rotor walk ---------------- */

    /* ---------------- VII — one walker, forever ---------------- */

    /* The definition's small figure is the rule itself in motion. Four
       departures trace a square, then reset: turn, follow, retain. */
    makers.rotorintro = function () {
        const canvas = $('#rule-rotor-walk');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width;
        const N = 5, DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
        const DURATION = 2100;
        const PATH = [[2, 2, 3], [3, 2, 0], [3, 3, 1], [2, 3, 2]];
        let rotors, x, y, leg, motion, began = null, raf = null, running = false;

        function clamp(v) { return Math.max(0, Math.min(1, v)); }
        function smooth(v) {
            v = clamp(v);
            return v * v * (3 - 2 * v);
        }

        function resetModel() {
            rotors = new Uint8Array(N * N);
            for (let gy = 0; gy < N; gy++) {
                for (let gx = 0; gx < N; gx++) {
                    rotors[gy * N + gx] = (gx * 3 + gy * 2 + 1) & 3;
                }
            }
            PATH.forEach(function (p) { rotors[p[1] * N + p[0]] = p[2]; });
            x = 2; y = 2; leg = 0; motion = makeMotion();
        }

        function makeMotion() {
            const oldDir = rotors[y * N + x], newDir = (oldDir + 1) & 3;
            return {
                fromX: x, fromY: y, toX: x + DX[newDir], toY: y + DY[newDir],
                oldDir: oldDir, newDir: newDir
            };
        }

        function commit() {
            rotors[motion.fromY * N + motion.fromX] = motion.newDir;
            x = motion.toX; y = motion.toY; leg++;
            if (leg >= PATH.length) resetModel();
            else motion = makeMotion();
        }

        function arrow(cx, cy, angle, reach, color, width) {
            const ux = Math.cos(angle), uy = Math.sin(angle);
            const px = -uy, py = ux;
            const tx = cx + ux * reach, ty = cy + uy * reach;
            ctx.beginPath();
            ctx.moveTo(cx - ux * reach * .7, cy - uy * reach * .7);
            ctx.lineTo(tx, ty);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * reach * .42 + px * reach * .28,
                       ty - uy * reach * .42 + py * reach * .28);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * reach * .42 - px * reach * .28,
                       ty - uy * reach * .42 - py * reach * .28);
            ctx.strokeStyle = color; ctx.lineWidth = width;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        }

        function draw(progress) {
            const turn = smooth((progress - .10) / .30);
            const move = smooth((progress - .40) / .30);
            const remember = smooth((progress - .70) / .30);
            const size = W * .72, cell = size / N;
            const ox = (W - size) * .5, oy = W * .17;
            ctx.fillStyle = '#F2EDE2'; ctx.fillRect(0, 0, W, W);

            ctx.beginPath();
            for (let q = 0; q <= N; q++) {
                const gx = ox + q * cell, gy = oy + q * cell;
                ctx.moveTo(gx, oy); ctx.lineTo(gx, oy + size);
                ctx.moveTo(ox, gy); ctx.lineTo(ox + size, gy);
            }
            ctx.strokeStyle = '#D3C9B7'; ctx.lineWidth = 2; ctx.stroke();

            for (let gy = 0; gy < N; gy++) {
                for (let gx = 0; gx < N; gx++) {
                    const isSource = gx === motion.fromX && gy === motion.fromY;
                    if (isSource) continue;
                    const d = rotors[gy * N + gx];
                    const changed = PATH.slice(0, leg).some(function (p) {
                        return p[0] === gx && p[1] === gy;
                    });
                    arrow(ox + (gx + .5) * cell, oy + (gy + .5) * cell,
                          Math.atan2(DY[d], DX[d]), cell * .27,
                          changed ? '#397F9A' : '#8E8875', Math.max(3, cell * .045));
                }
            }

            const sx = ox + (motion.fromX + .5) * cell;
            const sy = oy + (motion.fromY + .5) * cell;
            const oldAngle = Math.atan2(DY[motion.oldDir], DX[motion.oldDir]);
            const angle = oldAngle + Math.PI * .5 * turn;
            ctx.fillStyle = 'rgba(145,128,0,' + (.10 * (1 - remember)).toFixed(3) + ')';
            ctx.fillRect(ox + motion.fromX * cell, oy + motion.fromY * cell, cell, cell);
            ctx.strokeStyle = 'rgba(145,128,0,' + (.86 - remember * .52).toFixed(3) + ')';
            ctx.lineWidth = Math.max(3, cell * .035);
            ctx.strokeRect(ox + motion.fromX * cell + ctx.lineWidth / 2,
                           oy + motion.fromY * cell + ctx.lineWidth / 2,
                           cell - ctx.lineWidth, cell - ctx.lineWidth);
            if (progress >= .10 && progress < .40) {
                arrow(sx, sy, oldAngle, cell * .31, 'rgba(142,136,117,.30)',
                      Math.max(3, cell * .04));
                ctx.beginPath(); ctx.arc(sx, sy, cell * .31, oldAngle,
                                         oldAngle + Math.PI * .5 * turn);
                ctx.strokeStyle = '#918000'; ctx.lineWidth = Math.max(3, cell * .035);
                ctx.stroke();
            }
            const active = [145, 128, 0], stored = [57, 127, 154];
            const rgb = active.map(function (v, i) {
                return Math.round(v + (stored[i] - v) * remember);
            });

            const wx = ox + (motion.fromX + (motion.toX - motion.fromX) * move + .5) * cell;
            const wy = oy + (motion.fromY + (motion.toY - motion.fromY) * move + .5) * cell;
            if (move > 0) {
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(wx, wy);
                ctx.strokeStyle = 'rgba(57,127,154,.78)';
                ctx.lineWidth = Math.max(2.5, cell * .03); ctx.stroke();
            }
            /* the walker is a hollow ring, so the rotor it stands on stays in
               view while it turns; the arrow is drawn over it */
            ctx.beginPath(); ctx.arc(wx, wy, cell * .19, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(242,237,226,.55)'; ctx.fill();
            ctx.strokeStyle = '#27242A'; ctx.lineWidth = Math.max(3, cell * .04); ctx.stroke();
            arrow(sx, sy, angle, cell * .31, 'rgb(' + rgb.join(',') + ')',
                  Math.max(3.5, cell * .05));
        }

        function frame(now) {
            if (!running) return;
            if (began === null) began = now;
            let progress = (now - began) / DURATION;
            if (progress >= 1) {
                commit(); began = now; progress = 0;
            }
            draw(progress);
            raf = requestAnimationFrame(frame);
        }

        function pause() {
            running = false;
            if (raf !== null) cancelAnimationFrame(raf);
            raf = null; began = null;
        }
        function resume() {
            if (REDUCED || running) return;
            running = true; began = null; raf = requestAnimationFrame(frame);
        }

        resetModel();
        if (REDUCED) draw(.88);
        else resume();
        return { pause: pause, resume: resume };
    };

    makers.rotorwalk = function () {
        const canvas = $('#euler-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;

        const N = 801;
        const C = N >> 1;
        const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
        const DIR_NAME = ['east', 'south', 'west', 'north'];
        const DIR_SHORT = ['E', 'S', 'W', 'N'];
        const STEP_CAP = 120000;
        const WATCH_MS = 1080;
        const FOCUS_END = 120 / WATCH_MS;
        const TURN_END = 420 / WATCH_MS;
        const MOVE_END = 760 / WATCH_MS;
        const SHAPE_FRAME_MS = 20;
        const SHAPE_BUDGET_MS = 7;
        const SHAPE_RAMP_MS = 750;
        const GROW_SPEEDS = [250, 500, 1000, 2500, 6000, 15000, 40000];
        /* Circuits are few and ordinal, so they take a discrete palette of
           well-separated hues at one lightness; nested circuits then read as
           bands rather than as one purple-grey mass. */
        const CIRCUIT_COLORS = [[61,110,224], [31,162,200], [43,176,140], [134,185,58],
                                [216,172,43], [239,125,58], [226,80,110], [181,89,214]];

        let rotor, firstAt, off, offCtx;
        let trail, trailAt;
        let x, y, steps, returns, range, maxR;
        let minX, maxX, minY, maxY;
        let history, nextSample;
        let raf = null, delay = null, running = false;
        let userPaused = false, pageAwake = true;
        let mode = 'watch', viewMode = 'follow', viewTouched = false;
        let motion = null, currentPhase = 'turn';
        let viewHalf = 9.5, viewCx = C, viewCy = C;
        let lastShapeFrame = 0, lastStats = 0, shapeBegan = 0;
        let lastFromX = -1, lastFromY = -1, lastDir = 0;

        const TRAIL = 48;
        const elSteps = $('#euler-steps'), elRange = $('#euler-range'),
              elCircuits = $('#euler-circuits'), elRadius = $('#euler-radius'),
              elExp = $('#euler-exponent'), note = $('#euler-note'),
              live = $('#euler-live');
        const instrument = canvas.closest('.instrument');
        const watchButton = $('[data-euler="watch"]');
        const shapeButton = $('[data-euler="shape"]');
        const followButton = $('[data-euler="follow"]');
        const wholeButton = $('[data-euler="whole"]');
        const pauseButton = $('[data-euler="pause"]');
        const speedWrap = $('#euler-grow-speed');
        const speedInput = $('#euler-speed');
        const speedValue = $('#euler-speed-value');

        function setRunningUi() {
            if (!pauseButton) return;
            pauseButton.disabled = REDUCED;
            pauseButton.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Resume');
            pauseButton.classList.toggle('is-on', running);
        }

        function stop() {
            running = false;
            if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
            if (delay !== null) { clearTimeout(delay); delay = null; }
            motion = null;                 /* an uncommitted turn is discarded */
            setRunningUi();
        }

        function setPhase(next) {
            currentPhase = next;
            if (note) note.dataset.phase = next || '';
        }

        function setModeButtons() {
            [[watchButton, 'watch'], [shapeButton, 'shape']].forEach(function (pair) {
                if (!pair[0]) return;
                const on = mode === pair[1];
                pair[0].classList.toggle('is-on', on);
                pair[0].setAttribute('aria-pressed', String(on));
            });
            [[followButton, 'follow'], [wholeButton, 'whole']].forEach(function (pair) {
                if (!pair[0]) return;
                const on = viewMode === pair[1];
                pair[0].classList.toggle('is-on', on);
                pair[0].setAttribute('aria-pressed', String(on));
            });
            instrument.dataset.rotorMode = mode;
            instrument.dataset.rotorView = viewMode;
            if (speedWrap) speedWrap.hidden = mode !== 'shape';
        }

        function reset() {
            stop();
            rotor = new Uint8Array(N * N);
            for (let i = 0; i < rotor.length; i++) rotor[i] = (Math.random() * 4) | 0;
            firstAt = new Uint32Array(N * N);
            off = document.createElement('canvas');
            off.width = off.height = N;
            offCtx = off.getContext('2d');
            offCtx.clearRect(0, 0, N, N);
            trail = new Int32Array(TRAIL).fill(-1);
            trailAt = 0;
            x = C; y = C;
            steps = 0; returns = 0; range = 1; maxR = 0;
            minX = maxX = C; minY = maxY = C;
            lastFromX = lastFromY = -1; lastDir = 0;
            history = [[1, 1]]; nextSample = 16;
            viewHalf = followHalf(); viewCx = viewCy = C;
            motion = null; shapeBegan = 0;
            mode = 'watch'; viewMode = 'follow'; viewTouched = false;
            setModeButtons();
            setPhase('turn');
            visit(C, C);
            draw();
            update();
            note.textContent = REDUCED
                ? 'Ready \u00b7 Step'
                : 'Turn';
        }

        function circuitNumber() {
            return Math.floor(returns / 4) + 1;
        }

        /* circuit k takes swatch k of the key, and keeps it */
        function circuitLevel(mark) {
            if (!mark) return -1;
            return (mark - 1) % CIRCUIT_COLORS.length;
        }

        function circuitRgb(mark) {
            return CIRCUIT_COLORS[circuitLevel(mark)];
        }

        function paintVisit(i) {
            const gx = i % N, gy = (i - gx) / N;
            /* the cell carries its circuit; the arrow on it stays cream */
            const rgb = mixRgb([15, 15, 18],
                               circuitRgb(firstAt[i]),
                               .8);
            offCtx.fillStyle = 'rgb(' + rgb.join(',') + ')';
            offCtx.fillRect(gx, gy, 1, 1);
        }

        function repaintTerritory() {
            offCtx.clearRect(0, 0, N, N);
            for (let py = minY; py <= maxY; py++) {
                for (let px = minX; px <= maxX; px++) {
                    const i = py * N + px;
                    if (firstAt[i]) paintVisit(i);
                }
            }
        }

        /* A site keeps the circuit in which it first appeared. Four returns
           make one circuit on Z^2, exactly as in the paper's Figure 2. */
        function visit(px, py) {
            const i = py * N + px;
            if (!firstAt[i]) {
                firstAt[i] = circuitNumber();
                paintVisit(i);
            }
            trail[trailAt] = i;
            trailAt = (trailAt + 1) % TRAIL;
        }

        function sampleRange() {
            if (steps >= nextSample) {
                history.push([steps, range]);
                nextSample = Math.ceil(nextSample * 1.5);
            }
        }

        function commitStep(fx, fy, d, nx, ny) {
            rotor[fy * N + fx] = d;
            lastFromX = fx; lastFromY = fy; lastDir = d;
            x = nx; y = ny; steps++;
            if (x === C && y === C) {
                returns++;
                if (returns % 4 === 0) repaintTerritory();
            }
            if (!firstAt[y * N + x]) {
                range++;
                const r = Math.hypot(x - C, y - C);
                if (r > maxR) maxR = r;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
            visit(x, y);
            sampleRange();
        }

        function makeMotion() {
            const i = y * N + x;
            const oldDir = rotor[i];
            const newDir = (oldDir + 1) & 3;
            const nx = x + DX[newDir], ny = y + DY[newDir];
            if (nx < 3 || ny < 3 || nx > N - 4 || ny > N - 4) return null;
            return {
                fromX: x, fromY: y, toX: nx, toY: ny,
                oldDir: oldDir, newDir: newDir, progress: 0, phase: ''
            };
        }

        function stepImmediate() {
            const i = y * N + x;
            const d = (rotor[i] + 1) & 3;
            const nx = x + DX[d], ny = y + DY[d];
            if (nx < 3 || ny < 3 || nx > N - 4 || ny > N - 4) return false;
            commitStep(x, y, d, nx, ny);
            return true;
        }

        function advanceShape(target) {
            const began = performance.now();
            for (let s = 0; s < target; s++) {
                if (!stepImmediate()) return false;
                if ((s & 255) === 255 && performance.now() - began >= SHAPE_BUDGET_MS) break;
            }
            return true;
        }

        function followHalf() {
            return canvas.getBoundingClientRect().width <= 500 ? 7.5 : 9.5;
        }

        function cameraTarget() {
            if (viewMode === 'follow') {
                const wp = walkerPosition();
                return { x: wp.x, y: wp.y, half: followHalf() };
            }
            const span = Math.max(maxX - minX + 1, maxY - minY + 1);
            return {
                x: (minX + maxX) * .5,
                y: (minY + maxY) * .5,
                half: Math.max(followHalf(), span * .56 + 2)
            };
        }

        function easeCamera(force) {
            const target = cameraTarget();
            if (force) {
                viewCx = target.x; viewCy = target.y; viewHalf = target.half;
                return;
            }
            const positionRate = viewMode === 'follow' ? .32 : .14;
            viewCx += (target.x - viewCx) * positionRate;
            viewCy += (target.y - viewCy) * positionRate;
            viewHalf += (target.half - viewHalf) * .12;
        }

        function backingPerCss() {
            const css = canvas.getBoundingClientRect().width;
            return css > 0 ? W / css : 2;
        }

        function cssScale(scale) { return scale / backingPerCss(); }
        /* below twelve CSS pixels a cell the arrows would be noise: the
           coloured cells carry the picture; from twelve they are short ticks;
           from twenty they are full arrows */
        function arrowsLegible(scale) { return cssScale(scale) >= 12; }
        function arrowsFull(scale) { return cssScale(scale) >= 20; }
        function clamp01(v) { return Math.max(0, Math.min(1, v)); }
        function ease(v) {
            v = clamp01(v);
            return v < .5 ? 4 * v * v * v
                          : 1 - Math.pow(-2 * v + 2, 3) / 2;
        }

        function motionParts(m) {
            return {
                turn: ease(m ? (m.progress - FOCUS_END) /
                                  (TURN_END - FOCUS_END) : 1),
                move: ease(m ? (m.progress - TURN_END) /
                                  (MOVE_END - TURN_END) : 1)
            };
        }

        function rememberPulse() {
            if (!motion || motion.progress < MOVE_END) return 0;
            return ease((motion.progress - MOVE_END) / (1 - MOVE_END));
        }

        function mixRgb(a, b, t) {
            return [
                Math.round(a[0] + (b[0] - a[0]) * t),
                Math.round(a[1] + (b[1] - a[1]) * t),
                Math.round(a[2] + (b[2] - a[2]) * t)
            ];
        }

        function rgba(rgb, alpha) {
            return 'rgba(' + rgb.join(',') + ',' + alpha.toFixed(3) + ')';
        }

        function addArrowPath(cx, cy, angle, reach) {
            const ux = Math.cos(angle), uy = Math.sin(angle);
            const px = -uy, py = ux;
            const tail = reach * .72, head = reach * .47, wing = reach * .30;
            const tx = cx + ux * reach, ty = cy + uy * reach;
            ctx.moveTo(cx - ux * tail, cy - uy * tail);
            ctx.lineTo(tx, ty);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * head + px * wing, ty - uy * head + py * wing);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * head - px * wing, ty - uy * head - py * wing);
        }

        function strokeArrow(cx, cy, angle, reach, core, coreWidth, halo, haloWidth) {
            ctx.beginPath();
            addArrowPath(cx, cy, angle, reach);
            if (halo && haloWidth) {
                ctx.strokeStyle = halo;
                ctx.lineWidth = haloWidth;
                ctx.stroke();
            }
            ctx.strokeStyle = core;
            ctx.lineWidth = coreWidth;
            ctx.stroke();
        }

        function traceFieldArrows(hw, scale, kind, level, skipIndex, offX, offY) {
            const loX = Math.max(0, Math.floor(offX));
            const hiX = Math.min(N - 1, Math.ceil(offX + 2 * hw));
            const loY = Math.max(0, Math.floor(offY));
            const hiY = Math.min(N - 1, Math.ceil(offY + 2 * hw));
            const reach = scale * .29;
            ctx.beginPath();
            for (let gy = loY; gy <= hiY; gy++) {
                for (let gx = loX; gx <= hiX; gx++) {
                    const i = gy * N + gx;
                    const mark = firstAt[i];
                    if (i === skipIndex) continue;
                    if (kind === 'untouched' && mark) continue;
                    if (kind === 'visited' && !mark) continue;
                    if (kind === 'visited' && level >= 0 &&
                            circuitLevel(mark) !== level) continue;
                    const d = rotor[i];
                    const cx = (gx - offX + .5) * scale;
                    const cy = (gy - offY + .5) * scale;
                    addArrowPath(cx, cy, Math.atan2(DY[d], DX[d]), reach);
                }
            }
        }

        function drawFieldArrows(hw, scale, skipIndex, offX, offY) {
            const ratio = backingPerCss(), full = arrowsFull(scale);
            const core = full ? Math.max(1.2 * ratio, scale * .05) : Math.max(1.3 * ratio, scale * .075);
            const halo = full ? Math.max(2.2 * ratio, scale * .09) : Math.max(2.4 * ratio, scale * .12);
            const focusDim = motion && motion.progress < TURN_END ? .88 : 1;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            traceFieldArrows(hw, scale, 'untouched', -1, skipIndex, offX, offY);
            ctx.strokeStyle = 'rgba(7,7,9,.7)';
            ctx.lineWidth = halo;
            ctx.stroke();
            traceFieldArrows(hw, scale, 'untouched', -1, skipIndex, offX, offY);
            ctx.strokeStyle = 'rgba(125,129,141,' + (.9 * focusDim).toFixed(3) + ')';
            ctx.lineWidth = core;
            ctx.stroke();

            /* one cream arrow on every visited cell: the circuit is the cell
               colour beneath it, so the arrows never fight their ground */
            traceFieldArrows(hw, scale, 'visited', -1, skipIndex, offX, offY);
            ctx.strokeStyle = 'rgba(7,7,9,.6)';
            ctx.lineWidth = halo;
            ctx.stroke();
            traceFieldArrows(hw, scale, 'visited', -1, skipIndex, offX, offY);
            ctx.strokeStyle = 'rgba(233,230,223,' + (.86 * focusDim).toFixed(3) + ')';
            ctx.lineWidth = core;
            ctx.stroke();
        }

        function traceTerritoryMarks(hw, scale, level, offX, offY) {
            const loX = Math.max(0, Math.floor(offX));
            const hiX = Math.min(N - 1, Math.ceil(offX + 2 * hw));
            const loY = Math.max(0, Math.floor(offY));
            const hiY = Math.min(N - 1, Math.ceil(offY + 2 * hw));
            const reach = Math.max(scale * .24, backingPerCss() * .55);
            ctx.beginPath();
            for (let gy = loY; gy <= hiY; gy++) {
                for (let gx = loX; gx <= hiX; gx++) {
                    const i = gy * N + gx;
                    if (!firstAt[i] || circuitLevel(firstAt[i]) !== level) continue;
                    const d = rotor[i], ux = DX[d], uy = DY[d];
                    const cx = (gx - offX + .5) * scale;
                    const cy = (gy - offY + .5) * scale;
                    ctx.moveTo(cx - ux * reach, cy - uy * reach);
                    ctx.lineTo(cx + ux * reach, cy + uy * reach);
                }
            }
        }

        function drawTerritoryTexture(hw, scale, offX, offY) {
            const ratio = backingPerCss();
            ctx.lineCap = 'round';
            for (let level = 0; level < CIRCUIT_COLORS.length; level++) {
                traceTerritoryMarks(hw, scale, level, offX, offY);
                ctx.strokeStyle = rgba(CIRCUIT_COLORS[level], .82);
                ctx.lineWidth = Math.max(.72 * ratio, Math.min(scale * .18, 1.25 * ratio));
                ctx.stroke();
            }
        }

        function drawTrail(offX, offY, scale) {
            const ratio = backingPerCss();
            const inner = Math.max(1 * ratio, Math.min(scale * .08, 1.7 * ratio));
            const count = Math.min(20, steps + 1, TRAIL);
            const points = [];
            for (let age = count; age > 0; age--) {
                const ti = trail[(trailAt - age + TRAIL) % TRAIL];
                if (ti < 0) continue;
                const gx = ti % N, gy = (ti - gx) / N;
                points.push([(gx - offX + .5) * scale,
                             (gy - offY + .5) * scale]);
            }
            if (motion) {
                const wp = walkerPosition();
                points.push([(wp.x - offX + .5) * scale,
                             (wp.y - offY + .5) * scale]);
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let q = 1; q < points.length; q++) {
                const alpha = .16 + .72 * q / Math.max(1, points.length - 1);
                ctx.beginPath();
                ctx.moveTo(points[q - 1][0], points[q - 1][1]);
                ctx.lineTo(points[q][0], points[q][1]);
                ctx.strokeStyle = 'rgba(7,7,9,.7)';
                ctx.lineWidth = inner + 1.4 * ratio;
                ctx.stroke();
                ctx.strokeStyle = 'rgba(111,211,255,' + (alpha * .95).toFixed(3) + ')';
                ctx.lineWidth = inner;
                ctx.stroke();
            }
        }

        function drawGrid(hw, scale, offX, offY) {
            if (cssScale(scale) < 11) return;
            const ratio = backingPerCss();
            const loX = Math.max(0, Math.floor(offX));
            const hiX = Math.min(N, Math.ceil(offX + 2 * hw));
            const loY = Math.max(0, Math.floor(offY));
            const hiY = Math.min(N, Math.ceil(offY + 2 * hw));
            ctx.beginPath();
            for (let q = loX; q <= hiX; q++) {
                const p = (q - offX) * scale;
                ctx.moveTo(p, 0); ctx.lineTo(p, W);
            }
            for (let q = loY; q <= hiY; q++) {
                const p = (q - offY) * scale;
                ctx.moveTo(0, p); ctx.lineTo(W, p);
            }
            ctx.strokeStyle = 'rgba(41,42,48,.92)';
            ctx.lineWidth = Math.max(.45 * ratio, 1);
            ctx.stroke();
        }

        function activeRotor() {
            if (motion) {
                const parts = motionParts(motion);
                return {
                    x: motion.fromX, y: motion.fromY,
                    angle: Math.atan2(DY[motion.oldDir], DX[motion.oldDir])
                           + Math.PI * .5 * parts.turn
                };
            }
            const d = rotor[y * N + x];
            return { x: x, y: y, angle: Math.atan2(DY[d], DX[d]) };
        }

        function walkerPosition() {
            if (!motion) return { x: x, y: y };
            const p = motionParts(motion).move;
            return {
                x: motion.fromX + (motion.toX - motion.fromX) * p,
                y: motion.fromY + (motion.toY - motion.fromY) * p
            };
        }

        function drawActiveRotor(active, offX, offY, scale) {
            const ratio = backingPerCss();
            const left = (active.x - offX) * scale;
            const top = (active.y - offY) * scale;
            const pulse = rememberPulse();
            ctx.fillStyle = 'rgba(242,222,77,' + (.12 * (1 - pulse)).toFixed(3) + ')';
            ctx.fillRect(left, top, scale, scale);
            ctx.strokeStyle = 'rgba(242,222,77,' + (.4 - .25 * pulse).toFixed(3) + ')';
            ctx.lineWidth = Math.max(1 * ratio, scale * .03);
            ctx.strokeRect(left + ctx.lineWidth / 2, top + ctx.lineWidth / 2,
                           Math.max(0, scale - ctx.lineWidth),
                           Math.max(0, scale - ctx.lineWidth));

            const cx = left + scale * .5, cy = top + scale * .5;
            if (motion && currentPhase === 'turn') {
                const oldAngle = Math.atan2(DY[motion.oldDir], DX[motion.oldDir]);
                strokeArrow(cx, cy, oldAngle, scale * .34,
                            'rgba(255,248,234,.25)',
                            Math.max(1.1 * ratio, scale * .043));
                ctx.beginPath();
                ctx.arc(cx, cy, scale * .29, oldAngle, oldAngle + Math.PI * .5);
                ctx.setLineDash([2.2 * ratio, 2.8 * ratio]);
                ctx.strokeStyle = 'rgba(242,222,77,.58)';
                ctx.lineWidth = Math.max(1.1 * ratio, scale * .03);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            const stored = circuitRgb(firstAt[active.y * N + active.x]);
            const activeRgb = mixRgb([242, 222, 77], stored, pulse);
            strokeArrow(cx, cy, active.angle, scale * .34,
                        rgba(activeRgb, 1), Math.max(2 * ratio, scale * .078),
                        'rgba(7,7,9,.94)', Math.max(4.5 * ratio, scale * .17));
        }

        function drawWalker(offX, offY, scale) {
            const ratio = backingPerCss(), wp = walkerPosition();
            const wx = (wp.x - offX + .5) * scale;
            const wy = (wp.y - offY + .5) * scale;
            /* one cased yellow ring: the rotor it stands on is drawn over it */
            const radius = arrowsLegible(scale)
                ? Math.max(5 * ratio, Math.min(scale * .34, 12 * ratio))
                : 6 * ratio;
            ctx.beginPath();
            ctx.arc(wx, wy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(7,7,9,.9)';
            ctx.lineWidth = 3.4 * ratio;
            ctx.stroke();
            ctx.strokeStyle = '#FFD75A';
            ctx.lineWidth = 1.6 * ratio;
            ctx.stroke();
        }

        function drawMicroscope() {
            const ratio = backingPerCss();
            const cssWidth = W / ratio;
            const compact = cssWidth <= 420;
            const size = Math.min(W * .30, (compact ? 108 : 160) * ratio);
            const px = W - size - 24 * ratio, py = 24 * ratio;
            const pad = (compact ? 8 : 10) * ratio;
            const labelH = (compact ? 19 : 22) * ratio;
            const gridTop = py + labelH + pad * .55;
            const cell = (size - pad * 2 - labelH) / 5;
            const centerX = motion ? motion.fromX : x;
            const centerY = motion ? motion.fromY : y;
            const active = activeRotor();
            const wp = walkerPosition();

            ctx.fillStyle = 'rgba(24,24,28,.97)';
            ctx.fillRect(px, py, size, size);
            ctx.strokeStyle = 'rgba(255,248,234,.3)';
            ctx.lineWidth = Math.max(1, ratio * .75);
            ctx.strokeRect(px + ctx.lineWidth / 2, py + ctx.lineWidth / 2,
                           size - ctx.lineWidth, size - ctx.lineWidth);
            ctx.fillStyle = 'rgba(255,248,234,.76)';
            ctx.font = '500 ' + ((compact ? 6.7 : 8.2) * ratio) +
                       'px "IBM Plex Mono", monospace';
            ctx.textBaseline = 'middle';
            ctx.fillText('5\u00d75',
                         px + pad, py + (compact ? 9.8 : 11.5) * ratio);

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const gx = centerX + col - 2, gy = centerY + row - 2;
                    const i = gy * N + gx;
                    const sx = px + pad + col * cell, sy = gridTop + row * cell;
                    const mark = firstAt[i];
                    const tile = mark
                        ? mixRgb([15, 15, 18], circuitRgb(mark), .6)
                        : [15, 15, 18];
                    ctx.fillStyle = 'rgb(' + tile.join(',') + ')';
                    ctx.fillRect(sx, sy, cell, cell);
                }
            }

            ctx.beginPath();
            for (let q = 0; q <= 5; q++) {
                const gx = px + pad + q * cell, gy = gridTop + q * cell;
                ctx.moveTo(gx, gridTop); ctx.lineTo(gx, gridTop + 5 * cell);
                ctx.moveTo(px + pad, gy); ctx.lineTo(px + pad + 5 * cell, gy);
            }
            ctx.strokeStyle = 'rgba(41,42,48,.95)';
            ctx.lineWidth = Math.max(.45 * ratio, 1);
            ctx.stroke();

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const gx = centerX + col - 2, gy = centerY + row - 2;
                    const i = gy * N + gx;
                    const cx = px + pad + (col + .5) * cell;
                    const cy = gridTop + (row + .5) * cell;
                    let angle = Math.atan2(DY[rotor[i]], DX[rotor[i]]);
                    const isActive = gx === active.x && gy === active.y;
                    if (isActive) angle = active.angle;
                    if (isActive) {
                        const stored = circuitRgb(firstAt[i]);
                        const activeRgb = mixRgb([242, 222, 77],
                                                 stored,
                                                 rememberPulse());
                        strokeArrow(cx, cy, angle, cell * .30,
                                    rgba(activeRgb, 1),
                                    Math.max(1.45 * ratio, cell * .08),
                                    'rgba(7,7,9,.94)', Math.max(3.2 * ratio, cell * .18));
                    } else if (firstAt[i]) {
                        strokeArrow(cx, cy, angle, cell * .27,
                                    rgba(circuitRgb(firstAt[i]), .95),
                                    Math.max(.95 * ratio, cell * .06),
                                    'rgba(7,7,9,.88)', Math.max(2.2 * ratio, cell * .14));
                    } else {
                        strokeArrow(cx, cy, angle, cell * .27,
                                    'rgba(102,106,114,.76)', Math.max(.9 * ratio, cell * .055),
                                    'rgba(7,7,9,.90)', Math.max(2.2 * ratio, cell * .14));
                    }
                }
            }

            const wx = px + pad + (wp.x - centerX + 2.5) * cell;
            const wy = gridTop + (wp.y - centerY + 2.5) * cell;
            ctx.beginPath();
            ctx.arc(wx, wy, cell * .32, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(7,7,9,.94)';
            ctx.lineWidth = 3.2 * ratio;
            ctx.stroke();
            ctx.strokeStyle = '#FFF8EA';
            ctx.lineWidth = 1.45 * ratio;
            ctx.stroke();
        }

        function draw() {
            easeCamera(false);
            const hw = viewHalf, scale = W / (2 * hw);
            const offX = viewCx - hw, offY = viewCy - hw;
            const legible = arrowsLegible(scale);
            ctx.fillStyle = '#0F0F12';
            ctx.fillRect(0, 0, W, W);

            ctx.imageSmoothingEnabled = cssScale(scale) < 1;
            ctx.drawImage(off, offX, offY, 2 * hw, 2 * hw, 0, 0, W, W);
            drawGrid(hw, scale, offX, offY);

            const active = activeRotor();
            if (legible) drawFieldArrows(hw, scale, active.y * N + active.x, offX, offY);
            drawTrail(offX, offY, scale);
            drawWalker(offX, offY, scale);
            if (legible) drawActiveRotor(active, offX, offY, scale);
            /* the inset would cover the cluster on a phone */
            if (viewMode === 'whole' && !legible && W / backingPerCss() > 420) drawMicroscope();
        }

        function update() {
            elSteps.textContent = nf.format(steps);
            elRange.textContent = nf.format(range);
            elCircuits.textContent = nf.format(Math.floor(returns / 4)) + ' + '
                + (returns % 4) + '/4';
            elRadius.textContent = maxR.toFixed(1);

            const samples = history.filter(function (h) {
                return h[0] * 10 >= steps && h[0] >= 8;
            });
            let slope = null;
            if (samples.length >= 4) {
                let sx = 0, sy = 0, sxx = 0, sxy = 0;
                for (let q = 0; q < samples.length; q++) {
                    const X = Math.log(samples[q][0]);
                    const Y = Math.log(samples[q][1]);
                    sx += X; sy += Y; sxx += X * X; sxy += X * Y;
                }
                const n = samples.length, den = n * sxx - sx * sx;
                if (den > 0) slope = (n * sxy - sx * sy) / den;
            }
            elExp.textContent = slope === null
                ? '\u2014'
                : (Math.round(slope * 100) / 100).toFixed(2);
        }

        function phaseOf(progress) {
            if (progress < TURN_END) return 'turn';
            if (progress < MOVE_END) return 'move';
            return 'remember';
        }

        function phaseText(m, phase) {
            if (phase === 'turn') {
                return 'Turn \u00b7 ' + DIR_SHORT[m.oldDir] + '\u2192' + DIR_SHORT[m.newDir];
            }
            if (phase === 'move') {
                return 'Move \u00b7 ' + DIR_SHORT[m.newDir];
            }
            return 'Rotor remains ' + DIR_SHORT[m.newDir];
        }

        function phaseSpeech(m, phase) {
            if (phase === 'turn') {
                return 'Turn from ' + DIR_NAME[m.oldDir] + ' to ' + DIR_NAME[m.newDir] + '.';
            }
            if (phase === 'move') return 'Move ' + DIR_NAME[m.newDir] + '.';
            return 'The rotor remains directed ' + DIR_NAME[m.newDir] + '.';
        }

        function announceMotion(m, phase, manual) {
            setPhase(phase);
            note.textContent = phaseText(m, phase);
            if (manual && live) live.textContent = phaseSpeech(m, phase);
        }

        function animateOneStep(done, manual) {
            const m = makeMotion();
            if (!m) { done(false); return; }

            if (REDUCED) {
                commitStep(m.fromX, m.fromY, m.newDir, m.toX, m.toY);
                setPhase('remember');
                draw(); update();
                note.textContent = phaseText(m, 'remember');
                if (manual && live) live.textContent = 'Step complete. ' + phaseSpeech(m, 'remember');
                done(true);
                return;
            }

            motion = m;
            let began = null;
            function frame(now) {
                if (began === null) began = now;
                m.progress = clamp01((now - began) / WATCH_MS);
                const phase = phaseOf(m.progress);
                if (phase !== m.phase) {
                    m.phase = phase;
                    announceMotion(m, phase, manual);
                }
                draw();
                if (m.progress < 1) {
                    raf = requestAnimationFrame(frame);
                    return;
                }

                raf = null;
                commitStep(m.fromX, m.fromY, m.newDir, m.toX, m.toY);
                motion = null;
                setPhase('remember');
                note.textContent = phaseText(m, 'remember');
                if (manual && live) live.textContent = 'Step complete. ' + phaseSpeech(m, 'remember');
                draw(); update();
                done(true);
            }
            raf = requestAnimationFrame(frame);
        }

        function edgeReached() {
            stop();
            setPhase(null);
            note.textContent = 'Finite-board boundary reached';
            if (live) live.textContent = 'The walker reached the edge of the finite board.';
        }

        function startShapeLoop() {
            lastShapeFrame = 0; lastStats = 0;
            shapeBegan = performance.now();
            raf = requestAnimationFrame(shapeFrame);
        }

        function shapeFrame(now) {
            if (!running || mode !== 'shape') { raf = null; return; }
            if (lastShapeFrame && now - lastShapeFrame < SHAPE_FRAME_MS) {
                raf = requestAnimationFrame(shapeFrame);
                return;
            }
            const elapsed = lastShapeFrame
                ? Math.min(80, now - lastShapeFrame)
                : SHAPE_FRAME_MS;
            lastShapeFrame = now;
            const speed = GROW_SPEEDS[Number(speedInput ? speedInput.value : 3)];
            const ramp = clamp01((now - shapeBegan) / SHAPE_RAMP_MS);
            const target = Math.max(1, Math.round(
                Math.min(STEP_CAP, speed * elapsed / 1000) *
                (.04 + .96 * ease(ramp))
            ));
            if (!advanceShape(target)) { edgeReached(); return; }
            draw();
            if (!lastStats || now - lastStats >= 120) {
                lastStats = now;
                update();
                const microscopic = !arrowsLegible(W / (2 * viewHalf));
                note.textContent = ramp < 1
                    ? nf.format(speed) + ' steps/s'
                    : (microscopic ? '5\u00d75 inset at the walker' : '');
            }
            raf = requestAnimationFrame(shapeFrame);
        }

        function watchLoop() {
            if (!running || mode !== 'watch') return;
            animateOneStep(function (ok) {
                if (!ok) { edgeReached(); return; }
                if (!running) return;
                delay = setTimeout(function () {
                    delay = null;
                    watchLoop();
                }, 130);
            }, false);
        }

        function run() {
            if (!pageAwake || running || raf !== null || delay !== null) return;
            running = true;
            setRunningUi();
            if (mode === 'watch') watchLoop();
            else {
                setPhase(null);
                startShapeLoop();
            }
        }

        function chooseMode(next) {
            const wasRunning = running;
            stop();
            mode = next;
            if (!viewTouched) viewMode = next === 'watch' ? 'follow' : 'whole';
            setModeButtons();
            setPhase(next === 'watch' ? 'turn' : null);
            easeCamera(true);
            draw();
            if (wasRunning && !REDUCED) run();
            else {
                setRunningUi();
                note.textContent = 'Paused';
            }
        }

        function chooseView(next) {
            viewMode = next;
            viewTouched = true;
            setModeButtons();
            easeCamera(!running);
            draw();
            note.textContent = next === 'follow' ? 'Follow' : 'Whole';
        }

        function updateSpeedLabel() {
            if (!speedInput || !speedValue) return;
            speedValue.textContent = nf.format(GROW_SPEEDS[Number(speedInput.value)])
                + ' steps/s';
        }

        $$('[data-euler]').forEach(function (button) {
            button.addEventListener('click', function () {
                const action = button.dataset.euler;
                if (action === 'watch') chooseMode('watch');
                if (action === 'shape') chooseMode('shape');
                if (action === 'follow') chooseView('follow');
                if (action === 'whole') chooseView('whole');
                if (action === 'pause') {
                    if (running) {
                        userPaused = true;
                        stop();
                        draw();
                        note.textContent = 'Paused';
                        if (live) live.textContent = 'Eulerian walker paused.';
                    } else if (!REDUCED) {
                        userPaused = false;
                        run();
                        if (live) live.textContent = 'Eulerian walker resumed.';
                    }
                }
                if (action === 'step') {
                    userPaused = true;
                    stop();
                    setPhase('turn');
                    draw();
                    animateOneStep(function (ok) {
                        if (!ok) edgeReached();
                        setRunningUi();
                    }, true);
                }
                if (action === 'reset') {
                    userPaused = false;
                    reset();
                    if (!REDUCED && pageAwake) run();
                    else if (live) live.textContent = 'Eulerian walker reset.';
                }
            });
        });

        if (speedInput) speedInput.addEventListener('input', updateSpeedLabel);
        updateSpeedLabel();

        reset();
        if (!REDUCED) run();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; if (!REDUCED && !userPaused) run(); }
        };
    };

    /* ---------------- VIII — internal DLA, on its own ---------------- */

    /* One random aggregate, not a comparison panel. Particles begin at the
       origin and settle at the first empty site. The write-once colour field
       records settling order; the short pale front and current walk sit above
       it, while the equal-area circle makes the ball theorem visible. */
    makers.aggregationLegacy = function () {
        const canvas = $('#idla-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const N = 141, C = N >> 1;
        const RATE = 0.012, CAP = 300000;
        const TRAIL = 250, WATCH = 1 << 30, EVERY = 90;
        const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
        const CYCLE = [[86, 180, 233], [204, 121, 167], [230, 159, 0]];
        const RING = 1.5;

        const elCount = $('#idla-count'), elWidth = $('#idla-width'),
              elSteps = $('#grow-steps'), elRadius = $('#idla-radius'),
              note = $('#grow-note');

        const byR = new Int32Array(N * N), rOf = new Float64Array(N * N);
        (function () {
            const idx = [];
            for (let i = 0; i < N * N; i++) {
                const gx = i % N, gy = (i - gx) / N;
                rOf[i] = Math.hypot(gx - C, gy - C);
                idx.push(i);
            }
            idx.sort(function (a, b) { return rOf[a] - rOf[b]; });
            for (let i = 0; i < idx.length; i++) byR[i] = idx[i];
        })();

        let model, watching, uiPace = 'grow', uiView = 'whole', uiPaused = false;
        let camX = C, camY = C;

        function makeModel() {
            const off = document.createElement('canvas');
            off.width = off.height = N;
            const offCtx = off.getContext('2d');
            const img = offCtx.createImageData(N, N);
            const m = {
                off: off, offCtx: offCtx, img: img, data: img.data,
                filled: new Uint8Array(N * N),
                trail: new Int32Array(TRAIL).fill(-1), trailAt: 0,
                path: [], count: 0, steps: 0, maxR: 0, inPtr: 0,
                x: C, y: C, done: false
            };
            settle(m, C * N + C);
            return m;
        }

        function settle(m, i) {
            m.count++;
            const band = Math.floor(Math.sqrt(m.count / Math.PI) / RING);
            const rgb = CYCLE[band % CYCLE.length], p = i * 4;
            m.data[p] = rgb[0]; m.data[p + 1] = rgb[1];
            m.data[p + 2] = rgb[2]; m.data[p + 3] = 255;
            m.filled[i] = 1;
            if (rOf[i] > m.maxR) m.maxR = rOf[i];
            m.trail[m.trailAt] = i;
            m.trailAt = (m.trailAt + 1) % TRAIL;
            m.path.length = 0;
        }

        function advanceOne(m) {
            if (m.done) return 'done';
            const i = m.y * N + m.x;
            if (!m.filled[i]) {
                settle(m, i);
                m.x = C; m.y = C;
                return 'settle';
            }
            if (watching && !m.path.length) m.path.push(i);
            const d = (Math.random() * 4) | 0;
            m.x += DX[d]; m.y += DY[d]; m.steps++;
            if (watching && m.path.length < 2048) m.path.push(m.y * N + m.x);
            if (m.x < 2 || m.y < 2 || m.x > N - 3 || m.y > N - 3) m.done = true;
            return 'walk';
        }

        function advance(m, budget) {
            if (m.done) return;
            for (let moved = 0; moved < budget && !m.done;) {
                if (advanceOne(m) === 'walk') moved++;
            }
        }

        function inRadius(m) {
            while (m.inPtr < byR.length && m.filled[byR[m.inPtr]]) m.inPtr++;
            return m.inPtr < byR.length ? rOf[byR[m.inPtr]] : m.maxR;
        }

        function halfWidth() {
            return Math.min(C, Math.max(9, Math.ceil(model.maxR * 1.06) + 5));
        }

        function windowGeometry(snap) {
            let hw, tx, ty;
            if (uiView === 'whole') {
                hw = halfWidth(); tx = C; ty = C;
            } else {
                hw = Math.min(C, Math.max(9, Math.min(20, 7 + Math.ceil(model.maxR * .36))));
                tx = watching ? model.x : C;
                ty = watching ? model.y : C;
                /* Keep a little memory in the camera: a random-walk step is
                   visible as motion through the frame, not a recentering of
                   the world around a stationary dot. */
                tx = .82 * tx + .18 * C;
                ty = .82 * ty + .18 * C;
            }
            const a = snap ? 1 : .22;
            camX += (tx - camX) * a; camY += (ty - camY) * a;
            camX = Math.max(hw, Math.min(N - hw, camX));
            camY = Math.max(hw, Math.min(N - hw, camY));
            return { hw: hw, x0: camX - hw, y0: camY - hw };
        }

        function draw() {
            const g = windowGeometry(false), hw = g.hw, scale = W / (2 * hw);
            const offX = g.x0, offY = g.y0;
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, W);
            model.offCtx.putImageData(model.img, 0, 0);
            ctx.imageSmoothingEnabled = scale < 1;
            ctx.drawImage(model.off, offX, offY, 2 * hw, 2 * hw, 0, 0, W, W);

            if (scale >= 18) {
                ctx.beginPath();
                for (let q = 0; q <= 2 * hw; q++) {
                    const x = q * scale;
                    ctx.moveTo(x, 0); ctx.lineTo(x, W);
                    ctx.moveTo(0, x); ctx.lineTo(W, x);
                }
                ctx.strokeStyle = 'rgba(95,89,104,.26)';
                ctx.lineWidth = Math.max(1.2, W / 1000);
                ctx.stroke();
            }

            if (watching && model.path.length > 1) {
                function route() {
                    ctx.beginPath();
                    for (let q = 0; q < model.path.length; q++) {
                        const pi = model.path[q], px = pi % N, py = (pi - px) / N;
                        const x = (px - offX + .5) * scale, y = (py - offY + .5) * scale;
                        if (!q) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                }
                route(); ctx.strokeStyle = '#08070B'; ctx.lineWidth = Math.max(8, scale * .22); ctx.stroke();
                route(); ctx.strokeStyle = '#A8D8E8'; ctx.lineWidth = Math.max(4, scale * .10); ctx.stroke();
            }

            /* the walker is drawn while it is watched; in Grow it would be a
               dot at a different site every frame */
            if (!model.done && watching) {
                const current = model.y * N + model.x;
                if (!model.filled[current]) {
                    ctx.strokeStyle = '#F0E442'; ctx.lineWidth = Math.max(2, scale * .06);
                    ctx.strokeRect((model.x - offX) * scale, (model.y - offY) * scale, scale, scale);
                }
                ctx.beginPath();
                ctx.arc((model.x - offX + .5) * scale,
                        (model.y - offY + .5) * scale,
                        Math.max(10, Math.min(16, scale * .28)), 0, Math.PI * 2);
                ctx.fillStyle = '#FFF8E8';
                ctx.fill();
                ctx.strokeStyle = '#08070B'; ctx.lineWidth = 3; ctx.stroke();
            }
        }

        function update() {
            elCount.textContent = nf.format(model.count);
            elSteps.textContent = nf.format(model.steps);
            elWidth.textContent =
                Math.max(0, model.maxR - inRadius(model)).toFixed(1);
            elRadius.textContent = model.maxR.toFixed(1);
        }

        function label() {
            if (model.done) {
                note.textContent = 'Boundary reached';
            } else if (!watching) {
                note.textContent = '';
            } else if (!model.filled[model.y * N + model.x]) {
                note.textContent = 'First empty site';
            } else {
                note.textContent = 'Walk';
            }
        }

        function budget() {
            return Math.min(CAP, Math.max(1, Math.round(RATE * model.steps)));
        }

        function tick() {
            advanceOne(model);
            draw(); update(); label();
            return !model.done;
        }

        function frame() {
            watching = false;
            advance(model, budget());
            draw(); update(); label();
            return !model.done;
        }

        function finishNow() {
            draw(); update(); label();
        }

        const clock = paced({
            watch: WATCH, every: EVERY, tick: tick,
            frame: frame, finish: finishNow
        });

        function reset() {
            clock.stop();
            model = makeModel();
            watching = uiPace === 'watch';
            camX = camY = C;
            clock.slow(watching ? WATCH : 0);
            draw(); update();
            note.textContent = 'Release';
            uiPaused = REDUCED;
            syncControls();
        }

        function syncControls() {
            $$('[data-idla-pace]').forEach(function (b) {
                const on = b.dataset.idlaPace === uiPace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-idla-view]').forEach(function (b) {
                const on = b.dataset.idlaView === uiView;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-idla-run="pause"]');
            if (play) {
                play.textContent = uiPaused ? 'Play' : 'Pause';
                play.classList.toggle('is-on', !uiPaused);
                play.setAttribute('aria-pressed', String(!uiPaused));
            }
        }

        function runCurrent() {
            if (REDUCED || model.done) return;
            watching = uiPace === 'watch';
            clock.stop(); clock.slow(watching ? WATCH : 0);
            uiPaused = false; syncControls(); clock.start();
        }

        $$('[data-idla-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                uiPace = b.dataset.idlaPace;
                watching = uiPace === 'watch';
                if (model.done) { reset(); if (!REDUCED) runCurrent(); return; }
                if (!watching) model.path.length = 0;
                if (uiPaused || REDUCED) { clock.stop(); clock.slow(watching ? WATCH : 0); }
                else runCurrent();
                label(); draw(); syncControls();
            });
        });
        $$('[data-idla-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                uiView = b.dataset.idlaView;
                windowGeometry(true); draw(); syncControls();
            });
        });
        $$('[data-idla-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const action = b.dataset.idlaRun;
                if (action === 'pause') {
                    if (uiPaused) runCurrent();
                    else { uiPaused = true; clock.stop(); note.textContent = 'Paused'; syncControls(); }
                }
                if (action === 'step') {
                    uiPaused = true; clock.stop(); watching = true;
                    advanceOne(model); draw(); update(); label(); syncControls();
                }
                if (action === 'reset') {
                    reset();
                    if (!REDUCED) runCurrent();
                }
            });
        });

        reset();
        if (!REDUCED) runCurrent();
        return {
            pause: function () { clock.stop(); },
            resume: function () {
                if (!REDUCED && !uiPaused && !model.done && !clock.running()) runCurrent();
            }
        };
    };
    /* Kept live while the new single-stage IDLA instrument is developed. */
    makers.aggregation = makers.aggregationLegacy;

    /* Rotor-router aggregation is deliberately not built on the IDLA maker.
       Every rotor starts east. At an occupied site the particle turns it
       clockwise, follows the new arrow, and stops at the first empty site.
       Watch and Grow call the same transition; Watch only interpolates its
       presentation so the changed arrow remains visible. */
    makers.rotoraggregation = function () {
        const canvas = $('#rotoragg-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width;
        const N = 141, C = N >> 1, SZ = N * N;
        const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
        const DIR = ['#A8D8E8', '#E69F00', '#C9BFA8', '#8E4257'];
        const DIR_RGB = [[86,180,233], [230,159,0], [0,158,115], [204,121,167]];
        const WATCH_MS = 720, SETTLE_MS = 360;
        const note = $('#rotoragg-note'), outParticles = $('#rotoragg-particles');
        const outSteps = $('#rotoragg-steps'), outTouched = $('#rotoragg-sites');
        const outRadius = $('#rotoragg-radius'), outWidth = $('#rotoragg-error');

        const rOf = new Float32Array(SZ), byR = new Int32Array(SZ);
        (function () {
            const a = [];
            for (let i = 0; i < SZ; i++) {
                const gx = i % N, gy = (i - gx) / N;
                rOf[i] = Math.hypot(gx - C, gy - C); a.push(i);
            }
            a.sort(function (x, y) { return rOf[x] - rOf[y]; });
            for (let i = 0; i < SZ; i++) byR[i] = a[i];
        })();

        const off = document.createElement('canvas');
        off.width = off.height = N;
        const offCtx = off.getContext('2d');
        let occupied, rotor, touched, particles, steps, touchedCount, maxR, inPtr;
        let x, y, done, path, lastPath, lastPathAt, settlePending;
        let pace = 'grow', view = 'whole', viewTouched = false, userPaused = false;
        let running = false, raf = 0, delay = 0, anim = null;
        let viewCx = C, viewCy = C, viewHalf = 9.5;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function ease(v) {
            v = clamp(v, 0, 1);
            return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
        }
        function backingPerCss() {
            const css = canvas.getBoundingClientRect().width;
            return css ? W / css : 2;
        }
        function cssScale(scale) { return scale / backingPerCss(); }
        function followHalf() {
            return canvas.getBoundingClientRect().width <= 500 ? 7.5 : 9.5;
        }
        function paintSite(i) {
            const gx = i % N, gy = (i - gx) / N;
            if (!occupied[i]) { offCtx.clearRect(gx, gy, 1, 1); return; }
            const c = DIR_RGB[rotor[i]], a = 1;
            offCtx.fillStyle = 'rgb(' +
                Math.round(15 + (c[0] - 15) * a) + ',' +
                Math.round(14 + (c[1] - 14) * a) + ',' +
                Math.round(19 + (c[2] - 19) * a) + ')';
            offCtx.fillRect(gx, gy, 1, 1);
        }
        function innerRadius() {
            while (inPtr < SZ && occupied[byR[inPtr]]) inPtr++;
            return inPtr < SZ ? rOf[byR[inPtr]] : maxR;
        }
        function settle(now) {
            const i = y * N + x;
            if (occupied[i]) return;
            occupied[i] = 1; particles++;
            maxR = Math.max(maxR, rOf[i]); paintSite(i);
            lastPath = path.slice(); lastPathAt = now || performance.now();
            path = [C * N + C]; x = C; y = C; settlePending = false;
            if (maxR >= C - 3) done = true;
        }
        function makeMotion() {
            if (done || settlePending) return null;
            const i = y * N + x, oldDir = rotor[i], newDir = (oldDir + 1) & 3;
            return {
                fromX: x, fromY: y, toX: x + DX[newDir], toY: y + DY[newDir],
                oldDir: oldDir, newDir: newDir, progress: 0
            };
        }
        function commitMotion(m) {
            const from = m.fromY * N + m.fromX;
            rotor[from] = m.newDir;
            if (!touched[from]) { touched[from] = 1; touchedCount++; }
            paintSite(from);
            x = m.toX; y = m.toY; steps++;
            path.push(y * N + x);
            if (x < 2 || y < 2 || x > N - 3 || y > N - 3) done = true;
            settlePending = !occupied[y * N + x];
        }
        function finishPresentation(now) {
            if (anim) { commitMotion(anim); anim = null; }
            if (settlePending) settle(now);
        }
        function stepImmediate() {
            if (done) return false;
            if (settlePending) { settle(performance.now()); return true; }
            const m = makeMotion();
            if (!m) return false;
            commitMotion(m);
            if (settlePending) settle(performance.now());
            return !done;
        }
        function growForFrame() {
            const began = performance.now();
            let moved = 0, target = Math.min(50000, Math.max(64, particles * 5));
            while (!done && moved < target && performance.now() - began < 7) {
                stepImmediate(); moved++;
            }
        }
        function walkerPosition() {
            if (!anim) return { x: x, y: y };
            const m = ease((anim.progress - .42) / .40);
            return {
                x: anim.fromX + (anim.toX - anim.fromX) * m,
                y: anim.fromY + (anim.toY - anim.fromY) * m
            };
        }
        function cameraTarget() {
            if (view === 'follow') {
                const q = walkerPosition();
                return { x: q.x, y: q.y, h: followHalf() };
            }
            return { x: C, y: C, h: Math.max(followHalf(), maxR + 4) };
        }
        function moveCamera(force) {
            const q = cameraTarget(), a = force ? 1 : (view === 'follow' ? .28 : .14);
            viewCx += (q.x - viewCx) * a;
            viewCy += (q.y - viewCy) * a;
            viewHalf += (q.h - viewHalf) * (force ? 1 : .13);
            viewCx = clamp(viewCx, viewHalf, N - viewHalf);
            viewCy = clamp(viewCy, viewHalf, N - viewHalf);
        }
        function addArrow(cx, cy, d, reach) {
            const ux = DX[d], uy = DY[d], px = -uy, py = ux;
            const tx = cx + ux * reach, ty = cy + uy * reach;
            ctx.moveTo(cx - ux * reach * .62, cy - uy * reach * .62);
            ctx.lineTo(tx, ty);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * reach * .38 + px * reach * .25,
                       ty - uy * reach * .38 + py * reach * .25);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - ux * reach * .38 - px * reach * .25,
                       ty - uy * reach * .38 - py * reach * .25);
        }
        function strokeArrow(cx, cy, angle, reach, colour, width) {
            const ux = Math.cos(angle), uy = Math.sin(angle), px = -uy, py = ux;
            const tx = cx + ux * reach, ty = cy + uy * reach;
            function pathArrow() {
                ctx.beginPath();
                ctx.moveTo(cx - ux * reach * .62, cy - uy * reach * .62);
                ctx.lineTo(tx, ty);
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - ux * reach * .38 + px * reach * .25,
                           ty - uy * reach * .38 + py * reach * .25);
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - ux * reach * .38 - px * reach * .25,
                           ty - uy * reach * .38 - py * reach * .25);
            }
            pathArrow(); ctx.strokeStyle = '#08070B'; ctx.lineWidth = width + 5; ctx.stroke();
            pathArrow(); ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.stroke();
        }
        function drawGrid(scale, offX, offY, hw) {
            if (cssScale(scale) < 11) return;
            ctx.beginPath();
            const lx = Math.floor(offX), ly = Math.floor(offY);
            for (let q = lx; q <= Math.ceil(offX + 2 * hw); q++) {
                const z = (q - offX) * scale; ctx.moveTo(z, 0); ctx.lineTo(z, W);
            }
            for (let q = ly; q <= Math.ceil(offY + 2 * hw); q++) {
                const z = (q - offY) * scale; ctx.moveTo(0, z); ctx.lineTo(W, z);
            }
            ctx.strokeStyle = 'rgba(58,53,66,.72)'; ctx.lineWidth = Math.max(1, backingPerCss() * .55);
            ctx.stroke();
        }
        function drawFieldArrows(scale, offX, offY, hw, activeIndex) {
            const loX = Math.max(0, Math.floor(offX)), hiX = Math.min(N - 1, Math.ceil(offX + 2 * hw));
            const loY = Math.max(0, Math.floor(offY)), hiY = Math.min(N - 1, Math.ceil(offY + 2 * hw));
            const reach = scale * .28, ratio = backingPerCss();
            const focusX = activeIndex % N;
            const focusY = (activeIndex - focusX) / N;
            ctx.lineCap = ctx.lineJoin = 'round';
            for (let gy = loY; gy <= hiY; gy++) {
                for (let gx = loX; gx <= hiX; gx++) {
                    if (Math.abs(gx - focusX) > 1 || Math.abs(gy - focusY) > 1) continue;
                    const i = gy * N + gx;
                    if (i === activeIndex) continue;
                    ctx.beginPath();
                    addArrow((gx - offX + .5) * scale, (gy - offY + .5) * scale,
                             rotor[i], reach);
                    ctx.strokeStyle = '#08070B'; ctx.lineWidth = Math.max(3.2 * ratio, scale * .13); ctx.stroke();
                    ctx.beginPath();
                    addArrow((gx - offX + .5) * scale, (gy - offY + .5) * scale,
                             rotor[i], reach);
                    ctx.strokeStyle = occupied[i] ? DIR[rotor[i]] : 'rgba(163,154,140,.48)';
                    ctx.lineWidth = Math.max(1.35 * ratio, scale * .055); ctx.stroke();
                }
            }
        }
        /* The current particle's route: a translucent tint on the cells it
           has crossed and a hairline through its last sixty steps. The old
           lattice of bright outlines hid the field it was meant to explain. */
        function drawRoute(points, offX, offY, scale, alpha, includeWalker) {
            if (!points || !points.length) return;
            const from = Math.max(0, points.length - 400);
            ctx.fillStyle = 'rgba(255,255,255,' + (.16 * alpha).toFixed(3) + ')';
            for (let q = from; q < points.length; q++) {
                const i = points[q], gx = i % N, gy = (i - gx) / N;
                ctx.fillRect((gx - offX) * scale, (gy - offY) * scale, scale, scale);
            }
            const start = Math.max(0, points.length - 60);
            ctx.beginPath();
            for (let q = start; q < points.length; q++) {
                const i = points[q], gx = i % N, gy = (i - gx) / N;
                const px = (gx - offX + .5) * scale, py = (gy - offY + .5) * scale;
                if (q === start) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            if (includeWalker && anim) {
                const w = walkerPosition();
                ctx.lineTo((w.x - offX + .5) * scale, (w.y - offY + .5) * scale);
            }
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(8,7,11,' + (.6 * alpha).toFixed(3) + ')';
            ctx.lineWidth = Math.max(3.4, scale * .1); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,248,232,' + (.85 * alpha).toFixed(3) + ')';
            ctx.lineWidth = Math.max(1.6, scale * .045); ctx.stroke();
        }
        function drawMicroscope() {
            const ratio = backingPerCss(), size = Math.min(W * .31, 160 * ratio);
            const px = W - size - 12 * ratio, py = 12 * ratio, pad = 10 * ratio;
            const cell = (size - 2 * pad) / 5;
            const cx0 = anim ? anim.fromX : x, cy0 = anim ? anim.fromY : y;
            ctx.fillStyle = 'rgba(23,21,28,.97)'; ctx.fillRect(px, py, size, size);
            ctx.strokeStyle = 'rgba(255,248,232,.45)'; ctx.lineWidth = ratio;
            ctx.strokeRect(px, py, size, size);
            for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
                const gx = cx0 + col - 2, gy = cy0 + row - 2, i = gy * N + gx;
                const sx = px + pad + col * cell, sy = py + pad + row * cell;
                if (occupied[i]) {
                    ctx.globalAlpha = .28; ctx.fillStyle = DIR[rotor[i]];
                    ctx.fillRect(sx, sy, cell, cell); ctx.globalAlpha = 1;
                }
                const angle = Math.atan2(DY[rotor[i]], DX[rotor[i]]);
                strokeArrow(sx + cell / 2, sy + cell / 2, angle, cell * .28,
                            occupied[i] ? DIR[rotor[i]] : 'rgba(163,154,140,.55)',
                            Math.max(1.2 * ratio, cell * .06));
            }
        }
        function draw() {
            moveCamera(false);
            const hw = viewHalf, scale = W / (2 * hw);
            const offX = viewCx - hw, offY = viewCy - hw;
            const legible = cssScale(scale) >= 7.5;
            ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            ctx.imageSmoothingEnabled = cssScale(scale) < 1;
            ctx.drawImage(off, offX, offY, 2 * hw, 2 * hw, 0, 0, W, W);
            drawGrid(scale, offX, offY, hw);

            const activeX = anim ? anim.fromX : x, activeY = anim ? anim.fromY : y;
            const activeIndex = activeY * N + activeX;
            if (legible) drawFieldArrows(scale, offX, offY, hw, activeIndex);
            const age = Math.max(0, 1 - (performance.now() - lastPathAt) / 250);
            if (age) drawRoute(lastPath, offX, offY, scale, age * .5, false);
            drawRoute(path, offX, offY, scale, 1, true);

            const targetX = anim ? anim.toX : x, targetY = anim ? anim.toY : y;
            const targetEmpty = !occupied[targetY * N + targetX];
            if (settlePending && targetEmpty) {
                ctx.strokeStyle = '#F0E442'; ctx.lineWidth = Math.max(3, scale * .06);
                ctx.strokeRect((targetX - offX) * scale, (targetY - offY) * scale, scale, scale);
            }

            if (!settlePending && occupied[activeIndex] && legible) {
                let angle = Math.atan2(DY[rotor[activeIndex]], DX[rotor[activeIndex]]);
                if (anim) {
                    const turn = ease(anim.progress / .42);
                    const old = Math.atan2(DY[anim.oldDir], DX[anim.oldDir]);
                    angle = old + Math.PI * .5 * turn;
                    strokeArrow((activeX - offX + .5) * scale,
                                (activeY - offY + .5) * scale,
                                old, scale * .31, 'rgba(255,248,232,.28)',
                                Math.max(2, scale * .035));
                }
                strokeArrow((activeX - offX + .5) * scale,
                            (activeY - offY + .5) * scale,
                            angle, scale * .33, '#F0E442', Math.max(4, scale * .072));
            }

            const w = walkerPosition(), wx = (w.x - offX + .5) * scale;
            const wy = (w.y - offY + .5) * scale;
            ctx.beginPath(); ctx.arc(wx, wy, Math.max(9, Math.min(15, scale * .28)), 0, Math.PI * 2);
            ctx.fillStyle = '#FFF8E8'; ctx.fill();
            ctx.strokeStyle = '#08070B'; ctx.lineWidth = 3; ctx.stroke();
            update();
        }
        function update() {
            if (outParticles) outParticles.textContent = nf.format(particles);
            if (outSteps) outSteps.textContent = nf.format(steps);
            if (outTouched) outTouched.textContent = nf.format(touchedCount);
            if (outRadius) outRadius.textContent = maxR.toFixed(1);
            if (outWidth) outWidth.textContent = Math.max(0, maxR - innerRadius()).toFixed(1);
            if (note) {
                if (done) note.textContent = 'Finite-board boundary reached';
                else if (settlePending) note.textContent = 'First empty site';
                else if (anim && anim.progress < .42) note.textContent = 'Turn';
                else if (anim) note.textContent = 'Move';
                else note.textContent = pace === 'grow' ? '' : 'Turn';
            }
        }
        function syncControls() {
            $$('[data-ragg-pace]').forEach(function (b) {
                const on = b.dataset.raggPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-ragg-view]').forEach(function (b) {
                const on = b.dataset.raggView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-ragg-run="pause"]');
            if (play) {
                play.textContent = userPaused ? 'Play' : 'Pause';
                play.classList.toggle('is-on', !userPaused);
                play.setAttribute('aria-pressed', String(!userPaused));
            }
        }
        function stop(markUser) {
            running = false; cancelAnimationFrame(raf); raf = 0;
            clearTimeout(delay); delay = 0;
            if (markUser) userPaused = true;
            syncControls();
        }
        function afterWatchBeat() {
            if (!running) return;
            delay = setTimeout(function () { delay = 0; watchBeat(); }, 115);
        }
        function animateCurrent() {
            if (!anim) return;
            let began = performance.now() - anim.progress * WATCH_MS;
            function frame(now) {
                if (!running || pace !== 'watch') { raf = 0; return; }
                anim.progress = clamp((now - began) / WATCH_MS, 0, 1);
                draw();
                if (anim.progress < 1) { raf = requestAnimationFrame(frame); return; }
                const m = anim; anim = null; commitMotion(m); draw();
                if (done) { stop(false); return; }
                afterWatchBeat();
            }
            raf = requestAnimationFrame(frame);
        }
        function watchBeat() {
            if (!running || pace !== 'watch' || done) return;
            if (settlePending) {
                draw();
                delay = setTimeout(function () {
                    delay = 0; settle(performance.now()); draw(); afterWatchBeat();
                }, SETTLE_MS);
                return;
            }
            if (!anim) anim = makeMotion();
            if (!anim) { stop(false); return; }
            animateCurrent();
        }
        function growFrame() {
            if (!running || pace !== 'grow') { raf = 0; return; }
            growForFrame(); draw();
            if (done) { stop(false); return; }
            raf = requestAnimationFrame(growFrame);
        }
        function run() {
            if (REDUCED || running || done) return;
            running = true; userPaused = false; syncControls();
            if (pace === 'watch') {
                if (anim) animateCurrent(); else watchBeat();
            } else {
                finishPresentation(performance.now());
                raf = requestAnimationFrame(growFrame);
            }
        }
        function reset() {
            stop(false);
            occupied = new Uint8Array(SZ); rotor = new Uint8Array(SZ);
            touched = new Uint8Array(SZ); offCtx.clearRect(0, 0, N, N);
            particles = steps = touchedCount = 0; maxR = 0; inPtr = 0;
            x = C; y = C; done = false; path = []; lastPath = []; lastPathAt = -Infinity;
            settlePending = false; anim = null;
            occupied[C * N + C] = 1; particles = 1; paintSite(C * N + C);
            path = [C * N + C];
            viewCx = viewCy = C; viewHalf = followHalf();
            userPaused = REDUCED; moveCamera(true); draw(); syncControls();
        }

        $$('[data-ragg-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                const wasPaused = userPaused;
                stop(false);
                if (anim) finishPresentation(performance.now());
                pace = b.dataset.raggPace;
                if (!viewTouched) view = pace === 'watch' ? 'follow' : 'whole';
                userPaused = REDUCED || wasPaused; moveCamera(true); draw(); syncControls();
                if (!userPaused) run();
            });
        });
        $$('[data-ragg-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.raggView; viewTouched = true;
                moveCamera(true); draw(); syncControls();
            });
        });
        $$('[data-ragg-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const action = b.dataset.raggRun;
                if (action === 'pause') {
                    if (running) { stop(true); if (note) note.textContent = 'Paused'; }
                    else { userPaused = false; run(); }
                }
                if (action === 'step') {
                    const completing = !!anim || settlePending;
                    stop(true); finishPresentation(performance.now());
                    if (!completing) stepImmediate();
                    draw(); syncControls();
                }
                if (action === 'reset') { reset(); if (!REDUCED) run(); }
            });
        });

        reset();
        if (!REDUCED) run();
        return {
            pause: function () { stop(false); },
            resume: function () { if (!REDUCED && !userPaused) run(); }
        };
    };

    /* ---- Diffusion-limited aggregation ----

       This is not a second simulation and it does not invent a walk that was
       never recorded.  p-dla-growth.bin is the attachment order from the
       exact /tmp/dla.ord run used to bake p-dla-void.png.  Each commit copies
       that site's colour from the published plate, so the completed reveal is
       the plate itself.  In Watch mode the only event we can honestly show is
       the recorded one: an empty site touches an occupied neighbour, then
       sticks. */
    makers.dla = function () {
        const canvas = $('#dla-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width;
        const note = $('#dla-note'), outN = $('#dla-particles');
        const outRadius = $('#dla-radius'), outSlope = $('#dla-slope');
        const outView = $('#dla-view-width');

        let meta = null, coords = null, source = null, sourcePixels = null;
        let layer = null, layerCtx = null, occupied = null;
        let ready = false, count = 0, radius = 0, contact = -1;
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        let pace = 'grow', view = 'whole', viewTouched = false;
        let phase = 'contact', phaseUntil = 0;
        let running = false, userPaused = false, pageAwake = true;
        let raf = 0, lastFrame = 0;
        let square = 0, padX = 0, padY = 0;
        const cam = { x: 0, y: 0, h: 28 };
        const styleCache = Object.create(null);

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function backingPerCss() {
            const css = canvas.getBoundingClientRect().width;
            return css ? W / css : 2;
        }
        function point(k) {
            return { x: coords[2 * k], y: coords[2 * k + 1] };
        }
        function layerPoint(k) {
            const q = point(k);
            return { x: q.x + padX, y: q.y + padY };
        }
        function indexOf(x, y) { return y * meta.width + x; }
        function nextContact() {
            if (!ready || count >= meta.count) return -1;
            const q = point(count);
            const nx = [q.x + 1, q.x - 1, q.x, q.x];
            const ny = [q.y, q.y, q.y + 1, q.y - 1];
            let best = -1, bestBirth = Infinity;
            for (let d = 0; d < 4; d++) {
                if (nx[d] < 0 || ny[d] < 0 || nx[d] >= meta.width || ny[d] >= meta.height) continue;
                const birth = occupied[indexOf(nx[d], ny[d])];
                if (birth && birth < bestBirth) {
                    bestBirth = birth; best = indexOf(nx[d], ny[d]);
                }
            }
            return best;
        }
        function sourceStyle(x, y) {
            const p = 4 * indexOf(x, y);
            let r = sourcePixels[p], g = sourcePixels[p + 1], b = sourcePixels[p + 2];
            /* the plate's darkest violet vanished on the dark stage: the trunk
               is lifted toward the ramp's first stop so it stays legible under
               the bright tips */
            const L = .3 * r + .59 * g + .11 * b;
            if (L < 96) {
                const k = .42 * (1 - L / 96);
                r = Math.round(r + (124 - r) * k); g = Math.round(g + (111 - g) * k); b = Math.round(b + (191 - b) * k);
            }
            const key = (r << 16) | (g << 8) | b;
            if (!styleCache[key]) styleCache[key] = 'rgb(' + r + ',' + g + ',' + b + ')';
            return styleCache[key];
        }
        function commitOne() {
            if (!ready || count >= meta.count) return false;
            const q = point(count), lp = layerPoint(count);
            count++;
            occupied[indexOf(q.x, q.y)] = count;
            layerCtx.fillStyle = sourceStyle(q.x, q.y);
            layerCtx.fillRect(lp.x, lp.y, 1, 1);
            minX = Math.min(minX, lp.x); maxX = Math.max(maxX, lp.x);
            minY = Math.min(minY, lp.y); maxY = Math.max(maxY, lp.y);
            radius = Math.max(radius, Math.hypot(q.x - meta.centre[0], q.y - meta.centre[1]));
            contact = nextContact();
            return true;
        }
        function wholeTarget() {
            const h = clamp(Math.max(18, Math.max(maxX - minX, maxY - minY) * .53 + 8), 18, square / 2);
            return {
                x: clamp((minX + maxX) / 2, h, square - h),
                y: clamp((minY + maxY) / 2, h, square - h),
                h: h
            };
        }
        function tipHalf() {
            return canvas.getBoundingClientRect().width <= 500 ? 6.5 : 7.5;
        }
        function cameraTarget() {
            if (view === 'whole') return wholeTarget();
            let k = phase === 'contact' && count < meta.count ? count : Math.max(0, count - 1);
            const q = layerPoint(k), h = tipHalf();
            return { x: clamp(q.x + .5, h, square - h),
                     y: clamp(q.y + .5, h, square - h), h: h };
        }
        function moveCamera(snap) {
            if (!ready) return;
            const q = cameraTarget(), a = snap ? 1 : (view === 'tip' ? .16 : .11);
            cam.x += (q.x - cam.x) * a;
            cam.y += (q.y - cam.y) * a;
            cam.h = Math.exp(Math.log(cam.h) + (Math.log(q.h) - Math.log(cam.h)) * a);
            cam.h = clamp(cam.h, 4.5, square / 2);
            cam.x = clamp(cam.x, cam.h, square - cam.h);
            cam.y = clamp(cam.y, cam.h, square - cam.h);
        }
        function screenPoint(x, y) {
            const scale = W / (2 * cam.h);
            return [(x - (cam.x - cam.h)) * scale, (y - (cam.y - cam.h)) * scale];
        }
        function outlineCell(x, y, colour, inset, width) {
            const scale = W / (2 * cam.h), q = screenPoint(x, y);
            ctx.strokeStyle = colour; ctx.lineWidth = width;
            ctx.strokeRect(q[0] + inset, q[1] + inset,
                           Math.max(1, scale - 2 * inset), Math.max(1, scale - 2 * inset));
        }
        function drawHighlight(now) {
            if (count >= meta.count) return;
            const q = layerPoint(count), scale = W / (2 * cam.h);
            const s = screenPoint(q.x, q.y);
            outlineCell(q.x, q.y, '#F0E442', Math.max(2, scale * .05),
                        Math.max(4, backingPerCss() * 2));
            if (contact >= 0) {
                const cx = contact % meta.width + padX;
                const cy = (contact / meta.width | 0) + padY;
                const a = screenPoint(q.x + .5, q.y + .5), b = screenPoint(cx + .5, cy + .5);
                ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
                ctx.strokeStyle = '#08070B'; ctx.lineWidth = Math.max(8, backingPerCss() * 4); ctx.stroke();
                ctx.strokeStyle = '#FFF8E8'; ctx.lineWidth = Math.max(3, backingPerCss() * 1.5); ctx.stroke();
                outlineCell(cx, cy, '#FFF8E8', Math.max(4, scale * .16),
                            Math.max(3, backingPerCss() * 1.5));
            }
        }
        function drawTipGrid() {
            if (view !== 'tip') return;
            const scale = W / (2 * cam.h);
            const x0 = Math.floor(cam.x - cam.h), x1 = Math.ceil(cam.x + cam.h);
            const y0 = Math.floor(cam.y - cam.h), y1 = Math.ceil(cam.y + cam.h);
            ctx.beginPath();
            for (let x = x0; x <= x1; x++) {
                const q = screenPoint(x, 0)[0]; ctx.moveTo(q, 0); ctx.lineTo(q, W);
            }
            for (let y = y0; y <= y1; y++) {
                const q = screenPoint(0, y)[1]; ctx.moveTo(0, q); ctx.lineTo(W, q);
            }
            ctx.strokeStyle = 'rgba(58,53,66,.42)';
            ctx.lineWidth = Math.max(1, backingPerCss() * .5); ctx.stroke();
            void scale;
        }
        function updateReadout() {
            if (outN) outN.textContent = nf.format(count);
            if (outRadius) outRadius.textContent = radius.toFixed(1);
            let stat = null;
            if (meta) for (let i = 0; i < meta.stats.length; i++) {
                if (meta.stats[i].n > count) break;
                if (meta.stats[i].slope !== null) stat = meta.stats[i];
            }
            if (outSlope) outSlope.textContent = stat ? stat.slope.toFixed(3) : '\u2014';
            if (outView) outView.textContent = nf.format(Math.round(2 * cam.h));
            if (note) {
                if (!ready) note.textContent = 'Loading run';
                else if (count >= meta.count) note.textContent = 'Complete';
                else if (!running && userPaused) note.textContent = 'Paused';
                else if (pace === 'grow') note.textContent = '';
                else note.textContent = phase === 'contact' ? 'Contact with cluster' : 'Attach at first contact';
            }
        }
        function draw(now) {
            ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            if (!ready) { updateReadout(); return; }
            moveCamera(false);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(layer, cam.x - cam.h, cam.y - cam.h, 2 * cam.h, 2 * cam.h,
                          0, 0, W, W);
            drawTipGrid();
            if (pace === 'watch') {
                if (phase === 'contact') drawHighlight(now || performance.now());
            }
            updateReadout();
        }
        function syncControls() {
            $$('[data-dla-pace]').forEach(function (b) {
                const on = b.dataset.dlaPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-dla-view]').forEach(function (b) {
                const on = b.dataset.dlaView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-dla-run="pause"]');
            if (play) {
                play.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                play.classList.toggle('is-on', running);
                play.setAttribute('aria-pressed', String(running));
            }
            $$('[data-dla-run]').forEach(function (b) {
                b.disabled = !ready || REDUCED;
            });
        }
        function stop(markUser) {
            running = false; cancelAnimationFrame(raf); raf = 0; lastFrame = 0;
            if (markUser) userPaused = true;
            syncControls();
        }
        function growBatch() {
            const began = performance.now();
            /* A logarithmic reveal, but slow enough that the 60,000-point
               branching geometry develops on screen instead of appearing as
               a completed plate after only a few frames. */
            const target = Math.min(520, Math.max(12, Math.floor((count + 100) / 420)));
            let made = 0;
            while (count < meta.count && made < target && performance.now() - began < 7) {
                commitOne(); made++;
            }
        }
        function frame(now) {
            if (!running || !ready) return;
            if (pace === 'grow') growBatch();
            else {
                if (!phaseUntil) phaseUntil = now + 460;
                if (now >= phaseUntil) {
                    if (phase === 'contact') {
                        commitOne(); phase = 'stick'; phaseUntil = now + 320;
                    } else {
                        phase = 'contact'; contact = nextContact(); phaseUntil = now + 460;
                    }
                }
            }
            draw(now);
            if (count >= meta.count) {
                stop(false); moveCamera(true); draw(now); return;
            }
            lastFrame = now; raf = requestAnimationFrame(frame);
        }
        function run() {
            if (!ready || REDUCED || running || count >= meta.count || !pageAwake) return;
            running = true; userPaused = false; phaseUntil = 0;
            syncControls(); raf = requestAnimationFrame(frame);
        }
        function clearLayer() {
            layerCtx.fillStyle = '#15131A'; layerCtx.fillRect(0, 0, square, square);
        }
        function reset(play) {
            if (!ready) return;
            stop(false); clearLayer(); occupied.fill(0);
            count = 0; radius = 0; contact = -1; phase = 'contact'; phaseUntil = 0;
            const seed = layerPoint(0);
            minX = maxX = seed.x; minY = maxY = seed.y;
            commitOne(); contact = nextContact();
            cam.x = seed.x + .5; cam.y = seed.y + .5; cam.h = tipHalf();
            moveCamera(true); userPaused = REDUCED || !play; draw(performance.now()); syncControls();
            if (play && !REDUCED) run();
        }
        function finishReduced() {
            while (count < meta.count) commitOne();
            view = 'whole'; phase = 'stick'; userPaused = true;
            moveCamera(true); draw(performance.now()); syncControls();
        }

        $$('[data-dla-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                const wasPaused = userPaused;
                stop(false); pace = b.dataset.dlaPace;
                /* a completed run has nothing left to watch: start it again */
                if (ready && count >= meta.count) {
                    if (!viewTouched) view = pace === 'watch' ? 'tip' : 'whole';
                    reset(!REDUCED); return;
                }
                if (!viewTouched) view = pace === 'watch' ? 'tip' : 'whole';
                phase = 'contact'; contact = nextContact(); phaseUntil = 0;
                userPaused = REDUCED || wasPaused;
                moveCamera(true); draw(performance.now()); syncControls();
                if (!userPaused) run();
            });
        });
        $$('[data-dla-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.dlaView; viewTouched = true;
                moveCamera(true); draw(performance.now()); syncControls();
            });
        });
        $$('[data-dla-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ready || !meta || REDUCED) return;
                const action = b.dataset.dlaRun;
                if (action === 'pause') {
                    if (running) { stop(true); draw(performance.now()); }
                    else { userPaused = false; run(); }
                }
                if (action === 'step') {
                    stop(true);
                    if (count < meta.count) commitOne();
                    phase = 'stick'; phaseUntil = performance.now() + 320;
                    moveCamera(true); draw(performance.now()); syncControls();
                }
                if (action === 'replay') reset(!REDUCED);
            });
        });

        Promise.all([
            fetch('plates/p-dla-growth.json').then(function (r) {
                if (!r.ok) throw new Error('DLA metadata ' + r.status);
                return r.json();
            }),
            fetch('plates/p-dla-growth.bin').then(function (r) {
                if (!r.ok) throw new Error('DLA order ' + r.status);
                return r.arrayBuffer();
            }),
            loadImage('plates/p-dla-void.png')
        ]).then(function (parts) {
            meta = parts[0]; coords = new Uint16Array(parts[1]); source = parts[2];
            if (coords.length !== meta.count * 2) throw new Error('DLA order length mismatch');
            square = Math.max(meta.width, meta.height);
            padX = (square - meta.width) >> 1; padY = (square - meta.height) >> 1;
            layer = document.createElement('canvas'); layer.width = layer.height = square;
            layerCtx = layer.getContext('2d'); occupied = new Uint32Array(meta.width * meta.height);
            const src = document.createElement('canvas'); src.width = meta.width; src.height = meta.height;
            const sx = src.getContext('2d'); sx.drawImage(source, 0, 0);
            sourcePixels = sx.getImageData(0, 0, meta.width, meta.height).data;
            ready = true; reset(!REDUCED);
            if (REDUCED) finishReduced();
        }).catch(function (err) {
            console.warn('DLA attachment replay:', err);
            if (note) note.textContent = 'Run unavailable';
        });

        draw(performance.now()); syncControls();
        return {
            pause: function () { pageAwake = false; stop(false); },
            resume: function () {
                pageAwake = true;
                if (!REDUCED && ready && !userPaused) run();
            }
        };
    };
    /* ---------------- Research additions ---------------- */

    /* Theorem 1.1 of arXiv:2009.05968, rendered on one stage. The 3D central
       slice and the independent 2D process occupy the same pixels: cyan and
       rose can separate only if their integer states disagree; white is exact
       overlap. The computation is synchronous and uses the reflected orthant
       reduction from the earlier verification instrument below. */
    /* Dynamic dimensional reduction.
       A. Bou-Rabee, Comm. Math. Phys. 390 (2022) 933-958, arXiv:2009.05968.

       Fill a cube with six grains at every site and a square with four, and
       topple both in parallel. The claim is not about the final pile. At EVERY
       round, the sites firing on the cube's central plane are the sites firing
       on the square -- the same sites, at the same round, all the way to rest.

       The simulation is an octant with reflecting walls on the three coordinate
       planes, so z = 0 is the central plane and each panel is mirrored back to
       the full cross-section. Measured on this 34-cube: 1,295 rounds, and the
       central plane's firing set differs from the square's in 0 of them. The
       neighbouring plane z = 1 differs in 1,201 of the 1,295. That contrast is
       what the third lane of the strip is for -- without it "the slice agrees"
       has nothing to be surprising against. */
    /* Dynamic dimensional reduction.
       A. Bou-Rabee, Comm. Math. Phys. 390 (2022) 933-958, arXiv:2009.05968.

       Fill a cube with six grains at every site and a square with four, and
       topple both in parallel. The claim is not about the final pile. At EVERY
       round, the sites firing on the cube's central plane are the sites firing
       on the square -- the same sites, at the same round, all the way to rest.

       The simulation is an octant with reflecting walls on the three coordinate
       planes, so z = 0 is the central plane and each panel is mirrored back to
       the full cross-section. Measured on this 34-cube: 1,295 rounds, and the
       central plane's firing set differs from the square's in 0 of them. The
       neighbouring plane z = 1 differs in 1,201 of the 1,295. That contrast is
       what the third lane of the strip is for -- without it "the slice agrees"
       has nothing to be surprising against. */
    makers.dimredlive = function () {
        const canvas = $('#dimred-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const M = 34, M2 = M * M, M3 = M2 * M, D = M * 2;
        const mirror = new Int16Array(D);
        for (let i = 0; i < D; i++) mirror[i] = i < M ? M - 1 - i : i - M;

        /* heights as a ladder in luminance, not in hue alone: ink, deep slate,
           slate, brightened rose, cyan, cream. The site palette's rose and
           slate sit 8 luma apart, so a pile drawn on those two merges the
           moment it is scaled down; #C4718A opens that step to 57. */
        /* One luminance ladder for both piles, with the maximal stable height
           landing on the same mid blue in each, so a plane that agrees with the
           square also looks like it: the base of both panels is one colour and
           the cream firing set is the only bright thing. */
        const H3 = [[21,19,26],[27,36,52],[38,54,81],[49,80,111],[61,106,146],[77,134,173]];
        const H2 = [[21,19,26],[38,54,81],[61,106,146],[77,134,173]];
        const FIRE = 'rgba(255,248,232,.92)';
        const DISAGREE = '#E2C25A';

        const elRound = $('#dimred-round'), elFiring = $('#dimred-active'),
              elDiff = $('#dimred-diff'), elOther = $('#dimred-cube'),
              elZ = $('#dimred-zval'), slider = $('#dimred-z'),
              note = $('#dimred-note');

        let s3, s2, v3, v2, roundNo, done;
        let fire3, fire2;                       /* firing masks, this round */
        let glow3, glow2;                       /* last round's masks: a brief afterglow */
        let nFire, pace = 'watch', userPaused = false, pageAwake = true;
        let zPick = 0;                          /* the plane on show */

        /* How many sites each plane fired on that the square did not, or the
           other way about, summed over the run so far. One number per plane;
           the slider reads whichever plane is on show. */
        const totD = new Int32Array(M);
        const cntA = new Int32Array(M), inter = new Int32Array(M);

        const pan = document.createElement('canvas');
        pan.width = pan.height = D;
        const pctx = pan.getContext('2d');
        const pimg = pctx.createImageData(D, D);

        function reset() {
            s3 = new Int16Array(M3); s3.fill(6);
            s2 = new Int16Array(M2); s2.fill(4);
            v3 = new Uint32Array(M3); v2 = new Uint32Array(M2);
            fire3 = new Uint8Array(M3); fire2 = new Uint8Array(M2);
            glow3 = new Uint8Array(M3); glow2 = new Uint8Array(M2);
            roundNo = 0; done = false; nFire = 0;
            totD.fill(0);
            draw(); update();
        }

        /* One synchronous round of both piles. The square is toppled first so
           that the cube's pass can score every plane against it as it goes:
           |A_z \u0394 B| = |A_z| + |B| - 2|A_z \u2229 B|, which costs one test per
           firing site instead of a sweep of all 34 planes. */
        function roundOnce() {
            glow3.set(fire3); glow2.set(fire2);
            fire3.fill(0); fire2.fill(0);
            cntA.fill(0); inter.fill(0);
            const f2 = [];
            for (let i = 0; i < M2; i++) if (s2[i] >= 4) f2.push(i);
            const f3 = [];
            for (let i = 0; i < M3; i++) if (s3[i] >= 6) f3.push(i);
            if (!f3.length && !f2.length) { done = true; return false; }
            roundNo++;
            for (let k = 0; k < f2.length; k++) {
                const i = f2[k], x = i % M, y = (i / M) | 0;
                s2[i] -= 4; v2[i]++;
                s2[x === 0 ? i : i - 1]++; if (x < M - 1) s2[i + 1]++;
                s2[y === 0 ? i : i - M]++; if (y < M - 1) s2[i + M]++;
                fire2[i] = 1;
            }
            nFire = f2.length;
            for (let k = 0; k < f3.length; k++) {
                const i = f3[k], x = i % M, y = ((i / M) | 0) % M, z = (i / M2) | 0;
                s3[i] -= 6; v3[i]++;
                s3[x === 0 ? i : i - 1]++; if (x < M - 1) s3[i + 1]++;
                s3[y === 0 ? i : i - M]++; if (y < M - 1) s3[i + M]++;
                s3[z === 0 ? i : i - M2]++; if (z < M - 1) s3[i + M2]++;
                fire3[i] = 1;
                cntA[z]++;
                if (fire2[i - z * M2]) inter[z]++;
            }
            for (let z = 0; z < M; z++) totD[z] += cntA[z] + nFire - 2 * inter[z];
            return true;
        }

        /* a panel: the height pattern as ground, this round's firing over it */
        function panel(px, py, size, heights, table, fire, glow) {
            const d = pimg.data, top = table.length - 1;
            for (let yy = 0; yy < D; yy++) {
                for (let xx = 0; xx < D; xx++) {
                    const i = mirror[yy] * M + mirror[xx];
                    let v = heights[i]; v = v < 0 ? 0 : v > top ? top : v;
                    const c = table[v];
                    const j = (yy * D + xx) * 4;
                    d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
                }
            }
            pctx.putImageData(pimg, 0, 0);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(pan, px, py, size, size);
            const cell = size / D;
            if (glow) {
                ctx.fillStyle = 'rgba(255,248,232,.30)';
                for (let yy = 0; yy < D; yy++) for (let xx = 0; xx < D; xx++) {
                    const i = mirror[yy] * M + mirror[xx];
                    if (!glow[i] || fire[i]) continue;
                    ctx.fillRect(px + xx * cell, py + yy * cell, cell, cell);
                }
            }
            ctx.fillStyle = FIRE;
            for (let yy = 0; yy < D; yy++) for (let xx = 0; xx < D; xx++) {
                if (!fire[mirror[yy] * M + mirror[xx]]) continue;
                ctx.fillRect(px + xx * cell, py + yy * cell, cell, cell);
            }
            ctx.strokeStyle = 'rgba(201,191,168,.30)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px - .75, py - .75, size + 1.5, size + 1.5);
        }

        /* The cube, cut at the plane on show. What is drawn is the part of it
           from the central plane out to that height: the two outer faces the
           viewer can see carry the pile's real pattern on the boundary of the
           box, and the exposed top face IS the slice, the same array the left
           panel enlarges. At the centre the solid is flat and only the plane
           is there; drag outward and the cube grows under it. Clicking the
           cube picks a height, so the picture is also the control. */
        let cubeGeom = null;

        function cube(cx, cy, r) {
            const hz = zPick / (M - 1);
            const P = function (x, y, z) {
                return [cx + (x - y) * r, cy + (x + y) * r * .5 - z * r * .92];
            };
            cubeGeom = { cy: cy, r: r };
            if (zPick > 0) {
                /* These facets establish depth only; the enlarged square
                   below is the data view.  A fine projected mesh avoids the
                   moiré and bright edge pixels created by compressing site
                   colours onto a face only a few pixels high. */
                const faces = [
                    [P(1,-1,hz), P(1,1,hz), P(1,1,0), P(1,-1,0), 'rgba(57,127,154,.16)'],
                    [P(-1,1,hz), P(1,1,hz), P(1,1,0), P(-1,1,0), 'rgba(142,66,87,.13)']
                ];
                faces.forEach(function (f, faceNo) {
                    ctx.beginPath(); ctx.moveTo(f[0][0], f[0][1]);
                    for (let i = 1; i < 4; i++) ctx.lineTo(f[i][0], f[i][1]);
                    ctx.closePath(); ctx.fillStyle = f[4]; ctx.fill();
                    ctx.beginPath();
                    for (let i = 1; i < 10; i++) {
                        const u = i / 10;
                        ctx.moveTo(ruleMix(f[0][0], f[1][0], u), ruleMix(f[0][1], f[1][1], u));
                        ctx.lineTo(ruleMix(f[3][0], f[2][0], u), ruleMix(f[3][1], f[2][1], u));
                    }
                    const layers = Math.min(7, Math.max(2, Math.ceil(zPick / 4)));
                    for (let i = 1; i < layers; i++) {
                        const u = i / layers;
                        ctx.moveTo(ruleMix(f[0][0], f[3][0], u), ruleMix(f[0][1], f[3][1], u));
                        ctx.lineTo(ruleMix(f[1][0], f[2][0], u), ruleMix(f[1][1], f[2][1], u));
                    }
                    ctx.strokeStyle = faceNo ? 'rgba(213,94,119,.13)' : 'rgba(86,180,233,.14)';
                    ctx.lineWidth = .8; ctx.stroke();
                });
            }

            /* The upper object locates the selected plane; the enlarged panel
               below carries its site data.  Minifying the 68-by-68 height
               image onto this shallow rhombus produced a false cross-shaped
               seam along the mirrored axes.  A projected lattice is both
               faithful to the geometry and visually unambiguous. */
            const q = [P(-1,-1,hz), P(1,-1,hz), P(1,1,hz), P(-1,1,hz)];
            ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
            for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
            ctx.closePath();
            ctx.fillStyle = zPick ? 'rgba(226,194,90,.105)' : 'rgba(168,216,232,.105)';
            ctx.fill();

            ctx.beginPath();
            for (let i = 1; i < 10; i++) {
                const u = -1 + 2 * i / 10;
                let a = P(u, -1, hz), b = P(u, 1, hz);
                ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
                a = P(-1, u, hz); b = P(1, u, hz);
                ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            }
            ctx.strokeStyle = zPick ? 'rgba(226,194,90,.16)' : 'rgba(168,216,232,.16)';
            ctx.lineWidth = 1; ctx.stroke();

            /* the outline of the whole box, so the cut reads as a cut */
            const V = [[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],
                       [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(function (q) { return P(q[0],q[1],q[2]); });
            ctx.strokeStyle = 'rgba(201,191,168,.44)';
            ctx.lineWidth = 1.4;
            [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(function (e) {
                ctx.beginPath();
                ctx.moveTo(V[e[0]][0], V[e[0]][1]);
                ctx.lineTo(V[e[1]][0], V[e[1]][1]);
                ctx.stroke();
            });
            ctx.strokeStyle = zPick ? 'rgba(226,194,90,.18)' : 'rgba(168,216,232,.18)';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(q[0][0], q[0][1]);
            for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
            ctx.closePath(); ctx.stroke();
            ctx.strokeStyle = zPick ? DISAGREE : '#A8D8E8';
            ctx.lineWidth = 2.2; ctx.stroke();
        }

        function draw() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#090A10'; ctx.fillRect(0, 0, W, H);
            /* headroom above the apex, and whole backing pixels per site */
            cube(W / 2, 262, 104);
            const SZ = 612, GAP = 40, X0 = (W - 2 * SZ - GAP) / 2, PY = 404;
            panel(X0, PY, SZ, sliceHeights(zPick), H3, fire3.subarray(zPick * M2, (zPick + 1) * M2),
                  glow3.subarray(zPick * M2, (zPick + 1) * M2));
            panel(X0 + SZ + GAP, PY, SZ, s2, H2, fire2, glow2);
        }

        const sliceBuf = new Int16Array(M2);
        function sliceHeights(z) {
            const base = z * M2;
            for (let i = 0; i < M2; i++) sliceBuf[i] = s3[base + i];
            return sliceBuf;
        }

        function update() {
            if (elRound) elRound.textContent = nf.format(roundNo);
            if (elFiring) elFiring.textContent = nf.format(nFire);
            if (elDiff) elDiff.textContent = nf.format(totD[0]);
            if (elOther) elOther.textContent = nf.format(totD[zPick]);
            if (elZ) elZ.textContent = zPick === 0 ? 'central' : String(zPick) + ' off centre';
            if (note) note.textContent = done
                ? 'At rest after ' + nf.format(roundNo) + ' rounds'
                : 'Round ' + nf.format(roundNo);
        }

        function advance(n) {
            let live = true;
            for (let k = 0; k < n && live; k++) live = roundOnce();
            draw(); update(); sync();
            return live;
        }

        const clock = paced({
            watch: 0x3fffffff, every: 400,
            tick: function () { return advance(1); },
            frame: function () { return advance(6); },
            finish: function () {
                let guard = 0;
                while (roundOnce() && guard++ < 20000) {}
                draw(); update(); sync();
            }
        });

        function start() {
            clock.stop(); clock.slow(pace === 'watch' ? 0x3fffffff : 0);
            if (!REDUCED && pageAwake && !userPaused && !done) clock.start();
            sync();
        }
        function sync() {
            $$('[data-dr-pace]').forEach(function (b) {
                const on = b.dataset.drPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-dr-run="pause"]');
            if (b) {
                const on = !REDUCED && clock.running();
                b.textContent = on ? 'Pause' : 'Play'; b.classList.toggle('is-on', on);
            }
        }
        $$('[data-dr-pace]').forEach(function (b) {
            b.addEventListener('click', function () { pace = b.dataset.drPace; start(); });
        });
        $$('[data-dr-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.drRun;
                if (a === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); }
                    else { userPaused = false; start(); }
                } else if (a === 'step' && !done) {
                    userPaused = true; clock.stop(); advance(1);
                } else if (a === 'replay') {
                    clock.stop(); reset(); userPaused = false; start();
                }
                sync();
            });
        });

        /* the cube is also the control: a click picks the height it was made at */
        canvas.addEventListener('click', function (e) {
            if (!cubeGeom) return;
            const box = canvas.getBoundingClientRect();
            const cx = (e.clientX - box.left) / box.width * W;
            const cyy = (e.clientY - box.top) / box.height * H;
            const r = cubeGeom.r;
            if (Math.abs(cx - W / 2) > 2.2 * r) return;
            if (cyy < cubeGeom.cy - 2.1 * r || cyy > cubeGeom.cy + 1.3 * r) return;
            const h = (cubeGeom.cy - cyy) / (r * .92);
            zPick = Math.max(0, Math.min(M - 1, Math.round(h * (M - 1))));
            if (slider) slider.value = String(zPick);
            draw(); update();
        });

        if (slider) {
            slider.max = String(M - 1);
            slider.addEventListener('input', function () {
                zPick = Math.max(0, Math.min(M - 1, parseInt(slider.value, 10) || 0));
                draw(); update();
            });
        }

        reset(); userPaused = REDUCED;
        if (!REDUCED) start();
        else { while (roundOnce()) {} draw(); update(); }
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () { pageAwake = true; draw(); if (!userPaused) start(); }
        };
    };
    makers.cylinder = function () {
        const canvas = $('#cylinder-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
        const N = 48, TARGET = N * 36;
        /* a landscape stage: the finished aggregate is 36 rows high and the
           interface sits near the top with room for its fluctuations */
        const left = 88, right = W - 88, cell = (right - left) / N, base = H - 110;
        const outCount = $('#cylinder-count'), outMean = $('#cylinder-mean'),
              outSpan = $('#cylinder-span'), outMode = $('#cylinder-mode');
        const arrivalRamp = rampOf([[86,180,233], [145,116,204],
                                    [204,121,167], [242,142,107]]);
        let seed, occupied, settled, particle, trail, count, modeSum;
        /* the first particles walk in Watch, so the rule is seen; the pace
           then rises to Grow on its own unless the reader has chosen one */
        let pace = 'watch', view = 'growth', userPaused = false, pageAwake = true;
        let paceTouched = false, seenSince = 0;
        let done = false, lastWrap = 0, completionSince = 0;
        let growthBudget = 0, growthLast = 0;

        function random() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function key(x, y) { return y * N + x; }
        function has(x, y) { return y <= 0 || occupied.has(key(x, y)); }
        function sx(x) { return left + (x + .5) * cell; }
        function sy(y) { return base - (y - .5) * cell; }

        /* Inverse DFT of the discrete Poisson kernel from equation (2). */
        const returnCdf = (function () {
            const rho = new Float64Array(N), p = new Float64Array(N);
            for (let k = 0; k < N; k++) {
                const lambda = .5 + .5 * Math.cos(2 * Math.PI * k / N);
                const q = 2 - lambda;
                rho[k] = q - Math.sqrt(q * q - 1);
            }
            let total = 0;
            for (let d = 0; d < N; d++) {
                let s = 0;
                for (let k = 0; k < N; k++)
                    s += rho[k] * Math.cos(2 * Math.PI * k * d / N);
                p[d] = Math.max(0, s / N); total += p[d];
            }
            let a = 0;
            for (let d = 0; d < N; d++) { a += p[d] / total; p[d] = a; }
            p[N - 1] = 1;
            return p;
        })();
        function returnDisplacement() {
            const u = random();
            let lo = 0, hi = N - 1;
            while (lo < hi) {
                const m = (lo + hi) >>> 1;
                if (returnCdf[m] < u) lo = m + 1; else hi = m;
            }
            return lo;
        }
        function pushTrail(x, y, kind, from) {
            trail.push({ x: x, y: y, kind: kind || 'step', from: from });
            if (trail.length > 360) trail.shift();
        }
        function release() {
            particle = { x: Math.floor(random() * N), y: 0 };
            trail = []; pushTrail(particle.x, particle.y, 'release');
        }
        function settle() {
            count++;
            occupied.add(key(particle.x, particle.y));
            settled.push({ x: particle.x, y: particle.y, t: count, at: performance.now() });
            modeSum += Math.SQRT2 * Math.cos(2 * Math.PI * particle.x / N);
            if (count >= TARGET) { done = true; particle = null; return; }
            release();
        }
        function step() {
            if (done) return false;
            if (!particle) release();
            const from = { x: particle.x, y: particle.y };
            const u = random();
            if (u < .25) particle.y++;
            else if (u < .5) {
                if (particle.y === 0) {
                    const d = returnDisplacement();
                    particle.x = (particle.x + d) % N;
                    pushTrail(particle.x, 0, 'deep', from);
                    return true;
                }
                particle.y--;
            } else if (u < .625) {
                particle.x = (particle.x + N - 1) % N;
                if (from.x === 0) lastWrap = performance.now();
            } else if (u < .75) {
                particle.x = (particle.x + 1) % N;
                if (from.x === N - 1) lastWrap = performance.now();
            } /* the remaining quarter is the paper's horizontal hold */
            pushTrail(particle.x, particle.y, 'step', from);
            if (!has(particle.x, particle.y)) settle();
            return !done;
        }

        function reset() {
            seed = 0x61c88647; occupied = new Set(); settled = [];
            particle = null; trail = []; count = 0; modeSum = 0; done = false;
            lastWrap = 0; completionSince = 0; growthBudget = 0; growthLast = 0;
            if (!paceTouched) pace = 'watch';
            release(); draw(); update(); sync();
        }
        function colour(t) {
            const q = Math.max(0, Math.min(255, Math.round(t / TARGET * 255))) * 3;
            return 'rgb(' + arrivalRamp[q] + ',' + arrivalRamp[q + 1] + ',' + arrivalRamp[q + 2] + ')';
        }
        function discrepancyBounds() {
            let outer = 0, inner = 0;
            settled.forEach(function (q) { if (q.y > outer) outer = q.y; });
            for (let y = 1; y <= outer; y++) {
                let full = true;
                for (let x = 0; x < N; x++) if (!has(x, y)) { full = false; break; }
                if (!full) break;
                inner = y;
            }
            const h = count / N;
            return { outer: outer, inner: inner,
                     span: Math.max(Math.abs(outer - h), Math.abs(inner - h)) };
        }
        function draw() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#090A10'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#1C1E28'; ctx.fillRect(left, base, right - left, H - base);

            /* Periodic seam and the uniform source layer. */
            ctx.strokeStyle = 'rgba(86,180,233,.35)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(left, 24); ctx.lineTo(left, H - 30);
            ctx.moveTo(right, 24); ctx.lineTo(right, H - 30); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,248,232,.30)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(right, base); ctx.stroke();

            const now = performance.now(), g = cell * .46;
            if (view === 'growth') {
                settled.forEach(function (q) {
                    /* a cell settled this instant flashes white and takes its
                       arrival colour over a quarter second */
                    const age = now - (q.at || 0);
                    ctx.fillStyle = age < 260 ? 'rgba(255,248,232,' + (1 - age / 260).toFixed(3) + ')' : colour(q.t);
                    if (age < 260) {
                        ctx.fillStyle = colour(q.t);
                        ctx.fillRect(sx(q.x) - g, sy(q.y) - g, 2 * g, 2 * g);
                        ctx.fillStyle = 'rgba(255,248,232,' + (1 - age / 260).toFixed(3) + ')';
                    }
                    ctx.fillRect(sx(q.x) - g, sy(q.y) - g, 2 * g, 2 * g);
                });
            } else {
                settled.forEach(function (q) {
                    ctx.fillStyle = '#23252F';
                    ctx.fillRect(sx(q.x) - g, sy(q.y) - g, 2 * g, 2 * g);
                });
                const h = count / N, limit = Math.max(1, Math.ceil(h) + 16);
                for (let y = 1; y <= limit; y++) for (let x = 0; x < N; x++) {
                    const occ = has(x, y), ref = y <= h;
                    if (occ === ref) continue;
                    ctx.fillStyle = occ ? '#F28E6B' : '#5FD3F3';
                    ctx.fillRect(sx(x) - g, sy(y) - g, 2 * g, 2 * g);
                }
            }

            const h = count / N;
            ctx.setLineDash([12, 8]);
            ctx.beginPath(); ctx.moveTo(left, base - h * cell);
            ctx.lineTo(right, base - h * cell);
            ctx.strokeStyle = 'rgba(9,10,16,.8)'; ctx.lineWidth = 4; ctx.stroke();
            ctx.strokeStyle = 'rgba(230,240,255,.85)'; ctx.lineWidth = 1.6; ctx.stroke();
            ctx.setLineDash([]);

            /* The live path, with deep half-cylinder excursions shown as a
               dotted return arc rather than a fabricated reflected walk. */
            /* the walk is drawn only while it is being watched: in Grow the
               particle would appear at a different site every frame */
            if (pace === 'watch') {
                for (let i = 1; i < trail.length; i++) {
                    const a = trail[i - 1], b = trail[i];
                    if (b.kind === 'deep') {
                        ctx.save(); ctx.setLineDash([8, 10]);
                        ctx.strokeStyle = 'rgba(86,180,233,.52)'; ctx.lineWidth = 3;
                        ctx.beginPath();
                        const ax = sx(a.x), bx = sx(b.x), yy = base + 14;
                        ctx.moveTo(ax, yy); ctx.quadraticCurveTo((ax + bx) / 2, H - 26, bx, yy);
                        ctx.stroke(); ctx.restore();
                    } else {
                        const ax = sx(a.x), bx = sx(b.x);
                        if (Math.abs(ax - bx) > (right - left) / 2) continue;
                        ctx.beginPath(); ctx.moveTo(ax, sy(a.y)); ctx.lineTo(bx, sy(b.y));
                        ctx.strokeStyle = 'rgba(243,234,216,.8)'; ctx.lineWidth = 3; ctx.stroke();
                    }
                }
                if (particle) {
                    ctx.beginPath(); ctx.arc(sx(particle.x), sy(particle.y), 9, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFF8E8'; ctx.fill();
                    ctx.strokeStyle = '#090A10'; ctx.lineWidth = 3; ctx.stroke();
                }
            }
        }
        function update() {
            const b = discrepancyBounds();
            if (outCount) outCount.textContent = nf.format(count);
            if (outMean) outMean.textContent = (count / N).toFixed(1);
            if (outSpan) outSpan.textContent = b.span.toFixed(1);
            if (outMode) outMode.textContent = (modeSum / N).toFixed(2);
        }
        function advanceWalk() {
            /* the walk is watched for a few seconds after the stage comes into
               view before the pace rises on its own */
            if (!paceTouched && count >= 6 && seenSince && performance.now() - seenSince > 6000) {
                pace = 'grow'; start(); return true;
            }
            const live = step(); draw(); update(); sync(); return live;
        }
        function advanceGrowth() {
            /* The definition film above shows an individual walk.  This view
               defaults to aggregate growth, two particles per frame, so the
               cylinder and its fluctuations occupy the stage quickly.  Hold
               the completed finite sample, then begin the same seeded sample
               again instead of leaving a dead canvas. */
            const now = performance.now();
            if (done) {
                if (!completionSince) completionSince = now;
                if (now - completionSince > 6000) reset();
                else { draw(); update(); sync(); }
                return true;
            }
            if (!growthLast) growthLast = now;
            growthBudget += Math.min(250, now - growthLast) * .11;
            growthLast = now;
            const quota = Math.max(1, Math.min(32, Math.floor(growthBudget)));
            growthBudget = Math.max(0, growthBudget - quota);
            const before = count; let guard = 0;
            while (!done && count < before + quota && guard++ < 180000) step();
            if (done) completionSince = now;
            draw(); update(); sync(); return true;
        }
        const clock = paced({
            watch: 0x3fffffff, every: 28,
            tick: advanceWalk, frame: advanceGrowth,
            finish: function () {
                let guard = 0;
                while (!done && guard++ < 12000000) step();
                draw(); update(); sync();
            }
        });
        function start() {
            clock.stop(); clock.slow(pace === 'watch' ? 0x3fffffff : 0);
            if (pace === 'grow') growthLast = 0;
            if (!REDUCED && pageAwake && !userPaused && (!done || pace === 'grow')) clock.start();
            sync();
        }
        function sync() {
            $$('[data-cyl-pace]').forEach(function (b) {
                const on = b.dataset.cylPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-cyl-view]').forEach(function (b) {
                const on = b.dataset.cylView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-cyl-run="pause"]');
            if (b) {
                const on = !REDUCED && clock.running();
                b.textContent = on ? 'Pause' : 'Play'; b.classList.toggle('is-on', on);
            }
        }
        $$('[data-cyl-pace]').forEach(function (b) {
            b.addEventListener('click', function () { paceTouched = true; pace = b.dataset.cylPace; start(); });
        });
        $$('[data-cyl-view]').forEach(function (b) {
            b.addEventListener('click', function () { view = b.dataset.cylView; draw(); sync(); });
        });
        $$('[data-cyl-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.cylRun;
                if (a === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); }
                    else { userPaused = false; start(); }
                } else if (a === 'step' && !done) {
                    userPaused = true; clock.stop();
                    if (pace === 'watch') advanceWalk(); else advanceGrowth();
                } else if (a === 'replay') {
                    clock.stop(); reset(); userPaused = false; start();
                }
                sync();
            });
        });
        reset(); userPaused = REDUCED; if (!REDUCED) start();
        else clock.start();
        return {
            pause: function () { pageAwake = false; seenSince = 0; clock.stop(); },
            resume: function () { pageAwake = true; seenSince = performance.now(); draw(); if (!userPaused) start(); }
        };
    };

    /* The three bases in Figure 1 of the cylinder paper.  A downward move
       from height zero is accelerated by the exact spectral return kernel.
       For a base eigenvalue lambda its multiplier is
       rho(lambda)=2-lambda-sqrt((2-lambda)^2-1). */
    makers.cylinder3d = function () {
        const canvas = $('#cylinder3d-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
        const outCount = $('#cylinder3d-count'), outMean = $('#cylinder3d-mean'),
              outSpan = $('#cylinder3d-span'), outOuter = $('#cylinder3d-outer');
        /* the same settlement ramp as the unrolled cylinder above, its first
           stop lifted so the base layers separate from the ground */
        const ramp = rampOf([[80,100,205], [106,95,214], [178,95,191], [224,103,154], [242,142,107]]);
        let spec, baseName = 'square', BASE, TARGET;
        let seed, occupied, settled, layers, particle, count, outer, inner;
        let yaw = -Math.PI / 4, userPaused = false, pageAwake = true;
        /* the camera keeps the growing top of the column in the frame and
           lets the oldest layers descend out of it */
        let zShift = 0, unit = 56;
        let done = false, completionSince = 0, budget = 0, lastFrame = 0;
        let drag = null;

        function mod(a, n) { return (a % n + n) % n; }
        function torusReturn(side, eigenvalue, indexOf) {
            const size = side * side, rho = new Float64Array(size);
            const p = new Float64Array(size);
            for (let ky = 0; ky < side; ky++) for (let kx = 0; kx < side; kx++) {
                const lambda = eigenvalue(2 * Math.PI * kx / side,
                                          2 * Math.PI * ky / side);
                const q = 2 - lambda;
                rho[ky * side + kx] = q - Math.sqrt(q * q - 1);
            }
            let total = 0;
            for (let dy = 0; dy < side; dy++) for (let dx = 0; dx < side; dx++) {
                let sum = 0;
                for (let ky = 0; ky < side; ky++) for (let kx = 0; kx < side; kx++) {
                    const phase = 2 * Math.PI * (kx * dx + ky * dy) / side;
                    sum += rho[ky * side + kx] * Math.cos(phase);
                }
                const j = dy * side + dx;
                p[j] = Math.max(0, sum / size); total += p[j];
            }
            let sum = 0;
            for (let j = 0; j < size; j++) { sum += p[j] / total; p[j] = sum; }
            p[size - 1] = 1;
            return function (v, u, lattice) {
                let lo = 0, hi = size - 1;
                while (lo < hi) {
                    const m = (lo + hi) >>> 1;
                    if (p[m] < u) lo = m + 1; else hi = m;
                }
                const q = lattice[v], dx = lo % side, dy = (lo / side) | 0;
                return indexOf(mod(q.i + dx, side), mod(q.j + dy, side));
            };
        }
        function squareSpec() {
            const side = 15, cells = [], graph = [], lattice = [];
            const index = function (i, j) { return mod(j, side) * side + mod(i, side); };
            for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
                const x = i - side / 2, y = j - side / 2;
                lattice.push({ i: i, j: j });
                cells.push({
                    center: { x: x + .5, y: y + .5 },
                    poly: [{x:x,y:y}, {x:x+1,y:y}, {x:x+1,y:y+1}, {x:x,y:y+1}],
                    edges: [j ? index(i,j-1) : -1, i < side-1 ? index(i+1,j) : -1,
                            j < side-1 ? index(i,j+1) : -1, i ? index(i-1,j) : -1]
                });
                graph.push([index(i+1,j), index(i-1,j), index(i,j+1), index(i,j-1)]);
            }
            return {
                title: '15 × 15 square torus', cells: cells, graph: graph, lattice: lattice,
                sampleReturn: torusReturn(side, function (a, b) {
                    return .5 + .25 * (Math.cos(a) + Math.cos(b));
                }, index), seed: 0x7f4a7c15
            };
        }
        function triangularSpec() {
            const side = 9, root3 = Math.sqrt(3), cells = [], graph = [], lattice = [];
            const index = function (i, j) { return mod(j, side) * side + mod(i, side); };
            const meanX = 6, meanY = 2 * root3, radius = 1 / root3;
            const edgeDirs = [[0,1],[-1,1],[-1,0],[0,-1],[1,-1],[1,0]];
            const graphDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
            for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
                const cx = i + .5 * j - meanX, cy = root3 * .5 * j - meanY;
                const poly = [];
                for (let k = 0; k < 6; k++) {
                    const a = Math.PI / 6 + k * Math.PI / 3;
                    poly.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
                }
                lattice.push({ i: i, j: j });
                cells.push({ center: {x:cx,y:cy}, poly: poly,
                    edges: edgeDirs.map(function (d) {
                        const ni = i + d[0], nj = j + d[1];
                        return ni < 0 || ni >= side || nj < 0 || nj >= side ? -1 : index(ni,nj);
                    }) });
                graph.push(graphDirs.map(function (d) { return index(i+d[0], j+d[1]); }));
            }
            return {
                title: '9 × 9 triangular torus', cells: cells, graph: graph, lattice: lattice,
                sampleReturn: torusReturn(side, function (a, b) {
                    return .5 + (Math.cos(a) + Math.cos(b) + Math.cos(a-b)) / 6;
                }, index), seed: 0x51633e2d
            };
        }
        function clipHalfPlane(poly, nx, ny, c) {
            const out = [];
            for (let i = 0; i < poly.length; i++) {
                const a = poly[i], b = poly[(i + 1) % poly.length];
                const da = nx * a.x + ny * a.y - c;
                const db = nx * b.x + ny * b.y - c;
                const ina = da <= 1e-9, inb = db <= 1e-9;
                if (ina) out.push(a);
                if (ina !== inb) {
                    const t = da / (da - db);
                    out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
                }
            }
            return out;
        }
        function jacobiKernel(graph) {
            const n = graph.length, a = new Float64Array(n * n), v = new Float64Array(n * n);
            for (let i = 0; i < n; i++) {
                a[i*n+i] = .5; v[i*n+i] = 1;
                const w = .5 / graph[i].length;
                graph[i].forEach(function (j) { a[i*n+j] = w; });
            }
            for (let sweep = 0; sweep < 80; sweep++) {
                let changed = false;
                for (let p = 0; p < n-1; p++) for (let q = p+1; q < n; q++) {
                    const apq = a[p*n+q];
                    if (Math.abs(apq) < 1e-13) continue;
                    changed = true;
                    const app = a[p*n+p], aqq = a[q*n+q];
                    const tau = (aqq - app) / (2 * apq);
                    const t = (tau >= 0 ? 1 : -1) /
                              (Math.abs(tau) + Math.sqrt(1 + tau * tau));
                    const cs = 1 / Math.sqrt(1 + t*t), sn = t * cs;
                    for (let k = 0; k < n; k++) if (k !== p && k !== q) {
                        const akp = a[k*n+p], akq = a[k*n+q];
                        a[k*n+p] = a[p*n+k] = cs*akp - sn*akq;
                        a[k*n+q] = a[q*n+k] = sn*akp + cs*akq;
                    }
                    a[p*n+p] = app - t*apq; a[q*n+q] = aqq + t*apq;
                    a[p*n+q] = a[q*n+p] = 0;
                    for (let k = 0; k < n; k++) {
                        const vkp = v[k*n+p], vkq = v[k*n+q];
                        v[k*n+p] = cs*vkp - sn*vkq;
                        v[k*n+q] = sn*vkp + cs*vkq;
                    }
                }
                if (!changed) break;
            }
            const rows = [];
            for (let i = 0; i < n; i++) {
                const cdf = new Float64Array(n); let total = 0;
                for (let j = 0; j < n; j++) {
                    let x = 0;
                    for (let k = 0; k < n; k++) {
                        const lambda = Math.max(0, Math.min(1, a[k*n+k]));
                        const q = 2 - lambda, rho = q - Math.sqrt(q*q - 1);
                        x += v[i*n+k] * rho * v[j*n+k];
                    }
                    cdf[j] = Math.max(0, x); total += cdf[j];
                }
                let sum = 0;
                for (let j = 0; j < n; j++) { sum += cdf[j] / total; cdf[j] = sum; }
                cdf[n-1] = 1; rows.push(cdf);
            }
            return function (start, u) {
                const cdf = rows[start]; let lo = 0, hi = n - 1;
                while (lo < hi) {
                    const m = (lo + hi) >>> 1;
                    if (cdf[m] < u) lo = m + 1; else hi = m;
                }
                return lo;
            };
        }
        function nauruSpec() {
            const n = 24, points = [], graph = Array.from({length:n}, function () { return []; });
            function edge(a, b) { graph[a].push(b); graph[b].push(a); }
            for (let i = 0; i < 12; i++) {
                const a = 2 * Math.PI * i / 12 - Math.PI / 2;
                points.push({ x: 6.2 * Math.cos(a), y: 6.2 * Math.sin(a) });
            }
            for (let i = 0; i < 12; i++) {
                const a = 2 * Math.PI * i / 12 - Math.PI / 2;
                points.push({ x: 3.05 * Math.cos(a), y: 3.05 * Math.sin(a) });
            }
            for (let i = 0; i < 12; i++) {
                edge(i, (i + 1) % 12); edge(i, 12 + i);
            }
            for (let i = 0; i < 12; i++) if (i < mod(i + 5, 12)) edge(12+i, 12+mod(i+5,12));
            /* The i<i+5 test omits wrapped star edges; add any missing cubic edges. */
            for (let i = 0; i < 12; i++) {
                const j = mod(i + 5, 12);
                if (graph[12+i].indexOf(12+j) < 0) edge(12+i, 12+j);
            }
            const cells = [];
            for (let i = 0; i < n; i++) {
                let poly = [{x:-7.5,y:-7.5},{x:7.5,y:-7.5},{x:7.5,y:7.5},{x:-7.5,y:7.5}];
                for (let j = 0; j < n && poly.length; j++) if (j !== i) {
                    const nx = points[j].x - points[i].x, ny = points[j].y - points[i].y;
                    const c = (points[j].x*points[j].x + points[j].y*points[j].y
                              - points[i].x*points[i].x - points[i].y*points[i].y) / 2;
                    poly = clipHalfPlane(poly, nx, ny, c);
                }
                const edges = poly.map(function (a, k) {
                    const b = poly[(k+1)%poly.length], mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
                    const di = (mx-points[i].x)*(mx-points[i].x)+(my-points[i].y)*(my-points[i].y);
                    let hit = -1, err = Infinity;
                    for (let j = 0; j < n; j++) if (j !== i) {
                        const dj = (mx-points[j].x)*(mx-points[j].x)+(my-points[j].y)*(my-points[j].y);
                        if (Math.abs(dj-di) < err) { err = Math.abs(dj-di); hit = j; }
                    }
                    return err < 1e-5 ? hit : -1;
                });
                cells.push({ center: points[i], poly: poly, edges: edges });
            }
            return { title: 'Nauru graph  GP(12,5)', cells: cells, graph: graph,
                     lattice: null, sampleReturn: jacobiKernel(graph), seed: 0x2c1b3c6d };
        }
        const specs = { square: squareSpec(), triangular: triangularSpec(), nauru: nauruSpec() };

        function random() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function key(v, z) { return z * BASE + v; }
        function has(v, z) { return z <= 0 || occupied.has(key(v, z)); }
        function release() {
            particle = { v: Math.floor(random() * BASE), z: 0 };
        }
        function walkToSettlement() {
            if (!particle) release();
            let guard = 0;
            while (guard++ < 180000) {
                const u = random();
                if (u < .25) particle.z++;
                else if (u < .5) {
                    if (particle.z === 0) {
                        particle.v = spec.sampleReturn(particle.v, random(), spec.lattice);
                    } else particle.z--;
                } else if (u < .75) {
                    /* horizontal holding: P(x,x)/2 = 1/4 */
                } else {
                    const nb = spec.graph[particle.v];
                    particle.v = nb[Math.floor(random() * nb.length)];
                }

                if (!has(particle.v, particle.z)) {
                    count++;
                    occupied.add(key(particle.v, particle.z));
                    settled.push({ v: particle.v, z: particle.z, t: count, at: performance.now() });
                    layers[particle.z]++;
                    outer = Math.max(outer, particle.z);
                    while (layers[inner + 1] === BASE) inner++;
                    particle = null;
                    if (count >= TARGET) done = true;
                    return true;
                }
            }
            return false;
        }
        function reset() {
            spec = specs[baseName]; BASE = spec.cells.length; TARGET = BASE * 18;
            seed = spec.seed; occupied = new Set(); settled = [];
            layers = new Uint16Array(128); particle = null;
            count = 0; outer = 0; inner = 0; done = false;
            completionSince = 0; budget = 0; lastFrame = 0; zShift = 0;
            /* every base fills about three quarters of the stage width; the
               extent is taken over the cell polygons, not their centres */
            let span = 1, far = 0;
            spec.cells.forEach(function (c) { c.poly.forEach(function (p) { far = Math.max(far, Math.hypot(p.x, p.y)); }); });
            span = 2 * far;
            unit = Math.min(W * .76 / (span * 1.05), H * .7 / (span * .5 + 5));
            draw(); update(); sync();
        }
        function project(x, y, z) {
            const c = Math.cos(yaw), s = Math.sin(yaw);
            const rx = c * x - s * y, ry = s * x + c * y;
            return { x: W / 2 + rx * unit,
                     y: H * .70 + ry * (unit * .5) - (z - zShift) * (unit * .6) };
        }
        function polygon(points, fill, stroke) {
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            ctx.closePath();
            if (fill) { ctx.fillStyle = fill; ctx.fill(); }
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
        }
        function colour(t, shade, at) {
            const j = Math.max(0, Math.min(255, Math.round(255 * t / TARGET))) * 3;
            let r = ramp[j] * shade, g = ramp[j + 1] * shade, b = ramp[j + 2] * shade;
            /* a cube that has just settled flashes and takes its colour */
            const age = at ? performance.now() - at : 1e9;
            if (age < 170) {
                const k = 1 - age / 170;
                r += (255 - r) * k; g += (248 - g) * k; b += (232 - b) * k;
            }
            return 'rgb(' + Math.min(255, Math.round(r)) + ',' + Math.min(255, Math.round(g)) + ',' + Math.min(255, Math.round(b)) + ')';
        }
        function depth(q) {
            const p = spec.cells[q.v].center;
            return Math.sin(yaw) * p.x + Math.cos(yaw) * p.y;
        }
        function edgeFront(cell, i) {
            const a = cell.poly[i], b = cell.poly[(i + 1) % cell.poly.length];
            return Math.sin(yaw) * (b.y - a.y) - Math.cos(yaw) * (b.x - a.x);
        }
        function sideExposed(q, cell, i) {
            const nb = cell.edges[i];
            return nb < 0 || !has(nb, q.z);
        }
        function cubeCorners(q, z) {
            return spec.cells[q.v].poly.map(function (p) { return project(p.x, p.y, z); });
        }
        function drawCube(q) {
            const cell = spec.cells[q.v];
            const top = cubeCorners(q, q.z), bottom = cubeCorners(q, q.z - 1);
            /* walls darken with depth below the current top of the column */
            const depthShade = Math.max(.62, 1 - .035 * Math.max(0, outer - q.z));
            for (let i = 0; i < cell.poly.length; i++) {
                const front = edgeFront(cell, i);
                if (front <= 1e-8 || !sideExposed(q, cell, i)) continue;
                const j = (i + 1) % cell.poly.length;
                const a = cell.poly[i], b = cell.poly[j];
                const length = Math.max(1e-6, Math.hypot(b.x-a.x, b.y-a.y));
                const shade = (.56 + .24 * Math.min(1, front / length)) * depthShade;
                polygon([top[i], top[j], bottom[j], bottom[i]],
                        colour(q.t, shade, q.at), 'rgba(7,8,14,.3)');
            }
            if (!has(q.v, q.z + 1)) {
                polygon(top, colour(q.t, 1.0 * Math.max(.8, depthShade), q.at), null);
                /* an edge is drawn only where the neighbour's height differs,
                   so a flat top reads as one surface rather than a brick grid */
                ctx.beginPath();
                for (let i = 0; i < cell.poly.length; i++) {
                    const j = (i + 1) % cell.poly.length, nb = cell.edges[i];
                    if (nb >= 0 && has(nb, q.z) && !has(nb, q.z + 1)) continue;
                    ctx.moveTo(top[i].x, top[i].y); ctx.lineTo(top[j].x, top[j].y);
                }
                ctx.strokeStyle = 'rgba(7,8,14,.55)'; ctx.lineWidth = 1; ctx.stroke();
            }
        }
        function drawBase() {
            spec.cells.forEach(function (cell) {
                polygon(cell.poly.map(function (p) { return project(p.x,p.y,0); }),
                        '#121722', 'rgba(137,151,174,.16)');
            });
            /* the base graph itself, on the ground plane: the vertices and the
               edges the walk may take */
            ctx.beginPath();
            spec.cells.forEach(function (cell, i) {
                const a = project(cell.center.x, cell.center.y, 0);
                (spec.graph[i] || []).forEach(function (j) {
                    if (j <= i) return;
                    const b = project(spec.cells[j].center.x, spec.cells[j].center.y, 0);
                    if (spec.lattice && Math.hypot(b.x - a.x, b.y - a.y) > unit * 2.2) return;   /* a wrap-around edge */
                    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                });
            });
            ctx.strokeStyle = 'rgba(160,172,196,.34)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,228,.55)';
            spec.cells.forEach(function (cell) {
                const a = project(cell.center.x, cell.center.y, 0);
                ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, Math.PI * 2); ctx.fill();
            });
        }
        function draw() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#080A10'; ctx.fillRect(0, 0, W, H);
            drawBase();
            const visible = [];
            for (let i = 0; i < settled.length; i++) {
                const q = settled[i], cell = spec.cells[q.v]; let show = !has(q.v, q.z + 1);
                for (let k = 0; !show && k < cell.poly.length; k++)
                    show = edgeFront(cell,k) > 1e-8 && sideExposed(q,cell,k);
                if (show) visible.push(q);
            }
            visible.sort(function (a, b) { return depth(a) - depth(b) || a.z - b.z; });
            for (let i = 0; i < visible.length; i++) drawCube(visible[i]);
        }
        function deviation() {
            const h = count / BASE;
            return Math.max(Math.abs(outer - h), Math.abs(inner - h));
        }
        function update() {
            if (outCount) outCount.textContent = nf.format(count);
            if (outMean) outMean.textContent = (count / BASE).toFixed(1);
            if (outSpan) outSpan.textContent = deviation().toFixed(1);
            if (outOuter) outOuter.textContent = String(outer);
        }
        function addParticles(quota) {
            let added = 0;
            while (!done && added < quota) {
                if (!walkToSettlement()) break;
                added++;
            }
            draw(); update(); sync();
            return added;
        }
        function advance() {
            const now = performance.now();
            const want = Math.max(0, outer - 10);
            zShift += (want - zShift) * .035;
            if (done) {
                if (!completionSince) completionSince = now;
                if (now - completionSince > 2600) reset();
                else { draw(); update(); sync(); }
                return true;
            }
            if (!lastFrame) lastFrame = now;
            budget += Math.min(120, now - lastFrame) * (.34 * BASE / 225);
            lastFrame = now;
            const quota = Math.min(Math.max(2, Math.ceil(28 * BASE / 225)), Math.floor(budget));
            if (quota < 1) return true;
            budget = Math.max(0, budget - quota);
            addParticles(quota);
            return true;
        }
        const clock = paced({
            watch: 0, every: 30,
            tick: function () { return true; }, frame: advance,
            finish: function () {
                let guard = 0;
                while (!done && guard++ < TARGET * 4) {
                    if (!walkToSettlement()) continue;
                }
                draw(); update(); sync();
            }
        });
        function start() {
            clock.stop(); lastFrame = 0;
            if (!REDUCED && pageAwake && !userPaused) clock.start();
            sync();
        }
        function sync() {
            $$('[data-cyl3d-base]').forEach(function (b) {
                const on = b.dataset.cyl3dBase === baseName;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-cyl3d-run="pause"]');
            if (b) {
                const on = !REDUCED && clock.running();
                b.textContent = on ? 'Pause' : 'Play';
                b.classList.toggle('is-on', on);
            }
        }
        $$('[data-cyl3d-base]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (b.dataset.cyl3dBase === baseName) return;
                clock.stop(); baseName = b.dataset.cyl3dBase; reset();
                userPaused = false; start();
            });
        });
        $$('[data-cyl3d-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const action = b.dataset.cyl3dRun;
                if (action === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); }
                    else { userPaused = false; start(); }
                } else if (action === 'step') {
                    userPaused = true; clock.stop(); addParticles(Math.max(1, Math.round(BASE / 18)));
                } else if (action === 'replay') {
                    clock.stop(); reset(); userPaused = false; start();
                }
                sync();
            });
        });
        canvas.addEventListener('pointerdown', function (e) {
            drag = { x: e.clientX, yaw: yaw };
            canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointermove', function (e) {
            if (!drag) return;
            yaw = drag.yaw + (e.clientX - drag.x) * .006;
            draw();
        });
        function endDrag(e) {
            drag = null;
            if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        }
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);

        reset(); userPaused = REDUCED;
        if (!REDUCED) start(); else clock.start();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () { pageAwake = true; draw(); if (!userPaused) start(); }
        };
    };

    /* A finite-cutoff embedded jump chain for the d=2 critical kernel. The
       proposal distribution is exactly proportional to |z|^-4 on the cutoff
       ball; rejection by the frozen edge conductance gives the desired
       conductance-weighted transition law. */
    makers.longrange = function () {
        const canvas = $('#longrange-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width;
        const R = 48, TARGET = 16000, KEEP = 2600;
        const outSteps = $('#longrange-steps'), outJump = $('#longrange-jump'),
              outMax = $('#longrange-max'), outRatio = $('#longrange-ratio'),
              note = $('#longrange-note');
        const ratioLabel = outRatio && outRatio.closest('div')
            ? $('dt', outRatio.closest('div')) : null;
        if (ratioLabel) {
            ratioLabel.textContent = '\\(|X_n|/\\sqrt{\\max(1,n)}\\)';
            if (window.typeset) window.typeset(ratioLabel);
        }
        const dx = [], dy = [], cdf = [];
        let total = 0;
        for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
            const r2 = x * x + y * y;
            if (!r2 || r2 > R * R) continue;
            total += 1 / (r2 * r2);
            dx.push(x); dy.push(y); cdf.push(total);
        }
        for (let i = 0; i < cdf.length; i++) cdf[i] /= total;

        let seed, xs, ys, jumps, conductances, n, maxJump;
        let pace = 'watch', view = 'follow', userPaused = false, pageAwake = true;
        let done = false, camX = 0, camY = 0, camHalf = 16;

        function random() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function hash32(a, b, c, d) {
            let h = 0x9e3779b9;
            h = Math.imul(h ^ a, 0x85ebca6b);
            h = Math.imul(h ^ b, 0xc2b2ae35);
            h = Math.imul(h ^ c, 0x27d4eb2d);
            h = Math.imul(h ^ d, 0x165667b1);
            h ^= h >>> 16; return h >>> 0;
        }
        function edgeConductance(x, y, u, v) {
            if (u < x || (u === x && v < y)) {
                const tx = x, ty = y; x = u; y = v; u = tx; v = ty;
            }
            return .65 + .70 * (hash32(x, y, u, v) / 4294967295);
        }
        function proposal() {
            const u = random();
            let lo = 0, hi = cdf.length - 1;
            while (lo < hi) {
                const m = (lo + hi) >>> 1;
                if (cdf[m] < u) lo = m + 1; else hi = m;
            }
            return lo;
        }
        function step() {
            if (done) return false;
            const x = xs[n], y = ys[n];
            let k, a, u, v;
            do {
                k = proposal(); u = x + dx[k]; v = y + dy[k];
                a = edgeConductance(x, y, u, v);
            } while (random() > a / 1.35);
            const j = Math.hypot(dx[k], dy[k]);
            xs.push(u); ys.push(v); jumps.push(j); conductances.push(a);
            n++; if (j > maxJump) maxJump = j;
            if (note) note.textContent = j >= 12
                ? 'Long jump \u00b7 ' + j.toFixed(1)
                : 'One fixed environment';
            if (n >= TARGET) done = true;
            return !done;
        }
        function reset() {
            /* Chosen before publication from a deterministic seed sweep only
               to avoid an unusually local finite path: at step 4,000 its
               displacement and range are each of diffusive order.  Because
               the displayed jump law is truncated at radius 48, its variance
               is finite and its normalization is sqrt(t), not sqrt(t log t). */
            seed = 0xb6962ba7; xs = [0]; ys = [0]; jumps = [0]; conductances = [1];
            n = 0; maxJump = 0; done = false; camX = camY = 0; camHalf = 16;
            draw(); update(); sync();
        }
        function scaleAt(k) { return Math.sqrt(Math.max(1, k)); }
        /* age is hue alone, at full strength: the oldest steps stay legible */
        function pathColour(q, alpha) {
            let a, b, u;
            if (q < .5) { a = [86,180,233]; b = [178,95,191]; u = q / .5; }
            else { a = [178,95,191]; b = [242,142,107]; u = (q - .5) / .5; }
            return 'rgba(' + Math.round(a[0] + (b[0] - a[0]) * u) + ','
                + Math.round(a[1] + (b[1] - a[1]) * u) + ','
                + Math.round(a[2] + (b[2] - a[2]) * u) + ',' + alpha + ')';
        }
        function draw() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#090A10'; ctx.fillRect(0, 0, W, W);
            const natural = scaleAt(n), x = xs[n], y = ys[n];
            /* Keep the finite-variance diffusive scale legible: it nearly
               fills the stage, while exceptional recent chords may still
               pull the camera out. */
            const scaleFactor = 1.28 + .42 * Math.min(1, Math.log1p(n) / 9);
            let extent = Math.max(10, natural * scaleFactor);
            const start = Math.max(0, n - KEEP);
            for (let i = start; i <= n; i++)
                extent = Math.max(extent, Math.abs(xs[i]) * 1.08, Math.abs(ys[i]) * 1.08);
            /* Follow frames the last three hundred steps, and holds still while
               the head stays in the middle half of the view: the picture drifts
               after the walk instead of lurching with every jump. */
            let targetX = 0, targetY = 0, targetHalf = Math.max(16, extent), cameraEase = .14;
            if (view === 'follow') {
                const from = Math.max(0, n - 300);
                let lx = x, hx = x, ly = y, hy = y;
                for (let i = from; i <= n; i++) {
                    lx = Math.min(lx, xs[i]); hx = Math.max(hx, xs[i]);
                    ly = Math.min(ly, ys[i]); hy = Math.max(hy, ys[i]);
                }
                targetX = (lx + hx) / 2; targetY = (ly + hy) / 2;
                targetHalf = Math.max(10, .58 * Math.max(hx - lx, hy - ly) + 4);
                const inside = Math.abs(x - camX) < .5 * camHalf && Math.abs(y - camY) < .5 * camHalf
                    && Math.abs(targetX - camX) < .35 * camHalf && Math.abs(targetY - camY) < .35 * camHalf;
                cameraEase = inside ? 0 : .12;
            }
            camX += (targetX - camX) * cameraEase;
            camY += (targetY - camY) * cameraEase;
            camHalf += (targetHalf - camHalf) * (view === 'follow' ? .12 : .14);
            const pad = 86, sc = (W - 2 * pad) / (2 * camHalf);
            function px(q) { return W / 2 + (q - camX) * sc; }
            function py(q) { return W / 2 - (q - camY) * sc; }

            /* the lattice itself, when its sites are far enough apart to see */
            if (sc >= 22) {
                ctx.fillStyle = 'rgba(255,248,232,.10)';
                const x0 = Math.ceil(camX - camHalf * 1.02), x1 = Math.floor(camX + camHalf * 1.02);
                const y0 = Math.ceil(camY - camHalf * 1.02), y1 = Math.floor(camY + camHalf * 1.02);
                for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
                    ctx.fillRect(px(gx) - 1, py(gy) - 1, 2, 2);
                }
            }
            for (let i = start + 1; i <= n; i++) {
                const q = (i - start) / Math.max(1, n - start);
                const len = jumps[i], a = conductances[i];
                ctx.beginPath(); ctx.moveTo(px(xs[i - 1]), py(ys[i - 1]));
                ctx.lineTo(px(xs[i]), py(ys[i]));
                ctx.strokeStyle = pathColour(q, .82 + .18 * q);
                ctx.lineWidth = Math.min(6, (1.3 + Math.log1p(len) * .9) * a);
                ctx.stroke();
            }
            if (n > 0) {
                ctx.beginPath(); ctx.moveTo(px(xs[n - 1]), py(ys[n - 1]));
                ctx.lineTo(px(xs[n]), py(ys[n]));
                ctx.strokeStyle = '#F0E442'; ctx.lineWidth = 3 + conductances[n] * 1.5; ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(px(x), py(y), 9, 0, Math.PI * 2);
            ctx.fillStyle = '#FFF8E8'; ctx.fill();
            ctx.strokeStyle = '#090A10'; ctx.lineWidth = 3; ctx.stroke();
        }
        function update() {
            const j = n ? jumps[n] : 0, natural = scaleAt(n);
            if (outSteps) outSteps.textContent = nf.format(n);
            if (outJump) outJump.textContent = j.toFixed(1);
            if (outMax) outMax.textContent = maxJump.toFixed(1);
            if (outRatio) outRatio.textContent =
                (Math.hypot(xs[n], ys[n]) / natural).toFixed(2);
            if (done && note) note.textContent = 'Finite-cutoff run complete';
        }
        function advance(k) {
            let live = true;
            for (let i = 0; i < k && live; i++) live = step();
            draw(); update(); sync(); return live;
        }
        const clock = paced({
            watch: 0x3fffffff, every: 70,
            tick: function () { return advance(1); },
            frame: function () { return advance(28); },
            finish: function () { while (!done) step(); draw(); update(); sync(); }
        });
        function start() {
            clock.stop(); clock.slow(pace === 'watch' ? 0x3fffffff : 0);
            if (!REDUCED && pageAwake && !userPaused && !done) clock.start();
            sync();
        }
        function sync() {
            $$('[data-lr-pace]').forEach(function (b) {
                const on = b.dataset.lrPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-lr-view]').forEach(function (b) {
                const on = b.dataset.lrView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-lr-run="pause"]');
            if (b) {
                const on = !REDUCED && clock.running();
                b.textContent = on ? 'Pause' : 'Play'; b.classList.toggle('is-on', on);
            }
        }
        $$('[data-lr-pace]').forEach(function (b) {
            b.addEventListener('click', function () { pace = b.dataset.lrPace; start(); });
        });
        $$('[data-lr-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.lrView; camHalf = Math.max(camHalf, 16); draw(); sync();
            });
        });
        $$('[data-lr-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.lrRun;
                if (a === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); }
                    else { userPaused = false; start(); }
                } else if (a === 'step' && !done) {
                    userPaused = true; clock.stop(); advance(1);
                } else if (a === 'replay') {
                    clock.stop(); reset(); userPaused = false; start();
                }
                sync();
            });
        });
        reset(); userPaused = REDUCED; if (!REDUCED) start(); else clock.start();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () { pageAwake = true; draw(); if (!userPaused) start(); }
        };
    };

    /* ---------------- VI — another dimension ---------------- */

    /* Theorem 1.1 of arXiv:2009.05968, run rather than replayed. The cube
       with every site holding six grains and the square with every site
       holding four are stabilised in synchronous rounds, side by side, in
       this tab. Symmetry reduces each to one orthant -- 48^3 and 48^2 sites,
       reflecting at the centre, a sink past the far face -- which is the same
       reduction the paper's fundamental domain makes. Nothing is baked: the
       two odometers are compared as integers after every round, and the
       theorem is the readout that stays at nought. The process is
       deterministic, so every run is the same run. */
    /* What percolation is, and where it changes. Bond percolation on a square
       grid: keep each edge with probability p, independently, and look at what
       the kept edges connect. Three configurations at p = 0.35, 0.50, 0.65 on
       the same 64-square, then the order parameter measured on that square.

       Everything is computed here -- the configurations by a seeded generator,
       the components by union-find, the curve by running the same box once at
       each p. The curve is the largest component's density on a FINITE box,
       which is what a finite box can show; the infinite-volume order parameter
       it approximates is 0 for p < 1/2 and positive for p > 1/2, the threshold
       being Kesten's theorem that bond percolation on the square lattice has
       p_c = 1/2. The rise near 1/2 sharpens with the box, it does not jump. */
    makers.percpanels = function () {
        const canvas = $('#perc-def-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const L = 64, N = L * L;
        const SHOW = [0.35, 0.50, 0.65];

        function rng(seed) {
            let a = seed >>> 0;
            return function () {
                a = (a + 0x6D2B79F5) >>> 0;
                let t = Math.imul(a ^ (a >>> 15), 1 | a);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        const parent = new Int32Array(N), size = new Int32Array(N);
        function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
        function union(a, b) {
            a = find(a); b = find(b);
            if (a === b) return;
            if (size[a] < size[b]) { const t = a; a = b; b = t; }
            parent[b] = a; size[a] += size[b];
        }

        /* one configuration: which edges are kept, and the largest component */
        function run(p, seed) {
            const rand = rng(seed);
            const right = new Uint8Array(N), down = new Uint8Array(N);
            for (let i = 0; i < N; i++) { parent[i] = i; size[i] = 1; }
            for (let y = 0; y < L; y++) {
                for (let x = 0; x < L; x++) {
                    const i = y * L + x;
                    if (x + 1 < L && rand() < p) { right[i] = 1; union(i, i + 1); }
                    if (y + 1 < L && rand() < p) { down[i] = 1; union(i, i + L); }
                }
            }
            let big = 0, root = -1;
            for (let i = 0; i < N; i++) {
                const r = find(i);
                if (size[r] > big) { big = size[r]; root = r; }
            }
            /* membership is recorded now: parent[] is a single shared scratch
               array and the runs that build the curve overwrite it, so asking
               find() at draw time would answer about the wrong configuration. */
            const inBig = new Uint8Array(N);
            for (let i = 0; i < N; i++) if (find(i) === root) inBig[i] = 1;
            return { right: right, down: down, inBig: inBig, big: big };
        }

        const cfg = SHOW.map(function (p, k) { return run(p, 20260901 + k); });
        /* the order parameter on this box, one run per p */
        const PS = [], DENS = [];
        for (let k = 0; k <= 40; k++) {
            const p = k / 40;
            PS.push(p);
            DENS.push(run(p, 776699 + k).big / N);
        }

        function grid(ox, oy, s, c) {
            const cell = s / (L - 1);
            ctx.lineWidth = Math.max(1, cell * .28);
            for (let y = 0; y < L; y++) {
                for (let x = 0; x < L; x++) {
                    const i = y * L + x;
                    const px = ox + x * cell, py = oy + y * cell;
                    if (c.right[i]) {
                        ctx.strokeStyle = c.inBig[i] ? '#A8D8E8' : 'rgba(74,74,94,.85)';
                        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cell, py); ctx.stroke();
                    }
                    if (c.down[i]) {
                        ctx.strokeStyle = c.inBig[i] ? '#A8D8E8' : 'rgba(74,74,94,.85)';
                        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cell); ctx.stroke();
                    }
                }
            }
            ctx.strokeStyle = 'rgba(201,191,168,.30)';
            ctx.lineWidth = 2;
            ctx.strokeRect(ox, oy, s, s);
        }

        function curve(ox, oy, s) {
            ctx.strokeStyle = 'rgba(201,191,168,.30)';
            ctx.lineWidth = 2;
            ctx.strokeRect(ox, oy, s, s);
            /* the threshold */
            const xc = ox + .5 * s;
            ctx.setLineDash([7, 7]);
            ctx.strokeStyle = 'rgba(226,194,90,.75)';
            ctx.lineWidth = Math.max(2, W / 720);
            ctx.beginPath(); ctx.moveTo(xc, oy); ctx.lineTo(xc, oy + s); ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = '#A8D8E8';
            ctx.lineWidth = Math.max(2.5, W / 620);
            ctx.beginPath();
            for (let k = 0; k < PS.length; k++) {
                const x = ox + PS[k] * s, y = oy + s - DENS[k] * s;
                if (!k) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.fillStyle = 'rgba(242,237,226,.72)';
            const fs = Math.round(W / 65), dy = Math.round(fs * 1.2);
            ctx.font = '500 ' + fs + 'px ui-monospace, "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('0', ox, oy + s + dy);
            ctx.fillText('1/2', xc, oy + s + dy);
            ctx.fillText('1', ox + s, oy + s + dy);
        }

        function draw() {
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, H);
            const gap = Math.round(W / 86), s = (W - 5 * gap) / 4, top = (H - s) / 2 - Math.round(W / 190);
            for (let k = 0; k < 3; k++) grid(gap + k * (s + gap), top, s, cfg[k]);
            curve(gap + 3 * (s + gap), top, s);
        }

        draw();
        return { resume: draw };
    };

    makers.harmonic = function () {
        const canvas = $('#harmonic-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width;
        const note = $('#harmonic-note'), outSweeps = $('#harmonic-sweeps'),
              outSites = $('#harmonic-sites'), outMove = $('#harmonic-move'),
              outResidual = $('#harmonic-residual');
        const WATCH = 0x3fffffff, EVERY = 100, FAST_CAP = 64;
        /* the site's attachment ramp, lightness rising with displacement, so
           the key under the stage and the edges agree */
        const COLOUR = rampOf([[111,94,224], [204,121,167],
                               [150,205,240], [255,248,232]]);
        let watchBegan = 0, watchAcc = 0;

        let DATA = null, D = null, key = 'sparse';
        let latX, latY, solX, solY, x, y, nx, ny, off, nbr, boundary;
        let edgeA, edgeB, edgeBand, guides, under;
        let sweeps = 0, residual = Infinity, done = false, ready = false;
        let pace = 'watch', userPaused = false, pageAwake = true;

        function sx(v) { return W * .055 + v / (D.L - 1) * W * .89; }
        function sy(v) { return W * .945 - v / (D.L - 1) * W * .89; }
        function cssRatio() {
            const w = canvas.getBoundingClientRect().width;
            return w ? W / w : 2;
        }

        function makeUnderlay() {
            under = document.createElement('canvas');
            under.width = under.height = W;
            const c = under.getContext('2d');
            c.fillStyle = '#0F0E13'; c.fillRect(0, 0, W, W);
        }

        function harmonicResidual() {
            let hi = 0;
            for (let i = 0; i < D.n; i++) {
                if (boundary[i]) continue;
                let ax = 0, ay = 0;
                const deg = off[i + 1] - off[i];
                for (let k = off[i]; k < off[i + 1]; k++) {
                    const j = nbr[k]; ax += x[j]; ay += y[j];
                }
                ax /= deg; ay /= deg;
                hi = Math.max(hi, Math.hypot(ax - x[i], ay - y[i]));
            }
            return hi;
        }

        /* One simultaneous lazy-Jacobi sweep. Laziness removes the bipartite
           oscillation while preserving exactly the same harmonic fixed point. */
        function relaxOne() {
            if (done) return false;
            for (let i = 0; i < D.n; i++) {
                if (boundary[i]) { nx[i] = latX[i]; ny[i] = latY[i]; continue; }
                let ax = 0, ay = 0;
                const deg = off[i + 1] - off[i];
                for (let k = off[i]; k < off[i + 1]; k++) {
                    const j = nbr[k]; ax += x[j]; ay += y[j];
                }
                nx[i] = .5 * (x[i] + ax / deg);
                ny[i] = .5 * (y[i] + ay / deg);
            }
            let t = x; x = nx; nx = t; t = y; y = ny; ny = t;
            sweeps++;
            residual = harmonicResidual();
            if (residual < D.tolerance) settleExact();
            return !done;
        }

        function settleExact() {
            x.set(solX); y.set(solY);
            residual = harmonicResidual();
            done = true;
        }

        function draw() {
            if (!ready || !D) {
                ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
                return;
            }
            ctx.drawImage(under, 0, 0);
            const ratio = cssRatio();

            /* Color is current displacement, not foreknowledge of the final
               solve: the opening lattice begins entirely at Still and the
               warm bands arrive only as vertices actually move. */
            for (let k = 0; k < edgeA.length; k++) {
                const a = edgeA[k], b = edgeB[k];
                const da = Math.hypot(x[a] - latX[a], y[a] - latY[a]);
                const db = Math.hypot(x[b] - latX[b], y[b] - latY[b]);
                edgeBand[k] = Math.min(11, Math.floor(12 * (da + db) /
                    (2 * D.maxDisplacement || 1)));
            }
            ctx.lineCap = 'round';
            for (let band = 0; band < 12; band++) {
                ctx.beginPath();
                for (let k = 0; k < edgeA.length; k++) {
                    if (edgeBand[k] !== band) continue;
                    const a = edgeA[k], b = edgeB[k];
                    ctx.moveTo(sx(x[a]), sy(y[a]));
                    ctx.lineTo(sx(x[b]), sy(y[b]));
                }
                const u = Math.round(band / 11 * 255) * 3;
                ctx.strokeStyle = 'rgb(' + COLOUR[u] + ',' + COLOUR[u + 1] + ',' + COLOUR[u + 2] + ')';
                ctx.lineWidth = Math.max(1.4 * ratio, 2); ctx.stroke();
            }

            ctx.beginPath();
            const rr = Math.max(2.2 * ratio, 3.2);
            for (let i = 0; i < D.n; i++) if (boundary[i]) {
                const xx = sx(x[i]), yy = sy(y[i]);
                ctx.moveTo(xx + rr, yy); ctx.arc(xx, yy, rr, 0, Math.PI * 2);
            }
            ctx.fillStyle = '#F0E442'; ctx.fill();
            ctx.strokeStyle = '#08070B'; ctx.lineWidth = Math.max(1, ratio); ctx.stroke();
            report();
        }

        function report() {
            if (outSweeps) outSweeps.textContent = nf.format(sweeps);
            if (outSites) outSites.textContent = nf.format(D.n);
            if (outMove) {
                let total = 0;
                for (let i = 0; i < D.n; i++) total += Math.hypot(x[i] - latX[i], y[i] - latY[i]);
                outMove.textContent = (total / D.n).toFixed(2);
            }
            if (outResidual) outResidual.textContent = residual < 1e-3
                ? residual.toExponential(1) : residual.toFixed(3);
            if (note) note.textContent = done
                ? 'Harmonic coordinates reached'
                : (sweeps ? 'Relaxing coordinates' : 'Boundary values fixed');
        }

        /* Watch is a clock, not a sweep count: three sweeps a second at
           first, so the lattice is seen to melt, then the rate rises by 1.6
           every second and the coordinates settle within a quarter minute. */
        function watchTick() {
            if (done) return false;
            const now = performance.now();
            if (!watchBegan) watchBegan = now;
            const t = (now - watchBegan) / 1000;
            watchAcc += Math.min(140, 3 * Math.pow(1.6, t)) * EVERY / 1000;
            const count = Math.floor(watchAcc); watchAcc -= count;
            for (let q = 0; q < count && !done; q++) relaxOne();
            draw(); syncControls();
            return !done;
        }

        function growFrame() {
            if (done) return false;
            const began = performance.now();
            let q = 0;
            while (!done && q++ < FAST_CAP && performance.now() - began < 7) relaxOne();
            draw(); syncControls();
            return !done;
        }

        function finishNow() {
            if (!D) return;
            settleExact(); draw(); syncControls();
        }

        const clock = paced({ watch: WATCH, every: EVERY, tick: watchTick,
                              frame: growFrame, finish: finishNow });

        function loadCluster(k, autoplay) {
            if (!DATA || !DATA[k]) return;
            clock.stop(); key = k; D = DATA[k];
            const n = D.n;
            latX = new Float64Array(n); latY = new Float64Array(n);
            solX = new Float64Array(n); solY = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                latX[i] = D.lattice[i][0]; latY[i] = D.lattice[i][1];
                solX[i] = D.harmonic[i][0]; solY[i] = D.harmonic[i][1];
            }
            x = latX.slice(); y = latY.slice(); nx = new Float64Array(n); ny = new Float64Array(n);
            off = Int32Array.from(D.off); nbr = Int32Array.from(D.nbr);
            boundary = Uint8Array.from(D.boundary);
            edgeA = new Int32Array(D.edges.length); edgeB = new Int32Array(D.edges.length);
            edgeBand = new Uint8Array(D.edges.length);
            const disp = new Float64Array(n);
            for (let i = 0; i < n; i++) disp[i] = Math.hypot(solX[i] - latX[i], solY[i] - latY[i]);
            for (let q = 0; q < D.edges.length; q++) {
                const a = D.edges[q][0], b = D.edges[q][1];
                edgeA[q] = a; edgeB[q] = b;
                edgeBand[q] = Math.min(11, Math.floor(12 * (disp[a] + disp[b]) / (2 * D.maxDisplacement || 1)));
            }
            guides = Array.from({length:n}, function (_, i) { return i; })
                .sort(function (a, b) { return disp[b] - disp[a]; }).slice(0, 44);
            sweeps = 0; residual = harmonicResidual(); done = false; ready = true;
            watchBegan = 0; watchAcc = 0;
            makeUnderlay(); userPaused = !autoplay || REDUCED;
            clock.slow(pace === 'watch' ? WATCH : 0);
            draw(); syncControls();
        }

        function syncControls() {
            $$('[data-harmonic-cluster]').forEach(function (b) {
                const on = b.dataset.harmonicCluster === key;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
                b.disabled = !ready;
            });
            $$('[data-harmonic-pace]').forEach(function (b) {
                const on = b.dataset.harmonicPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
                b.disabled = !ready;
            });
            const play = $('[data-harmonic-run="pause"]');
            if (play) {
                const active = ready && !REDUCED && !userPaused && !done;
                play.textContent = REDUCED ? 'Paused' : (active ? 'Pause' : 'Play');
                play.classList.toggle('is-on', active);
                play.setAttribute('aria-pressed', String(active));
                play.disabled = !ready || REDUCED || done;
            }
            $$('[data-harmonic-run="step"]').forEach(function (b) { b.disabled = !ready || REDUCED || done; });
            $$('[data-harmonic-run="replay"]').forEach(function (b) { b.disabled = !ready; });
        }

        function startForPace() {
            clock.stop(); clock.slow(pace === 'watch' ? WATCH : 0);
            if (ready && pageAwake && !REDUCED && !userPaused && !done) clock.start();
            syncControls();
        }

        fetch((window.galleryAssets && window.galleryAssets.harmonicRun)
            || 'plates/p-harmonic-run.json').then(function (r) { return r.json(); })
            .then(function (j) {
                DATA = j; loadCluster(key, !REDUCED);
                if (REDUCED) finishNow(); else startForPace();
            }).catch(function (e) {
                console.warn('harmonic coordinates:', e);
                ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            });

        $$('[data-harmonic-cluster]').forEach(function (b) {
            b.addEventListener('click', function () {
                const k = b.dataset.harmonicCluster;
                if (!ready || k === key) return;
                const wasPaused = userPaused;
                loadCluster(k, !wasPaused && !REDUCED);
                if (REDUCED) finishNow(); else startForPace();
            });
        });
        $$('[data-harmonic-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                pace = b.dataset.harmonicPace; startForPace();
            });
        });
        $$('[data-harmonic-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ready) return;
                const action = b.dataset.harmonicRun;
                if (action === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); draw(); syncControls(); }
                    else { userPaused = false; startForPace(); }
                }
                if (action === 'step' && !REDUCED && !done) {
                    userPaused = true; clock.stop(); relaxOne(); draw(); syncControls();
                }
                if (action === 'replay') {
                    loadCluster(key, !REDUCED); if (REDUCED) finishNow(); else startForPace();
                }
            });
        });

        draw(); syncControls();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () {
                pageAwake = true; if (ready) draw();
                if (ready && !REDUCED && !userPaused && !done) startForPace();
            }
        };
    };

    makers.peeling = function () {
        const canvas = $('#peel-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const N = 30000;

        let px, py, alive, stamp, sorts, lives, chains,
            nLayers, nAlive, pending, held, prepared, watchPhase;
        let showCurves = true, showHull = true, curvesBtn = null;
        let pace = 'watch', userPaused = false, pageAwake = true;
        /* the unit square sits inside a small margin, so its boundary is seen
           as a boundary rather than as the edge of the canvas */
        const PAD = Math.round(W * .04), SPAN = W - 2 * PAD;
        function X(v) { return PAD + v * SPAN; }
        function Y(v) { return PAD + (1 - v) * SPAN; }

        const elN = $('#peel-n'), elAlive = $('#peel-alive'),
              elLayers = $('#peel-layers'), elRatio = $('#peel-ratio'),
              elLimit = $('#peel-limit'), note = $('#peel-note');

        /* The norm enters the theorem only through the facet cones of its unit
           ball, so a norm is entered here as the vertices of that ball and
           every cone is derived from them. The facet from v to w spans the
           cone {av + bw : a, b >= 0}; take f normal to w and g normal to v,
           each signed positive on the cone. Then a live point is minimal for
           that cone exactly when, sweeping by f ascending, g reaches a new
           running minimum -- the x-sweep with a running minimum in y that
           found the quadrant staircases, written for any facet. Antipodal
           facets have f of opposite sign, so they share one sorted order read
           backwards: two sorts for the quadrilaterals, three for the hexagon.
           inv inverts (f.p, g.p) -> p, which is what the hull corners need.
           Checked layer for layer against brute-force cone minimality at
           n = 300 for all three balls. */
        function conesOf(verts) {
            const cones = [], keys = [];
            for (let k = 0; k < verts.length; k++) {
                const v = verts[k], w = verts[(k + 1) % verts.length];
                let f = [-w[1], w[0]]; if (f[0] * v[0] + f[1] * v[1] < 0) f = [-f[0], -f[1]];
                let g = [-v[1], v[0]]; if (g[0] * w[0] + g[1] * w[1] < 0) g = [-g[0], -g[1]];
                const len = Math.hypot(f[0], f[1]);
                let dir = [f[0] / len, f[1] / len], rev = false;
                if (dir[0] < -1e-9 || (Math.abs(dir[0]) < 1e-9 && dir[1] < 0)) {
                    dir = [-dir[0], -dir[1]]; rev = true;
                }
                let key = -1;
                for (let j = 0; j < keys.length; j++) {
                    if (Math.abs(keys[j][0] - dir[0]) < 1e-9 && Math.abs(keys[j][1] - dir[1]) < 1e-9) key = j;
                }
                if (key < 0) { key = keys.length; keys.push(dir); }
                const det = f[0] * g[1] - f[1] * g[0];
                cones.push({ f: f, g: g, key: key, rev: rev,
                             inv: [g[1] / det, -f[1] / det, -g[0] / det, f[0] / det] });
            }
            return { cones: cones, keys: keys };
        }

        const R = function (k) { return [Math.cos(Math.PI * k / 3), Math.sin(Math.PI * k / 3)]; };

        /* depth is the number the layer count over sqrt(n) approaches, so a
           shade means the same fraction of the peel under every norm: it is
           max u where a limit is known, and for the hexagon the measured
           0.425 of bake/peeling.py, which is a constant of the picture and
           not of the theorem. hold is frames per layer, so no norm is over
           before it can be watched. Levels are s/8 of the maximum, s = 1..7,
           the same fractions in every case and the ones the plate draws. */
        const NORMS = {
            l1: {
                ball: [[1, 0], [0, 1], [-1, 0], [0, -1]],
                depth: 1, umax: 1, hold: 4,
                u: function (x, y) {
                    return 2 * Math.sqrt(Math.min(x, 1 - x) * Math.min(y, 1 - y));
                },
                /* level sets of u = 2 sqrt( min(x,1-x) min(y,1-y) ): four
                   hyperbolic arcs meeting in cusps on the mid-lines */
                level: function (c, s) {
                    const t = s / 8, k = t * t / 4;
                    for (let branch = 0; branch < 2; branch++) {
                        c.beginPath();
                        let open = false;
                        for (let q = 0; q <= 2000; q++) {
                            const xx = q / 2000, a = Math.min(xx, 1 - xx);
                            if (a < 2 * k) { open = false; continue; }
                            const b = k / a, yy = branch ? 1 - b : b;
                            const sx = X(xx), sy = Y(yy);
                            if (!open) { c.moveTo(sx, sy); open = true; } else c.lineTo(sx, sy);
                        }
                        c.stroke();
                    }
                },
                note: 'The last figure converges to 1, the maximum of the limiting solution on the unit square.'
            },
            linf: {
                ball: [[1, 1], [-1, 1], [-1, -1], [1, -1]],
                depth: Math.SQRT1_2, umax: Math.SQRT1_2, hold: 4,
                u: function (x, y) {
                    return Math.SQRT2 * Math.min(Math.min(x, 1 - x), Math.min(y, 1 - y));
                },
                /* level sets of u = sqrt(2) min(x, 1-x, y, 1-y): the level
                   s/8 of the maximum is the square inset by s/16 */
                level: function (c, s) {
                    const m = s / 16;
                    c.strokeRect(X(m), Y(1 - m), (1 - 2 * m) * SPAN, (1 - 2 * m) * SPAN);
                },
                note: 'The last figure converges to √2/2 ≈ 0.707, the maximum of √2·min(x, 1−x, y, 1−y); its level sets are concentric squares.'
            },
            hex: {
                ball: [R(0), R(1), R(2), R(3), R(4), R(5)],
                depth: 0.428, umax: null, hold: 6, u: null, level: null,
                note: 'No closed form for this limit is known, so no curves are drawn: the least of the six single-cone solutions is 0.82 at the centre, and the peel measures 0.43.'
            }
        };

        /* The rest of the family. A norm's Pareto hull is decided by the facet
           cones of its unit ball, so any convex polygon gives another peel, and
           the regular m-gons make the trend legible: the rounder the ball, the
           shallower the peel. Each depth below is measured, three clouds of
           Poisson(30,000) each, by bake/peeling.py -- 1.116, 0.952, 0.680,
           0.578, 0.428, 0.319, 0.255, 0.215 for m = 3, 4, 4 turned, 5, 6, 8,
           10, 12. Only the two quadrilaterals have a known limiting solution,
           so only they draw curves. The trend is the point: a strictly convex
           ball has no facets at all, and hull peeling then runs on n^(2/3)
           with an affine curvature flow, not on sqrt(n). */
        const NG = function (m, rot) {
            const out = [];
            for (let k = 0; k < m; k++) {
                const a = 2 * Math.PI * k / m + rot;
                out.push([Math.cos(a), Math.sin(a)]);
            }
            return out;
        };
        const EXTRA_BALLS = [
            ['tri', 3, Math.PI / 2, 1.116, 1],
            ['pent', 5, Math.PI / 2, 0.578, 2],
            ['oct', 8, Math.PI / 8, 0.319, 3],
            ['deca', 10, Math.PI / 2, 0.255, 3],
            ['dodeca', 12, 0, 0.215, 4]
        ];
        EXTRA_BALLS.forEach(function (b) {
            NORMS[b[0]] = {
                ball: NG(b[1], b[2]), depth: b[3], umax: null, hold: 3 * b[4],
                u: null, level: null,
                note: 'The regular ' + b[1] + '-gon: ' + b[1] + ' facet cones, and a peel measured at '
                    + b[3].toFixed(3) + '\u00b7\u221an layers. No closed form for this limit is known, so no curves are drawn.'
            };
        });
        let normKey = 'l1', norm = NORMS.l1, cones = null;

        /* Two layers the size of the canvas: the points accumulate on one, the
           limit curves are stroked onto the other as the peel reaches them,
           and each frame composites the two. Re-stroking the curves every
           frame is what turned them into opaque bars across the front they are
           there to be compared with, and compositing is also what makes the
           toggle able to erase. */
        const ptsC = document.createElement('canvas');
        ptsC.width = ptsC.height = W;
        const pctx = ptsC.getContext('2d');
        const curveC = document.createElement('canvas');
        curveC.width = curveC.height = W;
        const cctx = curveC.getContext('2d');

        function strokeLevel(s) {
            cctx.strokeStyle = 'rgba(255,248,232,.62)';
            cctx.lineWidth = 2;
            norm.level(cctx, s);
        }

        function reset() {
            clock.stop();
            /* Poisson(N), as the theorem is stated and as bake/peeling.py
               draws: 300 runs of the product method at mean 100 each. Exact,
               and a quarter of the calls the old Binomial(4N, 1/4) cost for a
               variance that was three quarters of the right one. */
            const L = Math.exp(-100);
            let n = 0;
            for (let b = 0; b < N / 100; b++) {
                let k = -1, p = 1;
                do { k++; p *= Math.random(); } while (p > L);
                n += k;
            }
            px = new Float64Array(n); py = new Float64Array(n);
            for (let i = 0; i < n; i++) { px[i] = Math.random(); py[i] = Math.random(); }
            alive = new Uint8Array(n); stamp = new Int32Array(n);
            build();
        }

        /* Everything that depends on the norm: its cones, one sorted order per
           sweep direction, and a fresh peel of the cloud that is already on
           screen. Switching norms re-peels the same points, which is the
           comparison the picture is for. */
        function build() {
            clock.stop();
            const c = conesOf(norm.ball);
            cones = c.cones;
            sorts = c.keys.map(function (d) {
                const idx = Array.from({ length: px.length }, function (_, i) { return i; });
                return idx.sort(function (a, b) {
                    return (d[0] * px[a] + d[1] * py[a]) - (d[0] * px[b] + d[1] * py[b]);
                });
            });
            lives = sorts.map(function (s) { return s.slice(); });
            alive.fill(1); stamp.fill(0);
            nLayers = 0; nAlive = px.length; pending = 1; held = 0;
            chains = null; prepared = false; watchPhase = 'front';

            pctx.clearRect(0, 0, W, W);
            /* the cloud is drawn before any of it is peeled, so the reader can
               see what the fronts are being taken off; --slate at half over
               the ink ground, dim enough that the innermost peeled layers,
               which land on slate itself, still read against it */
            /* the surviving points must stay visible: the front is seen eating
               them, and what is left is the interior the next front finds */
            pctx.fillStyle = 'rgba(160,160,172,.6)';
            for (let i = 0; i < px.length; i++) {
                pctx.fillRect(X(px[i]) - 1, Y(py[i]) - 1, 2, 2);
            }
            cctx.clearRect(0, 0, W, W);
            if (curvesBtn) {
                curvesBtn.disabled = !norm.level;
                curvesBtn.setAttribute('aria-pressed', String(showCurves && !!norm.level));
            }
            if (elLimit) elLimit.textContent = norm.note;
            composite();
            update();
        }

        function composite() {
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, W);
            ctx.strokeStyle = 'rgba(201,191,168,.22)'; ctx.lineWidth = 1.5;
            ctx.strokeRect(PAD - 2, PAD - 2, SPAN + 4, SPAN + 4);
            ctx.drawImage(ptsC, 0, 0);
            if (showCurves && norm.level) ctx.drawImage(curveC, 0, 0);
            if (showHull && chains && nAlive) strokeHull();
            if (prepared && watchPhase === 'commit') strokeSelection();
        }

        /* Prepare one layer without changing the cloud. This separates the
           mathematical decision (the union of all cone minima) from its
           removal, so Watch can show the mechanism instead of teleporting
           from one completed layer to the next. */
        function prepareLayer() {
            if (prepared) return true;
            if (!lives[0].length) return false;
            const layer = nLayers + 1;
            chains = [];
            for (let c = 0; c < cones.length; c++) {
                const cn = cones[c], Lv = lives[cn.key], m = Lv.length,
                      g0 = cn.g[0], g1 = cn.g[1], rev = cn.rev, chain = [];
                let best = Infinity;
                for (let q = 0; q < m; q++) {
                    const i = Lv[rev ? m - 1 - q : q];
                    const gv = g0 * px[i] + g1 * py[i];
                    if (gv < best) { best = gv; stamp[i] = layer; chain.push(i); }
                }
                chains.push(chain);
            }
            prepared = true;
            return true;
        }

        function commitPrepared() {
            if (!prepared && !prepareLayer()) return false;
            const layer = nLayers + 1;
            pctx.fillStyle = colourFor(layer);
            const track = !!norm.u && pending <= 7;
            let minU = Infinity;
            const L0 = lives[0];
            for (let q = 0; q < L0.length; q++) {
                const i = L0[q];
                if (stamp[i] === layer) {
                    alive[i] = 0; nAlive--;
                    pctx.fillRect(X(px[i]) - 1.5, Y(py[i]) - 1.5, 3, 3);
                } else if (track) {
                    const uv = norm.u(px[i], py[i]);
                    if (uv < minU) minU = uv;
                }
            }
            for (let j = 0; j < lives.length; j++) {
                const arr = lives[j];
                let w = 0;
                for (let r = 0; r < arr.length; r++) { const i = arr[r]; if (alive[i]) arr[w++] = i; }
                arr.length = w;
            }
            /* A limit curve is laid down at the layer the peel crosses it: the
               first layer whose survivors all lie inside its level set. The
               curves arrive where the front is because they are what the
               fronts converge to; none is stroked in advance, and the last
               layer, which leaves no survivors, strokes whatever is left. */
            if (track) {
                while (pending <= 7 && minU >= norm.umax * pending / 8) { strokeLevel(pending); pending++; }
            }
            nLayers = layer;
            prepared = false;
            return true;
        }

        /* Grow, Step, and reduced motion all use this same atomic commit. */
        function peelOnce() {
            if (!prepareLayer()) return false;
            return commitPrepared();
        }

        /* The boundary the caption names, drawn as it comes off: each cone's
           minimal points in sweep order, with the corner between consecutive
           records at (f of the later, g of the earlier) mapped back through
           that cone's own frame, so the staircase runs along the facet the
           cone was cut from. Stroked on the composite, never accumulated, so
           it travels inward with the peel and is gone when the square is
           empty -- a hairline that follows the front, not a band across it. */
        function strokeHull() {
            ctx.strokeStyle = '#F0E442';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.globalAlpha = .9;
            for (let c = 0; c < cones.length; c++) {
                const cn = cones[c], ch = chains[c];
                if (!ch || ch.length < 2) continue;
                const iv = cn.inv;
                let fv = cn.f[0] * px[ch[0]] + cn.f[1] * py[ch[0]],
                    gv = cn.g[0] * px[ch[0]] + cn.g[1] * py[ch[0]];
                ctx.beginPath();
                ctx.moveTo(X(px[ch[0]]), Y(py[ch[0]]));
                for (let j = 1; j < ch.length; j++) {
                    const i = ch[j];
                    const fj = cn.f[0] * px[i] + cn.f[1] * py[i],
                          gj = cn.g[0] * px[i] + cn.g[1] * py[i];
                    const cx = iv[0] * fj + iv[1] * gv, cy = iv[2] * fj + iv[3] * gv;
                    ctx.lineTo(X(cx), Y(cy));
                    ctx.lineTo(X(px[i]), Y(py[i]));
                    fv = fj; gv = gj;
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        function strokeSelection() {
            const layer = nLayers + 1;
            ctx.beginPath();
            for (let q = 0; q < lives[0].length; q++) {
                const i = lives[0][q];
                if (stamp[i] !== layer) continue;
                const x = X(px[i]), y = Y(py[i]);
                ctx.moveTo(x + 5, y); ctx.arc(x, y, 5, 0, Math.PI * 2);
            }
            ctx.fillStyle = '#F0E442'; ctx.fill();
            ctx.strokeStyle = '#08070B'; ctx.lineWidth = 2; ctx.stroke();
        }

        /* Peeling depth follows the same vivid ramp under every norm:
           violet -> rose -> cyan -> white from the outside inward. */
        function colourFor(k) {
            const t = Math.min(1, k / Math.max(1, norm.depth * Math.sqrt(px.length)));
            const stops = [[111, 94, 224], [204, 121, 167],
                           [150, 205, 240], [255, 248, 232]];
            const u = t * (stops.length - 1), lo = Math.floor(u),
                  hi = Math.min(stops.length - 1, lo + 1), f = u - lo;
            return 'rgb(' + Math.round(stops[lo][0] + (stops[hi][0] - stops[lo][0]) * f) + ',' +
                            Math.round(stops[lo][1] + (stops[hi][1] - stops[lo][1]) * f) + ',' +
                            Math.round(stops[lo][2] + (stops[hi][2] - stops[lo][2]) * f) + ')';
        }

        function update() {
            const n = px.length;
            elN.textContent = nf.format(n);
            elAlive.textContent = nf.format(nAlive);
            elLayers.textContent = nf.format(nLayers);
            elRatio.textContent = nLayers ? (Math.round(nLayers / Math.sqrt(n) * 1000) / 1000) : '\u2014';
        }

        function finishNow() {                 /* the still: every layer, every curve */
            while (peelOnce()) { }
            chains = null;
            composite();
            update();
            note.textContent = 'Complete';
            syncControls();
        }

        function growBeat() {
            if (!nAlive) return false;
            const ok = peelOnce();
            composite(); update();
            note.textContent = nAlive ? 'Layer ' + nf.format(nLayers) : 'Complete';
            syncControls();
            return ok && nAlive > 0;
        }

        /* Watch is a four-beat proof: reveal the record staircases, mark their
           union, remove that union, then hold on the new interior. */
        function watchBeat() {
            if (!nAlive) return false;
            /* the four-beat proof is shown for the first layers; once the
               mechanism has been seen the peel runs at two beats a layer */
            const quick = nLayers >= 6;
            if (watchPhase === 'front') {
                if (!prepareLayer()) return false;
                watchPhase = quick ? 'commit' : 'select';
                note.textContent = quick ? 'Layer ' + nf.format(nLayers + 1) : 'Identify outer front';
            } else if (watchPhase === 'select') {
                watchPhase = 'commit';
                note.textContent = 'Select minimal points';
            } else if (watchPhase === 'commit') {
                commitPrepared();
                /* the next front is prepared at once, so the yellow front never
                   blinks off between layers */
                if (nAlive) prepareLayer();
                if (quick) watchPhase = 'front';
                else watchPhase = 'hold';
                note.textContent = nAlive ? (quick ? 'Layer ' + nf.format(nLayers) : 'Remove layer') : 'Complete';
            } else {
                watchPhase = 'front';
                note.textContent = nAlive ? 'Advance to next layer' : 'Complete';
            }
            composite(); update(); syncControls();
            return nAlive > 0;
        }

        const clock = paced({
            watch: 0x3fffffff, every: 140,
            tick: watchBeat,
            frame: function () {
                if (++held < norm.hold) return true;
                held = 0;
                return growBeat();
            },
            finish: finishNow
        });

        function syncControls() {
            $$('[data-peel-norm]').forEach(function (b) {
                const on = b.dataset.peelNorm === normKey;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-peel-pace]').forEach(function (b) {
                const on = b.dataset.peelPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            if (curvesBtn) {
                curvesBtn.disabled = !norm.level;
                curvesBtn.classList.toggle('is-on', showCurves && !!norm.level);
                curvesBtn.setAttribute('aria-pressed', String(showCurves && !!norm.level));
            }
            const hull = $('[data-peel="hull"]');
            if (hull) {
                hull.classList.toggle('is-on', showHull);
                hull.setAttribute('aria-pressed', String(showHull));
            }
            const play = $('[data-peel="pause"]');
            if (play) {
                const active = !REDUCED && !userPaused && nAlive > 0;
                play.textContent = REDUCED ? 'Paused' : (active ? 'Pause' : 'Play');
                play.classList.toggle('is-on', active);
                play.setAttribute('aria-pressed', String(active));
                play.disabled = REDUCED || !nAlive;
            }
            const step = $('[data-peel="step"]');
            if (step) step.disabled = REDUCED || !nAlive;
        }

        function startForPace() {
            clock.stop(); clock.slow(pace === 'watch' ? 0x3fffffff : 0);
            if (!REDUCED && pageAwake && !userPaused && nAlive) clock.start();
            syncControls();
        }

        curvesBtn = $('[data-peel="curves"]');

        $$('[data-peel-norm]').forEach(function (b) {
            b.addEventListener('click', function () {
                const key = b.dataset.peelNorm;
                if (key === normKey || !NORMS[key]) return;
                const wasPaused = userPaused;
                normKey = key; norm = NORMS[key];
                build();
                userPaused = REDUCED || wasPaused; note.textContent = 'Ready';
                if (REDUCED) finishNow(); else startForPace();
            });
        });

        $$('[data-peel-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                pace = b.dataset.peelPace;
                startForPace();
            });
        });

        $$('[data-peel]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.peel;
                if (a === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); syncControls(); }
                    else { userPaused = false; startForPace(); }
                }
                if (a === 'step' && !REDUCED && nAlive) {
                    userPaused = true; clock.stop();
                    peelOnce(); watchPhase = 'hold';
                    composite(); update();
                    note.textContent = nAlive ? 'Layer ' + nf.format(nLayers) : 'Complete';
                    syncControls();
                }
                if (a === 'reset') {
                    reset(); userPaused = REDUCED; note.textContent = 'Ready';
                    if (REDUCED) finishNow(); else startForPace();
                }
                if (a === 'curves') {
                    showCurves = !showCurves;
                    composite(); syncControls();
                }
                if (a === 'hull') {
                    showHull = !showHull;
                    composite(); syncControls();
                }
            });
        });

        reset(); userPaused = REDUCED; syncControls();
        if (REDUCED) finishNow(); else startForPace();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () {
                pageAwake = true; composite(); update();
                if (!REDUCED && !userPaused && nAlive) startForPace();
            }
        };
    };

    /* ---------------- IX — elsewhere ---------------- */


    /* ---- Brownian motion in an incompressible random drift ---- */

    /* One exact, measured escape. The amber orbit is the noiseless flow on a
       single level line. The rose path uses drift and noise. Cyan flashes are
       the actual stored Wiener increments, not decorative cross-contour
       arrows. All three data streams share the same field and starting point. */
    /* Retained as a numerical reference for the exact 12,001-point escape
       experiment. The live page now uses the four-octave mechanism below. */
    makers.superdiffusionLegacy = function () {
        const canvas = $('#sd-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, Q = W / 1200;
        const note = $('#sd-note'), timeOut = $('#sd-time'), netOut = $('#sd-net');
        const maxOut = $('#sd-max'), scaleOut = $('#sd-scale');

        let D = null, field = null, ready = false;
        const PATH_BANDS = 24;
        let pathBands = null, driftPath = null, orbitPath = null;
        let cursor = 0, index = 0, drawn = 0, driftDrawn = 0;
        let speed = 'fast', view = 'follow', running = false, userPaused = false;
        let raf = 0, lastFrame = 0, pageWasRunning = false;
        let minX = null, maxX = null, minY = null, maxY = null, maxDistance = null;
        let kickEvents = [], latestKick = -1, periodPoints = 0, orbitBounds = null;
        const cam = { x: 0, y: 0, h: 42 };

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function screenPoint(x, y) {
            return [W / 2 + (y - cam.y) * W / (2 * cam.h),
                    W / 2 + (x - cam.x) * W / (2 * cam.h)];
        }
        function colourAt(t) {
            const stops = [[138,127,209], [204,121,167], [255,208,160]];
            const q = clamp(t, 0, 1) * 2, k = Math.min(1, Math.floor(q)), u = q - k;
            const a = stops[k], b = stops[k + 1];
            return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' +
                            Math.round(a[1] + (b[1] - a[1]) * u) + ',' +
                            Math.round(a[2] + (b[2] - a[2]) * u) + ')';
        }
        function appendSegment(path, x0, y0, x1, y1) {
            if (Math.hypot(x1 - x0, y1 - y0) > 2 * D.half / 3) return;
            path.moveTo(y0, x0); path.lineTo(y1, x1);
        }
        function strokeWorld(path, colour, width, shadowAlpha) {
            const s = D.out / (2 * D.half);
            ctx.strokeStyle = 'rgba(8,7,11,' + shadowAlpha + ')';
            ctx.lineWidth = (width + 2.6) / s; ctx.stroke(path);
            ctx.strokeStyle = colour;
            ctx.lineWidth = width / s; ctx.stroke(path);
        }
        function clearLayers() {
            pathBands = Array.from({ length: PATH_BANDS }, function () { return new Path2D(); });
            driftPath = new Path2D();
            orbitPath = new Path2D();
            if (periodPoints > 1) {
                for (let i = 0; i <= periodPoints; i++) {
                    if (!i) orbitPath.moveTo(D.ty[i], D.tx[i]);
                    else orbitPath.lineTo(D.ty[i], D.tx[i]);
                }
            }
            drawn = 0; driftDrawn = 0;
        }
        function drawUntil(to) {
            if (to < drawn) clearLayers();
            const n = D.px.length - 1;
            for (let i = Math.max(1, drawn + 1); i <= to; i++) {
                const band = Math.min(PATH_BANDS - 1, Math.floor(i / n * PATH_BANDS));
                appendSegment(pathBands[band], D.px[i - 1], D.py[i - 1],
                              D.px[i], D.py[i]);
            }
            drawn = Math.max(drawn, to);

            const td = Math.min(periodPoints, Math.floor(to / 2));
            for (let i = Math.max(1, driftDrawn + 1); i <= td; i++)
                appendSegment(driftPath, D.tx[i - 1], D.ty[i - 1], D.tx[i], D.ty[i]);
            driftDrawn = Math.max(driftDrawn, td);
        }
        function cameraTarget() {
            if (view === 'whole') return { x: D.centre[0], y: D.centre[1], h: D.half };
            const lx = Math.min(minX[index], orbitBounds.minX);
            const hx = Math.max(maxX[index], orbitBounds.maxX);
            const ly = Math.min(minY[index], orbitBounds.minY);
            const hy = Math.max(maxY[index], orbitBounds.maxY);
            const h = clamp(Math.max(42, 8 + 1.20 * maxDistance[index],
                                     .60 * Math.max(hx - lx, hy - ly)), 42, D.half - 4);
            let x = (lx + hx) / 2;
            let y = (ly + hy) / 2;
            x = clamp(x, D.centre[0] - D.half + h, D.centre[0] + D.half - h);
            y = clamp(y, D.centre[1] - D.half + h, D.centre[1] + D.half - h);
            return { x: x, y: y, h: h };
        }
        function moveCamera(snap) {
            const q = cameraTarget(), a = snap ? 1 : .105;
            cam.x += (q.x - cam.x) * a;
            cam.y += (q.y - cam.y) * a;
            cam.h = Math.exp(Math.log(cam.h) + (Math.log(q.h) - Math.log(cam.h)) * a);
        }
        function drawArrow(a, b, colour) {
            const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            ctx.strokeStyle = '#08070B'; ctx.lineWidth = 12 * Q; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            ctx.strokeStyle = colour; ctx.lineWidth = 6 * Q; ctx.stroke();
            if (len < 8 * Q) {
                ctx.beginPath(); ctx.arc(b[0], b[1], 7 * Q, 0, Math.PI * 2);
                ctx.fillStyle = colour; ctx.fill();
                ctx.strokeStyle = '#08070B'; ctx.lineWidth = 3 * Q; ctx.stroke();
                return;
            }
            const ux = dx / len, uy = dy / len, px = -uy, py = ux;
            ctx.beginPath(); ctx.moveTo(b[0], b[1]);
            ctx.lineTo(b[0] - ux * 16 * Q + px * 9 * Q,
                       b[1] - uy * 16 * Q + py * 9 * Q);
            ctx.lineTo(b[0] - ux * 16 * Q - px * 9 * Q,
                       b[1] - uy * 16 * Q - py * 9 * Q);
            ctx.closePath(); ctx.fillStyle = colour; ctx.fill();
            ctx.strokeStyle = '#08070B'; ctx.lineWidth = 3 * Q; ctx.stroke();
        }
        function currentKick() {
            let lo = 0, hi = kickEvents.length - 1, found = -1;
            while (lo <= hi) {
                const m = (lo + hi) >> 1;
                if (kickEvents[m] <= index) { found = kickEvents[m]; lo = m + 1; }
                else hi = m - 1;
            }
            return found >= 0 && index - found <= 90 ? found : -1;
        }
        function paintTail() {
            const from = Math.max(0, index - 48);
            ctx.beginPath();
            for (let i = from; i <= index; i++) {
                const q = screenPoint(D.px[i], D.py[i]);
                if (i === from) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
            }
            ctx.strokeStyle = '#08070B'; ctx.lineWidth = 9 * Q; ctx.stroke();
            ctx.strokeStyle = '#FFF8E8'; ctx.lineWidth = 4.8 * Q; ctx.stroke();
        }
        function glyph(x, y, kind) {
            const q = screenPoint(x, y);
            if (kind === 'drift') {
                ctx.beginPath(); ctx.arc(q[0], q[1], 11 * Q, 0, Math.PI * 2);
                ctx.fillStyle = '#0F0E13'; ctx.fill();
                ctx.strokeStyle = '#E69F00'; ctx.lineWidth = 5 * Q; ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(q[0], q[1], 15 * Q, 0, Math.PI * 2);
                ctx.fillStyle = '#F0E442'; ctx.fill();
                ctx.strokeStyle = '#08070B'; ctx.lineWidth = 6 * Q; ctx.stroke();
                ctx.beginPath(); ctx.arc(q[0], q[1], 7 * Q, 0, Math.PI * 2);
                ctx.strokeStyle = '#FFF8E8'; ctx.lineWidth = 2.5 * Q; ctx.stroke();
            }
        }
        function paint() {
            if (!ready) {
                ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
                return;
            }
            const s = D.out / (2 * D.half);
            const srcCX = (cam.y - D.centre[1] + D.half) * s;
            const srcCY = (cam.x - D.centre[0] + D.half) * s;
            const sh = cam.h * s;
            ctx.clearRect(0, 0, W, W);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(field, srcCX - sh, srcCY - sh, 2 * sh, 2 * sh, 0, 0, W, W);

            const z = W / (2 * cam.h);
            ctx.save();
            ctx.setTransform(z, 0, 0, z, W / 2 - cam.y * z, W / 2 - cam.x * z);
            ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(8,7,11,.42)'; ctx.lineWidth = 6 / s; ctx.stroke(orbitPath);
            ctx.strokeStyle = 'rgba(230,159,0,.36)'; ctx.lineWidth = 2.6 / s; ctx.stroke(orbitPath);
            strokeWorld(driftPath, '#E69F00', 3.5, .72);
            for (let b = 0; b < PATH_BANDS; b++)
                strokeWorld(pathBands[b], colourAt((b + .5) / PATH_BANDS), 5.2, .72);
            ctx.restore();

            const shade = ctx.createRadialGradient(W / 2, W / 2, W * .24,
                                                   W / 2, W / 2, W * .72);
            shade.addColorStop(0, 'rgba(15,14,19,0)');
            shade.addColorStop(1, 'rgba(15,14,19,.14)');
            ctx.fillStyle = shade; ctx.fillRect(0, 0, W, W);

            paintTail();
            const ti = Math.min(D.tx.length - 1, Math.floor(index / 2));
            glyph(D.tx[ti], D.ty[ti], 'drift');

            latestKick = currentKick();
            if (latestKick >= 4) {
                const j = latestKick / 4;
                const dx = D.wx[j] - D.wx[j - 1], dy = D.wy[j] - D.wy[j - 1];
                drawArrow(screenPoint(D.px[latestKick - 4], D.py[latestKick - 4]),
                          screenPoint(D.px[latestKick - 4] + dx,
                                      D.py[latestKick - 4] + dy), '#A8D8E8');
            }
            glyph(D.px[index], D.py[index], 'particle');
            updateReadout();
        }
        function updateReadout() {
            const dx = D.px[index] - D.start[0], dy = D.py[index] - D.start[1];
            if (timeOut) timeOut.textContent = nf.format(Math.round(index * D.dt * D.rec));
            if (netOut) netOut.textContent = Math.hypot(dx, dy).toFixed(1);
            if (maxOut) maxOut.textContent = maxDistance[index].toFixed(1);
            if (scaleOut) scaleOut.textContent = nf.format(Math.round(2 * cam.h));
            if (note) {
                if (latestKick >= 0) note.textContent = 'Brownian noise crosses a separatrix';
                else if (cam.h > 72) note.textContent = 'Entering a larger-scale vortex';
                else if (index < periodPoints * 2) note.textContent = 'Following a streamline';
                else note.textContent = 'Leaving the local vortex';
            }
        }
        function syncControls() {
            $$('[data-sd-speed]').forEach(function (b) {
                const on = b.dataset.sdSpeed === speed;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-sd-view]').forEach(function (b) {
                const on = b.dataset.sdView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-sd-run="pause"]');
            if (play) {
                play.textContent = running ? 'Pause' : 'Play';
                play.classList.toggle('is-on', running);
                play.setAttribute('aria-pressed', String(running));
            }
        }
        function stop(markUser) {
            running = false; cancelAnimationFrame(raf); raf = 0; lastFrame = 0;
            if (markUser) userPaused = true;
            syncControls();
        }
        function frame(now) {
            if (!running) return;
            if (!lastFrame) lastFrame = now;
            const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
            lastFrame = now;
            cursor = Math.min(D.px.length - 1,
                              cursor + dt * (speed === 'fast' ? 600 : 180));
            index = Math.floor(cursor);
            drawUntil(index); moveCamera(false); paint();
            if (index >= D.px.length - 1) { stop(false); return; }
            raf = requestAnimationFrame(frame);
        }
        function start() {
            if (!ready || REDUCED || running) return;
            if (index >= D.px.length - 1) reset(false);
            running = true; userPaused = false; lastFrame = 0;
            syncControls(); raf = requestAnimationFrame(frame);
        }
        function reset(play) {
            if (!ready) return;
            cancelAnimationFrame(raf); running = false; lastFrame = 0;
            cursor = index = 0; clearLayers(); drawUntil(0);
            cam.x = D.start[0]; cam.y = D.start[1]; cam.h = 42;
            moveCamera(true); paint();
            if (play && !REDUCED) start(); else syncControls();
        }
        function prepare() {
            const n = D.px.length;
            minX = new Float32Array(n); maxX = new Float32Array(n);
            minY = new Float32Array(n); maxY = new Float32Array(n);
            maxDistance = new Float32Array(n);
            let ax = D.px[0], bx = ax, ay = D.py[0], by = ay, reach = 0, lastEvent = -999;
            for (let i = 0; i < n; i++) {
                ax = Math.min(ax, D.px[i]); bx = Math.max(bx, D.px[i]);
                ay = Math.min(ay, D.py[i]); by = Math.max(by, D.py[i]);
                reach = Math.max(reach, Math.hypot(D.px[i] - D.start[0],
                                                  D.py[i] - D.start[1]));
                minX[i] = ax; maxX[i] = bx; minY[i] = ay; maxY[i] = by;
                maxDistance[i] = reach;
                if (i >= 4 && i % 4 === 0 &&
                    Math.abs(D.ppsi[i] - D.ppsi[i - 4]) > .50 && i - lastEvent >= 120) {
                    kickEvents.push(i); lastEvent = i;
                }
            }
            periodPoints = Math.min(D.tx.length - 1, Math.round(D.period / (D.dt * D.rec * 2)));
            orbitBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
            for (let i = 0; i <= periodPoints; i++) {
                orbitBounds.minX = Math.min(orbitBounds.minX, D.tx[i]);
                orbitBounds.maxX = Math.max(orbitBounds.maxX, D.tx[i]);
                orbitBounds.minY = Math.min(orbitBounds.minY, D.ty[i]);
                orbitBounds.maxY = Math.max(orbitBounds.maxY, D.ty[i]);
            }
            ready = true;
            if (REDUCED) {
                view = 'whole'; cursor = index = n - 1;
                clearLayers(); drawUntil(index);
                cam.x = D.centre[0]; cam.y = D.centre[1]; cam.h = D.half;
                paint(); stop(false);
            } else reset(true);
        }

        $$('[data-sd-speed]').forEach(function (b) {
            b.addEventListener('click', function () { speed = b.dataset.sdSpeed; syncControls(); });
        });
        $$('[data-sd-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.sdView;
                if (ready) { moveCamera(REDUCED || !running); paint(); }
                syncControls();
            });
        });
        $$('[data-sd-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ready) return;
                if (b.dataset.sdRun === 'pause') { if (running) stop(true); else start(); }
                if (b.dataset.sdRun === 'step') {
                    stop(true);
                    cursor = index = Math.min(D.px.length - 1, index + 4);
                    drawUntil(index); moveCamera(true); paint();
                }
                if (b.dataset.sdRun === 'replay') { userPaused = REDUCED; reset(!REDUCED); }
            });
        });

        Promise.all([
            fetch('plates/p-sd-escape.json').then(function (r) {
                if (!r.ok) throw new Error('trajectory ' + r.status);
                return r.json();
            }),
            loadImage('plates/p-sd-field-void.png')
        ]).then(function (res) {
            D = res[0]; field = res[1]; prepare();
        }).catch(function (err) {
            if (note) note.textContent = 'Field unavailable';
            console.warn('superdiffusion:', err);
        });

        paint(); syncControls();
        return {
            pause: function () {
                pageWasRunning = running;
                if (running) { running = false; cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
            },
            resume: function () {
                if (!REDUCED && ready && pageWasRunning && !userPaused) start();
            }
        };
    };

    /* One uninterrupted diffusion in one frozen random flow. Earlier tours
       chose attractive contours first, ran around each, and bridged between
       them. That made the particle stop while the camera reset -- exactly the
       wrong visual grammar for Brownian motion. Here the path owns the clock.
       The four registered low-pass fields merely reveal structure as one
       continuous world-space trajectory and camera pull back through it. */
    /* The superdiffusion, measured rather than asserted.

       dX = b dt + √(2κ) dW with b = ∇⊥ψ. The drift is divergence free and
       conserves ψ exactly, so at κ = 0 a particle is trapped on a level set
       and never escapes; the noise is the only thing that moves it between
       level sets, and the two together spread FASTER than a diffusion.

       What is drawn is the signature. For any diffusion ⟨|X_t|²⟩/t is a
       constant. Here it climbs — the theorem gives |X_t| ~ √t (log t)^{1/4},
       so ⟨|X_t|²⟩/t ~ (log t)^{1/2}. Both clouds come from bake_sd_race.py,
       run with the same integrator and the same noise; the only difference is
       whether the drift is applied. The still cloud is the control, and it
       returns 4κ = 0.0400 against a measured 0.0403 — so the climbing curve
       is the drift's doing, not the integrator's. */
    makers.sdrace = function () {
        const canvas = $('#build-superdiffusion');
        if (!canvas) return null;
        let film = null, D = null;

        fetch('plates/p-sd-race.json').then(function (r) { return r.json(); }).then(function (d) {
            D = d;
            let far = 1;
            for (let f = 0; f < D.driftX.length; f++) {
                const ax = D.driftX[f], ay = D.driftY[f];
                for (let i = 0; i < ax.length; i++) {
                    const rr = Math.hypot(ax[i], ay[i]) / D.q;
                    if (rr > far) far = rr;
                }
            }
            const CX = 720, CY = 346, RAD = 340;
            const scale = RAD / far;
            const T = D.curve.t, YD = D.curve.drift, YF = D.curve.free;
            let yMax = 0;
            for (let i = 0; i < YD.length; i++) yMax = Math.max(yMax, YD[i]);
            yMax *= 1.12;
            const GX0 = 150, GX1 = 1330, GY0 = 660, GY1 = 858;
            const lt0 = Math.log(T[0]), lt1 = Math.log(T[T.length - 1]);
            const gx = function (t) { return GX0 + (Math.log(t) - lt0) / (lt1 - lt0) * (GX1 - GX0); };
            const gy = function (v) { return GY1 - v / yMax * (GY1 - GY0); };

            function cloud(ctx, ax, ay, colour, alpha, r) {
                ctx.fillStyle = colour;
                ctx.globalAlpha = alpha;
                for (let i = 0; i < ax.length; i++) {
                    ctx.beginPath();
                    ctx.arc(CX + ax[i] / D.q * scale, CY + ay[i] / D.q * scale, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
            function ring(ctx, rms, colour) {
                ctx.strokeStyle = colour; ctx.lineWidth = 2.5;
                ctx.setLineDash([9, 7]);
                ctx.beginPath();
                ctx.arc(CX, CY, rms * scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            function curve(ctx, Y, colour, upto) {
                ctx.strokeStyle = colour; ctx.lineWidth = 3.5;
                ctx.beginPath();
                for (let i = 0; i <= upto && i < Y.length; i++) {
                    const x = gx(T[i]), y = gy(Y[i]);
                    if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            film = loopingFilm('#build-superdiffusion', 1440, 900, 20000, function (ctx, LW, LH, p) {
                const nf = D.frames.length;
                const fi = Math.min(nf - 1, Math.floor(p * nf));
                const t = D.frames[fi];
                let ci = 0;
                while (ci + 1 < T.length && T[ci + 1] <= t) ci++;

                /* the two clouds, same origin, same noise: the compact
                   no-drift cloud is drawn last, so it is seen sitting inside
                   the spreading one instead of buried under it */
                cloud(ctx, D.driftX[fi], D.driftY[fi], PALETTE.cyan, .78, 2.6);
                cloud(ctx, D.freeX[fi], D.freeY[fi], '#D98BA3', .95, 3.3);

                /* the curve that is the whole point: flat is a diffusion */
                ctx.strokeStyle = 'rgba(201,191,168,.30)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(GX0, GY1); ctx.lineTo(GX1, GY1);
                ctx.moveTo(GX0, GY0); ctx.lineTo(GX0, GY1);
                ctx.stroke();
                curve(ctx, YF, PALETTE.rose, ci);
                curve(ctx, YD, PALETTE.cyan, ci);
                ctx.fillStyle = PALETTE.cyan;
                ctx.beginPath(); ctx.arc(gx(T[ci]), gy(YD[ci]), 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = PALETTE.rose;
                ctx.beginPath(); ctx.arc(gx(T[ci]), gy(YF[ci]), 6, 0, Math.PI * 2); ctx.fill();

                /* on a phone the film is a quarter of its logical width, so
                   its labels are set larger to stay legible */
                const cssW = canvas.getBoundingClientRect().width || 1440;
                const mag = Math.max(1, Math.min(2.1, 760 / cssW));
                const fs = Math.round(30 * mag);
                ctx.font = '500 ' + fs + 'px ui-monospace, "IBM Plex Mono", monospace';
                ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                /* the readout is set in the two curve colours, and drops its
                   formula prefix when the stage is too narrow for it */
                const parts = [['⟨|Xₜ−X₀|²⟩ / t   ', 'rgba(201,191,168,.75)'],
                               ['t = ' + t.toFixed(0) + '   ', 'rgba(242,237,226,.9)'],
                               ['drift ' + YD[ci].toFixed(2) + '   ', PALETTE.cyan],
                               ['none ' + YF[ci].toFixed(2), '#D98BA3']];
                let width = parts.reduce(function (s, p) { return s + ctx.measureText(p[0]).width; }, 0);
                if (width > GX1 - GX0) { parts.shift(); width = parts.reduce(function (s, p) { return s + ctx.measureText(p[0]).width; }, 0); }
                let x = GX0;
                parts.forEach(function (p) { ctx.fillStyle = p[1]; ctx.fillText(p[0], x, GY0 - 30 * mag); x += ctx.measureText(p[0]).width; });
                ctx.fillStyle = 'rgba(201,191,168,.7)';
                ctx.font = '400 ' + Math.round(22 * mag) + 'px ui-monospace, "IBM Plex Mono", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('log t', GX1, GY1 + 32);
                ctx.textAlign = 'left';
                ctx.fillText('0', GX0 - 26, GY1 + 8);
            }, .995);
        }).catch(function () {});

        return {
            pause: function () { if (film) film.pause(); },
            resume: function () { if (film) film.resume(); }
        };
    };

    makers.superdiffusion = function () {
        const canvas = $('#sd-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width;
        const DISPLAY_PATH_FPS = 30;
        let D = null, fields = [], ready = false;
        let pathX = null, pathY = null, recordX = null, recordY = null;
        let cameraX = null, cameraY = null;
        let trailX = null, trailY = null, motionArc = null, views = null, viewRatio = 1;
        let running = false, userPaused = false, pageAwake = false;
        let raf = 0, lastFrame = 0, playhead = 0;

        function mod(v, n) { return ((v % n) + n) % n; }
        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function halfAt(u) { return views[0] * Math.pow(viewRatio, clamp(u, 0, 1)); }
        function preparePath() {
            const raw = D.path;
            if (!raw || !raw.x || raw.x.length < 2 || raw.x.length !== raw.y.length ||
                raw.x.length !== raw.index.length)
                throw new Error('continuous trajectory missing');
            for (let i = 1; i < raw.index.length; i++) {
                if (raw.index[i] <= raw.index[i - 1])
                    throw new Error('trajectory time is not strictly increasing');
            }

            /* The asset retains a 240 Hz audit record. The film takes a fixed,
               monotone 15 Hz subset of those genuine samples and joins only
               consecutive retained points. This keeps the whole zoom legible
               in one loop without a spline or a discontinuous seek. */
            const sourceX = Float64Array.from(raw.x), sourceY = Float64Array.from(raw.y);
            const sourceFps = raw.displayFps || 240;
            const stride = Math.max(1, Math.round(sourceFps / DISPLAY_PATH_FPS));
            const count = Math.ceil((sourceX.length - 1) / stride) + 1;
            recordX = new Float64Array(count); recordY = new Float64Array(count);
            for (let i = 0; i < count; i++) {
                const j = Math.min(sourceX.length - 1, i * stride);
                recordX[i] = sourceX[j]; recordY[i] = sourceY[j];
            }
            pathX = Float64Array.from(recordX); pathY = Float64Array.from(recordY);
            cameraX = new Float64Array(pathX.length);
            cameraY = new Float64Array(pathX.length);
            trailX = new Float32Array(pathX.length + 2);
            trailY = new Float32Array(pathX.length + 2);
            motionArc = new Float64Array(pathX.length);
            views = D.views ? D.views.slice() : D.halves.map(function (h) { return .78 * h; });
            if (!D.views) views[views.length - 1] = .995 * D.halves[D.halves.length - 1];
            viewRatio = views[views.length - 1] / views[0];

            /* One anchored world transform. Only magnification changes. */
            cameraX.fill(D.centre); cameraY.fill(D.centre);
            let oldSX = W / 2 + (pathY[0] - D.centre) * W / (2 * views[0]);
            let oldSY = W / 2 + (pathX[0] - D.centre) * W / (2 * views[0]);
            for (let i = 1; i < pathX.length; i++) {
                const u = i / (pathX.length - 1), h = halfAt(u);
                const sx = W / 2 + (pathY[i] - D.centre) * W / (2 * h);
                const sy = W / 2 + (pathX[i] - D.centre) * W / (2 * h);
                motionArc[i] = motionArc[i - 1] + Math.hypot(sx - oldSX, sy - oldSY);
                oldSX = sx; oldSY = sy;
            }
        }
        function arcAt(seconds) {
            const duration = D.tourSeconds || 42;
            const z = clamp(seconds / duration, 0, 1) * (motionArc.length - 1);
            const i = Math.min(motionArc.length - 2, Math.floor(z)), q = z - i;
            return ruleMix(motionArc[i], motionArc[i + 1], q);
        }
        function timeAtArc(arc) {
            const last = motionArc.length - 1;
            if (arc <= 0) return 0;
            if (arc >= motionArc[last]) return D.tourSeconds;
            let lo = 0, hi = last;
            while (lo + 1 < hi) {
                const mid = (lo + hi) >> 1;
                if (motionArc[mid] <= arc) lo = mid; else hi = mid;
            }
            const span = motionArc[hi] - motionArc[lo];
            const q = span > 0 ? (arc - motionArc[lo]) / span : 0;
            return D.tourSeconds * (lo + q) / last;
        }
        function stateAt(seconds) {
            const duration = D.tourSeconds || 36;
            const t = clamp(seconds, 0, duration), u = t / duration;
            const z = u * (pathX.length - 1), i = Math.min(pathX.length - 2, Math.floor(z));
            const q = z - i;
            return {
                seconds: t, u: u, cursor: z,
                point: [ruleMix(pathX[i], pathX[i + 1], q),
                        ruleMix(pathY[i], pathY[i + 1], q)],
                camera: {
                    x: ruleMix(cameraX[i], cameraX[i + 1], q),
                    y: ruleMix(cameraY[i], cameraY[i + 1], q),
                    h: halfAt(u)
                }
            };
        }
        function screenPoint(point, cam) {
            return [W / 2 + (point[1] - cam.y) * W / (2 * cam.h),
                    W / 2 + (point[0] - cam.x) * W / (2 * cam.h)];
        }
        function drawSettledField(img, half, cam, alpha) {
            if (alpha <= 0) return;
            const k = D.out / (2 * half);
            const sx = (cam.y - D.centre + half - cam.h) * k;
            const sy = (cam.x - D.centre + half - cam.h) * k;
            const sw = 2 * cam.h * k;
            ctx.save(); ctx.globalAlpha = alpha;
            ctx.drawImage(img, sx, sy, sw, sw, 0, 0, W, W);
            ctx.restore();
        }
        function fieldBlend(h) {
            for (let i = 0; i + 1 < D.halves.length; i++) {
                const start = .82 * D.halves[i], end = .95 * D.halves[i];
                if (h < start) return { old: i, next: -1, q: 0 };
                if (h < end) return { old: i, next: i + 1, q: (h - start) / (end - start) };
            }
            return { old: D.halves.length - 1, next: -1, q: 0 };
        }
        function drawField(state) {
            const cam = state.camera, blend = fieldBlend(cam.h);
            ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            ctx.imageSmoothingEnabled = true;
            if (blend.next < 0) {
                drawSettledField(fields[blend.old], D.halves[blend.old], cam, 1);
                return;
            }
            /* The new contour family resolves before the old one dissolves,
               so the field never dims to a blink between them: for a moment
               the fine contours sit nested inside the coarse ones, as they
               do in a low-passed field. Both stay registered to one camera. */
            const nextAlpha = ruleEase(clamp(blend.q / .55, 0, 1));
            const oldAlpha = 1 - ruleEase(clamp((blend.q - .45) / .55, 0, 1));
            drawSettledField(fields[blend.old], D.halves[blend.old], cam, oldAlpha);
            drawSettledField(fields[blend.next], D.halves[blend.next], cam, nextAlpha);
        }
        /* one amber, aged by alpha alone: the path is the brightest line on
           the stage and never borrows a colour from the field's tints */
        function trailColour(t) {
            const stops = [[236,150,40], [245,166,35], [248,190,70]];
            const z = clamp(t, 0, 1) * 2, i = Math.min(1, Math.floor(z)), u = z - i;
            return 'rgb(' + Math.round(ruleMix(stops[i][0], stops[i + 1][0], u)) + ',' +
                            Math.round(ruleMix(stops[i][1], stops[i + 1][1], u)) + ',' +
                            Math.round(ruleMix(stops[i][2], stops[i + 1][2], u)) + ')';
        }
        function drawTrail(state) {
            const cssWidth = Math.max(1, canvas.getBoundingClientRect().width || 720);
            const PX = W / cssWidth, mobile = cssWidth < 500;
            const casing = (mobile ? 2.8 : 2.3) * PX;
            const core = (mobile ? 2 : 1.5) * PX;
            const recordFps = (recordX.length - 1) / D.tourSeconds;
            const cutTime = Math.floor(Math.max(0, state.seconds - .06) * recordFps) / recordFps;
            const recordZ = cutTime / D.tourSeconds * (recordX.length - 1);
            const end = Math.floor(recordZ), skip = Math.max(1, Math.ceil(Math.max(1, end) / 2100));
            let count = 0;
            for (let i = 0; i <= end; i += skip) {
                const q = screenPoint([recordX[i], recordY[i]], state.camera);
                trailX[count] = q[0]; trailY[count] = q[1]; count++;
            }
            const ri = Math.min(recordX.length - 2, end), rq = recordZ - ri;
            const recordedEnd = screenPoint([
                ruleMix(recordX[ri], recordX[ri + 1], rq),
                ruleMix(recordY[ri], recordY[ri + 1], rq)
            ], state.camera);
            if (!count || trailX[count - 1] !== recordedEnd[0] || trailY[count - 1] !== recordedEnd[1]) {
                trailX[count] = recordedEnd[0]; trailY[count] = recordedEnd[1]; count++;
            }
            if (count >= 2) {
                ctx.beginPath(); ctx.moveTo(trailX[0], trailY[0]);
                for (let i = 1; i < count; i++) ctx.lineTo(trailX[i], trailY[i]);
                ctx.strokeStyle = 'rgba(8,7,11,.55)'; ctx.lineWidth = casing;
                ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

                const bins = Math.min(42, count - 1);
                for (let b = 0; b < bins; b++) {
                    const a = Math.floor(b * (count - 1) / bins);
                    const z = Math.max(a + 1, Math.floor((b + 1) * (count - 1) / bins));
                    ctx.beginPath(); ctx.moveTo(trailX[a], trailY[a]);
                    for (let i = a + 1; i <= z; i++) ctx.lineTo(trailX[i], trailY[i]);
                    const age = (a + z) / (2 * Math.max(1, count - 1));
                    ctx.strokeStyle = trailColour(age);
                    ctx.globalAlpha = .32 + .68 * Math.pow(age, .7);
                    ctx.lineWidth = core; ctx.stroke();
                }
            }

            /* Draw every retained subsegment between the history and head. */
            const tailSeconds = Math.max(0, state.seconds - cutTime);
            const pieces = Math.max(1, Math.ceil(tailSeconds * recordFps));
            let old = screenPoint(stateAt(cutTime).point, state.camera);
            ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(old[0], old[1]);
            for (let i = 1; i <= pieces; i++) {
                const s = stateAt(ruleMix(cutTime, state.seconds, i / pieces));
                const q = screenPoint(s.point, state.camera); ctx.lineTo(q[0], q[1]);
            }
            ctx.strokeStyle = 'rgba(8,7,11,.55)'; ctx.lineWidth = casing; ctx.stroke();
            old = screenPoint(stateAt(cutTime).point, state.camera);
            for (let i = 1; i <= pieces; i++) {
                const s = stateAt(ruleMix(cutTime, state.seconds, i / pieces));
                const q = screenPoint(s.point, state.camera);
                ctx.beginPath(); ctx.moveTo(old[0], old[1]); ctx.lineTo(q[0], q[1]);
                ctx.strokeStyle = '#F8BE46'; ctx.globalAlpha = .7 + .3 * i / pieces;
                ctx.lineWidth = core; ctx.stroke(); old = q;
            }
            ctx.globalAlpha = 1;
        }
        function drawParticle(state) {
            const cssWidth = Math.max(1, canvas.getBoundingClientRect().width || 720);
            const PX = W / cssWidth, diameter = cssWidth < 500 ? 14 : 12, r = diameter * PX / 2;
            const q = screenPoint(state.point, state.camera);
            ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
            ctx.fillStyle = '#F6D854'; ctx.fill();
            ctx.strokeStyle = 'rgba(8,7,11,.85)'; ctx.lineWidth = 2 * PX; ctx.stroke();
        }
        function paint() {
            if (!ready) { ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W); return; }
            const state = stateAt(playhead);
            drawField(state);
            drawTrail(state); drawParticle(state);

            let curtain = 0;
            if (state.u < .025) curtain = 1 - ruleEase(state.u / .025);
            if (state.u > .965) curtain = ruleEase((state.u - .965) / .035);
            if (curtain) { ctx.fillStyle = 'rgba(15,14,19,' + curtain + ')'; ctx.fillRect(0, 0, W, W); }
        }
        function syncControls() {
            const play = $('[data-sd-run="pause"]');
            if (play) {
                play.textContent = running ? 'Pause' : 'Play';
                play.classList.toggle('is-on', running);
                play.setAttribute('aria-pressed', String(running));
            }
        }
        function stop(markUser) {
            running = false; cancelAnimationFrame(raf); raf = 0; lastFrame = 0;
            if (markUser) userPaused = true;
            syncControls();
        }
        function frame(now) {
            if (!running) return;
            if (!lastFrame) lastFrame = now;
            /* A stalled browser slows the film instead of skipping ahead to a
               distant Brownian sample. This preserves visible continuity. */
            const dt = Math.min(.045, Math.max(0, (now - lastFrame) / 1000));
            lastFrame = now;
            if (playhead >= D.tourSeconds - 1e-7) playhead = 0;
            const desired = Math.min(D.tourSeconds,
                                     playhead + dt);
            const currentArc = arcAt(playhead), desiredArc = arcAt(desired);
            /* Screen-space arc length owns the pace. A delayed frame slows
               the film; it never catches up by seeking to a distant sample. */
            const target = .25 * W * dt;
            const cssWidth = Math.max(1, canvas.getBoundingClientRect().width || 720);
            const maxCssStep = cssWidth < 500 ? 2 : 3;
            const allowed = Math.min(maxCssStep * W / cssWidth, target);
            playhead = timeAtArc(Math.min(desiredArc, currentArc + allowed));
            paint(); raf = requestAnimationFrame(frame);
        }
        function start() {
            if (!ready || REDUCED || running || !pageAwake || document.hidden) return;
            running = true; userPaused = false; lastFrame = 0;
            syncControls(); raf = requestAnimationFrame(frame);
        }

        $$('[data-sd-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ready) return;
                if (b.dataset.sdRun === 'pause') {
                    if (running) stop(true); else { userPaused = false; start(); }
                }
                if (b.dataset.sdRun === 'replay') {
                    playhead = 0; userPaused = false; paint(); start();
                }
            });
        });

        Promise.all([
            fetch('plates/p-sd-zoom.json').then(function (r) {
                if (!r.ok) throw new Error('zoom data ' + r.status);
                return r.json();
            }),
            Promise.all([0, 1, 2, 3].map(function (i) {
                return loadImage('plates/p-sd-z' + i + '-void.png');
            }))
        ]).then(function (res) {
            D = res[0]; fields = res[1]; preparePath(); ready = true;
            playhead = REDUCED ? D.tourSeconds * .62 : 0; paint();
            if (pageAwake && !REDUCED && !userPaused) start();
        }).catch(function (err) {
            console.warn('superdiffusion:', err);
        });

        paint(); syncControls();
        return {
            pause: function () { pageAwake = false; if (running) stop(false); },
            resume: function () {
                pageAwake = true; paint();
                if (!REDUCED && ready && !userPaused) start();
            }
        };
    };

    /* ---- The modified Farey recursion on the F-lattice ----

       Bou-Rabee, Adv. Math. 439 (2024), Section 3.2. A reduced fraction is
       EVEN when n+d is even and ODD otherwise, and equation (16) sends an odd
       p and an even q to a new odd-even pair -- two steps of the ordinary
       Farey recursion at once. Each quadruple has three children by (17), so
       the recursion is a ternary tree rooted at (1/2, 1/3, 0/1, 1/1).

       The tiles are not recomputed here. They come from the author's own
       Julia code (Past_Projects/f_lattice/final_code), including the
       L-corrections of Section 8, and are rendered exactly as drawPattern
       does there -- checked pixel for pixel against the paper's own figures.
       Each rational carries TWO odometers, standard and alternate. */
    /* The local firing rule is animated above.  This stage inspects a verified
       1.3-million-grain stabilization, one image pixel per lattice site.  It
       does not fabricate intermediate configurations from the final raster. */
    makers.flattice = function () {
        const canvas = $('#flattice-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
        const note = $('#flattice-note'), outMass = $('#flattice-mass'),
              outView = $('#flattice-view');
        const src = (window.galleryAssets && window.galleryAssets.flatticeLarge)
            || 'plates/p5-flattice-hero-void.png';
        const MASS = 1300000, CLOSE_WIDTH = 132, DURATION = 22000;
        const CLOSE_X = 740, CLOSE_Y = 330;
        let image = null, half = null, ready = false, failed = false;
        let phase = REDUCED ? .55 : 0, pageAwake = true,
            userPaused = REDUCED, raf = 0, lastNow = 0;

        function clamp01(x) { return Math.max(0, Math.min(1, x)); }
        function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
        function cameraAt(p) {
            let q;
            if (p < .11) q = 0;
            else if (p < .40) q = ease((p - .11) / .29);
            else if (p < .74) q = 1;
            else if (p < .96) q = 1 - ease((p - .74) / .22);
            else q = 0;
            const width = Math.exp(Math.log(CLOSE_WIDTH) * (1 - q) +
                                   Math.log(image.width) * q);
            return {
                q: q, width: width,
                x: CLOSE_X * (1 - q) + image.width * .5 * q,
                y: CLOSE_Y * (1 - q) + image.height * .5 * q
            };
        }
        function paint() {
            ctx.fillStyle = '#15131A'; ctx.fillRect(0, 0, W, H);
            if (!ready || !image) {
                note.textContent = failed ? 'Configuration unavailable' : 'Loading configuration';
                return;
            }
            const camera = cameraAt(phase), sw = camera.width;
            const sx = Math.max(0, Math.min(image.width - sw, camera.x - sw / 2));
            const sy = Math.max(0, Math.min(image.height - sw, camera.y - sw / 2));
            /* Magnified sites are whole pixels; a minified view is drawn from
               an area-averaged copy, so periodic patches become their mean
               tone instead of a moire. A two per cent frame keeps the
               configuration's own edge off the canvas edge. */
            const inset = Math.round(W * .02), dest = W - 2 * inset;
            /* sites per device pixel decides the source: whole sites when they
               are at least a device pixel wide, the area-averaged copy when
               more than one site would land on a pixel */
            const cssW = canvas.getBoundingClientRect().width || 720;
            const devicePx = dest * (cssW / W) * (window.devicePixelRatio || 1);
            const perPx = sw / Math.max(1, devicePx);
            ctx.imageSmoothingEnabled = perPx > .9;
            ctx.imageSmoothingQuality = 'high';
            if (half && perPx > 1.4) ctx.drawImage(half, sx / 2, sy / 2, sw / 2, sw / 2, inset, inset, dest, dest);
            else ctx.drawImage(image, sx, sy, sw, sw, inset, inset, dest, dest);
            if (outMass) outMass.textContent = nf.format(MASS);
            if (outView) outView.textContent = nf.format(Math.round(sw)) + ' sites';
            if (camera.q < .18) note.textContent = 'Individual sites';
            else if (camera.q < .72) note.textContent = 'Zooming out';
            else note.textContent = 'Whole configuration';
        }
        function stop() {
            if (raf) cancelAnimationFrame(raf);
            raf = 0; lastNow = 0;
        }
        function frame(now) {
            if (!lastNow) lastNow = now;
            const dt = Math.min(50, now - lastNow); lastNow = now;
            phase += dt / DURATION;
            if (phase >= 1) phase -= Math.floor(phase);
            paint(); raf = requestAnimationFrame(frame);
        }
        function sync() {
            const play = $('[data-fl-run="pause"]');
            if (!play) return;
            const running = !!raf && !userPaused;
            play.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
            play.classList.toggle('is-on', running);
            play.setAttribute('aria-pressed', String(running));
            play.disabled = REDUCED || !ready;
        }
        function start() {
            stop();
            if (!ready || REDUCED || !pageAwake || userPaused) { sync(); return; }
            raf = requestAnimationFrame(frame); sync();
        }
        $$('[data-fl-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (b.dataset.flRun === 'replay') {
                    phase = 0; userPaused = REDUCED; paint();
                    if (!REDUCED) { userPaused = false; start(); }
                } else if (raf) {
                    userPaused = true; stop(); paint(); sync();
                } else {
                    userPaused = false; start();
                }
            });
        });

        paint(); sync();
        loadImage(src).then(function (img) {
            image = img;
            try {
                half = document.createElement('canvas');
                half.width = Math.ceil(img.width / 2); half.height = Math.ceil(img.height / 2);
                const hc = half.getContext('2d');
                hc.imageSmoothingEnabled = true; hc.imageSmoothingQuality = 'high';
                hc.drawImage(img, 0, 0, half.width, half.height);
            } catch (e) { half = null; }
            ready = true; paint(); sync();
            if (!REDUCED) { userPaused = false; start(); }
        }).catch(function (err) {
            console.warn('F-lattice configuration:', err);
            failed = true; paint(); sync();
        });
        return {
            pause: function () { pageAwake = false; stop(); sync(); },
            resume: function () {
                pageAwake = true; paint();
                if (!userPaused) start();
            }
        };
    };

    makers.fareytree = function () {
        const svg = $('#ft-tree');
        if (!svg || !$('#ft-p1')) return null;
        const NS = 'http://www.w3.org/2000/svg';
        const SLOT = ['p0', 'q0', 'p1', 'q1'];
        let data = null, atlas = null, sel = null, kind = 'std', scrolled = false;

        function el(t, at) {
            const n = document.createElementNS(NS, t);
            for (const k in at) n.setAttribute(k, at[k]);
            return n;
        }

        function drawTree() {
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const keys = Object.keys(data.nodes);
            const maxd = Math.max.apply(null, keys.map(function (k) { return data.nodes[k].depth; }));
            /* A ternary tree triples every level, so the width has to follow
               the leaf count rather than the panel: at depth five there are
               243 of them. The figure scrolls sideways past that point. */
            const leaves = data.nodes['.'].leaves || 27;
            const W = Math.max(1200, Math.round(leaves * 13));
            const H = 60 + maxd * 66, padx = 100, pady = 26;
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
            svg.style.width = Math.max(100, Math.round(W / 12)) + 'ch';
            const X = function (k) { return padx + data.nodes[k].x * (W - 2 * padx); };
            const Y = function (k) { return pady + (data.nodes[k].depth / Math.max(1, maxd)) * (H - 2 * pady); };
            const cellsOf = function (f) {
                const t = data.tiles[f];
                return (t && t[kind]) ? t[kind].cells : 0;
            };
            const big = function (k) {
                const q = data.nodes[k];
                return Math.max(cellsOf(q.p1), cellsOf(q.q1)) || 1;
            };
            const most = Math.max.apply(null, keys.map(big));

            keys.forEach(function (k) {
                const par = data.nodes[k].parent;
                if (!par || !data.nodes[par]) return;
                svg.appendChild(el('line', {
                    x1: X(par), y1: Y(par), x2: X(k), y2: Y(k),
                    class: 'ft-edge' + (k === sel || par === sel ? ' is-on' : '')
                }));
            });
            keys.forEach(function (k) {
                const nd = data.nodes[k];
                const g = el('g', { class: 'ft-node' + (k === sel ? ' is-sel' : ''),
                                    tabindex: '0', role: 'button',
                                    'aria-label': nd.p1 + ' and ' + nd.q1 });
                /* the dot carries the size of the tile it names */
                const shrink = 1 / (1 + 0.5 * nd.depth);
                const rr = 2.2 + (1.6 + 7 * Math.sqrt(big(k) / most)) * shrink;
                g.appendChild(el('circle', { cx: X(k), cy: Y(k), r: k === sel ? Math.max(6, rr * 2) : rr }));
                if (nd.depth <= 1 || k === sel) {
                    const anchor = nd.x > .92 ? 'end' : nd.x < .08 ? 'start' : 'middle';
                    const t = el('text', { x: X(k), y: Y(k) - 13, 'text-anchor': anchor });
                    t.textContent = nd.p1 + ' \u00b7 ' + nd.q1;
                    g.appendChild(t);
                }
                g.appendChild(el('circle', { cx: X(k), cy: Y(k),
                                             r: Math.max(7, 14 - 2 * nd.depth), class: 'ft-hit' }));
                g.addEventListener('click', function () { select(k); });
                g.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(k); }
                });
                svg.appendChild(g);
            });
            /* the tree is wider than its column and scrolls; it opens with the
               root in view rather than on the far leaves */
            const wrap = svg.closest('.tree-wrap');
            if (wrap && !scrolled && data.nodes['.']) {
                scrolled = true;
                const shown = svg.getBoundingClientRect().width || wrap.scrollWidth;
                wrap.scrollLeft = Math.max(0, X('.') / W * shown - wrap.clientWidth * .8);
            }
        }

        function paint(canvas, frac) {
            const ctx = canvas.getContext('2d');
            const W = canvas.width, Hh = canvas.height;
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, Hh);
            const t = frac && data.tiles[frac] && data.tiles[frac][kind];
            if (!t || !atlas) return;

            /* The patterns arrive as one atlas image rather than as arrays of
               characters: the largest tile is 157 by 181 sites, which is one
               drawImage here and was 28,000 fillRects before. */
            const at = t.at, Cn = at[2], R = at[3];
            const cell = Math.max(1, Math.floor(Math.min(W / Cn, Hh / R)));
            const ox = Math.round((W - cell * Cn) / 2), oy = Math.round((Hh - cell * R) / 2);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(atlas, at[0], at[1], Cn, R, ox, oy, cell * Cn, cell * R);

            if (cell >= 6 && t.heights) {             /* countable at this scale */
                /* slate, half strength: separates cells on both the ink ground
                   (height 0) and the cyan cells (height 1) */
                const rows = t.heights;
                ctx.strokeStyle = 'rgba(74,74,94,.55)';
                ctx.lineWidth = 1;
                for (let j = 0; j < R; j++) {
                    for (let i = 0; i < Cn; i++) {
                        if (rows[j][i] === '.') continue;
                        ctx.strokeRect(ox + i * cell + .5, oy + j * cell + .5, cell - 1, cell - 1);
                    }
                }
            }
        }

        function select(key) {
            if (!data.nodes[key]) return;
            sel = key;
            const nd = data.nodes[key];
            const order = [nd.p0, nd.q0, nd.p1, nd.q1];
            SLOT.forEach(function (id, i) {
                paint($('#ft-' + id), order[i]);
                const t = data.tiles[order[i]];
                $('#ft-' + id + '-f').textContent = order[i];
                $('#ft-' + id + '-m').textContent = (t && t[kind])
                    ? (t.even ? 'even' : 'odd') + ' · ' + nf.format(t[kind].cells) + ' sites'
                    : (t ? (t.even ? 'even' : 'odd') : '');
            });
            const out = $('#ft-sum');
            if (out) {
                const sz = function (f) {
                    const t = data.tiles[f];
                    return (t && t[kind]) ? nf.format(t[kind].cells) + ' sites' : '\u2014';
                };
                out.innerHTML =
                    'C(<b>' + nd.p0 + '</b>, <b>' + nd.q0 + '</b>) = (<b>' + nd.p1 + '</b>, <b>'
                    + nd.q1 + '</b>), reduced. Selected ' + (kind === 'std' ? 'standard' : 'alternate')
                    + ' tile areas: parents ' + sz(nd.p0) + ' and ' + sz(nd.q0)
                    + '; children ' + sz(nd.p1) + ' and ' + sz(nd.q1) + '.';
            }
            drawTree();
        }

        $$('[data-ftkind]').forEach(function (b) {
            b.addEventListener('click', function () {
                kind = b.dataset.ftkind;
                $$('[data-ftkind]').forEach(function (o) {
                    o.classList.toggle('is-on', o.dataset.ftkind === kind);
                });
                if (sel) select(sel);
            });
        });

        Promise.all([
            fetch((window.galleryAssets && window.galleryAssets.fareyTree)
                || 'plates/p-farey-tree.json').then(function (r) { return r.json(); }),
            loadImage((window.galleryAssets && window.galleryAssets.fareyAtlas)
                || 'plates/p-farey-atlas.png')
        ]).then(function (res) {
            data = res[0];
            atlas = res[1];
            select('.');
        }).catch(function (e) { console.warn('farey tree:', e); });

        return {};
    };

    /* ---- The divisible sandpile on a mated-CRT map ----

       Two maps, at the two values of gamma that name something: sqrt(2) is
       the spanning-tree-weighted map, sqrt(8/3) the uniform one. Larger gamma
       is a rougher surface, and the cluster answers to it. Both plates are
       baked; the button swaps which is shown. */
    /* ---- The divisible sandpile on a mated-CRT map, run live ----

       The bake (plate_matedcrt_run.py) ships the cluster subgraph: every
       cell the mass ever reaches, its full multigraph degree, and the incident
       edges among those cells. Parallel edges repeat their endpoint in the
       CSR. That is the whole dynamics, not a crop. A cell
       keeps whatever mass it receives -- over one it keeps one and sends
       only the excess -- so every cell that ever holds mass is in the final
       cluster; and a toppling cell sends along every incident edge, so each
       edge's other endpoint is in the cluster too. Both facts are asserted
       against the full-map run
       in the bake, whose subgraph replay reproduced every arrival sweep
       exactly. So the browser runs the same parallel toppling the 60,000-cell
       map would run, on the several hundred cells the mass ever touches.

       The record is write-once: a cell is filled the sweep mass first
       reaches it, in the colour of its arrival band, and never repainted.
       The mass still in motion is a readout, not the picture.

       Per frame, at most 56 sweeps; a sweep is one pass over ~800 cells plus
       one push per edge of each toppling cell, about 5,300 array operations,
       so a frame stays near 300,000 -- plus two full-canvas drawImage, a few
       polygon fills each with an ink hairline, and the recent arrival-front
       outlines (occasionally many when a whole sweep arrives together). */
    /* Same loop as loopingRule, on a wide dark stage instead of a 720 square.
       Kept separate rather than folded into loopingRule: sixteen rule films go
       through that function and a shared refactor risks all of them. */
    function loopingFilm(canvasId, LW, LH, duration, painter, still) {
        const canvas = $(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
        let raf = null, elapsed = 0, lastNow = 0, running = false;

        function draw(p) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, W, H);
            const q = Math.min(W / LW, H / LH);
            ctx.save();
            ctx.translate((W - LW * q) / 2, (H - LH * q) / 2);
            ctx.scale(q, q);
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, LW, LH);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            painter(ctx, LW, LH, ruleClamp(p));
            ctx.restore();
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const dt = Math.min(14, Math.max(0, now - lastNow));
            lastNow = now; elapsed = (elapsed + dt) % duration;
            draw(elapsed / duration);
            raf = requestAnimationFrame(frame);
        }
        function pause() {
            running = false;
            if (raf !== null) cancelAnimationFrame(raf);
            raf = null; lastNow = 0;
        }
        function resume() {
            if (REDUCED || running) return;
            running = true; lastNow = 0; raf = requestAnimationFrame(frame);
        }
        draw(REDUCED ? (still === undefined ? .95 : still) : 0);
        if (!REDUCED) resume();
        return { pause: pause, resume: resume };
    }

    /* What the mated-CRT map IS, built in front of the reader.

       Fix γ ∈ (0,2) and let (L,R) be a correlated two-dimensional Brownian
       motion with corr(L,R) = −cos(πγ²/4). Cut time into cells of width ε and
       write a_i for the infimum of the coordinate over cell i. Cells i < j are
       joined when

              max(a_i, a_j) ≤ min(a_{i+1}, …, a_{j−1}),

       for L or for R — that is, when a horizontal chord at the higher of the
       two endpoints' minima passes UNDER every minimum between them. Drawing
       that chord is the whole definition, so the film draws it.

       L supplies the arcs above the row, R the arcs below; consecutive cells
       are always joined. Arcs on one side cannot cross, which is why the
       result is planar. If a non-consecutive pair gets both an upper and a
       lower arc, those arcs are two parallel edges. The sample is not
       decorative: γ = √2, twenty cells,
       seed 7, cell minima computed by bake/mated_crt.py with sub = 64, and
       the arcs below are its tree_edges output verbatim. At γ = √2 the
       correlation is −cos(π/2) = 0 and the two trees are independent. */
    const MCRT_DEMO = {
        n: 20,
        aL: [-1.814,-2.7357,-3.1115,-2.9443,-3.2764,-3.0602,-2.9347,-2.2648,-1.1749,0.0873,
             0.2608,1.5801,1.655,1.0942,0.6387,2.0619,2.4161,2.6292,2.9545,3.267],
        aR: [-1.1172,-2.7747,-2.8285,-5.9207,-7.9179,-7.741,-9.2614,-8.8327,-11.3938,-12.0656,
             -12.3552,-12.4803,-11.8895,-13.3495,-13.4964,-13.1719,-13.6481,-13.7,-14.4041,-14.684],
        eL: [[2,4],[10,13],[10,14],[11,13]],
        eR: [[4,6],[6,8],[11,13],[14,16]]
    };

    makers.mcrtbuild = function () {
        const D = MCRT_DEMO, n = D.n;
        const PL = [], PR = [];                    /* filled from the minima */
        const X0 = 76, X1 = 1364, CW = (X1 - X0) / n;
        const cx = function (i) { return X0 + (i + .5) * CW; };

        /* the row of cells, and the two panels either side of it */
        const ROW_T = 412, ROW_B = 462;
        const LTOP = 62, LBOT = 292, ARCL = 116;
        const RTOP = 612, RBOT = 842, ARCR = 116;

        function ramp(a) {
            let lo = Infinity, hi = -Infinity;
            for (let i = 0; i < a.length; i++) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); }
            const pad = (hi - lo) * .12 || 1;
            return [lo - pad, hi + pad];
        }
        const rL = ramp(D.aL), rR = ramp(D.aR);
        /* L rises up the page; R is mirrored, so the picture is the mating of
           two trees along one row rather than two unrelated graphs. */
        function yL(v) { return LBOT - (v - rL[0]) / (rL[1] - rL[0]) * (LBOT - LTOP); }
        function yR(v) { return RTOP + (v - rR[0]) / (rR[1] - rR[0]) * (RBOT - RTOP); }

        /* a walk's cell minima drawn as a step function: treads, thin risers
           and a baseline, tinted like the arcs that walk will produce */
        function minima(ctx, a, yf, upto, alpha, tint, baseline, label) {
            ctx.strokeStyle = 'rgba(201,191,168,' + (alpha * .35).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(X0, baseline); ctx.lineTo(X1, baseline); ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(' + tint + ',' + alpha + ')';
            ctx.beginPath();
            for (let i = 0; i < n && i < upto; i++) {
                ctx.moveTo(X0 + i * CW + 3, yf(a[i]));
                ctx.lineTo(X0 + (i + 1) * CW - 3, yf(a[i]));
            }
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(' + tint + ',' + (alpha * .5).toFixed(3) + ')';
            ctx.beginPath();
            for (let i = 1; i < n && i < upto; i++) {
                ctx.moveTo(X0 + i * CW, yf(a[i - 1]));
                ctx.lineTo(X0 + i * CW, yf(a[i]));
            }
            ctx.stroke();
            ctx.fillStyle = 'rgba(' + tint + ',' + alpha + ')';
            const cssW = ctx.canvas.getBoundingClientRect().width || 1440;
            ctx.font = '500 ' + Math.round(26 * Math.max(1, Math.min(2, 760 / cssW))) + 'px ui-monospace, "IBM Plex Mono", monospace';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText(label, X0 - 18, baseline);
        }

        /* the chord that decides the edge: at max(a_i,a_j), under everything
           between. Drawn, so the reader can see it clear the minima. */
        function chord(ctx, a, yf, e, t) {
            const i = e[0], j = e[1];
            const h = yf(Math.max(a[i], a[j]));
            const x1 = cx(i), x2 = cx(j);
            ctx.strokeStyle = RULE_VIS.cyanBright;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x1, h);
            ctx.lineTo(ruleMix(x1, x2, ruleEase(t)), h);
            ctx.stroke();
            ctx.fillStyle = RULE_VIS.cyanBright;
            [[x1, yf(a[i])], [x2, yf(a[j])]].forEach(function (q, k) {
                if (k && t < .98) return;
                ctx.beginPath(); ctx.arc(q[0], q[1], 7, 0, Math.PI * 2); ctx.fill();
            });
        }

        function arc(ctx, e, up, t, colour) {
            const i = e[0], j = e[1];
            const x1 = cx(i), x2 = cx(j);
            const base = up ? ROW_T : ROW_B;
            const reach = Math.min(up ? ARCL : ARCR, 26 + (j - i) * 19);
            const tip = up ? base - reach : base + reach;
            ctx.strokeStyle = colour;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x1, base);
            ctx.bezierCurveTo(x1, tip, x2, tip, x2, base);
            ctx.setLineDash([]);
            ctx.globalAlpha = t;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        function row(ctx, lit) {
            for (let i = 0; i < n; i++) {
                const x = X0 + i * CW;
                ctx.fillStyle = lit && lit.indexOf(i) >= 0 ? 'rgba(168,216,232,.20)' : 'rgba(74,74,94,.30)';
                ctx.fillRect(x + 3, ROW_T, CW - 6, ROW_B - ROW_T);
                ctx.strokeStyle = 'rgba(201,191,168,.55)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 3, ROW_T, CW - 6, ROW_B - ROW_T);
            }
        }

        function slot(p, a, b, k, count) {
            /* k-th of count sub-intervals of [a,b] */
            const w = (b - a) / count;
            return ruleClamp((p - (a + k * w)) / w);
        }

        return loopingFilm('#build-divisible', 1440, 900, 15000, function (ctx, LW, LH, p) {
            const nL = D.eL.length, nR = D.eR.length;

            /* L minima, then its chords, then the same for R */
            const drawnL = p < .10 ? Math.ceil(p / .10 * n) : n;
            minima(ctx, D.aL, yL, drawnL, p < .10 ? .6 : .85, '120,178,214', LBOT, 'L');
            if (p >= .46) {
                const drawnR = p < .56 ? Math.ceil((p - .46) / .10 * n) : n;
                minima(ctx, D.aR, yR, drawnR, p < .56 ? .6 : .85, '204,121,150', RTOP, 'R');
            }

            row(ctx, null);

            /* consecutive cells are always joined */
            if (p >= .10) {
                ctx.strokeStyle = 'rgba(201,191,168,.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(cx(0), (ROW_T + ROW_B) / 2);
                ctx.lineTo(cx(n - 1), (ROW_T + ROW_B) / 2);
                ctx.stroke();
            }

            for (let k = 0; k < nL; k++) {
                const t = slot(p, .12, .44, k, nL);
                if (t <= 0) continue;
                if (t < 1) chord(ctx, D.aL, yL, D.eL[k], t);
                arc(ctx, D.eL[k], true, ruleEase(t), RULE_VIS.cyanBright);
            }
            for (let k = 0; k < nR; k++) {
                const t = slot(p, .58, .90, k, nR);
                if (t <= 0) continue;
                if (t < 1) chord(ctx, D.aR, yR, D.eR[k], t);
                arc(ctx, D.eR[k], false, ruleEase(t), RULE_VIS.rose);
            }
        }, .97);
    };

    /* The divisible sandpile, defined on a graph and nothing more. Four still
       panels of one worked step on a seven-vertex graph, with the arithmetic
       carried out rather than indicated: the centre holds 2.5 and has degree
       6, so it keeps 1 and sends (2.5 - 1)/6 = 0.25 along each edge, and the
       six neighbours go 0.5 -> 0.75. Total mass 2.5 + 6(0.5) = 5.5 before and
       1 + 6(0.75) = 5.5 after. Nothing here is specific to a lattice, which is
       the point: the rule needs a graph and a degree, so it runs unchanged on
       the random planar map below. */
    makers.divisiblepanels = function () {
        const canvas = $('#div-def-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const START = 2.5, NB0 = 0.5, DEG = 6, SHARE = (START - 1) / DEG;

        const ring = [];
        for (let k = 0; k < DEG; k++) {
            const a = -Math.PI / 2 + 2 * Math.PI * k / DEG;
            ring.push([Math.cos(a), Math.sin(a)]);
        }

        function panel(ox, oy, size, stage) {
            const cx = ox + size / 2, cy = oy + size / 2, r = size * .30;
            const hot = stage === 1 || stage === 2;
            ctx.strokeStyle = 'rgba(201,191,168,.34)';
            ctx.lineWidth = 2;
            ring.forEach(function (d) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + d[0] * r, cy + d[1] * r);
                ctx.stroke();
            });
            if (stage === 2) {
                ctx.fillStyle = '#F0E442';
                ring.forEach(function (d) {
                    ctx.beginPath();
                    ctx.arc(cx + d[0] * r * .62, cy + d[1] * r * .62, size * .028, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            const nb = stage === 3 ? NB0 + SHARE : NB0;
            ring.forEach(function (d) {
                node(cx + d[0] * r, cy + d[1] * r, size * .098, nb, false);
            });
            node(cx, cy, size * .115, stage === 3 ? 1 : START, hot);
        }

        function node(x, y, rad, mass, hot) {
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fillStyle = hot ? 'rgba(240,228,66,.16)'
                : 'rgba(118,103,168,' + (.10 + Math.min(1, mass) * .24).toFixed(2) + ')';
            ctx.fill();
            ctx.strokeStyle = hot ? '#F0E442' : 'rgba(201,191,168,.55)';
            ctx.lineWidth = hot ? 3 : 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(242,237,226,.92)';
            ctx.font = '500 ' + Math.round(rad * .74) + 'px ui-monospace, "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(mass === 1 ? '1' : mass.toFixed(2).replace(/0$/, ''), x, y + 1);
        }

        function draw() {
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, H);
            const gap = Math.round(W / 86), size = (W - 5 * gap) / 4;
            for (let k = 0; k < 4; k++) panel(gap + k * (size + gap), (H - size) / 2, size, k);
        }

        draw();
        return { resume: draw };
    };

    makers.matedcrt = function () {
        const canvas = $('#mcrt-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const WATCH = 0x3fffffff, EVERY = 180, CAP = 800, BAND = 18, FRONT_AGE = 4;
        /* the three arrival bands, the same three the key beneath the stage
           shows */
        const CYCLE = [[86, 180, 233], [204, 121, 167], [230, 159, 0]];
        /* the bake's cells are in a square 960 by 960 Tutte-disc frame */
        const SX = W / 960, SY = H / 960;

        const elSweeps = $('#mcrt-sweeps'), elCells = $('#mcrt-cells'),
              elArea = $('#mcrt-area'), elExcess = $('#mcrt-excess'),
              elBall = $('#mcrt-ball'),
              note = $('#mcrt-note');
        const buttons = $$('[data-mcrt-map]');

        const recC = document.createElement('canvas');
        recC.width = W; recC.height = H;
        const rctx = recC.getContext('2d');

        let DATA = null, G = null, key = 'sqrt2', underImg = {};
        let m, e, seen, deg, off, nbr, interior, cells, xy, ppm, odo;
        let arrived, sweeps, hiNow, totNow, ppmSum, done, front, toppled;
        let ready = false, pace = 'watch', userPaused = false, pageAwake = true;

        function cellPath(c, i) {
            const raw = cells[i];
            if (!raw || !raw.length) return false;
            const pieces = typeof raw[0] === 'number' ? [raw] : raw;
            c.beginPath();
            for (let q = 0; q < pieces.length; q++) {
                const v = pieces[q];
                if (!v || v.length < 6) continue;
                c.moveTo(v[0] * SX, v[1] * SY);
                for (let k = 2; k < v.length; k += 2)
                    c.lineTo(v[k] * SX, v[k + 1] * SY);
                c.closePath();
            }
            return true;
        }

        /* A cell that merely holds mass is not yet in the ball. It is drawn
           dim; it takes its arrival colour only when it first topples, so the
           vivid region on screen is exactly {u~ > 0}, the harmonic ball, and
           the dim rim around it is the mass that arrived and stayed under 1.
           In the current 10,000-vertex disk computation with source mass
           2,000, 2,214 vertices have positive mass and 1,879 topple. */
        function paintFill(i, atSweep, dim) {
            const band = (atSweep / BAND) | 0;
            const rgb = CYCLE[band % 3];
            if (cellPath(rctx, i)) {
                rctx.fillStyle = dim
                    ? 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.22)'
                    : 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
                if (dim) { rctx.save(); rctx.globalCompositeOperation = 'source-over'; }
                rctx.fill();
                if (dim) rctx.restore();
                /* an ink hairline on the same path: a large cell joins whole,
                   and without its edge the record fuses into band-wide washes */
                rctx.strokeStyle = 'rgba(8,7,11,.72)';
                rctx.lineWidth = 2;
                rctx.stroke();
            } else if (xy && xy[i]) {
                /* Cut vertices in a dangling tree have no bounded-face area,
                   but they are genuine states of the walk and sandpile. A
                   small embedded vertex mark keeps the beginning of the
                   growth visible without inventing a two-dimensional cell. */
                const p = xy[i];
                rctx.beginPath();
                rctx.arc(p[0] * SX, p[1] * SY, dim ? 2.5 * SX : 3.2 * SX,
                         0, 2 * Math.PI);
                rctx.fillStyle = dim
                    ? 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.46)'
                    : 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
                rctx.fill();
            }
        }

        function paintArrival(i, arrivalSweep) {
            paintFill(i, arrivalSweep, true);
            front.push({ cell: i, age: 0 });
        }

        function paintBall(i, topplingSweep) {
            paintFill(i, topplingSweep, false);
        }

        /* one parallel sweep: every interior cell over one keeps one and
           divides the excess equally among its incident edges (by its FULL
           multigraph degree -- parallel edges repeat their endpoint in nbr,
           and a share sent to a rim cell drawn nowhere still leaves) */
        function measureExcess() {
            let hi = 0, tot = 0;
            for (let i = 0; i < G.n; i++) {
                const x = m[i] - 1;
                if (x > 0 && interior[i]) { hi = Math.max(hi, x); tot += x; }
            }
            hiNow = hi; totNow = tot;
            return hi;
        }

        function sweep() {
            const n = G.n;
            let hi = 0, tot = 0;
            for (let i = 0; i < n; i++) {
                const x = m[i] - 1;
                if (x > 0 && interior[i]) { e[i] = x; if (x > hi) hi = x; tot += x; }
                else e[i] = 0;
            }
            if (hi < G.tol) { hiNow = hi; totNow = tot; return false; }
            for (let i = 0; i < n; i++) {
                if (e[i] <= 0) continue;
                m[i] -= e[i];
                const s = e[i] / deg[i];
                if (odo[i] === 0) { toppled++; paintBall(i, sweeps + 1); }
                odo[i] += s;
                for (let k = off[i]; k < off[i + 1]; k++) m[nbr[k]] += s;
            }
            for (let i = 0; i < n; i++) {
                if (!seen[i] && m[i] > 0) {
                    seen[i] = 1;
                    arrived++;
                    ppmSum += ppm[i];
                    paintArrival(i, sweeps + 1);
                }
            }
            sweeps++;
            /* The canvas now shows the post-sweep state, so its excess
               readout must be measured from that same state. */
            measureExcess();
            return true;
        }

        function draw() {
            if (!ready || !G || !front) {
                ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, H);
                return;
            }
            if (underImg[key]) {
                ctx.globalAlpha = .42;
                ctx.drawImage(underImg[key], 0, 0, W, H);
                ctx.globalAlpha = 1;
            } else { ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, W, H); }
            ctx.drawImage(recC, 0, 0);
            /* Yellow is reserved for the moving arrival front. Outlining
               every unstable cell would swamp the record once the pile
               enters its long drain, when almost every toppler is active. */
            ctx.lineWidth = 1.5;
            for (let q = 0; q < front.length; q++) {
                const f = front[q];
                ctx.strokeStyle = 'rgba(240,228,66,' + (0.95 * (1 - f.age / FRONT_AGE)).toFixed(3) + ')';
                if (cellPath(ctx, f.cell)) ctx.stroke();
            }
            report();
        }

        function ageFront() {
            for (let q = 0; q < front.length; q++) front[q].age++;
            while (front.length && front[0].age >= FRONT_AGE) front.shift();
        }

        function report() {
            if (elSweeps) elSweeps.textContent = nf.format(sweeps);
            if (elCells) elCells.textContent = nf.format(arrived) + ' / ' + nf.format(G.n);
            if (elBall) elBall.textContent = nf.format(toppled) + ' of ' + nf.format(arrived);
            if (elArea) elArea.textContent = (ppmSum / 1e4).toFixed(1) + '%';
            if (elExcess) {
                elExcess.textContent =
                    totNow >= 0.05 ? totNow.toFixed(1) :
                    totNow > 0 ? '< 0.05' : '0';
            }
        }

        function tick() {
            if (done) return false;
            ageFront();
            if (!sweep()) { halt(); return false; }
            if (hiNow < G.tol) { halt(); return false; }
            draw(); syncControls();
            if (note) note.textContent = 'Sweep ' + nf.format(sweeps);
            return true;
        }

        /* A visible frame advances many algebraic sweeps.  The disk map has
           long intervals between arrivals, so exposing one sweep per screen
           frame would make the mathematically active process look frozen. */
        function frame() {
            if (done) return false;
            ageFront();
            const complete = arrived >= G.n;
            const target = complete ? Infinity : Math.max(1, Math.ceil(0.015 * arrived));
            /* A long tree-like branch can collapse to one point under the
               Tutte embedding. Do not spend many display frames advancing
               through states that are distinct on the graph but identical
               on screen: require a small increment of embedded cell area as
               well as new graph vertices. Step still exposes one exact sweep. */
            const areaTarget = complete ? Infinity
                : Math.max(250, Math.ceil(0.015 * Math.max(1, ppmSum)));
            const drop = complete ? 0.70 : 0;
            const hi0 = hiNow > 0 ? hiNow : Infinity;
            const was = arrived, areaWas = ppmSum;
            let sw = 0, ok = true;
            do {
                ok = sweep();
                sw++;
            } while (ok &&
                     (arrived - was < target || ppmSum - areaWas < areaTarget) &&
                     hiNow > drop * hi0 && sw < CAP);
            draw(); syncControls();
            if (!ok || hiNow < G.tol) { halt(); return false; }
            if (note) note.textContent = complete
                ? 'Dissipating remaining excess'
                : 'Sweep ' + nf.format(sweeps);
            return true;
        }

        function halt() {
            done = true;
            front = []; draw();
            if (note) note.textContent = 'Stable';
            syncControls();
        }

        function finishNow() {
            if (!G || done) return;
            while (sweep()) { }
            front = [];
            halt();
        }

        const clock = paced({ watch: WATCH, every: EVERY, tick: frame,
                              frame: frame, finish: finishNow });

        function replay(autoplay) {
            if (!DATA) return;
            clock.stop();
            G = DATA[key];
            const n = G.n;
            m = new Float64Array(n); e = new Float64Array(n);
            seen = new Uint8Array(n);
            /* the odometer per unit degree, u~(v) = (mass sent from v)/deg(v),
               accumulated exactly as bake/mated_crt.py does. The harmonic ball
               is {u~ > 0}, which is strictly smaller than the set of cells
               holding mass: a cell can receive and never reach 1. */
            odo = new Float64Array(n);
            deg = G.degA; off = G.offA; nbr = G.nbrA;
            interior = G.intA; cells = G.cells; xy = G.xy; ppm = G.ppm;
            m[G.source] = G.mass;
            seen[G.source] = 1;
            arrived = 1; sweeps = 0; hiNow = G.mass - 1; totNow = G.mass - 1;
            ppmSum = ppm[G.source]; done = false; front = []; toppled = 0;
            rctx.clearRect(0, 0, W, H);
            paintArrival(G.source, 0);
            userPaused = !autoplay || REDUCED;
            clock.slow(pace === 'watch' ? WATCH : 0);
            if (note) note.textContent = 'Mass at source';
            draw(); syncControls();
        }

        function pick(k) {
            if (!ready || !DATA[k]) return;
            if (k === key) return;
            const wasPaused = userPaused;
            key = k;
            buttons.forEach(function (b) {
                const on = b.dataset.mcrtMap === k;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            replay(!REDUCED && !wasPaused);
            if (REDUCED) finishNow(); else startForPace();
        }

        function syncControls() {
            buttons.forEach(function (b) {
                const on = b.dataset.mcrtMap === key;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
                b.disabled = !ready;
            });
            $$('[data-mcrt-pace]').forEach(function (b) {
                const on = b.dataset.mcrtPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
                b.disabled = !ready;
            });
            const play = $('[data-mcrt-run="pause"]');
            if (play) {
                const active = ready && !REDUCED && !userPaused && !done;
                play.textContent = REDUCED ? 'Paused' : (active ? 'Pause' : 'Play');
                play.classList.toggle('is-on', active);
                play.setAttribute('aria-pressed', String(active));
                play.disabled = !ready || REDUCED || done;
            }
            $$('[data-mcrt-run="step"]').forEach(function (b) { b.disabled = !ready || REDUCED || done; });
            $$('[data-mcrt-run="replay"]').forEach(function (b) { b.disabled = !ready; });
        }

        function startForPace() {
            clock.stop(); clock.slow(pace === 'watch' ? WATCH : 0);
            if (ready && pageAwake && !REDUCED && !userPaused && !done) clock.start();
            syncControls();
        }

        Promise.all([
            fetch((window.galleryAssets && window.galleryAssets.mcrtRun)
                || 'plates/p-mcrt-run.json').then(function (r) { return r.json(); }),
            loadImage((window.galleryAssets && window.galleryAssets.mcrtMeshSqrt2)
                || 'plates/p-mcrt-mesh-sqrt2-void.png')
        ]).then(function (got) {
            DATA = got[0];
            underImg.sqrt2 = got[1];
            const g = DATA.sqrt2;
            g.degA = Int32Array.from(g.deg);
            g.offA = Int32Array.from(g.off);
            g.nbrA = Int32Array.from(g.nbr);
            g.intA = Uint8Array.from(g.interior);
            ready = true; replay(!REDUCED);
            if (REDUCED) finishNow(); else startForPace();
        }).catch(function (err) {
            console.warn('mated-CRT sandpile:', err);
            ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, W, H);
        });

        buttons.forEach(function (b) {
            b.addEventListener('click', function () { pick(b.dataset.mcrtMap); });
        });
        $$('[data-mcrt-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                pace = b.dataset.mcrtPace; startForPace();
            });
        });
        $$('[data-mcrt-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ready) return;
                const action = b.dataset.mcrtRun;
                if (action === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); draw(); syncControls(); }
                    else { userPaused = false; startForPace(); }
                }
                if (action === 'step' && !REDUCED && !done) {
                    userPaused = true; clock.stop(); ageFront();
                    if (!sweep()) halt();
                    else if (hiNow < G.tol) halt();
                    else {
                        draw(); note.textContent = 'Sweep ' + nf.format(sweeps); syncControls();
                    }
                }
                if (action === 'replay') {
                    replay(!REDUCED); if (REDUCED) finishNow(); else startForPace();
                }
            });
        });

        draw(); syncControls();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () {
                pageAwake = true; if (ready) draw();
                if (!REDUCED && ready && !userPaused && !done) startForPace();
            }
        };
    };

    /* ---- The boundary of an aggregate, unrolled ----

       Internal DLA and rotor-router aggregation both grow discs, and at any
       honest scale they are the same picture: at 1,200,000 particles the
       ideal radius is 618.0 and one lattice site is about half a pixel. So the
       comparison is made where the difference lives -- in r(theta), the
       farthest occupied site along the ray at angle theta, cut at theta = 0
       and laid flat.

       Nothing is exaggerated. This is the graph of a measured function; only
       the vertical axis is magnified, and by how much is printed. The third
       trace is a perfect disc of the same area measured the same way: below
       about 32,000 particles the boundary has fewer than 720 sites, rays
       start sharing one, and that floor is larger than the difference being
       looked for. Drawing it is what keeps the small-n end honest. */
    makers.boundary = function () {
        const cv = $('#bd-trace');
        if (!cv) return null;
        const ctx = cv.getContext('2d');
        const scrub = $('#bd-scrub');
        const on = { rotor: true, idla: true, disc: true };
        const COL = { rotor: '#7FD4EE', idla: '#C4566F', disc: '#8E8875' };
        /* Marks nest: largest drawn first, smallest last.  With equal
           3.4 px marks the rotor trace, drawn last, fully covered 81% of
           the internal DLA samples at n = 1,000 and 67% at 8,000 -- the
           frames whose whole content is that the traces coincide -- and
           the disc floor, drawn first and smallest, vanished under both.
           Nested, a shared site reads as a cyan core in a rose rim in a
           bone rim, and no sample is ever erased. */
        const MARK = { rotor: 2.4, idla: 3.8, disc: 5.2 };
        let data = null, at = 8;

        function draw() {
            const W = cv.width, H = cv.height;
            ctx.fillStyle = PALETTE.ink;
            ctx.fillRect(0, 0, W, H);
            if (!data) return;
            const f = data.frames[at];
            const padl = 92, padr = 72, padt = 26, padb = 54;

            /* A fixed window silently clamped the small-n frames -- 497 of the
               2,160 points at n = 1,000 sat on the bottom rule as a bar that
               read as measured structure. The window is chosen from the frame
               instead, and the magnification it implies is printed below. */
            /* finer rungs than powers of two: the top frame's worst
               deviation is 4.1, and snapping that to +-8 left the traces
               in the middle quarter of the window */
            const LADDER = [1, 2, 3, 4, 6, 8, 12, 16, 24];
            let worst = 0;
            ['disc', 'idla', 'rotor'].forEach(function (k) {
                if (!on[k] || !f[k]) return;
                for (let i = 0; i < f[k].length; i++) {
                    worst = Math.max(worst, Math.abs(f[k][i] - f.ideal));
                }
            });
            let YLIM = LADDER[LADDER.length - 1];
            for (let i = 0; i < LADDER.length; i++) { if (LADDER[i] >= worst) { YLIM = LADDER[i]; break; } }

            const X = function (i) { return padl + (i / data.angles) * (W - padl - padr); };
            const Y = function (v) { return padt + (YLIM - v) / (2 * YLIM) * (H - padt - padb); };
            const TICKS = [-YLIM, -YLIM / 2, YLIM / 2, YLIM];

            ctx.strokeStyle = 'rgba(201,191,168,.30)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            TICKS.forEach(function (v) {
                ctx.beginPath(); ctx.moveTo(padl, Y(v)); ctx.lineTo(W - padr, Y(v)); ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(239,233,220,.75)';   /* zero: the ideal radius */
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(padl, Y(0)); ctx.lineTo(W - padr, Y(0)); ctx.stroke();

            ctx.font = '22px "IBM Plex Mono", monospace';
            ctx.fillStyle = 'rgba(158,150,134,.9)';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            TICKS.concat([0]).sort(function (a, b) { return a - b; })
                 .forEach(function (v) {
                     ctx.fillText((v > 0 ? '+' : '') + v, padl - 14, Y(v));
                 });
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            [['0', 0], ['π/2', .25], ['π', .5], ['3π/2', .75], ['2π', 1]]
                .forEach(function (t) { ctx.fillText(t[0], X(t[1] * data.angles), H - padb + 14); });

            /* One standard deviation about each trace's own mean.  Drawn as
               full-width translucent bands these overlapped into a grey slab
               that outweighed the data -- at n = 1,000 all three means and
               deviations coincide, which the slab hid.  Each is a whisker in
               the right margin instead: three verticals, compared at a
               glance, equal when they are equal.  The mean itself stays
               ruled across the chart: at n = 212,000 the rotor mean sits
               0.29 lattice units inside the ideal radius, and so does the
               perfect disc's, which is what says it is a discretisation
               offset and not a defect of the aggregate. */
            const GX = { disc: W - padr + 16, idla: W - padr + 34, rotor: W - padr + 52 };
            ['disc', 'idla', 'rotor'].forEach(function (k) {   /* rotor drawn last */
                if (!on[k] || !f[k]) return;
                const r = f[k], sd = f[k + '_sd'];
                let mean = 0;
                for (let i = 0; i < r.length; i++) mean += r[i] - f.ideal;
                mean /= r.length;
                ctx.strokeStyle = COL[k] + '8C';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(padl, Y(mean)); ctx.lineTo(W - padr, Y(mean)); ctx.stroke();
                const x = GX[k];
                ctx.strokeStyle = COL[k];
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(x, Y(mean + sd)); ctx.lineTo(x, Y(mean - sd)); ctx.stroke();
                ctx.lineWidth = 2;
                [mean + sd, mean - sd].forEach(function (v) {
                    ctx.beginPath(); ctx.moveTo(x - 5, Y(v)); ctx.lineTo(x + 5, Y(v)); ctx.stroke();
                });
                ctx.fillStyle = COL[k];
                const w = MARK[k];
                for (let i = 0; i < r.length; i++) {
                    ctx.fillRect(X(i) - w / 2, Y(r[i] - f.ideal) - w / 2, w, w);
                }
            });

            /* the vertical magnification, stated */
            const pxPerSite = (H - padt - padb) / (2 * YLIM);
            const note = $('#bd-scale');
            if (note) {
                note.textContent = 'One lattice site is ' + pxPerSite.toFixed(0)
                    + ' px up the page and ' + ((W - padl - padr) / f.boundary_sites).toFixed(1)
                    + ' px across it; the window is \u00b1' + YLIM + ' lattice units. '
                    + 'Only the vertical axis is magnified. Each trace\u2019s mean is '
                    + 'ruled across the chart, and the whisker at the right spans one '
                    + 'standard deviation about it. Marks are drawn largest first, so '
                    + 'where traces share a site they nest rather than cover.';
            }
        }

        function show(i) {
            at = Math.max(0, Math.min(data.frames.length - 1, i));
            const f = data.frames[at];
            $('#bd-n').textContent = nf.format(f.n);
            $('#bd-r').textContent = f.ideal.toFixed(2);
            $('#bd-sites').textContent = nf.format(f.boundary_sites);
            $('#bd-sd-rotor').textContent = f.rotor_sd.toFixed(3);
            $('#bd-sd-idla').textContent = f.idla_sd.toFixed(3);
            $('#bd-sd-disc').textContent = f.disc_sd.toFixed(3);
            $('#bd-ratio').textContent = f.ratio.toFixed(2);
            if (scrub) scrub.value = String(at);
            draw();
        }

        if (scrub) scrub.addEventListener('input', function () { show(Number(scrub.value)); });
        $$('[data-bd]').forEach(function (b) {
            b.addEventListener('click', function () {
                const k = b.dataset.bd;
                on[k] = !on[k];
                b.classList.toggle('is-on', on[k]);
                b.setAttribute('aria-pressed', String(on[k]));
                draw();
            });
            b.setAttribute('aria-pressed', 'true');
        });

        fetch('plates/p-boundary.json').then(function (r) { return r.json(); })
            .then(function (j) {
                data = j;
                if (scrub) scrub.max = String(j.frames.length - 1);
                show(j.frames.length - 1);
            })
            .catch(function (e) { console.warn('boundary:', e); });

        return {};
    };

    /* ---- Wilson's algorithm, run in the open ----

       Uniform among the 4.157e4593 spanning trees of the 96x96 grid. The
       erasing is the content of the theorem and the finished tree cannot
       show it.

       Two measurements set the pacing and the shade. The first walk has to
       hit a single site -- the root -- and takes a median 20,232 steps to do
       it, so a clock in steps walked spends most of its life on one cyan
       scribble; the clock here is committed edges, of which there are always
       exactly 9,215, and the fast phase then lands between 8.3 and 9.8
       seconds in every one of 120 runs. And over 400 runs the deepest site
       landed between 231 and 935, so no constant may normalise the shade: it
       is renormalised whenever the depth outgrows it, which costs a mean of
       three full repaints and 2,884 extra rectangles over a whole run.

       The one thing the old build never showed was a loop at the moment of
       its death: the closing step and the erasure ran inside one call, so
       the cyan path shortened without ever being seen closed -- and about a
       quarter of watched beats, the immediate doubling-backs, changed
       nothing on screen at all. The closure is now split from the erasure:
       the step that closes a loop paints the whole loop rose, and the next
       beat removes it. The erase beat consumes no randomness, so the tree
       is unchanged draw for draw (checked against the immediate version on
       a shared random stream). A median run closes 16,471 loops (201 runs);
       81 per cent of them are the walk doubling straight back along its
       last edge. */
    /* Wilson's algorithm, sites taken nearest the root first. Wilson's
       theorem is that ANY enumeration of start sites yields the same uniform
       draw, so the order is free to choose, and nearest-first makes the tree
       grow outward from the root: commit time becomes readable off the frozen
       frame as luminance. An edge takes one of twelve shades, brightest
       first, fixed by the count of edges kept when it committed -- each shade
       is one twelfth of the 9,215 -- and is never repainted. The old maker
       shaded by depth and renormalised, repainting the entire record whenever
       the tree outgrew its scale; this one repaints nothing.

       Measured over 200 runs: median 59,015 steps to span, one run in
       twenty above 121,000. Mid-run walks start on the frontier and are short
       (median 1 step, ninth decile 7), but a walk is free to run far ahead:
       the record then stalls a few frames while the cyan walk wanders, which
       is the algorithm, not a defect. Cost per frame: at most 4,000 walk
       steps, plus a mean of five more to leave the next walk on screen
       (bounded by another 4,000), one 1440-square nearest-neighbour drawImage,
       and a direct vector overlay for the live walk (its loop-erased length
       never exceeded 571 edges in simulation). */
    makers.wilson = function () {
        const canvas = $('#wilson-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const N = 96, Q = W / 1152, S = W / N, OFF = S / 2;
        const SZ = N * N, ROOT = (N >> 1) * N + (N >> 1);
        const W_ORD = 2.6 * Q, W_HI = 4.2 * Q;
        const RATE = 0.002, CEIL = 4000;             /* edges, then steps, per frame */
        const WATCH = 0x3fffffff, EVERY = 260;
        const K = 12;
        const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];

        /* Twelve colour-blind-safe insertion bands.  They follow the same
           violet -> rose -> cyan -> paper chronology as the attachment key:
           every committed edge is write-once, so colour remains time. */
        const SHADE = (function () {
            const r = rampOf([[111, 94, 224], [204, 121, 167],
                              [150, 205, 240], [255, 248, 232]]);
            const out = [];
            for (let e = 0; e < K; e++) {
                const i = Math.round(e / (K - 1) * 255) * 3;
                out.push('rgb(' + r[i] + ',' + r[i + 1] + ',' + r[i + 2] + ')');
            }
            return out;
        })();

        const off = document.createElement('canvas');
        off.width = off.height = W;
        const octx = off.getContext('2d');

        const elSteps = $('#wilson-steps'), elKept = $('#wilson-kept'),
              elErased = $('#wilson-erased'), elWalk = $('#wilson-walk'),
              elLeaves = $('#wilson-leaves'), elBranch = $('#wilson-branch'),
              note = $('#wilson-note');

        /* squared distance to the root, for the scan order */
        const d2 = new Int32Array(SZ);
        for (let v = 0; v < SZ; v++) {
            const dx = v % N - (N >> 1), dy = ((v / N) | 0) - (N >> 1);
            d2[v] = dx * dx + dy * dy;
        }

        let nxt, inTree, onpath, posIn, path, order, deg;
        let plen, oi, steps, kept, erased, committed, branchLen, attachments;
        let done, safetyStopped, state, loopCut, closingLive, pendingHit;
        let flash = [], flashAt = -1e9;          /* the path committed a moment ago */
        let pace = 'grow', view = 'whole', viewTouched = false;
        let userPaused = false, pageAwake = true, cameraSnap = true;
        let growFramePhase = 0;
        const cam = { x: N / 2, y: N / 2, h: 15 };

        /* The bake draws an edge as the rectangle its two sites span, grown by
           half the stroke on every side. Same rectangle here. */
        function edge(c, a, b, w) {
            const ax = (a % N) * S + OFF, ay = ((a / N) | 0) * S + OFF;
            const bx = (b % N) * S + OFF, by = ((b / N) | 0) * S + OFF;
            const h = w / 2;
            const x0 = Math.min(ax, bx) - h, y0 = Math.min(ay, by) - h;
            const x1 = Math.max(ax, bx) + h, y1 = Math.max(ay, by) + h;
            c.fillRect(x0, y0, x1 - x0 + Q, y1 - y0 + Q);
        }

        /* Write-once: each edge is drawn the moment it commits, in the shade
           of that moment, and the record is never touched again. */
        function commit(hit) {
            flash = []; flashAt = performance.now();
            for (let i = plen - 1; i >= 0; i--) {
                const v = path[i], p = (i === plen - 1) ? hit : path[i + 1];
                flash.push([v, p]);
                nxt[v] = p;
                inTree[v] = 1; onpath[v] = 0; posIn[v] = -1;
                deg[v]++; deg[p]++;
                kept++; committed++;
                octx.fillStyle = SHADE[((kept - 1) * K / (SZ - 1)) | 0];
                edge(octx, v, p, W_ORD);
            }
            plen = 0;
        }

        function finishTree() {
            if (kept !== SZ - 1) return false;
            done = true;
            let v = 0, len = 0;
            while (v !== ROOT && nxt[v] >= 0 && len < SZ) { v = nxt[v]; len++; }
            branchLen = len;                       /* edges */
            if (!viewTouched) view = 'whole';
            cameraSnap = true;
            if (steps !== kept + erased) console.error('Wilson counter invariant at finish');
            if (note) note.textContent = 'Complete';
            return true;
        }

        function liveEdges() {
            let n = plen ? plen - 1 : 0;
            if (closingLive) n++;
            if (state === 'attach_hold') n++;
            return n;
        }

        function auditCounters() {
            if (steps !== kept + erased + liveEdges()) {
                console.error('Wilson counter invariant:', steps, kept, erased, liveEdges(), state);
                safetyStopped = true;
            }
        }

        function beginWalk() {
            while (oi < SZ && inTree[order[oi]]) oi++;
            if (oi >= SZ) return finishTree();
            const s = order[oi++];
            path[0] = s; plen = 1; posIn[s] = 0; onpath[s] = 1;
            state = 'walk'; cameraSnap = view === 'follow';
            return true;
        }

        function walkStep() {
            if (done || safetyStopped) return false;
            if (!plen) return beginWalk();
            const cur = path[plen - 1], x = cur % N, y = (cur / N) | 0;
            let nx, ny;
            /* four directions resampled until one lands on the grid: uniform
               among a site's actual neighbours, the chain the unweighted
               uniform spanning tree needs */
            do {
                const d = (Math.random() * 4) | 0;
                nx = x + DX[d]; ny = y + DY[d];
            } while (nx < 0 || ny < 0 || nx >= N || ny >= N);
            const nb = ny * N + nx;
            steps++;
            if (inTree[nb]) {
                pendingHit = nb; state = 'attach_hold';
                auditCounters(); return true;
            }
            if (onpath[nb]) {
                loopCut = posIn[nb]; pendingHit = nb;
                closingLive = true; state = 'loop_hold';
                auditCounters(); return true;
            }
            posIn[nb] = plen; onpath[nb] = 1; path[plen++] = nb;
            auditCounters(); return true;
        }

        function eraseOne() {
            if (closingLive) {
                closingLive = false; erased++;
                auditCounters(); return;
            }
            if (plen - 1 > loopCut) {
                const v = path[plen - 1];
                onpath[v] = 0; posIn[v] = -1; plen--; erased++;
            }
            if (plen - 1 === loopCut) {
                loopCut = -1; pendingHit = -1; state = 'walk';
            }
            auditCounters();
        }

        function eraseLoopNow() {
            if (closingLive) { closingLive = false; erased++; }
            while (plen - 1 > loopCut) {
                const v = path[plen - 1];
                onpath[v] = 0; posIn[v] = -1; plen--; erased++;
            }
            loopCut = -1; pendingHit = -1; state = 'walk';
            auditCounters();
        }

        function commitPending() {
            const hit = pendingHit;
            pendingHit = -1;
            commit(hit); attachments++;
            state = 'commit'; auditCounters();
            if (kept === SZ - 1) finishTree();
        }

        function semanticStep() {
            if (done || safetyStopped) return false;
            if (state === 'loop_hold') { state = 'erase'; eraseOne(); }
            else if (state === 'erase') eraseOne();
            else if (state === 'attach_hold') commitPending();
            else if (state === 'commit') { state = 'walk'; beginWalk(); }
            else walkStep();
            return !done && !safetyStopped;
        }

        function growOperation() {
            if (state === 'loop_hold' || state === 'erase') eraseLoopNow();
            else if (state === 'attach_hold') commitPending();
            else if (state === 'commit') { state = 'walk'; beginWalk(); }
            else walkStep();
        }

        function backingPerCss() {
            const css = canvas.getBoundingClientRect().width;
            return css ? W / css : 2;
        }
        function followHalf() {
            return canvas.getBoundingClientRect().width <= 500 ? 11 : 15;
        }
        function cameraTarget() {
            /* the whole board sits inside a small margin, so its outline is seen */
            if (view === 'whole') return { x: N / 2, y: N / 2, h: N / 2 * 1.07 };
            /* Let the live walk set the shot.  A fixed 30-cell window made
               the loop-erasure event microscopic; a three-span window keeps
               the whole active loop visible while giving it about one third
               of the frame. */
            if (!plen) return { x: cam.x, y: cam.y, h: cam.h };
            let minX = N, maxX = 0, minY = N, maxY = 0;
            function include(v) {
                const x = v % N, y = (v / N) | 0;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
            for (let i = 0; i < plen; i++) include(path[i]);
            if (pendingHit >= 0) include(pendingHit);
            const span = Math.max(maxX - minX + 1, maxY - minY + 1);
            const h = Math.max(5, Math.min(N / 2, 1.5 * span));
            return { x: Math.max(h, Math.min(N - h, (minX + maxX + 1) / 2)),
                     y: Math.max(h, Math.min(N - h, (minY + maxY + 1) / 2)), h: h };
        }
        function moveCamera(snap) {
            const q = cameraTarget(), a = snap ? 1 : .32;
            cam.x += (q.x - cam.x) * a; cam.y += (q.y - cam.y) * a;
            cam.h = Math.exp(Math.log(cam.h) + (Math.log(q.h) - Math.log(cam.h)) * (snap ? 1 : .18));
            cam.h = Math.max(8, Math.min(N / 2 * 1.07, cam.h));
            if (cam.h >= N / 2) { cam.x = cam.y = N / 2; }
            else {
                cam.x = Math.max(cam.h, Math.min(N - cam.h, cam.x));
                cam.y = Math.max(cam.h, Math.min(N - cam.h, cam.y));
            }
        }
        function liveEdge(c, a, b, colour, width, alpha) {
            c.globalAlpha = alpha === undefined ? 1 : alpha;
            c.fillStyle = '#08070B'; edge(c, a, b, width + 5 * Q);
            c.fillStyle = colour; edge(c, a, b, width);
            c.globalAlpha = 1;
        }
        function livePath(c, a, b, colour, width, alpha) {
            if (plen < 2 || b <= a) return;
            for (let i = a + 1; i <= b; i++)
                liveEdge(c, path[i - 1], path[i], colour, width, alpha);
        }
        function liveDot(c, v, colour, radius) {
            if (v < 0) return;
            const x = (v % N) * S + OFF, y = ((v / N) | 0) * S + OFF;
            const r = radius * Q;
            c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
            c.fillStyle = '#08070B'; c.fill();
            c.beginPath(); c.arc(x, y, Math.max(2 * Q, r - 3 * Q), 0, Math.PI * 2);
            c.fillStyle = colour; c.fill();
        }
        function transientLayer(c) {
            if (pace === 'watch' && plen) {
                if (state === 'loop_hold' || state === 'erase') {
                    livePath(c, 0, Math.max(0, loopCut), '#A8D8E8', W_HI);
                    livePath(c, Math.max(0, loopCut), plen - 1, '#E76F51', W_HI + Q);
                    if (closingLive)
                        liveEdge(c, path[plen - 1], path[loopCut], '#E76F51', W_HI + 2 * Q);
                    liveDot(c, path[loopCut], '#FFF8E8', 9);
                } else if (state === 'attach_hold') {
                    livePath(c, 0, plen - 1, '#FFF8E8', W_HI);
                    liveEdge(c, path[plen - 1], pendingHit, '#F0E442', W_HI + 2 * Q);
                    liveDot(c, pendingHit, '#F0E442', 10);
                } else {
                    livePath(c, 0, plen - 1, '#A8D8E8', W_HI);
                    liveDot(c, path[plen - 1], '#FFF8E8', 9);
                }
            }
            /* in Grow each committed path is shown in cyan for a beat, so the
               tree is seen to be made of walks rather than to appear */
            if (pace === 'grow' && !done) {
                const age = performance.now() - flashAt;
                if (age < 450 && flash.length && flash.length < 4000) {
                    const a = 1 - age / 450;
                    for (let i = 0; i < flash.length; i++)
                        liveEdge(c, flash[i][0], flash[i][1], '#A8D8E8', W_HI + Q, a);
                }
            }
            if (done) {
                let v = 0, n = 0;
                while (v !== ROOT && nxt[v] >= 0 && n++ < SZ) {
                    liveEdge(c, v, nxt[v], '#A8D8E8', W_HI, .92); v = nxt[v];
                }
            }
            /* The root is a reference point, not the current event. */
            liveDot(c, ROOT, '#F0E442', 8);
        }
        function drawGrid() {
            if (view !== 'follow' || done) return;
            const scale = W / (2 * cam.h), left = cam.x - cam.h, top = cam.y - cam.h;
            ctx.beginPath();
            for (let x = Math.floor(left); x <= Math.ceil(left + 2 * cam.h); x++) {
                const sx = (x - left) * scale; ctx.moveTo(sx, 0); ctx.lineTo(sx, W);
            }
            for (let y = Math.floor(top); y <= Math.ceil(top + 2 * cam.h); y++) {
                const sy = (y - top) * scale; ctx.moveTo(0, sy); ctx.lineTo(W, sy);
            }
            ctx.strokeStyle = 'rgba(58,53,66,.42)';
            ctx.lineWidth = Math.max(1, backingPerCss() * .5); ctx.stroke();
        }
        function paint() {
            moveCamera(cameraSnap); cameraSnap = false;
            const sx = (cam.x - cam.h) * S, sy = (cam.y - cam.h) * S;
            const sw = 2 * cam.h * S;
            ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(off, sx, sy, sw, sw, 0, 0, W, W);
            drawGrid();
            const z = W / sw;
            /* the board's outline: the unspanned part of the stage is a region,
               not an absence */
            ctx.strokeStyle = 'rgba(255,248,232,.14)'; ctx.lineWidth = 1.5;
            ctx.strokeRect(-sx * z + .75, -sy * z + .75, W * z - 1.5, W * z - 1.5);
            ctx.save();
            ctx.setTransform(z, 0, 0, z, -sx * z, -sy * z);
            transientLayer(ctx);
            ctx.restore();
        }

        function update() {
            if (elSteps) elSteps.textContent = nf.format(steps);
            if (elKept) elKept.textContent = nf.format(kept);
            if (elErased) elErased.textContent = nf.format(erased);
            if (elWalk) elWalk.textContent = nf.format(liveEdges());
            if (elLeaves) {
                let lv = 0;
                for (let v = 0; v < SZ; v++) if (deg[v] === 1) lv++;
                elLeaves.textContent = kept > 400
                    ? nf.format(lv) + ' \u00b7 ' + (100 * lv / (kept + 1)).toFixed(1) + '%'
                    : nf.format(lv);
            }
            if (elBranch) elBranch.textContent = done ? nf.format(branchLen) : '\u2014';
            if (note) {
                if (done) note.textContent = 'Complete';
                else if (safetyStopped) note.textContent = 'Finite-run safety limit reached';
                else if (pace === 'grow') note.textContent = '';
                else note.textContent = {
                    walk: plen ? 'Random walk' : 'Rooted tree', loop_hold: 'Loop detected',
                    erase: 'Erase loop', attach_hold: 'Reached tree', commit: 'Add path to tree'
                }[state] || 'Rooted tree';
            }
        }

        function tick() {
            semanticStep(); paint(); update(); syncControls();
            return !done && !safetyStopped;
        }

        /* Commits per frame are proportional to the edges already kept.  The
           deliberately small rate lets the radial attachment chronology
           remain visible in Whole view; the step ceiling still lets a long
           excursion spread over several frames rather than freezing a tab. */
        function frame() {
            /* One growth update every three display frames keeps the radial
               attachment bands readable.  Repainting between updates also
               avoids tying mathematical speed to a machine's CPU speed. */
            growFramePhase = (growFramePhase + 1) % 3;
            if (growFramePhase !== 1) {
                paint(); update(); syncControls();
                return !done && !safetyStopped;
            }
            const quota = Math.max(kept < 2000 ? 3 : 1, Math.round(RATE * Math.max(1, kept)));
            const beforeEdges = committed, beforeSteps = steps;
            let ops = 0;
            while (!done && !safetyStopped && committed - beforeEdges < quota &&
                   steps - beforeSteps < CEIL && ops++ < CEIL * 3) growOperation();
            paint(); update(); syncControls();
            return !done && !safetyStopped;
        }

        function finishNow() {
            let ops = 0;
            while (!done && !safetyStopped && steps < 4000000 && ops++ < 12000000)
                growOperation();
            if (!done) safetyStopped = true;
            cameraSnap = true; paint(); update(); syncControls();
        }

        const clock = paced({ watch: WATCH, every: EVERY, tick: tick,
                              frame: frame, finish: finishNow });

        function reset(autoplay) {
            clock.stop();
            nxt = new Int32Array(SZ).fill(-1);
            inTree = new Uint8Array(SZ);
            onpath = new Uint8Array(SZ);
            posIn = new Int32Array(SZ).fill(-1);
            path = new Int32Array(SZ);
            deg = new Uint8Array(SZ);
            /* shuffle, then a stable sort by distance: sites are taken
               nearest the root first, ties in random order */
            const idx = [];
            for (let i = 0; i < SZ; i++) idx.push(i);
            for (let i = SZ - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
            }
            idx.sort(function (a, b) { return d2[a] - d2[b]; });
            order = idx;
            plen = 0; oi = 0; steps = 0; kept = 0; erased = 0; committed = 0;
            branchLen = 0; attachments = 0; done = false; safetyStopped = false;
            growFramePhase = 0;
            state = 'walk'; loopCut = -1; closingLive = false; pendingHit = -1;
            inTree[ROOT] = 1;
            octx.clearRect(0, 0, W, W);
            cam.x = cam.y = N / 2; cam.h = followHalf(); cameraSnap = true;
            userPaused = !autoplay || REDUCED;
            clock.slow(pace === 'watch' ? WATCH : 0);
            paint(); update(); syncControls();
        }

        function syncControls() {
            $$('[data-ust-pace]').forEach(function (b) {
                const on = b.dataset.ustPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-ust-view]').forEach(function (b) {
                const on = b.dataset.ustView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-ust-run="pause"]');
            if (play) {
                const active = !REDUCED && !userPaused && !done && !safetyStopped;
                play.textContent = REDUCED ? 'Paused' : (active ? 'Pause' : 'Play');
                play.classList.toggle('is-on', active);
                play.setAttribute('aria-pressed', String(active));
                play.disabled = REDUCED || done || safetyStopped;
            }
            $$('[data-ust-run="step"]').forEach(function (b) { b.disabled = REDUCED || done || safetyStopped; });
        }

        function startForPace() {
            clock.stop(); clock.slow(pace === 'watch' ? WATCH : 0);
            if (!REDUCED && pageAwake && !userPaused && !done && !safetyStopped) clock.start();
            syncControls();
        }

        $$('[data-ust-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                pace = b.dataset.ustPace;
                if (!viewTouched) view = pace === 'watch' ? 'follow' : 'whole';
                cameraSnap = true; paint(); update();
                startForPace();
            });
        });
        $$('[data-ust-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.ustView; viewTouched = true; cameraSnap = true;
                paint(); update(); syncControls();
            });
        });
        $$('[data-ust-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const action = b.dataset.ustRun;
                if (action === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); paint(); update(); syncControls(); }
                    else { userPaused = false; startForPace(); }
                }
                if (action === 'step') {
                    userPaused = true; clock.stop();
                    if (pace === 'watch') semanticStep();
                    else {
                        const before = attachments;
                        let ops = 0;
                        while (!done && !safetyStopped && attachments === before && ops++ < 1000000)
                            growOperation();
                        if (attachments === before && !done) safetyStopped = true;
                    }
                    cameraSnap = view === 'follow'; paint(); update(); syncControls();
                }
                if (action === 'replay') {
                    reset(!REDUCED); if (!REDUCED) startForPace(); else finishNow();
                }
            });
        });

        reset(!REDUCED);
        if (REDUCED) finishNow(); else startForPace();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () {
                pageAwake = true; paint(); update();
                if (!REDUCED && !userPaused && !done && !safetyStopped) startForPace();
            }
        };
    };

    /* ---- A walk on the Delaunay graph of a chaos cloud ----

       The graph is the quenched randomness and is baked; the walk is
       annealed and runs fresh, which is the theorem's own structure.

       The record is the order of first entry, and it is write-once: a cell
       is filled the step the walk first enters it, in its arrival band's
       colour, and never repainted. Shading by time spent was tried and
       abandoned -- the running maximum renormalised the ramp, so all 3,000
       cells changed colour on every frame and the endgame was one pale
       wash. Time spent has no write-once picture; the range does, and its
       bands read like the rotor walk's circuits: rose, rose-light, bone,
       every twelve cells of arrival.

       The clock is in arrivals, not steps: a frame walks until one cell in
       170 of those standing is new (or 30,000 steps -- the median frame
       needs 9). Wall time is then logarithmic in the step count, the right
       clock for a frontier that slows as the unvisited set thins, and a
       replay lasts the same ~570 frames whether the cover takes 64,000
       steps or 169,000. It halts at the cover time: the step the last of
       the 3,000 cells is first entered.

       Per frame: at most 30,000 table steps (a 3,000-step advance measured
       0.129 ms in Chrome, so the cap costs ~1.3 ms and the median frame
       nothing), one cached Path2D map stroke, three accumulated arrival
       fills and strokes, 119 trail strokes and one arc. They are transformed
       straight into the visible camera, so follow view never magnifies a
       raster layer. The per-frame sort and the string-keyed edge map of the
       old maker are gone. */
    makers.gmcwalk = function () {
        const canvas = $('#gw-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        /* 280 ms a step made the walker teleport between cells; at 120 it
           reads as motion. */
        const TRAIL = 120, WATCH = 0x3fffffff, EVERY = 120, SCAP = 30000, BAND = 18;
        const HARDCAP = 2000000;   /* tab safety; 12x the slowest baked cover */
        const elSteps = $('#gw-steps'), elVis = $('#gw-visited'),
              elArea = $('#gw-area'), elUnseen = $('#gw-unseen'), note = $('#gw-note');
        /* first-visit order as one sequential ramp: the earliest cells are
           darkest, the newest brightest, so the eye lands where the walk is */
        const BANDS = 12;
        const GW_RAMP = rampOf([[40,60,120], [90,120,210], [178,107,157], [240,162,74], [255,241,184]]);
        const CYCLE = Array.from({ length: BANDS }, function (_, b) {
            const j = Math.round(255 * b / (BANDS - 1)) * 3;
            return 'rgb(' + GW_RAMP[j] + ',' + GW_RAMP[j + 1] + ',' + GW_RAMP[j + 2] + ')';
        });

        let D = null, px = null, py = null, off = null, nbr = null, cum = null;
        let cells = null, areas = null, totalArea = 0;
        let mapPath = null, arrivalPaths = null, mapSize = 1100;
        let visited = null, at = 0, steps = 0, seen = 0, seenArea = 0;
        let done = false, ready = false, pageAwake = true;
        let pace = 'watch', view = 'follow', viewTouched = false, userPaused = false;
        let trail = null, tn = 0, lastFresh = false;
        const cam = { x: mapSize / 2, y: mapSize / 2, h: 145 };
        let cameraSnap = true;

        /* The cells, not dots at their sites. The tessellation IS the
           object: its areas run over a factor of sixty and that spread is
           the multifractality. Arrival bands are broad where the cells are
           large and packed tight where the measure clumps, so the geometry
           is readable off the finished record. */
        function appendCell(path, i) {
            const v = cells[i];
            if (!v || v.length < 6) return false;
            path.moveTo(v[0], v[1]);
            for (let k = 2; k < v.length; k += 2) path.lineTo(v[k], v[k + 1]);
            path.closePath();
            return true;
        }

        function underlay() {
            mapPath = new Path2D();
            for (let i = 0; i < D.n; i++) appendCell(mapPath, i);
        }

        /* write-once: painted on first entry, never touched again; the ink
           hairline keeps the cell edges -- the geometry the bands are read
           against -- from fusing inside a band */
        /* the band index follows the square root of the visit count: the
           early bands then separate while the walk is still young, and the
           ramp stays monotone over the whole cover */
        function paintArrival(i) {
            const u = Math.sqrt(Math.max(0, seen - 1) / Math.max(1, D.n));
            appendCell(arrivalPaths[Math.min(BANDS - 1, Math.floor(BANDS * u))], i);
        }

        function step() {
            const u = (Math.random() * 65536) | 0;
            let k = off[at];
            const end = off[at + 1];
            while (k < end - 1 && cum[k] < u) k++;
            at = nbr[k];
            steps++;
            trail[tn++ % TRAIL] = at;
            if (!visited[at]) {
                visited[at] = 1;
                seen++;
                seenArea += areas[at];
                paintArrival(at);
                return true;
            }
            return false;
        }

        /* a frame: walk until one cell in 170 of those standing is newly
           entered, or the step cap; the halt is the cover time itself */
        function advance() {
            const target = Math.max(1, Math.ceil(0.006 * seen));
            let fresh = 0, s = 0;
            while (fresh < target && s < SCAP && seen < D.n && steps < HARDCAP) {
                if (step()) fresh++;
                s++;
            }
            return fresh;
        }

        function followHalf() {
            return canvas.getBoundingClientRect().width <= 500 ? 100 : 120;
        }
        /* Follow frames the recent walk, not just its head: the box around
           the last hundred cells, with a margin, eased so the picture drifts
           after the walker instead of lurching with every step. */
        function cameraTarget() {
            if (view === 'whole') return { x: mapSize / 2, y: mapSize / 2, h: mapSize / 2 };
            const base = followHalf();
            let minX = px[at], maxX = px[at], minY = py[at], maxY = py[at];
            const m = Math.min(tn, TRAIL, 100);
            for (let k = tn - m; k < tn; k++) {
                const v = trail[(k % TRAIL + TRAIL) % TRAIL];
                if (v < 0) continue;
                minX = Math.min(minX, px[v]); maxX = Math.max(maxX, px[v]);
                minY = Math.min(minY, py[v]); maxY = Math.max(maxY, py[v]);
            }
            const h = Math.min(mapSize / 2, Math.max(base, .62 * Math.max(maxX - minX, maxY - minY) + 36));
            return { x: Math.max(h, Math.min(mapSize - h, (minX + maxX) / 2)),
                     y: Math.max(h, Math.min(mapSize - h, (minY + maxY) / 2)), h: h };
        }
        function moveCamera(snap) {
            const q = cameraTarget(), a = snap ? 1 : .18;
            cam.x += (q.x - cam.x) * a; cam.y += (q.y - cam.y) * a;
            cam.h = Math.exp(Math.log(cam.h) + (Math.log(q.h) - Math.log(cam.h)) * (snap ? 1 : .13));
            cam.h = Math.max(70, Math.min(mapSize / 2, cam.h));
            cam.x = Math.max(cam.h, Math.min(mapSize - cam.h, cam.x));
            cam.y = Math.max(cam.h, Math.min(mapSize - cam.h, cam.y));
        }
        function drawLive(c, zoom) {
            const m = Math.min(tn, TRAIL);
            const first = tn - m;
            /* Canvas coordinates below are in map units after a camera
               transform.  Divide by zoom so the trajectory stays a crisp
               hairline instead of becoming a heavy ribbon when Follow zooms
               into small cells. */
            const darkWidth = 2.6 / zoom, lightWidth = 1 / zoom;
            for (let k = first + 1; k < tn; k++) {
                const a = trail[(k - 1) % TRAIL], b = trail[k % TRAIL];
                const f = (k - first) / m;
                c.beginPath(); c.moveTo(px[a], py[a]); c.lineTo(px[b], py[b]);
                c.strokeStyle = 'rgba(8,7,11,' + (.2 + .5 * f).toFixed(3) + ')';
                c.lineWidth = darkWidth; c.stroke();
                c.beginPath(); c.moveTo(px[a], py[a]); c.lineTo(px[b], py[b]);
                c.strokeStyle = 'rgba(255,248,232,' + (.06 + .5 * f).toFixed(3) + ')';
                c.lineWidth = lightWidth; c.stroke();
            }
            if (!done) {
                const outer = 14 / zoom, inner = 10 / zoom;
                c.beginPath(); c.arc(px[at], py[at], outer, 0, Math.PI * 2);
                c.fillStyle = 'rgba(8,7,11,.85)'; c.fill();
                c.beginPath(); c.arc(px[at], py[at], inner, 0, Math.PI * 2);
                c.fillStyle = '#FFF8E8'; c.fill();
            }
        }
        function draw() {
            if (!ready) {
                ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W); return;
            }
            moveCamera(cameraSnap); cameraSnap = false;
            const sx = cam.x - cam.h, sy = cam.y - cam.h, sw = 2 * cam.h;
            ctx.fillStyle = '#0F0E13'; ctx.fillRect(0, 0, W, W);
            const z = W / sw;
            ctx.save();
            ctx.setTransform(z, 0, 0, z, -sx * z, -sy * z);
            ctx.strokeStyle = 'rgba(58,53,66,.72)';
            ctx.lineWidth = 2.4 / z; ctx.stroke(mapPath);
            for (let q = 0; q < CYCLE.length; q++) {
                ctx.fillStyle = CYCLE[q]; ctx.fill(arrivalPaths[q]);
                ctx.strokeStyle = 'rgba(8,7,11,.72)';
                ctx.lineWidth = 2.6 / z; ctx.stroke(arrivalPaths[q]);
            }
            drawLive(ctx, z);
            ctx.restore();
            report();
        }

        function report() {
            if (elSteps) elSteps.textContent = nf.format(steps);
            if (elVis) elVis.textContent = nf.format(seen);
            if (elArea) elArea.textContent = totalArea > 0
                ? (100 * seenArea / totalArea).toFixed(1) + '%' : '—';
            if (elUnseen) elUnseen.textContent = D ? nf.format(D.n - seen) : '—';
        }

        function halt() {
            done = true;
            tn = 0;
            if (!viewTouched) view = 'whole';
            cameraSnap = true; draw(); syncControls();
            if (note) note.textContent = seen >= D.n
                ? 'All cells visited'
                : 'Finite-run safety limit reached';
        }

        function tick() {
            if (done) return false;
            lastFresh = step();
            draw(); syncControls();
            if (seen >= D.n) { halt(); return false; }
            if (note) note.textContent = 'Random walk';
            return true;
        }

        function frame() {
            if (done) return false;
            lastFresh = advance() > 0;
            draw(); syncControls();
            if (seen >= D.n || steps >= HARDCAP) { halt(); return false; }
            if (note) note.textContent = 'Random walk';
            return true;
        }

        function finishNow() {
            if (!D || done) return;
            while (seen < D.n && steps < HARDCAP) step();
            halt();
        }

        const clock = paced({ watch: WATCH, every: EVERY, tick: tick,
                              frame: frame, finish: finishNow });

        function replay(autoplay) {
            if (!D) return;
            clock.stop();
            visited = new Uint8Array(D.n);
            trail = new Int32Array(TRAIL);
            at = D.start; steps = 0; tn = 0; done = false;
            lastFresh = false;
            visited[at] = 1; seen = 1; seenArea = areas[at];
            trail[tn++] = at;
            arrivalPaths = CYCLE.map(function () { return new Path2D(); });
            paintArrival(at);
            cam.x = px[at]; cam.y = py[at]; cam.h = followHalf(); cameraSnap = true;
            userPaused = !autoplay || REDUCED;
            clock.slow(pace === 'watch' ? WATCH : 0);
            draw(); syncControls();
            if (note) note.textContent = 'Start';
        }

        function syncControls() {
            $$('[data-gw-pace]').forEach(function (b) {
                const on = b.dataset.gwPace === pace;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-gw-view]').forEach(function (b) {
                const on = b.dataset.gwView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const play = $('[data-gw-run="pause"]');
            if (play) {
                const active = ready && !REDUCED && !userPaused && !done;
                play.textContent = REDUCED ? 'Paused' : (active ? 'Pause' : 'Play');
                play.classList.toggle('is-on', active);
                play.setAttribute('aria-pressed', String(active));
                play.disabled = !ready || REDUCED || done;
            }
            $$('[data-gw-run="step"]').forEach(function (b) { b.disabled = !ready || REDUCED || done; });
            $$('[data-gw-run="replay"]').forEach(function (b) { b.disabled = !ready; });
        }

        function startForPace() {
            clock.stop(); clock.slow(pace === 'watch' ? WATCH : 0);
            if (ready && pageAwake && !REDUCED && !userPaused && !done) clock.start();
            syncControls();
        }

        fetch('plates/p-gmcwalk.json').then(function (r) { return r.json(); })
            .then(function (j) {
                D = j;
                mapSize = j.canvas || 1100;
                px = Float64Array.from(j.px); py = Float64Array.from(j.py);
                off = Int32Array.from(j.off);
                nbr = Int32Array.from(j.nbr); cum = Uint16Array.from(j.cum);
                cells = j.cells;
                areas = new Float64Array(j.n);
                totalArea = 0;
                for (let i = 0; i < j.n; i++) {
                    const v = j.cells[i];
                    let a = 0;
                    if (v && v.length >= 6) {
                        for (let k = 0; k < v.length; k += 2) {
                            const f = (k + 2) % v.length;
                            a += v[k] * v[f + 1] - v[f] * v[k + 1];
                        }
                        a = Math.abs(a) / 2;
                    }
                    areas[i] = a;
                    totalArea += a;
                }
                underlay();
                ready = true; replay(!REDUCED);
                if (REDUCED) finishNow(); else startForPace();
            })
            .catch(function (e) {
                console.warn('gmc walk:', e);
                ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, W, W);
            });

        $$('[data-gw-pace]').forEach(function (b) {
            b.addEventListener('click', function () {
                pace = b.dataset.gwPace;
                if (!viewTouched) view = pace === 'watch' ? 'follow' : 'whole';
                cameraSnap = true; draw(); startForPace();
            });
        });
        $$('[data-gw-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.gwView; viewTouched = true; cameraSnap = true;
                draw(); syncControls();
            });
        });
        $$('[data-gw-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (!ready) return;
                const action = b.dataset.gwRun;
                if (action === 'pause') {
                    if (clock.running()) { userPaused = true; clock.stop(); draw(); syncControls(); }
                    else { userPaused = false; startForPace(); }
                }
                if (action === 'step' && !REDUCED && !done) {
                    userPaused = true; clock.stop();
                    if (pace === 'watch') lastFresh = step();
                    else {
                        let guard = 0; lastFresh = false;
                        while (!lastFresh && seen < D.n && steps < HARDCAP && guard++ < SCAP)
                            lastFresh = step();
                    }
                    if (seen >= D.n || steps >= HARDCAP) halt();
                    else {
                        cameraSnap = view === 'follow'; draw(); syncControls();
                        if (note) note.textContent = lastFresh ? 'First visit to a new cell' : 'Random walk';
                    }
                }
                if (action === 'replay') {
                    replay(!REDUCED); if (REDUCED) finishNow(); else startForPace();
                }
            });
        });

        draw(); syncControls();
        return {
            pause: function () { pageAwake = false; clock.stop(); },
            resume: function () {
                pageAwake = true; draw();
                if (!REDUCED && ready && !userPaused && !done) startForPace();
            }
        };
    };

    /* ---------------- New research-page instruments ---------------- */

    /* Equilibrium fluctuations and linear response use the same Brownian
       increments.  The potential is a fixed finite Fourier sum, so both the
       field shown on screen and its gradient in Euler--Maruyama are smooth
       deterministic functions; only the driving increments are random. */
    makers.einsteinintro = function () {
        const path = [[118,390],[164,342],[207,369],[258,305],[306,332],
                      [351,276],[405,306],[459,246],[512,273],[574,218]];
        return loopingRule('einstein-relation', 7200, function (ctx, W, p) {
            const left = 92, right = W - 82, mid = W * .52;
            function trace(points, pos, color) {
                ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
                for (let i = 1; i <= pos.index; i++) ctx.lineTo(points[i][0], points[i][1]);
                ctx.lineTo(pos.x, pos.y);
                ctx.strokeStyle = 'rgba(21,19,26,.4)'; ctx.lineWidth = 3; ctx.stroke();
                ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
            }
            ctx.beginPath();
            for (let x = left; x <= right; x += 4) {
                const y = mid + 42 * Math.sin((x - left) / 62)
                    + 18 * Math.sin((x - left) / 23 + .7);
                if (x === left) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = RULE_VIS.grid; ctx.lineWidth = 2.2; ctx.stroke();

            const q = p < .42 ? ruleEase(p / .42) : 1;
            const pos0 = rulePathPoint(path, q);
            trace(path, pos0, RULE_VIS.cyanBright);
            ruleParticle(ctx, pos0.x, pos0.y, 10, RULE_VIS.cyan);

            if (p >= .42) {
                const a = ruleEase((p - .42) / .18);
                ctx.beginPath(); ctx.moveTo(W * .25, 145); ctx.lineTo(W * (.25 + .34 * a), 145);
                ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 2.5; ctx.stroke();
                ruleArrow(ctx, W * (.25 + .34 * a), 145, 0, 18,
                          RULE_VIS.yellow, 2.4, 0);
            }

            if (p >= .56) {
                const r = ruleEase((p - .56) / .30);
                /* the tilted walker in the instrument's yellow, lifted a
                   little so both paths stay visible where they coincide */
                const shifted = path.map(function (z, i) {
                    return [z[0] + r * (18 + 3.8 * i), z[1] - 7 * r];
                });
                const pos1 = rulePathPoint(shifted, q);
                trace(shifted, pos1, RULE_VIS.yellow);
                ruleParticle(ctx, pos1.x, pos1.y, 10, RULE_VIS.white);
            }

            /* Two rulers encode the competing scales without a prose label:
               equilibrium fluctuations are sqrt(t), response is lambda t. */
            const root = 94, drift = p < .42 ? 0 : 94 * ruleEase((p - .42) / .38);
            ctx.beginPath(); ctx.moveTo(112, 610); ctx.lineTo(112 + root, 610);
            ctx.strokeStyle = RULE_VIS.cyanBright; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(112, 642); ctx.lineTo(112 + drift, 642);
            ctx.strokeStyle = RULE_VIS.yellow; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = RULE_VIS.key; ctx.font = '600 22px ui-monospace, monospace';
            ctx.fillText('\u221at', 220, 617); ctx.fillText('\u03bbt', 220, 649);
        }, .86);
    };

    makers.einstein = function () {
        const canvas = $('#einstein-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W0 = canvas.width, H0 = canvas.height;
        const outBalance = $('#einstein-balance'), outError = $('#einstein-error'),
              note = $('#einstein-note');
        /* With a=I, the displayed generator is
           (1/2)e^(2V) div(e^(-2V) grad) = (1/2)Delta - grad V . grad,
           hence unit Brownian noise and drift -grad V. */
        const LOGICAL = 720, M = 40, DT = .01, SQ = Math.sqrt(DT),
              STEPS = 9, KEEP = 1500;
        const fieldCan = document.createElement('canvas'), FIELD = 96;
        fieldCan.width = fieldCan.height = FIELD;
        const fieldCtx = fieldCan.getContext('2d');
        const fieldImage = fieldCtx.createImageData(FIELD, FIELD);
        let lambda = .125, time = 0, seed = 0x4e554c4c, spare = null;
        let x0, y0, x1, y1, trail0, trail1, camera, scale;
        let raf = 0, running = false, pageAwake = true, userPaused = false, lastNow = 0;

        function rand() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function normal() {
            if (spare !== null) { const z = spare; spare = null; return z; }
            const r = Math.sqrt(-2 * Math.log(Math.max(1e-12, rand()))),
                  a = 2 * Math.PI * rand();
            spare = r * Math.sin(a); return r * Math.cos(a);
        }
        function potential(x, y) {
            return .46 * Math.sin(x + .23) + .31 * Math.cos(y - .41)
                 + .22 * Math.sin(x + y * .73) + .15 * Math.cos(1.7 * x - .8 * y);
        }
        function gradient(x, y) {
            return [
                .46 * Math.cos(x + .23) + .22 * Math.cos(x + y * .73)
                    - .255 * Math.sin(1.7 * x - .8 * y),
                -.31 * Math.sin(y - .41) + .1606 * Math.cos(x + y * .73)
                    + .12 * Math.sin(1.7 * x - .8 * y)
            ];
        }
        function reset() {
            seed = 0x4e554c4c; spare = null; time = 0;
            x0 = new Float64Array(M); y0 = new Float64Array(M);
            x1 = new Float64Array(M); y1 = new Float64Array(M);
            for (let i = 0; i < M; i++) {
                const a = 2 * Math.PI * i / M;
                x0[i] = x1[i] = .035 * Math.cos(a);
                y0[i] = y1[i] = .035 * Math.sin(a);
            }
            trail0 = [[x0[0], y0[0]]]; trail1 = [[x1[0], y1[0]]];
            camera = { x: 0, y: 0 }; scale = 50;
            if (REDUCED) advance(2200);
            paint(); sync();
        }
        function advance(n) {
            for (let s = 0; s < n; s++) {
                for (let i = 0; i < M; i++) {
                    const zx = normal(), zy = normal();
                    let g = gradient(x0[i], y0[i]);
                    x0[i] += -g[0] * DT + SQ * zx;
                    y0[i] += -g[1] * DT + SQ * zy;
                    g = gradient(x1[i], y1[i]);
                    x1[i] += (-g[0] + lambda) * DT + SQ * zx;
                    y1[i] += -g[1] * DT + SQ * zy;
                }
                time += DT;
                if ((s & 3) === 0) {
                    trail0.push([x0[0], y0[0]]); trail1.push([x1[0], y1[0]]);
                }
            }
            if (trail0.length > KEEP) {
                trail0.splice(0, trail0.length - KEEP);
                trail1.splice(0, trail1.length - KEEP);
            }
        }
        function worldToScreen(x, y) {
            return [LOGICAL * .5 + (x - camera.x) * scale,
                    LOGICAL * .5 + (y - camera.y) * scale];
        }
        function drawPotentialField() {
            const d = fieldImage.data;
            for (let j = 0; j < FIELD; j++) for (let i = 0; i < FIELD; i++) {
                const x = camera.x + ((i + .5) / FIELD * LOGICAL - LOGICAL * .5) / scale;
                const y = camera.y + ((j + .5) / FIELD * LOGICAL - LOGICAL * .5) / scale;
                const v = Math.max(-1, Math.min(1, potential(x, y) / 1.08));
                /* a greyscale relief: the three data colours are the only chroma */
                const a = .16 + .18 * Math.abs(v);
                const target = v < 0 ? [62,70,88] : [86,72,80];
                const k = (j * FIELD + i) * 4;
                d[k] = Math.round(15 + (target[0] - 15) * a);
                d[k + 1] = Math.round(14 + (target[1] - 14) * a);
                d[k + 2] = Math.round(19 + (target[2] - 19) * a);
                d[k + 3] = 255;
            }
            fieldCtx.putImageData(fieldImage, 0, 0);
            ctx.save(); ctx.imageSmoothingEnabled = true;
            ctx.drawImage(fieldCan, 0, 0, LOGICAL, LOGICAL);
            ctx.restore();
        }
        function contour(level, color) {
            const step = .48, half = LOGICAL / scale * .58;
            const xa = Math.floor((camera.x - half) / step) * step,
                  xb = camera.x + half, ya = Math.floor((camera.y - half) / step) * step,
                  yb = camera.y + half;
            ctx.beginPath();
            for (let y = ya; y < yb; y += step) for (let x = xa; x < xb; x += step) {
                const v = [potential(x,y)-level, potential(x+step,y)-level,
                           potential(x+step,y+step)-level, potential(x,y+step)-level];
                const p = [[x,y],[x+step,y],[x+step,y+step],[x,y+step]], cuts = [];
                for (let e = 0; e < 4; e++) {
                    const f = (e + 1) & 3;
                    if ((v[e] <= 0 && v[f] > 0) || (v[e] > 0 && v[f] <= 0)) {
                        const q = v[e] / (v[e] - v[f]);
                        cuts.push([ruleMix(p[e][0], p[f][0], q),
                                   ruleMix(p[e][1], p[f][1], q)]);
                    }
                }
                for (let e = 0; e + 1 < cuts.length; e += 2) {
                    const a = worldToScreen(cuts[e][0], cuts[e][1]),
                          b = worldToScreen(cuts[e + 1][0], cuts[e + 1][1]);
                    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
                }
            }
            ctx.strokeStyle = color; ctx.lineWidth = .62; ctx.stroke();
        }
        function drawTrail(a, color) {
            if (a.length < 2) return;
            const first = Math.max(0, a.length - 1120), span = Math.max(1, a.length - first - 1);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (let lo = first; lo < a.length - 1; lo += 28) {
                const hi = Math.min(a.length - 1, lo + 28), age = (hi - first) / span;
                let q = worldToScreen(a[lo][0], a[lo][1]);
                ctx.beginPath(); ctx.moveTo(q[0], q[1]);
                for (let i = lo + 1; i <= hi; i++) {
                    q = worldToScreen(a[i][0], a[i][1]); ctx.lineTo(q[0], q[1]);
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = .5 + .3 * age;
                ctx.globalAlpha = .05 + .34 * age * age;
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        function drawResponse() {
            const n = Math.min(trail0.length, trail1.length);
            if (n < 2) return;
            const first = Math.max(0, n - 1000), span = Math.max(1, n - first);
            ctx.lineCap = 'round';
            for (let i = first + 34; i < n; i += 72) {
                const a = worldToScreen(trail0[i][0], trail0[i][1]);
                const b = worldToScreen(trail1[i][0], trail1[i][1]);
                const age = (i - first) / span;
                ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
                ctx.strokeStyle = 'rgba(213,94,119,' + (.035 + .20 * age * age).toFixed(3) + ')';
                ctx.lineWidth = .52; ctx.stroke();
            }
        }
        function drawTracer(q, fill) {
            ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(q[0], q[1], 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(15,14,19,.85)'; ctx.lineWidth = 1; ctx.stroke();
        }
        function labelMag() {
            const cssW = canvas.getBoundingClientRect().width || 720;
            return Math.max(1, Math.min(2, 560 / cssW));
        }
        function drawRuler(y, length, color, label) {
            const mag = labelMag(), x = 42, end = x + length * mag;
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(end, y);
            ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
            ctx.moveTo(end, y - 3); ctx.lineTo(end, y + 3); ctx.stroke();
            ctx.fillStyle = color; ctx.font = '500 ' + Math.round(13 * mag) + 'px ui-monospace, monospace';
            ctx.fillText(label, 42 + 188 * mag, y + 4 * mag);
        }
        function report() {
            const t = Math.max(time, DT), ratio = lambda * Math.sqrt(t);
            let m0x = 0, m1x = 0;
            for (let i = 0; i < M; i++) { m0x += x0[i]; m1x += x1[i]; }
            m0x /= M; m1x /= M;
            let variance = 0;
            for (let i = 0; i < M; i++) variance += (x0[i] - m0x) * (x0[i] - m0x);
            const diff = variance / (M * t), mobility = (m1x - m0x) / (lambda * t);
            if (outBalance) outBalance.textContent = ratio.toFixed(2);
            if (outError) outError.textContent = Math.abs(mobility - diff).toFixed(3);
            setNote(note, ratio > .78 && ratio < 1.28
                ? 'Critical time t \u2248 \u03bb\u207b\u00b2' : 'Shared Gaussian increments \u0394W');
        }
        function paint() {
            const qx = (x0[0] + x1[0]) * .5, qy = (y0[0] + y1[0]) * .5,
                  sep = Math.hypot(x1[0] - x0[0], y1[0] - y0[0]);
            camera.x += .045 * (qx - camera.x); camera.y += .045 * (qy - camera.y);
            const targetScale = Math.max(10, Math.min(52, 285 / (sep + 5.2)));
            scale += .04 * (targetScale - scale);
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W0,H0);
            ctx.save(); ctx.scale(W0 / LOGICAL, H0 / LOGICAL);
            drawPotentialField();
            contour(-.6, 'rgba(230,220,200,.15)');
            contour(0, 'rgba(230,220,200,.2)');
            contour(.6, 'rgba(230,220,200,.15)');
            drawTrail(trail0, '#56B4E9'); drawTrail(trail1, '#E69F00');
            let a = worldToScreen(x0[0], y0[0]), b = worldToScreen(x1[0], y1[0]);
            ctx.save(); ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            ctx.strokeStyle = 'rgba(213,94,119,.8)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();
            drawTracer(a, '#56B4E9'); drawTracer(b, '#F0E442');

            const t = Math.max(time, DT), fluct = Math.sqrt(t), drift = lambda * t,
                  ruler = 180 / Math.max(1, fluct, drift), l1 = ruler * fluct,
                  l2 = ruler * drift;
            const lm = labelMag();
            drawRuler(54 * lm, l1, '#56B4E9', '\u221at');
            drawRuler(78 * lm, l2, '#F0E442', '\u03bbt');
            ctx.fillStyle='#F2EDE2'; ctx.font='500 ' + Math.round(13 * lm) + 'px ui-monospace, monospace';
            if (lambda * Math.sqrt(t) > .78 && lambda * Math.sqrt(t) < 1.28) {
                ctx.fillStyle='#F6F1E6'; ctx.fillText('t \u2248 \u03bb\u207b\u00b2', 42 + 270 * lm, 70 * lm);
            }
            ctx.restore(); report();
        }
        function sync() {
            $$('[data-einstein-force]').forEach(function (b) {
                const on = Math.abs(parseFloat(b.dataset.einsteinForce) - lambda) < 1e-12;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-einstein-run="pause"]');
            if (b) { b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running)); }
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const pace = Math.max(.35, Math.min(1.6, (now-lastNow)/16.67)); lastNow=now;
            advance(Math.max(1, Math.round(STEPS*pace))); paint();
            raf=requestAnimationFrame(frame);
        }
        function stop() { running=false; cancelAnimationFrame(raf); raf=0; lastNow=0; sync(); }
        function start() {
            if (REDUCED || running || !pageAwake || userPaused) return;
            running=true; lastNow=0; sync(); raf=requestAnimationFrame(frame);
        }
        $$('[data-einstein-force]').forEach(function (b) {
            b.addEventListener('click', function () {
                const v=parseFloat(b.dataset.einsteinForce); if (!(v>0) || v===lambda) return;
                lambda=v; reset(); if (!userPaused) start();
            });
        });
        $$('[data-einstein-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a=b.dataset.einsteinRun;
                if(a==='pause'){if(running){userPaused=true;stop();}else{userPaused=false;start();}}
                if(a==='replay'){stop();userPaused=REDUCED;reset();if(!userPaused)start();}
            });
        });
        reset(); if (!REDUCED) start();
        return { pause:function(){pageAwake=false;stop();},
                 resume:function(){pageAwake=true;paint();if(!userPaused)start();} };
    };

    /* A symmetric substochastic kernel on an irregular subgraph of Z^2.
       Missing lattice neighbours are the killed boundary.  Consequently the
       cumulative parallel-toppling recursion

           q_n = g + P w_n,       w_(n+1) = q_n^+

       is literally the finite-horizon Bellman recursion for the reward g.
       The signed pre-threshold field q_n, its positive part w_(n+1), and the
       continuation set {q_n > 0} are displayed in sequence. */
    makers.rwrsintro = function () {
        const pts=[[360,360],[190,360],[530,360],[360,190],[360,530]], weights=[.52,.21,.72,.34,.63];
        return loopingRule('sandpile-rwrs', 7000, function(ctx,W,p){
            const spread=ruleEase(p/.34), expect=ruleEase((p-.34)/.30), merge=ruleEase((p-.64)/.24);
            pts.slice(1).forEach(function(q,i){
                ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);ctx.lineTo(q[0],q[1]);
                ctx.strokeStyle=RULE_VIS.grid;ctx.lineWidth=4;ctx.stroke();
                if(p<.5){
                    const x=ruleMix(pts[0][0],q[0],spread),y=ruleMix(pts[0][1],q[1],spread);
                    ruleParticle(ctx,x,y,7,RULE_VIS.cyan);
                }
                ctx.beginPath();ctx.arc(q[0],q[1],18,0,Math.PI*2);
                ctx.fillStyle=weights[i]>.5?RULE_VIS.cyan:RULE_VIS.rose;ctx.fill();
            });
            ctx.beginPath();ctx.arc(360,360,28,0,Math.PI*2);
            ctx.fillStyle=p<.64?'rgba(211,201,183,.45)':ruleMixColor(RULE_VIS.rose,RULE_VIS.white,merge);ctx.fill();
            ctx.strokeStyle=RULE_VIS.quiet;ctx.lineWidth=1.5;ctx.stroke();
            if(p>=.34){
                pts.slice(1).forEach(function(q,i){
                    const x=ruleMix(q[0],360,expect),y=ruleMix(q[1],360,expect);
                    ruleParticle(ctx,x,y,6,RULE_VIS.rose);
                });
            }
            ctx.fillStyle=RULE_VIS.key;ctx.font='600 25px ui-monospace, monospace';
            ctx.fillText('(g + Pu)\u207a',278,638);
        },.86);
    };

    /* local hexadecimal colours are deliberately avoided; this helper also
       keeps the rule animation's merge continuous in every browser. */
    function ruleMixColor(a,b,t){
        function rgb(s){const z=parseInt(s.slice(1),16);return[(z>>16)&255,(z>>8)&255,z&255];}
        const x=rgb(a),y=rgb(b);return 'rgb('+Math.round(ruleMix(x[0],y[0],t))+','+
            Math.round(ruleMix(x[1],y[1],t))+','+Math.round(ruleMix(x[2],y[2],t))+')';
    }

    makers.rwrs = function () {
        const canvas=$('#rwrs-canvas'); if(!canvas)return null;
        const ctx=canvas.getContext('2d'),W0=canvas.width,H0=canvas.height,
              LOGICAL_W=864,LOGICAL_H=720;
        const outH=$('#rwrs-horizon'),outV=$('#rwrs-value'),note=$('#rwrs-note');
        const outHLabel=outH&&outH.closest('div')?$('dt',outH.closest('div')):null,
              outVLabel=outV&&outV.closest('div')?$('dt',outV.closest('div')):null;
        if(outHLabel){outHLabel.textContent='\\(q_n(x)\\) range over \\(D\\)';
            if(window.typeset)window.typeset(outHLabel);}
        if(outVLabel){outVLabel.textContent='\\(\\max_{x\\in D} w_{n+1}(x)\\)';
            if(window.typeset)window.typeset(outVLabel);}
        const N=15,MAXH=72,nodes=[],at=new Int16Array(N*N);at.fill(-1);
        function inside(x,y){
            const dx=x-7,dy=y-7;
            return dx*dx+1.15*dy*dy<47 && !(x>9&&y<4) && !(x<4&&y>9)
                && !(x===3&&y===5) && !(x===11&&y===9);
        }
        for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(inside(x,y)){
            at[y*N+x]=nodes.length;nodes.push({x:x,y:y,nbr:[]});
        }
        const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        nodes.forEach(function(v){dirs.forEach(function(d){const x=v.x+d[0],y=v.y+d[1];
            if(x>=0&&x<N&&y>=0&&y<N&&at[y*N+x]>=0)v.nbr.push(at[y*N+x]);});});
        let mu=1,W,Q,g,sample=[],sampleSeed=0x13579bdf;
        let elapsed=0,lastNow=0,raf=0,running=false,pageAwake=true,userPaused=false;
        function scenery(v){
            /* One frozen, bounded scenery realization.  The hash is only a
               reproducible way to sample it; changing mu shifts its mean but
               never changes which vertices are favourable. */
            let z=(Math.imul(v.x+17,0x45d9f3b)^Math.imul(v.y+31,0x119de1f3)^0x6b84221d)>>>0;
            z=Math.imul(z^(z>>>16),0x45d9f3b)>>>0;z=(z^(z>>>16))>>>0;
            return .58*(2*z/4294967296-1);
        }
        function rebuild(){
            g=new Float64Array(nodes.length);for(let i=0;i<nodes.length;i++)g[i]=mu-1+scenery(nodes[i]);
            W=[new Float64Array(nodes.length)];Q=[];
            for(let n=0;n<MAXH;n++){
                const q=new Float64Array(nodes.length),w=new Float64Array(nodes.length),
                      previous=W[n];
                for(let i=0;i<nodes.length;i++){
                    let expected=0;for(let k=0;k<nodes[i].nbr.length;k++){
                        expected+=previous[nodes[i].nbr[k]]*.25;
                    }
                    q[i]=g[i]+expected;w[i]=Math.max(0,q[i]);
                }
                Q.push(q);W.push(w);
            }
            buildSample(sampleSeed);elapsed=0;paint();sync();
        }
        function random(){sampleSeed^=sampleSeed<<13;sampleSeed^=sampleSeed>>>17;sampleSeed^=sampleSeed<<5;
            return(sampleSeed>>>0)/4294967296;}
        function buildSample(seed0){
            sampleSeed=seed0>>>0;let start=0;
            for(let i=1;i<nodes.length;i++)if(W[MAXH][i]>W[MAXH][start])start=i;
            sample=[{i:start,r:MAXH,sum:0,kind:'start'}];let x=start,sum=0;
            for(let r=MAXH;r>0;r--){
                const q=Q[r-1][x];
                if(q<=0){sample.push({i:x,r:r,sum:sum,kind:'stop'});break;}
                sum+=g[x];const d=(random()*4)|0,v=nodes[x],xx=v.x+dirs[d][0],yy=v.y+dirs[d][1];
                if(xx<0||xx>=N||yy<0||yy>=N||at[yy*N+xx]<0){sample.push({i:-1,r:r-1,sum:sum,kind:'killed'});break;}
                x=at[yy*N+xx];sample.push({i:x,r:r-1,sum:sum,kind:'walk'});
            }
        }
        function pos(i){const v=nodes[i];return[92+v.x*(680/(N-1)),77+v.y*(566/(N-1))];}
        function sceneryLayer(){
            let max=1e-12;for(let i=0;i<g.length;i++)max=Math.max(max,Math.abs(g[i]));
            /* the frozen scenery, small and quiet under the recursion */
            nodes.forEach(function(v,i){const q=pos(i),a=Math.sqrt(Math.abs(g[i])/max);
                ctx.beginPath();ctx.arc(q[0],q[1],3.2+2.2*a,0,Math.PI*2);
                ctx.fillStyle=g[i]<0?'rgba(204,121,167,'+(.30+.30*a)+')':
                    'rgba(86,180,233,'+(.30+.30*a)+')';
                ctx.fill();
            });
        }
        function thresholdField(n,threshold,alpha){
            const qn=Q[n];let scale=1e-12;
            for(let i=0;i<qn.length;i++)scale=Math.max(scale,Math.abs(qn[i]));
            /* magnitude is radius, opaque: alpha-coded discs read as out of focus */
            nodes.forEach(function(v,i){
                const point=pos(i),z=qn[i],a=Math.sqrt(Math.abs(z)/scale),
                      keep=z>0?1:1-threshold,
                      radius=(3+8.5*a)*keep;
                if(radius<.2)return;
                ctx.beginPath();ctx.arc(point[0],point[1],radius,0,Math.PI*2);
                ctx.fillStyle=z>0?'rgba(86,180,233,'+(alpha*.95)+')':
                    'rgba(204,121,167,'+(alpha*keep*.95)+')';
                ctx.fill();
            });
        }
        function continuationSet(n,alpha){
            const qn=Q[n];
            nodes.forEach(function(v,i){if(qn[i]>0){const point=pos(i);
                ctx.beginPath();ctx.arc(point[0],point[1],13.5,0,Math.PI*2);
                ctx.strokeStyle='rgba(255,248,232,'+alpha+')';ctx.lineWidth=1.4;ctx.stroke();
            }});
        }
        function fieldStats(n){
            const qn=Q[n],wn=W[n+1];let lo=Infinity,hi=-Infinity,maxW=0,positive=0;
            for(let i=0;i<qn.length;i++){
                lo=Math.min(lo,qn[i]);hi=Math.max(hi,qn[i]);maxW=Math.max(maxW,wn[i]);
                if(qn[i]>0)positive++;
            }
            return{lo:lo,hi:hi,maxW:maxW,positive:positive};
        }
        function signed(v){return(v<0?'\u2212':'')+Math.abs(v).toFixed(3);}
        function drawWalk(local){
            const count=Math.max(1,Math.min(sample.length,
                Math.floor((local-.56)/.32*sample.length)+1));
            ctx.beginPath();let began=false;
            for(let k=0;k<count;k++)if(sample[k].i>=0){const point=pos(sample[k].i);
                if(!began){ctx.moveTo(point[0],point[1]);began=true;}else ctx.lineTo(point[0],point[1]);}
            ctx.strokeStyle='rgba(240,228,66,.9)';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
            const z=sample[count-1];if(z&&z.i>=0){const point=pos(z.i);
                ctx.beginPath();ctx.arc(point[0],point[1],6.5,0,Math.PI*2);
                ctx.fillStyle='#F0E442';ctx.fill();
                ctx.strokeStyle='rgba(15,14,19,.85)';ctx.lineWidth=1.6;ctx.stroke();
            }
        }
        function phaseNote(local,n,positive){
            if(local<.32)return'q\u2099 = g + Pw\u2099 \u00b7 n = '+n;
            if(local<.44)return'w\u2099\u208a\u2081 = max(q\u2099, 0) \u00b7 n = '+n;
            if(local<.56)return'Continuation {q\u2099 > 0} \u00b7 '+positive+' sites';
            return'Walk continues only while q\u2099 > 0';
        }
        function paint(){
            ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0F0E13';ctx.fillRect(0,0,W0,H0);
            ctx.save();ctx.scale(W0/LOGICAL_W,H0/LOGICAL_H);
            nodes.forEach(function(v,i){const a=pos(i);v.nbr.forEach(function(j){if(j<i)return;const b=pos(j);
                ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle='rgba(201,191,168,.18)';ctx.lineWidth=1.5;ctx.stroke();});});
            sceneryLayer();
            /* the walk, the instrument's subject, is on screen within ten
               seconds of the cycle's start */
            const D=18,local=(elapsed%D)/D,
                  fade=local<.04?local/.04:(local>.96?(1-local)/.04:1),
                  n=Math.min(MAXH-1,Math.max(0,Math.floor(MAXH*ruleEase(local/.30)))),
                  threshold=ruleEase((local-.32)/.14),stats=fieldStats(n);
            ctx.globalAlpha=fade;thresholdField(n,threshold,1);
            if(local>=.42)continuationSet(n,ruleEase((local-.42)/.12)*.9);
            if(local>=.56)drawWalk(local);
            ctx.globalAlpha=1;ctx.restore();
            if(outH)outH.textContent=signed(stats.lo)+' \u2026 '+signed(stats.hi);
            if(outV)outV.textContent=stats.maxW.toFixed(3);
            if(note){note.textContent='';const s=document.createElement('span');s.className='nocase';s.textContent=phaseNote(local,n,stats.positive);note.appendChild(s);}
        }
        function sync(){
            $$('[data-rwrs-mu]').forEach(function(b){const on=Math.abs(parseFloat(b.dataset.rwrsMu)-mu)<1e-12;
                b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',String(on));});
            const b=$('[data-rwrs-run="pause"]');if(b){b.textContent=REDUCED?'Paused':running?'Pause':'Play';
                b.classList.toggle('is-on',running);b.setAttribute('aria-pressed',String(running));}
        }
        function frame(now){if(!running)return;if(!lastNow)lastNow=now;elapsed+=Math.min(40,now-lastNow)/1000;
            lastNow=now;paint();raf=requestAnimationFrame(frame);}
        function stop(){running=false;cancelAnimationFrame(raf);raf=0;lastNow=0;sync();}
        function start(){if(REDUCED||running||userPaused||!pageAwake)return;running=true;sync();raf=requestAnimationFrame(frame);}
        $$('[data-rwrs-mu]').forEach(function(b){b.addEventListener('click',function(){const v=parseFloat(b.dataset.rwrsMu);
            if(!isFinite(v)||v===mu)return;mu=v;rebuild();if(!userPaused)start();});});
        $$('[data-rwrs-run]').forEach(function(b){b.addEventListener('click',function(){const a=b.dataset.rwrsRun;
            if(a==='pause'){if(running){userPaused=true;stop();}else{userPaused=false;start();}}
            if(a==='replay'){stop();elapsed=0;userPaused=REDUCED;paint();if(!userPaused)start();}
            if(a==='new'){stop();buildSample((sampleSeed+0x9e3779b9)>>>0);elapsed=9.9;userPaused=REDUCED;paint();if(!userPaused)start();}
        });});
        rebuild();if(REDUCED)elapsed=9.8;paint();sync();if(!REDUCED)start();
        return{pause:function(){pageAwake=false;stop();},resume:function(){pageAwake=true;paint();if(!userPaused)start();}};
    };

    /* Two walks from the centre.  A 7-by-7 patch of Z^2 carries the integer
       harmonic function f(x,y) = 3x^2 - 3y^2 + x + 8y + 51 (values 0..86, every
       average exact).  Because f(o) is the average of its four neighbours, one
       neighbour is at least f(o) and one is at most f(o).  Stepping to the
       largest neighbour: o = (0,0) -> (0,1) -> (1,1) -> (2,1) -> (3,1), values
       51 <= 56 <= 60 <= 70 <= 86, the unique maximum on the patch.  Stepping to
       the smallest: (0,0) -> (0,-1) -> (0,-2) -> (0,-3), values 51 >= 40 >= 23
       >= 0, the unique minimum.  No step has a tie.  Both walks are computed
       here from f, not written down. */
    makers.uniqueintro = function () {
        const SP=80,OX=360,OY=286,RD=24,FONT='600 24px "IBM Plex Mono", ui-monospace, monospace',
              EQ='600 28px "IBM Plex Mono", ui-monospace, monospace',QUIET='500 20px "IBM Plex Mono", ui-monospace, monospace';
        function F(x,y){return 3*x*x-3*y*y+x+8*y+51;}
        function at(x,y){return[OX+SP*x,OY-SP*y];}
        const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        function greedy(sign){const path=[[0,0]];
            while(Math.max(Math.abs(path[path.length-1][0]),Math.abs(path[path.length-1][1]))<3){
                const u=path[path.length-1];let best=null,bv=-Infinity;
                dirs.forEach(function(d){const w=[u[0]+d[0],u[1]+d[1]],v=sign*F(w[0],w[1]);if(v>bv){bv=v;best=w;}});
                path.push(best);}
            return path;}
        const WALKS=[{path:greedy(1),col:RULE_VIS.cyan,rel:' ≤ '},{path:greedy(-1),col:RULE_VIS.rose,rel:' ≥ '}];
        const T_DEF=2.2,T_STEP=1.25,T_END=2.8,
              starts=[T_DEF,T_DEF+(WALKS[0].path.length-1)*T_STEP],
              DUR=starts[1]+(WALKS[1].path.length-1)*T_STEP+T_END;
        const oNb=dirs.map(function(d){return F(d[0],d[1]);});
        function indexOn(path,x,y,upto){for(let i=0;i<=upto&&i<path.length;i++)if(path[i][0]===x&&path[i][1]===y)return i;return-1;}
        return loopingRule('unique-continuation',DUR*1000,function(ctx,W,p){
            const t=p*DUR,done=t>=starts[1]+(WALKS[1].path.length-1)*T_STEP;
            /* progress of each walk: vertices reached, the running step and its phase */
            const prog=WALKS.map(function(wk,i){const S=wk.path.length-1,tt=t-starts[i];
                if(tt<0)return{reached:0,step:-1,local:0};
                if(tt>=S*T_STEP)return{reached:S,step:-1,local:0};
                const step=Math.floor(tt/T_STEP),local=(tt-step*T_STEP)/T_STEP;
                return{reached:step+(local>=.92?1:0),step:step,local:local};});
            /* the patch */
            ctx.strokeStyle=RULE_VIS.grid;ctx.lineWidth=5;ctx.beginPath();
            for(let x=-3;x<=3;x++){const a=at(x,-3),b=at(x,3);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}
            for(let y=-3;y<=3;y++){const a=at(-3,y),b=at(3,y);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}
            ctx.stroke();
            /* the definition beat: the four neighbours of o, then the largest and the smallest */
            const defA=t<T_DEF+.3?ruleEase(t/.4)*(t>T_DEF?1-(t-T_DEF)/.3:1):0,
                  pickA=t<T_DEF+.3?ruleEase((t-1.4)/.3)*(t>T_DEF?1-(t-T_DEF)/.3:1):0;
            if(defA>0){const o=at(0,0);dirs.forEach(function(d){const b=at(d[0],d[1]);ctx.beginPath();ctx.moveTo(o[0],o[1]);ctx.lineTo(b[0],b[1]);
                ctx.strokeStyle=RULE_VIS.quiet;ctx.lineWidth=6;ctx.globalAlpha=defA;ctx.stroke();ctx.globalAlpha=1;});}
            /* paths reached so far, and the moving segment */
            WALKS.forEach(function(wk,i){const pr=prog[i];
                if(pr.reached>0){ctx.beginPath();for(let q=0;q<=pr.reached;q++){const a=at(wk.path[q][0],wk.path[q][1]);if(q)ctx.lineTo(a[0],a[1]);else ctx.moveTo(a[0],a[1]);}
                    ctx.strokeStyle=wk.col;ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
                if(pr.step>=0&&pr.local>=.5&&pr.local<.92){const a=at(wk.path[pr.step][0],wk.path[pr.step][1]),b=at(wk.path[pr.step+1][0],wk.path[pr.step+1][1]),m=ruleEase((pr.local-.5)/.42);
                    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(ruleMix(a[0],b[0],m),ruleMix(a[1],b[1],m));ctx.strokeStyle=wk.col;ctx.lineWidth=9;ctx.stroke();}
                /* the comparison at the current vertex */
                if(pr.step>=0&&pr.local<.5){const u=wk.path[pr.step],cmp=ruleEase(pr.local/.25),a=at(u[0],u[1]);
                    dirs.forEach(function(d){const b=at(u[0]+d[0],u[1]+d[1]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
                        ctx.strokeStyle=RULE_VIS.quiet;ctx.lineWidth=6;ctx.globalAlpha=cmp;ctx.stroke();ctx.globalAlpha=1;});}
            });
            /* vertices */
            for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++){
                const q=at(x,y);let fill=RULE_VIS.white,text=RULE_VIS.ink;
                WALKS.forEach(function(wk,i){if(indexOn(wk.path,x,y,prog[i].reached)>0){fill=wk.col;text=RULE_VIS.white;}});
                if(x===0&&y===0)fill=RULE_VIS.yellow;
                ctx.beginPath();ctx.arc(q[0],q[1],RD,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
                ctx.strokeStyle=RULE_VIS.key;ctx.lineWidth=2.2;ctx.stroke();
                ctx.fillStyle=text;ctx.font=FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(F(x,y)),q[0],q[1]+1);
            }
            /* rings: the neighbour picked out, the walker, the endpoints */
            function ring(q,r,col,w,a){ctx.beginPath();ctx.arc(q[0],q[1],r,0,Math.PI*2);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=a;ctx.stroke();ctx.globalAlpha=1;}
            if(pickA>0)WALKS.forEach(function(wk){const w=wk.path[1];ring(at(w[0],w[1]),RD+8,wk.col,5,pickA);});
            WALKS.forEach(function(wk,i){const pr=prog[i],S=wk.path.length-1;
                if(pr.step>=0){const u=wk.path[pr.step],w=wk.path[pr.step+1],a=at(u[0],u[1]),b=at(w[0],w[1]);
                    if(pr.local>=.25&&pr.local<.5)ring(b,RD+8,wk.col,5,ruleEase((pr.local-.25)/.15));
                    const m=pr.local<.5?0:ruleEase((pr.local-.5)/.42);
                    ring([ruleMix(a[0],b[0],m),ruleMix(a[1],b[1],m)],RD+8,wk.col,5,1);}
                else if(t>=starts[i]&&pr.reached===S){const e=wk.path[S],q=at(e[0],e[1]),a=ruleEase((t-starts[i]-S*T_STEP)/.4);
                    ring(q,RD+8,wk.col,5,1);ring(q,RD+16,wk.col,3.5,a);}
            });
            const o=at(0,0);ctx.fillStyle=RULE_VIS.ink;ctx.font=FONT;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('o',o[0]+RD+8,o[1]-RD-2);
            /* text: the average at o, then the two running sequences */
            ctx.font=EQ;ctx.textBaseline='middle';
            if(t<T_DEF+.3){const left='('+oNb.join(' + ')+')',right=' / 4 = '+F(0,0),out=t>T_DEF?1-(t-T_DEF)/.3:1;
                const a1=ruleEase((t-.4)/.4),a2=ruleEase((t-.9)/.4),wl=ctx.measureText(left).width,wr=ctx.measureText(right).width,x0=360-(wl+wr)/2;
                ctx.textAlign='left';ctx.globalAlpha=a1*out;ctx.fillStyle=RULE_VIS.ink;ctx.fillText(left,x0,598);
                ctx.globalAlpha=a2*out;ctx.fillStyle=RULE_VIS.yellow;ctx.fillText(right,x0+wl,598);ctx.globalAlpha=1;}
            WALKS.forEach(function(wk,i){if(t<starts[i])return;const parts=[];for(let q=0;q<=prog[i].reached;q++)parts.push(String(F(wk.path[q][0],wk.path[q][1])));
                ctx.textAlign='center';ctx.globalAlpha=Math.min(1,(t-starts[i])/.3);ctx.fillStyle=wk.col;ctx.fillText(parts.join(wk.rel),360,i?640:598);ctx.globalAlpha=1;});
            ctx.fillStyle=RULE_VIS.quiet;ctx.font=QUIET;ctx.textAlign='center';
            ctx.fillText(done?'maximum and minimum are attained on the boundary':
                t<T_DEF?'f(o) = average of the four neighbours':t<starts[1]?'step to the largest neighbour':'step to the smallest neighbour',360,682);
        },.93);
    };

    /* ---- Unique continuation: harmonic functions with many zeros on the boundary ----

       Z^2, the triangular lattice and the honeycomb lattice, each with the
       origin o at a vertex, B_r its graph-metric ball and S_r the sphere.
       f lives on B_{2n+1} and is harmonic (unit conductances) at every vertex
       of B_{2n}; its boundary values on S = S_{2n+1} determine it through the
       exact Poisson kernel, obtained from a banded Cholesky factorization of
       the Dirichlet Laplacian and one back-solve per boundary vertex.

       Boundary values.  nu(b) = value at o of the harmonic function equal to 1
       at b and 0 elsewhere on the sphere (harmonic measure from o).  Each b
       gets an arc of length 2 pi nu(b); the arcs are laid clockwise from the
       topmost vertex, whose arc is centred at angle 0, and theta_b is the
       centre of b's arc.  f_k has boundary values H sin(k theta_b): they
       change sign 2k times around S, that is 2k zeros on the boundary.  By
       the left-right symmetry of each lattice the datum is odd and f_k(o) = 0.
       Parametrising by harmonic measure rather than by vertex count matters:
       with vertex count the corners of the polygonal sphere leak every mode
       into the slowest low modes and B_n keeps leaving {|f| <= 1}.

       The film raises the number of boundary zeros, k = 1..K with
       K = floor(1/(2 max nu)), the most the sphere resolves with two vertices
       per period everywhere, then loops.  The object is the zero set of f:
       the cell sides across which f changes sign, drawn as light curves, and
       the boundary zeros as dots on the sphere.  Every cell receives one of
       two fixed-luminance sign colours; there is no magnitude threshold and
       no third fill.  Readouts count the boundary zeros, the edges the zero
       set crosses, and the share of B_2n no zero curve touches. */
    makers.unique = function () {
        const canvas=$('#unique-canvas');if(!canvas)return null;
        const ctx=canvas.getContext('2d'),W0=canvas.width,H0=canvas.height,LW=864,LH=720;
        const outDensity=$('#unique-zero-density'),outInner=$('#unique-boundary'),outComps=$('#unique-components'),note=$('#unique-note');
        const H=100,S3=Math.sqrt(3);
        const LAT={
            square:{R:39,P:4,origin:[0,0],
                pos:function(a){return[a[0],a[1]];},
                nbrs:function(a){return[[a[0]+1,a[1]],[a[0]-1,a[1]],[a[0],a[1]+1],[a[0],a[1]-1]];},
                cell:function(a){return[[.5,.5],[-.5,.5],[-.5,-.5],[.5,-.5]];}},
            tri:{R:31,P:6,origin:[0,0],
                pos:function(a){return[a[0]*S3/2,a[0]/2+a[1]];},
                nbrs:function(a){const i=a[0],j=a[1];return[[i+1,j],[i-1,j],[i,j+1],[i,j-1],[i+1,j-1],[i-1,j+1]];},
                cell:function(a){const c=[];for(let t=0;t<6;t++)c.push([Math.cos(t*Math.PI/3)/S3,Math.sin(t*Math.PI/3)/S3]);return c;}},
            honey:{R:45,P:3,origin:[0,0,0],
                pos:function(a){return[a[1]*S3+a[2]*S3/2,1.5*a[2]+a[0]];},
                nbrs:function(a){const s=a[0],i=a[1],j=a[2];return s?[[0,i,j],[0,i,j+1],[0,i-1,j+1]]:[[1,i,j],[1,i,j-1],[1,i+1,j-1]];},
                cell:function(a){const base=a[0]?Math.PI/2:Math.PI/6,c=[];for(let t=0;t<3;t++)c.push([Math.cos(base+t*2*Math.PI/3),Math.sin(base+t*2*Math.PI/3)]);return c;}}
        };
        const built={};
        function build(key){
            if(built[key])return built[key];
            const L=LAT[key],R=L.R,n=(R-1)/2,verts=[],index=new Map();
            function add(a,dist){const k=a.join(',');if(index.has(k))return index.get(k);const p=L.pos(a);
                index.set(k,verts.length);verts.push({a:a,x:p[0],y:p[1],dist:dist});return verts.length-1;}
            add(L.origin,0);let shell=[0];
            for(let d=1;d<=R;d++){const next=[];shell.forEach(function(u){L.nbrs(verts[u].a).forEach(function(b){
                if(!index.has(b.join(',')))next.push(add(b,d));});});shell=next;}
            const N=verts.length,adj=[],edges=[];
            for(let u=0;u<N;u++)adj.push([]);
            for(let u=0;u<N;u++)L.nbrs(verts[u].a).forEach(function(b){const k=b.join(',');if(!index.has(k))return;
                const w=index.get(k);if(w>u){edges.push([u,w]);adj[u].push(w);adj[w].push(u);}});
            const interior=[],boundary=[],intIndex=new Int32Array(N).fill(-1);
            for(let u=0;u<N;u++)(verts[u].dist<R?interior:boundary).push(u);
            interior.sort(function(a,b){return verts[a].y-verts[b].y||verts[a].x-verts[b].x;});
            interior.forEach(function(u,q){intIndex[u]=q;});
            const M=interior.length,NB=boundary.length;
            let band=0;edges.forEach(function(e){if(intIndex[e[0]]>=0&&intIndex[e[1]]>=0)band=Math.max(band,Math.abs(intIndex[e[0]]-intIndex[e[1]]));});
            const BW=band+1,Lb=new Float64Array(M*BW);
            for(let q=0;q<M;q++){const u=interior[q];Lb[q*BW]=adj[u].length;adj[u].forEach(function(w){const p=intIndex[w];if(p>=0&&p<q)Lb[q*BW+(q-p)]=-1;});}
            for(let j=0;j<M;j++){const jlo=Math.max(0,j-band);let s=Lb[j*BW];
                for(let k=jlo;k<j;k++){const v=Lb[j*BW+(j-k)];s-=v*v;}
                const d=Math.sqrt(s);Lb[j*BW]=d;
                for(let i=j+1;i<=Math.min(M-1,j+band);i++){let t=Lb[i*BW+(i-j)];const klo=Math.max(jlo,i-band);
                    for(let k=klo;k<j;k++)t-=Lb[i*BW+(i-k)]*Lb[j*BW+(j-k)];Lb[i*BW+(i-j)]=t/d;}}
            const y=new Float64Array(M),x=new Float64Array(M),K=new Float64Array(M*NB);
            for(let col=0;col<NB;col++){
                y.fill(0);adj[boundary[col]].forEach(function(w){const p=intIndex[w];if(p>=0)y[p]+=1;});
                for(let i=0;i<M;i++){let s=y[i];const klo=Math.max(0,i-band);for(let k=klo;k<i;k++)s-=Lb[i*BW+(i-k)]*y[k];y[i]=s/Lb[i*BW];}
                for(let i=M-1;i>=0;i--){let s=y[i];const khi=Math.min(M-1,i+band);for(let k=i+1;k<=khi;k++)s-=Lb[k*BW+(k-i)]*x[k];x[i]=s/Lb[i*BW];}
                for(let q=0;q<M;q++)K[q*NB+col]=x[q];
            }
            /* clockwise order of the sphere from the topmost vertex; harmonic measure from o; arc centres */
            const order=boundary.map(function(u,c){return c;}).sort(function(a,b){
                const A=(Math.atan2(verts[boundary[a]].x,verts[boundary[a]].y)+2*Math.PI)%(2*Math.PI),
                      B=(Math.atan2(verts[boundary[b]].x,verts[boundary[b]].y)+2*Math.PI)%(2*Math.PI);return A-B;});
            const q0=intIndex[0],nu=new Float64Array(NB),theta=new Float64Array(NB);let nuMax=0,acc=0;
            for(let c=0;c<NB;c++){nu[c]=K[q0*NB+c];nuMax=Math.max(nuMax,nu[c]);}
            order.forEach(function(c){theta[c]=2*Math.PI*(acc+nu[c]/2-nu[order[0]]/2);acc+=nu[c];});
            const KMAX=Math.floor(1/(2*nuMax));
            let ballCount=0,innerCount=0;for(let u=0;u<N;u++){if(verts[u].dist<R)ballCount++;if(verts[u].dist<=n)innerCount++;}
            const bOrder=order.map(function(c){return boundary[c];});
            const modes=[],g=new Float64Array(NB);
            for(let k=1;k<=KMAX;k++){
                for(let c=0;c<NB;c++)g[c]=H*Math.sin(k*theta[c]);
                const f=new Float64Array(N);
                for(let q=0;q<M;q++){let s=0;const row=q*NB;for(let c=0;c<NB;c++)s+=K[row+c]*g[c];f[interior[q]]=s;}
                for(let c=0;c<NB;c++)f[boundary[c]]=g[c];
                modes.push({k:k,f:f});
            }
            /* stage geometry: fit the hull of S into a fixed box; cell corners in stage coordinates */
            let xmax=0,ymax=0;for(let u=0;u<N;u++){xmax=Math.max(xmax,Math.abs(verts[u].x));ymax=Math.max(ymax,Math.abs(verts[u].y));}
            const SC=Math.min(BOX_W/(2*xmax),BOX_H/(2*ymax)),P=L.P,corner=new Float32Array(N*P*2);
            for(let u=0;u<N;u++){const v=verts[u],cell=L.cell(v.a);
                for(let t=0;t<P;t++){corner[(u*P+t)*2]=CX+SC*(v.x+cell[t][0]);corner[(u*P+t)*2+1]=CY-SC*(v.y+cell[t][1]);}}
            /* nodal segments: the side shared by the two cells of each edge */
            const seg=new Float32Array(edges.length*4);
            edges.forEach(function(e,q){const u=e[0],w=e[1],hit=[];
                for(let i=0;i<P&&hit.length<2;i++)for(let j=0;j<P&&hit.length<2;j++){
                    const dx=corner[(u*P+i)*2]-corner[(w*P+j)*2],dy=corner[(u*P+i)*2+1]-corner[(w*P+j)*2+1];
                    if(dx*dx+dy*dy<1e-4)hit.push(i);}
                seg[q*4]=corner[(u*P+hit[0])*2];seg[q*4+1]=corner[(u*P+hit[0])*2+1];seg[q*4+2]=corner[(u*P+hit[1])*2];seg[q*4+3]=corner[(u*P+hit[1])*2+1];});
            const pts=boundary.map(function(u){return[CX+SC*verts[u].x,CY-SC*verts[u].y];}).sort(function(a,b){return a[0]-b[0]||a[1]-b[1];});
            function cross(o,a,b){return(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);}
            const lower=[],upper=[];
            pts.forEach(function(p){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);});
            for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
            lower.pop();upper.pop();const hull=lower.concat(upper);
            const ringN=[];for(let u=0;u<N;u++)if(verts[u].dist===n)ringN.push(u);
            ringN.sort(function(a,b){return Math.atan2(verts[a].x,verts[a].y)-Math.atan2(verts[b].x,verts[b].y);});
            /* the graph as a static layer */
            const wire=document.createElement('canvas');wire.width=W0;wire.height=H0;
            const c2=wire.getContext('2d');c2.scale(W0/LW,H0/LH);
            c2.beginPath();hull.forEach(function(p,q){if(q)c2.lineTo(p[0],p[1]);else c2.moveTo(p[0],p[1]);});c2.closePath();c2.clip();
            c2.beginPath();edges.forEach(function(e){const a=verts[e[0]],b=verts[e[1]];c2.moveTo(CX+SC*a.x,CY-SC*a.y);c2.lineTo(CX+SC*b.x,CY-SC*b.y);});
            c2.strokeStyle='rgba(15,14,19,.45)';c2.lineWidth=.6;c2.lineCap='round';c2.stroke();
            const G={key:key,R:R,n:n,N:N,verts:verts,adj:adj,edges:edges,seg:seg,ballCount:ballCount,innerCount:innerCount,NB:NB,modes:modes,KMAX:KMAX,bOrder:bOrder,
                     SC:SC,P:P,corner:corner,hull:hull,ringN:ringN,wire:wire,f:new Float64Array(N),sgn:new Int8Array(N)};
            G.schedule=makeSchedule(G);
            /* the still for reduced motion: the first k at which less than half of B_n is untouched by the zero set */
            G.kHalf=0;for(let i=0;i<modes.length;i++){G.f.set(modes[i].f);if(measure(G).untouchedInner/innerCount<.5){G.kHalf=modes[i].k;break;}}
            built[key]=G;return G;
        }

        /* ---- stage layout ---- */
        const BOX_W=816,BOX_H=664,CX=432,CY=360;
        /* fills by sign only, two fixed tones that sit under the zero curves */
        const BLUE='rgb(61,122,158)',PINK='rgb(154,70,89)',ZEROC='#F0E442';

        /* ---- the film: a schedule of held modes joined by convex combinations ---- */
        const T_IN=.4,T_SWEEP=19,T_HOLDK=1.6,T_OUT=.6;
        function makeSchedule(G){
            const K=G.KMAX,w=[];let sum=0;
            for(let k=1;k<=K;k++){w.push(1/(k+1.5));sum+=1/(k+1.5);}
            const states=[];let t=T_IN;
            for(let k=1;k<=K;k++){const base=T_SWEEP*w[k-1]/sum;
                let hold=.4*base,morph=.6*base;
                if(k===K){hold+=T_HOLDK;morph=0;}
                states.push({k:k,start:t,hold:hold,morph:morph});t+=hold+morph;}
            return{states:states,D:t+T_OUT};
        }
        let key='square',G=null,elapsed=0,lastNow=0,raf=0,running=false,pageAwake=true,userPaused=false;
        function frameState(t){
            const S=G.schedule,D=S.D,fade=t<T_IN?t/T_IN:(t>D-T_OUT?(D-t)/T_OUT:1);
            let i=0;while(i<S.states.length-1&&t>=S.states[i+1].start)i++;
            const st=S.states[i],m=st.morph>0?ruleEase((t-st.start-st.hold)/st.morph):0;
            return{fade:fade,i:i,m:m};
        }
        function compose(st){
            const f=G.f,N=G.N,A=G.modes[st.i].f,B=st.m>0?G.modes[st.i+1].f:null,wa=1-st.m;
            for(let u=0;u<N;u++){let v=wa*A[u];if(B)v+=st.m*B[u];f[u]=v;}
        }
        /* The zero set is represented only by sign-changing cell sides and
           boundary dots.  Exact zero values take the positive fill so the
           picture never introduces a third, threshold-dependent region. */
        function measure(G){
            const f=G.f,N=G.N,sgn=G.sgn,adj=G.adj,verts=G.verts,R=G.R,n=G.n;
            for(let u=0;u<N;u++)sgn[u]=f[u]>=0?1:-1;
            let crossed=0;G.edges.forEach(function(e){if(sgn[e[0]]*sgn[e[1]]<0)crossed++;});
            let untouched=0,untouchedInner=0;
            for(let u=0;u<N;u++){if(verts[u].dist>=R)continue;const list=adj[u];let clean=true;
                for(let q=0;q<list.length;q++)if(sgn[list[q]]!==sgn[u]){clean=false;break;}
                if(clean){untouched++;if(verts[u].dist<=n)untouchedInner++;}}
            const dots=[],B=G.bOrder,NB=B.length;
            for(let r=0;r<NB;r++){const u=B[r],w=B[(r+1)%NB];
                const a=f[u],b=f[w];
                if(a===0)dots.push([verts[u].x,verts[u].y]);
                else if(a*b<0){const q=Math.abs(a)/(Math.abs(a)+Math.abs(b));
                    dots.push([verts[u].x+(verts[w].x-verts[u].x)*q,
                               verts[u].y+(verts[w].y-verts[u].y)*q]);}}
            return{crossed:crossed,untouched:untouched,untouchedInner:untouchedInner,dots:dots};
        }
        function status(st,m){
            const k=G.modes[st.i].k,K=G.KMAX;
            if(st.m>0)return'zeros on the boundary '+(2*k)+' → '+(2*k+2);
            return(2*k)+' zeros on the boundary'+(k===K?', the most it resolves':'')+' · zero set crosses '+nf.format(m.crossed)+' edges · untouched: '+(100*m.untouched/G.ballCount).toFixed(1)+' % of B₂ₙ, '+(100*m.untouchedInner/G.innerCount).toFixed(1)+' % of Bₙ';
        }
        function paint(){
            const D=G.schedule.D,t=elapsed%D,st=frameState(t);
            compose(st);
            const m=measure(G),f=G.f,N=G.N,verts=G.verts,sgn=G.sgn,P=G.P,corner=G.corner;
            ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0F0E13';ctx.fillRect(0,0,W0,H0);
            ctx.save();ctx.scale(W0/LW,H0/LH);ctx.globalAlpha=st.fade;
            ctx.save();ctx.beginPath();G.hull.forEach(function(p,q){if(q)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();ctx.clip();
            [[1,BLUE],[-1,PINK]].forEach(function(pair){ctx.beginPath();let any=false;
                for(let u=0;u<N;u++){if(sgn[u]!==pair[0])continue;const o=u*P*2;
                    ctx.moveTo(corner[o],corner[o+1]);for(let q=1;q<P;q++)ctx.lineTo(corner[o+2*q],corner[o+2*q+1]);ctx.closePath();any=true;}
                if(any){ctx.fillStyle=pair[1];ctx.fill();}});
            ctx.restore();
            ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(G.wire,0,0);ctx.setTransform(W0/LW,0,0,H0/LH,0,0);
            /* the zero set: the side shared by two cells across which f changes sign */
            ctx.save();ctx.beginPath();G.hull.forEach(function(p,q){if(q)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();ctx.clip();
            const E=G.edges,seg=G.seg;ctx.beginPath();
            for(let q=0;q<E.length;q++){if(sgn[E[q][0]]*sgn[E[q][1]]>=0)continue;ctx.moveTo(seg[q*4],seg[q*4+1]);ctx.lineTo(seg[q*4+2],seg[q*4+3]);}
            ctx.strokeStyle='rgba(15,14,19,.85)';ctx.lineWidth=5.2;ctx.lineCap='round';ctx.stroke();
            ctx.strokeStyle=ZEROC;ctx.lineWidth=3;ctx.stroke();
            ctx.restore();
            /* S_n, the boundary of B_n */
            ctx.beginPath();G.ringN.forEach(function(u,q){const v=verts[u],X=CX+G.SC*v.x,Y=CY-G.SC*v.y;if(q)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);});ctx.closePath();
            ctx.setLineDash([7,5]);ctx.strokeStyle='rgba(15,14,19,.8)';ctx.lineWidth=4;ctx.stroke();
            ctx.strokeStyle='rgba(246,241,230,.85)';ctx.lineWidth=1.6;ctx.stroke();ctx.setLineDash([]);
            /* the boundary zeros */
            ctx.beginPath();m.dots.forEach(function(d){const X=CX+G.SC*d[0],Y=CY-G.SC*d[1];ctx.moveTo(X+5,Y);ctx.arc(X,Y,5,0,Math.PI*2);});
            ctx.fillStyle=ZEROC;ctx.fill();ctx.strokeStyle='#0F0E13';ctx.lineWidth=1.6;ctx.stroke();
            ctx.restore();
            const k=G.modes[st.i].k;
            if(outDensity)outDensity.textContent=st.m>0?(2*k)+' → '+(2*k+2):String(2*k);
            if(outInner)outInner.textContent=nf.format(m.crossed);
            if(outComps)outComps.textContent=(100*m.untouched/G.ballCount).toFixed(1)+'% · '+(100*m.untouchedInner/G.innerCount).toFixed(1)+'%';
            if(note){note.textContent='';const sp=document.createElement('span');sp.className='nocase';sp.textContent=status(st,m);note.appendChild(sp);}
        }
        function sync(){
            $$('[data-unique-graph]').forEach(function(b){const on=b.dataset.uniqueGraph===key;
                b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',String(on));});
            const b=$('[data-unique-run="pause"]');if(b){b.textContent=REDUCED?'Paused':running?'Pause':'Play';
                b.classList.toggle('is-on',running);b.setAttribute('aria-pressed',String(running));}
        }
        function stillTime(g){const st=g.schedule.states[(g.kHalf||g.KMAX)-1];return st.start+st.hold*.5;}
        /* choosing a graph restarts its film from two zeros on the boundary, as Replay does */
        function select(k){if(!LAT[k])return;key=k;G=build(k);lastNow=0;elapsed=REDUCED?stillTime(G):0;paint();sync();}
        function frame(now){if(!running)return;if(!lastNow)lastNow=now;elapsed+=Math.min(40,now-lastNow)/1000;
            lastNow=now;paint();raf=requestAnimationFrame(frame);}
        function stop(){running=false;cancelAnimationFrame(raf);raf=0;lastNow=0;sync();}
        function start(){if(REDUCED||running||userPaused||!pageAwake)return;running=true;sync();raf=requestAnimationFrame(frame);}
        /* Next adds one pair of boundary zeros and holds there; Play resumes the sweep from that count */
        function skip(){const S=G.schedule,D=S.D,t=elapsed%D,loop=Math.floor(elapsed/D);
            let i=0;while(i<S.states.length-1&&t>=S.states[i+1].start)i++;
            elapsed=loop*D+S.states[Math.min(i+1,S.states.length-1)].start+.01;}
        $$('[data-unique-graph]').forEach(function(b){b.addEventListener('click',function(){select(b.dataset.uniqueGraph);if(!userPaused)start();});});
        $$('[data-unique-run]').forEach(function(b){b.addEventListener('click',function(){const a=b.dataset.uniqueRun;
            if(a==='pause'){if(running){userPaused=true;stop();}else{userPaused=false;start();}}
            if(a==='replay'){stop();elapsed=0;userPaused=REDUCED;paint();if(!userPaused)start();}
            if(a==='next'){skip();userPaused=true;stop();paint();}
        });});
        select(key);if(!REDUCED)start();
        /* prepare the other graphs while this one plays, so that a switch is immediate */
        setTimeout(function(){build('tri');},700);setTimeout(function(){build('honey');},1400);
        return{pause:function(){pageAwake=false;stop();},resume:function(){pageAwake=true;paint();if(!userPaused)start();}};
    };

    /* ---- Positive-Hurst self-similar incompressible flow ----

       This is deliberately a finite numerical model, separate from the
       critical log-correlated experiment above.  The stream function is a
       fixed five-octave trigonometric polynomial

           psi_gamma(x) = sum_k a_k sin(w_k x_1+p_k) sin(w_k x_2+q_k),
           a_k = A w_k^(-1-gamma).

       Hence b = (partial_2 psi, -partial_1 psi) is analytic and exactly
       divergence free.  The displayed path is one Euler--Maruyama path for
       dX_t = b(X_t)dt + sqrt(2 kappa)dW_t with kappa > 0.  It is not recycled
       or joined to another path when it leaves a camera window: the camera
       is computed from the bounds of the one stored trajectory. */
    makers.algebraicsd = function () {
        const canvas = $('#algebraic-sd-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W0 = canvas.width, H0 = canvas.height;
        const LOGICAL = 720, OCTAVES = 5, DT = .0045, KAPPA = .045;
        const SQ = Math.sqrt(2 * KAPPA * DT), STEPS = 24, STORE_EVERY = 7;
        const PHASE_X = [.31, 1.47, 2.28, 4.01, 5.18];
        const PHASE_Y = [1.09, 2.76, .58, 3.34, 4.63];
        const outExponent = $('#algebraic-sd-exponent');
        const outScale = $('#algebraic-sd-scale');
        const note = $('#algebraic-sd-note');

        let gamma = .10, view = 'flow', time = 0, x = 1.8, y = -.7;
        let seed = 0x7a31c4e9, spare = null, steps = 0, trail = [];
        let minX = x, maxX = x, minY = y, maxY = y;
        let camera = { x: x, y: y, h: 7 };
        let raf = 0, running = false, pageAwake = true, userPaused = false;
        let lastNow = 0;

        function random() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function normal() {
            if (spare !== null) { const z = spare; spare = null; return z; }
            const r = Math.sqrt(-2 * Math.log(Math.max(1e-12, random())));
            const a = 2 * Math.PI * random();
            spare = r * Math.sin(a);
            return r * Math.cos(a);
        }
        function frequency(k) { return (2 * Math.PI / 24) * (1 << k); }
        function stream(x0, y0) {
            let z = 0;
            for (let k = 0; k < OCTAVES; k++) {
                const w = frequency(k), a = .62 * Math.pow(w, -1 - gamma);
                z += a * Math.sin(w * x0 + PHASE_X[k])
                       * Math.sin(w * y0 + PHASE_Y[k]);
            }
            return z;
        }
        function drift(x0, y0) {
            let bx = 0, by = 0;
            for (let k = 0; k < OCTAVES; k++) {
                const w = frequency(k), a = .62 * Math.pow(w, -gamma);
                const sx = Math.sin(w * x0 + PHASE_X[k]);
                const cx = Math.cos(w * x0 + PHASE_X[k]);
                const sy = Math.sin(w * y0 + PHASE_Y[k]);
                const cy = Math.cos(w * y0 + PHASE_Y[k]);
                bx += a * sx * cy;       // partial_2 psi
                by -= a * cx * sy;       // -partial_1 psi
            }
            return [bx, by];
        }
        function record() {
            trail.push([x, y]);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            /* Eight minutes at 60 Hz fit before this bound is reached.  If a
               study is left open longer, retain a uniformly decimated path
               rather than silently starting another trajectory. */
            if (trail.length > 100000) {
                const keep = [];
                for (let i = 0; i < trail.length; i += 2) keep.push(trail[i]);
                keep.push(trail[trail.length - 1]); trail = keep;
                minX = maxX = trail[0][0]; minY = maxY = trail[0][1];
                trail.forEach(function (p) {
                    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
                    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
                });
            }
        }
        function advance(n) {
            for (let i = 0; i < n; i++) {
                const b = drift(x, y);
                x += b[0] * DT + SQ * normal();
                y += b[1] * DT + SQ * normal();
                time += DT; steps++;
                if (steps % STORE_EVERY === 0) record();
            }
        }
        function reset() {
            time = 0; x = 1.8; y = -.7; steps = 0;
            seed = (0x7a31c4e9 ^ Math.round(gamma * 1000)) >>> 0; spare = null;
            trail = [[x, y]]; minX = maxX = x; minY = maxY = y;
            camera = { x: x, y: y, h: 7 };
            if (REDUCED) advance(9000);
            paint(); sync();
        }
        function updateCamera() {
            const tx = (minX + maxX) / 2, ty = (minY + maxY) / 2;
            const targetH = Math.max(7, .63 * Math.max(maxX - minX, maxY - minY) + 2.2);
            camera.x += .075 * (tx - camera.x);
            camera.y += .075 * (ty - camera.y);
            const needed = 1.15 * Math.max(Math.abs(minX - camera.x), Math.abs(maxX - camera.x),
                                           Math.abs(minY - camera.y), Math.abs(maxY - camera.y));
            /* The window only opens.  A particle cannot leave it because the
               exact trajectory bounds enter this lower bound every frame. */
            camera.h = Math.max(camera.h, needed + 1.2,
                camera.h + .075 * (targetH - camera.h));
        }
        function screen(x0, y0) {
            const s = LOGICAL * .455 / camera.h;
            return [LOGICAL / 2 + (x0 - camera.x) * s,
                    LOGICAL / 2 - (y0 - camera.y) * s];
        }
        function drawContours() {
            const GRID = 61, span = 2 * camera.h, step = span / GRID;
            const x0 = camera.x - camera.h, y0 = camera.y - camera.h;
            const z = new Float64Array((GRID + 1) * (GRID + 1));
            let absMax = 0;
            for (let j = 0; j <= GRID; j++) for (let i = 0; i <= GRID; i++) {
                const v = stream(x0 + i * step, y0 + j * step);
                z[j * (GRID + 1) + i] = v; absMax = Math.max(absMax, Math.abs(v));
            }
            const levels = [-.72, -.36, 0, .36, .72].map(function (q) { return q * absMax; });
            levels.forEach(function (level, li) {
                ctx.beginPath();
                for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
                    const ids = [j*(GRID+1)+i, j*(GRID+1)+i+1,
                                 (j+1)*(GRID+1)+i+1, (j+1)*(GRID+1)+i];
                    const px = [x0+i*step, x0+(i+1)*step, x0+(i+1)*step, x0+i*step];
                    const py = [y0+j*step, y0+j*step, y0+(j+1)*step, y0+(j+1)*step];
                    const cuts = [];
                    for (let e = 0; e < 4; e++) {
                        const f = (e + 1) & 3, a = z[ids[e]] - level, b = z[ids[f]] - level;
                        if ((a <= 0 && b > 0) || (a > 0 && b <= 0)) {
                            const q = a / (a - b);
                            cuts.push(screen(ruleMix(px[e], px[f], q), ruleMix(py[e], py[f], q)));
                        }
                    }
                    for (let e = 0; e + 1 < cuts.length; e += 2) {
                        ctx.moveTo(cuts[e][0], cuts[e][1]);
                        ctx.lineTo(cuts[e + 1][0], cuts[e + 1][1]);
                    }
                }
                /* two hues by the sign of the stream function, lighter at
                   the larger level: the field is a quiet ground for the path */
                const colours = ['rgba(204,121,167,.55)', 'rgba(204,121,167,.40)',
                                 'rgba(242,237,226,.38)', 'rgba(86,180,233,.40)',
                                 'rgba(86,180,233,.55)'];
                ctx.strokeStyle = colours[li];
                ctx.lineWidth = view === 'flow' ? .8 : .6;
                ctx.stroke();
            });
        }
        function drawPath() {
            if (trail.length < 2) return;
            ctx.beginPath();
            let q = screen(trail[0][0], trail[0][1]); ctx.moveTo(q[0], q[1]);
            for (let i = 1; i < trail.length; i++) {
                q = screen(trail[i][0], trail[i][1]); ctx.lineTo(q[0], q[1]);
            }
            ctx.strokeStyle = '#F5A623'; ctx.lineWidth = 1.3;
            ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
            q = screen(x, y);
            ctx.beginPath(); ctx.arc(q[0], q[1], 5.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#F6F1E6'; ctx.fill();
            ctx.strokeStyle = '#15131A'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        function drawScalingReference() {
            if (view !== 'scaling') return;
            const exponent = 1 / (2 - gamma), ox = 470, oy = 640, w = 200, h = 140;
            ctx.fillStyle = 'rgba(15,14,19,.88)'; ctx.fillRect(ox - 62, oy - h - 24, w + 92, h + 66);
            ctx.beginPath(); ctx.moveTo(ox, oy - h); ctx.lineTo(ox, oy); ctx.lineTo(ox + w, oy);
            ctx.strokeStyle = 'rgba(242,237,226,.58)'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + w, oy - h * exponent / .65);
            ctx.strokeStyle = '#F0E442'; ctx.lineWidth = 1.6; ctx.stroke();
            const u = Math.min(1, Math.log1p(time) / Math.log(180));
            const px = ox + w * u, py = oy - h * exponent / .65 * u;
            ctx.beginPath(); ctx.arc(px, py, 4.2, 0, 2 * Math.PI);
            ctx.fillStyle = '#F0E442'; ctx.fill();
            ctx.fillStyle = 'rgba(242,237,226,.72)';
            ctx.font = '500 13px ui-monospace, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('log t', ox + w / 2, oy + 8);
            ctx.save(); ctx.translate(ox - 14, oy - h / 2); ctx.rotate(-Math.PI / 2);
            ctx.textBaseline = 'bottom'; ctx.fillText('log |X|', 0, 0); ctx.restore();
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#F0E442';
            ctx.fillText('slope 1/(2\u2212\u03b3)', ox + 8, oy - h + 14);
        }
        function report() {
            const exponent = 1 / (2 - gamma);
            if (outExponent) outExponent.textContent = '1/(2−γ) = ' + exponent.toFixed(3);
            if (outScale) outScale.textContent = 'five frequencies; κ = ' + KAPPA.toFixed(3);
            setNote(note, '\u03b3 = ' + gamma.toFixed(2) + ' \u00b7 one path \u00b7 t = ' + Math.floor(time));
        }
        function paint() {
            updateCamera();
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W0,H0);
            ctx.save(); ctx.scale(W0 / LOGICAL, H0 / LOGICAL);
            drawContours(); drawPath(); drawScalingReference(); ctx.restore();
            report();
        }
        function sync() {
            $$('[data-algebraic-gamma]').forEach(function (b) {
                const on = Math.abs(parseFloat(b.dataset.algebraicGamma) - gamma) < 1e-12;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-algebraic-view]').forEach(function (b) {
                const on = b.dataset.algebraicView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-algebraic-run="pause"]');
            if (b) {
                b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running));
            }
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const rate = Math.max(.5, Math.min(1.4, (now - lastNow) / 16.67)); lastNow = now;
            advance(Math.max(1, Math.round(STEPS * rate))); paint();
            raf = requestAnimationFrame(frame);
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0; sync(); }
        function start() {
            if (REDUCED || running || userPaused || !pageAwake) return;
            running = true; sync(); raf = requestAnimationFrame(frame);
        }
        $$('[data-algebraic-gamma]').forEach(function (b) {
            b.addEventListener('click', function () {
                const g = parseFloat(b.dataset.algebraicGamma);
                if (!(g > 0) || g === gamma) return;
                stop(); gamma = g; reset(); if (!userPaused) start();
            });
        });
        $$('[data-algebraic-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.algebraicView; paint(); sync();
            });
        });
        $$('[data-algebraic-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.algebraicRun;
                if (a === 'pause') {
                    if (running) { userPaused = true; stop(); }
                    else { userPaused = false; start(); }
                }
                if (a === 'replay') {
                    stop(); userPaused = REDUCED; reset(); if (!userPaused) start();
                }
            });
        });
        reset(); if (!REDUCED) start();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; paint(); if (!userPaused) start(); }
        };
    };

    /* ---- Internal DLA on the exact finite mated-CRT graph ---- */
    makers.matedidla = function () {
        const canvas = $('#mcrt-idla-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
        const note = $('#mcrt-idla-note'), outParticles = $('#mcrt-idla-particles');
        const outSteps = $('#mcrt-idla-steps'), outRadius = $('#mcrt-idla-radius');
        const MAP_BUTTONS = $$('[data-mcrt-idla-map]');
        /* settled cells take the site's attachment ramp by settlement order,
           as the key under the stage says */
        const ORDER_RAMP = rampOf([[111,94,224], [204,121,167], [150,205,240], [255,248,232]]);
        const EDGE_RATE = 110, SPAWN_HOLD = .10, LOOP_HOLD = 2.2;
        /* the first walks are slow enough to be followed edge by edge; the
           pace then rises to the rate that fills the cluster */
        function edgeRate() {
            return particles < 20 ? 9 : particles < 60 ? 9 + (particles - 20) / 40 * (EDGE_RATE - 9) : EDGE_RATE;
        }
        const ghost = document.createElement('canvas'); ghost.width = W; ghost.height = H;
        const ghostCtx = ghost.getContext('2d');

        let DATA = null, G = null, key = 'sqrt2', mesh = null, ready = false;
        let occupied, order, distance, centres, target = 0, particles = 0, steps = 0;
        let radius = 0, active = null, spawnClock = 0, doneAt = 0, ghostAlpha = 0;
        let runSeed = 0x617e3b29, seed = runSeed;
        let raf = 0, running = false, pageAwake = true, userPaused = false, lastNow = 0;

        function random() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function cellPath(c, i) {
            const raw = G.cells[i]; if (!raw || !raw.length) return false;
            const pieces = typeof raw[0] === 'number' ? [raw] : raw;
            c.beginPath();
            for (let q = 0; q < pieces.length; q++) {
                const p = pieces[q]; if (!p || p.length < 6) continue;
                c.moveTo(p[0] * W / 960, p[1] * H / 960);
                for (let k = 2; k < p.length; k += 2)
                    c.lineTo(p[k] * W / 960, p[k + 1] * H / 960);
                c.closePath();
            }
            return true;
        }
        function buildGeometry() {
            const n = G.n;
            centres = new Array(n);
            for (let i = 0; i < n; i++) {
                const raw = G.cells[i];
                const pieces = typeof raw[0] === 'number' ? [raw] : raw;
                let x = 0, y = 0, m = 0;
                for (let q = 0; q < pieces.length; q++) {
                    const p = pieces[q];
                    for (let k = 0; k + 1 < p.length; k += 2) {
                        x += p[k]; y += p[k + 1]; m++;
                    }
                }
                centres[i] = m
                    ? [x / m * W / 960, y / m * H / 960]
                    : [G.xy[i][0] * W / 960, G.xy[i][1] * H / 960];
            }
            distance = new Int16Array(n); distance.fill(-1); distance[G.source] = 0;
            const q = new Int32Array(n); let head = 0, tail = 1; q[0] = G.source;
            while (head < tail) {
                const v = q[head++];
                for (let k = G.off[v]; k < G.off[v + 1]; k++) {
                    const u = G.nbr[k];
                    if (distance[u] < 0) { distance[u] = distance[v] + 1; q[tail++] = u; }
                }
            }
        }
        function colour(i) {
            const j = Math.max(0, Math.min(255, Math.round(255 * order[i] / Math.max(1, target - 1)))) * 3;
            return 'rgb(' + ORDER_RAMP[j] + ',' + ORDER_RAMP[j + 1] + ',' + ORDER_RAMP[j + 2] + ')';
        }
        function resetState() {
            occupied = new Uint8Array(G.n); order = new Int16Array(G.n); order.fill(-1);
            particles = 0; steps = 0; radius = 0; active = null; spawnClock = 0; doneAt = 0;
            seed = runSeed; target = Math.min(360, Math.max(180, Math.floor(.18 * G.n)));
            settle(G.source);             // the first particle starts and settles at the source
            if (!REDUCED) beginParticle();
        }
        function settle(v) {
            if (occupied[v]) return;
            occupied[v] = 1; order[v] = particles; particles++;
            radius = Math.max(radius, distance[v]);
            active = null; spawnClock = SPAWN_HOLD;
            if (particles >= target) doneAt = performance.now();
        }
        function chooseEdge() {
            if (!active) return;
            const lo = G.off[active.at], hi = G.off[active.at + 1];
            if (hi <= lo) { active = null; return; }
            active.from = active.at;
            active.to = G.nbr[lo + Math.floor(random() * (hi - lo))];
            active.u = 0;
        }
        function beginParticle() {
            if (particles >= target) return;
            active = { at: G.source, from: G.source, to: G.source, u: 0,
                       path: [G.source] };
            spawnClock = SPAWN_HOLD;
        }
        function finishEdge() {
            active.at = active.to; active.path.push(active.at); steps++;
            if (!occupied[active.at]) { settle(active.at); return; }
            chooseEdge();
        }
        function advance(dt) {
            if (particles >= target) return;
            if (!active) {
                spawnClock -= dt;
                if (spawnClock <= 0) beginParticle();
                return;
            }
            if (spawnClock > 0) {
                spawnClock -= dt;
                if (spawnClock <= 0) chooseEdge();
                return;
            }
            active.u += dt * edgeRate();
            /* dt is capped below so this loop normally executes once.  It is
               kept exact for a delayed frame: every traversed graph edge is
               still appended to the visible walk before the next is chosen. */
            while (active && active.u >= 1) {
                active.u -= 1; finishEdge();
            }
        }
        function finishStatic() {
            while (particles < target) {
                let v = G.source;
                while (occupied[v]) {
                    const lo = G.off[v], hi = G.off[v + 1];
                    if (hi <= lo) break;
                    v = G.nbr[lo + Math.floor(random() * (hi - lo))]; steps++;
                }
                if (!occupied[v]) settle(v); else break;
            }
            active = null; doneAt = performance.now();
        }
        function activePoint() {
            if (!active) return null;
            const a = centres[active.from], b = centres[active.to];
            return [ruleMix(a[0], b[0], ruleClamp(active.u)),
                    ruleMix(a[1], b[1], ruleClamp(active.u))];
        }
        function paint() {
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W,H);
            if (!ready || !G) {
                if (note) note.textContent = 'Loading exact finite graph';
                return;
            }
            if (mesh) {
                ctx.globalAlpha = .34;
                ctx.drawImage(mesh, 0, 0, W, H);
                ctx.globalAlpha = 1;
            }
            for (let i = 0; i < G.n; i++) if (occupied[i] && cellPath(ctx, i)) {
                ctx.fillStyle = colour(i); ctx.fill();
                ctx.strokeStyle = 'rgba(8,7,11,.76)';
                ctx.lineWidth = 1.15; ctx.stroke();
            }
            /* Vertices not incident to a bounded face have no cell to fill.
               Draw only the occupied ones, at their actual Tutte position. */
            for (let i = 0; i < G.n; i++) if (occupied[i] && (!G.cells[i] || !G.cells[i].length)) {
                const p = centres[i];
                ctx.beginPath(); ctx.arc(p[0], p[1], 2.6 * W / 960, 0, 2 * Math.PI);
                ctx.fillStyle = colour(i); ctx.fill();
            }
            if (active && active.path.length) {
                const first = Math.max(0, active.path.length - 100);
                ctx.beginPath(); let p = centres[active.path[first]]; ctx.moveTo(p[0], p[1]);
                for (let k = first + 1; k < active.path.length; k++) {
                    p = centres[active.path[k]]; ctx.lineTo(p[0], p[1]);
                }
                p = activePoint(); if (p) ctx.lineTo(p[0], p[1]);
                ctx.strokeStyle = 'rgba(246,241,230,.72)'; ctx.lineWidth = Math.max(1.1, W / 960);
                ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
                if (p) {
                    ctx.beginPath(); ctx.arc(p[0], p[1], 6.2 * W / 960, 0, 2 * Math.PI);
                    ctx.fillStyle = '#F6F1E6'; ctx.fill();
                    ctx.strokeStyle = '#15131A'; ctx.lineWidth = 1.6; ctx.stroke();
                }
            }
            const s = centres[G.source];
            ctx.beginPath(); ctx.arc(s[0], s[1], 8 * W / 960, 0, 2 * Math.PI);
            ctx.strokeStyle = '#F0E442'; ctx.lineWidth = 2 * W / 960; ctx.stroke();
            if (ghostAlpha > 0) {
                ctx.globalAlpha = ghostAlpha; ctx.drawImage(ghost, 0, 0); ctx.globalAlpha = 1;
            }
            report();
        }
        function report() {
            if (outParticles) outParticles.textContent = nf.format(particles) + ' / ' + nf.format(target);
            if (outSteps) outSteps.textContent = nf.format(steps);
            if (outRadius) outRadius.textContent = String(radius);
            if (note) {
                if (particles >= target) note.textContent = 'Complete';
                else if (active && spawnClock <= 0) note.textContent = 'Particle ' + (particles + 1) + ' \u00b7 walking';
                else note.textContent = 'Particle ' + (particles + 1) + ' \u00b7 at the source';
            }
        }
        function captureGhost() {
            ghostCtx.setTransform(1,0,0,1,0,0); ghostCtx.clearRect(0,0,W,H);
            ghostCtx.drawImage(canvas, 0, 0); ghostAlpha = 1;
        }
        function restart(useGhost) {
            if (!ready) return;
            if (useGhost) captureGhost(); else ghostAlpha = 0;
            resetState();
            if (REDUCED) { finishStatic(); ghostAlpha = 0; }
            paint(); sync();
        }
        function selectMap(k) {
            if (!DATA || !DATA[k]) return;
            captureGhost(); key = k; G = DATA[k]; buildGeometry(); resetState();
            if (REDUCED) { finishStatic(); ghostAlpha = 0; }
            paint(); sync();
        }
        function sync() {
            MAP_BUTTONS.forEach(function (b) {
                const on = b.dataset.mcrtIdlaMap === key;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
                b.disabled = !ready;
            });
            const b = $('[data-mcrt-idla-run="pause"]');
            if (b) {
                b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running));
                b.disabled = !ready || REDUCED;
            }
            $$('[data-mcrt-idla-run]').forEach(function (x) { if (!x.dataset.mcrtIdlaRun.match(/pause/)) x.disabled = !ready; });
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const dt = Math.min(.018, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
            if (ghostAlpha > 0) ghostAlpha = Math.max(0, ghostAlpha - dt / 1.15);
            if (particles < target) advance(dt);
            else if (now - doneAt > LOOP_HOLD * 1000) {
                runSeed = (runSeed + 0x9e3779b9) >>> 0; restart(true);
            }
            paint(); raf = requestAnimationFrame(frame);
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0; sync(); }
        function start() {
            if (REDUCED || running || userPaused || !pageAwake || !ready) return;
            running = true; sync(); raf = requestAnimationFrame(frame);
        }

        Promise.all([
            fetch((window.galleryAssets && window.galleryAssets.mcrtRun)
                || 'plates/p-mcrt-run.json').then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
                }),
            loadImage((window.galleryAssets && window.galleryAssets.mcrtMeshSqrt2)
                || 'plates/p-mcrt-mesh-sqrt2-void.png')
        ]).then(function (got) {
                DATA = got[0]; mesh = got[1];
                Object.keys(DATA).forEach(function (k) {
                    const g = DATA[k];
                    g.off = Int32Array.from(g.off); g.nbr = Int32Array.from(g.nbr);
                });
                key = DATA[key] ? key : Object.keys(DATA)[0]; G = DATA[key]; ready = true;
                buildGeometry(); restart(false); if (!REDUCED) start();
            }).catch(function (err) {
                console.warn('mated-CRT internal DLA:', err);
                if (note) note.textContent = 'Could not load finite graph';
            });
        MAP_BUTTONS.forEach(function (b) {
            b.addEventListener('click', function () { if (b.dataset.mcrtIdlaMap !== key) selectMap(b.dataset.mcrtIdlaMap); });
        });
        $$('[data-mcrt-idla-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.mcrtIdlaRun;
                if (a === 'pause') {
                    if (running) { userPaused = true; stop(); }
                    else { userPaused = false; start(); }
                }
                if (a === 'replay') {
                    stop(); userPaused = REDUCED; restart(true); if (!userPaused) start();
                }
                if (a === 'new') {
                    stop(); runSeed = (runSeed + 0x9e3779b9) >>> 0;
                    userPaused = REDUCED; restart(true); if (!userPaused) start();
                }
            });
        });
        paint(); sync();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; paint(); if (!userPaused) start(); }
        };
    };

    /* ---- A finite weighted-grid obstacle problem ----

       Capacities are a fixed positive five-scale density.  Every recorded
       frame below is the state immediately after a legal toppling: an
       unstable site retains its capacity and sends one quarter of its excess
       across each lattice edge; shares crossing the square boundary are
       dissipated.  This deterministic grid is an obstacle-model
       illustration, not a sampled Liouville quantum gravity surface. */
    makers.lqgball = function () {
        const canvas = $('#lqg-ball-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W0 = canvas.width, H0 = canvas.height;
        const LOGICAL = 720, N = 31, NN = N * N, EPS = 1e-6, src = ((N / 2) | 0) * N + ((N / 2) | 0);
        const note = $('#lqg-ball-note'), outCells = $('#lqg-ball-cells');
        const outError = $('#lqg-ball-error');
        const fractions = [.25, .5, .75], capacity = new Float64Array(NN);
        let totalCapacity = 0;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const xx = (x + .5) / N, yy = (y + .5) / N; let f = 0;
            for (let k = 0; k < 5; k++) {
                const w = 1 << k;
                f += Math.pow(2, -.28 * k)
                    * Math.sin(2 * Math.PI * w * xx + .73 * k)
                    * Math.sin(2 * Math.PI * w * yy + 1.17 * k);
            }
            capacity[y * N + x] = Math.exp(.50 * f); totalCapacity += capacity[y * N + x];
        }
        const meanCapacity = totalCapacity / NN;
        totalCapacity = 0;
        for (let i = 0; i < NN; i++) { capacity[i] /= meanCapacity; totalCapacity += capacity[i]; }

        let fraction = .5, view = 'mass', solutions = {}, solution = null;
        let elapsed = 0, raf = 0, running = false, pageAwake = true, userPaused = false, lastNow = 0;

        function solve(frac) {
            const mass = new Float64Array(NN), odo = new Float64Array(NN);
            const inQueue = new Uint8Array(NN), first = new Int32Array(NN); first.fill(-1);
            const q = new Int32Array(NN + 1); let head = 0, tail = 0;
            let firstCount = 0, topplings = 0, loss = 0;
            const snaps = [];
            mass[src] = frac * totalCapacity;
            q[tail++] = src; inQueue[src] = 1;
            function snapshot() {
                snaps.push({ mass: Float32Array.from(mass), odo: Float32Array.from(odo),
                             cells: firstCount, topplings: topplings });
            }
            snapshot();
            while (head !== tail) {
                const i = q[head]; head = (head + 1) % q.length; inQueue[i] = 0;
                const excess = mass[i] - capacity[i];
                if (excess <= EPS) continue;
                mass[i] = capacity[i]; odo[i] += excess * .25; topplings++;
                if (first[i] < 0) { first[i] = firstCount++; }
                const x = i % N, y = (i / N) | 0, share = excess * .25;
                const neighbours = [x > 0 ? i - 1 : -1, x + 1 < N ? i + 1 : -1,
                                    y > 0 ? i - N : -1, y + 1 < N ? i + N : -1];
                for (let k = 0; k < 4; k++) {
                    const j = neighbours[k];
                    if (j < 0) { loss += share; continue; }
                    mass[j] += share;
                    if (mass[j] > capacity[j] + EPS && !inQueue[j]) {
                        q[tail] = j; tail = (tail + 1) % q.length; inQueue[j] = 1;
                    }
                }
                if ((firstCount === 1 || (firstCount > 1 && firstCount % 5 === 0)) &&
                    (!snaps.length || snaps[snaps.length - 1].cells !== firstCount)) snapshot();
            }
            snapshot();
            let maxOdo = 0, maxError = 0;
            for (let i = 0; i < NN; i++) {
                maxOdo = Math.max(maxOdo, odo[i]);
                maxError = Math.max(maxError, mass[i] - capacity[i]);
            }
            return { snaps: snaps, first: first, finalMass: mass, finalOdo: odo,
                     firstCount: firstCount, topplings: topplings, loss: loss,
                     maxOdo: maxOdo, maxError: maxError };
        }
        fractions.forEach(function (f) { solutions[String(f)] = solve(f); });

        function mixColour(a, b, t) {
            const z = ruleClamp(t);
            return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * z) + ','
                + Math.round(a[1] + (b[1] - a[1]) * z) + ','
                + Math.round(a[2] + (b[2] - a[2]) * z) + ')';
        }
        function stateAt() {
            const initial = solution.snaps[0], final = solution.snaps[solution.snaps.length - 1];
            if (REDUCED) return { snap: final, phase: 1, local: 1, overlay: null, overlayAlpha: 0 };
            const D = 11, local = (elapsed % D) / D;
            if (local >= .92) {
                return { snap: initial, phase: 1, local: local, overlay: final,
                         overlayAlpha: 1 - ruleEase((local - .92) / .08) };
            }
            const phase = local < .82 ? ruleEase(local / .82) : 1;
            const i = Math.min(solution.snaps.length - 1, Math.floor(phase * (solution.snaps.length - 1)));
            return { snap: solution.snaps[i], phase: phase, local: local,
                     overlay: null, overlayAlpha: 0 };
        }
        function paint() {
            const state = stateAt(), snap = state.snap, pad = 36, cell = (LOGICAL - 2 * pad) / N;
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W0,H0);
            ctx.save(); ctx.scale(W0 / LOGICAL, H0 / LOGICAL);
            function drawCells(s, alpha, front) {
                ctx.save(); ctx.globalAlpha = alpha;
                for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                    const i = y * N + x, cap = capacity[i];
                    let z, fill;
                    if (view === 'mass') {
                        z = Math.sqrt(Math.max(0, s.mass[i] / cap));
                        fill = z < .02 ? mixColour([22,20,29],[62,55,78], Math.min(1, cap / 2.4))
                                       : mixColour([55,67,91],[168,216,232], z);
                    } else {
                        z = Math.log1p(s.odo[i]) / Math.log1p(solution.maxOdo || 1);
                        fill = z < .005 ? mixColour([22,20,29],[58,48,72], Math.min(1, cap / 2.4))
                                        : (z < .55 ? mixColour([40,76,104],[86,180,233], z / .55)
                                                   : mixColour([86,180,233],[255,248,232], (z - .55) / .45));
                    }
                    ctx.fillStyle = fill; ctx.fillRect(pad + x * cell, pad + y * cell, cell + .2, cell + .2);
                    if (front && solution.first[i] >= 0 && solution.first[i] < s.cells &&
                        solution.first[i] >= Math.max(0, s.cells - 16)) {
                        const age = (s.cells - 1 - solution.first[i]) / 16;
                        ctx.strokeStyle = 'rgba(240,228,66,' + (.9 * (1 - age)).toFixed(3) + ')';
                        ctx.lineWidth = 1.2; ctx.strokeRect(pad + x * cell + 1, pad + y * cell + 1, cell - 2, cell - 2);
                    }
                }
                ctx.restore();
            }
            drawCells(snap, 1, !state.overlay);
            if (state.overlay) drawCells(state.overlay, state.overlayAlpha, false);
            const sx = pad + ((N / 2) | 0) * cell + cell / 2;
            const sy = sx;
            ctx.beginPath(); ctx.moveTo(sx - 5, sy); ctx.lineTo(sx + 5, sy);
            ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 5);
            ctx.strokeStyle = 'rgba(15,14,19,.85)'; ctx.lineWidth = 3.4; ctx.stroke();
            ctx.strokeStyle = '#F0E442'; ctx.lineWidth = 1.6; ctx.stroke();
            ctx.restore();

            const reportSnap = state.overlay && state.overlayAlpha > .5 ? state.overlay : snap;
            if (outCells) outCells.textContent = nf.format(reportSnap.cells) + ' / ' + nf.format(solution.firstCount);
            if (outError) {
                let err = 0;
                for (let i = 0; i < NN; i++) err = Math.max(err, reportSnap.mass[i] - capacity[i]);
                const v = reportSnap === solution.snaps[solution.snaps.length - 1] ? solution.maxError : err;
                outError.textContent = v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1)
                    : v >= .01 ? v.toFixed(2) : v.toExponential(1);
            }
            if (note) {
                note.textContent = state.overlay ? 'Replay'
                    : state.phase < .98 ? 'Legal topplings' : 'Stable';
            }
        }
        function sync() {
            $$('[data-lqg-mass]').forEach(function (b) {
                const on = Math.abs(parseFloat(b.dataset.lqgMass) - fraction) < 1e-12;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            $$('[data-lqg-view]').forEach(function (b) {
                const on = b.dataset.lqgView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-lqg-run="pause"]');
            if (b) {
                b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running));
            }
        }
        function selectMass(f) {
            const k = String(f); if (!solutions[k]) return;
            fraction = f; solution = solutions[k]; elapsed = 0; paint(); sync();
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            elapsed += Math.min(40, now - lastNow) / 1000; lastNow = now;
            paint(); raf = requestAnimationFrame(frame);
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0; sync(); }
        function start() {
            if (REDUCED || running || userPaused || !pageAwake) return;
            running = true; sync(); raf = requestAnimationFrame(frame);
        }
        $$('[data-lqg-mass]').forEach(function (b) {
            b.addEventListener('click', function () {
                const f = parseFloat(b.dataset.lqgMass); if (!solutions[String(f)]) return;
                selectMass(f); if (!userPaused) start();
            });
        });
        $$('[data-lqg-view]').forEach(function (b) {
            b.addEventListener('click', function () { view = b.dataset.lqgView; paint(); sync(); });
        });
        $$('[data-lqg-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.lqgRun;
                if (a === 'pause') {
                    if (running) { userPaused = true; stop(); }
                    else { userPaused = false; start(); }
                }
                if (a === 'replay') {
                    stop(); elapsed = 0; userPaused = REDUCED; paint(); if (!userPaused) start();
                }
            });
        });
        selectMass(.5); if (REDUCED) elapsed = 10; paint(); sync(); if (!REDUCED) start();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; paint(); if (!userPaused) start(); }
        };
    };

    /* ---- Exact self-similarity during parallel toppling ----

       For d=2, N=64 and j=16, each outer 16-by-16 corner of C_64 is the
       corresponding quadrant of C_32 translated by 16 in each absolute
       coordinate.  Both piles start at height four and use synchronous legal
       topplings.  The arrays are compared as integers after every round up to
       tau_16=241, the first round at which the smaller boundary odometer
       reaches 16. */
    makers.dimredscale = function () {
        const canvas = $('#dimred-scale-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W0 = canvas.width, H0 = canvas.height;
        const LW = 720, LH = 600, BIG = 64, SMALL = 32, J = 16, TAU = 241;
        const outRound = $('#dimred-scale-round'), outMismatch = $('#dimred-scale-mismatch');
        const outSites = $('#dimred-scale-sites'), note = $('#dimred-scale-note');
        const corners = [[0,0,0,0], [48,0,16,0], [0,48,0,16], [48,48,16,16]];
        /* the same luminance ladder as the cube instrument above; cream is the
           firing set, pink is reserved for a mismatch */
        const heightColour = ['#15131A','#1b2434','#263651','#31506f','#4d86ad'];
        let big, small, roundNo = 0, view = 'firing', raf = 0, lastNow = 0;
        let accumulator = 0, hold = 0, running = false, pageAwake = true;
        let userPaused = false;

        function makeState(n) {
            const h = new Int16Array(n * n); h.fill(4);
            return { n: n, h: h, odo: new Uint16Array(n * n),
                     fire: new Uint8Array(n * n), glow: new Uint8Array(n * n), count: 0 };
        }
        function topple(s) {
            const n = s.n, h = s.h, fire = s.fire; s.glow.set(fire); fire.fill(0); s.count = 0;
            for (let i = 0; i < h.length; i++) if (h[i] >= 4) {
                fire[i] = 1; s.count++;
            }
            for (let i = 0; i < h.length; i++) if (fire[i]) {
                const x = i % n, y = (i / n) | 0;
                h[i] -= 4; s.odo[i]++;
                if (x) h[i - 1]++;
                if (x + 1 < n) h[i + 1]++;
                if (y) h[i - n]++;
                if (y + 1 < n) h[i + n]++;
            }
        }
        function step() {
            if (roundNo >= TAU) return;
            topple(big); topple(small); roundNo++;
        }
        function mismatch() {
            let bad = 0;
            corners.forEach(function (c) {
                for (let y = 0; y < J; y++) for (let x = 0; x < J; x++) {
                    const a = (c[1] + y) * BIG + c[0] + x;
                    const b = (c[3] + y) * SMALL + c[2] + x;
                    const av = view === 'firing' ? big.fire[a] : big.odo[a];
                    const bv = view === 'firing' ? small.fire[b] : small.odo[b];
                    if (av !== bv) bad++;
                }
            });
            return bad;
        }
        function smallIndexAt(x, y) {
            for (let k = 0; k < corners.length; k++) {
                const c = corners[k];
                if (x >= c[0] && x < c[0] + J && y >= c[1] && y < c[1] + J)
                    return (c[3] + y - c[1]) * SMALL + c[2] + x - c[0];
            }
            return -1;
        }
        function odoColour(v, top) {
            const z = Math.log1p(v) / Math.log1p(Math.max(1, top));
            if (z < .5) return ruleMixColor('#1C2330', '#397F9A', z * 2);
            return ruleMixColor('#397F9A', '#F0E442', (z - .5) * 2);
        }
        function paint() {
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W0,H0);
            ctx.save(); ctx.scale(W0 / LW, H0 / LH);
            const side = 512, cell = side / BIG, ox = (LW - side) / 2, oy = 40;
            let top = 1;
            if (view === 'odometer') for (let i = 0; i < big.odo.length; i++) top = Math.max(top, big.odo[i]);
            for (let y = 0; y < BIG; y++) for (let x = 0; x < BIG; x++) {
                const i = y * BIG + x, j = smallIndexAt(x, y);
                let fill = view === 'firing'
                    ? (big.fire[i] ? '#F6F1E6'
                        : big.glow[i] ? '#8aa5bf'
                        : heightColour[Math.max(0, Math.min(4, big.h[i]))])
                    : odoColour(big.odo[i], top);
                if (j >= 0) {
                    const a = view === 'firing' ? big.fire[i] : big.odo[i];
                    const b = view === 'firing' ? small.fire[j] : small.odo[j];
                    if (a !== b) fill = '#D55E77';
                }
                ctx.fillStyle = fill;
                ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
            }
            corners.forEach(function (c) {
                const x = ox + c[0] * cell, y = oy + c[1] * cell, s = J * cell;
                ctx.strokeStyle = 'rgba(246,241,230,.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + .75, y + .75, s - 1.5, s - 1.5);
                ctx.strokeStyle = '#F0E442'; ctx.lineWidth = 1; ctx.strokeRect(x + 3.5, y + 3.5, s - 7, s - 7);
            });
            ctx.strokeStyle = 'rgba(242,237,226,.32)'; ctx.lineWidth = 1.5;
            ctx.strokeRect(ox, oy, side, side);
            ctx.restore();

            const bad = mismatch();
            if (outRound) outRound.textContent = nf.format(roundNo) + ' / ' + nf.format(TAU);
            if (outMismatch) outMismatch.textContent = nf.format(bad);
            if (outSites) outSites.textContent = '1,024';
            if (note) note.textContent = roundNo < TAU
                ? (view === 'firing' ? 'Same firing set in every marked corner'
                                     : 'Same odometer in every marked corner')
                : 'Reached the theorem time τ₁₆';
        }
        function reset() {
            big = makeState(BIG); small = makeState(SMALL); roundNo = 0;
            accumulator = 0; hold = 0;
            if (REDUCED) while (roundNo < TAU) step();
            paint(); sync();
        }
        function sync() {
            $$('[data-dimred-scale-view]').forEach(function (b) {
                const on = b.dataset.dimredScaleView === view;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-dimred-scale-run="pause"]');
            if (b) {
                b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running));
            }
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const dt = Math.min(50, now - lastNow); lastNow = now;
            if (roundNo < TAU) {
                accumulator += dt;
                while (accumulator >= 85 && roundNo < TAU) { accumulator -= 85; step(); }
            } else {
                hold += dt;
                if (hold >= 2400) reset();
            }
            paint(); raf = requestAnimationFrame(frame);
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0; sync(); }
        function start() {
            if (REDUCED || running || userPaused || !pageAwake) return;
            running = true; sync(); raf = requestAnimationFrame(frame);
        }
        $$('[data-dimred-scale-view]').forEach(function (b) {
            b.addEventListener('click', function () {
                view = b.dataset.dimredScaleView; paint(); sync();
            });
        });
        $$('[data-dimred-scale-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.dimredScaleRun;
                if (a === 'pause') {
                    if (running) { userPaused = true; stop(); }
                    else { userPaused = false; start(); }
                } else if (a === 'replay') {
                    stop(); userPaused = REDUCED; reset(); if (!userPaused) start();
                }
            });
        });
        reset(); if (!REDUCED) start();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; paint(); if (!userPaused) start(); }
        };
    };

    /* ---- The finite cell-crossing argument for explosive sandpiles ----

       In d=2 the background is eta in {2,3}.  Every horizontal line in Q_k
       is sampled with at least one height-three site.  One frozen line below
       the box topples once.  The next line receives one grain everywhere;
       one height-three site is therefore unstable, and legal topplings from
       that seed propagate along the line.  Repeating the same construction
       crosses the box.  The animation executes that legal schedule rather
       than drawing a geometric front unrelated to topplings. */
    makers.explosionproof = function () {
        const canvas = $('#explosion-proof-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W0 = canvas.width, H0 = canvas.height;
        const LW = 720, LH = 520, N = 19, NN = N * N;
        const note = $('#explosion-proof-note'), outRows = $('#explosion-proof-rows');
        const outSites = $('#explosion-proof-sites'), outLegal = $('#explosion-proof-legal');
        let density = .32, runSeed = 0x42c9a731, seed = runSeed;
        let background, heights, toppled, lastTopple, rowSeed;
        let row = 0, order = [], orderAt = 0, topplings = 0, lastBefore = 4;
        let sourceHold = 650, hold = 0, raf = 0, lastNow = 0, accumulator = 0;
        let running = false, pageAwake = true, userPaused = false, valid = true;

        function random() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        function makeSample() {
            seed = (runSeed ^ Math.round(density * 1000)) >>> 0;
            background = new Uint8Array(NN); rowSeed = new Int16Array(N);
            for (let y = 0; y < N; y++) {
                let high = [];
                /* Rejection sampling gives the Bernoulli row conditioned on
                   the cell event, rather than planting an extra favourable
                   site into a failed row. */
                while (!high.length) {
                    high = [];
                    for (let x = 0; x < N; x++) {
                        const z = random() < density ? 3 : 2;
                        background[y * N + x] = z;
                        if (z === 3) high.push(x);
                    }
                }
                high.sort(function (a, b) { return Math.abs(a - (N - 1) / 2) - Math.abs(b - (N - 1) / 2); });
                rowSeed[y] = high[0];
            }
        }
        function scheduleRow() {
            order = []; orderAt = 0;
            if (row >= N) return;
            const s = rowSeed[row]; order.push(row * N + s);
            for (let x = s - 1; x >= 0; x--) order.push(row * N + x);
            for (let x = s + 1; x < N; x++) order.push(row * N + x);
        }
        function resetDynamics() {
            heights = Int16Array.from(background); toppled = new Uint8Array(NN);
            lastTopple = new Int32Array(NN); lastTopple.fill(-1000);
            /* The frozen line y=-1 has fired once, so Q_k's bottom line has
               received exactly one grain at every site. */
            for (let x = 0; x < N; x++) heights[x]++;
            row = 0; topplings = 0; lastBefore = 4; sourceHold = REDUCED ? 0 : 650;
            hold = 0; accumulator = 0; valid = true; scheduleRow();
            if (REDUCED) while (row < N && valid) toppleNext();
            paint(); sync();
        }
        function toppleNext() {
            if (row >= N || !valid) return false;
            if (orderAt >= order.length) {
                row++; scheduleRow();
                if (row >= N) return false;
            }
            const i = order[orderAt++], x = i % N, y = (i / N) | 0;
            lastBefore = heights[i];
            if (lastBefore < 4 || toppled[i]) { valid = false; return false; }
            heights[i] -= 4; toppled[i] = 1; lastTopple[i] = topplings; topplings++;
            if (x) heights[i - 1]++;
            if (x + 1 < N) heights[i + 1]++;
            if (y) heights[i - N]++;
            if (y + 1 < N) heights[i + N]++;
            if (orderAt >= order.length) { row++; scheduleRow(); }
            return true;
        }
        function paint() {
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W0,H0);
            ctx.save(); ctx.scale(W0 / LW, H0 / LH);
            const side = 466, cell = side / N, ox = (LW - side) / 2, oy = 24;
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                const i = y * N + x, py = oy + (N - 1 - y) * cell;
                let fill = background[i] === 3 ? '#397F9A' : '#292938';
                /* toppled rows go quiet: the current line is the bright thing */
                if (toppled[i]) fill = ruleMixColor('#2c4d78', '#6b3f5a', y / (N - 1));
                ctx.fillStyle = fill;
                ctx.fillRect(ox + x * cell + .55, py + .55, cell - 1.1, cell - 1.1);
                if (!toppled[i] && background[i] === 3) {
                    ctx.beginPath(); ctx.arc(ox + (x + .5) * cell, py + cell * .5, 2.3, 0, Math.PI * 2);
                    ctx.fillStyle = '#F6F1E6'; ctx.fill();
                }
                const age = topplings - 1 - lastTopple[i];
                if (age >= 0 && age < 13) {
                    ctx.strokeStyle = 'rgba(246,241,230,' + (1 - age / 13).toFixed(3) + ')';
                    ctx.lineWidth = 1.7;
                    ctx.strokeRect(ox + x * cell + 2, py + 2, cell - 4, cell - 4);
                }
            }
            ctx.strokeStyle = 'rgba(242,237,226,.34)'; ctx.lineWidth = 1.5;
            ctx.strokeRect(ox, oy, side, side);

            /* The fixed source line is part of the cell problem, not an
               expanding decoration.  Short vertical strokes show its one
               input grain to every site of the first line. */
            const sourceY = oy + side + 18;
            ctx.strokeStyle = 'rgba(240,228,66,.6)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ox, sourceY); ctx.lineTo(ox + side, sourceY); ctx.stroke();
            ctx.strokeStyle = 'rgba(240,228,66,.3)'; ctx.lineWidth = 1;
            for (let x = 0; x < N; x++) {
                const px = ox + (x + .5) * cell;
                ctx.beginPath(); ctx.moveTo(px, sourceY - 2); ctx.lineTo(px, oy + side + 1); ctx.stroke();
            }
            if (row < N) {
                const py = oy + (N - 1 - row) * cell;
                ctx.strokeStyle = '#F6F1E6'; ctx.lineWidth = 2;
                ctx.strokeRect(ox + 1, py + 1, side - 2, cell - 2);
            }
            ctx.restore();

            if (outRows) outRows.textContent = nf.format(Math.min(N, row)) + ' / ' + N;
            if (outSites) outSites.textContent = nf.format(topplings) + ' / ' + nf.format(NN);
            if (outLegal) outLegal.textContent = valid ? 'yes · height ' + lastBefore : 'no';
            if (note) {
                if (sourceHold > 0) note.textContent = 'The frozen line sends one grain to every site above it';
                else if (!valid) note.textContent = 'Schedule error';
                else if (row >= N) note.textContent = 'Every site of Qₖ has toppled once';
                else if (orderAt <= 1) note.textContent = 'A height-three site starts the next line';
                else note.textContent = 'Legal topplings propagate along the line';
            }
        }
        function sync() {
            $$('[data-explosion-density]').forEach(function (b) {
                const on = Math.abs(parseFloat(b.dataset.explosionDensity) - density) < 1e-12;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-explosion-proof-run="pause"]');
            if (b) {
                b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running));
            }
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            const dt = Math.min(50, now - lastNow); lastNow = now;
            if (sourceHold > 0) sourceHold -= dt;
            else if (row < N && valid) {
                accumulator += dt;
                while (accumulator >= 27 && row < N && valid) {
                    accumulator -= 27; toppleNext();
                }
            } else {
                hold += dt;
                if (hold >= 2200) resetDynamics();
            }
            paint(); raf = requestAnimationFrame(frame);
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0; sync(); }
        function start() {
            if (REDUCED || running || userPaused || !pageAwake) return;
            running = true; sync(); raf = requestAnimationFrame(frame);
        }
        $$('[data-explosion-density]').forEach(function (b) {
            b.addEventListener('click', function () {
                const d = parseFloat(b.dataset.explosionDensity); if (!(d > 0) || d === density) return;
                stop(); density = d; makeSample(); resetDynamics(); if (!userPaused) start();
            });
        });
        $$('[data-explosion-proof-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.explosionProofRun;
                if (a === 'pause') {
                    if (running) { userPaused = true; stop(); }
                    else { userPaused = false; start(); }
                } else if (a === 'replay') {
                    stop(); userPaused = REDUCED; resetDynamics(); if (!userPaused) start();
                } else if (a === 'new') {
                    stop(); runSeed = (runSeed + 0x9e3779b9) >>> 0; makeSample();
                    userPaused = REDUCED; resetDynamics(); if (!userPaused) start();
                }
            });
        });
        makeSample(); resetDynamics(); if (!REDUCED) start();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; paint(); if (!userPaused) start(); }
        };
    };

    /* ---- Percolation rigidity: the width-four resistance gadget ----

       T_n is the open subgraph [1,4]x{1} union [2,3]x[1,n].  Unit edge
       resistances give R_1=3 and R_(n+1)=(3R_n+2)/(R_n+1).  Writing
       R_n=A_(n+1)/B_n in lowest terms, integer harmonicity and
       u(a)=B_n u(t)/A_(n+1) force every nonzero terminal gap to have size at
       least A_(n+1)>3^(n-1).  The node values below solve the displayed
       Dirichlet problem directly for each n. */
    makers.percgadget = function () {
        const canvas = $('#perc-gadget-canvas');
        if (!canvas) return null;
        const ctx = canvas.getContext('2d'), W0 = canvas.width, H0 = canvas.height;
        const LW = 720, LH = 540, MAX_N = 8, STEP_MS = 1050, HOLD_MS = 2300;
        const outN = $('#perc-gadget-n'), outR = $('#perc-gadget-resistance');
        const outGap = $('#perc-gadget-gap'), note = $('#perc-gadget-note');
        const A = [1,1], B = [0,1];
        for (let n = 2; n <= MAX_N + 1; n++) A[n] = 4 * A[n - 1] - A[n - 2];
        for (let n = 2; n <= MAX_N; n++) B[n] = 4 * B[n - 1] - B[n - 2];
        const graphs = {};
        let mode = 'integer', elapsed = 0, raf = 0, lastNow = 0;
        let running = false, pageAwake = true, userPaused = false;

        function solveLinear(matrix, rhs) {
            const n = rhs.length, a = matrix.map(function (r, i) { return r.slice().concat(rhs[i]); });
            for (let c = 0; c < n; c++) {
                let pivot = c;
                for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
                const tmp = a[c]; a[c] = a[pivot]; a[pivot] = tmp;
                const q = a[c][c];
                for (let k = c; k <= n; k++) a[c][k] /= q;
                for (let r = 0; r < n; r++) if (r !== c && Math.abs(a[r][c]) > 1e-14) {
                    const f = a[r][c];
                    for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
                }
            }
            return a.map(function (r) { return r[n]; });
        }
        function buildGraph(n) {
            const nodes = [], byKey = {};
            function add(x, y) {
                const i = nodes.length; nodes.push({ x: x, y: y, key: x + ',' + y, nbr: [] });
                byKey[x + ',' + y] = i;
            }
            for (let x = 1; x <= 4; x++) add(x, 1);
            for (let y = 2; y <= n; y++) { add(2, y); add(3, y); }
            const edges = [];
            nodes.forEach(function (v, i) {
                [[1,0],[0,1]].forEach(function (d) {
                    const j = byKey[(v.x + d[0]) + ',' + (v.y + d[1])];
                    if (j === undefined) return;
                    v.nbr.push(j); nodes[j].nbr.push(i); edges.push([i,j]);
                });
            });
            const s = byKey['1,1'], t = byKey['4,1'];
            const unknown = nodes.map(function (_, i) { return i; }).filter(function (i) { return i !== s && i !== t; });
            const rowOf = {}; unknown.forEach(function (i, r) { rowOf[i] = r; });
            const matrix = unknown.map(function () { return new Array(unknown.length).fill(0); });
            const rhs = new Array(unknown.length).fill(0);
            unknown.forEach(function (i, r) {
                matrix[r][r] = nodes[i].nbr.length;
                nodes[i].nbr.forEach(function (j) {
                    if (j === t) rhs[r] += 1;
                    else if (j !== s) matrix[r][rowOf[j]] -= 1;
                });
            });
            const sol = solveLinear(matrix, rhs), values = new Float64Array(nodes.length);
            values[s] = 0; values[t] = 1;
            unknown.forEach(function (i, r) { values[i] = sol[r]; });
            return { n: n, nodes: nodes, edges: edges, byKey: byKey, values: values, s: s, t: t };
        }
        for (let n = 1; n <= MAX_N; n++) graphs[n] = buildGraph(n);

        /* the ladder fills the stage while it is short and packs as it grows */
        function pitchFor(n) { return Math.min(90, 380 / Math.max(1, n - 1)); }
        let pitch = pitchFor(1), baseY = 452;
        function position(v) { return [105 + (v.x - 1) * 170, baseY - (v.y - 1) * pitch]; }
        function frameState() {
            if (REDUCED) return { a: MAX_N, b: MAX_N, q: 1, shown: MAX_N };
            const growDuration = (MAX_N - 1) * STEP_MS;
            const local = elapsed % (growDuration + HOLD_MS);
            if (local >= growDuration) return { a: MAX_N, b: MAX_N, q: 1, shown: MAX_N };
            const a = 1 + Math.floor(local / STEP_MS), b = Math.min(MAX_N, a + 1);
            const q = ruleEase(((local % STEP_MS) / STEP_MS - .18) / .68);
            return { a: a, b: b, q: q, shown: q > .55 ? b : a };
        }
        /* pink at the grounded terminal through cream to blue at the source:
           yellow is left to the boundary vertices of the instrument above */
        function colour(z) {
            if (z < .5) return ruleMixColor('#D55E77', '#F6F1E6', z * 2);
            return ruleMixColor('#F6F1E6', '#56B4E9', (z - .5) * 2);
        }
        function paint() {
            const state = frameState(), ga = graphs[state.a], gb = graphs[state.b];
            const labelGraph = graphs[state.shown], labelScale = A[state.shown + 1];
            pitch = ruleMix(pitchFor(state.a), pitchFor(state.b), state.q);
            /* the ladder is centred on the stage while it is short */
            const height = ruleMix((state.a - 1) * pitchFor(state.a), (state.b - 1) * pitchFor(state.b), state.q);
            baseY = Math.min(452, LH / 2 + height / 2 + 30);
            ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#0F0E13'; ctx.fillRect(0,0,W0,H0);
            ctx.save(); ctx.scale(W0 / LW, H0 / LH);

            gb.edges.forEach(function (e) {
                const va = gb.nodes[e[0]], vb = gb.nodes[e[1]];
                const isNew = va.y > ga.n || vb.y > ga.n;
                const p = position(va), q = position(vb);
                ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]);
                ctx.strokeStyle = isNew ? 'rgba(246,241,230,' + (.18 + .68 * state.q).toFixed(3) + ')'
                                        : 'rgba(201,191,168,.56)';
                ctx.lineWidth = isNew ? 3 : 2.4; ctx.stroke();
            });
            gb.nodes.forEach(function (v, i) {
                const oldIndex = ga.byKey[v.key], isNew = oldIndex === undefined;
                const z0 = isNew ? gb.values[i] : ga.values[oldIndex];
                const z = ruleMix(z0, gb.values[i], state.q), alpha = isNew ? state.q : 1;
                const p = position(v);
                ctx.globalAlpha = .18 + .82 * alpha;
                ctx.beginPath(); ctx.arc(p[0], p[1], (i === gb.s || i === gb.t) ? 17 : 14, 0, 2 * Math.PI);
                ctx.fillStyle = colour(z); ctx.fill();
                ctx.strokeStyle = (i === gb.s || i === gb.t) ? '#F6F1E6' : '#15131A';
                ctx.lineWidth = (i === gb.s || i === gb.t) ? 2.5 : 1.5; ctx.stroke();
                const labelIndex = labelGraph.byKey[v.key];
                if (mode === 'integer' && alpha > .72 && labelIndex !== undefined) {
                    const label = String(Math.round(labelGraph.values[labelIndex] * labelScale));
                    const cssW = canvas.getBoundingClientRect().width || 720;
                    const narrow = cssW < 480, mag = Math.max(1, Math.min(2, 700 / cssW));
                    ctx.font = '700 ' + Math.round(11 * mag) + 'px ui-monospace, monospace';
                    ctx.textBaseline = 'middle';
                    /* a number that no longer fits its disc sits beside it; on a
                       phone every number does, set large enough to read */
                    if (narrow || ctx.measureText(label).width > 22) {
                        ctx.fillStyle = '#E8E2D0';
                        if (v.y === 1) { ctx.textAlign = 'center'; ctx.fillText(label, p[0], p[1] + 30); }
                        else if (v.x <= 2) { ctx.textAlign = 'right'; ctx.fillText(label, p[0] - 20, p[1]); }
                        else { ctx.textAlign = 'left'; ctx.fillText(label, p[0] + 20, p[1]); }
                    } else {
                        ctx.font = '700 11px ui-monospace, monospace';
                        ctx.fillStyle = '#0F0E13'; ctx.textAlign = 'center';
                        ctx.fillText(label, p[0], p[1] + .5);
                    }
                }
                ctx.globalAlpha = 1;
            });
            ctx.restore();

            const n = state.shown;
            if (outN) outN.textContent = String(n);
            if (outR) outR.textContent = A[n + 1] + ' / ' + B[n];
            if (outGap) outGap.textContent = A[n + 1] + '  >  3^' + (n - 1);
            if (note) note.textContent = mode === 'integer'
                ? 'Integer values force denominator cancellation'
                : 'Dirichlet voltage: h(s)=0 and h(t)=1';
        }
        function sync() {
            $$('[data-perc-gadget-mode]').forEach(function (b) {
                const on = b.dataset.percGadgetMode === mode;
                b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
            });
            const b = $('[data-perc-gadget-run="pause"]');
            if (b) {
                b.textContent = REDUCED ? 'Paused' : (running ? 'Pause' : 'Play');
                b.classList.toggle('is-on', running); b.setAttribute('aria-pressed', String(running));
            }
        }
        function frame(now) {
            if (!running) return;
            if (!lastNow) lastNow = now;
            elapsed += Math.min(50, now - lastNow); lastNow = now;
            paint(); raf = requestAnimationFrame(frame);
        }
        function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastNow = 0; sync(); }
        function start() {
            if (REDUCED || running || userPaused || !pageAwake) return;
            running = true; sync(); raf = requestAnimationFrame(frame);
        }
        $$('[data-perc-gadget-mode]').forEach(function (b) {
            b.addEventListener('click', function () {
                mode = b.dataset.percGadgetMode; paint(); sync();
            });
        });
        $$('[data-perc-gadget-run]').forEach(function (b) {
            b.addEventListener('click', function () {
                const a = b.dataset.percGadgetRun;
                if (a === 'pause') {
                    if (running) { userPaused = true; stop(); }
                    else { userPaused = false; start(); }
                } else if (a === 'replay') {
                    stop(); elapsed = REDUCED ? (MAX_N - 1) * STEP_MS : 0;
                    userPaused = REDUCED; paint(); if (!userPaused) start();
                }
            });
        });
        if (REDUCED) elapsed = (MAX_N - 1) * STEP_MS;
        paint(); sync(); if (!REDUCED) start();
        return {
            pause: function () { pageAwake = false; stop(); },
            resume: function () { pageAwake = true; paint(); if (!userPaused) start(); }
        };
    };

    /* The lattice picture-with-buttons band is made by imageSwitcher above;
       random background and harmonic coordinates are live canvas factories.
       A second bare factory used to be assigned over all three HERE, at the
       end of the module. Later assignment wins; do not add one. */

    return { wake: wake, sleep: sleep };
})();

/* =========================================================================
   The frontispiece: the pile assembles itself once, then rests
   ========================================================================= */

function frontispiece() {
    const canvas = $('#frontispiece');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;

    /* Every frame is drawn at the same size, so the sequence shows not the pile
       getting bigger but the pattern getting finer: the picture at a million
       grains is the picture at a thousand, resolved. */
    function paint(img) {
        ctx.clearRect(0, 0, W, W);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, W, W);
    }

    fetch('plates/p3-growth-paper.json').then(function (r) { return r.json(); }).then(function (m) {
        const frames = m.frames;
        const start = Math.max(0, frames.findIndex(function (f) { return f.px >= 9; }));
        const last = frames[frames.length - 1];
        let images = null, playing = false, played = false;

        /* Decoded up front, so the cadence is not hostage to network jitter. */
        const all = Promise.all(frames.map(function (f) {
            return loadImage('plates/' + f.file).catch(function () { return null; });
        })).then(function (list) { images = list; return list; });

        if (REDUCED) {
            /* Only the last frame is drawn here, so the caption must not
               promise a sequence the viewer will never see. */
            const cap = canvas.parentNode.querySelector('figcaption');
            if (cap) cap.textContent =
                'Abelian sandpile from one source: 1,299,052 grains, one site per pixel';
            loadImage('plates/' + last.file).then(paint).catch(function () {});
            return;
        }

        /* The coarse first frame rests on the canvas until the sequence runs, so
           the page never shows an empty rectangle. */
        loadImage('plates/' + frames[start].file).then(function (img) {
            if (!playing && !played) paint(img);
        }).catch(function () {});

        function play() {
            if (playing) return;
            playing = true;
            all.then(function (list) {
                let i = start;
                (function next() {
                    if (i >= list.length) { playing = false; played = true; return; }
                    const img = list[i];
                    if (img) paint(img);
                    /* Flat through the body; the last frames stretch, so the
                       finished pattern arrives rather than stopping. */
                    const fromEnd = list.length - 1 - i;
                    const hold = fromEnd >= 6 ? 40 : [200, 150, 120, 100, 80, 60][fromEnd];
                    i++;
                    setTimeout(next, hold);
                })();
            });
        }

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { io.disconnect(); setTimeout(play, 300); }
                });
            }, { threshold: 0.35 });
            io.observe(canvas);
        } else {
            setTimeout(play, 300);
        }

        /* A frontispiece performs once; this lets it be asked again. */
        canvas.style.cursor = 'pointer';
        canvas.addEventListener('click', function () {
            if (!playing) { played = false; play(); }
        });
    }).catch(function () {
        loadImage('plates/p3-hero-paper.png').then(paint).catch(function () {});
    });
}

/* ---- The index's two tabs ----

   Both panels ship in the document; this hides one. Two consequences are
   deliberate: with scripting off nothing is hidden, and a deep link to a
   model behind the second tab resolves, because the card was never removed
   -- the tab simply follows the link rather than the other way about. */
function tabs() {
    const btns = $$('.tab');
    if (!btns.length) return;

    function show(key, focus) {
        btns.forEach(function (b) {
            const on = b.dataset.tab === key;
            b.setAttribute('aria-selected', on ? 'true' : 'false');
            const panel = document.getElementById('sheet-' + b.dataset.tab);
            if (panel) panel.classList.toggle('is-off', !on);
            if (on && focus) b.focus();
        });
    }

    /* which tab holds a given model, so a deep link can open the right one */
    function tabOf(slug) {
        const card = $('.card[data-plate="' + slug + '"]');
        const panel = card && card.closest('.sheet');
        return panel ? panel.dataset.panel : null;
    }
    window.__tabOf = tabOf;
    window.__showTab = show;

    btns.forEach(function (b, i) {
        b.addEventListener('click', function () { show(b.dataset.tab); });
        b.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const j = (i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length;
            show(btns[j].dataset.tab, true);
        });
    });
    show(btns[0].dataset.tab);

    /* a model behind the second tab, arrived at by hash: follow it */
    const id = location.hash.replace('#', '').toLowerCase();
    if (id) { const t = tabOf(id); if (t) show(t); }
}

document.addEventListener('DOMContentLoaded', function () {
    /* The index carries maths too -- model names, family headings -- and
       nothing else was typesetting it, so a visitor saw the raw delimiters.
       The studies are typeset separately, the first time each one opens. */
    if (window.typeset) window.typeset(document.getElementById('top'));
    tabs();
    Router.init();
    frontispiece();
});

/* =========================================================================
   Rule diagrams
   -------------------------------------------------------------------------
   Every model in this room is a graph whose sites hold whole numbers. Drawing
   each one as numbered nodes and edges — rather than as a picture of squares —
   makes the family resemblance visible, and makes the threshold (how many
   edges leave a site) the obvious thing it is.
   ========================================================================= */

const Diagrams = (function () {

    const R = 17;          /* node radius */
    const D = 56;          /* edge length */
    const PAD = R + 9;
    const SIZE = 2 * (D + PAD);
    const GAP = 54;

    function svgEl(name, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', name);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function node(g, x, y, value, role) {
        g.appendChild(svgEl('circle', { cx: x, cy: y, r: R, class: 'dg-node dg-' + role }));
        const t = svgEl('text', { x: x, y: y, class: 'dg-num dg-num-' + role });
        t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('text-anchor', 'middle');
        t.textContent = String(value);
        g.appendChild(t);
    }

    function edge(g, x1, y1, x2, y2, directed, rad) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const rr = rad === undefined ? R : rad;
        const ax = x1 + ux * rr, ay = y1 + uy * rr;
        const bx = x2 - ux * rr, by = y2 - uy * rr;
        g.appendChild(svgEl('line', { x1: ax, y1: ay, x2: bx, y2: by, class: 'dg-edge' }));
        if (!directed) return;
        /* a small open chevron, pointing the way grains may travel */
        const hx = bx - ux * 1, hy = by - uy * 1;
        const s = 7, w = 4.4;
        const px = -uy, py = ux;
        g.appendChild(svgEl('polyline', {
            points: [hx - ux * s + px * w, hy - uy * s + py * w, hx, hy,
                     hx - ux * s - px * w, hy - uy * s - py * w].map(function (v) {
                return Math.round(v * 100) / 100;
            }).join(' '),
            class: 'dg-arrow'
        }));
    }

    /* one panel: a site and its neighbours, before or after the firing */
    function fmt(v) {
        return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '');
    }

    function panel(root, ox, spec, after) {
        const g = svgEl('g', {});
        const cx = ox + SIZE / 2, cy = SIZE / 2;
        spec.neighbours.forEach(function (nb) {
            const x = cx + Math.cos(nb.a) * D, y = cy + Math.sin(nb.a) * D;
            const arrow = nb.arrow !== undefined ? nb.arrow : (spec.directed && nb.gain !== 0);
            if (arrow) edge(g, cx, cy, x, y, true);
            else if (spec.inward) edge(g, x, y, cx, cy, true);     /* a one-way edge running in */
            else edge(g, cx, cy, x, y, false);
        });
        spec.neighbours.forEach(function (nb) {
            const x = cx + Math.cos(nb.a) * D, y = cy + Math.sin(nb.a) * D;
            const gain = nb.gain === undefined ? 1 : nb.gain;
            const gets = after && gain !== 0;
            node(g, x, y, fmt(nb.v + (gets ? gain : 0)), gets ? 'gains' : 'quiet');
        });
        node(g, cx, cy, fmt(after ? spec.centreAfter : spec.centre), after ? 'quiet' : 'firing');
        root.appendChild(g);
    }

    const SPECS = {
        square: {
            centre: 4, centreAfter: 0, directed: false,
            neighbours: [{ a: 0, v: 2 }, { a: Math.PI / 2, v: 0 }, { a: Math.PI, v: 1 }, { a: -Math.PI / 2, v: 2 }],
            label: 'The square lattice',
            rule: 'Out-degree 4, so a site fires at height 4, sending one grain along each edge.'
        },
        triangular: {
            centre: 6, centreAfter: 0, directed: false,
            neighbours: [0, 1, 2, 3, 4, 5].map(function (i, k) {
                return { a: i * Math.PI / 3, v: [3, 1, 4, 0, 2, 4][k] };
            }),
            label: 'The triangular lattice',
            rule: 'Out-degree 6, so a site fires at height 6.'
        },
        honeycomb: {
            centre: 3, centreAfter: 0, directed: false,
            neighbours: [{ a: -Math.PI / 2, v: 0 }, { a: Math.PI / 6, v: 1 }, { a: 5 * Math.PI / 6, v: 1 }],
            label: 'The honeycomb lattice',
            rule: 'Out-degree 3, so a site fires at height 3.'
        },
        idla: {
            centre: 3, centreAfter: 2, directed: true, inward: false,
            neighbours: [{ a: 0, v: 1, gain: 1, arrow: true }, { a: Math.PI / 2, v: 0, gain: 0, arrow: false },
                         { a: Math.PI, v: 2, gain: 0, arrow: false }, { a: -Math.PI / 2, v: 1, gain: 0, arrow: false }],
            label: 'Internal DLA',
            rule: 'A site holding more than one particle sends one away, along the next direction in a list drawn at random for that site in advance. This runs until every site holds at most one; the occupied sites are the cluster.'
        },
        divisible: {
            centre: 2.4, centreAfter: 1, directed: false,
            neighbours: [{ a: 0, v: 0.5, gain: 0.35 }, { a: Math.PI / 2, v: 0.2, gain: 0.35 },
                         { a: Math.PI, v: 0.9, gain: 0.35 }, { a: -Math.PI / 2, v: 0.4, gain: 0.35 }],
            label: 'The divisible sandpile',
            rule: 'Sand rather than grains. A site holding more than one keeps exactly one and divides the excess equally among its neighbours. The amounts are no longer whole numbers, and the process converges rather than stopping.'
        },
        flattice: {
            centre: 2, centreAfter: 0, directed: true, inward: true,
            neighbours: [{ a: 0, v: 0, gain: 1, arrow: true }, { a: Math.PI / 2, v: 1, gain: 0, arrow: false },
                         { a: Math.PI, v: 0, gain: 1, arrow: true }, { a: -Math.PI / 2, v: 0, gain: 0, arrow: false }],
            label: 'The F-lattice',
            rule: 'Every edge is oriented, two in and two out, so out-degree is 2 and a site fires at height 2. Drawn here at a site of odd parity, whose out-edges are horizontal.'
        }
    };

    function ruleCard(kind) {
        const spec = SPECS[kind];
        const W = SIZE * 2 + GAP;
        const svg = svgEl('svg', {
            viewBox: '0 0 ' + W + ' ' + SIZE,
            class: 'dg', role: 'img',
            'aria-label': spec.label + '. ' + spec.rule
        });
        panel(svg, 0, spec, false);
        panel(svg, SIZE + GAP, spec, true);
        /* the turnstile between the two states */
        const mx = SIZE + GAP / 2, my = SIZE / 2;
        svg.appendChild(svgEl('line', { x1: mx - 13, y1: my, x2: mx + 9, y2: my, class: 'dg-edge' }));
        svg.appendChild(svgEl('polyline', {
            points: (mx + 3) + ',' + (my - 4.4) + ' ' + (mx + 9) + ',' + my + ' ' + (mx + 3) + ',' + (my + 4.4),
            class: 'dg-arrow'
        }));
        return { svg: svg, spec: spec };
    }

    /* The F-lattice: Z^2 with every edge oriented. A site with x1+x2 even
       sends along +-e2, a site with x1+x2 odd along +-e1, so out-degree is 2
       everywhere and in-degree is 2 everywhere. The Laplacian sums over
       IN-edges: on the full 1.3-million-grain plate the stated convention has
       zero residual failures across 2,187,441 sites, while swapping horizontal
       and vertical fails at 1,552,563 sites. */
    function flatticeCard() {
        const K = 5, STEP = 62, PAD = 30;
        const W = PAD * 2 + (K - 1) * STEP;
        const svg = svgEl('svg', {
            viewBox: '0 0 ' + W + ' ' + W, class: 'dg', role: 'img',
            'aria-label': 'The F-lattice: every edge oriented, two entering and two leaving each site.'
        });
        const at = function (i) { return PAD + i * STEP; };
        for (let r = 0; r < K; r++) {
            for (let c = 0; c < K; c++) {
                const horiz = ((r + c) % 2 === 1);   /* even parity sends vertically */
                const x = at(c), y = at(r);
                if (horiz) {
                    if (c > 0) edge(svg, x, y, at(c - 1), y, true, 7);
                    if (c < K - 1) edge(svg, x, y, at(c + 1), y, true, 7);
                } else {
                    if (r > 0) edge(svg, x, y, x, at(r - 1), true, 7);
                    if (r < K - 1) edge(svg, x, y, x, at(r + 1), true, 7);
                }
            }
        }
        for (let r = 0; r < K; r++) {
            for (let c = 0; c < K; c++) {
                svg.appendChild(svgEl('circle', { cx: at(c), cy: at(r), r: 5, class: 'dg-site' }));
            }
        }
        return svg;
    }

    /* the rotor rule: no numbers, but an arrow at every site */
    function rotorCard() {
        const W = 540, H = 174, PANEL = 160, GAP = 20;
        const svg = svgEl('svg', {
            viewBox: '0 0 ' + W + ' ' + H,
            class: 'dg dg--rotor',
            role: 'img',
            'aria-label': 'Three frames show one rotor step. The arrow under the walker turns from north to east, the walker moves east, and the arrow remains pointing east.'
        });

        function line(klass, x1, y1, x2, y2) {
            return svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: klass });
        }

        function arrow(g, cx, cy, dx, dy, klass) {
            const L = 18, tail = 12, head = 8, wing = 5;
            const px = -dy, py = dx;
            const tx = cx + dx * L, ty = cy + dy * L;
            g.appendChild(line(klass, cx - dx * tail, cy - dy * tail, tx, ty));
            g.appendChild(svgEl('polyline', {
                points: [
                    tx - dx * head + px * wing, ty - dy * head + py * wing,
                    tx, ty,
                    tx - dx * head - px * wing, ty - dy * head - py * wing
                ].join(' '),
                class: klass
            }));
        }

        function panel(index, title) {
            const ox = index * (PANEL + GAP);
            const g = svgEl('g', { class: 'dg-rotor-panel' });
            g.appendChild(svgEl('rect', {
                x: ox + .5, y: .5, width: PANEL - 1, height: H - 1,
                rx: 2, class: 'dg-rotor-panel-bg'
            }));
            const number = svgEl('text', {
                x: ox + 13, y: 23, class: 'dg-rotor-step'
            });
            number.textContent = '0' + (index + 1);
            g.appendChild(number);
            const heading = svgEl('text', {
                x: ox + 42, y: 23, class: 'dg-rotor-title'
            });
            heading.textContent = title;
            g.appendChild(heading);

            const cx = ox + 55, cy = 106, d = 45;
            g.appendChild(line('dg-rotor-lattice', cx - 30, cy, cx + d + 30, cy));
            g.appendChild(line('dg-rotor-lattice', cx, cy - 34, cx, cy + 34));
            g.appendChild(line('dg-rotor-lattice', cx + d, cy - 34, cx + d, cy + 34));
            [[cx, cy], [cx + d, cy], [cx, cy - d], [cx, cy + d]].forEach(function (p) {
                g.appendChild(svgEl('circle', {
                    cx: p[0], cy: p[1], r: 2.5, class: 'dg-rotor-site'
                }));
            });
            svg.appendChild(g);
            return { g: g, cx: cx, cy: cy, destX: cx + d };
        }

        const turn = panel(0, 'TURN');
        arrow(turn.g, turn.cx, turn.cy, 0, -1, 'dg-rotor-arrow dg-rotor-arrow--old');
        arrow(turn.g, turn.cx, turn.cy, 1, 0, 'dg-rotor-arrow dg-rotor-arrow--active');
        turn.g.appendChild(svgEl('path', {
            d: 'M ' + turn.cx + ' ' + (turn.cy - 30) +
               ' A 30 30 0 0 1 ' + (turn.cx + 30) + ' ' + turn.cy,
            class: 'dg-rotor-turn'
        }));
        turn.g.appendChild(svgEl('polyline', {
            points: (turn.cx + 24) + ',' + (turn.cy - 7) + ' ' +
                    (turn.cx + 30) + ',' + turn.cy + ' ' +
                    (turn.cx + 22) + ',' + (turn.cy + 3),
            class: 'dg-rotor-turn'
        }));
        turn.g.appendChild(svgEl('circle', {
            cx: turn.cx, cy: turn.cy, r: 12, class: 'dg-rotor-walker'
        }));

        const move = panel(1, 'MOVE');
        arrow(move.g, move.cx, move.cy, 1, 0, 'dg-rotor-arrow dg-rotor-arrow--move');
        move.g.appendChild(line('dg-rotor-motion', move.cx + 15, move.cy,
                                move.destX - 11, move.cy));
        move.g.appendChild(svgEl('polyline', {
            points: (move.destX - 18) + ',' + (move.cy - 5) + ' ' +
                    (move.destX - 11) + ',' + move.cy + ' ' +
                    (move.destX - 18) + ',' + (move.cy + 5),
            class: 'dg-rotor-motion'
        }));
        move.g.appendChild(svgEl('circle', {
            cx: move.cx + 25, cy: move.cy, r: 12, class: 'dg-rotor-walker'
        }));

        const remember = panel(2, 'REMEMBER');
        arrow(remember.g, remember.cx, remember.cy, 1, 0,
              'dg-rotor-arrow dg-rotor-arrow--retained');
        arrow(remember.g, remember.destX, remember.cy, 0, -1,
              'dg-rotor-arrow dg-rotor-arrow--quiet');
        remember.g.appendChild(svgEl('circle', {
            cx: remember.destX, cy: remember.cy, r: 12, class: 'dg-rotor-walker'
        }));

        return svg;
    }

    function figure(svg, label, rule) {
        const fig = document.createElement('figure');
        fig.className = 'rulecard';
        fig.appendChild(svg);
        const cap = document.createElement('figcaption');
        cap.innerHTML = '<span class="dg-label">' + label + '</span>' + rule;
        fig.appendChild(cap);
        return fig;
    }

    function mount(el) {
        if (!el || el.childElementCount) return;
        const kinds = el.dataset.diagram.split(',');
        if (kinds.length > 1) el.classList.add('rules-row');
        kinds.forEach(function (k) {
            if (k === 'flattice-graph') {
                el.appendChild(figure(flatticeCard(), 'The F-lattice',
                    'Every edge is oriented. A site with x\u2081+x\u2082 even sends along \u00b1e\u2082, one with x\u2081+x\u2082 odd along \u00b1e\u2081, so two edges leave and two enter every site.'));
            } else if (k === 'rotor') {
                el.appendChild(figure(rotorCard(), 'One rotor step',
                    'Turn the arrow under the walker one quarter-turn clockwise. Move one edge along the new arrow. The arrow stays turned.'));
            } else {
                const c = ruleCard(k);
                el.appendChild(figure(c.svg, c.spec.label, c.spec.rule));
            }
        });
    }

    return { mount: mount };
})();
