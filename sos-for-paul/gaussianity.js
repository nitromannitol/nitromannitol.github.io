'use strict';
function experimentWorker() {
  onmessage = async e => {
    const { config, settings } = e.data, results = [], startTime = Date.now();
    try {
      for (let k = 0; k < settings.sizes.length; k++) {
        const N = settings.sizes[k], runs = [];
        for (let replica = 0; replica < 3; replica++) {
          const state = RealSOS.runSetup({ ...config, N }, replica, settings.radius);
          const burn = config.q === 2 ? 0 : settings.burn, thin = config.q === 2 ? 1 : settings.thin;
          const end = burn + settings.samples * thin;
          let last = 0;
          while (state.chain.sweeps < end) {
            const begin = performance.now();
            do {
              state.chain.sweep();
              if (state.chain.sweeps > burn && (state.chain.sweeps-burn)%thin===0) RealSOS.recordRun(state);
            } while (state.chain.sweeps < end && performance.now()-begin < 24);
            if (performance.now()-last > 100 || state.chain.sweeps === end) {
              postMessage({ type:'progress', N, replica, sweep:state.chain.sweeps, burn, total:end, heights:Array.from(state.chain.heights), progress:(k*3+replica+state.chain.sweeps/end)/(settings.sizes.length*3), results });
              last = performance.now();
            }
            await new Promise(r=>setTimeout(r,0));
          }
          state.data.finalHeights = Array.from(state.chain.heights);
          state.data.finalEnergy = state.chain.energy;
          state.data.acceptance = Object.fromEntries(Object.keys(state.chain.attempted).map(key=>[key,state.chain.attempted[key] ? state.chain.accepted[key]/state.chain.attempted[key] : null]));
          runs.push(state.data);
        }
        results.push(RealSOS.summarizeRuns(runs,{ ...config,N },settings.radius));
        postMessage({ type:'result', results });
      }
      postMessage({ type:'complete', config, settings, results, generatedAt:new Date().toISOString(), elapsedSeconds:(Date.now()-startTime)/1000 });
    } catch(error) { postMessage({type:'error',message:error.message}); }
  };
}
const $ = id => document.getElementById(id);
const C = { teal:'#147b70', orange:'#ca7643', blue:'#7388a6', grid:'#e5e7de', muted:'#849188', ink:'#203b3a' };
let experiment = null, worker = null, results = [], selectedN = null, liveProfile = null, activeConfig = null, activeSettings = null;
const fmt = (x,d=3) => x === null || x === undefined || !Number.isFinite(x) ? '—' : x.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
function showError(text) { $('error').textContent=text; $('error').classList.remove('hidden'); }
function settingsFromForm() {
  const config={q:Number($('q').value),alpha:Number($('alpha').value),beta:Number($('beta').value),seed:Number($('seed').value)};
  const samples={quick:1000,standard:4000,long:16000}[$('budget').value];
  const settings={sizes:$('sizes').value.split(',').map(Number),samples,burn:Number($('burn').value),thin:Number($('thin').value),replicas:3,radius:Number($('radius').value)};
  if(!Number.isInteger(settings.burn)||settings.burn<0||settings.burn>1000000||!Number.isInteger(settings.thin)||settings.thin<1||settings.thin>1000||!Number.isInteger(config.seed)||config.seed<0||config.seed>4294967295) throw Error('Check the warmup, thinning and seed settings.');
  if(config.q===2) {settings.burn=0;settings.thin=1;}
  return {config,settings};
}
function setFormEnabled(enabled) { for(const id of ['q','alpha','beta','sizes','budget','radius','burn','thin','seed','run']) $(id).disabled=!enabled; $('stop').disabled=enabled; }
function setFormula(config) {
  const {H,logPower}=RealSOS.candidateScaling(config.q,config.alpha);
  $('user-formula').innerHTML='n<sup>−'+(2*config.alpha-4).toFixed(2)+'</sup> Σ f(x/n) φ(x)';
  $('candidate-formula').innerHTML=(config.beta===1?'':'β<sup>1/'+config.q+'</sup> ')+'n<sup>−'+(1+H).toFixed(2)+'</sup>'+(logPower?' (log n)<sup>'+(-logPower).toFixed(2)+'</sup>':'')+' Σ f(x/n) φ(x)';
}
function start() {
  try {
    const {config,settings}=settingsFromForm(); activeConfig=config;activeSettings=settings;
    worker?.terminate();results=[];experiment=null;selectedN=null;liveProfile=null;
    setFormEnabled(false);$('export').disabled=true;$('error').classList.add('hidden');$('status').textContent='Sampling';$('progress').style.width='0%';
    setFormula(config);render();
    const blob=new Blob(['const RealSOS = '+RealSOS.workerSource+';('+experimentWorker.toString()+')();'],{type:'text/javascript'});
    const url=URL.createObjectURL(blob);worker=new Worker(url);URL.revokeObjectURL(url);
    worker.onerror=e=>{showError(e.message);finish();};
    worker.onmessage=e=>{
      const m=e.data;
      if(m.type==='progress') {
        $('progress').style.width=(100*m.progress)+'%';$('progress-text').textContent='n = '+m.N+' · chain '+(m.replica+1)+' / 3 · '+m.sweep.toLocaleString()+' / '+m.total.toLocaleString()+(m.sweep<=m.burn?' warmup / total sweeps':' sweeps');
        liveProfile={N:m.N,heights:m.heights};drawProfile();
      } else if(m.type==='result') {results=m.results;selectedN=results.at(-1).N;render();}
      else if(m.type==='complete') {
        experiment=m;results=m.results;selectedN=results.at(-1).N;window.realExperiment=m;
        $('progress').style.width='100%';$('progress-text').textContent='Complete in '+fmt(m.elapsedSeconds,1)+' s · '+settings.samples.toLocaleString()+' samples × 3 chains per size · '+settings.burn.toLocaleString()+' warmup sweeps.';
        finish();render();
      } else if(m.type==='error') {showError(m.message);finish();}
    };
    worker.postMessage({config,settings});
  }catch(e){showError(e.message);setFormEnabled(true);}
}
function finish() {worker?.terminate();worker=null;setFormEnabled(true);$('export').disabled=!results.length;$('status').textContent=experiment?'Complete':'Stopped';}
function selected() {return results.find(r=>r.N===selectedN)||results.at(-1);}
function comparisonFor(result) {
  const source=window.LIMIT_COMPARISON;
  if(!source||!result||result.runs[0].smoothMultiplier===undefined)return null;
  if(['q','alpha','beta'].some(k=>Math.abs(result.config[k]-source.config[k])>1e-9)||Math.abs((result.radius||.8)-.8)>1e-9)return null;
  return source.analysis.find(r=>r.N===result.N)||null;
}
function series(result) {
  const obs=$('observable').value;
  return result.runs.flatMap(run=>run.f.map((v,i)=>obs==='g'?run.g[i]:v+Number(obs)*run.g[i]));
}
function canvas(id) {
  const element=$(id),r=element.getBoundingClientRect(),scale=Math.min(2,window.devicePixelRatio||1);
  element.width=Math.round(r.width*scale);element.height=Math.round(r.height*scale);
  const ctx=element.getContext('2d');ctx.setTransform(scale,0,0,scale,0,0);ctx.font='10px -apple-system,BlinkMacSystemFont,sans-serif';ctx.lineJoin='round';
  return {ctx,w:r.width,h:r.height};
}
function line(ctx,x,y,X,Y,color=C.grid,width=1) {ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke();}
function empty(a,text='Results appear after the first box is sampled.') {a.ctx.fillStyle=C.muted;a.ctx.textAlign='center';a.ctx.fillText(text,a.w/2,a.h/2);}
function axes(a,xmin,xmax,ymin,ymax,xlabel='',ylabel='') {
  const {ctx,w,h}=a,l=43,r=w-15,t=23,b=h-29;
  const x=v=>l+(v-xmin)/(xmax-xmin)*(r-l),y=v=>b-(v-ymin)/(ymax-ymin)*(b-t);
  for(let k=0;k<=4;k++){const xv=xmin+(xmax-xmin)*k/4,yv=ymin+(ymax-ymin)*k/4;line(ctx,x(xv),t,x(xv),b);line(ctx,l,y(yv),r,y(yv));ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText(fmt(xv,Math.abs(xmax-xmin)<2?2:1),x(xv),b+17);ctx.textAlign='right';ctx.fillText(fmt(yv,Math.abs(ymax-ymin)<2?2:1),l-5,y(yv)+3);}
  ctx.fillStyle=C.muted;ctx.textAlign='left';ctx.fillText(ylabel,l,11);ctx.textAlign='right';ctx.fillText(xlabel,r,11);
  return {x,y,l,r,t,b};
}
function path(ctx,points,color=C.teal,width=1.5) {ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
function drawProfile() {
  const a=canvas('profile');let p=liveProfile;
  if(!p){const r=selected();if(r)p={N:r.N,heights:r.runs.at(-1).finalHeights};}
  if(!p?.heights)return empty(a,'Real-valued field samples will appear here.');
  const bound=Math.max(.5,...p.heights.map(Math.abs))*1.2;
  const ax=axes(a,-p.N-1,p.N+1,-bound,bound,'SITE i','HEIGHT φ(i)');
  path(a.ctx,[[ax.x(-p.N-1),ax.y(0)],...p.heights.map((v,i)=>[ax.x(i-p.N),ax.y(v)]),[ax.x(p.N+1),ax.y(0)]]);
  const radius=activeSettings?.radius||.8;
  path(a.ctx,p.heights.map((_,i)=>[ax.x(i-p.N),ax.y(bound*.75*RealSOS.bump((i-p.N)/p.N,radius))]),C.orange,1);
  $('profile-info').textContent='n = '+p.N+' · '+p.heights.length+' real heights';
}
function drawDistribution(values,m) {
  const a=canvas('distribution');if(!values?.length||!m.variance)return empty(a);
  const sd=Math.sqrt(m.variance),standard=values.map(v=>(v-m.mean)/sd),extent=Math.max(4,Math.min(10,...[Math.max(...standard.map(Math.abs))]));
  const bins=Array(42).fill(0),step=2*extent/bins.length;
  for(const z of standard){const i=Math.floor((z+extent)/step);if(i>=0&&i<bins.length)bins[i]++;}
  const peak=Math.max(.42,...bins.map(x=>x/(values.length*step)))*1.1;
  const ax=axes(a,-extent,extent,0,peak,'STANDARDIZED OBSERVABLE','DENSITY');
  bins.forEach((count,i)=>{a.ctx.fillStyle='#70a897';a.ctx.fillRect(ax.x(-extent+i*step)+.5,ax.y(count/(values.length*step)),Math.max(1,ax.x(step)-ax.x(0)-1),ax.b-ax.y(count/(values.length*step)));});
  const curve=[];for(let z=-extent;z<=extent;z+=.05)curve.push([ax.x(z),ax.y(Math.exp(-z*z/2)/Math.sqrt(2*Math.PI))]);path(a.ctx,curve,C.orange,2);
  const selectedFit=$('fit-overlay').value,key=$('observable').value==='g'?'g':$('observable').value==='0'?'f':null;
  const fit=comparisonFor(selected())?.fits.find(f=>f.key===key);
  if(fit&&selectedFit!=='normal')path(a.ctx,fit.density.filter(p=>Math.abs(p.x)<=extent).map(p=>[ax.x(p.x),ax.y(p[selectedFit])]),C.blue,2);
}
function drawQQ(values,m) {
  const a=canvas('qq');if(!values?.length||!m.variance)return empty(a);
  const sorted=values.slice().sort((a,b)=>a-b),points=[];
  for(let i=0;i<121;i++){const p=.005+.99*i/120;points.push([RealSOS.normalQuantile(p),(sorted[Math.floor(p*(sorted.length-1))]-m.mean)/Math.sqrt(m.variance)]);}
  const bound=Math.max(3,...points.map(p=>Math.abs(p[1])))*1.05,ax=axes(a,-bound,bound,-bound,bound,'NORMAL QUANTILE','SAMPLE QUANTILE');
  line(a.ctx,ax.x(-bound),ax.y(-bound),ax.x(bound),ax.y(bound),C.orange,1.5);
  for(const p of points){a.ctx.beginPath();a.ctx.fillStyle=C.teal;a.ctx.arc(ax.x(p[0]),ax.y(p[1]),2,0,2*Math.PI);a.ctx.fill();}
}
function fitSlope(points) {
  if(points.length<2)return null;const mx=points.reduce((s,p)=>s+p[0],0)/points.length,my=points.reduce((s,p)=>s+p[1],0)/points.length;
  return points.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/points.reduce((s,p)=>s+(p[0]-mx)**2,0);
}
function drawScaling() {
  const a=canvas('scaling');if(!results.length)return empty(a);
  const selectedData=results.map(r=>({r,m:RealSOS.moments(series(r))}));
  const sets=['candidate','user'].map(key=>selectedData.map(({r,m})=>[Math.log2(r.N),Math.log10(m.variance*(r[key].factor??r.N**(-r[key].exponent))**2)]));
  const all=sets.flat();if(all.some(p=>!Number.isFinite(p[1])))return empty(a,'No positive variance to plot.');
  const xmin=Math.min(...all.map(p=>p[0])),xmax=Math.max(xmin+1,...all.map(p=>p[0])),ymin=Math.min(...all.map(p=>p[1]))-.2,ymax=Math.max(...all.map(p=>p[1]))+.2;
  const ax=axes(a,xmin,xmax,ymin,ymax,'log₂ n','log₁₀ VARIANCE');
  sets.forEach((ps,k)=>{path(a.ctx,ps.map(p=>[ax.x(p[0]),ax.y(p[1])]),k?C.orange:C.teal,2);for(const p of ps){a.ctx.fillStyle=k?C.orange:C.teal;a.ctx.beginPath();a.ctx.arc(ax.x(p[0]),ax.y(p[1]),3.5,0,2*Math.PI);a.ctx.fill();}});
  const slope=fitSlope(selectedData.map(({r,m})=>[Math.log(r.N),Math.log(m.variance)]));
  $('slope-note').textContent=slope===null?'More sizes are needed to estimate growth.':'Raw variance slope ≈ '+fmt(slope,2)+' → pairing-based H ≈ '+fmt(slope/2-1,3)+' (finite-size fit).';
}
function drawChains(r) {
  const a=canvas('chains');if(!r)return empty(a);
  const all=r.runs.flatMap(x=>x.f),bound=Math.max(1,...all.map(Math.abs))*1.05;
  const ax=axes(a,0,r.runs[0].f.length,-bound,bound,'SAVED SAMPLE','RAW EVEN-BUMP PAIRING');
  r.runs.forEach((run,k)=>{const stride=Math.max(1,Math.floor(run.f.length/600)),points=[];for(let i=0;i<run.f.length;i+=stride)points.push([ax.x(i),ax.y(run.f[i])]);path(a.ctx,points,[C.teal,C.orange,C.blue][k],.7);});
}
function drawKurtosisTrend() {
  const a=canvas('kurtosis-trend');if(!results.length)return empty(a);
  const low=Math.min(-.04,...results.map(r=>r.kurtosisInterval?.[0]??r.f.excess));
  const high=Math.max(.1,...results.map(r=>r.kurtosisInterval?.[1]??r.f.excess))+.04;
  const ax=axes(a,Math.log2(results[0].N),Math.log2(results.at(-1).N)+.05,low,high,'log₂ n','EXCESS KURTOSIS · EVEN BUMP');
  line(a.ctx,ax.l,ax.y(0),ax.r,ax.y(0),C.orange,1.5);
  path(a.ctx,results.map(r=>[ax.x(Math.log2(r.N)),ax.y(r.f.excess)]));
  for(const r of results){const x=ax.x(Math.log2(r.N)),interval=r.kurtosisInterval;
    if(interval){line(a.ctx,x,ax.y(interval[0]),x,ax.y(interval[1]),C.teal);for(const y of interval)line(a.ctx,x-4,ax.y(y),x+4,ax.y(y),C.teal);}
    a.ctx.fillStyle=C.teal;a.ctx.beginPath();a.ctx.arc(x,ax.y(r.f.excess),3.5,0,2*Math.PI);a.ctx.fill();
  }
}
function drawIncrements(r) {
  const a=canvas('increments');if(!r?.incrementMoments.length)return empty(a);
  const points=r.incrementMoments.filter(p=>p.second>0).map(p=>[Math.log2(p.lag),Math.log2(p.second)]);
  if(!points.length)return empty(a);
  const xmin=0,xmax=Math.max(1,...points.map(p=>p[0])),ymin=Math.min(...points.map(p=>p[1]))-.2,ymax=Math.max(...points.map(p=>p[1]))+.2;
  const ax=axes(a,xmin,xmax,ymin,ymax,'log₂ SEPARATION','log₂ MEAN SQUARED INCREMENT');
  path(a.ctx,points.map(p=>[ax.x(p[0]),ax.y(p[1])]));const first=points[0];
  // Anchor a candidate power law to the first measured separation; amplitude is free.
  const endY=first[1]+2*r.candidateH*(xmax-first[0]);
  a.ctx.setLineDash([4,4]);line(a.ctx,ax.x(first[0]),ax.y(first[1]),ax.x(xmax),ax.y(endY),C.orange,1.5);a.ctx.setLineDash([]);
  a.ctx.textAlign='right';a.ctx.fillStyle=C.orange;a.ctx.fillText('Dashed: power-law slope '+fmt(2*r.candidateH,2)+(r.candidate.logPower?' (log factors omitted)':''),ax.r,24);
}
function render() {
  $('size-buttons').innerHTML=results.map(r=>'<button class="size-button '+(r.N===selectedN?'active':'')+'" data-n="'+r.N+'">n = '+r.N+'</button>').join('');
  for(const b of $('size-buttons').children)b.onclick=()=>{selectedN=Number(b.dataset.n);if(!worker)liveProfile=null;render();};
  const r=selected(),values=r?series(r):null,m=values?RealSOS.moments(values):null;
  $('kurtosis').textContent=m?fmt(m.excess):'—';$('skewness').textContent=m?fmt(m.skewness):'—';$('rhat').textContent=r?fmt(r.rhat,3):'—';$('ess').textContent=r?fmt(r.effectiveSamples,0):'—';
  $('rhat-note').textContent=r?'Squared observable R̂ = '+fmt(r.rhatSquared,3):'Across dispersed chains';
  $('ess-note').textContent=r?'ESS of X² ≈ '+fmt(r.effectiveSquaredSamples,0)+' / '+r.f.count.toLocaleString():'Autocorrelation estimate';
  if(r){
    const bad=Math.max(r.rhat||Infinity,r.rhatSquared||Infinity)>1.05||r.effectiveSquaredSamples<400;
    $('assessment').classList.toggle('caution',bad);
    const interval=r.kurtosisInterval;
    $('assessment').textContent=bad?'Mixing needs more work at n = '+r.N+'. Increase the sampling budget before interpreting normality or scaling.':r.config.q===2?'Exact Gaussian control: each configuration is an independent Gaussian draw. Use this to calibrate the diagnostics.':interval&&interval[0]>0?'At n = '+r.N+', the even-bump observable has positive excess kurtosis (block interval '+fmt(interval[0],2)+' to '+fmt(interval[1],2)+'). This is finite-size evidence of heavier tails than a Gaussian; inspect its trend as n grows.':'At n = '+r.N+', inspect the kurtosis interval and Q–Q tails. Compatibility with Gaussian shape at this size does not identify a scaling limit.';
  }
  $('results-table').innerHTML=results.map(r=>'<tr><td>'+r.N+'</td><td>'+fmt(r.f.excess)+'</td><td>'+(r.kurtosisInterval?r.kurtosisInterval.map(x=>fmt(x)).join(' to '):'—')+'</td><td>'+fmt(r.rhat,3)+'</td><td>'+fmt(r.effectiveSquaredSamples,0)+'</td><td>'+fmt(r.wickResidual)+'</td></tr>').join('');
  const comparison=comparisonFor(r);
  $('fit-table').innerHTML=comparison?comparison.fits.map(f=>'<tr><td>'+({f:'Even bump',g:'Odd bump',narrow:'Narrow bump'}[f.key])+'</td><td>'+fmt(f.ggShape,3)+'</td><td>'+fmt(f.vgShape,2)+'</td><td>'+fmt(f.ggLogGain,5)+'</td><td>'+fmt(f.vgLogGain,5)+'</td></tr>').join(''):'<tr><td colspan="5">Candidate fits are available for the newer compiled runs.</td></tr>';
  $('amplitude-check').textContent=comparison?'One common random amplitude, independent of the Gaussian field it multiplies, predicts equal standardized kurtosis for all observables. Even − odd kurtosis = '+fmt(r.f.excess-r.g.excess,3)+'; approximate 95% interval ['+comparison.joint.intervals.difference.map(x=>fmt(x,3)).join(', ')+'].':'Select a compiled-run size to inspect the common-amplitude hypothesis.';
  const inc=comparison?.increments.find(x=>Math.abs(x.relative-1/16)<1e-8);
  $('bulk-check').textContent=inc?'At separation n/16: increment excess kurtosis '+fmt(inc.excess,3)+'; adjacent-increment correlation '+fmt(inc.adjacentCorrelation,3)+'. Increment R̂ = '+fmt(inc.rhat,3)+'; ESS ≈ '+fmt(inc.effectiveSamples,0)+'. Unconditioned fBm with H = ¼ predicts correlation −0.293. Boundary and finite-size effects apply.'+(inc.effectiveSamples<400?' This increment has limited effective samples; its covariance estimate is particularly uncertain.':''):'';
  drawProfile();drawDistribution(values,m);drawQQ(values,m);drawScaling();drawChains(r);drawIncrements(r);drawKurtosisTrend();
}
function exportData() {
  const data=experiment||{config:activeConfig,settings:activeSettings,results,partial:true};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='real-sos-gaussianity.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
for(const id of ['alpha','beta','radius'])$(id).oninput=()=>{$(id+'-value').value=Number($(id).value).toFixed(2);};
$('budget').onchange=()=>{$('burn').value={quick:3000,standard:8000,long:30000}[$('budget').value];$('thin').value=$('budget').value==='long'?10:5;};
$('run').onclick=start;$('stop').onclick=()=>{finish();$('progress-text').textContent='Stopped. Completed sizes remain available.';render();};$('export').onclick=exportData;$('observable').onchange=render;
$('fit-overlay').onchange=render;
new ResizeObserver(()=>render()).observe(document.querySelector('.main-column'));
if(window.SAVED_REAL_EXPERIMENT){
  experiment=window.SAVED_REAL_EXPERIMENT;results=experiment.results;activeConfig=experiment.config;activeSettings=experiment.settings;selectedN=results.at(-1).N;
  window.realExperiment=experiment;$('status').textContent='Saved run';$('progress').style.width='100%';$('export').disabled=false;
  $('progress-text').textContent=activeSettings.mixedBudgets?'Loaded '+results.length+' box sizes · budgets vary by size; recorded counts appear below · q = '+activeConfig.q+' · α = '+activeConfig.alpha+' · β = '+activeConfig.beta+'. Browser controls start a new run.':'Loaded a completed run: '+activeSettings.samples.toLocaleString()+' samples × 3 chains per box · q = '+activeConfig.q+' · α = '+activeConfig.alpha+' · β = '+activeConfig.beta+'. Run again to use the controls.';
  setFormula(activeConfig);render();
}else start();
window.addEventListener('beforeunload',()=>worker?.terminate());
