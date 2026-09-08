#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../gallery/manhattan.js', import.meta.url), 'utf8');
const modelContext = vm.createContext({});
vm.runInContext(source, modelContext);
const { generate, orientation } = modelContext.ManhattanGallery;
const run = generate({ seed: 73, steps: 20000 });
assert.deepEqual(generate({ seed: 73, steps: 20000 }), run, 'Replay exactly reproduces an environment and every coin choice');
assert.notDeepEqual(generate({ seed: 74, steps: 20000 }).x, run.x, 'A new field produces a fresh sample');
for (const seed of [0, 1, 73, 0xffffffff]) {
    const r = generate({ seed, steps: 20000 }), seen = new Set(['0,0']);
    let horizontal = 0, returns = 0;
    for (let n = 1; n <= r.steps; n++) {
        const dx = r.x[n] - r.x[n - 1], dy = r.y[n] - r.y[n - 1];
        assert.equal(Math.abs(dx) + Math.abs(dy), 1, 'Every move is a single nearest-neighbour step');
        if (dx) { horizontal++; assert.equal(dx, orientation(seed, 0, r.y[n - 1]), 'Every horizontal move respects its entire row'); }
        if (dy) assert.equal(dy, orientation(seed, 1, r.x[n - 1]), 'Every vertical move respects its entire column');
        seen.add(r.x[n] + ',' + r.y[n]);
        if (!r.x[n] && !r.y[n]) returns++;
        assert.equal(r.visited[n], seen.size); assert.equal(r.returns[n], returns);
        assert(r.x[n] >= r.xMin[n] && r.x[n] <= r.xMax[n] && r.y[n] >= r.yMin[n] && r.y[n] <= r.yMax[n]);
    }
    assert(horizontal > 9500 && horizontal < 10500, 'The seeded axis stream remains consistent with fair choices');
}
function harness(reduced = false) {
    const noop = () => {}, events = new Map(), pending = new Map(); let frameId = 0;
    function element(dataset = {}) {
        const listeners = new Map();
        return { dataset, style: {}, textContent: '', value: 0, attributes: {}, classList: { toggle: noop },
            setAttribute(k,v) { this.attributes[k] = v; }, addEventListener(k, fn) { listeners.set(k,fn); }, fire(k) { listeners.get(k)?.(); } };
    }
    const groups = {
        '[data-manhattan-run]': ['pause','step','replay','new'].map(manhattanRun => element({manhattanRun})),
        '[data-manhattan-view]': ['follow','whole'].map(manhattanView => element({manhattanView})),
        '[data-manhattan-pace]': ['watch','explore'].map(manhattanPace => element({manhattanPace})),
    };
    const dom = new Map();
    for (const id of ['steps','visited','distance','note','time']) dom.set('#manhattan-' + id, element());
    const ctx = new Proxy({}, { get(target, name) { return target[name] || noop; }, set(target, name, value) { target[name] = value; return true; } });
    const canvas = Object.assign(element(), { width: 1800, height: 1320, getContext: () => ctx, getBoundingClientRect: () => ({width:900}), closest: () => document });
    dom.set('#manhattan-canvas', canvas); dom.set('[data-manhattan-run="pause"]', groups['[data-manhattan-run]'][0]);
    const document = { hidden: false, querySelector: s => dom.get(s), querySelectorAll: s => groups[s] || [], addEventListener: (k,fn) => events.set(k,fn) };
    const context = vm.createContext({ document, matchMedia: () => ({matches:reduced,addEventListener:noop}), devicePixelRatio:2,
        requestAnimationFrame: fn => { const id = ++frameId; pending.set(id,fn); return id; }, cancelAnimationFrame: id => pending.delete(id), addEventListener: noop });
    vm.runInContext(source, context);
    const app = context.ManhattanGallery.create();
    function advance(t) { const fns = [...pending.values()]; pending.clear(); fns.forEach(fn => fn(t)); }
    const button = action => groups['[data-manhattan-run]'].find(b => b.dataset.manhattanRun === action);
    return { app, pending, dom, button, advance, events, document, groups };
}
const h = harness();
assert.equal(h.pending.size,0,'A hidden instrument mounts without running');
h.app.resume(); assert.equal(h.pending.size,1);
h.advance(100); h.advance(170); assert.equal(h.dom.get('#manhattan-steps').textContent,'1');
h.button('pause').fire('click'); assert.equal(h.pending.size,0);
h.app.pause(); h.app.resume(); assert.equal(h.pending.size,0,'Visibility must not override explicit Pause');
h.button('step').fire('click'); assert.equal(h.dom.get('#manhattan-steps').textContent,'2'); assert.equal(h.pending.size,0);
h.button('replay').fire('click'); assert.equal(h.dom.get('#manhattan-steps').textContent,'0'); assert.equal(h.pending.size,1,'Explicit Replay restarts playback');
h.document.hidden = true; h.events.get('visibilitychange')(); assert.equal(h.pending.size,0);
h.document.hidden = false; h.events.get('visibilitychange')(); assert.equal(h.pending.size,1);
h.dom.get('#manhattan-time').value = '20000'; h.dom.get('#manhattan-time').fire('input');
assert.equal(h.dom.get('#manhattan-steps').textContent,'20,000'); assert.equal(h.pending.size,0);
h.button('pause').fire('click'); assert.equal(h.dom.get('#manhattan-steps').textContent,'0'); assert.equal(h.pending.size,1,'Play after the final frame starts replay immediately');
h.app.pause(); assert.equal(h.pending.size,0);
const r = harness(true); r.app.resume(); assert.equal(r.pending.size,0); assert.equal(r.dom.get('#manhattan-steps').textContent,'280');
r.button('pause').fire('click'); assert.equal(r.pending.size,1,'Reduced motion allows explicit Play');
r.button('pause').fire('click'); r.button('replay').fire('click'); assert.equal(r.pending.size,1,'Reduced motion allows explicit Replay');
console.log('Manhattan: legal moves, whole-line orientations, deterministic replay, readouts, and playback lifecycle passed.');
