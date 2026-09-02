/* High-resolution publication thumbnails. Each renderer depicts the model
   named by publications.js; the existing image remains the no-JS and
   reduced-motion fallback. */
(function () {
    'use strict';

    const C = {
        bg: '#15131A', deep: '#1D1A24', slate: '#4A4A5E', bone: '#C9BFA8',
        ink: '#F6F1E6', grid: '#4A4A5E', cyan: '#A8D8E8', blue: '#3D7A9E',
        rose: '#8E4257', pink: '#9A4659', yellow: '#E2C25A', violet: '#6F5EE0',
        green: '#58B899'
    };
    const ORDER = [[111,94,224],[204,121,167],[150,205,240],[255,248,232]];
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
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, W);
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
            if (local > 11.5) { ctx.globalAlpha = (local - 11.5) / .5; ctx.fillStyle = C.bg; ctx.fillRect(0,0,W,W); ctx.globalAlpha = 1; }
        };
    }

    function makeDivisiblePercolation(ctx, W) {
        const N = 48, count = N*N, pad = 7, cell = (W-2*pad)/N, rho = .78;
        const zeta = new Float64Array(count), initial = new Uint8Array(count), frames = [];
        function h(i) {
            let z=(0x53414e44 ^ Math.imul(i+0x9e37,0x45d9f3b))>>>0;
            z=Math.imul(z^(z>>>16),0x45d9f3b)>>>0;
            return ((z^(z>>>16))>>>0)/4294967296;
        }
        for (let i=0;i<count;i++) { initial[i]=poissonQuantile(h(i),rho); zeta[i]=(initial[i]-1)/4; }
        let u = new Float64Array(count), next = new Float64Array(count);
        frames.push(new Float32Array(u));
        for (let step=1;step<=480;step++) {
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){
                const i=y*N+x,l=y*N+(x+N-1)%N,r=y*N+(x+1)%N,
                    a=((y+N-1)%N)*N+x,b=((y+1)%N)*N+x;
                next[i]=Math.max(0,zeta[i]+.25*(u[l]+u[r]+u[a]+u[b]));
            }
            const q=u;u=next;next=q;
            if(step%4===0)frames.push(new Float32Array(u));
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
            const prev=new Int32Array(count);prev.fill(-1);const queue=[];
            for(let y=0;y<N;y++){const i=y*N;if(mask[i]){prev[i]=-2;queue.push(i);}}
            let end=-1;
            for(let head=0;head<queue.length&&end<0;head++){
                const i=queue[head],x=i%N,y=(i/N)|0;if(x===N-1){end=i;break;}
                const ns=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
                for(let k=0;k<4;k++){const xx=ns[k][0],yy=ns[k][1];if(xx<0||xx>=N||yy<0||yy>=N)continue;const j=yy*N+xx;if(mask[j]&&prev[j]===-1){prev[j]=i;queue.push(j);}}
            }
            const path=[];while(end>=0){path.push(end);end=prev[end];}
            return {mask,largest,path:path.reverse()};
        }
        return function(t) {
            ground(ctx,W);const local=t%12,amount=Math.min(1,local/9.7),fi=Math.min(frames.length-1,Math.floor(amount*(frames.length-1))),v=frames[fi],state=classify(v);
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){
                const i=y*N+x,q=Math.min(1,v[i]/2.4);
                if(state.largest[i])ctx.fillStyle=rampColour([[29,26,36],[58,110,134],[168,216,232],[246,241,230]],.22+.78*q);
                else if(state.mask[i])ctx.fillStyle=rampColour([[29,26,36],[90,47,63],[142,66,87],[201,191,168]],.20+.72*q);
                else ctx.fillStyle=initial[i]?C.deep:C.bg;
                ctx.fillRect(pad+x*cell,pad+y*cell,cell+.18,cell+.18);
            }
            if(state.path.length){ctx.beginPath();state.path.forEach((i,j)=>{const x=pad+((i%N)+.5)*cell,y=pad+(((i/N)|0)+.5)*cell;j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=C.yellow;ctx.lineWidth=5.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
            if(local>11.5){ctx.globalAlpha=(local-11.5)/.5;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;}
        };
    }

    function makeRotor(ctx, W) {
        const steps=[], first=new Map(), histories=new Map(), rotors=new Map();
        let x=0,y=0,returns=0;
        const key=(a,b)=>a+','+b, initial=(a,b)=>(hash2(a,b,0x524f)*4)|0;
        first.set(key(0,0),0);
        for(let s=0;s<1800;s++){
            const k=key(x,y),old=rotors.has(k)?rotors.get(k):initial(x,y),next=(old+1)&3;
            rotors.set(k,next);if(!histories.has(k))histories.set(k,[]);histories.get(k).push([s,next]);
            const dirs=[[1,0],[0,1],[-1,0],[0,-1]],d=dirs[next],nx=x+d[0],ny=y+d[1];
            steps.push({x,y,nx,ny,old,next,circuit:Math.floor(returns/4)});x=nx;y=ny;
            const nk=key(x,y);if(!first.has(nk))first.set(nk,s+1);if(x===0&&y===0)returns++;
        }
        const all=Array.from(first.keys()).map(k=>k.split(',').map(Number)),tf=fitTransform(all,W,28),scale=Math.hypot(tf([1,0])[0]-tf([0,0])[0],tf([1,0])[1]-tf([0,0])[1]);
        function rotorAt(k,s){const h=histories.get(k);if(!h)return initial(...k.split(',').map(Number));let lo=0,hi=h.length-1,ans=-1;while(lo<=hi){const m=(lo+hi)>>1;if(h[m][0]<=s){ans=m;lo=m+1;}else hi=m-1;}return ans<0?initial(...k.split(',').map(Number)):h[ans][1];}
        return function(t){
            ground(ctx,W,'rgba(204,121,167,.7)');const q=(t%15)/15,amount=q<.9?q/.9:1,k=Math.min(steps.length-1,Math.floor(amount*(steps.length-1))),a=amount*(steps.length-1)-k;
            first.forEach((when,k0)=>{if(when>k)return;const p=tf(k0.split(',').map(Number)),c=Math.floor((histories.get(k0)?.[0]?.[0]||0)/80)%5;ctx.fillStyle=['#315f87','#3f7fa1','#669cad','#98729a','#c46787'][c];ctx.globalAlpha=.72;ctx.fillRect(p[0]-scale*.46,p[1]-scale*.46,scale*.92,scale*.92);});ctx.globalAlpha=1;
            const st=steps[k],cx=mix(st.x,st.nx,a),cy=mix(st.y,st.ny,a);
            first.forEach((when,k0)=>{if(when>k)return;const z=k0.split(',').map(Number);if(Math.abs(z[0]-cx)+Math.abs(z[1]-cy)>4.2)return;const p=tf(z),dir=rotorAt(k0,k),ang=dir*Math.PI/2;arrow(ctx,p[0],p[1],ang,Math.max(3,scale*.3),'rgba(239,232,216,.82)',Math.max(1,scale*.07));});
            const cp=tf([cx,cy]);dot(ctx,cp[0],cp[1],Math.max(4,scale*.28),C.yellow,C.bg,2.5);
            if(q>.9){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.9)/.1)})`;ctx.fillRect(0,0,W,W);}
        };
    }

    function makeEinstein(ctx,W){
        const rand=randomFactory(0xe1757e1),p0=[[0,0]],p1=[[0,0]];let a=[0,0],b=[0,0];
        function drift(x,y){return[-.22*Math.cos(x*.55)-.14*Math.cos((x+y)*.31),-.18*Math.sin(y*.48)-.13*Math.sin((x-y)*.28)];}
        for(let i=0;i<520;i++){const zx=gaussian(rand),zy=gaussian(rand),dt=.035,da=drift(a[0],a[1]),db=drift(b[0],b[1]);a=[a[0]+da[0]*dt+.19*zx,a[1]+da[1]*dt+.19*zy];b=[b[0]+(db[0]+.12)*dt+.19*zx,b[1]+db[1]*dt+.19*zy];p0.push(a);p1.push(b);}
        const tf=fitTransform(p0.concat(p1),W,38);
        return function(t){ground(ctx,W);
            const cell=28;for(let y=0;y<W;y+=cell)for(let x=0;x<W;x+=cell){const v=Math.sin(x*.022)+Math.cos(y*.026)+.7*Math.sin((x+y)*.015);ctx.fillStyle=v>0?`rgba(204,121,167,${.025+.035*v})`:`rgba(86,180,233,${.025-.035*v})`;ctx.fillRect(x,y,cell-1,cell-1);}
            const q=(t%12)/12,amount=q<.9?smooth(q/.9):1;trace(ctx,p0,amount,C.cyan,1.45,tf);trace(ctx,p1,amount,C.rose,1.45,tf);const u=tf(currentPoint(p0,amount)),v=tf(currentPoint(p1,amount));dot(ctx,u[0],u[1],3.4,C.cyan,C.bg,1.3);dot(ctx,v[0],v[1],3.4,C.rose,C.bg,1.3);if(q>.9){ctx.fillStyle=`rgba(21,19,26,${smooth((q-.9)/.1)})`;ctx.fillRect(0,0,W,W);}
        };
    }

    function makeLongRange(ctx,W){
        const rand=randomFactory(0x10a6e),pts=[[0,0]];let x=0,y=0;
        for(let i=0;i<360;i++){const angle=TAU*rand(),u=Math.max(.008,rand()),r=Math.min(22,.62/Math.sqrt(u));x+=r*Math.cos(angle);y+=r*Math.sin(angle);pts.push([x,y]);}
        const tf=fitTransform(pts,W,30);
        return function(t){ground(ctx,W,'rgba(212,93,125,.55)');const q=(t%13)/13,amount=q<.91?q/.91:1,z=amount*(pts.length-1),end=Math.floor(z);
            ctx.strokeStyle='rgba(216,207,190,.09)';ctx.lineWidth=1;ctx.beginPath();for(let i=24;i<W;i+=24){ctx.moveTo(i,18);ctx.lineTo(i,W-18);ctx.moveTo(18,i);ctx.lineTo(W-18,i);}ctx.stroke();
            for(let i=1;i<=end;i++){const a=tf(pts[i-1]),b=tf(pts[i]),len=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=len>5?'rgba(240,217,107,.78)':'rgba(101,196,231,.42)';ctx.lineWidth=len>5?2.1:1.2;ctx.stroke();}
            const p=tf(currentPoint(pts,amount));halo(ctx,p[0],p[1],13,C.yellow);dot(ctx,p[0],p[1],5.8,C.yellow,C.bg,2);if(q>.91){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.91)/.09)})`;ctx.fillRect(0,0,W,W);}
        };
    }

    function makeCylinderIDLA(ctx,W){
        const rand=randomFactory(0xc711da),N=22,occ=new Set(),settled=[],walks=[];for(let x=0;x<N;x++)occ.add(x+',0');
        for(let n=0;n<330;n++){let x=(rand()*N)|0,y=0,path=[[x,y]],guard=0;while(occ.has(x+','+y)&&guard++<12000){const r=(rand()*5)|0;if(r===0)x=(x+1)%N;if(r===1)x=(x+N-1)%N;if(r===2)y++;if(r===3)y=Math.max(0,y-1);path.push([x,y]);}occ.add(x+','+y);settled.push([x,y]);walks.push(path.filter((_,i)=>i%Math.max(1,Math.floor(path.length/55))===0).slice(-56));}
        function project(p){const th=TAU*p[0]/N-Math.PI/2,rad=142;return[W/2+rad*Math.cos(th),W-54-p[1]*8.6+26*Math.sin(th)];}
        return function(t){ground(ctx,W,'rgba(86,180,233,.5)');ctx.beginPath();ctx.ellipse(W/2,W-52,143,29,0,0,TAU);ctx.strokeStyle='rgba(236,228,213,.24)';ctx.lineWidth=2;ctx.stroke();const q=(t%14)/14,amount=q<.92?q/.92:1,k=Math.min(settled.length-1,Math.floor(amount*settled.length));
            const order=[];for(let i=0;i<=k;i++)order.push(i);order.sort((i,j)=>settled[i][1]-settled[j][1]||Math.sin(TAU*settled[i][0]/N)-Math.sin(TAU*settled[j][0]/N));order.forEach(i=>{const p=project(settled[i]),front=Math.sin(TAU*settled[i][0]/N-Math.PI/2);ctx.globalAlpha=.38+.5*(front+1)/2;dot(ctx,p[0],p[1],5.2,i===k?C.yellow:['#4d78a1','#5a8fb0','#70b1ca'][Math.floor(i/55)%3],C.bg,1);});ctx.globalAlpha=1;
            const path=walks[k]||[],partial=amount*settled.length-k;if(path.length>1){trace(ctx,path,partial,C.ink,1.5,project);const p=project(currentPoint(path,partial));dot(ctx,p[0],p[1],4,C.yellow,C.bg,1.5);}if(q>.92){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.92)/.08)})`;ctx.fillRect(0,0,W,W);}
        };
    }

    function makeRWRS(ctx,W){
        const N=23,pad=24,cell=(W-2*pad)/N,g=new Float32Array(N*N),frames=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)g[y*N+x]=(hash2(x,y,0x727772)-.5)*1.14;
        let u=new Float32Array(N*N),next=new Float32Array(N*N);frames.push(u.slice());for(let s=0;s<72;s++){for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;let sum=0,m=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const xx=x+d[0],yy=y+d[1];if(xx>=0&&xx<N&&yy>=0&&yy<N){sum+=u[yy*N+xx];m++;}});next[i]=Math.max(0,g[i]+sum/4);}const z=u;u=next;next=z;if(s%2===1)frames.push(u.slice());}
        const rand=randomFactory(0x57a1),walk=[[N>>1,N>>1]];for(let i=0;i<90;i++){const p=walk[walk.length-1],d=[[1,0],[-1,0],[0,1],[0,-1]][(rand()*4)|0],x=clamp(p[0]+d[0],0,N-1),y=clamp(p[1]+d[1],0,N-1);walk.push([x,y]);}
        return function(t){ground(ctx,W,'rgba(204,121,167,.55)');const q=(t%11)/11,fi=Math.min(frames.length-1,Math.floor((q<.68?q/.68:1)*(frames.length-1))),v=frames[fi];let mx=.01;for(let i=0;i<v.length;i++)mx=Math.max(mx,v[i]);
            for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,a=v[i]/mx,sg=g[i];ctx.fillStyle=a>0?`rgba(86,180,233,${(.08+.78*Math.sqrt(a)).toFixed(3)})`:sg>0?'rgba(204,121,167,.22)':'rgba(114,110,145,.14)';ctx.fillRect(pad+x*cell+.6,pad+y*cell+.6,cell-1.2,cell-1.2);}
            if(q>.68&&q<.94){const amount=(q-.68)/.26,tf=p=>[pad+(p[0]+.5)*cell,pad+(p[1]+.5)*cell];trace(ctx,walk,amount,C.yellow,2,tf);const p=tf(currentPoint(walk,amount));dot(ctx,p[0],p[1],4,C.yellow,C.bg,1.5);}if(q>.94){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.94)/.06)})`;ctx.fillRect(0,0,W,W);}
        };
    }

    function makeFlow(ctx,W,algebraic){
        const rand=randomFactory(algebraic?0xa16eb2:0xc8171c),modes=[];
        const octaves=algebraic?5:4;
        for(let j=0;j<octaves;j++){const k=Math.pow(2,j-1),amp=(algebraic?Math.pow(k,-.72):1/k);modes.push({k,amp,px:TAU*rand(),py:TAU*rand()});}
        function velocity(x,y){let vx=0,vy=0;modes.forEach(m=>{vx+=m.amp*m.k*Math.sin(m.k*x+m.px)*Math.cos(m.k*y+m.py);vy-=m.amp*m.k*Math.cos(m.k*x+m.px)*Math.sin(m.k*y+m.py);});const norm=algebraic?.23:.18;return[vx*norm,vy*norm];}
        const path=[[0,0]];let x=0,y=0;
        for(let i=0;i<1800;i++){const v=velocity(x,y),dt=.035,diff=algebraic?.045:.062;x+=v[0]*dt+diff*gaussian(rand);y+=v[1]*dt+diff*gaussian(rand);path.push([x,y]);}
        const tf=fitTransform(path,W,38),stream=[];
        for(let s=0;s<30;s++){let p=[mix(-4,4,rand()),mix(-4,4,rand())],line=[p];for(let j=0;j<34;j++){const v=velocity(p[0],p[1]),n=Math.max(.01,Math.hypot(v[0],v[1]));p=[p[0]+v[0]/n*.08,p[1]+v[1]/n*.08];line.push(p);}stream.push(line);}
        const stf=p=>[W/2+p[0]*43,W/2+p[1]*43];
        return function(t){ground(ctx,W,algebraic?'rgba(204,121,167,.5)':'rgba(86,180,233,.45)');
            stream.forEach((line,i)=>{ctx.globalAlpha=.11+.09*(i%3);trace(ctx,line,1,i%2?C.cyan:C.pink,1.1,stf);});ctx.globalAlpha=1;
            const q=(t%(algebraic?15:13))/(algebraic?15:13),amount=q<.92?smooth(q/.92):1;trace(ctx,path,amount,algebraic?C.yellow:C.ink,2.45,tf);const p=tf(currentPoint(path,amount)),col=algebraic?C.yellow:C.cyan;halo(ctx,p[0],p[1],14,col);dot(ctx,p[0],p[1],6,col,C.bg,2);if(q>.92){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.92)/.08)})`;ctx.fillRect(0,0,W,W);}
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
        for(let i=0;i<label.length;i++){const q=hash2(label[i],0,0x51),col=q>.68?[64,43,58]:q<.32?[35,63,78]:[29,26,36],j=i*4;d[j]=col[0];d[j+1]=col[1];d[j+2]=col[2];d[j+3]=255;}
        pc.putImageData(im,0,0);pc.strokeStyle='rgba(201,191,168,.38)';pc.lineWidth=.55;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=label[y*S+x];if(x+1<S&&i!==label[y*S+x+1]){pc.beginPath();pc.moveTo(x+1,y);pc.lineTo(x+1,y+1);pc.stroke();}if(y+1<S&&i!==label[(y+1)*S+x]){pc.beginPath();pc.moveTo(x,y+1);pc.lineTo(x+1,y+1);pc.stroke();}}
        return function(t){ground(ctx,W);ctx.imageSmoothingEnabled=false;ctx.drawImage(plate,0,0,W,W);const local=t%12,amount=Math.min(1,local/10),z=amount*(walk.length-1),end=Math.floor(z),start=Math.max(0,end-54),path=[];for(let i=start;i<=end;i++)path.push([nodes[walk[i]][0]*W/S,nodes[walk[i]][1]*W/S]);if(end<walk.length-1){const a=nodes[walk[end]],b=nodes[walk[end+1]],f=z-end;path.push([mix(a[0],b[0],f)*W/S,mix(a[1],b[1],f)*W/S]);}trace(ctx,path,1,C.ink,4.2);const p=path[path.length-1];dot(ctx,p[0],p[1],5.8,C.ink,C.bg,2);if(local>11.5){ctx.globalAlpha=(local-11.5)/.5;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;}
        };
    }

    function makeUniqueContinuation(ctx,W){
        const R=17, dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]], cells=[], byKey=new Map();
        for(let r=-R;r<=R;r++)for(let q=-R;q<=R;q++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=R){const i=cells.length;cells.push({q,r});byKey.set(q+','+r,i);}
        const size=(W-28)/(Math.sqrt(3)*(2*R+1)), centres=cells.map(v=>[W/2+size*Math.sqrt(3)*(v.q+v.r/2),W/2+size*1.5*v.r]);
        const adj=cells.map(v=>dirs.map(d=>byKey.get((v.q+d[0])+','+(v.r+d[1]))).filter(i=>i!==undefined));
        const boundary=cells.map((v,i)=>({i,theta:Math.atan2(centres[i][1]-W/2,centres[i][0]-W/2),d:Math.max(Math.abs(v.q),Math.abs(v.r),Math.abs(v.q+v.r))})).filter(v=>v.d===R).sort((a,b)=>a.theta-b.theta);
        const modes=[];
        for(let mode=1;mode<=7;mode++){
            const f=new Float64Array(cells.length),fixed=new Uint8Array(cells.length);
            boundary.forEach(b=>{fixed[b.i]=1;f[b.i]=Math.sin(mode*b.theta+.23);});
            for(let pass=0;pass<1000;pass++){
                let err=0;
                for(let i=0;i<f.length;i++)if(!fixed[i]){let s=0;for(let j=0;j<adj[i].length;j++)s+=f[adj[i][j]];const v=s/adj[i].length;err=Math.max(err,Math.abs(v-f[i]));f[i]=v;}
                if(err<1e-10)break;
            }
            modes.push(f);
        }
        const schedule=[0,1,2,3,4,5,6,5,4,3,2,1];
        function hex(x,y){ctx.moveTo(x+size*Math.cos(-Math.PI/6),y+size*Math.sin(-Math.PI/6));for(let k=1;k<6;k++)ctx.lineTo(x+size*Math.cos(-Math.PI/6+k*Math.PI/3),y+size*Math.sin(-Math.PI/6+k*Math.PI/3));ctx.closePath();}
        return function(t){
            ground(ctx,W);const z=(t%12),si=Math.floor(z)%schedule.length,a=smooth(z-Math.floor(z)),f0=modes[schedule[si]],f1=modes[schedule[(si+1)%schedule.length]],f=new Float32Array(cells.length),sign=new Int8Array(cells.length);
            for(let i=0;i<f.length;i++){f[i]=mix(f0[i],f1[i],a);sign[i]=f[i]>=0?1:-1;}
            ctx.beginPath();for(let i=0;i<cells.length;i++)if(sign[i]>0)hex(centres[i][0],centres[i][1]);ctx.fillStyle=C.blue;ctx.fill();
            ctx.beginPath();for(let i=0;i<cells.length;i++)if(sign[i]<0)hex(centres[i][0],centres[i][1]);ctx.fillStyle=C.pink;ctx.fill();
            ctx.beginPath();const half=size*.5;
            for(let i=0;i<cells.length;i++)for(const d of [[1,0],[0,1],[1,-1]]){const j=byKey.get((cells[i].q+d[0])+','+(cells[i].r+d[1]));if(j===undefined||sign[i]===sign[j])continue;const p=centres[i],q=centres[j],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,dx=q[0]-p[0],dy=q[1]-p[1],n=Math.hypot(dx,dy);ctx.moveTo(mx-dy/n*half,my+dx/n*half);ctx.lineTo(mx+dy/n*half,my-dx/n*half);}
            ctx.strokeStyle=C.yellow;ctx.lineWidth=3.75;ctx.lineCap='round';ctx.stroke();
            for(let j=0;j<boundary.length;j++){const b=boundary[j],c=boundary[(j+1)%boundary.length];if(sign[b.i]===sign[c.i])continue;const p=centres[b.i],q=centres[c.i];dot(ctx,(p[0]+q[0])/2,(p[1]+q[1])/2,3.8,C.bg,C.ink,1.4);}
            ctx.beginPath();boundary.forEach((b,j)=>j?ctx.lineTo(...centres[b.i]):ctx.moveTo(...centres[b.i]));ctx.closePath();ctx.strokeStyle='rgba(201,191,168,.8)';ctx.lineWidth=2.2;ctx.stroke();
        };
    }

    function makePercolationHarmonic(ctx,W){
        const N=20,pad=23,cell=(W-2*pad)/(N-1),edges=[],adj=Array.from({length:N*N},()=>[]);
        for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;[[1,0],[0,1]].forEach((d,k)=>{const xx=x+d[0],yy=y+d[1];if(xx>=N||yy>=N)return;if(hash2(x*2+k,y,0x7063)<.79){const j=yy*N+xx;edges.push([i,j]);adj[i].push(j);adj[j].push(i);}});}
        const seen=new Uint8Array(N*N),queue=[Math.floor(N/2)*N+Math.floor(N/2)];seen[queue[0]]=1;for(let h=0;h<queue.length;h++)adj[queue[h]].forEach(j=>{if(!seen[j]){seen[j]=1;queue.push(j);}});
        let val=new Float32Array(N*N);for(let i=0;i<val.length;i++)val[i]=seen[i]?hash2(i%N,(i/N)|0,0x41)-.5:0;const frames=[val.slice()];for(let s=0;s<100;s++){const next=val.slice();for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(!seen[i]||!adj[i].length)continue;let sum=0;adj[i].forEach(j=>sum+=val[j]);next[i]=sum/adj[i].length;}for(let y=0;y<N;y++){const l=y*N,r=y*N+N-1;if(seen[l])next[l]=-1;if(seen[r])next[r]=1;}val=next;if(s%5===4)frames.push(val.slice());}
        return function(t){ground(ctx,W,'rgba(86,180,233,.36)');const q=(t%10)/10,fi=Math.min(frames.length-1,Math.floor((q<.88?q/.88:1)*(frames.length-1))),v=frames[fi];edges.forEach(e=>{if(!seen[e[0]]||!seen[e[1]])return;const a=e[0],b=e[1],x1=pad+(a%N)*cell,y1=pad+((a/N)|0)*cell,x2=pad+(b%N)*cell,y2=pad+((b/N)|0)*cell,u=(v[a]+v[b])*.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=u>0?`rgba(86,180,233,${.28+.45*Math.abs(u)})`:`rgba(204,121,167,${.28+.45*Math.abs(u)})`;ctx.lineWidth=1.4;ctx.stroke();});queue.forEach(i=>{const x=pad+(i%N)*cell,y=pad+((i/N)|0)*cell;dot(ctx,x,y,1.7,v[i]>0?C.cyan:C.pink);});if(q>.88){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.88)/.12)})`;ctx.fillRect(0,0,W,W);}
        };
    }

    function makeMatedCRTIDLA(ctx,W){
        let data=null,mesh=null,cluster=null,mctx=null,cctx=null,transform=null,last=-1;
        function cellPath(c,v){const raw=data.cells[v];if(!raw||!raw.length)return false;const pieces=typeof raw[0]==='number'?[raw]:raw;c.beginPath();let any=false;for(const p of pieces){if(!p||p.length<6)continue;const a=transform(p[0],p[1]);c.moveTo(a[0],a[1]);for(let j=2;j+1<p.length;j+=2){const q=transform(p[j],p[j+1]);c.lineTo(q[0],q[1]);}c.closePath();any=true;}return any;}
        function paintCell(c,v,fill){if(cellPath(c,v)){c.fillStyle=fill;c.fill();}else{const p=transform(data.xy[v][0],data.xy[v][1]);dot(c,p[0],p[1],1.8,fill);}}
        function build(raw){
            data=raw.idla;let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
            data.order.forEach(v=>{const p=data.xy[v];x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
            const pad=20,s=(W-2*pad)/Math.max(x1-x0,y1-y0),ox=W/2-s*(x0+x1)/2,oy=W/2-s*(y0+y1)/2;
            transform=(x,y)=>[ox+s*x,oy+s*y];mesh=document.createElement('canvas');cluster=document.createElement('canvas');mesh.width=cluster.width=W;mesh.height=cluster.height=W;mctx=mesh.getContext('2d');cctx=cluster.getContext('2d');
            mctx.fillStyle=C.bg;mctx.fillRect(0,0,W,W);mctx.strokeStyle='rgba(201,191,168,.20)';mctx.lineWidth=.8;
            for(let v=0;v<data.n;v++){const p=data.xy[v];if(p[0]<x0-25||p[0]>x1+25||p[1]<y0-25||p[1]>y1+25)continue;if(cellPath(mctx,v))mctx.stroke();}
            draw.ready=true;
        }
        function reset(){cctx.clearRect(0,0,W,W);last=-1;}
        function draw(t){
            ground(ctx,W);if(!draw.ready||!data)return false;const local=t%11.5,amount=Math.min(1,local/9),k=Math.min(data.order.length-1,Math.floor(amount*(data.order.length-1)));
            if(k<last)reset();for(let j=last+1;j<=k;j++)paintCell(cctx,data.order[j],rampColour(ORDER,j/Math.max(1,data.order.length-1)));last=k;
            ctx.drawImage(mesh,0,0);ctx.drawImage(cluster,0,0);
            const recent=Math.max(0,k-14);for(let j=recent;j<=k;j++)paintCell(ctx,data.order[j],C.ink);
            const source=transform(data.xy[data.source][0],data.xy[data.source][1]);dot(ctx,source[0],source[1],4.5,C.ink,C.bg,2.2);
            if(local>11){ctx.globalAlpha=(local-11)/.5;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;}return true;
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
            if(local>12){ctx.globalAlpha=(local-12)/.5;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;}
        };
    }

    function makeFLattice(ctx,W){
        const image=new Image();let half=null;
        function buildHalf(){half=document.createElement('canvas');half.width=Math.ceil(image.width/2);half.height=Math.ceil(image.height/2);const c=half.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,0,0,half.width,half.height);draw.ready=true;}
        function camera(p){let q;if(p<.12)q=0;else if(p<.50)q=smooth((p-.12)/.38);else if(p<.78)q=1;else q=1-smooth((p-.78)/.22);const width=Math.exp(mix(Math.log(132),Math.log(image.width),q));return{q,width,x:mix(740,image.width*.5,q),y:mix(330,image.height*.5,q)};}
        function draw(t){ground(ctx,W);if(!draw.ready)return false;const p=(t%14)/14,cam=camera(p),sw=cam.width,sx=clamp(cam.x-sw/2,0,image.width-sw),sy=clamp(cam.y-sw/2,0,image.height-sw),inset=8,dest=W-16,perPixel=sw/dest;ctx.imageSmoothingEnabled=perPixel>.9;ctx.imageSmoothingQuality='high';if(half&&perPixel>1.4)ctx.drawImage(half,sx/2,sy/2,sw/2,sw/2,inset,inset,dest,dest);else ctx.drawImage(image,sx,sy,sw,sw,inset,inset,dest,dest);return true;}
        draw.ready=false;draw.failed=false;image.onload=buildHalf;image.onerror=()=>{draw.failed=true;};image.src='gallery/plates/p5-flattice-hero-void.png';return draw;
    }

    function makePareto(ctx,W){
        const rand=randomFactory(0x706172),pts=[];for(let i=0;i<190;i++)pts.push({x:28+364*rand(),y:28+364*rand(),layer:1});const order=pts.map((_,i)=>i).sort((i,j)=>pts[i].x-pts[j].x||pts[i].y-pts[j].y);let maxLayer=1;for(let a=0;a<order.length;a++){const i=order[a];let m=0;for(let b=0;b<a;b++){const j=order[b];if(pts[j].x<=pts[i].x&&pts[j].y<=pts[i].y)m=Math.max(m,pts[j].layer);}pts[i].layer=m+1;maxLayer=Math.max(maxLayer,m+1);}
        const colors=['#3e6d91','#4d83a5','#6399b4','#8a79a3','#b2688a'];
        return function(t){ground(ctx,W,'rgba(204,121,167,.35)');const q=(t%13)/13,front=1+Math.floor((q<.92?q/.92:1)*(maxLayer-1));for(let layer=1;layer<=maxLayer;layer++){const a=pts.filter(p=>p.layer===layer).sort((u,v)=>u.x-v.x);if(a.length>1){ctx.beginPath();a.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=layer===front?C.yellow:'rgba(220,212,197,.10)';ctx.lineWidth=layer===front?2:1;ctx.stroke();}}pts.forEach(p=>{if(p.layer>front)dot(ctx,p.x,p.y,2.1,'rgba(220,212,197,.13)');else if(p.layer===front)dot(ctx,p.x,p.y,4,C.yellow,C.bg,1.2);else dot(ctx,p.x,p.y,2.7,colors[(p.layer-1)%colors.length]);});if(q>.92){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.92)/.08)})`;ctx.fillRect(0,0,W,W);}
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
            if(local>11.5){ctx.globalAlpha=(local-11.5)/.5;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;}
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
            if(local>11.5){ctx.globalAlpha=(local-11.5)/.5;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;}
        };
    }

    function makeRandomSandpile(ctx,W){
        const N=51,c=N>>1,heights=new Uint16Array(N*N),queued=new Uint8Array(N*N),snapshots=[],rand=randomFactory(0x5a6d);
        for(let i=0;i<heights.length;i++)heights[i]=(rand()*4)|0;
        function stabilize(){const queue=[],push=i=>{if(!queued[i]&&heights[i]>=4){queued[i]=1;queue.push(i);}};push(c*N+c);for(let h=0;h<queue.length;h++){const i=queue[h];queued[i]=0;if(heights[i]<4)continue;const q=(heights[i]/4)|0;heights[i]-=4*q;const x=i%N,y=(i/N)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const xx=x+d[0],yy=y+d[1];if(xx<0||xx>=N||yy<0||yy>=N)return;const j=yy*N+xx;heights[j]+=q;push(j);});push(i);}}
        stabilize();for(let grains=0;grains<=8500;grains++){heights[c*N+c]++;if(heights[c*N+c]>=4)stabilize();if(grains%230===0)snapshots.push(heights.slice());}
        const pad=18,cell=(W-2*pad)/N,colors=['#171722','#4c5269','#9a4f68','#78bdd5'];
        return function(t){ground(ctx,W,'rgba(204,121,167,.38)');const q=(t%12)/12,fi=Math.min(snapshots.length-1,Math.floor((q<.92?q/.92:1)*(snapshots.length-1))),a=snapshots[fi];for(let y=0;y<N;y++)for(let x=0;x<N;x++){ctx.fillStyle=colors[a[y*N+x]&3];ctx.fillRect(pad+x*cell+.25,pad+y*cell+.25,cell-.5,cell-.5);}dot(ctx,W/2,W/2,3.5,C.yellow,C.bg,1.2);if(q>.92){ctx.fillStyle=`rgba(16,19,29,${smooth((q-.92)/.08)})`;ctx.fillRect(0,0,W,W);}
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
        function fail(err){failed=true;running=false;cancelAnimationFrame(raf);canvas.hidden=true;if(err){canvas.__publicationThumbnailError=String(err&&err.stack||err);console.warn('publication thumbnail '+kind+':',err);}}
        function ensure(){if(renderer||failed)return;try{renderer=factory(ctx,canvas.width);}catch(err){fail(err);}}
        function draw(){ensure();if(!renderer||failed)return;try{const ok=renderer(elapsed/1000);if(renderer.failed){fail();return;}if(!revealed&&renderer.ready!==false&&ok!==false){revealed=true;canvas.style.opacity='1';}}catch(err){fail(err);}}
        Object.defineProperty(canvas,'__publicationThumbnailRender',{value:function(seconds){elapsed=Math.max(0,seconds*1000);draw();},configurable:true});
        function frame(now){if(!running)return;if(!last)last=now;elapsed+=Math.min(50,now-last);last=now;draw();if(!failed)raf=requestAnimationFrame(frame);}
        function play(){if(running||!visible||document.hidden||failed)return;ensure();running=true;last=0;raf=requestAnimationFrame(frame);}
        function pause(){if(!running)return;running=false;cancelAnimationFrame(raf);raf=0;last=0;}
        if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)play();else pause();},{threshold:.01,rootMargin:'240px 0px'});observer.observe(canvas.parentElement||canvas);}else{visible=true;play();}
        document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
    }

    window.PublicationThumbnailAnimations={attach,kinds:Object.keys(FACTORIES)};
}());
