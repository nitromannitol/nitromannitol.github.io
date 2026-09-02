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

    function halo() {}

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
            ctx.strokeStyle='rgba(201,191,168,.12)';ctx.lineWidth=1;ctx.beginPath();
            for(let j=-half-1;j<=half+1;j++){const px=toScreen(Math.floor(cx)+j,cy)[0],py=toScreen(cx,Math.floor(cy)+j)[1];ctx.moveTo(px,0);ctx.lineTo(px,W);ctx.moveTo(0,py);ctx.lineTo(W,py);}ctx.stroke();
            for(let yy=Math.floor(cy)-half;yy<=Math.floor(cy)+half;yy++)for(let xx=Math.floor(cx)-half;xx<=Math.floor(cx)+half;xx++){
                const kk=key(xx,yy),when=first.get(kk);if(when===undefined||when>k)continue;const p=toScreen(xx,yy),exc=firstCircuit.get(kk)||0;
                ctx.fillStyle=['#294f72','#356f91','#568da5','#806a91','#a05270'][exc%5];ctx.globalAlpha=.76;ctx.fillRect(p[0]-cell*.45,p[1]-cell*.45,cell*.9,cell*.9);
            }
            ctx.globalAlpha=1;
            for(let yy=Math.floor(cy)-half;yy<=Math.floor(cy)+half;yy++)for(let xx=Math.floor(cx)-half;xx<=Math.floor(cx)+half;xx++){
                const kk=key(xx,yy),p=toScreen(xx,yy),active=xx===st.x&&yy===st.y;let ang=rotorBefore(kk,k)*Math.PI/2;
                if(active)ang=st.old*Math.PI/2+(Math.PI/2)*smooth(phase/turnEnd);
                arrow(ctx,p[0],p[1],ang,active?12.5:10.5,active?C.yellow:'rgba(246,241,230,.92)',active?3.2:2.35);
            }
            const cp=toScreen(mix(st.x,st.nx,move),mix(st.y,st.ny,move));dot(ctx,cp[0],cp[1],7,C.yellow,C.bg,2.4);
            if(q>.93)fadeOut(ctx,W,smooth((q-.93)/.07));
        };
    }

    function makeEinstein(ctx,W){
        const rand=randomFactory(0xe1757e1),p0=[[0,0]],p1=[[0,0]];let a=[0,0],b=[0,0];
        function drift(x,y){return[-.22*Math.cos(x*.55)-.14*Math.cos((x+y)*.31),-.18*Math.sin(y*.48)-.13*Math.sin((x-y)*.28)];}
        for(let i=0;i<520;i++){const zx=gaussian(rand),zy=gaussian(rand),dt=.035,da=drift(a[0],a[1]),db=drift(b[0],b[1]);a=[a[0]+da[0]*dt+.19*zx,a[1]+da[1]*dt+.19*zy];b=[b[0]+(db[0]+.12)*dt+.19*zx,b[1]+db[1]*dt+.19*zy];p0.push(a);p1.push(b);}
        const tf=fitTransform(p0.concat(p1),W,38);
        return function(t){ground(ctx,W);
            const cell=28;for(let y=0;y<W;y+=cell)for(let x=0;x<W;x+=cell){const v=Math.sin(x*.022)+Math.cos(y*.026)+.7*Math.sin((x+y)*.015);ctx.fillStyle=v>0?`rgba(204,121,167,${.025+.035*v})`:`rgba(86,180,233,${.025-.035*v})`;ctx.fillRect(x,y,cell-1,cell-1);}
            const q=(t%12)/12,amount=q<.9?smooth(q/.9):1;trace(ctx,p0,amount,C.cyan,1.45,tf);trace(ctx,p1,amount,C.rose,1.45,tf);const u=tf(currentPoint(p0,amount)),v=tf(currentPoint(p1,amount));dot(ctx,u[0],u[1],3.4,C.cyan,C.bg,1.3);dot(ctx,v[0],v[1],3.4,C.rose,C.bg,1.3);if(q>.9)fadeOut(ctx,W,smooth((q-.9)/.1));
        };
    }

    function makeLongRange(ctx,W){
        const rand=randomFactory(0x10a6e),pts=[[0,0]];let x=0,y=0;
        for(let i=0;i<360;i++){const angle=TAU*rand(),u=Math.max(.008,rand()),r=Math.min(22,.62/Math.sqrt(u));x+=r*Math.cos(angle);y+=r*Math.sin(angle);pts.push([x,y]);}
        const tf=fitTransform(pts,W,30);
        return function(t){ground(ctx,W,'rgba(212,93,125,.55)');const q=(t%13)/13,amount=q<.91?q/.91:1,z=amount*(pts.length-1),end=Math.floor(z);
            ctx.strokeStyle='rgba(216,207,190,.09)';ctx.lineWidth=1;ctx.beginPath();for(let i=24;i<W;i+=24){ctx.moveTo(i,18);ctx.lineTo(i,W-18);ctx.moveTo(18,i);ctx.lineTo(W-18,i);}ctx.stroke();
            for(let i=1;i<=end;i++){const a=tf(pts[i-1]),b=tf(pts[i]),len=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=len>5?'rgba(240,217,107,.78)':'rgba(101,196,231,.42)';ctx.lineWidth=len>5?2.1:1.2;ctx.stroke();}
            const p=tf(currentPoint(pts,amount));halo(ctx,p[0],p[1],13,C.yellow);dot(ctx,p[0],p[1],5.8,C.yellow,C.bg,2);if(q>.91)fadeOut(ctx,W,smooth((q-.91)/.09));
        };
    }

    function makeCylinderIDLA(ctx,W){
        const rand=randomFactory(0xc711da),N=22,occ=new Set(),settled=[],walks=[];for(let x=0;x<N;x++)occ.add(x+',0');
        for(let n=0;n<330;n++){let x=(rand()*N)|0,y=0,path=[[x,y]],guard=0;while(occ.has(x+','+y)&&guard++<12000){const r=(rand()*5)|0;if(r===0)x=(x+1)%N;if(r===1)x=(x+N-1)%N;if(r===2)y++;if(r===3)y=Math.max(0,y-1);path.push([x,y]);}occ.add(x+','+y);settled.push([x,y]);walks.push(path.filter((_,i)=>i%Math.max(1,Math.floor(path.length/55))===0).slice(-56));}
        function project(p){const th=TAU*p[0]/N-Math.PI/2,rad=142;return[W/2+rad*Math.cos(th),W-54-p[1]*8.6+26*Math.sin(th)];}
        return function(t){ground(ctx,W,'rgba(86,180,233,.5)');ctx.beginPath();ctx.ellipse(W/2,W-52,143,29,0,0,TAU);ctx.strokeStyle='rgba(236,228,213,.24)';ctx.lineWidth=2;ctx.stroke();const q=(t%14)/14,amount=q<.92?q/.92:1,k=Math.min(settled.length-1,Math.floor(amount*settled.length));
            const order=[];for(let i=0;i<=k;i++)order.push(i);order.sort((i,j)=>settled[i][1]-settled[j][1]||Math.sin(TAU*settled[i][0]/N)-Math.sin(TAU*settled[j][0]/N));order.forEach(i=>{const p=project(settled[i]),front=Math.sin(TAU*settled[i][0]/N-Math.PI/2);ctx.globalAlpha=.38+.5*(front+1)/2;dot(ctx,p[0],p[1],5.2,i===k?C.yellow:['#4d78a1','#5a8fb0','#70b1ca'][Math.floor(i/55)%3],C.bg,1);});ctx.globalAlpha=1;
            const path=walks[k]||[],partial=amount*settled.length-k;if(path.length>1){trace(ctx,path,partial,C.ink,1.5,project);const p=project(currentPoint(path,partial));dot(ctx,p[0],p[1],4,C.yellow,C.bg,1.5);}if(q>.92)fadeOut(ctx,W,smooth((q-.92)/.08));
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
        return function(t){ground(ctx,W);
            contours.forEach((c,i)=>{ctx.beginPath();c.segments.forEach(s=>{ctx.moveTo(s[0][0],s[0][1]);ctx.lineTo(s[1][0],s[1][1]);});ctx.strokeStyle=i%3===0?'rgba(246,241,230,.46)':(i%2?'rgba(168,216,232,.34)':'rgba(204,121,167,.32)');ctx.lineWidth=i%3===0?1.65:1.2;ctx.stroke();});
            const period=algebraic?15:13,q=(t%period)/period,amount=q<.93?smooth(q/.93):1,z=amount*(path.length-1),end=Math.floor(z),start=Math.max(0,end-560),shown=path.slice(start,end+1);if(end<path.length-1)shown.push([mix(path[end][0],path[end+1][0],z-end),mix(path[end][1],path[end+1][1],z-end)]);
            trace(ctx,shown,1,algebraic?C.yellow:C.ink,1.55,tf);const p=tf(shown[shown.length-1]),col=algebraic?C.yellow:C.cyan;dot(ctx,p[0],p[1],5.3,col,C.bg,1.8);if(q>.93)fadeOut(ctx,W,smooth((q-.93)/.07));
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
            ring(R);ctx.strokeStyle='rgba(246,241,230,.86)';ctx.lineWidth=2.6;ctx.stroke();
            ring(MIDDLE);ctx.strokeStyle='rgba(201,191,168,.54)';ctx.lineWidth=1.7;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);
            ring(INNER);ctx.strokeStyle='rgba(168,216,232,.78)';ctx.lineWidth=2.15;ctx.stroke();

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
            ctx.globalAlpha=fade;ring(INNER);ctx.strokeStyle=collapse>.5?C.ink:'rgba(168,216,232,.78)';ctx.lineWidth=2.15;ctx.stroke();
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
            next.edges.forEach(e=>{const a=next.nodes[e[0]],b=next.nodes[e[1]],fresh=a.y>n||b.y>n,p=pos(a),q=pos(b);ctx.globalAlpha=fresh?fade:1;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.strokeStyle=fresh?C.ink:'rgba(201,191,168,.56)';ctx.lineWidth=fresh?3.2:2.4;ctx.stroke();});
            next.nodes.forEach((v,i)=>{const fresh=v.y>n,p=pos(v);ctx.globalAlpha=fresh?fade:1;dot(ctx,p[0],p[1],i===next.s||i===next.terminal?13:10.5,colour(next.values[i]),fresh?C.yellow:(i===next.s||i===next.terminal?C.ink:C.bg),fresh?2.8:2);});ctx.globalAlpha=1;
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
        'random-sandpile': makeRandomSandpile
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
