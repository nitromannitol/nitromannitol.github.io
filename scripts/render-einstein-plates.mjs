#!/usr/bin/env node
/* Render the gallery wall from the gallery's actual potential, gradient and
   Gaussian generator. Only the presentation lives here; the SDE is shared. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'gallery/gallery.js'), 'utf8');
function helper(name) {
    const start = source.indexOf('function ' + name + '(');
    if (start < 0) throw new Error('Missing gallery helper: ' + name);
    const open = source.indexOf('{', start);
    let depth = 1, end = open + 1;
    for (; depth && end < source.length; end++) {
        if (source[end] === '{') depth++;
        if (source[end] === '}') depth--;
    }
    if (depth) throw new Error('Unclosed gallery helper: ' + name);
    return source.slice(start, end);
}
const shared = vm.runInNewContext(
    ['einsteinPotential', 'einsteinGradient', 'einsteinNoise'].map(helper).join('\n') +
    '\n({potential:einsteinPotential,gradient:einsteinGradient,noise:einsteinNoise})');
const maker = source.slice(source.indexOf('makers.einstein = function'));
const M = Number(maker.match(/\bM = (\d+)/)?.[1]);
const dt = Number(maker.match(/\bDT = ([.\d]+)/)?.[1]);
const lambda = Number(maker.match(/let lambda = ([.\d]+)/)?.[1]);
const seed = Number(maker.match(/sampleSeed = (0x[0-9a-f]+)/i)?.[1]);
if (!(M > 0 && dt > 0 && lambda > 0 && seed > 0)) throw new Error('Gallery simulation constants changed');
const time = 1 / (lambda * lambda), steps = Math.round(time / dt);
const noise = shared.noise(seed), sq = Math.sqrt(dt), gradient = [0, 0];
const sides = [0, 1].map(() => ({x:new Float64Array(M),y:new Float64Array(M),trails:[[],[],[]]}));
for (let k = 1; k <= steps; k++) {
    for (let i = 0; i < M; i++) {
        const zx = sq * noise(), zy = sq * noise();
        sides.forEach((s, side) => {
            shared.gradient(s.x[i], s.y[i], gradient);
            s.x[i] += ((side ? lambda : 0) - gradient[0]) * dt + zx;
            s.y[i] += -gradient[1] * dt + zy;
            if (i < 3 && k >= steps - Math.round(6 / dt) && k % 4 === 0)
                s.trails[i].push([s.x[i], s.y[i]]);
        });
    }
}
for (const s of sides) {
    s.mx = s.x.reduce((a, x) => a + x / M, 0);
    s.my = s.y.reduce((a, y) => a + y / M, 0);
    let vx = 0, vy = 0, cov = 0;
    for (let i = 0; i < M; i++) {
        const x = s.x[i] - s.mx, y = s.y[i] - s.my;
        vx += x*x/(M-1); vy += y*y/(M-1); cov += x*y/(M-1);
    }
    const delta = Math.hypot(vx-vy, 2*cov);
    s.major = Math.sqrt((vx+vy+delta)/2); s.minor = Math.sqrt((vx+vy-delta)/2);
    s.angle = -Math.atan2(2*cov, vx-vy)*90/Math.PI;
}

const W = 1200, H = 600, panels = [{x:34,y:50,w:546,h:506},{x:620,y:50,w:546,h:506}];
const allX = sides.flatMap(s => Array.from(s.x));
const allY = sides.flatMap(s => Array.from(s.y));
const lowX = Math.min(0,...allX), highX = Math.max(0,...allX);
const lowY = Math.min(0,...allY), highY = Math.max(0,...allY);
const camera = {x:(lowX+highX)/2,y:(lowY+highY)/2};
const scale = Math.min(478/(highX-lowX),428/(highY-lowY));
const f = n => Number(n.toFixed(2));
function transform(side,x,y) {
    const p=panels[side];
    return [p.x+p.w/2+(x-camera.x)*scale,p.y+p.h/2-(y-camera.y)*scale];
}
function contour(side) {
    const p=panels[side], N=108, values=[], level=.45;
    for(let y=0;y<=N;y++) for(let x=0;x<=N;x++)
        values.push(shared.potential(camera.x+(x/N-.5)*p.w/scale,camera.y-(y/N-.5)*p.h/scale));
    const parts=[];
    for(let y=0;y<N;y++) for(let x=0;x<N;x++) {
        const k=y*(N+1)+x, v=[values[k],values[k+1],values[k+N+2],values[k+N+1]];
        const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]], cuts=[];
        for(let e=0;e<4;e++) {
            const next=(e+1)%4;
            if((v[e]<level)===(v[next]<level))continue;
            const q=(level-v[e])/(v[next]-v[e]);
            cuts.push([p.x+(corners[e][0]+q*(corners[next][0]-corners[e][0]))/N*p.w,
                       p.y+(corners[e][1]+q*(corners[next][1]-corners[e][1]))/N*p.h]);
        }
        for(let j=0;j+1<cuts.length;j+=2)
            parts.push('M'+cuts[j].map(f).join(',')+'L'+cuts[j+1].map(f).join(','));
    }
    return parts.join('');
}
const contours = [contour(0), contour(1)];
for(const theme of ['paper','void']) {
    const dark=theme==='void', ground=dark?'#15131A':'#F2EDE2';
    const colors=dark?['#69C8F2','#F2BF62']:['#267CA6','#B97813'];
    const ink=dark?'#F2EDE2':'#24232D', quiet=dark?'#A6A0B1':'#807A70';
    const out=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">`,
        '<title id="title">The same noise, with and without a small force</title>',
        `<desc id="desc">${M} paired Euler–Maruyama diffusions at time ${time}, step ${dt}, force ${lambda}, seed ${seed}. Both ensembles start at the origin and share their Gaussian increments pairwise. The potential and noise generator are read from gallery.js. Blue is unforced; gold is forced to the right. Both panels use exactly the same camera and scale. Dots are actual endpoints; short trails retain every fourth sample of the final six time units for the first three particles. Dashed ellipses show one empirical standard deviation, and crosses mark the empirical centroids. The hollow ring is the common starting position. Faint lines are one numerical contour of the same potential.</desc>`,
        `<rect width="${W}" height="${H}" fill="${ground}"/>`,
        `<path d="M600,68V534" stroke="${quiet}" stroke-opacity=".18"/>`];
    sides.forEach((s,side)=>{
        const color=colors[side], p=panels[side], tx=(x,y)=>transform(side,x,y);
        const [ox,oy]=tx(0,0),[mx,my]=tx(s.mx,s.my);
        out.push(`<defs><clipPath id="panel${side}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath></defs><g clip-path="url(#panel${side})">`);
        out.push(`<path d="${contours[side]}" fill="none" stroke="${quiet}" stroke-width="1.1" opacity="${dark?.11:.12}"/>`);
        out.push(`<ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(s.major*scale)}" ry="${f(s.minor*scale)}" transform="rotate(${f(s.angle)} ${f(mx)} ${f(my)})" fill="${color}" fill-opacity=".045" stroke="${color}" stroke-opacity=".7" stroke-width="2.5" stroke-dasharray="9 8"/>`);
        out.push(`<path d="M${f(ox)},${p.y+27}V${p.y+p.h-24}" stroke="${quiet}" stroke-width="1.5" stroke-dasharray="3 9" opacity=".28"/>`);
        s.trails.forEach((trail,j)=>{
            const d=trail.map((q,k)=>(k?'L':'M')+tx(...q).map(f).join(',')).join('');
            out.push(`<path d="${d}" fill="none" stroke="${ground}" stroke-width="${j?5:7}" stroke-linejoin="round" stroke-linecap="round"/>`);
            out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${j?2.6:4}" opacity="${j?.5:.95}" stroke-linejoin="round" stroke-linecap="round"/>`);
        });
        for(let i=M-1;i>=0;i--) {
            const [x,y]=tx(s.x[i],s.y[i]);
            out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${i<3?7.3:4.6}" fill="${color}" fill-opacity="${i<3?1:.74}"${i<3?' stroke="'+ground+'" stroke-width="2"':''}/>`);
        }
        out.push(`<circle cx="${f(ox)}" cy="${f(oy)}" r="6" fill="${ground}" stroke="${quiet}" stroke-width="2.2"/>`);
        out.push(`<path d="M${f(mx-8)},${f(my)}H${f(mx+8)}M${f(mx)},${f(my-8)}V${f(my+8)}" stroke="${ground}" stroke-width="7"/><path d="M${f(mx-8)},${f(my)}H${f(mx+8)}M${f(mx)},${f(my-8)}V${f(my+8)}" stroke="${ink}" stroke-width="3"/>`);
        out.push('</g>');
        if(side) out.push(`<path d="M918,37H1011M996,25L1012,37L996,49" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
    });
    out.push('</svg>');
    fs.writeFileSync(path.join(root,`gallery/plates/p-einstein-ensemble-${theme}.svg`),out.join('\n')+'\n');
}
console.log(JSON.stringify({particles:M,time,dt,lambda,seed,means:sides.map(s=>[s.mx,s.my]),scale},null,2));
