/* High-resolution publication thumbnails. Each renderer depicts the model
   named by publications.js; the existing image remains the no-JS and
   reduced-motion fallback. */
(function () {
    'use strict';

    const DARK = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const C = DARK ? {
        bg: '#1E1E24', deep: 'rgba(58,54,68,.58)', slate: '#626176', bone: '#C9BFA8',
        ink: '#F6F1E6', grid: '#626176', cyan: '#A8D8E8', blue: '#4B8DB2',
        rose: '#B85C78', pink: '#B85C78', yellow: '#E2C25A', violet: '#8173EB',
        green: '#68C9AA'
    } : {
        bg: '#FFFFFF', deep: 'rgba(219,216,226,.58)', slate: '#777285', bone: '#655E53',
        ink: '#211D26', grid: '#A8A3AF', cyan: '#277D9B', blue: '#367A9F',
        rose: '#A43E61', pink: '#A43E61', yellow: '#B47D00', violet: '#5D4BCF',
        green: '#187D61'
    };
    const ORDER = DARK ? [[111,94,224],[204,121,167],[150,205,240],[255,248,232]]
                       : [[93,75,207],[174,62,97],[54,133,164],[55,49,58]];
    const TAU = Math.PI * 2;
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const mix = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
    const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

    function hash2(x, y, seed) {
        let z = (Math.imul((x | 0) + 0x51ed, 0x45d9f3b) ^
                 Math.imul((y | 0) + 0x7f4a, 0x119de1f3) ^ (seed | 0)) >>> 0;
        z = Math.imul(z ^ (z >>> 16), 0x45d9f3b) >>> 0;
        return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
    }

    function randomFactory(seed) {
        let s = seed >>> 0;
        return function () {
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
            return (s >>> 0) / 4294967296;
        };
    }

    function gaussian(rand) {
        const u = Math.max(1e-9, rand()), v = rand();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
    }

    function ground(ctx, W) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, W);
    }

    function fadeOut(ctx, W, amount) {
        ctx.save();
        ctx.globalAlpha = clamp(amount, 0, 1);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, W);
        ctx.restore();
    }

    function dot(ctx, x, y, r, fill, stroke, width) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
    }

    function rampColour(stops, q) {
        q = clamp(q, 0, 1) * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(q)), a = q - i;
        const x = stops[i], y = stops[i + 1];
        return `rgb(${Math.round(mix(x[0],y[0],a))},${Math.round(mix(x[1],y[1],a))},${Math.round(mix(x[2],y[2],a))})`;
    }

    function poissonQuantile(q, mean) {
        let k = 0, mass = Math.exp(-mean), cdf = mass;
        while (q > cdf && k < 16) { k++; mass *= mean / k; cdf += mass; }
        return k;
    }

    function arrow(ctx, x, y, angle, length, color, width) {
        const x2 = x + Math.cos(angle) * length, y2 = y + Math.sin(angle) * length;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(angle) * length * .35, y - Math.sin(angle) * length * .35);
        ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - Math.cos(angle - .55) * length * .38, y2 - Math.sin(angle - .55) * length * .38);
        ctx.lineTo(x2 - Math.cos(angle + .55) * length * .38, y2 - Math.sin(angle + .55) * length * .38);
        ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    }

    function trace(ctx, points, amount, color, width, transform) {
        if (!points.length || amount <= 0) return;
        const z = clamp(amount, 0, 1) * (points.length - 1), end = Math.floor(z), frac = z - end;
        ctx.beginPath();
        const p0 = transform ? transform(points[0]) : points[0]; ctx.moveTo(p0[0], p0[1]);
        for (let i = 1; i <= end; i++) {
            const p = transform ? transform(points[i]) : points[i]; ctx.lineTo(p[0], p[1]);
        }
        if (end < points.length - 1) {
            const a = points[end], b = points[end + 1], p = [mix(a[0], b[0], frac), mix(a[1], b[1], frac)];
            const q = transform ? transform(p) : p; ctx.lineTo(q[0], q[1]);
        }
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    }

    function currentPoint(points, amount) {
        const z = clamp(amount, 0, 1) * (points.length - 1), k = Math.min(points.length - 2, Math.floor(z)), a = z - k;
        return [mix(points[k][0], points[k + 1][0], a), mix(points[k][1], points[k + 1][1], a)];
    }

    function fitTransform(points, W, pad) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        points.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
        const scale = (W - 2 * pad) / Math.max(1, maxX - minX, maxY - minY);
        const ox = W / 2 - scale * (minX + maxX) / 2, oy = W / 2 - scale * (minY + maxY) / 2;
        return p => [ox + scale * p[0], oy + scale * p[1]];
    }

    function makeParking(ctx, W) {
        const n = 24, count = n * n, pad = 16, cell = (W - 2 * pad) / n;
        const rand = randomFactory(0x5041524b), spots = new Uint8Array(count);
        const occupied = new Uint8Array(count), visits = new Uint16Array(count), cars = [];
        for (let i = 0; i < count; i++) {
            if (hash2(i % n, (i / n) | 0, 0x5041524b) < .5) cars.push({x:i%n,y:(i/n)|0,parked:false});
            else spots[i] = 1;
        }
        const frames = [];
        function capture() {
            frames.push({
                xy: cars.map(c => [c.x,c.y,c.parked]),
                occupied: occupied.slice(), visits: visits.slice()
            });
        }
        capture();
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (let round = 0; round < 92; round++) {
            const arrivals = new Map();
            cars.forEach((car, j) => {
                if (car.parked) return;
                const d = dirs[(rand() * 4) | 0];
                car.x = (car.x + d[0] + n) % n; car.y = (car.y + d[1] + n) % n;
                const site = car.y * n + car.x; visits[site]++;
                if (spots[site] && !occupied[site]) {
                    if (!arrivals.has(site)) arrivals.set(site, []);
                    arrivals.get(site).push(j);
                }
            });
            arrivals.forEach((candidates, site) => {
                const winner = candidates[(rand() * candidates.length) | 0];
                cars[winner].parked = true; occupied[site] = 1;
            });
            capture();
        }
        return function (t) {
            ground(ctx, W);
            const cycle = 12, local = t % cycle, progress = Math.min(1, local / 9.5);
            const z = progress * (frames.length - 1), k = Math.min(frames.length - 2, Math.floor(z)), a = z - k;
            const f0 = frames[k], f1 = frames[k + 1];
            let vmax = 1; for (let i = 0; i < count; i++) vmax = Math.max(vmax, f1.visits[i]);
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                const q = Math.sqrt(f1.visits[y*n+x] / vmax);
                ctx.fillStyle = q > .02 ? rampColour([[21,19,26],[46,36,54],[74,74,94],[142,66,87],[201,191,168]], q) : C.deep;
                ctx.fillRect(pad + x * cell, pad + y * cell, cell + .25, cell + .25);
            }
            for (let i = 0; i < count; i++) if (spots[i]) {
                const x = pad + ((i % n) + .5) * cell, y = pad + (((i / n) | 0) + .5) * cell;
                dot(ctx, x, y, cell * .22, f1.occupied[i] ? C.cyan : null, C.cyan, 2.3);
            }
            cars.forEach((car, j) => {
                if (f1.xy[j][2]) return;
                const p = f0.xy[j], q = f1.xy[j];
                let dx = q[0] - p[0], dy = q[1] - p[1];
                if (dx > 1) dx -= n; if (dx < -1) dx += n;
                if (dy > 1) dy -= n; if (dy < -1) dy += n;
                const x = (p[0] + a * dx + n) % n, y = (p[1] + a * dy + n) % n;
                dot(ctx, pad + (x + .5) * cell, pad + (y + .5) * cell, cell * .19, C.ink, C.bg, 1.5);
            });
            if (local > 11.5) fadeOut(ctx,W,(local-11.5)/.5);
        };
    }

    function makeDivisiblePercolation(ctx, W) {
        const N = 58, count = N*N, pad = 7, cell = (W-2*pad)/N, rho = .96;
        const zeta = new Float64Array(count), initial = new Uint8Array(count), frames = [];
        function h(i) {
            let z=(0x53414e44 ^ Math.imul(i+0x9e37,0x45d9f3b))>>>0;
            z=Math.imul(z^(z>>>16),0x45d9f3b)>>>0;
            return ((z^(z>>>16))>>>0)/4294967296;
        }
        for (let i=0;i<count;i++) { initial[i]=poissonQuantile(h(i),rho); zeta[i]=(initial[i]-1)/4; }
        let u = new Float64Array(count), next = new Float64Array(count);
        frames.push(new Float32Array(u));
        for (let step=1;step<=720;step++) {
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){
                const i=y*N+x,l=y*N+(x+N-1)%N,r=y*N+(x+1)%N,
                    a=((y+N-1)%N)*N+x,b=((y+1)%N)*N+x;
                next[i]=Math.max(0,zeta[i]+.25*(u[l]+u[r]+u[a]+u[b]));
            }
            const q=u;u=next;next=q;
            if(step%3===0)frames.push(new Float32Array(u));
        }
        function classify(v) {
            const mask = new Uint8Array(count), seen = new Uint8Array(count), largest = new Uint8Array(count);
            for(let i=0;i<count;i++)mask[i]=v[i]>1e-10?1:0;
            let best=[];
            for(let i=0;i<count;i++)if(mask[i]&&!seen[i]){
                const stack=[i],comp=[];seen[i]=1;
                while(stack.length){const a=stack.pop(),x=a%N,y=(a/N)|0;comp.push(a);
                    const ns=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
                    for(let k=0;k<4;k++){const xx=ns[k][0],yy=ns[k][1];if(xx<0||xx>=N||yy<0||yy>=N)continue;const j=yy*N+xx;if(mask[j]&&!seen[j]){seen[j]=1;stack.push(j);}}
                }
                if(comp.length>best.length)best=comp;
            }
            best.forEach(i=>largest[i]=1);
            return {mask,largest};
        }
        return function(t) {
            ground(ctx,W);const local=t%12,amount=Math.min(1,local/9.8),fi=Math.min(frames.length-1,Math.floor(amount*(frames.length-1))),v=frames[fi],state=classify(v),prior=classify(frames[Math.max(0,fi-4)]);
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){
                const i=y*N+x;if(!state.mask[i])continue;
                if(!prior.mask[i])ctx.fillStyle=C.ink;
                else if(state.largest[i])ctx.fillStyle='#579DB7';
                else ctx.fillStyle='#8E4257';
                ctx.fillRect(pad+x*cell+.35,pad+y*cell+.35,cell-.7,cell-.7);
            }
            ctx.beginPath();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!state.largest[i])continue;const x0=pad+x*cell,y0=pad+y*cell,x1=x0+cell,y1=y0+cell;if(x===0||!state.largest[i-1]){ctx.moveTo(x0,y0);ctx.lineTo(x0,y1);}if(x===N-1||!state.largest[i+1]){ctx.moveTo(x1,y0);ctx.lineTo(x1,y1);}if(y===0||!state.largest[i-N]){ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);}if(y===N-1||!state.largest[i+N]){ctx.moveTo(x0,y1);ctx.lineTo(x1,y1);}}ctx.strokeStyle='rgba(168,216,232,.72)';ctx.lineWidth=1.35;ctx.stroke();
            if(local>11.5)fadeOut(ctx,W,(local-11.5)/.5);
        };
    }

    function makeRotor(ctx, W) {
        const steps=[], first=new Map(), firstCircuit=new Map(), histories=new Map(), rotors=new Map();
        let x=0,y=0,returns=0;
        const key=(a,b)=>a+','+b, initial=(a,b)=>(hash2(a,b,0x524f)*4)|0;
        first.set(key(0,0),0);firstCircuit.set(key(0,0),0);
        for(let s=0;s<1800;s++){
            const k=key(x,y),old=rotors.has(k)?rotors.get(k):initial(x,y),next=(old+1)&3;
            rotors.set(k,next);if(!histories.has(k))histories.set(k,[]);histories.get(k).push([s,next]);
            const dirs=[[1,0],[0,1],[-1,0],[0,-1]],d=dirs[next],nx=x+d[0],ny=y+d[1];
            steps.push({x,y,nx,ny,old,next,circuit:Math.floor(returns/4)});x=nx;y=ny;
            const nk=key(x,y);if(!first.has(nk)){first.set(nk,s+1);firstCircuit.set(nk,Math.floor(returns/4));}if(x===0&&y===0)returns++;
        }
        function rotorBefore(k,s){const h=histories.get(k);if(!h)return initial(...k.split(',').map(Number));let lo=0,hi=h.length-1,ans=-1;while(lo<=hi){const m=(lo+hi)>>1;if(h[m][0]<s){ans=m;lo=m+1;}else hi=m-1;}return ans<0?initial(...k.split(',').map(Number)):h[ans][1];}
        return function(t){
            ground(ctx,W);const q=(t%14)/14,amount=q<.93?q/.93:1,start=420,count=112,z=start+amount*count,k=Math.min(steps.length-1,Math.floor(z)),phase=z-k,st=steps[k];
            const turnEnd=.38,move=smooth((phase-turnEnd)/(1-turnEnd)),cx=mix(st.x,st.nx,move),cy=mix(st.y,st.ny,move),cell=32,half=7;
            const toScreen=(a,b)=>[W/2+(a-cx)*cell,W/2+(b-cy)*cell];
            ctx.strokeStyle=DARK?'rgba(201,191,168,.12)':'rgba(98,97,118,.16)';ctx.lineWidth=1;ctx.beginPath();
            for(let j=-half-1;j<=half+1;j++){const px=toScreen(Math.floor(cx)+j,cy)[0],py=toScreen(cx,Math.floor(cy)+j)[1];ctx.moveTo(px,0);ctx.lineTo(px,W);ctx.moveTo(0,py);ctx.lineTo(W,py);}ctx.stroke();
            for(let yy=Math.floor(cy)-half;yy<=Math.floor(cy)+half;yy++)for(let xx=Math.floor(cx)-half;xx<=Math.floor(cx)+half;xx++){
                const kk=key(xx,yy),when=first.get(kk);if(when===undefined||when>k)continue;const p=toScreen(xx,yy),exc=firstCircuit.get(kk)||0;
                ctx.fillStyle=['#294f72','#356f91','#568da5','#806a91','#a05270'][exc%5];ctx.globalAlpha=.76;ctx.fillRect(p[0]-cell*.45,p[1]-cell*.45,cell*.9,cell*.9);
            }
            ctx.globalAlpha=1;
            for(let yy=Math.floor(cy)-half;yy<=Math.floor(cy)+half;yy++)for(let xx=Math.floor(cx)-half;xx<=Math.floor(cx)+half;xx++){
                const kk=key(xx,yy),p=toScreen(xx,yy),active=xx===st.x&&yy===st.y;let ang=rotorBefore(kk,k)*Math.PI/2;
                if(active)ang=st.old*Math.PI/2+(Math.PI/2)*smooth(phase/turnEnd);
                arrow(ctx,p[0],p[1],ang,active?12.5:10.5,active?C.yellow:((first.get(kk)??Infinity)<=k?'#F6F1E6':C.slate),active?3.2:2.35);
            }
            const cp=toScreen(mix(st.x,st.nx,move),mix(st.y,st.ny,move));dot(ctx,cp[0],cp[1],7,C.yellow,C.bg,2.4);
            if(q>.93)fadeOut(ctx,W,smooth((q-.93)/.07));
        };
    }

    function makeEinstein(ctx, W) {
        const model = globalThis.EinsteinMotion;
        if (!model) return function () { ground(ctx, W); };
        const run = model.generate({force: .125, seed: 0x4e554c4c, pairs: 32, samples: 900});
        return function (t) {
            const local = t % 17, progress = .20 + .80 * Math.min(1, local / 14);
            model.paint(ctx, W, W, run, progress, {dark: DARK, compact: true});
            if (local > 16.4) fadeOut(ctx, W, smooth((local - 16.4) / .6));
        };
    }

    function makeLongRange(ctx,W){
        const rand=randomFactory(0x10a6e),pts=[[0,0]],lengths=[];let x=0,y=0;
        for(let i=0;i<280;i++){
            // P(R > r) is proportional to r^-2, the critical radial tail.
            const angle=TAU*rand(),r=Math.min(22,.62/Math.sqrt(Math.max(.0008,rand())));
            x+=r*Math.cos(angle);y+=r*Math.sin(angle);pts.push([x,y]);lengths.push(r);
        }
        const jump=4,cameras=[];let minX=0,maxX=0,minY=0,maxY=0;
        const fullSpan=Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0]));
        const minSpan=Math.max(12,fullSpan*.42);
        for(let k=0;k<pts.length;k++){
            const p=pts[k];minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);
            cameras.push([(minX+maxX)/2,(minY+maxY)/2,Math.max(minSpan,maxX-minX,maxY-minY)]);
        }
        return function(t){
            ground(ctx,W);const local=t%14,z=Math.min(1,local/11.9)*(pts.length-1),end=Math.floor(z),fraction=z-end;
            // A gently widening camera keeps early local motion legible while
            // revealing the full trace as long jumps expand its range.
            const camera=[0,0,0];
            for(let j=0;j<25;j++){const a=cameras[Math.min(pts.length-1,end+j)],b=cameras[Math.min(pts.length-1,end+j+1)];for(let i=0;i<3;i++)camera[i]+=mix(a[i],b[i],fraction)/25;}
            const scale=(W-68)/camera[2],screen=pts.map(p=>[W/2+(p[0]-camera[0])*scale,W/2+(p[1]-camera[1])*scale]);
            ctx.strokeStyle=C.grid;ctx.globalAlpha=.13;ctx.lineWidth=1;ctx.beginPath();
            for(let i=24;i<W;i+=28){ctx.moveTo(i,16);ctx.lineTo(i,W-16);ctx.moveTo(16,i);ctx.lineTo(W-16,i);}ctx.stroke();ctx.globalAlpha=1;
            for(let i=1;i<=end;i++){
                const a=screen[i-1],b=screen[i],long=lengths[i-1]>jump;
                ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=long?C.rose:C.cyan;
                ctx.lineWidth=long?3.1:2.4;ctx.globalAlpha=long?.82:.56;ctx.stroke();
                if(long){dot(ctx,a[0],a[1],3.4,C.bg,C.rose,1.9);dot(ctx,b[0],b[1],3.4,C.rose);}
            }
            ctx.globalAlpha=1;const a=screen[end],b=screen[Math.min(end+1,screen.length-1)],long=lengths[end]>jump;
            // Long edges are jumps: the particle waits at the departure site,
            // then appears at its destination instead of flying along the edge.
            const moving=long?(fraction>=.82?1:0):smooth(fraction),p=[mix(a[0],b[0],moving),mix(a[1],b[1],moving)];
            if(end<screen.length-1){
                ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...(long?b:p));ctx.strokeStyle=long?C.rose:C.cyan;ctx.globalAlpha=long?.3+.5*fraction:1;ctx.lineWidth=long?3.2:3;ctx.setLineDash(long?[6,5]:[]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
                if(long){const r=5+11*fraction;ctx.globalAlpha=1-fraction;dot(ctx,a[0],a[1],r,null,C.rose,2.5);ctx.globalAlpha=1;}
            }
            dot(ctx,screen[0][0],screen[0][1],4,C.bg,C.cyan,2);
            dot(ctx,p[0],p[1],7,long?C.rose:C.cyan,C.bg,2.7);
            if(local>13.4)fadeOut(ctx,W,smooth((local-13.4)/.6));
        };
    }

    function makeCylinderIDLA(ctx,W){
        const rand=randomFactory(0xc711da),N=24,occ=new Set(),settled=[];
        for(let x=0;x<N;x++)occ.add(x+',0');
        for(let n=0;n<650;n++){
            let x=(rand()*N)|0,y=0;
            while(occ.has(x+','+y)){
                const r=(rand()*4)|0;
                if(r===0)x=(x+1)%N;else if(r===1)x=(x+N-1)%N;else if(r===2)y++;else y=Math.max(0,y-1);
            }
            occ.add(x+','+y);settled.push([x,y]);
        }
        const radius=W*.35,depth=34,base=W-42,pitch=9.6,angle=x=>TAU*x/N-Math.PI/2;
        const project=(p,rotation)=>[W/2+radius*Math.cos(angle(p[0])+rotation),base-p[1]*pitch+depth*Math.sin(angle(p[0])+rotation)];
        const bands=DARK?[[55,79,137],[53,121,159],[78,173,179],[177,186,113]]:[[57,77,132],[44,113,151],[44,150,156],[134,140,64]];
        return function(t){
            ground(ctx,W);const local=t%15,amount=Math.min(1,local/12.5),z=80+amount*(settled.length-81),k=Math.floor(z),rotation=.28*Math.sin(local*.14);
            const ring=(h,alpha,dashed)=>{
                ctx.globalAlpha=alpha;ctx.beginPath();ctx.ellipse(W/2,base-h*pitch,radius,depth,0,0,TAU);ctx.strokeStyle=C.slate;ctx.lineWidth=1.7;ctx.setLineDash(dashed?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
            };
            ring(0,.4,false);ring(30,.2,true);
            ctx.beginPath();ctx.moveTo(W/2-radius,base);ctx.lineTo(W/2-radius,base-30*pitch);ctx.moveTo(W/2+radius,base);ctx.lineTo(W/2+radius,base-30*pitch);ctx.strokeStyle=C.grid;ctx.globalAlpha=.22;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;
            const order=Array.from({length:k+1},(_,i)=>i).sort((a,b)=>Math.sin(angle(settled[a][0])+rotation)-Math.sin(angle(settled[b][0])+rotation));
            for(const i of order){
                const q=settled[i],p=project(q,rotation),front=(Math.sin(angle(q[0])+rotation)+1)/2,recent=i>k-10;
                ctx.globalAlpha=.3+.7*front;
                dot(ctx,p[0],p[1],recent?5.8:5.2,recent?C.yellow:rampColour(bands,i/settled.length),C.bg,.9);
            }
            ctx.globalAlpha=1;
            // The dashed level is the area / circumference mean height;
            // deviations of the actual occupied frontier remain visible.
            const mean=(k+1)/N;
            ctx.beginPath();ctx.ellipse(W/2,base-mean*pitch,radius+5,depth,0,0,Math.PI);ctx.strokeStyle=C.ink;ctx.globalAlpha=.7;ctx.lineWidth=1.6;ctx.setLineDash([6,5]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
            if(local>14.4)fadeOut(ctx,W,smooth((local-14.4)/.6));
        };
    }

    function makeRWRS(ctx,W){
        const N=23,pad=24,cell=(W-2*pad)/N,g=new Float32Array(N*N),frames=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)g[y*N+x]=(hash2(x,y,0x727772)-.5)*1.14;
        let u=new Float32Array(N*N),next=new Float32Array(N*N);frames.push(u.slice());for(let s=0;s<72;s++){for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;let sum=0,m=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const xx=x+d[0],yy=y+d[1];if(xx>=0&&xx<N&&yy>=0&&yy<N){sum+=u[yy*N+xx];m++;}});next[i]=Math.max(0,g[i]+sum/4);}const z=u;u=next;next=z;if(s%2===1)frames.push(u.slice());}
        const rand=randomFactory(0x57a1),walk=[[N>>1,N>>1]];for(let i=0;i<90;i++){const p=walk[walk.length-1],d=[[1,0],[-1,0],[0,1],[0,-1]][(rand()*4)|0],x=clamp(p[0]+d[0],0,N-1),y=clamp(p[1]+d[1],0,N-1);walk.push([x,y]);}
        return function(t){ground(ctx,W,'rgba(204,121,167,.55)');const q=(t%11)/11,fi=Math.min(frames.length-1,Math.floor((q<.68?q/.68:1)*(frames.length-1))),v=frames[fi];let mx=.01;for(let i=0;i<v.length;i++)mx=Math.max(mx,v[i]);
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,a=v[i]/mx,sg=g[i];ctx.fillStyle=a>0?`rgba(86,180,233,${(.08+.78*Math.sqrt(a)).toFixed(3)})`:sg>0?'rgba(204,121,167,.22)':'rgba(114,110,145,.14)';ctx.fillRect(pad+x*cell+.6,pad+y*cell+.6,cell-1.2,cell-1.2);}
            if(q>.68&&q<.94){const amount=(q-.68)/.26,tf=p=>[pad+(p[0]+.5)*cell,pad+(p[1]+.5)*cell];trace(ctx,walk,amount,C.yellow,2,tf);const p=tf(currentPoint(walk,amount));dot(ctx,p[0],p[1],4,C.yellow,C.bg,1.5);}if(q>.94)fadeOut(ctx,W,smooth((q-.94)/.06));
        };
    }

    function makeFlow(ctx,W,algebraic){
        const model=globalThis.FlowWalk;
        if(!model)throw new Error('Random-flow model unavailable');
        let run=model.create({seed:algebraic?0xa16eb2:0xc8171c,gamma:algebraic?.10:0});
        let paint=model.createPainter(run,{dark:DARK,compact:true}),camera=model.camera(run,null);
        let previous=0,carry=0;
        return function(t){
            if(t<previous){run=model.create({seed:algebraic?0xa16eb2:0xc8171c,gamma:algebraic?.10:0});paint=model.createPainter(run,{dark:DARK,compact:true});camera=model.camera(run,null);previous=0;carry=0;}
            const elapsed=Math.max(0,t-previous);previous=t;
            carry+=elapsed*2.4/model.DT;
            const steps=Math.floor(carry);carry-=steps;
            if(steps)model.advance(run,steps);
            camera=model.camera(run,camera,'follow',elapsed);
            paint(ctx,W,W,camera,{cssWidth:Math.max(140,ctx.canvas.getBoundingClientRect().width),view:'follow'});
            return true;
        };
    }

    function makeSpherePacking(ctx,W){
        const S=140,rand=randomFactory(0x5f3e7),nodes=[];
        for(let y=0;y<11;y++)for(let x=0;x<11;x++)nodes.push([5+(x+.18+.64*rand())*(S-10)/11,5+(y+.18+.64*rand())*(S-10)/11]);
        const label=new Uint16Array(S*S),edgeWeight=new Map();
        for(let y=0;y<S;y++)for(let x=0;x<S;x++){let best=0,bd=Infinity;for(let i=0;i<nodes.length;i++){const dx=x-nodes[i][0],dy=y-nodes[i][1],d=dx*dx+dy*dy;if(d<bd){bd=d;best=i;}}label[y*S+x]=best;}
        for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=label[y*S+x];if(x+1<S&&i!==label[y*S+x+1]){const j=label[y*S+x+1],k=i<j?i+','+j:j+','+i;edgeWeight.set(k,(edgeWeight.get(k)||0)+1);}if(y+1<S&&i!==label[(y+1)*S+x]){const j=label[(y+1)*S+x],k=i<j?i+','+j:j+','+i;edgeWeight.set(k,(edgeWeight.get(k)||0)+1);}}
        const adj=nodes.map(()=>[]);edgeWeight.forEach((length,k)=>{const [i,j]=k.split(',').map(Number),d=Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1]),w=length/d;adj[i].push([j,w]);adj[j].push([i,w]);});
        const walk=[Math.floor(nodes.length/2)];for(let k=0;k<300;k++){const a=adj[walk[walk.length-1]],sum=a.reduce((s,e)=>s+e[1],0);let u=rand()*sum,j=0;for(;j<a.length-1&&u>a[j][1];j++)u-=a[j][1];walk.push(a[j][0]);}
        const plate=document.createElement('canvas');plate.width=plate.height=S;const pc=plate.getContext('2d'),im=pc.createImageData(S,S),d=im.data;
        for(let i=0;i<label.length;i++){const q=hash2(label[i],0,0x51),col=DARK?(q>.68?[91,54,75]:q<.32?[43,82,102]:[50,47,58]):(q>.68?[181,101,132]:q<.32?[84,151,177]:[167,160,177]),j=i*4;d[j]=col[0];d[j+1]=col[1];d[j+2]=col[2];d[j+3]=DARK?112:82;}
        pc.putImageData(im,0,0);pc.strokeStyle='rgba(201,191,168,.38)';pc.lineWidth=.55;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=label[y*S+x];if(x+1<S&&i!==label[y*S+x+1]){pc.beginPath();pc.moveTo(x+1,y);pc.lineTo(x+1,y+1);pc.stroke();}if(y+1<S&&i!==label[(y+1)*S+x]){pc.beginPath();pc.moveTo(x,y+1);pc.lineTo(x+1,y+1);pc.stroke();}}
        return function(t){ground(ctx,W);ctx.imageSmoothingEnabled=false;ctx.drawImage(plate,0,0,W,W);const local=t%12,amount=Math.min(1,local/10),z=amount*(walk.length-1),end=Math.floor(z),start=Math.max(0,end-54),path=[];for(let i=start;i<=end;i++)path.push([nodes[walk[i]][0]*W/S,nodes[walk[i]][1]*W/S]);if(end<walk.length-1){const a=nodes[walk[end]],b=nodes[walk[end+1]],f=z-end;path.push([mix(a[0],b[0],f)*W/S,mix(a[1],b[1],f)*W/S]);}trace(ctx,path,1,C.ink,4.2);const p=path[path.length-1];dot(ctx,p[0],p[1],5.8,C.ink,C.bg,2);if(local>11.5)fadeOut(ctx,W,(local-11.5)/.5);
        };
    }

    function makeUniqueContinuation(ctx,W){
        /* The proof of Theorem 1.3 is a contradiction argument.  If a
           non-zero x_0 existed in B_n, the component D connected to it would
           reach the intermediate sphere.  Its boundary cycle gamma contains
           too many zeros for the assumed sparse support.  The final beat is
           therefore the conclusion of the argument: D is absent from B_n. */
        const R=17,INNER=7,MIDDLE=13,
              dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]],cells=[],byKey=new Map();
        for(let r=-R;r<=R;r++)for(let q=-R;q<=R;q++){
            const d=Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));
            if(d<=R){const i=cells.length;cells.push({q:q,r:r,d:d});byKey.set(q+','+r,i);}
        }
        const size=(W-8)/(Math.sqrt(3)*(2*R+1)),
              centres=cells.map(v=>[W/2+size*Math.sqrt(3)*(v.q+v.r/2),W/2+size*1.5*v.r]);
        cells.forEach((v,i)=>{v.i=i;v.theta=Math.atan2(centres[i][1]-W/2,centres[i][0]-W/2);});
        function cellPath(i){const p=centres[i];ctx.moveTo(p[0]+size*Math.cos(-Math.PI/6),p[1]+size*Math.sin(-Math.PI/6));for(let k=1;k<6;k++)ctx.lineTo(p[0]+size*Math.cos(-Math.PI/6+k*Math.PI/3),p[1]+size*Math.sin(-Math.PI/6+k*Math.PI/3));ctx.closePath();}
        function ring(rad){const a=cells.filter(v=>v.d===rad).sort((u,v)=>u.theta-v.theta);ctx.beginPath();a.forEach((v,j)=>j?ctx.lineTo(...centres[v.i]):ctx.moveTo(...centres[v.i]));ctx.closePath();}
        function reach(v){
            const lobe=3.6*Math.exp(-Math.pow(Math.atan2(Math.sin(v.theta+.42),Math.cos(v.theta+.42))/.45,2));
            return 8.4+1.15*Math.sin(3*v.theta+.35)+.75*Math.cos(5*v.theta-.2)+lobe;
        }
        return function(t){
            const local=t%12.5,appear=smooth(local/1.1),traceIn=smooth((local-1.35)/2.4),
                  force=smooth((local-5.7)/1.0),collapse=smooth((local-7.15)/1.45),
                  fade=local>11.9?1-smooth((local-11.9)/.6):1,active=new Uint8Array(cells.length);
            ground(ctx,W);ctx.save();ctx.globalAlpha=fade;

            /* The finite graph-metric ball, enlarged to fill the thumbnail. */
            ctx.beginPath();for(let i=0;i<cells.length;i++)cellPath(i);
            ctx.fillStyle=C.deep;ctx.fill();ctx.strokeStyle='rgba(201,191,168,.12)';ctx.lineWidth=.55;ctx.stroke();
            ring(R);ctx.strokeStyle=C.slate;ctx.lineWidth=2.6;ctx.stroke();
            ring(MIDDLE);ctx.strokeStyle=C.grid;ctx.lineWidth=1.7;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);
            ring(INNER);ctx.strokeStyle=C.cyan;ctx.lineWidth=2.15;ctx.stroke();

            /* D is the hypothetical non-zero component through x_0.  Its
               narrow arm reaches S_m, as forced by the maximum principle. */
            const scale=1-collapse;
            for(let i=0;i<cells.length;i++){
                const v=cells[i],rho=reach(v)*scale;
                if(scale>.015&&v.d<=rho&&v.d<=MIDDLE)active[i]=1;
            }
            ctx.globalAlpha=fade*appear;
            ctx.beginPath();for(let i=0;i<cells.length;i++)if(active[i]&&Math.sin(2*cells[i].theta+.28*cells[i].d) >= 0)cellPath(i);
            ctx.fillStyle=C.blue;ctx.fill();
            ctx.beginPath();for(let i=0;i<cells.length;i++)if(active[i]&&Math.sin(2*cells[i].theta+.28*cells[i].d) < 0)cellPath(i);
            ctx.fillStyle=C.pink;ctx.fill();

            /* gamma: cell sides separating D from its zero complement. */
            const boundary=[];
            for(let i=0;i<cells.length;i++)if(active[i])for(const d of dirs){
                const j=byKey.get((cells[i].q+d[0])+','+(cells[i].r+d[1]));
                if(j===undefined||active[j])continue;
                const p=centres[i],q=centres[j],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,dx=q[0]-p[0],dy=q[1]-p[1],n=Math.hypot(dx,dy);
                boundary.push({theta:Math.atan2(my-W/2,mx-W/2),a:[mx-dy/n*size*.5,my+dx/n*size*.5],b:[mx+dy/n*size*.5,my-dx/n*size*.5]});
            }
            boundary.sort((a,b)=>a.theta-b.theta);const shown=Math.floor(boundary.length*traceIn);
            ctx.beginPath();for(let i=0;i<shown;i++){ctx.moveTo(...boundary[i].a);ctx.lineTo(...boundary[i].b);}
            ctx.strokeStyle=C.yellow;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.stroke();

            /* The planar lemma forces many distinct non-zero contacts near
               S_m.  They appear before the contradiction removes D. */
            ctx.globalAlpha=fade*force*(1-collapse);
            const contacts=cells.filter(v=>v.d===MIDDLE&&Math.cos(7*v.theta+.4)>.42);
            contacts.forEach((v,j)=>{const p=centres[v.i];dot(ctx,p[0],p[1],3.4,j%2?C.cyan:C.rose,C.bg,1.1);});

            /* At and after the conclusion, every vertex of B_n is displayed
               in the zero state; no residual central component remains. */
            ctx.globalAlpha=fade*collapse;
            ctx.beginPath();for(let i=0;i<cells.length;i++)if(cells[i].d<=INNER)cellPath(i);
            ctx.fillStyle=C.deep;ctx.fill();ctx.strokeStyle='rgba(246,241,230,.28)';ctx.lineWidth=.65;ctx.stroke();
            ctx.fillStyle=C.ink;
            cells.forEach((v,i)=>{if(v.d<=INNER&&((v.q-v.r)%3===0)){const p=centres[i];ctx.fillRect(p[0]-1.15,p[1]-1.15,2.3,2.3);}});
            ctx.globalAlpha=fade;ring(INNER);ctx.strokeStyle=collapse>.5?C.ink:C.cyan;ctx.lineWidth=2.15;ctx.stroke();
            ctx.restore();
        };
    }

    function makePercolationHarmonic(ctx,W){
        const MAX=8,graphs={};
        function solve(matrix,rhs){const n=rhs.length,a=matrix.map((row,i)=>row.slice().concat(rhs[i]));for(let col=0;col<n;col++){let p=col;for(let r=col+1;r<n;r++)if(Math.abs(a[r][col])>Math.abs(a[p][col]))p=r;const tmp=a[col];a[col]=a[p];a[p]=tmp;const d=a[col][col];for(let k=col;k<=n;k++)a[col][k]/=d;for(let r=0;r<n;r++)if(r!==col&&Math.abs(a[r][col])>1e-12){const f=a[r][col];for(let k=col;k<=n;k++)a[r][k]-=f*a[col][k];}}return a.map(row=>row[n]);}
        function build(n){const nodes=[],byKey=new Map();function add(x,y){byKey.set(x+','+y,nodes.length);nodes.push({x,y,nbr:[]});}for(let x=1;x<=4;x++)add(x,1);for(let y=2;y<=n;y++){add(2,y);add(3,y);}const edges=[];nodes.forEach((v,i)=>[[1,0],[0,1]].forEach(d=>{const j=byKey.get((v.x+d[0])+','+(v.y+d[1]));if(j===undefined)return;v.nbr.push(j);nodes[j].nbr.push(i);edges.push([i,j]);}));const s=byKey.get('1,1'),terminal=byKey.get('4,1'),unknown=nodes.map((_,i)=>i).filter(i=>i!==s&&i!==terminal),row=new Map(unknown.map((i,r)=>[i,r])),matrix=unknown.map(()=>new Array(unknown.length).fill(0)),rhs=new Array(unknown.length).fill(0);unknown.forEach((i,r)=>{matrix[r][r]=nodes[i].nbr.length;nodes[i].nbr.forEach(j=>{if(j===terminal)rhs[r]++;else if(j!==s)matrix[r][row.get(j)]--;});});const values=new Float64Array(nodes.length),sol=solve(matrix,rhs);values[terminal]=1;unknown.forEach((i,r)=>values[i]=sol[r]);return{n,nodes,edges,values,s,terminal};}
        for(let n=1;n<=MAX;n++)graphs[n]=build(n);
        function colour(z){return z<.5?rampColour([[213,94,119],[246,241,230]],z*2):rampColour([[246,241,230],[86,180,233]],(z-.5)*2);}
        return function(t){ground(ctx,W);const local=t%11.5,grow=Math.min(MAX-1,local/1.15),n=Math.min(MAX,1+Math.floor(grow)),fade=smooth(grow-Math.floor(grow)),g=graphs[n],next=graphs[Math.min(MAX,n+1)],baseY=354,pitch=42,pos=v=>[52+(v.x-1)*(W-104)/3,baseY-(v.y-1)*pitch];
            next.edges.forEach(e=>{const a=next.nodes[e[0]],b=next.nodes[e[1]],fresh=a.y>n||b.y>n,p=pos(a),q=pos(b);ctx.globalAlpha=fresh?fade:1;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.strokeStyle=fresh?C.ink:C.grid;ctx.lineWidth=fresh?3.2:2.4;ctx.stroke();});
            next.nodes.forEach((v,i)=>{const fresh=v.y>n,p=pos(v);ctx.globalAlpha=fresh?fade:1;dot(ctx,p[0],p[1],i===next.s||i===next.terminal?13:10.5,colour(next.values[i]),fresh?C.yellow:(i===next.s||i===next.terminal?C.ink:C.grid),fresh?2.8:2);});ctx.globalAlpha=1;
            if(local>10.7)fadeOut(ctx,W,smooth((local-10.7)/.8));
        };
    }

    function makeMatedCRTIDLA(ctx,W){
        let data=null,cluster=null,cctx=null,transform=null,last=-1;
        function cellPath(c,v){const raw=data.cells[v];if(!raw||!raw.length)return false;const pieces=typeof raw[0]==='number'?[raw]:raw;c.beginPath();let any=false;for(const p of pieces){if(!p||p.length<6)continue;const a=transform(p[0],p[1]);c.moveTo(a[0],a[1]);for(let j=2;j+1<p.length;j+=2){const q=transform(p[j],p[j+1]);c.lineTo(q[0],q[1]);}c.closePath();any=true;}return any;}
        function paintCell(c,v,fill,outline){if(cellPath(c,v)){c.fillStyle=fill;c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=.7;c.stroke();}}else{const p=transform(data.xy[v][0],data.xy[v][1]);dot(c,p[0],p[1],1.8,fill);}}
        function build(raw){
            data=raw.idla;const xs=data.order.map(v=>data.xy[v][0]).sort((a,b)=>a-b),ys=data.order.map(v=>data.xy[v][1]).sort((a,b)=>a-b),lo=Math.floor(.005*(data.order.length-1)),hi=Math.floor(.995*(data.order.length-1)),x0=xs[lo],x1=xs[hi],y0=ys[lo],y1=ys[hi];
            const pad=18,s=(W-2*pad)/Math.max(x1-x0,y1-y0),ox=W/2-s*(x0+x1)/2,oy=W/2-s*(y0+y1)/2;
            transform=(x,y)=>[ox+s*x,oy+s*y];cluster=document.createElement('canvas');cluster.width=cluster.height=W;cctx=cluster.getContext('2d');
            draw.ready=true;
        }
        function reset(){cctx.clearRect(0,0,W,W);last=-1;}
        function draw(t){
            ground(ctx,W);if(!draw.ready||!data)return false;const local=t%11.5,amount=Math.min(1,local/9),k=Math.min(data.order.length-1,Math.floor(amount*(data.order.length-1)));
            const palette=[[25,35,86],[25,99,146],[68,166,185],[228,205,83],[220,119,66],[139,48,72]];
            if(k<last)reset();for(let j=last+1;j<=k;j++)paintCell(cctx,data.order[j],rampColour(palette,j/Math.max(1,data.order.length-1)),'rgba(21,19,26,.30)');last=k;
            ctx.drawImage(cluster,0,0);
            const recent=Math.max(0,k-5);for(let j=recent;j<=k;j++)paintCell(ctx,data.order[j],C.ink,'rgba(21,19,26,.7)');
            const source=transform(data.xy[data.source][0],data.xy[data.source][1]);dot(ctx,source[0],source[1],4.5,C.ink,C.bg,2.2);
            if(local>11)fadeOut(ctx,W,(local-11)/.5);return true;
        }
        draw.ready=false;draw.failed=false;
        fetch('gallery/plates/p-mcrt-idla.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(build).catch(e=>{draw.failed=true;console.warn('mated-CRT thumbnail:',e);});
        return draw;
    }

    function makeHarmonicBall(ctx,W){
        /* Divisible-sandpile growth of an LQG harmonic ball: capacity is the
           normalized chaos density of a 61 x 61 torus Gaussian field, and mass
           1250 is released at the centre in 100 equal increments.  ARRIVAL is the
           increment at which each site first topples (255 = never) and POSITIVE
           the sign of the field; both are precomputed by
           scripts/render-harmonic-ball-thumbnail.mjs, because the stabilization
           takes about 3 s and froze the page when run here. */
        const N=61,count=N*N,pad=8,cell=(W-2*pad)/N,levels=100;
        const ARRIVAL=atob('////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////YmP/////////////////////////////////////////////////YltYWFti/////////////////11XVFNWXf//////////////////////////////////////////////WlBKR0ZHS1Ri////////Yl5aVlFMSEZHSlJd////////////////////////////////////////////V01FQD08PT9FT1z///9bVVBNSkdDPzw8PUFIUlz/////////////////////////////////////////Wk5FPzs4Nzc4PEJKUVNQTElGQ0A8OTY1NTY6QEhRWl9j////////////////////////////////////YlRJQTw4NTQ0NDY5PUBCQkJBQD05NTEvLzAyNTpBSVFYXWL//////////////////////////////////1tQR0A6NjMyMTEyMzQ1NTY4Ojo4NC8sKiosLjI2O0JJUVlf/////////////////////////////////1tTTEU/OjYyMC8uLi4tLS0uLzI0Mi4qJyYnKCsvMzg9RExVXGL///////////////////////////9fW1ZRTEhDPjk1Mi8tLCopKCcnKCkrLSsoJCIiIyYpLTE0OT9HUVpg//////////////////////////9aVVFOSkdDPzw4NDAuKyknJiQkIyMkJSUjIR4dHiAjJiotMTU7Q0xWXWL/////////////////////////U09MSUZCPzs3NDEuLCknJSMhICAgIB8eHBoZGRocHyMmKSwxNj5HUFddYv///////////////////////09LSEVDPzs3My8tKyknJSIgHh0cHBsaGBYVFBUWGBseISQnLDE4P0dOVFph//////////////////////9MSEZDQD05NC8sKigmJSMgHRsaGRgXFhQSERERExUXGh0fIiYrMTc9Q0hOVmD/////////////////////SkZEQj88ODItKicmJCMhHhsZFxUUExIRDw4ODg8RFBYYGx4iJisvNDg8QUlTX////////////////////0lGQ0E/PDgyLSknJSMhHx0aFxQSERAPDgwMCwwNDhATFRcaHSElKCsuMjc+R1Nh//////////////////9JRkNBPzw4My4qJyQjIR4cGRYTEA8NDAsKCQkJCgsNDxEUFxodICMlKCsvNj5KV///////////////////S0dFQkA9OjYxLCklIyAeGxgVEhANCwoJCAcHBwgJCgwOERMWGRweISMmKjA5Q09c/////////////////09LSEVCPzw5NTEsKCQgHhsYFhMQDQsJBwcGBgYGBgcICw0QExYYGx0gIyctNkBLV2L///////////////9XUk5JRUE+Ozg0LyolIR4cGhcVEg4LCAcGBQUEBAQEBQcJDA8SFRgbHiEmLDQ9SFRg////////////////YlxWT0lEQD06NzIsJyMfHRwaGRYRDAkHBgUEAwMCAgMEBgkMEBMWGR0hJSwzPEZTYP////////////////9jXFRNR0I/OzcyLSgkISAfHh0bFhALCAYFBAMCAQEBAgQGCg0RFRkcISYrMjtFU2P//////////////////15XUEpEPzs2MS0pJiQjIyIiIBsVDwoIBgQDAQAAAAEDBQgMERUZHSEmLDI6RlX///////////////////9dWFJLRUA6NTEuKyknJiYlJSMfGhQPDAkGAwEAAAABAgQIDBEWGh4iJywyO0dY//////////////////9jXVdSTEZAOzYyLy0rKikoJyYkIh4aFhIOCgYDAQAAAQMFCQ4TGBwgJCgtMzxIWP///////////////////15YUkxGQDw3NDIwLiwrKSgnJSMhHhsYEw4JBQMBAgMFBwwRFxwgIycqLjQ9SFVh//////////////////9hW1RNR0E9Ojc1MzEvLCopJyYkIyEfGxcSDQkGBQUGCAsQFhsgJCcpLDA2PUZPWF5j/////////////////2FYUEhCPzw7OTc0MS4rKSgmJSQiIB0aFhIOCwoKDA4SFxwgJCcpLC8yNz1CSVBWXGP/////////////////X1RKREA+PTw6NzIuLCooJyYlIyEfHBkWFBIRERMWGh4iJigqLC4wNDc7QERKUFhh//////////////////9YTEVBPz49OzgzLywqKSgnJiQiIB4dGxoZGRkbHiImKSorLC4vMjU4Oz5CR01WYP//////////////////WU5GQkA/PTs4NDAtLCopKCclJCIhISEhISEhIyYpLC4uLi8vMTM1ODo9QUVMVWL/////////////////YVdOR0NBPz07ODQxLy0sKykoJiUkJCUmKCgoKCkrLjEyMjExMTI0Njg7PUFFTFVi/////////////////11UTUhEQT89Ozg1MzEvLiwqKScmJiYoKiwuLi0uLzEzNDQ0MzM0NTc5Oz5BRkxUYP////////////////9cU01JRUNBPjw6NzU0MjAuKyooKCcoKi0wMjIyMjI0NTY3NzY2Nzc4Ojw/QkdMUl3/////////////////XlVPS0hFQ0A+PDo4NzUzMC0rKikpKisuMjQ1NTQ0NTY4OTo6Ojo6Ozw+QURHTFFb//////////////////9bVFBMSUVDQD48Ozo4NTIvLSwrKystMDM1Nzc2Njc4OTs9Pj4+PT0+QENGSUxRWv///////////////////19YUUxIRUNBPz48Ojc1MjAvLi4uLzE0Nzg5ODg4OTo9QENEQkFBQUNFSEpOU1z//////////////////////1lQSkdFQ0JAPjw5NzU0MzIyMjI0Njg6Ozo6Ojs8QERISUhFRERFR0pOUldg//////////////////////9iVExJR0VEQ0E+Ozo4ODg4Nzc3ODk7PD09PT0+P0NITU9NSkhISUtOU1lg/////////////////////////1dOSkhHR0VDQT49PDw8PD08PD0+P0FCQkFBQkRITVFTUk9NTE1QVVz///////////////////////////9bUU1LSklIR0VCQUA/QEBBQUJDREZISUhIR0hKTVJWWFdUU1JTV1//////////////////////////////YVZQTk1NTUxKSEZFRENEREVHSUxPUVFQTk5OUFNYW11cW1lZW2H///////////////////////////////9dVlNSUlNUVFJPTElHR0dIS05TVlhYVlRTVFZZXWFjY2JhYv///////////////////////////////////19bWVlaXWBgXFZQTUtLTE5SV1tdXVtZWFlbXmL//////////////////////////////////////////////2FhY/////9iW1VRUFBSVVlcX19eXVxcXmL///////////////////////////////////////////////////////////9gW1dWVldaXWBhYWBfYGL///////////////////////////////////////////////////////////////9gXFpbXF9hYmNjY2P//////////////////////////////////////////////////////////////////2FeXl9gY///////////////////////////////////////////////////////////////////////////YmFhY////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w=='),POSITIVE=atob('wf////8HgH/w//P//wHwP/x/+P//APyP/x/8/z8A/OP/h///BwD//P/x8/8AgL///z/+DwDg////7x8AAPj/////AQAAP/z//x8AfvwD/v/8QfD/H4D/Dz88//8D8P/gh///fwD8D/jw//8PAP4AP/7/5AAAP/D//x8AAMAD////AwAAePD//z8AAAAC////BwAAAOD//x8AAAAA/v//AQAAAMD//z8AAAAA+P//BwAAAAD///8AAAAA4P/4PwAAAAD8D/8fAAAAgP/h/wcAAADwP/z/8QCAA/+H//8zAPj4//H/PwAA//9//scHAMD//99/eAAA8P//+w8PAAD8/3//8PHAAf//xw//Hzjg/38A8P8HAOD/B4D//wAA/H8A8H8OAAD/DwD/DwAA4P8BwP8BAAD4PwD4fwAAAD4cAP4fAACAgwfA/38AACDwAPj/HwAAAD4A/v8DAIDBB+D/fwDA//jA//8PAPD/H/z//AEA/P/D/58/4AN/fPg/8Af8wIcf/wGAgz8A4MM/AHDwDwA88AcADvwDAAP4AMABfwAAAD4AMIAPPADABwAA8MEPAPADAA4+/AMA/gHB/4d/AIA/8Pz/+Q8A4A/+////OQD4AQ==');
        const arrival=new Int16Array(count),positive=new Uint8Array(count);
        for(let i=0;i<count;i++){const a=ARRIVAL.charCodeAt(i);arrival[i]=a===255?-1:a;positive[i]=(POSITIVE.charCodeAt(i>>3)>>(i&7))&1;}
        return function(t){
            ground(ctx,W);const local=t%12.5,level=Math.min(levels-1,Math.floor(Math.min(1,local/10)*(levels-1)));
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,a=arrival[i];if(a>=0&&a<=level)ctx.fillStyle=(a===level?C.ink:rampColour(ORDER,a/(levels-1)));else ctx.fillStyle=positive[i]?C.deep:C.bg;ctx.fillRect(pad+x*cell,pad+y*cell,cell+.25,cell+.25);}
            dot(ctx,W/2,W/2,4.5,C.ink,C.bg,2);
            if(local>12)fadeOut(ctx,W,(local-12)/.5);
        };
    }

    function makeFLattice(ctx,W){
        let data=null,patternImage=null,nodes=[],edges=[],largest=1;
        const branch=['.','2','23','231','2312'];
        const patternCrops={
            '0/1':[0,0,12,12],'1/1':[12,0,12,12],'1/2':[24,0,5,5],'1/3':[29,0,5,5],
            '2/3':[34,0,7,9],'3/5':[41,0,7,11],'4/7':[48,0,17,19],'5/9':[65,0,13,19],
            '9/16':[78,0,39,43],'13/23':[117,0,33,49],'14/25':[150,0,61,67],'23/41':[211,0,59,87]
        };
        function build(raw){data=raw;nodes=Object.keys(data.nodes).map(k=>({key:k,...data.nodes[k]}));edges=nodes.filter(n=>n.parent&&data.nodes[n.parent]).map(n=>[data.nodes[n.parent],n]);largest=Math.max(...nodes.map(n=>data.tiles[n.p1]?.std?.cells||1));draw.ready=true;}
        function radius(n,overview){const cells=data.tiles[n.p1]?.std?.cells||1,q=Math.sqrt(cells/largest);return overview?1.5+3.2*q:4.2+5.2*q;}
        function nodeColour(n){return n.kind===1?C.cyan:n.kind===2?C.rose:n.kind===3?C.bone:C.ink;}
        function onBranch(key,depth){return branch.slice(0,depth+1).includes(key);}
        function overview(alpha){
            ctx.save();ctx.globalAlpha=alpha;const pos=n=>[18+n.x*(W-36),24+n.depth*72];
            edges.forEach(e=>{const a=pos(e[0]),b=pos(e[1]),chosen=onBranch(e[1].word||e[1].key,e[1].depth);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=chosen?'rgba(226,194,90,.72)':'rgba(201,191,168,.20)';ctx.lineWidth=chosen?2.3:.75;ctx.stroke();});
            nodes.forEach(n=>{const p=pos(n);if(p[1]>W-12)return;dot(ctx,p[0],p[1],radius(n,true),nodeColour(n),n.key==='.'?C.yellow:null,n.key==='.'?2:0);});ctx.restore();
        }
        function localTree(progress,alpha){
            const d=Math.min(branch.length-1,Math.floor(progress)),u=d<branch.length-1?smooth((progress-d-.18)/.64):0,a=data.nodes[branch[d]],b=data.nodes[branch[Math.min(branch.length-1,d+1)]],cameraDepth=mix(d,Math.min(branch.length-1,d+1),u),cameraX=mix(a.x,b.x,u),w0=1.06/Math.pow(2.72,d),w1=1.06/Math.pow(2.72,Math.min(branch.length-1,d+1)),viewWidth=Math.exp(mix(Math.log(w0),Math.log(w1),u));
            const pos=n=>[W/2+(n.x-cameraX)*W/viewWidth,W*.37+(n.depth-cameraDepth)*96];
            ctx.save();ctx.globalAlpha=alpha;
            edges.forEach(e=>{if(e[1].depth>Math.ceil(cameraDepth)+2)return;const p=pos(e[0]),q=pos(e[1]);if(Math.max(p[0],q[0])<-20||Math.min(p[0],q[0])>W+20||Math.max(p[1],q[1])<-20||Math.min(p[1],q[1])>W+20)return;const chosen=onBranch(e[1].word||e[1].key,Math.floor(cameraDepth+.001));ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.strokeStyle=chosen?'rgba(226,194,90,.88)':'rgba(201,191,168,.30)';ctx.lineWidth=chosen?4:1.45;ctx.stroke();});
            nodes.forEach(n=>{if(n.depth>Math.ceil(cameraDepth)+2)return;const p=pos(n);if(p[0]<-18||p[0]>W+18||p[1]<-18||p[1]>W+18)return;const active=n.key===branch[Math.round(cameraDepth)];dot(ctx,p[0],p[1],active?12:radius(n,false),active?C.yellow:nodeColour(n),active?C.ink:C.bg,active?2.5:1.3);});
            dot(ctx,W/2,W*.37,5.2,C.ink,C.yellow,2);ctx.restore();
        }
        function paintPattern(frac,cx,cy,maxW,maxH,alpha){const at=patternCrops[frac];if(!at||alpha<=0)return;const scale=Math.min(maxW/at[2],maxH/at[3]),dw=at[2]*scale,dh=at[3]*scale;ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(patternImage,at[0],at[1],at[2],at[3],cx-dw/2,cy-dh/2,dw,dh);ctx.restore();}
        function combinePatterns(stage,phase,alpha){if(alpha<=0||!patternImage)return;const n=data.nodes[branch[stage]],join=smooth((phase-.08)/.38),parentAlpha=1-smooth((phase-.36)/.12),childAlpha=smooth((phase-.50)/.12),split=smooth((phase-.54)/.22),nodeAlpha=(1-smooth(Math.abs(phase-.47)/.16));const left=mix(W*.24,W*.5,join),right=mix(W*.76,W*.5,join);paintPattern(n.p0,left,W*.5,142,142,alpha*parentAlpha);paintPattern(n.q0,right,W*.5,142,142,alpha*parentAlpha);if(nodeAlpha>0){ctx.save();ctx.globalAlpha=alpha*nodeAlpha;dot(ctx,W*.5,W*.5,5.5,C.yellow,C.bg,1.5);ctx.restore();}paintPattern(n.p1,W*.5,mix(W*.5,W*.29,split),150,132,alpha*childAlpha);paintPattern(n.q1,W*.5,mix(W*.5,W*.71,split),150,132,alpha*childAlpha);}
        function draw(t){ground(ctx,W);if(!draw.ready||!data)return false;const cycle=14.5,local=t%cycle,intro=1.25;
            if(local<intro){const a=smooth((local-.88)/.30);if(a<1)overview(1-a);if(a>0)localTree(0,a);return true;}
            const slot=Math.min(4,Math.floor((local-intro)/2.5)),phase=(local-intro)-slot*2.5,move=slot<4?smooth((phase-1.72)/.68):0,combineAlpha=smooth((phase-.18)/.15)*(1-smooth((phase-1.70)/.18)),combinePhase=clamp((phase-.25)/1.22,0,1);localTree(slot+move,1-.82*combineAlpha);combinePatterns(slot,combinePhase,combineAlpha);if(local>14)fadeOut(ctx,W,smooth((local-14)/.5));return true;}
        draw.ready=false;draw.failed=false;const pattern=new Image();Promise.all([fetch('gallery/plates/p-farey-tree.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}),new Promise((resolve,reject)=>{pattern.onload=()=>resolve(pattern);pattern.onerror=reject;pattern.src='images/f-lattice-branch-patterns.png';})]).then(values=>{patternImage=values[1];build(values[0]);}).catch(e=>{draw.failed=true;console.warn('F-lattice tree thumbnail:',e);});return draw;
    }

    function makePareto(ctx,W){
        const rand=randomFactory(0x706172),pts=[];for(let i=0;i<190;i++)pts.push({x:28+364*rand(),y:28+364*rand(),layer:1});const order=pts.map((_,i)=>i).sort((i,j)=>pts[i].x-pts[j].x||pts[i].y-pts[j].y);let maxLayer=1;for(let a=0;a<order.length;a++){const i=order[a];let m=0;for(let b=0;b<a;b++){const j=order[b];if(pts[j].x<=pts[i].x&&pts[j].y<=pts[i].y)m=Math.max(m,pts[j].layer);}pts[i].layer=m+1;maxLayer=Math.max(maxLayer,m+1);}
        const colors=['#3e6d91','#4d83a5','#6399b4','#8a79a3','#b2688a'];
        return function(t){ground(ctx,W,'rgba(204,121,167,.35)');const q=(t%13)/13,front=1+Math.floor((q<.92?q/.92:1)*(maxLayer-1));for(let layer=1;layer<=maxLayer;layer++){const a=pts.filter(p=>p.layer===layer).sort((u,v)=>u.x-v.x);if(a.length>1){ctx.beginPath();a.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=layer===front?C.yellow:'rgba(120,112,128,.18)';ctx.lineWidth=layer===front?2:1;ctx.stroke();}}pts.forEach(p=>{if(p.layer>front)dot(ctx,p.x,p.y,2.1,'rgba(120,112,128,.20)');else if(p.layer===front)dot(ctx,p.x,p.y,4,C.yellow,C.bg,1.2);else dot(ctx,p.x,p.y,2.7,colors[(p.layer-1)%colors.length]);});if(q>.92)fadeOut(ctx,W,smooth((q-.92)/.08));
        };
    }

    function makeExploding(ctx,W){
        const N=121,count=N*N,c=N>>1,pad=5,cell=(W-2*pad)/N,background=new Uint8Array(count),height=new Int16Array(count),first=new Int16Array(count);first.fill(-1);
        for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;background[i]=2+(hash2(x,y,0x9f6c51df)<.25?1:0);height[i]=background[i];}height[c*N+c]+=2;
        const fires=[];
        for(let round=0;round<520;round++){
            const fire=new Uint8Array(count);let any=false,edge=false;
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(height[i]>=4){fire[i]=1;any=true;if(first[i]<0)first[i]=round;if(x<3||x>N-4||y<3||y>N-4)edge=true;}}
            if(!any)break;fires.push(fire);const next=height.slice();
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!fire[i])continue;next[i]-=4;if(x)next[i-1]++;if(x<N-1)next[i+1]++;if(y)next[i-N]++;if(y<N-1)next[i+N]++;}
            height.set(next);if(edge)break;
        }
        const total=Math.max(1,fires.length);
        return function(t){
            ground(ctx,W);const local=t%12,round=Math.min(total-1,Math.floor(Math.min(1,local/9.5)*(total-1))),active=fires[round]||new Uint8Array(count);
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,a=first[i];if(a>=0&&a<=round){const band=Math.floor(a/12)*12,q=band/Math.max(1,total-1);ctx.fillStyle=a===round?C.ink:rampColour(ORDER,Math.min(1,q+(active[i] ? .07 : 0)));}else ctx.fillStyle=background[i]===3?C.deep:C.bg;ctx.fillRect(pad+x*cell,pad+y*cell,cell+.18,cell+.18);}
            if(local>11.5)fadeOut(ctx,W,(local-11.5)/.5);
        };
    }

    function makeDimensionalReduction(ctx,W){
        const M=20,M2=M*M,M3=M2*M,H3=[[21,19,26],[27,36,52],[38,54,81],[49,80,111],[61,106,146],[77,134,173]],s3=new Int16Array(M3),s2=new Int16Array(M2),v3=new Uint32Array(M3),v2=new Uint32Array(M2),frames=[];s3.fill(6);s2.fill(4);
        function capture(f3,f2){
            const top=new Uint8Array(M2),left=new Uint8Array(M2),right=new Uint8Array(M2),ft=new Uint8Array(M2),fl=new Uint8Array(M2),fr=new Uint8Array(M2);
            for(let y=0;y<M;y++)for(let x=0;x<M;x++){const i=y*M+x;top[i]=clamp(s3[i],0,5);ft[i]=f3?f3[i]:0;for(let z=0;z<M;z++){const a=z*M+y,b=z*M+x;left[a]=clamp(s3[z*M2+y*M+(M-1)],0,5);right[b]=clamp(s3[z*M2+(M-1)*M+x],0,5);if(f3){fl[a]=f3[z*M2+y*M+(M-1)];fr[b]=f3[z*M2+(M-1)*M+x];}}}
            frames.push({top,left,right,ft,fl,fr});
        }
        capture(null,null);
        for(let round=0;round<700;round++){
            const f2=new Uint8Array(M2),f3=new Uint8Array(M3);let any=false;
            for(let i=0;i<M2;i++)if(s2[i]>=4){f2[i]=1;any=true;}
            for(let i=0;i<M3;i++)if(s3[i]>=6){f3[i]=1;any=true;}
            if(!any)break;
            for(let i=0;i<M2;i++)if(f2[i]){const x=i%M,y=(i/M)|0;s2[i]-=4;v2[i]++;s2[x===0?i:i-1]++;if(x<M-1)s2[i+1]++;s2[y===0?i:i-M]++;if(y<M-1)s2[i+M]++;}
            for(let i=0;i<M3;i++)if(f3[i]){const x=i%M,y=((i/M)|0)%M,z=(i/M2)|0;s3[i]-=6;v3[i]++;s3[x===0?i:i-1]++;if(x<M-1)s3[i+1]++;s3[y===0?i:i-M]++;if(y<M-1)s3[i+M]++;s3[z===0?i:i-M2]++;if(z<M-1)s3[i+M2]++;}
            for(let i=0;i<M2;i++)if(f3[i]!==f2[i])console.warn('dimensional-reduction firing mismatch',round,i);
            if(round%3===2)capture(f3,f2);
        }
        const tile=document.createElement('canvas');tile.width=tile.height=M,tile.getContext('2d').imageSmoothingEnabled=false;
        function texture(values,fire,shade){const c=tile.getContext('2d'),im=c.createImageData(M,M),d=im.data;for(let i=0;i<M2;i++){const q=fire[i]?[246,241,230]:H3[values[i]],j=i*4;d[j]=q[0]*shade;d[j+1]=q[1]*shade;d[j+2]=q[2]*shade;d[j+3]=255;}c.putImageData(im,0,0);return tile;}
        function face(values,fire,p0,p1,p3,shade){texture(values,fire,shade);ctx.save();ctx.imageSmoothingEnabled=false;ctx.setTransform((p1[0]-p0[0])/M,(p1[1]-p0[1])/M,(p3[0]-p0[0])/M,(p3[1]-p0[1])/M,p0[0],p0[1]);ctx.drawImage(tile,0,0);ctx.restore();ctx.beginPath();ctx.moveTo(...p0);ctx.lineTo(...p1);ctx.lineTo(p1[0]+p3[0]-p0[0],p1[1]+p3[1]-p0[1]);ctx.lineTo(...p3);ctx.closePath();ctx.strokeStyle='rgba(201,191,168,.44)';ctx.lineWidth=2.2;ctx.stroke();}
        return function(t){
            ground(ctx,W);const local=t%12,fi=Math.min(frames.length-1,Math.floor(Math.min(1,local/8.5)*(frames.length-1))),f=frames[fi],top=[W/2,28],right=[W-28,102],bottom=[W/2,176],left=[28,102],down=[W/2,370],ld=[28,296],rd=[W-28,296];
            face(f.left,f.fl,left,bottom,ld,.72);face(f.right,f.fr,bottom,right,down,.84);face(f.top,f.ft,top,right,left,1);
            if(local>11.5)fadeOut(ctx,W,(local-11.5)/.5);
        };
    }

    function makeRandomSandpile(ctx,W){
        // Figure 1 of Convergence of the random Abelian sandpile: an i.i.d.
        // 3/5 disk, zero outside. Replay true legal intermediate states, then
        // compare independently stabilized larger disks at the same x/R scale.
        const scratch=document.createElement('canvas'),sc=scratch.getContext('2d',{willReadFrequently:true});
        const plate=document.createElement('canvas'),pc=plate.getContext('2d');
        const colors=DARK?[[30,30,36],[96,82,119],[186,92,116],[166,218,230],[249,216,119]]
                         :[[255,255,255],[101,80,127],[169,56,87],[58,145,171],[218,160,36]];
        let meta=null,run=null,atlas=null,scales=null,lastKey='';
        function paintData(source,index,size,columns,key){
            if(key===lastKey)return;
            scratch.width=scratch.height=size;plate.width=plate.height=size;
            sc.drawImage(source,index%columns*size,Math.floor(index/columns)*size,size,size,0,0,size,size);
            const im=sc.getImageData(0,0,size,size),p=im.data;
            for(let i=0;i<p.length;i+=4){const h=p[i],u=p[i+1]+256*p[i+2],c=colors[Math.min(4,h)];p[i]=c[0];p[i+1]=c[1];p[i+2]=c[2];p[i+3]=(h||u)?255:0;}
            pc.putImageData(im,0,0);lastKey=key;
        }
        function draw(t){
            if(!draw.ready)return false;
            ground(ctx,W);const local=t%21;
            if(local<12){const q=clamp((local-.65)/9.5,0,1),target=q*run.topplings[run.frames-1];let f=0;while(f+1<run.frames&&run.topplings[f+1]<=target)f++;if(q>=1)f=run.frames-1;paintData(atlas,f,run.size,run.columns,'e'+f);}
            else {const i=Math.min(4,Math.floor((local-12)/1.6));paintData(scales,i,385,5,'s'+i);}
            const side=(W-12)*(local<12?run.size/(3.2*run.radius):1);ctx.imageSmoothingEnabled=false;ctx.drawImage(plate,(W-side)/2,(W-side)/2,side,side);
            if(local>20.6)fadeOut(ctx,W,(local-20.6)/.4);
            return true;
        }
        function load(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url;});}
        draw.ready=false;draw.failed=false;
        fetch('gallery/plates/random-convergence.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(m=>{meta=m;run=meta.runs.find(r=>r.radius===48&&r.seed===777);return Promise.all([load('gallery/plates/'+run.file),load('gallery/plates/random-convergence-scales-777.png')]);}).then(images=>{atlas=images[0];scales=images[1];draw.ready=true;}).catch(()=>{draw.failed=true;});
        return draw;
    }

    function makeManhattan(ctx,W){
        /* Independently orient every horizontal and vertical line of Z^2 by a
           fair coin.  The walker picks one of the two lines through its
           position with equal probability and steps along that line's
           direction.  The path escapes: the walk is transient. */
        const hDir=y=>hash2(0,y,0x4d61)<.5?-1:1, vDir=x=>hash2(x,0,0x6e68)<.5?-1:1;
        const rand=randomFactory(0x9e3779b9), path=[[0,0]];
        let x=0,y=0,maxR=1;
        for(let s=0;s<2600;s++){
            if(rand()<.5) x+=hDir(y); else y+=vDir(x);
            path.push([x,y]);
            maxR=Math.max(maxR,Math.abs(x),Math.abs(y));
        }
        return function(t){
            ground(ctx,W);
            const q=(t%18)/18, grow=q<.88?smooth(q/.88):1, n=Math.max(2,Math.floor(grow*(path.length-1)));
            let lo=1e9,hi=-1e9,lo2=1e9,hi2=-1e9;
            for(let i=0;i<=n;i++){const p=path[i];if(p[0]<lo)lo=p[0];if(p[0]>hi)hi=p[0];if(p[1]<lo2)lo2=p[1];if(p[1]>hi2)hi2=p[1];}
            const span=Math.max(6,Math.max(hi-lo,hi2-lo2)*1.25), cell=(W-40)/span;
            const mx=(lo+hi)/2, my=(lo2+hi2)/2;
            const sx=a=>W/2+(a-mx)*cell, sy=b=>W/2-(b-my)*cell;
            const half=Math.ceil(span/2)+1;
            // the oriented lines, drawn as chevrons pointing the way each line runs
            ctx.lineWidth=1;
            const showGrid=cell>=5;
            for(let j=Math.floor(my)-half;j<=Math.floor(my)+half;j++){
                const py=sy(j); if(py<-8||py>W+8) continue;
                if(showGrid){ctx.strokeStyle=C.grid; ctx.globalAlpha=.20;
                ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke();}
                if(cell<9) continue;
                const d=hDir(j); ctx.globalAlpha=.42; ctx.strokeStyle=C.slate;
                for(let a=Math.floor(mx)-half;a<=Math.floor(mx)+half;a+=2){
                    const px=sx(a+.5); if(px<0||px>W) continue;
                    ctx.beginPath(); ctx.moveTo(px-d*3,py-3); ctx.lineTo(px+d*3,py); ctx.lineTo(px-d*3,py+3); ctx.stroke();
                }
            }
            for(let i=Math.floor(mx)-half;i<=Math.floor(mx)+half;i++){
                const px=sx(i); if(px<-8||px>W+8) continue;
                if(showGrid){ctx.strokeStyle=C.grid; ctx.globalAlpha=.20;
                ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,W); ctx.stroke();}
                if(cell<9) continue;
                const d=vDir(i); ctx.globalAlpha=.42; ctx.strokeStyle=C.slate;
                for(let b=Math.floor(my)-half;b<=Math.floor(my)+half;b+=2){
                    const py=sy(b+.5); if(py<0||py>W) continue;
                    ctx.beginPath(); ctx.moveTo(px-3,py+d*3); ctx.lineTo(px,py-d*3); ctx.lineTo(px+3,py+d*3); ctx.stroke();
                }
            }
            // the trajectory, oldest steps faded
            ctx.globalAlpha=1; ctx.lineJoin='round'; ctx.lineCap='round';
            for(let i=1;i<=n;i++){
                const a=path[i-1],b=path[i],age=i/n;
                ctx.strokeStyle=age>.82?C.rose:(age>.5?C.blue:C.cyan);
                ctx.globalAlpha=mix(.22,.95,age); ctx.lineWidth=Math.max(1.1,cell*.10);
                ctx.beginPath(); ctx.moveTo(sx(a[0]),sy(a[1])); ctx.lineTo(sx(b[0]),sy(b[1])); ctx.stroke();
            }
            ctx.globalAlpha=1;
            const o=path[0], p=path[n];
            ctx.fillStyle=C.ink; ctx.beginPath(); ctx.arc(sx(o[0]),sy(o[1]),Math.max(2.5,cell*.16),0,TAU); ctx.fill();
            ctx.fillStyle=C.rose; ctx.beginPath(); ctx.arc(sx(p[0]),sy(p[1]),Math.max(3,cell*.20),0,TAU); ctx.fill();
            return true;
        };
    }

    function makeORRW(ctx,W){
        /* Once-reinforced random walk: every edge has weight one until it is
           first crossed, then weight beta.  The walker steps along an incident
           edge with probability proportional to its weight, so it tends to run
           back along the trail it has already made.  The picture is the range:
           the set of edges crossed at least once. */
        const BETA=6, rand=randomFactory(0x2545f491), seen=new Set(), edges=[];
        const ek=(a,b,c,d)=>(a<c||(a===c&&b<=d))?a+','+b+'|'+c+','+d:c+','+d+'|'+a+','+b;
        let x=0,y=0; const path=[[0,0]];
        for(let s=0;s<2400;s++){
            const nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]], w=nb.map(p=>seen.has(ek(x,y,p[0],p[1]))?BETA:1);
            const tot=w[0]+w[1]+w[2]+w[3]; let r=rand()*tot,i=0;
            while(i<3&&r>=w[i]){r-=w[i];i++;}
            const p=nb[i], k=ek(x,y,p[0],p[1]);
            if(!seen.has(k)){seen.add(k);edges.push([x,y,p[0],p[1],s]);}
            path.push(p); x=p[0]; y=p[1];
        }
        return function(t){
            ground(ctx,W);
            const q=(t%16)/16, grow=q<.9?smooth(q/.9):1, n=Math.max(1,Math.floor(grow*edges.length));
            let lo=0,hi=0,lo2=0,hi2=0;
            for(let i=0;i<n;i++){const e=edges[i];
                lo=Math.min(lo,e[0],e[2]);hi=Math.max(hi,e[0],e[2]);
                lo2=Math.min(lo2,e[1],e[3]);hi2=Math.max(hi2,e[1],e[3]);}
            const span=Math.max(8,Math.max(hi-lo,hi2-lo2)*1.2), cell=(W-36)/span;
            const mx=(lo+hi)/2,my=(lo2+hi2)/2;
            const sx=a=>W/2+(a-mx)*cell, sy=b=>W/2-(b-my)*cell;
            ctx.strokeStyle=C.grid; ctx.globalAlpha=.13; ctx.lineWidth=1;
            if(cell>7){
                ctx.beginPath();
                for(let i=Math.floor(lo)-1;i<=Math.ceil(hi)+1;i++){const px=sx(i);ctx.moveTo(px,0);ctx.lineTo(px,W);}
                for(let j=Math.floor(lo2)-1;j<=Math.ceil(hi2)+1;j++){const py=sy(j);ctx.moveTo(0,py);ctx.lineTo(W,py);}
                ctx.stroke();
            }
            ctx.lineCap='round'; ctx.globalAlpha=1;
            for(let i=0;i<n;i++){
                const e=edges[i], age=i/Math.max(1,n);
                ctx.strokeStyle=age>.86?C.rose:(age>.45?C.violet:C.blue);
                ctx.globalAlpha=mix(.32,.92,age);
                ctx.lineWidth=Math.max(1.4,cell*.30);
                ctx.beginPath(); ctx.moveTo(sx(e[0]),sy(e[1])); ctx.lineTo(sx(e[2]),sy(e[3])); ctx.stroke();
            }
            ctx.globalAlpha=1;
            const last=edges[Math.max(0,n-1)];
            ctx.fillStyle=C.ink; ctx.beginPath(); ctx.arc(sx(0),sy(0),Math.max(2.5,cell*.22),0,TAU); ctx.fill();
            ctx.fillStyle=C.rose; ctx.beginPath(); ctx.arc(sx(last[2]),sy(last[3]),Math.max(3,cell*.26),0,TAU); ctx.fill();
            return true;
        };
    }

    function makeAvalanche(ctx,W){
        /* The exact sample of Figure 1 of "Sandpile avalanches in two dimensions
           are finite": a stationary sandpile in a wired 151 x 101 box, made by
           Wilson's algorithm and the inverse burning bijection, shown in the
           105 x 105 window that holds the avalanche.  First the burning tree
           (branches whose subtree has at least 12 sites, wider for larger
           subtrees); then one grain at the origin and the avalanche, run wave
           by wave (waves of 3494, 1953, 3034 and 2 sites; colour counts the
           topplings); then the six marked sites (the origin, its neighbours and
           a distant site), the tree paths joining them up to their common
           ancestor, the past of that ancestor (outlined), its path to the sink,
           and the 17 edges from the joining paths to sites outside the past,
           which the quantity L counts. */
        const n=105,DATA=atob('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CxoBBAMPD0JIQkNib0ZGW05OQkRJV1ZTSENCRUlDUQcHAhICBhtEQUdGVVNPSEdBS05MS0ljTlleTkFBU09KW04DBQcLDQUJAQErDgozCDsNBzMfHx8fCg8NKy8vAggTDQsPJSsBDgcGCxoPDw9BRUNFQmNuSUlKTk5LUk5OSUNWU09PSEZDUkwCBxIHCxsPQUtJU19JQkdHS01DREpiZ2NaT09OU0VGW0ADDgkJBwICJycrCgAyBzsOAjMKAQ4ACwoNCwUrLw8VFxYmKwEPCQsACw8BREZDTkZDRWdiQ09DRUZGUkJDSENFY29vb2JvUQcHFxcWERtER0lHU05IQ05EQUNPTkhmaWNKRUpNU0lLW04HBwcHAScnKwALDw4zADsJAjMJDgkODg0CCwUBKw8PCgArCwIKCgEODg4PD0lHQkNOTkZiQ0FDREZKUkdHY29vb0FKam9qbgsLCw4NFxsPQEdKV1dTT0JOTUNOR0JDYm5JSENFVlNFRktOTAsKBysLBQcFCg4zDTs+Bzc3NzIHNzMOEQEHKwoKBQcrHh8JDwUDCkFFQk1HV1dTTkZnY0VTX0pNV1dXY0VDSk9KSkpAagsLCw8PDkFBT0BLTEZTT01HQ09IQkdDZWdiQ0VDT1JJRUpNAw4NBisBDg0HAwg3NzY7HQsNDDY1OTY2EgcGKwULBQsABhsfCRIfRENFRldWWkdXU0hHZ2NfSklNSklHY0hDRUZGRktGa0ALREJAC0JPQkFJRlNeSENNU05NQ0lDT0FnYkNPRVJCBwcHAw8JDCsvAQ4HAw4bCwsFGh0DDQMCDgYzEwwmKwEACw4GCwUbHxIPAkZDQklNTk5NU09IR2NPSk9CQkJIY05OREpFRkJMa29eX0JFRUNCQk1DTlVXUkdHV1dXU0hDSUVGZmNPSVdWVlEKEw4DDQErDwgHAwgbCwQJAxkHBwMNMz4+FxcrDg8GBQEBBgYWGx8KD0ZDTk9CSU5OU05DSGNCSU5OTk5CZWZjTkNESUdHQWtAW19fX19PTkdHQ0JGVlFLTUtKV1dnY05GY25JSEpDTlNMEwEHAgcrLgYJAhcbDQcDDxoBDQcXNzIDCwYLDwEJAwYDDAsLAAsFC0VWU0VHQ09IV2Nvb29CQk9PQk9FR2NuQ05PT0lHV2tBRktFRktBTEpHU09AQ1FGQldXWkdXZ2NFZmNCT0hGY14THg0XJyYhKgcHFxsFCQkDChofCQYLCjczCwAGCw8IAwgSBwYLDw5FRlNPUklJQ09BR2NPREpDT09BT0pPVmdjTUNES0VLZmtFQkFOTkRGQ0FAU0lNQ1JAR1tLVlFbTWJjb29PSk9ib04XFxcbKy0nKw0LBgsABwMPCQUbCgENCgIzAAcLAQQTHxIeDAtEQUZLTXN/f3J/f0RGRmNCQk9SX09CQEZGW01nZ2NPSENEa0FCQkJJSUNCQk9BV1djb29BRktAWldbSWdjak9EYm5uTkkGBgEmJisACwoODgUCBxMFAwobDw8ACgczDwUGAw8SGhEHBwICRUVKTXNPeX9Fe39/b29fX19fSkpPRlZWW05DTWNNQ0JCam9vX19eXl5eXl9PREFjT05NS0tBWktOQEJjaW5vbUdGQ0kDDQIrAQEOBgYLBQoHARcTDwAbBQsCDgwyDwEHAxIfGhEKDAMPcn9Pcn9PT0BLRUZ7T0pFS0FFRkZGS1ZbQU1HR2dnY0JOSUBbSkBHQkdXU0VLTk1jTkNBS0tOW15BTkdiQ05IQ0hDQkgHBwIrAgIPDgENCQ0JEgcTCQEbHw4ODQcyDwUGEx8PGR0THx9Fc3p/f19FQk9AS0t7RUtPQU9JRUVKRktOTk1KV1NIY01DTkZbREJHR0pKU0lJR0ZiQ0JOS0BLQFtfXkFnZ2dnYkdTT04BBycrHw8PAAIDDggDFREXEwYGCgMPDwA3AAMSHgoOBxMfCgpIc0pAS0pGU05OTUx7RUtBTk9FQkdDSURKR0dHWlZWdnZ3c0VbT01KSkNIU09CSUNhQ0JKQkFGRkFGWkdLQFdXZ2dzSUgHJisOAAsPBQYHAwUCEx4JEwQLAAMODg0rBgMRAwgDBRMECgoPckRCS0pIUldXV1d7QU5WU0lOTklGQ09IRktWWkNCRUNBc0pFSkZDSGNvb29vSENlY09IQ05MQ01WW01MQltNRUp3cgcmKwEEBwEBBwMIEw8GEw4THQMJDQICBycrBgMVEw8FAxIFA0Byf0JFQUtFVlpMS0Z7f0BKV1JCU19PQklPSktbXXN/T0JGc0lJTENib29aX19qb29PYk9PTUdHV1dbSUZCR0pIQ0hJcgErLiIvCAcHBhMFEwIFEw0XFxcnIicnJisLCAIjLx8fHx8PD0VzT0JPRUpNRkNCSUB2e0VKTFdWU1leT09FVlZWWXN5f0JBc0JCYm9vSkVBVltBTGthb0lNR0ZGS0xJQkNFSkZDQkZzfQcGKy8qAgkJAxUTEh8fHgcGGwYaJysOAQEBBhYjDwQFCg4PQUJyX19fX19PT09PT0Z7fn9PRUpTX09PQkVGW05NQnJDeX9Fc29vb0RLSkZXW05BQ2lvX19PTUtLSUJHR0NOSENPT0Z3cgYLDgsqLy8vLyIvHw4OCQ4MGwAbBAIODw8BCQMiDw8PDw8BQnJ+SUpPTkpEQ0RLQXV2cXtFQ0hTTkRLT0RFSkVKRnZ2c3l+f0pAS09KVVZbW09OQ0JJTklPSkBKR0NJTEJDTUNJQURKc0FMCw4PCkFNKy8PDgcDDggXGwEbHx8KCgEPCCMvBQIEAg4PQnVzQkpAQ0VTX09EQ3pKd3tFR2NdQ09FS0JPQkpKQ0Vzf09PSUlORUZWW0tGS0pJQ0JNQ09AS01KTEdHR1JCV1NPQkJIc04HC0FRXk9KTQYLQAoHBwcbCwYGBhsPAQ8NIy8ECQcDAg8JRXN/T0lNQ1JfWV9fT3pNS0tCSGZmY0pFS0JKTkRJQ0JySU9PTUdDSk5BTkxFSkVJQ0ZCQ0FFSUZGQ0RFSVJXWXN/cn9/f1FeXl9fSkpKUU5OT01NTAYLCw8PBhsfHwgHLxoCDwUDAgIPD3JfSk9PUl9PT0VKRHp/fn5/cn9vb0VSTk9IQ09Pcn9+Q0lNQkJDSUlOTUNCT0lDT0ZHU0VGc39/f39CRVZac396f09FW19FVltBQEtFU0lJSUdCBwsLCwoKCwsBDQc2DxkfHx8fHw9EQXNaX19fX0RGRUlDTk9KQEZ7cnpKRUlTREZzf39/f0lNQ0JPR0ZDQkVHQ09CQUhzf0lKU3J/f09KT3pPRUNIc0pPQkRKRUtKW0FPT0tGV1dTSEJDTU1CTQYBCw4PDgs6CAMJDgoKRVZTTXNEQk1MW0JIR0dWU0pKRkt7f3pESUdXc39/RVZbTkNOQ05JSVNfT0JIU0pPRUZzeX9Ic39CT09BTXt/f39/f0RFQ09PQUFPWl9PSktFS0FXVldXY19fTgkCCwoKAAY7Iw4DAkFMS0BXUnNORkNOW05GS01TXkRKSktAQXtCQUtKc0RFQVtOSkNIQkdDQVNFQfP//0JPQnJ/T3p/f09PUV5PQEtFRltPWl9fT0VLUk9KREZLSkVLSkdJQ0hHY0RKTgcGBQINDQY7JyMCAkVHS05HV3JDSENNW0hDRElXV1dTREVHd3tPRkJCd3NPRktKTFdSQkdDRVNIRvNP+v/x/39KSkpFS0FOUlpKT0BLRltfSkVbQU9EU0pPT0pERUpKTUpHQkNOY19PSkAGEx0HBwY7BiMPAgJJSkJLTHdyQ0VWWUJHR0dLRkp3d3NEe35LRUZGSXNESkRJR0pXV1JC8/////9BSvr/+v9KT0FNRlNfX1lfT0VCTEZbX1VbT0pCUkpKQEVHQ09CSElGQkJDYlpFS00THTcyAQA7Iy8fHwICD0FKR0p3ckdCQkNMQUtCTHd6QnNPRXtLRXN/f39NR0dHQUpKR1dX809PT1pPSUVG9vtEQkJNR1NaT09KQUJBR1ZWW1peXl9SX0pBTkNFQ09ORUNORkdTYlpJTAcSNzozDg07IwQLCg8PCkFHRUpKd3F3ckJCQ0x3d3tNRnNKQHt+T3JAS0lDTkVBR0pMRUpC809CQUpKT0lM+15fT0VGQlNaT09KT0JGRltAS0VGS1pfQEtCTUJTTkhGQ0VDRkdTYlpPTgcXOwo3Mjc7Iw4JDwALD0VJA0ZBSnd6d3d3d3J7TEpNc39AV1t6f39FSkhDQkFCSUdHQ0hG809PQkpPSk5P+kVLSkVDRVNKT0FKT09KQEFDTEtAS0VCT05CR1dXV1NPUl9CRkdjbkRLT05NOwsMNzsBJyYjCQECBQcDAkhDTEFaS0BGWnd5R3N/f0pGW0BGS0BDTlNfT0FCR0pHR/P//19BT0RLQENA+/9KT0JCYm9FS0JFS0VLRkdCQ01HS0BDTk9HS0BKQlNfX1pPSUpnZmNJTklNOwACGx4PCSMvLwUDBgcTDg5FR0ZaTk9NW0BHSXNESkBWW0ZGS05HQ1JFS0dDTElKTPNPQlpPRENKTkNCTPtFS09ib0RKSk9FQkBLSUpXU0FGS0FHQ0lKTkJNR1NJSklKT0VJY24HBwcHOwEHCxoPIy8AKy8CBAkXFxMPSAMPSkFJW19NR3JDT1ZbQUFOTkxHU15JTU1CR0dCQvNOTklJTk5JSUNFR/v/////T0JPT0pFQ0VCQkZJU0JERUJGU19fQk9JR1NPSENCSENPYl9eTQsNOwEGBhsPIwkBJisGAwIKCRMIAw5FRkNNVlpNSndzT1peT0JCTkNIUldTQkhGUUpnZ/fzXl5eX19fSENPSkvFwUv6SkJPT0FPT09CTkhTXk1DT01TX0paX0FJR2NCRUNFRmNvb0VLQAsAOz8ACwsKIw8GKwQCAw4IBhIHAgNGR1dXWUNFS01zSUVbUV9PSUdCVllTUl9SXWdqR0f3805DSkBbX09ERvb39/b7QUJJQENJTkNGQkJXV1NPTkJTTkVLSk5IQmNvb29vbm9KT0pBT0wHCzoOAQsKLwALKy8GFxcTEh4CAgNEQUtJQkNCSUhzQkBbX0pPSEdCR0JTX1pdQmtLQUFM9/NPRUdWW09PQHvGy1teX09PQVNPT09JV1ZWUlNPSEdSQ0pLTUdDT2NOT09JA0RKSUlOSAI2MTsABwsBAQcGASsECw0jHw4HAgcDRUlHQkNNQ0FzTkZbTk5IQkJCR1djRElDTWtBT01DRfNFS01bQEtFQntARkZGRkZGR1NESkRGSkdDUVNBQ0hXU0lJR0JDQWdjRUtNBwMCDgcnJyI6NzsPDQsSBQYBBysvCQ0jCgoNBxYWEw9IR0JHQ0V2c0RaQkdCR0dXVlpnZ2dnYmtvSUNP8v9KRUpbX15JQntFR0NIQ05MSVJHZ2ZjSUxDVWNNZ2diU09GSlZTT0djREkHAgMOCAYrACI7Pg4NCgsSDggHBQErLy8vCQoPDBMfHwECRVZSR3N/f09ZR0pHQUtNRkZBRltKZ2ZrSPP//09FRkFLT1pBQnt/RUZGR1dXV1dVWUNhQ0VDQmZna11iU0RKSlNfQEdjT0JNBhYSBwYrLicmOwENIi4vDw8IAwEbDwUKDwUKEx4OGR8PDw9VV3NKRUZZRkpCUkZBRkpXVVpNRktNQ/JOQU5BQEdGVltBV1Z7T09CREpNS01DT0JmY09PQklFVlpiU09PSVNJTkxjSU5IAxIeBiYmKwENOwYDIg8PCgAXEx0bAQkDCQQJFhMCDwoPQAsCSHNKSkpHS0BHV1dSSldaQ05ISk5MQ/FDQk5OTkxLS0tGS017SkpCQkJFS05DQkJFY0VDRUNAW11nY0lESldSY29vTk0HEx8JASsuHh8OOwgjLwABDwYaFxcbDwgDDxIfHx8PBQtBTQsPcn9JRUpNTU1DSEdSSltAR0NOTkhCQ/XzRVdTTUdGS0BCTXd7QEtPQkJOSU1DT0Fjb0hTT09BQVtMY05OSEZSY0pABwMPEwkIBwErLwoOOy8vBQcCDwobHQUKCAcDIi8fBAJBQURCBwtEc0JCSEdGRkZGRkZWV1tNSldXV1dSQ/L/T0lSR0tLTkZDTXtOQkFOT0ZHRkZTQk9jX19fRUtBV1pCYmdnZ2NVY0JBBwMFEw4DDAcGKwoJCw8KBAkDAQQGGgcCAgojLgQbDw9ST05OTAtyf09PT0lDQUdHQ0VDREpHRkpMSklS8/9OSUlSRlZWUkxXUntPT09BQUlMQ09STkVjSkVWVlVWWk1HZ2tLQGdzb0JOTAcTHg0HBwsGKwoOCwEMFxcXEh8VGw0HBwInIw8KCkBTTUdDRkVzSk9BTUhDQk5NQ0JOQkhKQ0JGRkdX80hDT0hXVltKV1dZUnt/QXF/QkZDT0pVY29vQUBbXUJHQ0hBW01LTUpzSkZDTgcXFxIBBiYmKw8KDgYXGwoJHxoaDg4EAQcJIwUGC+bn5+fjSHN+SUlNR1NOTklNQ0ZDRUZJQ0JIQ0hG8kZDQk9ES0ZKTEJXYkZ7QnJ5f0VDQklDYkpEQ0ZGWkJBV1dXW0RBR0pzRUdTSAsNChcXJisLBQoFBgsLDQIHBBsJCQoCDgwHIwpARuvtSkfn5/f39/f38lJCR0JCQ05CQ01HQ09PRUPy/UNSX0FCRElCQkdaZ2F7QnJCeX9ST0hzf0RDT0RBWkdHS0ZLW09PTUlzRkdTQkAKFxYWGw4MCQMECgwKDQICDxoFAwkNBwcKI0BHQUbqRkFGS0BGa01K9/JCQUf39/NOR0JHU05O8//9Q1JfSU9PT0VGR0tJSmd7cn9PT3l+f39/en9CT09GWk5NS01GS0RKTXN/RkdTQkEKGw4ODQoGAw8GBwMPAQcHBRoODwIPDQwJI0VK5+brTUdLQEdma09ASvfyR0H7TPNAR0dXV/P//khHU19PT0RKTkVDRElDQEF7f29vb29PRUpORXtyf0FIQ0VLTUtMSkdHQ3JFRkpTQkEKCwoPDwwDDw8JDAMFBwcHCQMPCQ4IAwUjLwJJ60BbX05MQktrTktOSkr39/f6R/NFQkxLSvNIQ01HU09PT05PT09CT09PRkdLQEtAS2pKSENPSnt/en9PT0RKTUlGSUtKc39JTElTT04LDg0LDgMPAAsPAg4ECgwKCgMPAg8PBSMvAANF6+9GS05CQktrX01MSVdWVlZaR/NOTUdLTff39/f3805JSENJREVTTklPSUxLRkJOTGtvQkJPSktPRHtAS0JPRUNCT0lMc25ubm9vb29OQAsNChMFBwYGFxMOAgcDCCMvAgkBIi8BBQMC1dtAS0lCV2ZrWUdHR1tOQUBJR/JHQ0RKTUtMSkNN9/N/f39CQkJVU09CT09KRldTTVZrT09PREVJQ3l/cX9/f39CSU5PdndzT0pKRWtfX05BTBMECgoDDRMNBwIDIy8qLy8iLwoSDw8P2kZGSkhCW2tLWk1GRkZLTk1HV/JK9/fzTkdDTVdXV/NJRXt/f39yf0FCT0BLSlpXV1tOTkBJU15PT095f2Vma3pFQ09FQUdzSkpAS0VGW19BAhcTDggGBxcXFhYTIg9ABisvER8fDwrV2kxCR1dXW2tLWk9OQEJNR0JLWvf3+UbzSk1HV1tLSvfzQFtPRXt/elJfQUJMVltNS0tPSk5GVlNKSk9PQGtLRXtCQkFIRklzRUZHS0FMVltBBwcXEw8PCgUJBgMSL0VCCwsaH0VBC9XZR0dHRltGRmtOS09ERkNBSkdGS01J8//ySUhLTUtLTUrzVltPRUZLel9aT0ZGW15OTk1NQUpGU19FS09BQWtuRnt/f3J/QkVzSkVBQUdHW0FPTQsJEwIECQMFAwISCUhGRUZGVtfX1tpHRktLS1tNZmtfS0pPQkJPTkxLSkhH8/n/QUZLSUtLSkzzWl5OSk5Ae0VbSkhDREtPTkNIRklTX0pFRkFDTUFrTUtKen96f09yREFHV1FWW09PSQojLy8vLy4uLy8vJiMCD0lKTdvBTkRBQUFWVltOa05bTk5LT1JPQENIV1JX9/NJTUNJSEtLTfP/VVtFRktPe0BbQU9PT0lJTUNSX19fQU1NTFdXV2drREFGS0FNe0F1c0ZLSVdbS09PTkwjBQsJCAMPCg8KIy8PDwEDRdreXl9OR0dLTUtna09bQEtFS1JJQUJXWldbTPJH9/fyQ0RJ8/9FW15JQEJMe0JaX19fSkJBQlNeSURKRkdCV1tOQGtRT09OTk9Ie39/cklMQ0lNRUtOAw8iCQwDDwIACw8KIxofHwUDDw8PD1peS0tOQEtrbkBbX19ERVNPQUdbXUtKQvJB+kf38kPy/0pBTFtfRkd3e09AQkxbT09WV1dSR0NOSUdHW05GQmtfT09PQEpna0p6f0JFQ0FDT0RKIy4tBgMCDw8FCgkAMwQGGw8SDw4ODkpZRktFR0FLakJNS1pfXl9BQk1GW0BKRvby+0xK8vP/QU9BR1ZbQHZ7REJFQkJLT0BbQEJSQkJDSUZGS09BZ2tBTUtBQWdrQEZWW19fX0VDSU9IJyciMz8/CgECDw8BPw8EGxEfCQcHA0paXkFNSkdGa0JBRktNA1lPQk1BW05JBwP1+QNJ8vNJT0FWVltFR3tLQkVDRUJGS0VbTkdXUkJDRkZWVldna0tCSUJPTWtOT09bXk5LWk9PT0AHBwIiMwI6PxIfHwUHCQ0DGh8KCQIMA0RFW09JQUtGW19fTkAHBgNJTUJCW00GCQcDDw9I9vNPSk9KTkFNRntub29vb29KTk9JSk5AUkdDSUtLTUZrUV5fT09JZ2tPRUZGW09AS0pBQU4LCQYmMw8FOx8FGwkKNzczBAoKDQIHAw4PSk9OQkZBQVZbQU4KEx8fAkZCWgcHAwUDMT8/Pz9BTEtAS09PTWtvb0FOQGtvT0pPREpNYkJDT0VLR0ZrX09KRUZBa25FS05OQUFPQEJCT0lMMz8/Pw8FOwULGw8PCgkzHw8IAwEHFxMJRUtIR1dXV1tBQklMEwkaD0hCW05MMz4/Mg8KQEZHQkZCS0FNTEtPal9KQUZrT0Fhb0JCYUdTRUtLREFrT0pPVldXZmtKTk5BT0JAR1NPSAYzPw8EBgYLOwUGCwALBwczBAoODg0DCRMCSUxGSlteREVTX04HEw4aHwJFSkkDNjM5P0FNR0dHQkpDTU1HQmZma1pBT01rb29vam9CZmZjREVJQ0Vqb0VWW0BBa0tRXl5CT09FSVNIMz4+DgkPCQwLOwkGCwIOHgA2NjYzDgYDCBMCDw8CDklaQlJfSk5MFxMECg8CAkgDBTMPQU5JTEdHU0hnZ2dnZ2tARltCREFLT0BBRmtvSGNvX0VCQ0JPakRLTkFHa05ST1pSX19fX14DMQcDDw8KDw8AOw8KCwICGw0HAjM/CAMGAhMPDwEBAw5aXl5OSAMPCBMFAwkPDgczPz8PQUJCR0FBV2drTUZGW15PTVtfT0ZGQk1HS0BrT2JPWl9FQ09Fa09KQU1La1FeRFpeSURFRUkzPgkDCQoAAQYCOz8ECwIPGgcKBzMNNzMFBxMPCg8GFxNIBgIDBQMFAxUTBQMECQozCQQDRkJnZ2dnZmtOQEtBTEZLQFZbT0hHQldWVldrQWJfRVtfX0BGa0pK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'),MARKED=[[56, 51], [55, 52], [56, 52], [57, 52], [56, 53], [8, 74]],ANC=[40, 79],GAMMA=[[40,79],[40,80],[39,80],[38,80],[37,80],[36,80],[36,81],[36,82],[35,82],[35,81],[34,81],[33,81],[33,82],[34,82],[34,83],[34,84],[33,84],[32,84],[32,85],[32,86],[32,87],[32,88],[32,89],[31,89],[30,89],[29,89],[28,89],[28,88],[27,88],[26,88],[26,87],[25,87],[24,87],[24,88],[24,89],[23,89],[22,89],[21,89],[20,89],[20,90],[19,90],[18,90],[18,91],[18,92],[17,92],[17,91],[17,90],[16,90],[16,91],[16,92],[15,92],[15,93],[15,94],[16,94],[17,94],[18,94],[18,95],[18,96],[19,96],[20,96],[20,97],[20,98],[20,99],[19,99],[18,99],[18,98],[18,97],[17,97],[17,98],[17,99],[17,100],[16,100],[15,100],[15,99],[14,99],[13,99],[13,100],[12,100],[11,100],[11,101],[12,101],[13,101],[13,102],[14,102]],GEXIT=0,CONTACTS=[[13,63,12,63],[12,69,11,69],[12,70,11,70],[11,71,11,70],[11,71,10,71],[10,72,10,71],[10,72,9,72],[9,73,9,72],[7,75,7,76],[8,75,8,76],[34,77,34,78],[35,78,35,79],[35,78,34,78],[36,78,36,79],[36,78,37,78],[39,79,39,80],[40,79,40,80]],SRC=[56, 52];
        const count=n*n,height=new Uint8Array(count),dir=new Uint8Array(count),width=new Uint8Array(count),inC=new Uint8Array(count),inK=new Uint8Array(count),inBox=new Uint8Array(count);
        for(let k=0;k<count;k++){const b=DATA.charCodeAt(k),j=(k/n)|0;inBox[k]=j>=2&&j<=102?1:0;height[k]=b&3;dir[k]=(b>>2)&3;width[k]=(b>>4)&3;inC[k]=(b>>6)&1;inK[k]=(b>>7)&1;}
        const DX=[0,1,0,-1],DY=[1,0,-1,0],src=SRC[1]*n+SRC[0];
        const nb=k=>{const i=k%n,j=(k/n)|0,out=[];for(let d=0;d<4;d++){const a=i+DX[d],b=j+DY[d];out.push(a>=0&&a<n&&b>=0&&b<n&&inBox[b*n+a]?b*n+a:-1);}return out;};
        /* The avalanche, wave by wave; a round is one generation of topplings. */
        const ht=Uint8Array.from(height);ht[src]++;const waves=[],odo=new Uint8Array(count);
        while(ht[src]>=4){
            const round=new Int16Array(count).fill(-1);let frontier=[src],r=0,last=0;
            while(frontier.length){const next=[];
                for(const v of frontier){if(round[v]>=0||ht[v]<4)continue;round[v]=r;last=r;ht[v]-=4;odo[v]++;
                    for(const u of nb(v))if(u>=0){ht[u]++;if(u!==src&&ht[u]>=4&&round[u]<0)next.push(u);}}
                frontier=next;r++;}
            const sites=[];for(let k=0;k<count;k++)if(round[k]>=0)sites.push(k);waves.push({round,sites,rounds:last+1});
        }
        const support=[];for(let k=0;k<count;k++)if(odo[k])support.push(k);
        const pad=6,cell=(W-2*pad)/n,cx=k=>pad+(k%n+.5)*cell,cy=k=>W-pad-(((k/n)|0)+.5)*cell;
        const layer=()=>{const c=document.createElement('canvas');c.width=c.height=W;return c;};
        const pal=DARK?{tree:'#55536a',warm:[[94,60,52],[139,80,62],[186,102,74],[226,140,96]],front:'#FFF0CB',navy:'#EDE7F6',past:'#7FC3E0',gamma:'#B79BE0',gold:'#E2C25A'}
                      :{tree:'#c3bfcb',warm:[[241,213,188],[227,165,126],[201,105,79],[168,74,58]],front:'#6e2419',navy:'#1f2a44',past:'#3f7fa3',gamma:'#7b4f9e',gold:'#C08A00'};
        /* Burning tree */
        const tree=layer(),tc=tree.getContext('2d');tc.lineCap='round';tc.strokeStyle=pal.tree;
        for(const w of [1,2,3]){tc.lineWidth=[0,.9,1.6,2.4][w];tc.beginPath();
            for(let k=0;k<count;k++){if(!inBox[k]||width[k]!==w)continue;const x=cx(k),y=cy(k);tc.moveTo(x,y);tc.lineTo(x+DX[dir[k]]*cell,y-DY[dir[k]]*cell);}tc.stroke();}
        /* Joining paths, past outline, outgoing path, contacts */
        const paths=layer(),pc=paths.getContext('2d');pc.lineCap='round';pc.lineJoin='round';pc.strokeStyle=pal.navy;pc.lineWidth=2.4;pc.beginPath();
        for(let k=0;k<count;k++){if(!inK[k])continue;const i=k%n,j=(k/n)|0,a=i+DX[dir[k]],b=j+DY[dir[k]],p=b*n+a;if(a<0||a>=n||b<0||b>=n||!inK[p])continue;pc.moveTo(cx(k),cy(k));pc.lineTo(cx(p),cy(p));}
        pc.stroke();
        const past=layer(),qc=past.getContext('2d');qc.strokeStyle=pal.past;qc.lineWidth=2;qc.beginPath();
        for(let k=0;k<count;k++){if(!inC[k])continue;const s=nb(k),x=cx(k)-cell/2,y=cy(k)-cell/2;
            if(s[0]<0||!inC[s[0]]){qc.moveTo(x,y);qc.lineTo(x+cell,y);} if(s[2]<0||!inC[s[2]]){qc.moveTo(x,y+cell);qc.lineTo(x+cell,y+cell);}
            if(s[1]<0||!inC[s[1]]){qc.moveTo(x+cell,y);qc.lineTo(x+cell,y+cell);} if(s[3]<0||!inC[s[3]]){qc.moveTo(x,y);qc.lineTo(x,y+cell);}}
        qc.stroke();
        const gpts=GAMMA.map(p=>[pad+(p[0]+.5)*cell,W-pad-(p[1]+.5)*cell]),ge=gpts[gpts.length-1];gpts.push([ge[0]+DX[GEXIT]*cell,ge[1]-DY[GEXIT]*cell]);
        return function(t){
            ground(ctx,W);const q=t%17;
            ctx.globalAlpha=smooth(q/1.6);ctx.drawImage(tree,0,0);ctx.globalAlpha=1;
            /* waves between 2.6 s and 9.6 s, each given time growing with its rounds */
            const weights=waves.map(w=>Math.sqrt(w.rounds)+1.5),total=weights.reduce((a,b)=>a+b,0);let start=2.6,current=-1,z=0;
            for(let i=0;i<waves.length;i++){const d=7*weights[i]/total;if(q>=start){current=i;z=clamp((q-start)/(d-.25),0,1)*(waves[i].rounds-1);}start+=d;}
            for(const k of support){let c=0;for(let i=0;i<current;i++)if(waves[i].round[k]>=0)c++;if(current>=0&&waves[current].round[k]>=0&&waves[current].round[k]<=z)c++;
                if(!c)continue;const col=pal.warm[Math.min(4,c)-1];ctx.fillStyle=`rgb(${col})`;ctx.globalAlpha=.88;ctx.fillRect(cx(k)-cell/2,cy(k)-cell/2,cell+.3,cell+.3);}
            ctx.globalAlpha=1;
            if(current>=0&&q<9.8){const w=waves[current];ctx.fillStyle=pal.front;for(const k of w.sites){const age=z-w.round[k];if(age<0||age>5)continue;ctx.globalAlpha=.9*(1-age/5);ctx.fillRect(cx(k)-cell/2,cy(k)-cell/2,cell+.3,cell+.3);}ctx.globalAlpha=1;}
            /* then the marked sites, the joining paths, the past, the path to the sink and the contacts */
            const a1=smooth((q-9.9)/.9),a2=smooth((q-10.9)/.9),a3=smooth((q-11.9)/1.1),a4=smooth((q-13.1)/.6);
            if(a2>0){ctx.globalAlpha=a2;ctx.drawImage(past,0,0);}
            if(a1>0){ctx.globalAlpha=a1;ctx.drawImage(paths,0,0);}
            if(a3>0){ctx.globalAlpha=1;ctx.strokeStyle=pal.gamma;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();const m=Math.max(1,Math.round(a3*(gpts.length-1)));ctx.moveTo(gpts[0][0],gpts[0][1]);for(let i=1;i<=m;i++)ctx.lineTo(gpts[i][0],gpts[i][1]);ctx.stroke();}
            if(a4>0){ctx.globalAlpha=a4;ctx.strokeStyle=pal.gold;ctx.lineWidth=4.2;ctx.lineCap='round';ctx.beginPath();
                for(const e of CONTACTS){const x1=pad+(e[0]+.5)*cell,y1=W-pad-(e[1]+.5)*cell,x2=pad+(e[2]+.5)*cell,y2=W-pad-(e[3]+.5)*cell;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);}ctx.stroke();}
            ctx.globalAlpha=1;
            if(a1>0){for(const s of MARKED){const k=s[1]*n+s[0];dot(ctx,cx(k),cy(k),3.4,pal.navy,C.bg,1.4*a1);}
                const k=ANC[1]*n+ANC[0];dot(ctx,cx(k),cy(k),4.2,C.bg,pal.navy,2*a1);}
            const sx=cx(src),sy=cy(src),drop=smooth((q-1.9)/.7);if(q>1.9)dot(ctx,sx,sy-(1-drop)*W*.06,3.4,C.ink,C.bg,1.4);
            if(q>16.4)fadeOut(ctx,W,(q-16.4)/.6);
            return true;
        };
    }

    function makeCentrallyExcited(ctx,W){
        /* Centrally excited random walk on Z^2 with drift 0.4.  On its first
           departure from a site x other than the origin the walker steps to
           x+e_i or x-e_i with probability 1/4-0.2x_i/|x| or 1/4+0.2x_i/|x|,
           a mean step of size 0.4 toward the origin; every later departure
           from x, and every departure from the origin, is a simple random
           walk step.  After n steps the range is close to the disk of radius
           r_n=(3n/(1.6pi))^(1/3), drawn as a circle.  The picture is rescaled
           by r_n and each visited site is coloured by (first visit/n)^(1/3),
           old blue to recent rose.  Early on, arrows at unvisited sites show
           the mean first step.  The walk is simulated as the film needs it. */
        const DELTA=.4, N=4000000, H=230, S=2*H+1, KEEP=2600, NB=64, rand=randomFactory(0x43455257);
        const first=new Int32Array(S*S).fill(-1), path=new Int32Array(2*KEEP+4);
        let sites=new Int32Array(3*8192), count=0, x=0, y=0, j=0, steps=N;
        function advance(n){
            n=Math.min(n,steps);
            while(j<=n){
                const id=(y+H)*S+x+H;
                if(first[id]<0){
                    first[id]=j;
                    if(3*count+3>sites.length){const g=new Int32Array(2*sites.length);g.set(sites);sites=g;}
                    sites[3*count]=x;sites[3*count+1]=y;sites[3*count+2]=j;count++;
                }
                if(j<=KEEP+1){path[2*j]=x;path[2*j+1]=y;}
                let px=.25,py=.25;
                if(first[id]===j&&(x||y)){const r=Math.hypot(x,y);px-=DELTA*x/(2*r);py-=DELTA*y/(2*r);}
                const u=rand();
                if(u<px)x++;else if(u<.5)x--;else if(u<.5+py)y++;else y--;
                j++;
                if(Math.abs(x)>=H-1||Math.abs(y)>=H-1){steps=j-1;break;}
            }
        }
        const stops=DARK?[[52,92,128],[75,141,178],[118,108,206],[184,92,120]]
                        :[[118,164,190],[54,122,159],[96,84,190],[164,62,97]];
        const fills=[], words=new Uint32Array(NB);
        for(let b=0;b<NB;b++){
            const q=b/(NB-1)*(stops.length-1), i=Math.min(stops.length-2,Math.floor(q)), a=q-i;
            const c=[0,1,2].map(k=>Math.round(mix(stops[i][k],stops[i+1][k],a)));
            fills.push(`rgb(${c[0]},${c[1]},${c[2]})`); words[b]=(255<<24|c[2]<<16|c[1]<<8|c[0])>>>0;
        }
        const bins=[]; for(let b=0;b<NB;b++)bins.push([]);
        const img=ctx.createImageData(W,W), pix=new Uint32Array(img.data.buffer), col=new Int32Array(W), row=new Int32Array(W);
        const radius=n=>Math.cbrt(3*n/(1.6*Math.PI)), R=.38*W;
        function visited(k){let lo=0,hi=count;while(lo<hi){const m=(lo+hi)>>1;if(sites[3*m+2]<=k)lo=m+1;else hi=m;}return lo;}
        return function(t){
            ground(ctx,W);
            const s=t%15, A=2.6, B=11.6, N0=120;
            let n=s<A?N0*s/A:(s<B?N0*Math.pow(N/N0,(s-A)/(B-A)):N);
            advance(Math.floor(n)+1); n=Math.min(n,steps);
            const k=Math.floor(n), rn=radius(n), scale=R/Math.hypot(rn,3.4), cx=W/2, cy=W/2;
            const sx=a=>cx+a*scale, sy=b=>cy-b*scale, detail=clamp((scale-20)/14,0,1);
            if(scale>=3){
                const m=visited(k), gap=scale>7?Math.min(2.2,scale*.07):-.35, size=scale-gap;
                for(let b=0;b<NB;b++)bins[b].length=0;
                for(let i=0;i<m;i++)bins[Math.min(NB-1,(Math.cbrt(sites[3*i+2]/Math.max(1,n))*NB)|0)].push(i);
                for(let b=0;b<NB;b++){
                    const bin=bins[b]; if(!bin.length)continue;
                    ctx.beginPath();
                    for(const i of bin)ctx.rect(sx(sites[3*i])-size/2,sy(sites[3*i+1])-size/2,size,size);
                    ctx.fillStyle=fills[b]; ctx.fill();
                }
            }else{
                for(let p=0;p<W;p++){col[p]=Math.round((p+.5-cx)/scale);row[p]=Math.round((cy-p-.5)/scale);}
                const inv=1/Math.max(1,n);
                for(let py=0;py<W;py++){
                    const b=row[py], base=(b+H)*S+H, o=py*W;
                    if(b<=-H||b>=H){for(let p=0;p<W;p++)pix[o+p]=0;continue;}
                    for(let p=0;p<W;p++){
                        const a=col[p], f=a>-H&&a<H?first[base+a]:-1;
                        pix[o+p]=f>=0&&f<=k?words[Math.min(NB-1,(Math.cbrt(f*inv)*NB)|0)]:0;
                    }
                }
                ctx.putImageData(img,0,0);
            }
            if(detail>0){
                const half=Math.ceil(W/2/scale)+1;
                for(let b=-half;b<=half;b++)for(let a=-half;a<=half;a++){
                    if(!a&&!b)continue;
                    const f=first[(b+H)*S+a+H], fade=clamp((.5*W-Math.hypot(a,b)*scale)/(.14*W),0,1);
                    if((f>=0&&f<=k)||!fade)continue;
                    ctx.globalAlpha=.72*detail*fade;
                    arrow(ctx,sx(a),sy(b),Math.atan2(b,-a),scale*.3,C.slate,Math.max(1.4,scale*.055));
                }
                const hi=Math.min(k,KEEP),lo=Math.max(0,hi-80),pts=[];
                for(let i=lo;i<=hi;i++)pts.push([sx(path[2*i]),sy(path[2*i+1])]);
                const f=smooth(n-k);
                pts.push([sx(mix(path[2*hi],path[2*hi+2],f)),sy(mix(path[2*hi+1],path[2*hi+3],f))]);
                ctx.globalAlpha=.55*detail; trace(ctx,pts,1,C.ink,Math.max(1.2,scale*.06));
                const p=pts[pts.length-1]; ctx.globalAlpha=detail;
                dot(ctx,p[0],p[1],Math.max(3,scale*.17),C.yellow,C.bg,2);
            }
            ctx.globalAlpha=.45; ctx.beginPath(); ctx.arc(cx,cy,rn*scale,0,TAU);
            ctx.strokeStyle=C.ink; ctx.lineWidth=2.2; ctx.stroke();
            ctx.globalAlpha=1; dot(ctx,cx,cy,Math.max(3,Math.min(6,scale*.2)),null,C.ink,2);
            if(s>14.2)fadeOut(ctx,W,smooth((s-14.2)/.8));
            return true;
        };
    }

    function makeLogCorrelated(ctx,W){
        /* Brownian particle in a log-correlated potential:
           dX = grad log a(X) dt + sqrt(2) dW in the plane, with
           log a(x) = sigma * sum_{k=1..4} (g_k(x) - g_k(0)).  The g_k are
           independent smooth random fields of equal strength, g_k varying on
           length scale 3^k (gradient noise with quintic interpolation on a
           randomly rotated lattice of spacing 3^k), so log a is log-correlated
           between the scales 3 and 81.  Drawn in the style of the superdiffusion
           thumbnails: a wash by the sign of the potential and its level lines.
           The drift is perpendicular to the level lines and points uphill, so
           the particle lingers near the maxima of the potential, where its
           reversible measure a(x)dx puts its mass, and crosses the barriers
           between them.  Euler-Maruyama with the exact gradient of the same
           field; the camera follows the particle.  sigma is far above the weak
           disorder of the paper, so that the trapping is visible. */
        const OCT=4,SIGMA=3.6,DT=.004,STEPS=25000,KEEP=1,PATHSEED=6,HALF=8,octaves=[],GX=[],GY=[];
        for(let i=0;i<16;i++){GX.push(Math.cos(TAU*(i+.5)/16));GY.push(Math.sin(TAU*(i+.5)/16));}
        const pick=randomFactory(0x10c0);
        for(let k=1;k<=OCT;k++){const th=TAU*pick();octaves.push({s:3**k,c:Math.cos(th),n:Math.sin(th),ox:1000*pick(),oy:1000*pick(),seed:(0x10c0*31+k*0x9e37)|0});}
        const out=[0,0,0];
        function field(x,y,from=0){
            let v=0,gx=0,gy=0;
            for(let k=from;k<OCT;k++){
                const o=octaves[k],u=(o.c*x-o.n*y)/o.s+o.ox,w=(o.n*x+o.c*y)/o.s+o.oy,i=Math.floor(u),j=Math.floor(w),fu=u-i,fw=w-j;
                const a00=(16*hash2(i,j,o.seed))|0,a10=(16*hash2(i+1,j,o.seed))|0,a01=(16*hash2(i,j+1,o.seed))|0,a11=(16*hash2(i+1,j+1,o.seed))|0;
                const n00=GX[a00]*fu+GY[a00]*fw,n10=GX[a10]*(fu-1)+GY[a10]*fw,n01=GX[a01]*fu+GY[a01]*(fw-1),n11=GX[a11]*(fu-1)+GY[a11]*(fw-1);
                const su=fu*fu*fu*(fu*(fu*6-15)+10),sw=fw*fw*fw*(fw*(fw*6-15)+10),du=30*fu*fu*(fu-1)*(fu-1),dw=30*fw*fw*(fw-1)*(fw-1);
                const A=n00+(n10-n00)*su,B=n01+(n11-n01)*su;
                const Au=GX[a00]+(GX[a10]-GX[a00])*su+du*(n10-n00),Bu=GX[a01]+(GX[a11]-GX[a01])*su+du*(n11-n01);
                const Aw=GY[a00]+(GY[a10]-GY[a00])*su,Bw=GY[a01]+(GY[a11]-GY[a01])*su;
                const nu=Au+(Bu-Au)*sw,nw=Aw+(Bw-Aw)*sw+dw*(B-A);
                v+=A+(B-A)*sw;gx+=(nu*o.c+nw*o.n)/o.s;gy+=(nw*o.c-nu*o.n)/o.s;
            }
            out[0]=SIGMA*v;out[1]=SIGMA*gx;out[2]=SIGMA*gy;return out;
        }
        // Start near a maximum of the two coarsest fields.
        let x=0,y=0,best=-Infinity;
        for(let i=-30;i<=30;i++)for(let j=-30;j<=30;j++){const v=field(6*i,6*j,OCT-2)[0];if(v>best){best=v;x=6*i;y=6*j;}}
        const rand=randomFactory(PATHSEED),sq=Math.sqrt(2*DT),path=[[x,y]];
        let lo=[x,y],hi=[x,y];
        for(let s=1;s<=STEPS;s++){
            const f=field(x,y);x+=f[1]*DT+sq*gaussian(rand);y+=f[2]*DT+sq*gaussian(rand);
            if(s%KEEP===0){path.push([x,y]);lo=[Math.min(lo[0],x),Math.min(lo[1],y)];hi=[Math.max(hi[0],x),Math.max(hi[1],y)];}
        }
        /* Camera: follows the particle with a dead zone, as in the superdiffusion
           thumbnails; precomputed per path point so any frame is reproducible. */
        const cam=new Float32Array(2*path.length);let camX=path[0][0],camY=path[0][1];
        for(let i=0;i<path.length;i++){
            const p=path[i],dx=p[0]-camX,dy=p[1]-camY,dead=1.0,blend=.0009;
            if(Math.abs(dx)>dead)camX+=(dx-Math.sign(dx)*dead)*blend; if(Math.abs(dy)>dead)camY+=(dy-Math.sign(dy)*dead)*blend;
            camX=clamp(camX,p[0]-.6*HALF,p[0]+.6*HALF);camY=clamp(camY,p[1]-.6*HALF,p[1]+.6*HALF);
            cam[2*i]=camX;cam[2*i+1]=camY;
        }
        /* Potential on a grid over the region the camera can show; wash and level
           lines (marching squares) in chunks so a frame strokes only nearby ones. */
        const H=.3,M=HALF*1.5,X0=lo[0]-M,Y0=lo[1]-M,NX=Math.ceil((hi[0]-lo[0]+2*M)/H)+1,NY=Math.ceil((hi[1]-lo[1]+2*M)/H)+1;
        const values=new Float32Array(NX*NY);let mean=0,square=0;
        for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const v=field(X0+i*H,Y0+j*H)[0];values[j*NX+i]=v;mean+=v;}
        mean/=values.length;for(let p=0;p<values.length;p++){values[p]-=mean;square+=values[p]*values[p];}
        const rms=Math.sqrt(square/values.length),base=DARK?[18,21,29]:[250,249,245],paper=`rgb(${base})`;
        const wash=document.createElement('canvas');wash.width=NX;wash.height=NY;
        const wc=wash.getContext('2d'),wi=wc.createImageData(NX,NY);
        for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
            const v=values[j*NX+i]/Math.max(.001,rms),alpha=Math.min(.14,Math.abs(v)*.047),o=((NY-1-j)*NX+i)*4,tint=v<0?[161,107,137]:[76,141,165];
            for(let ch=0;ch<3;ch++)wi.data[o+ch]=Math.round(base[ch]*(1-alpha)+tint[ch]*alpha);wi.data[o+3]=255;
        }
        wc.putImageData(wi,0,0);
        const CH=24,chunks=new Map(),colors=DARK?['#655363','#476573']:['#c9b9bf','#b5c7ca'];
        const levels=[];for(let li=-5;li<=5;li++)levels.push([li*rms*.35,li<0?0:(li>0?1:2)]);
        const seg=(path2,ax,ay,bx,by)=>{path2.moveTo(X0+ax*H,Y0+ay*H);path2.lineTo(X0+bx*H,Y0+by*H);};
        for(let j=0;j<NY-1;j++)for(let i=0;i<NX-1;i++){
            const v0=values[j*NX+i],v1=values[j*NX+i+1],v2=values[(j+1)*NX+i+1],v3=values[(j+1)*NX+i];
            const vmin=Math.min(v0,v1,v2,v3),vmax=Math.max(v0,v1,v2,v3);let c=null;
            for(const [level,kind] of levels){
                if(level<vmin||level>=vmax)continue;
                const a=v0-level,b=v1-level,d=v2-level,e=v3-level,pts=[];
                if((a<=0)!==(b<=0))pts.push(i+a/(a-b),j);
                if((b<=0)!==(d<=0))pts.push(i+1,j+b/(b-d));
                if((d<=0)!==(e<=0))pts.push(i+1-d/(d-e),j+1);
                if((e<=0)!==(a<=0))pts.push(i,j+1-e/(e-a));
                if(pts.length<4)continue;
                if(!c){const key=Math.floor(i*H/CH)+','+Math.floor(j*H/CH);c=chunks.get(key);if(!c){c=[new Path2D(),new Path2D(),new Path2D()];chunks.set(key,c);}}
                seg(c[kind],pts[0],pts[1],pts[2],pts[3]);if(pts.length===8)seg(c[kind],pts[4],pts[5],pts[6],pts[7]);
            }
        }
        /* Played at 2.4 time units per second, the pace of the superdiffusion
           thumbnails: about 42 s for the whole path, then a hold and a fade. */
        const PLAY=STEPS*DT/2.4,CYCLE=PLAY+2.6;
        const gold=DARK?'#f2c67b':'#a46525',fresh=DARK?'#fff0cb':'#562c25';
        return function(t){
            const local=t%CYCLE,end=Math.max(1,Math.round(Math.min(1,local/PLAY)*(path.length-1)));
            const cx=cam[2*end],cy=cam[2*end+1],scale=W/(2*HALF),sx=p=>W/2+(p[0]-cx)*scale,sy=p=>W/2-(p[1]-cy)*scale;
            ground(ctx,W);ctx.save();ctx.fillStyle=paper;ctx.fillRect(0,0,W,W);ctx.imageSmoothingEnabled=true;
            const gx=(cx-HALF-X0)/H,gy=NY-1-(cy+HALF-Y0)/H;ctx.drawImage(wash,gx,gy,2*HALF/H,2*HALF/H,0,0,W,W);
            ctx.save();ctx.translate(W/2-cx*scale,W/2+cy*scale);ctx.scale(scale,-scale);ctx.lineWidth=1/scale;
            const i0=Math.floor((cx-HALF-X0)/CH),i1=Math.floor((cx+HALF-X0)/CH),j0=Math.floor((cy-HALF-Y0)/CH),j1=Math.floor((cy+HALF-Y0)/CH);
            for(let kind=0;kind<3;kind++){ctx.strokeStyle=kind===2?colors[1]:colors[kind];ctx.globalAlpha=kind===2?.9:.6;
                for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const c=chunks.get(i+','+j);if(c)ctx.stroke(c[kind]);}}
            ctx.restore();
            ctx.lineJoin='round';ctx.lineCap='round';
            const stroke=(first,last,color,width,alpha)=>{if(last<=first)return;ctx.beginPath();ctx.moveTo(sx(path[first]),sy(path[first]));
                for(let i=first+1;i<=last;i++)ctx.lineTo(sx(path[i]),sy(path[i]));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.stroke();};
            const pixel=W/Math.max(140,ctx.canvas.getBoundingClientRect().width||140),recent=Math.max(0,end-1800),freshFrom=Math.max(0,end-150),w=1.05*pixel;
            stroke(0,recent,gold,w*.8,DARK?.31:.36);
            stroke(recent,end,paper,w+2,.85);
            stroke(recent,end,gold,w,.88);
            stroke(freshFrom,end,fresh,w*1.08,1);
            ctx.globalAlpha=1;const p=path[end],r=3*pixel;
            dot(ctx,sx(p),sy(p),r*2.7,DARK?'rgba(242,198,123,.13)':'rgba(164,101,37,.10)');
            dot(ctx,sx(p),sy(p),r,fresh,paper,1.5);
            ctx.restore();
            if(local>CYCLE-.6)fadeOut(ctx,W,smooth((local-CYCLE+.6)/.6));
            return true;
        };
    }

    const FACTORIES = {
        'parking': makeParking,
        'divisible-percolation': makeDivisiblePercolation,
        'rotor-walk': makeRotor,
        'einstein-relation': makeEinstein,
        'long-range-walk': makeLongRange,
        'idla-cylinder': makeCylinderIDLA,
        'sandpile-rwrs': makeRWRS,
        'algebraic-superdiffusion': (ctx,W) => makeFlow(ctx,W,true),
        'sphere-packing': makeSpherePacking,
        'critical-superdiffusion': (ctx,W) => makeFlow(ctx,W,false),
        'unique-continuation': makeUniqueContinuation,
        'percolation-harmonic': makePercolationHarmonic,
        'mated-crt-idla': makeMatedCRTIDLA,
        'harmonic-ball': makeHarmonicBall,
        'f-lattice': makeFLattice,
        'pareto-peeling': makePareto,
        'exploding-sandpile': makeExploding,
        'dimensional-reduction': makeDimensionalReduction,
        'random-sandpile': makeRandomSandpile,
        'manhattan-lattice': makeManhattan,
        'orrw-range': makeORRW,
        'sandpile-avalanche': makeAvalanche,
        'centrally-excited-walk': makeCentrallyExcited,
        'log-correlated-potential': makeLogCorrelated
    };

    /* Thumbnails draw at most 30 times a second, and when several become
       visible together (opening a topic) their factories are built one per
       animation frame instead of all in one task. */
    const FRAME_MS=30, buildQueue=[];
    let pumping=false;
    function scheduleBuild(job){
        buildQueue.push(job); if(pumping) return; pumping=true;
        requestAnimationFrame(function pump(){const next=buildQueue.shift(); if(next) next(); if(buildQueue.length) requestAnimationFrame(pump); else pumping=false;});
    }

    function attach(canvas,kind,baseImage){
        const factory=FACTORIES[kind];if(!factory)return;
        const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        canvas.width=420;canvas.height=420;
        if(reduced){canvas.hidden=true;return;}
        canvas.hidden=false;canvas.style.opacity='0';
        const ctx=canvas.getContext('2d');
        let renderer=null,running=false,visible=false,queued=false,raf=0,elapsed=0,last=0,failed=false,revealed=false;
        function fail(err){failed=true;running=false;cancelAnimationFrame(raf);canvas.hidden=true;baseImage.style.opacity='1';if(err){canvas.__publicationThumbnailError=String(err&&err.stack||err);console.warn('publication thumbnail '+kind+':',err);}}
        function ensure(){if(renderer||failed)return;try{renderer=factory(ctx,canvas.width);}catch(err){fail(err);}}
        function draw(){ensure();if(!renderer||failed)return;try{const ok=renderer(elapsed/1000);if(renderer.failed){fail();return;}if(!revealed&&renderer.ready!==false&&ok!==false){revealed=true;baseImage.style.opacity='0';canvas.style.opacity='1';}}catch(err){fail(err);}}
        Object.defineProperty(canvas,'__publicationThumbnailRender',{value:function(seconds){elapsed=Math.max(0,seconds*1000);draw();},configurable:true});
        function frame(now){if(!running)return;if(!last||now-last>=FRAME_MS){if(last)elapsed+=Math.min(50,now-last);last=now;draw();}if(!failed)raf=requestAnimationFrame(frame);}
        function start(){if(running||failed)return;running=true;last=0;raf=requestAnimationFrame(frame);}
        function play(){if(running||queued||!visible||document.hidden||failed)return;if(renderer){start();return;}queued=true;scheduleBuild(()=>{queued=false;if(!visible||document.hidden||failed)return;ensure();start();});}
        function pause(){if(!running)return;running=false;cancelAnimationFrame(raf);raf=0;last=0;}
        if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)play();else pause();},{threshold:.01,rootMargin:'240px 0px'});observer.observe(canvas.parentElement||canvas);}else{visible=true;play();}
        document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
    }

    window.PublicationThumbnailAnimations={attach,kinds:Object.keys(FACTORIES)};
}());
