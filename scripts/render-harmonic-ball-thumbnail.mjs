#!/usr/bin/env node
/* Precompute the harmonic-ball publication thumbnail.  This runs the exact
   computation the thumbnail used to do in the browser (about 3 s): a 61 x 61
   torus Gaussian field, the normalized chaos density exp(gamma h - gamma^2 Var/2)
   as capacity, and divisible-sandpile growth from the centre in 100 equal mass
   increments, recording the increment at which each site first topples.  It
   prints the two strings that makeHarmonicBall in thumbnail-animations.js
   decodes: the arrival levels (one byte per site, 255 = never) and the sign of
   the field (one bit per site), both base64. */
const TAU = Math.PI * 2;
function randomFactory(seed) {
    let s = seed >>> 0;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}
function gaussian(rand) {
    const u = Math.max(1e-9, rand()), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}
const N = 61, count = N * N, c = N >> 1, rand = randomFactory(0x4c514742), modes = [];
for (let ky = -8; ky <= 8; ky++) for (let kx = -8; kx <= 8; kx++) if (kx || ky) {
    const r = Math.hypot(kx, ky); modes.push([kx, ky, gaussian(rand) / r, gaussian(rand) / r]);
}
const field = new Float64Array(count); let mean = 0, variance = 0;
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let h = 0;
    for (const m of modes) { const a = TAU * (m[0] * x + m[1] * y) / N; h += m[2] * Math.cos(a) + m[3] * Math.sin(a); }
    field[y * N + x] = h; mean += h;
}
mean /= count; for (let i = 0; i < count; i++) { field[i] -= mean; variance += field[i] * field[i]; } variance /= count;
const capacity = new Float64Array(count), gamma = Math.SQRT2, scale = .78 / Math.sqrt(variance); let capMean = 0;
for (let i = 0; i < count; i++) {
    field[i] *= scale; capacity[i] = Math.exp(gamma * field[i] - .5 * gamma * gamma * scale * scale * variance); capMean += capacity[i];
}
capMean /= count; for (let i = 0; i < count; i++) capacity[i] /= capMean;
const mass = new Float64Array(count), arrival = new Int16Array(count); arrival.fill(-1);
const levels = 100, totalMass = 1250, src = c * N + c;
for (let level = 0; level < levels; level++) {
    mass[src] += totalMass / levels; const q = [src], inQ = new Uint8Array(count); inQ[src] = 1;
    for (let head = 0; head < q.length; head++) {
        const i = q[head]; inQ[i] = 0; const excess = mass[i] - capacity[i]; if (excess <= 1e-8) continue;
        mass[i] = capacity[i]; if (arrival[i] < 0) arrival[i] = level;
        const x = i % N, y = (i / N) | 0, share = excess * .25, ns = [x ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y ? i - N : -1, y < N - 1 ? i + N : -1];
        for (const j of ns) if (j >= 0) { mass[j] += share; if (mass[j] > capacity[j] + 1e-8 && !inQ[j]) { inQ[j] = 1; q.push(j); } }
    }
}
const arrivalBytes = Buffer.from(Array.from(arrival, a => a < 0 ? 255 : a));
const signBytes = Buffer.alloc((count + 7) >> 3);
for (let i = 0; i < count; i++) if (field[i] > 0) signBytes[i >> 3] |= 1 << (i & 7);
console.log(JSON.stringify({ arrival: arrivalBytes.toString('base64'), positive: signBytes.toString('base64') }));
