#!/usr/bin/env node
/* Run with `node tests/flow-walk.test.mjs`. The canvas stub exercises the real
   lifecycle; browser checks separately cover composition and visual motion. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../flow-walk.js', import.meta.url), 'utf8');
const modelContext = vm.createContext({});
vm.runInContext(source, modelContext);
const model = modelContext.FlowWalk;
const close = (actual, expected, tolerance = 1e-9) =>
    assert(Math.abs(actual - expected) <= tolerance, `${actual} must equal ${expected}`);
const snapshot = run => ({ x: run.x, y: run.y, steps: run.steps, time: run.time,
    minX: run.minX, maxX: run.maxX, minY: run.minY, maxY: run.maxY, trail: run.trail });

// Differentiate the displayed stream function independently of the velocity.
for (const gamma of [0, .05, .10, .15]) {
    const run = model.create({ seed: 72, gamma }), h = 1e-5;
    assert.equal(run.modes.length, 20);
    for (const [x, y] of [[0, 0], [.7, -1.2], [19, 34], [-58.2, 86.1]]) {
        const value = model.field(run, x, y);
        const xp = model.field(run, x + h, y), xm = model.field(run, x - h, y);
        const yp = model.field(run, x, y + h), ym = model.field(run, x, y - h);
        close(value[1], (yp[0] - ym[0]) / (2 * h), 2e-8);
        close(value[2], -(xp[0] - xm[0]) / (2 * h), 2e-8);
        close((xp[1] - xm[1] + yp[2] - ym[2]) / (2 * h), 0, 3e-8);
        for (const [dx, dy] of [[48, 0], [0, 48], [-96, 144]])
            model.field(run, x + dx, y + dy).forEach((v, i) => close(v, value[i], 2e-12));
    }
}
assert.equal(model.PERIOD, 48);
const critical = model.create({ seed: 72, gamma: 0 });
for (const gamma of [.05, .10, .15]) {
    const algebraic = model.create({ seed: 72, gamma });
    algebraic.modes.forEach((m, i) => {
        const reference = critical.modes[i], factor = 2 ** (-gamma * m.band);
        assert.equal(m.kx, reference.kx); assert.equal(m.ky, reference.ky);
        close(m.a, reference.a * factor, 1e-15); close(m.b, reference.b * factor, 1e-15);
    });
}

// An explicit two-step reference checks the noise convention, component order,
// and that both drift components are evaluated at the old position.
for (const kappa of [0, .3, 1]) {
    const run = model.create({ seed: 172, kappa });
    run.x = .8; run.y = -1.2;
    const normals = [.25, -.6, 1.5, -.8]; let used = 0;
    run.normal = () => normals[used++];
    let x = run.x, y = run.y;
    const coefficient = Math.sqrt(2 * kappa * model.DT);
    for (let step = 0; step < 2; step++) {
        const [, bx, by] = model.field(run, x, y);
        x += bx * model.DT + coefficient * normals[step * 2];
        y += by * model.DT + coefficient * normals[step * 2 + 1];
    }
    model.advance(run, 2);
    close(run.x, x); close(run.y, y); assert.equal(used, 4);
    assert.equal(run.time, 2 * model.DT);
}

// RAF batching must never change the process or its retained history. This
// crosses two history-compression thresholds, including one very large call.
const options = { seed: 583, gamma: .10 };
const batched = model.create(options), incremental = model.create(options);
model.advance(batched, 100000);
for (let n = 0; n < 100000;) {
    const count = Math.min(100000 - n, (n % 97) + 1);
    model.advance(incremental, count); n += count;
}
assert.deepEqual(snapshot(incremental), snapshot(batched));
const replay = model.create(options); model.advance(replay, 100000);
assert.deepEqual(snapshot(replay), snapshot(batched), 'A seed reproduces the complete trajectory');
const fresh = model.create({ ...options, seed: 584 }); model.advance(fresh, 1000);
assert.notDeepEqual(fresh.modes, batched.modes, 'A new seed changes the fixed environment');
const sameField = model.create({ ...options, seed: 584, fieldSeed: options.seed });
assert.deepEqual(sameField.modes, batched.modes, 'A new walk can keep the same field');
model.advance(sameField, 100000);
assert.notEqual(sameField.x, batched.x, 'An independent Brownian seed changes the walk in the same field');
assert(batched.trail.length <= 65536, 'Long calls keep the same bounded history as animation frames');
assert.deepEqual(Array.from(batched.trail[0]), [0, 0, 0], 'The starting point survives compression');
let priorStep = -1;
for (const [x, y, step] of batched.trail) {
    assert(Number.isFinite(x) && Number.isFinite(y));
    assert(step > priorStep); priorStep = step;
    assert(x >= batched.minX && x <= batched.maxX && y >= batched.minY && y <= batched.maxY);
}
batched.trail.slice(-32768).forEach((p, i) =>
    assert.equal(p[2], batched.steps - 32767 + i, 'The newest 32,768 steps remain undecimated'));
assert.equal(batched.trail.at(-1)[0], batched.x); assert.equal(batched.trail.at(-1)[1], batched.y);

// Following the walker never zooms out; delayed frames cannot lose its head.
let cam;
for (const [x, y] of [[0, 0], [.7, -.6], [27, -80], [-75, 42], [1e5, -1e5]]) {
    cam = model.camera({ x, y }, cam, 'follow', 1 / 60);
    assert.equal(cam.half, 6);
    assert(Math.abs(cam.x - x) <= 3.8 + 1e-9 && Math.abs(cam.y - y) <= 3.8 + 1e-9);
}
const whole = model.camera(batched, cam, 'whole');
for (const [x, y] of batched.trail)
    assert(Math.abs(x - whole.x) < whole.half && Math.abs(y - whole.y) < whole.half);

function harness({ reduced = false, gamma = 0, width = 720 } = {}) {
    const noop = () => {}, pending = new Map(); let nextFrame = 0, now = 100;
    function element(attributes = {}) {
        const listeners = new Map();
        return { dataset: {}, style: {}, textContent: '', attributes, classList: { toggle: noop },
            getAttribute: name => attributes[name], setAttribute: (name, value) => { attributes[name] = value; },
            addEventListener: (name, fn) => listeners.set(name, fn), fire: name => listeners.get(name)?.() };
    }
    const prefix = gamma ? 'asd' : 'sd';
    const groups = {};
    for (const [name, values] of [['run', ['pause', 'replay', 'new']], ['view', ['follow', 'whole']],
        ['speed', ['1', '3']], ['gamma', ['0.05', '0.10', '0.15']]])
        groups['[data-' + prefix + '-' + name + ']'] = values.map(value => element({ ['data-' + prefix + '-' + name]: value }));
    const elements = new Map();
    for (const key of ['note', 'time']) elements.set('#' + (gamma ? 'algebraic-sd' : 'sd') + '-' + key, element());
    for (const [selector, entries] of Object.entries(groups)) {
        const attribute = selector.slice(1, -1);
        entries.forEach(el => elements.set('[' + attribute + '="' + el.getAttribute(attribute) + '"]', el));
    }
    const ctx = new Proxy({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (target, key) => target[key] ?? noop,
        set: (target, key, value) => { target[key] = value; return true; } });
    const document = { hidden: false, querySelector: selector => elements.get(selector),
        querySelectorAll: selector => groups[selector] || [],
        createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
    const canvas = { dataset: {}, width: 1440, height: 1440, getContext: () => ctx,
        closest: () => document, getBoundingClientRect: () => ({ width }) };
    const context = vm.createContext({ document, devicePixelRatio: 2,
        Path2D: class { moveTo() {} lineTo() {} },
        requestAnimationFrame: fn => { const id = ++nextFrame; pending.set(id, fn); return id; },
        cancelAnimationFrame: id => pending.delete(id) });
    vm.runInContext(source, context);
    const app = context.FlowWalk.mount({ canvas, prefix, reduced, gamma });
    function frame(milliseconds = 50) {
        now += milliseconds;
        const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(fn => fn(now));
    }
    const button = (name, value) => elements.get('[data-' + prefix + '-' + name + '="' + value + '"]');
    const position = () => ({ steps: canvas.dataset.steps, x: canvas.dataset.x, y: canvas.dataset.y, seed: canvas.dataset.seed });
    return { canvas, document, app, pending, frame, button, position };
}

const h = harness();
assert.equal(h.pending.size, 0, 'Inactive studies mount without advancing');
assert.equal(+h.canvas.dataset.steps, 0);
h.app.resume(); assert.equal(h.pending.size, 1);
h.frame(); h.frame(); assert.equal(+h.canvas.dataset.steps, 30);
const early = h.position();
h.button('run', 'pause').fire('click'); assert.equal(h.pending.size, 0);
h.app.pause(); h.app.resume(); h.frame();
assert.deepEqual(h.position(), early, 'Returning to a study preserves the user’s Pause');
assert.equal(h.pending.size, 0);
h.button('run', 'pause').fire('click'); h.frame(); h.frame();
assert.equal(+h.canvas.dataset.steps, 60);
h.app.pause(); const offscreen = h.position(); h.frame();
assert.deepEqual(h.position(), offscreen, 'Hidden studies do not advance');
h.app.resume(); h.frame(30000); assert.deepEqual(h.position(), offscreen, 'Resume discards hidden wall-clock time');
h.frame(); assert.equal(+h.canvas.dataset.steps, 90);
for (let i = 0; i < 150; i++) {
    const before = +h.canvas.dataset.steps; h.frame();
    assert(+h.canvas.dataset.steps > before, 'Playback continues instead of freezing at a fixed endpoint');
    assert.equal(h.canvas.dataset.seed, early.seed); assert.equal(+h.canvas.dataset.cameraHalf, 6);
}
h.button('view', 'whole').fire('click'); assert.equal(h.canvas.dataset.view, 'whole');
h.button('view', 'follow').fire('click'); assert.equal(+h.canvas.dataset.cameraHalf, 6);
h.button('run', 'replay').fire('click'); assert.equal(+h.canvas.dataset.steps, 0);
h.frame(); h.frame(); assert.deepEqual(h.position(), early, 'Replay reproduces the same field and Brownian increments');
h.button('run', 'new').fire('click'); h.frame(); h.frame();
assert.notEqual(h.canvas.dataset.seed, early.seed); assert.notEqual(h.canvas.dataset.x, early.x);
h.button('speed', '3').fire('click');
const beforeFast = +h.canvas.dataset.steps; h.frame(); assert.equal(+h.canvas.dataset.steps - beforeFast, 90);
h.app.pause(); h.document.hidden = true; h.app.resume(); assert.equal(h.pending.size, 0);
h.document.hidden = false; h.app.resume(); assert.equal(h.pending.size, 1); h.app.pause();

const r = harness({ reduced: true, width: 350, gamma: .10 });
assert.equal(r.canvas.width, 700); assert.equal(r.canvas.height, 735);
assert.equal(+r.canvas.dataset.steps, 3500, 'Reduced motion starts with a useful static path');
r.app.resume(); assert.equal(r.pending.size, 0);
r.button('run', 'pause').fire('click'); assert.equal(r.pending.size, 1, 'Explicit Play works with reduced motion');
r.frame(); r.frame(); assert.equal(+r.canvas.dataset.steps, 3530);
r.button('run', 'pause').fire('click');
r.button('gamma', '0.15').fire('click'); assert.equal(r.pending.size, 0, 'Changing the model preserves an explicit Pause');
r.app.pause(); r.app.resume(); assert.equal(r.pending.size, 0);
r.button('run', 'replay').fire('click'); assert.equal(+r.canvas.dataset.steps, 0);
assert.equal(r.pending.size, 1, 'Explicit Replay starts the walk even with reduced motion');
r.frame(); r.frame(); assert.equal(+r.canvas.dataset.steps, 30); r.app.pause();

console.log('Flow walk checks passed: incompressible periodic drift, gamma amplitudes, Euler noise, deterministic batching and replay, bounded history, camera containment, continuous motion, controls and reduced motion.');
