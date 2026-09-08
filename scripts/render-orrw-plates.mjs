#!/usr/bin/env node
/* Rebuild the 3:2 gallery covers from the same exact walk as the live study. */
import fs from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../gallery/orrw.js', import.meta.url),'utf8'), context);
const model = context.OrrwGallery;
const run = model.generate({beta:16, steps:24000});
const width=900, height=600, camera=model.cameraAt(run,run.steps,width,height);
const sx=x=>+(width/2+(x-camera.x)*camera.scale).toFixed(2);
const sy=y=>+(height/2-(y-camera.y)*camera.scale).toFixed(2);
const paths=['','','',''];
run.edges.forEach((e,i)=>paths[Math.min(3,Math.floor(4*i/run.edges.length))]+=`M${sx(e.x)} ${sy(e.y)}L${sx(e.nx)} ${sy(e.ny)}`);
let recent='';
for(let i=run.steps-32;i<=run.steps;i++) recent+=`${i===run.steps-32?'M':'L'}${sx(run.path[2*i])} ${sy(run.path[2*i+1])}`;
for(const theme of ['paper','void']) {
 const dark=theme==='void',colors=dark?['#31546F','#3D819A','#69BBC2','#A2DED3']:['#9CBAC1','#5F99A5','#317786','#205A67'];
 const bg=dark?'#101219':'#F4F0E6',middle=dark?'#17212B':'#E6EADF',gold=dark?'#F1C877':'#B66537';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" role="img" aria-labelledby="title desc"><title id="title">Once-reinforced random walk</title><desc id="desc">The edges crossed by a 24,000-step sample on the square lattice with reinforcement 16. Pale edges were discovered later; gold marks the last 32 steps and the current walker.</desc><defs><radialGradient id="bg"><stop stop-color="${middle}"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs><path fill="url(#bg)" d="M0 0H900V600H0Z"/><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${Math.max(1.5,Math.min(8,camera.scale*.32)).toFixed(2)}">${paths.map((p,i)=>`<path stroke="${colors[i]}" d="${p}"/>`).join('')}<path stroke="${gold}" d="${recent}" stroke-width="${Math.max(2,Math.min(7,camera.scale*.24)).toFixed(2)}"/></g><circle cx="${sx(0)}" cy="${sy(0)}" r="3.5" fill="${bg}" stroke="${dark?'#CBD2D6':'#4D6470'}"/><circle cx="${sx(run.path.at(-2))}" cy="${sy(run.path.at(-1))}" r="5" fill="${gold}" stroke="${bg}"/></svg>\n`;
 fs.writeFileSync(new URL(`../gallery/plates/p-orrw-wall-${theme}.svg`, import.meta.url),svg);
}
console.log({edges:run.edges.length,range:run.range.at(-1),bounds:Array.from(run.bounds.slice(-4)),camera});
