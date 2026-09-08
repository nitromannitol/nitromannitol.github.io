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

    function makeEinstein(ctx,W){
        // Coupled Euler–Maruyama paths in the same scalar potential as the
        // gallery. Both particles receive the same Brownian increments.
        const rand=randomFactory(0xe1757e1),count=48,steps=640,dt=.018,force=.24;
        const paths=[],means=[[],[]],spread=[[],[]],world=16,ox=W*.42,oy=W*.49,scale=(W-32)/world;
        const tf=p=>[ox+p[0]*scale,oy-p[1]*scale];
        function potential(x,y){return .46*Math.sin(x+.23)+.31*Math.cos(y-.41)+.22*Math.sin(x+.73*y)+.15*Math.cos(1.7*x-.8*y);}
        function drift(x,y){return [-.46*Math.cos(x+.23)-.22*Math.cos(x+.73*y)+.255*Math.sin(1.7*x-.8*y),.31*Math.sin(y-.41)-.1606*Math.cos(x+.73*y)-.12*Math.sin(1.7*x-.8*y)];}
        for(let j=0;j<count;j++){
            const pair=[[[0,0]],[[0,0]]];
            for(let k=1;k<=steps;k++){
                const dx=Math.sqrt(dt)*gaussian(rand),dy=Math.sqrt(dt)*gaussian(rand);
                for(let group=0;group<2;group++){
                    const p=pair[group][k-1],d=drift(p[0],p[1]);
                    pair[group].push([p[0]+(d[0]+group*force)*dt+dx,p[1]+d[1]*dt+dy]);
                }
            }
            paths.push(pair);
        }
        for(let group=0;group<2;group++)for(let k=0;k<=steps;k++){
            let x=0,y=0;for(const pair of paths){x+=pair[group][k][0];y+=pair[group][k][1];}x/=count;y/=count;
            let xx=0,xy=0,yy=0;for(const pair of paths){const p=pair[group][k],dx=p[0]-x,dy=p[1]-y;xx+=dx*dx;xy+=dx*dy;yy+=dy*dy;}
            means[group].push([x,y]);spread[group].push([xx/count,xy/count,yy/count]);
        }
        const terrain=document.createElement('canvas');terrain.width=terrain.height=W;const tc=terrain.getContext('2d'),N=52,values=[];
        for(let y=0;y<N;y++)for(let x=0;x<N;x++)values.push(potential((x*W/(N-1)-ox)/scale,(oy-y*W/(N-1))/scale));
        const edges=[[0,1],[1,2],[2,3],[3,0]];
        tc.lineWidth=1.15;tc.strokeStyle=C.slate;tc.globalAlpha=DARK?.20:.16;
        for(let level=-.8;level<=.8;level+=.2){tc.beginPath();
            for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){
                const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],v=corners.map(p=>values[p[1]*N+p[0]]),cross=[];
                for(const [a,b] of edges)if((v[a]>level)!==(v[b]>level)){
                    const f=(level-v[a])/(v[b]-v[a]);cross.push([mix(corners[a][0],corners[b][0],f)*W/(N-1),mix(corners[a][1],corners[b][1],f)*W/(N-1)]);
                }
                for(let j=0;j+1<cross.length;j+=2){tc.moveTo(...cross[j]);tc.lineTo(...cross[j+1]);}
            }tc.stroke();
        }
        function ellipse(group,k,color){
            const [xx,xy,yy]=spread[group][k],delta=Math.hypot(xx-yy,2*xy),angle=-.5*Math.atan2(2*xy,xx-yy),p=tf(means[group][k]);
            ctx.beginPath();ctx.ellipse(p[0],p[1],Math.sqrt(Math.max(.002,(xx+yy+delta)/2))*scale,Math.sqrt(Math.max(.002,(xx+yy-delta)/2))*scale,angle,0,TAU);
            ctx.fillStyle=color;ctx.globalAlpha=.07;ctx.fill();ctx.globalAlpha=.68;ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.stroke();ctx.globalAlpha=1;
        }
        return function(t){
            ground(ctx,W);ctx.drawImage(terrain,0,0);
            const local=t%14,amount=.025+.975*Math.min(1,local/11.8),k=Math.min(steps,Math.floor(amount*steps)),colors=[C.cyan,DARK?'#F2BF62':'#AD6B0A'];
            ctx.save();ctx.beginPath();ctx.rect(12,42,W-24,W-86);ctx.clip();
            for(let group=0;group<2;group++)ellipse(group,k,colors[group]);
            for(let group=0;group<2;group++){
                ctx.globalAlpha=.64;
                for(const pair of paths){const p=tf(pair[group][k]);dot(ctx,p[0],p[1],3.5,colors[group]);}
                ctx.globalAlpha=1;
                const shown=paths[7][group].slice(Math.max(0,k-100),k+1);
                trace(ctx,shown,1,C.bg,6.2,tf);trace(ctx,shown,1,colors[group],3.3,tf);
                const p=tf(shown[shown.length-1]);dot(ctx,p[0],p[1],6.4,colors[group],C.bg,2.4);
            }
            const a=tf(means[0][k]),b=tf(means[1][k]);
            ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.setLineDash([5,4]);ctx.strokeStyle=C.ink;ctx.lineWidth=1.7;ctx.stroke();ctx.setLineDash([]);
            for(let group=0;group<2;group++){const p=tf(means[group][k]);dot(ctx,p[0],p[1],7.5,C.bg,colors[group],3);dot(ctx,p[0],p[1],2.8,colors[group]);}
            dot(ctx,ox,oy,2.8,C.ink);ctx.restore();
            ctx.font='500 24px system-ui, sans-serif';ctx.textBaseline='middle';
            ctx.fillStyle=colors[1];ctx.fillText('small force',W-180,23);arrow(ctx,W-51,23,0,25,colors[1],2.6);
            dot(ctx,30,W-22,5,C.cyan);ctx.fillStyle=C.ink;ctx.fillText('unforced',44,W-22);
            dot(ctx,W*.55,W-22,5,colors[1]);ctx.fillText('forced',W*.55+14,W-22);
            if(local>13.4)fadeOut(ctx,W,smooth((local-13.4)/.6));
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
        const rand=randomFactory(algebraic?0xa16eb2:0xc8171c),modes=[];
        const modeList=algebraic?[[1,0],[0,1],[1,1],[2,1],[1,2],[2,-1],[3,1],[1,-3],[4,1],[2,3]]:[[1,0],[0,1],[1,1],[1,-1],[2,1],[1,2],[2,-1],[3,1]];
        modeList.forEach(k=>{const r=Math.hypot(k[0],k[1]),amp=(algebraic?Math.pow(r,-1.68):Math.pow(r,-2.05))*(.72+.56*rand());modes.push({kx:k[0]*.72,ky:k[1]*.72,amp,phase:TAU*rand()});});
        function field(x,y){let psi=0,gx=0,gy=0;modes.forEach(m=>{const a=m.kx*x+m.ky*y+m.phase,s=Math.sin(a),c=Math.cos(a);psi+=m.amp*c;gx-=m.amp*m.kx*s;gy-=m.amp*m.ky*s;});return[psi,gy,-gx];}
        const path=[[0,0]];let x=0,y=0;
        for(let i=0;i<2600;i++){const f=field(x,y),dt=.026,diff=algebraic?.024:.030;x+=f[1]*dt*(algebraic?.78:.68)+diff*gaussian(rand);y+=f[2]*dt*(algebraic?.78:.68)+diff*gaussian(rand);path.push([x,y]);}
        let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;path.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
        const span=Math.max(5.8,maxX-minX,maxY-minY),wx=(minX+maxX)/2,wy=(minY+maxY)/2,loX=wx-span*.58,loY=wy-span*.58,world=span*1.16,pad=18,tf=p=>[pad+(p[0]-loX)*(W-2*pad)/world,pad+(p[1]-loY)*(W-2*pad)/world];
        const N=76,values=new Float32Array(N*N);let fmin=Infinity,fmax=-Infinity;
        for(let j=0;j<N;j++)for(let i=0;i<N;i++){const v=field(loX+world*i/(N-1),loY+world*j/(N-1))[0];values[j*N+i]=v;fmin=Math.min(fmin,v);fmax=Math.max(fmax,v);}
        const contours=[];
        function edgePoint(i,j,e,level){let a,b;if(e===0){a=[i,j];b=[i+1,j];}else if(e===1){a=[i+1,j];b=[i+1,j+1];}else if(e===2){a=[i+1,j+1];b=[i,j+1];}else{a=[i,j+1];b=[i,j];}const va=values[a[1]*N+a[0]],vb=values[b[1]*N+b[0]],q=Math.abs(vb-va)<1e-9?.5:(level-va)/(vb-va);return[pad+(a[0]+q*(b[0]-a[0]))*(W-2*pad)/(N-1),pad+(a[1]+q*(b[1]-a[1]))*(W-2*pad)/(N-1)];}
        for(let li=1;li<=15;li++){const level=mix(fmin,fmax,li/16),segments=[];for(let j=0;j<N-1;j++)for(let i=0;i<N-1;i++){const bits=(values[j*N+i]>level?1:0)|(values[j*N+i+1]>level?2:0)|(values[(j+1)*N+i+1]>level?4:0)|(values[(j+1)*N+i]>level?8:0),table=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,2],[0,1]],[[0,2]],[[3,2]],[[2,3]],[[0,2]],[[0,3],[1,2]],[[1,2]],[[1,3]],[[0,1]],[[3,0]],[]];for(const pair of table[bits])segments.push([edgePoint(i,j,pair[0],level),edgePoint(i,j,pair[1],level)]);}contours.push({level,segments});}
        // Cache the stream function contours. Short moving streamlines show
        // the velocity field independently of the noisy tagged particle.
        const backdrop=document.createElement('canvas');backdrop.width=backdrop.height=W;const bc=backdrop.getContext('2d');
        contours.forEach((c,i)=>{bc.beginPath();c.segments.forEach(s=>{bc.moveTo(...s[0]);bc.lineTo(...s[1]);});bc.strokeStyle=i%3===0?C.slate:(i%2?C.cyan:C.rose);bc.globalAlpha=i%3===0?.48:.26;bc.lineWidth=i%3===0?1.85:1.35;bc.stroke();});
        const tracers=[];
        for(let j=0;j<5;j++)for(let i=0;i<5;i++){
            const points=[],seedX=loX+world*(i+.25+.45*rand())/5,seedY=loY+world*(j+.25+.45*rand())/5;let x=seedX,y=seedY;
            for(let k=0;k<430;k++){points.push([x,y]);const f=field(x,y);x+=f[1]*.02;y+=f[2]*.02;}
            tracers.push(points);
        }
        return function(t){
            ground(ctx,W);ctx.drawImage(backdrop,0,0);
            ctx.save();ctx.beginPath();ctx.rect(pad,pad,W-2*pad,W-2*pad);ctx.clip();
            const period=algebraic?15:13,q=(t%period)/period,amount=q<.93?q/.93:1;
            ctx.globalAlpha=.44;
            tracers.forEach((points,j)=>{
                const phase=((t*.055+j*.173)%1),k=12+Math.floor(phase*(points.length-14)),part=points.slice(k-12,k+1);
                ctx.globalAlpha=.44*smooth(phase/.08)*smooth((1-phase)/.08);
                trace(ctx,part,1,C.cyan,1.9,tf);const a=tf(part[part.length-2]),b=tf(part[part.length-1]);
                arrow(ctx,b[0],b[1],Math.atan2(b[1]-a[1],b[0]-a[0]),5.2,C.cyan,1.5);
            });
            ctx.globalAlpha=1;
            const z=amount*(path.length-1),end=Math.floor(z),start=Math.max(0,end-650),shown=path.slice(start,end+1);
            if(end<path.length-1)shown.push([mix(path[end][0],path[end+1][0],z-end),mix(path[end][1],path[end+1][1],z-end)]);
            const col=algebraic?C.yellow:C.ink;
            trace(ctx,shown,1,C.bg,6.5,tf);trace(ctx,shown,1,col,3.1,tf);
            const p=tf(shown[shown.length-1]);dot(ctx,p[0],p[1],6.5,col,C.bg,2.5);ctx.restore();
            if(q>.93)fadeOut(ctx,W,smooth((q-.93)/.07));
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
        const N=61,count=N*N,c=N>>1,pad=8,cell=(W-2*pad)/N,rand=randomFactory(0x4c514742),modes=[];
        for(let ky=-8;ky<=8;ky++)for(let kx=-8;kx<=8;kx++)if(kx||ky){const r=Math.hypot(kx,ky);modes.push([kx,ky,gaussian(rand)/r,gaussian(rand)/r]);}
        const field=new Float64Array(count);let mean=0,variance=0;
        for(let y=0;y<N;y++)for(let x=0;x<N;x++){let h=0;for(const m of modes){const a=TAU*(m[0]*x+m[1]*y)/N;h+=m[2]*Math.cos(a)+m[3]*Math.sin(a);}field[y*N+x]=h;mean+=h;}
        mean/=count;for(let i=0;i<count;i++){field[i]-=mean;variance+=field[i]*field[i];}variance/=count;
        const capacity=new Float64Array(count),gamma=Math.SQRT2,scale=.78/Math.sqrt(variance);let capMean=0;
        for(let i=0;i<count;i++){field[i]*=scale;capacity[i]=Math.exp(gamma*field[i]-.5*gamma*gamma*scale*scale*variance);capMean+=capacity[i];}
        capMean/=count;for(let i=0;i<count;i++)capacity[i]/=capMean;
        const mass=new Float64Array(count),odo=new Float64Array(count),arrival=new Int16Array(count);arrival.fill(-1);const fronts=[];
        const levels=100,totalMass=1250,src=c*N+c;
        for(let level=0;level<levels;level++){
            mass[src]+=totalMass/levels;const q=[src],inQ=new Uint8Array(count),front=[];inQ[src]=1;
            for(let head=0;head<q.length;head++){
                const i=q[head];inQ[i]=0;const excess=mass[i]-capacity[i];if(excess<=1e-8)continue;mass[i]=capacity[i];odo[i]+=excess*.25;if(arrival[i]<0){arrival[i]=level;front.push(i);}
                const x=i%N,y=(i/N)|0,share=excess*.25,ns=[x?i-1:-1,x<N-1?i+1:-1,y?i-N:-1,y<N-1?i+N:-1];
                for(const j of ns)if(j>=0){mass[j]+=share;if(mass[j]>capacity[j]+1e-8&&!inQ[j]){inQ[j]=1;q.push(j);}}
            }
            fronts.push(front);
        }
        return function(t){
            ground(ctx,W);const local=t%12.5,level=Math.min(levels-1,Math.floor(Math.min(1,local/10)*(levels-1)));
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,a=arrival[i];if(a>=0&&a<=level)ctx.fillStyle=(a===level?C.ink:rampColour(ORDER,a/(levels-1)));else ctx.fillStyle=field[i]>0?C.deep:C.bg;ctx.fillRect(pad+x*cell,pad+y*cell,cell+.25,cell+.25);}
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
        const image=new Image();
        function draw(t){ground(ctx,W);if(!draw.ready)return false;const q=(t%13)/13;let zoom;if(q<.12)zoom=0;else if(q<.58)zoom=smooth((q-.12)/.46);else if(q<.82)zoom=1;else if(q<.95)zoom=1-smooth((q-.82)/.13);else zoom=0;const full=image.width,crop=Math.exp(mix(Math.log(185),Math.log(full),zoom)),cx=full*.50,cy=full*.50,sx=clamp(cx-crop/2,0,full-crop),sy=clamp(cy-crop/2,0,full-crop),inset=8,dest=W-16;ctx.imageSmoothingEnabled=crop>dest;ctx.imageSmoothingQuality='high';ctx.drawImage(image,sx,sy,crop,crop,inset,inset,dest,dest);return true;}
        draw.ready=false;draw.failed=false;image.onload=()=>{draw.ready=true;};image.onerror=()=>{draw.failed=true;};image.src='gallery/plates/p6-random-hero-void.png';return draw;
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
        'orrw-range': makeORRW
    };

    function attach(canvas,kind,baseImage){
        const factory=FACTORIES[kind];if(!factory)return;
        const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        canvas.width=420;canvas.height=420;
        if(reduced){canvas.hidden=true;return;}
        canvas.hidden=false;canvas.style.opacity='0';
        const ctx=canvas.getContext('2d');
        let renderer=null,running=false,visible=false,raf=0,elapsed=0,last=0,failed=false,revealed=false;
        function fail(err){failed=true;running=false;cancelAnimationFrame(raf);canvas.hidden=true;baseImage.style.opacity='1';if(err){canvas.__publicationThumbnailError=String(err&&err.stack||err);console.warn('publication thumbnail '+kind+':',err);}}
        function ensure(){if(renderer||failed)return;try{renderer=factory(ctx,canvas.width);}catch(err){fail(err);}}
        function draw(){ensure();if(!renderer||failed)return;try{const ok=renderer(elapsed/1000);if(renderer.failed){fail();return;}if(!revealed&&renderer.ready!==false&&ok!==false){revealed=true;baseImage.style.opacity='0';canvas.style.opacity='1';}}catch(err){fail(err);}}
        Object.defineProperty(canvas,'__publicationThumbnailRender',{value:function(seconds){elapsed=Math.max(0,seconds*1000);draw();},configurable:true});
        function frame(now){if(!running)return;if(!last)last=now;elapsed+=Math.min(50,now-last);last=now;draw();if(!failed)raf=requestAnimationFrame(frame);}
        function play(){if(running||!visible||document.hidden||failed)return;ensure();running=true;last=0;raf=requestAnimationFrame(frame);}
        function pause(){if(!running)return;running=false;cancelAnimationFrame(raf);raf=0;last=0;}
        if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)play();else pause();},{threshold:.01,rootMargin:'240px 0px'});observer.observe(canvas.parentElement||canvas);}else{visible=true;play();}
        document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
    }

    window.PublicationThumbnailAnimations={attach,kinds:Object.keys(FACTORIES)};
}());
