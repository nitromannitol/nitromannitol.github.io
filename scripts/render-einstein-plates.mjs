#!/usr/bin/env node
/* Render the two gallery covers from the shared, actual diffusion histories.
 * Presentation only: integration, noise, and statistics live in einstein-motion.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'einstein-motion.js'), 'utf8'), context,
    { filename: 'einstein-motion.js' });
const run = context.EinsteinMotion.generate({ force: .125, seed: 0x4e554c4c, pairs: 32, samples: 900 });

const f = n => Number(n.toFixed(2));
const last = run.samples - 1;

const formats = [
    { theme: 'paper', W: 1200, H: 600, filename: 'p-einstein-ensemble-paper.svg' },
    { theme: 'void', W: 1200, H: 600, filename: 'p-einstein-ensemble-void.svg' },
    { theme: 'paper', W: 600, H: 600, filename: 'p-einstein-thumbnail.svg' }
];
for (const { theme, W, H, filename } of formats) {
    const compact = W === H;
    const left = W * (compact ? .07 : .06), right = W * .95;
    const top = H * (compact ? .075 : .07), bottom = H * (compact ? .925 : .93);
    const x = s => left + (right - left) * s / (run.samples - 1);
    const y = value => bottom - (value - run.yMin) / (run.yMax - run.yMin) * (bottom - top);
    const point = (series, s) => f(x(s)) + ',' + f(y(series[s]));
    const line = series => 'M' + series.map((_, s) => point(series, s)).join(' ');
    const band = line(run.mean0) + 'L' + run.mean1.map((_, s) =>
        point(run.mean1, run.samples - 1 - s)).join(' ') + 'Z';
    const dark = theme === 'void', ground = dark ? '#15141c' : '#faf9f5';
    const colors = dark ? ['#66d9ff', '#ffc565'] : ['#087491', '#b96308'];
    const ink = dark ? '#eeeae4' : '#292b35';
    const out = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc" data-force="${run.force}" data-pairs="${run.pairs}" data-samples="${run.samples}">`,
        '<title id="title">A small force separates two families of diffusion histories</title>',
        `<desc id="desc">Time runs from left to right, from zero to ${run.duration}; height shows horizontal displacement, with positive displacement upward. Cyan threads are ${run.pairs} unforced diffusion histories; amber threads are their forced copies with force ${run.force}. Each pair starts at the origin and receives exactly the same Brownian increments. The simulation in einstein-motion.js uses unit Brownian noise, drift minus the gradient of its fixed smooth scalar potential, and Euler–Maruyama step ${run.dt}; ${run.samples} equally spaced observations use linear interpolation between neighboring integration steps. Both families share one fixed displacement scale, computed from the complete histories. Bright curves are the actual empirical means; dots mark final positions. The smooth potential illustrates the mechanism and is not a finite-range random environment. The image does not assert finite-time equality of mobility and variance rate or demonstrate the theorem's convergence rate.</desc>`,
        '<defs><linearGradient id="wash" x1="0%" y1="100%" x2="100%" y2="0%">',
        `<stop offset="0" stop-color="${colors[0]}" stop-opacity="${dark ? .032 : .022}"/>`,
        `<stop offset="1" stop-color="${colors[1]}" stop-opacity="${dark ? .024 : .018}"/>`,
        '</linearGradient></defs>',
        `<rect width="${W}" height="${H}" fill="${ground}"/>`,
        `<rect width="${W}" height="${H}" fill="url(#wash)"/>`,
        `<path d="M${left},${f(y(0))}H${right}" fill="none" stroke="${ink}" stroke-width="1.5" opacity="${dark ? .14 : .18}"/>`,
        `<path d="M${right},${top}V${bottom}" fill="none" stroke="${ink}" stroke-width="1.5" opacity="${dark ? .13 : .16}"/>`,
        `<path d="${band}" fill="${colors[1]}" opacity="${dark ? .045 : .035}"/>`
    ];
    [run.x0, run.x1].forEach((histories, group) => {
        const color = colors[group];
        out.push(`<g fill="none" stroke="${color}" stroke-width="1.65" stroke-opacity=".26" stroke-linejoin="round" stroke-linecap="round">`);
        for (const series of histories) out.push(`<path d="${line(series)}"/>`);
        out.push('</g>');
        out.push(`<path d="${line(histories[0])}" fill="none" stroke="${color}" stroke-width="2.33" opacity=".58" stroke-linejoin="round" stroke-linecap="round"/>`);
        out.push(`<g fill="${color}" fill-opacity=".64">`);
        for (const series of histories) out.push(`<circle cx="${right}" cy="${f(y(series[last]))}" r="3"/>`);
        out.push('</g>');
    });
    [run.mean0, run.mean1].forEach((series, group) => {
        const color = colors[group], d = line(series), endY = f(y(series[last]));
        out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="13.5" opacity="${dark ? .12 : .08}" stroke-linejoin="round" stroke-linecap="round"/>`);
        out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="4.35" stroke-linejoin="round" stroke-linecap="round"/>`);
        out.push(`<circle cx="${right}" cy="${endY}" r="18" fill="${color}" fill-opacity="${dark ? .09 : .07}"/>`);
        out.push(`<circle cx="${right}" cy="${endY}" r="6.6" fill="${color}"/>`);
        out.push(`<circle cx="${right}" cy="${endY}" r="2.1" fill="${dark ? '#fff9e9' : '#fff'}" fill-opacity=".88"/>`);
    });
    out.push(`<circle cx="${left}" cy="${f(y(0))}" r="4.5" fill="${ink}" fill-opacity=".85"/>`);
    out.push('</svg>');
    fs.writeFileSync(path.join(root, 'gallery/plates', filename), out.join('\n') + '\n');
}
console.log(JSON.stringify({
    pairs: run.pairs, samples: run.samples, time: run.duration, dt: run.dt,
    force: run.force, seed: run.seed, displacementRange: [run.yMin, run.yMax],
    means: [run.mean0[last], run.mean1[last]],
    diffusion: run.diffusion[last], mobility: run.mobility[last]
}, null, 2));
