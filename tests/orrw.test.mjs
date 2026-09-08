#!/usr/bin/env node
/* The simulator is the exact finite-history law from the paper. Check moves,
   the permanent undirected reinforcement rule, counts and replay semantics. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../gallery/orrw.js', import.meta.url), 'utf8'), context);
const model = context.OrrwGallery;
assert.equal(model.edgeKey(2,3,2,4), model.edgeKey(2,4,2,3), 'An edge is undirected.');
const oneEdge = new Set([model.edgeKey(0,0,1,0)]);
assert.deepEqual(Array.from(model.weightsAt(0,0,oneEdge,16)), [16,1,1,1]);
assert.deepEqual(Array.from(model.weightsAt(1,0,oneEdge,16)), [1,16,1,1]);
assert.deepEqual(Array.from(model.weightsAt(0,0,oneEdge,1)), [1,1,1,1]);
const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
for (const beta of [1,4,16]) {
    const run = model.generate({beta, seed:123, steps:24000});
    assert.deepEqual(model.generate({beta, seed:123, steps:24000}), run, 'Replay must preserve every step.');
    assert.notDeepEqual(model.generate({beta, seed:124, steps:24000}).path, run.path, 'A new seed changes the walk.');
    const sites = new Set(['0,0']), edges = new Set(), rng = model.random(123);
    let loX=0,hiX=0,loY=0,hiY=0;
    assert.equal(run.range[0],1); assert.equal(run.edgeCount[0],0);
    for (let n=1; n<=run.steps; n++) {
        const x=run.path[2*n-2],y=run.path[2*n-1],nx=run.path[2*n],ny=run.path[2*n+1];
        assert.equal(Math.abs(x-nx)+Math.abs(y-ny),1,'Every move is a nearest-neighbour step.');
        // Reconstruct the conditional law independently from prior crossings.
        const weights=dirs.map(([dx,dy])=>edges.has(model.edgeKey(x,y,x+dx,y+dy))?beta:1);
        let u=rng()*weights.reduce((a,b)=>a+b,0),choice=3;
        for(let i=0;i<4;i++){ if(u<weights[i]){choice=i;break;} u-=weights[i]; }
        assert.equal(nx,x+dirs[choice][0]); assert.equal(ny,y+dirs[choice][1]);
        const key=model.edgeKey(x,y,nx,ny),first=!edges.has(key); edges.add(key); sites.add(nx+','+ny);
        assert.equal(run.range[n],sites.size); assert.equal(run.edgeCount[n],edges.size);
        assert([0,1].includes(run.range[n]-run.range[n-1]), 'At most one new site appears per step.');
        const e=run.edges[run.edgeAt[n]];
        assert.equal(model.edgeKey(e.x,e.y,e.nx,e.ny),key);
        assert(e.born<=n); if(first) assert.equal(e.born,n);
        loX=Math.min(loX,nx); hiX=Math.max(hiX,nx); loY=Math.min(loY,ny); hiY=Math.max(hiY,ny);
        assert.deepEqual(Array.from(run.bounds.slice(4*n,4*n+4)),[loX,hiX,loY,hiY]);
    }
    assert.equal(run.edges.length,edges.size);
    assert(run.range.at(-1)<=run.edges.length+1);
}
const zero=model.generate({steps:0});
assert.equal(zero.range[0],1); assert.equal(zero.edges.length,0);
assert.throws(()=>model.generate({beta:.9}),/at least one/);
assert.throws(()=>model.generate({steps:1.5}),/Invalid step/);
console.log('ORRW: exact conditional law, undirected reinforcement, step/range/edge counts, bounds and deterministic replay passed.');

function playback({ reduced = true } = {}) {
    const frames = new Map(), elements = new Map(); let frameId=0, observer, visibility;
    function element(dataset = {}) {
        const events = new Map();
        return { dataset, textContent:'', value:'0', attributes:new Map(),
            classList:{toggle(){}}, setAttribute(name,value){this.attributes.set(name,value);},
            addEventListener(name,fn){events.set(name,fn);}, fire(name){events.get(name)?.();} };
    }
    for (const id of ['step','range','edges','time','note']) elements.set('#orrw-'+id,element());
    const controls=['pause','step','replay','new'].map(value=>element({orrwRun:value}));
    const betas=[1,4,16].map(value=>element({orrwBeta:String(value)}));
    elements.set('[data-orrw-run="pause"]',controls[0]);
    const scope={ querySelector:selector=>elements.get(selector),
        querySelectorAll:selector=>selector==='[data-orrw-run]'?controls:betas };
    const gradient={addColorStop(){}},context=new Proxy({createRadialGradient:()=>gradient},
        {get(target,key){return key in target?target[key]:()=>{};}});
    const canvas={getContext:()=>context,closest:()=>scope,getBoundingClientRect:()=>({width:350}),
        parentElement:{},style:{}};
    const document={hidden:false,getElementById:()=>canvas,
        addEventListener(type,fn){if(type==='visibilitychange')visibility=fn;}};
    const sandbox=vm.createContext({document,devicePixelRatio:1,matchMedia:()=>({matches:reduced}),
        requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},
        cancelAnimationFrame(id){frames.delete(id);},
        ResizeObserver:class{observe(){}},
        IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}}});
    vm.runInContext(fs.readFileSync(new URL('../gallery/orrw.js',import.meta.url),'utf8'),sandbox);
    const instance=sandbox.OrrwGallery.create(); let time=100;
    return {instance,canvas,frames,document,
        count:()=>Number(elements.get('#orrw-step').textContent.replaceAll(',','')),
        click:action=>controls.find(e=>e.dataset.orrwRun===action).fire('click'),
        beta:value=>betas.find(e=>Number(e.dataset.orrwBeta)===value).fire('click'),
        seek(value){elements.get('#orrw-time').value=String(value);elements.get('#orrw-time').fire('input');},
        inView(value){observer([{isIntersecting:value}]);},
        hidden(value){document.hidden=value;visibility();},
        tick(ms=16){time+=ms;const pending=Array.from(frames.values());frames.clear();pending.forEach(fn=>fn(time));} };
}
const player=playback();
assert.equal(player.count(),7000);assert.equal(player.frames.size,0,'Reduced motion starts paused.');
assert.equal(player.canvas.width,700,'Canvas retains at least two pixels per CSS pixel.');
player.click('pause');player.tick();player.tick(50);assert(player.count()>7000,'Explicit Play works with reduced motion.');
player.click('pause');const paused=player.count();assert.equal(player.frames.size,0);
player.tick(70);assert.equal(player.count(),paused);player.click('step');assert.equal(player.count(),paused+1);
player.click('replay');assert.equal(player.count(),0);assert.equal(player.frames.size,1,'Explicit Replay starts playback.');
player.tick();player.tick(60);assert(player.count()>0);
player.seek(16000);assert.equal(player.count(),16000);assert.equal(player.frames.size,0);
player.beta(16);assert.equal(player.count(),7000);assert.equal(player.frames.size,0);
player.click('pause');player.tick();player.tick(40);const moving=player.count();
player.inView(false);assert.equal(player.frames.size,0);player.tick();assert.equal(player.count(),moving);
player.inView(true);assert.equal(player.frames.size,1);
player.hidden(true);assert.equal(player.frames.size,0);player.hidden(false);assert.equal(player.frames.size,1);
player.instance.pause();assert.equal(player.frames.size,0);player.instance.resume();assert.equal(player.frames.size,1);
player.click('pause');player.instance.pause();player.instance.resume();assert.equal(player.frames.size,0,'User pause survives lifecycle changes.');
console.log('ORRW playback: reduced motion, explicit Play/Replay, one-step control, scrubbing, visibility and retained user pause passed.');
