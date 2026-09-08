#!/usr/bin/env node
/* Run with `node tests/einstein.test.mjs`. No packages or browser required.
   Exercise the shared SDE and the gallery's real playback lifecycle. Browser
   layout, appearance, and native worker loading are checked separately. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const modelContext = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../einstein-motion.js', import.meta.url), 'utf8'), modelContext);
const model = modelContext.EinsteinMotion;
const source = fs.readFileSync(process.argv[2] || new URL('../gallery/gallery.js', import.meta.url), 'utf8');
const start = source.indexOf('    makers.einstein = function ()');
const end = source.indexOf('    /* Parking: each active car', start);
assert(start >= 0 && end > start, 'Einstein instrument must be present');
const instrument = source.slice(start, end);
const close = (actual, expected, tolerance = 1e-10) =>
    assert(Math.abs(actual - expected) < tolerance, `${actual} must equal ${expected}`);

// The potential displayed in the study must generate the drift we integrate.
for (const [x, y] of [[0, 0], [.7, -1.2], [9, 4], [-6.2, 8.1]]) {
    const g = model.gradient(x, y), h = 1e-5;
    close(g[0], (model.potential(x + h, y) - model.potential(x - h, y)) / (2 * h), 1e-7);
    close(g[1], (model.potential(x, y + h) - model.potential(x, y - h)) / (2 * h), 1e-7);
}

// A duration of one Euler step isolates both the noise convention and coupling.
const one = model.generate({ force: Math.sqrt(4 / .025), seed: 42, pairs: 4, samples: 3 });
assert.equal(one.steps, 1);
const normal = model.noise(42), drift = model.gradient(0, 0);
for (let p = 0; p < one.pairs; p++) {
    const zx = normal(); normal(); // The independent vertical increment.
    const expected = -drift[0] * one.duration + Math.sqrt(one.duration) * zx;
    close(one.x0[p][2], expected);
    close(one.x1[p][2] - one.x0[p][2], one.force * one.duration);
    close(one.x0[p][1], expected / 2); // Recorded intermediate times use linear interpolation.
}

const runs = new Map();
for (const force of [.25, .125, .0625]) {
    const options = { force, seed: 42, pairs: 32, samples: 900 };
    const run = model.generate(options);
    runs.set(force, run);
    assert.deepEqual(model.generate(options), run, 'The same seed must reproduce the complete history');
    close(run.duration, 4 / force ** 2);
    assert.equal(run.time[0], 0);
    assert.equal(run.time.at(-1), run.duration);
    for (let s = 0; s < run.samples; s++) {
        const a = run.x0.map(path => path[s]), b = run.x1.map(path => path[s]);
        assert(a.concat(b).every(value => Number.isFinite(value) && value > run.yMin && value < run.yMax));
        const meanA = a.reduce((sum, value) => sum + value, 0) / run.pairs;
        const meanB = b.reduce((sum, value) => sum + value, 0) / run.pairs;
        close(run.mean0[s], meanA); close(run.mean1[s], meanB);
        if (s) {
            const variance = a.reduce((sum, value) => sum + (value - meanA) ** 2, 0) / (run.pairs - 1);
            close(run.diffusion[s], variance / run.time[s]);
            close(run.mobility[s], (meanB - meanA) / (force * run.time[s]));
        } else {
            assert(a.concat(b).every(value => value === 0), 'Every trajectory starts at the origin');
        }
    }
}
assert.notDeepEqual(model.generate({ seed: 43, pairs: 32, samples: 900 }).x0, runs.get(.125).x0);

function setup({ reduced = false, width = 840, useWorker = false } = {}) {
    const noOp = () => {};
    const context = { setTransform: noOp, fillRect: noOp };
    const canvas = { width: 1600, height: 1040, dataset: {}, getContext: () => context,
        getBoundingClientRect: () => ({ width }) };
    function element(dataset = {}) {
        const listeners = new Map();
        return { dataset, textContent: '', value: '0', classList: { toggle: noOp }, setAttribute: noOp,
            addEventListener: (name, fn) => listeners.set(name, fn),
            fire: name => listeners.get(name)?.() };
    }
    const forces = [.25, .125, .0625].map(value => element({ einsteinForce: String(value) }));
    const controls = ['pause', 'replay', 'sample'].map(value => element({ einsteinRun: value }));
    const elements = new Map([['#einstein-canvas', canvas], ['[data-einstein-run="pause"]', controls[0]]]);
    for (const name of ['time-input', 'time', 'diffusion', 'mobility', 'note'])
        elements.set('#einstein-' + name, element());
    const frames = new Map(), timers = [], workers = [], draws = [];
    let nextFrame = 1, now = 100, resize;
    const sandbox = {
        makers: {}, REDUCED: reduced, devicePixelRatio: 2,
        EinsteinMotion: { generate: model.generate, paint: (...args) => draws.push(args) },
        document: { querySelector: () => useWorker ? { src: 'https://example.test/einstein-motion.js?v=test' } : null },
        $: selector => elements.get(selector),
        $$: selector => selector === '[data-einstein-force]' ? forces : controls,
        setNote: (el, text) => { el.textContent = text; },
        ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} },
        requestAnimationFrame(fn) { frames.set(nextFrame, fn); return nextFrame++; },
        cancelAnimationFrame: id => frames.delete(id),
        setTimeout: fn => timers.push(fn),
    };
    if (useWorker) sandbox.Worker = class {
        constructor(url) { this.url = url; workers.push(this); }
        postMessage(message) { this.message = message; }
        terminate() { this.terminated = true; }
        complete() { this.onmessage({ data: { id: this.message.id, run: model.generate(this.message.options) } }); }
    };
    vm.runInNewContext(instrument, sandbox);
    const api = sandbox.makers.einstein();
    function flush() { while (timers.length) timers.shift()(); }
    function frame() {
        now += 100;
        const pending = [...frames.values()]; frames.clear();
        for (const callback of pending) callback(now);
    }
    function finish() {
        let remaining = 160;
        while (frames.size && remaining--) frame();
        assert.equal(frames.size, 0, 'Playback must stop after its complete history');
        close(+canvas.dataset.time, 4 / (+canvas.dataset.force) ** 2);
        assert(Number.isFinite(+canvas.dataset.diffusion));
        assert(Number.isFinite(+canvas.dataset.mobility));
    }
    return { canvas, forces, controls, api, flush, frame, finish, workers, draws,
        slider: elements.get('#einstein-time-input'), queued: () => frames.size,
        snapshot: () => ({ ...canvas.dataset }),
        resize: nextWidth => { width = nextWidth; resize(); } };
}

const gallery = setup();
assert.equal(gallery.canvas.dataset.loading, 'true');
assert.equal(gallery.queued(), 0, 'Loading must not start an empty animation');
gallery.flush();
assert.equal(gallery.canvas.height / gallery.canvas.width, 520 / 800);
assert(gallery.canvas.width / 840 >= 2, 'Desktop backing must retain high pixel density');
assert.equal(+gallery.canvas.dataset.pairs, 32);
gallery.frame(); gallery.frame();
gallery.controls[0].fire('click');
const paused = gallery.snapshot();
gallery.frame(); gallery.api.pause(); gallery.api.resume();
assert.deepEqual(gallery.snapshot(), paused);
assert.equal(gallery.queued(), 0, 'Returning to a study preserves deliberate pause');
gallery.controls[0].fire('click'); gallery.finish();
const completed = gallery.snapshot();
gallery.controls[1].fire('click'); gallery.finish();
assert.deepEqual(gallery.snapshot(), completed, 'Replay must retain the same realization');
gallery.controls[2].fire('click'); gallery.flush(); gallery.finish();
assert.notEqual(gallery.canvas.dataset.seed, completed.seed);
assert.notEqual(gallery.canvas.dataset.diffusion, completed.diffusion);

for (const button of gallery.forces) {
    button.fire('click'); gallery.flush();
    assert.equal(gallery.queued(), 1, 'A new force should start another complete history');
    gallery.finish();
    close(+gallery.canvas.dataset.time, 4 / (+button.dataset.einsteinForce) ** 2);
    assert.equal(gallery.controls[0].textContent, 'Play again');
}
gallery.controls[1].fire('click'); gallery.controls[0].fire('click');
gallery.forces[0].fire('click'); gallery.flush();
assert.equal(gallery.queued(), 0, 'Changing force preserves deliberate pause');
gallery.slider.value = '370'; gallery.slider.fire('input');
close(+gallery.canvas.dataset.time, .37 * 64);
gallery.api.pause(); gallery.api.resume();
assert.equal(gallery.queued(), 0, 'Scrubbing holds the selected time');
gallery.controls[0].fire('click'); gallery.frame(); gallery.frame();
const beforeHide = gallery.snapshot();
gallery.api.pause(); gallery.frame();
assert.deepEqual(gallery.snapshot(), beforeHide, 'Hidden studies must not advance');
gallery.api.resume(); assert.equal(gallery.queued(), 1);
gallery.resize(350);
close(gallery.canvas.height / gallery.canvas.width, 640 / 800);
assert(gallery.canvas.width / 350 >= 2, 'Mobile backing must retain high pixel density');
gallery.api.pause();

const reduced = setup({ reduced: true, width: 350 });
reduced.flush();
close(+reduced.canvas.dataset.time, 256);
assert.equal(reduced.queued(), 0, 'Reduced motion opens with the complete history');
reduced.api.pause(); reduced.api.resume();
assert.equal(reduced.queued(), 0, 'Route changes must respect reduced motion');
reduced.controls[0].fire('click');
assert.equal(reduced.queued(), 1, 'Explicit Play must work with reduced motion');
reduced.finish(); reduced.controls[1].fire('click');
assert.equal(+reduced.canvas.dataset.time, 0);
assert.equal(reduced.queued(), 1, 'Explicit Replay also works with reduced motion');
reduced.api.pause();

// Rapid force changes must discard obsolete work, including delayed fallback jobs.
const loading = setup();
loading.forces[0].fire('click'); loading.api.pause(); loading.flush();
assert.equal(+loading.canvas.dataset.force, .25);
assert.equal(loading.queued(), 0, 'Completion while hidden must stay paused');
loading.api.resume(); assert.equal(loading.queued(), 1); loading.api.pause();
const worker = setup({ useWorker: true });
const stale = worker.workers[0];
worker.forces[0].fire('click');
assert(stale.terminated, 'Replacing a run must release its worker');
stale.complete();
assert.equal(worker.canvas.dataset.loading, 'true', 'A stale worker must not publish its result');
worker.workers[1].complete();
assert.equal(+worker.canvas.dataset.force, .25);
assert(worker.workers[1].terminated);
worker.api.pause();
const failedWorker = setup({ useWorker: true });
failedWorker.workers[0].onerror(); failedWorker.flush();
assert.equal(failedWorker.canvas.dataset.loading, 'false', 'Worker errors must fall back to local computation');
assert.equal(failedWorker.queued(), 1); failedWorker.api.pause();

console.log('Einstein checks passed: SDE coupling, gradient, reproducible trajectories, measured statistics, force endpoints, playback, scrubber, responsive canvas, reduced motion, worker fallback and stale results.');
