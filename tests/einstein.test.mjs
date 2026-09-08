#!/usr/bin/env node
/* Run with `node tests/einstein.test.mjs`. No browser or packages required.
   Canvas drawing is stubbed; this checks the real instrument's numerical
   convention and playback state machine, not browser layout or raster output. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(process.argv[2] || new URL('../gallery/gallery.js', import.meta.url), 'utf8');
const start = source.indexOf('    function einsteinPotential(');
const end = source.indexOf('    /* Parking: each active car', start);
assert(start >= 0 && end > start, 'Einstein instrument must be present');
const instrument = source.slice(start, end);

function setup({ reduced = false, narrow = false } = {}) {
    const noOp = () => {};
    const context = new Proxy({}, { get: () => noOp, set: () => true });
    const canvas = {
        width: 2160, height: 2220, dataset: {}, getContext: () => context,
        getBoundingClientRect: () => ({ width: narrow ? 350 : 840 }),
    };
    function element(dataset = {}) {
        return { dataset, textContent: '', classList: { toggle: noOp }, setAttribute: noOp,
            addEventListener(event, fn) { if (event === 'click') this.click = fn; } };
    }
    const forces = [.25, .125, .0625, .03125].map(value => element({ einsteinForce: String(value) }));
    const controls = ['pause', 'replay', 'sample'].map(value => element({ einsteinRun: value }));
    const elements = new Map([
        ['#einstein-canvas', canvas], ['[data-einstein-run="pause"]', controls[0]],
    ]);
    for (const name of ['time', 'balance', 'diffusion', 'mobility', 'note'])
        elements.set('#einstein-' + name, element());
    const frames = new Map();
    let id = 1, now = 100;
    const sandbox = {
        makers: {}, REDUCED: reduced, Math,
        document: { createElement: () => ({ width: 0, height: 0, getContext: () => context }) },
        $: selector => elements.get(selector),
        $$: selector => selector === '[data-einstein-force]' ? forces : controls,
        setNote: (el, text) => { el.textContent = text; },
        ruleMix: (a, b, t) => a + (b - a) * t,
        ResizeObserver: class { observe() {} },
        requestAnimationFrame(callback) { frames.set(id, callback); return id++; },
        cancelAnimationFrame: id => frames.delete(id),
    };
    vm.createContext(sandbox);
    vm.runInContext(instrument, sandbox);
    const api = sandbox.makers.einstein();
    function frame() {
        now += 50;
        const pending = [...frames.values()];
        frames.clear();
        for (const callback of pending) callback(now);
    }
    function finish() {
        let iterations = 0;
        while (frames.size && iterations++ < 600) frame();
        assert.equal(frames.size, 0, 'Run must terminate within its playback duration');
        assert(Number.isFinite(+canvas.dataset.diffusion), 'Variance estimate must be finite');
        assert(Number.isFinite(+canvas.dataset.mobility), 'Response estimate must be finite');
    }
    return { canvas, forces, controls, api, frame, finish, sandbox,
        queued: () => frames.size, snapshot: () => ({ ...canvas.dataset }) };
}

const normal = setup();
assert.equal(normal.canvas.height / normal.canvas.width, 740 / 720, 'Wide layout must use two adjacent panels');
assert(normal.canvas.width / 840 >= 2, 'Desktop backing must be at least twice the CSS resolution');
assert.equal(+normal.canvas.dataset.pairs, 128);

// The displayed potential must generate the simulated reversible drift.
for (const [x, y] of [[0, 0], [.7, -1.2], [9, 4], [-6.2, 8.1]]) {
    const { einsteinPotential: potential, einsteinGradient: gradient } = normal.sandbox;
    const g = [0, 0], h = 1e-5;
    gradient(x, y, g);
    assert(Math.abs(g[0] - (potential(x + h, y) - potential(x - h, y)) / (2 * h)) < 1e-7);
    assert(Math.abs(g[1] - (potential(x, y + h) - potential(x, y - h)) / (2 * h)) < 1e-7);
}

normal.frame(); normal.frame();
const beforePause = normal.snapshot();
normal.controls[0].click();
normal.frame();
assert.deepEqual(normal.snapshot(), beforePause, 'Pause must hold the simulation exactly');
normal.api.pause(); normal.api.resume();
assert.equal(normal.queued(), 0, 'Opening the study must preserve an explicit pause');
normal.controls[0].click(); normal.finish();
const first = normal.snapshot();
assert.equal(+first.time, 96);
normal.controls[1].click(); normal.finish();
assert.deepEqual(normal.snapshot(), first, 'Replay must reuse the same noise');
normal.controls[2].click(); normal.finish();
assert.notEqual(normal.canvas.dataset.diffusion, first.diffusion, 'New sample must change the noise');

for (const button of normal.forces) {
    button.click();
    assert.equal(normal.queued(), 1, 'Choosing a force after completion must start a new run');
    normal.finish();
    assert.equal(+normal.canvas.dataset.time, 1.5 / ((+button.dataset.einsteinForce) ** 2));
    assert.equal(normal.controls[0].textContent, 'Play again');
}
normal.controls[1].click(); normal.controls[0].click(); normal.forces[0].click();
assert.equal(normal.queued(), 0, 'Choosing a force must preserve a deliberate pause');

const reduced = setup({ reduced: true, narrow: true });
assert.equal(reduced.canvas.height / reduced.canvas.width, 1220 / 720, 'Narrow layout must stack the panels');
assert(reduced.canvas.width / 350 >= 2, 'Mobile backing must be at least twice the CSS resolution');
assert(+reduced.canvas.dataset.time > 60, 'Reduced motion should show a useful static preview');
assert.equal(reduced.queued(), 0);
reduced.api.pause(); reduced.api.resume();
assert.equal(reduced.queued(), 0, 'Route changes must not autoplay with reduced motion');
reduced.controls[0].click();
assert.equal(reduced.queued(), 1, 'Explicit Play must work with reduced motion');
reduced.finish();
reduced.controls[1].click();
assert(+reduced.canvas.dataset.time < 2, 'Explicit Replay must restart near time zero');
assert.equal(reduced.queued(), 1);
reduced.api.pause();
console.log('Einstein checks passed: gradient, replay, sampling, all four force endpoints, pause, reduced motion, responsive canvas.');
