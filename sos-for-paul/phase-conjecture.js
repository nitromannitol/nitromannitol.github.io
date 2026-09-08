(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.SOSConjecture=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function prediction(q,alpha){
    if(!(q>0&&q<=2&&alpha>1))throw new RangeError('Conjecture scope: 0 < q ≤ 2 and α > 1.');
    const critical=2+q/2,tol=1e-9;
    let power,logPower=0,law,title,description;
    if(alpha<2-tol){
      power=(alpha-2)/2;law='fractional-gaussian';title='Gaussian generalized field';
      description='A multiple of the Dirichlet fractional Gaussian field Gα. This describes smooth averages; single-site fluctuations need not shrink.';
    }else if(Math.abs(alpha-2)<tol){
      power=0;logPower=1/q-.5;law='log-gaussian';title='Log-correlated Gaussian field';
      description='A multiple of G₂, interpreted as a random distribution. The proposed logarithm here is for smooth averages, not the point-height RMS.';
    }else if(alpha<critical-tol){
      power=(alpha-2)/q;law=q===2?'fractional-gaussian':'non-gaussian';
      title=q===2?'Dirichlet fractional Gaussian field':'Non-Gaussian continuum Gibbs field';
      description=q===2?'Gα has covariance (4Lα)⁻¹ and amplitude exponent H = (α−2)/2.': 'The constructive candidate Q(q,α) is defined by the Brownian cutoff prescription below. Its existence and agreement with the lattice limit are conjectural.';
    }else if(Math.abs(alpha-critical)<tol){
      power=.5;logPower=-1/q;law='brownian-critical';title='Brownian bridge, with a logarithm';
      description=q===2?'The limit is ½ B on (−1,1), for the ordered-pair energy convention used here.':'The proposed limit is σ(q) B on (−1,1). The positive amplitude σ(q) is not fitted or identified by the current experiments.';
    }else{
      power=.5;law='brownian';title='Brownian bridge';
      description=q===2?'The limit is [4 ζ(α−2)]⁻½ B on (−1,1).':'The proposed limit is σ(q,α) B on (−1,1), with deterministic positive amplitude. The parameter sweep tests finite-size scaling and joint moments in this regime.';
    }
    const measured=Math.abs(q-1)<tol&&Math.abs(alpha-2.25)<tol;
    const sweep=(globalThis.PARAMETER_SWEEP_STATUS||[]).find(p=>Math.abs(p.q-q)<tol&&Math.abs(p.alpha-alpha)<tol);
    const status=q===2?'Quadratic case: Gaussian already at finite n; exact covariance comparisons are in the parameter sweep.':measured?'Measured through n = 2048 in the original study, with an independent sweep replication. The data favor H = ¼ and non-Gaussianity; they do not identify the cutoff law.':sweep?'Simulated through n = '+sweep.N+' in the parameter sweep. See the measured exponents, kurtosis intervals and mixing diagnostics; the limiting law remains conjectural.':'No saved run at this exact parameter pair. Interpolation of the phase diagram remains a conjecture.';
    return {q,alpha,critical,power,logPower,law,title,description,status,measured};
  }
  const num=x=>Math.abs(x-Math.round(x))<1e-9?String(Math.round(x)):x.toFixed(3).replace(/0+$/,'').replace(/\.$/,'');
  function amplitude(p){
    const factors=[];
    if(p.power)factors.push('n<sup>'+num(p.power)+'</sup>');
    if(p.logPower)factors.push('(log n)<sup>'+num(p.logPower)+'</sup>');
    return factors.join(' ')||'1';
  }
  function mount(){
    const $=id=>document.getElementById(id);
    if(!$('phase-diagram'))return;
    let current;
    function draw(){
      const el=$('phase-diagram'),bounds=el.getBoundingClientRect(),w=bounds.width,h=bounds.height,dpr=Math.min(2,window.devicePixelRatio||1);
      el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);
      const ctx=el.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
      const l=38,r=w-20,t=16,b=h-30,x=q=>l+(q-.25)/1.75*(r-l),y=a=>b-(a-1.2)/2.8*(b-t);
      ctx.fillStyle='#edf1e8';ctx.fillRect(l,t,r-l,b-t);
      ctx.fillStyle='#e5ecf5';ctx.fillRect(l,y(2),r-l,b-y(2));
      ctx.beginPath();ctx.moveTo(x(.25),y(2));ctx.lineTo(x(2),y(2));ctx.lineTo(x(2),y(3));ctx.lineTo(x(.25),y(2.125));ctx.closePath();ctx.fillStyle='#c8dfd0';ctx.fill();
      ctx.font='10px -apple-system,sans-serif';ctx.lineWidth=1;
      for(const q of [.25,.5,1,1.5,2]){ctx.beginPath();ctx.strokeStyle='#dce2da';ctx.moveTo(x(q),t);ctx.lineTo(x(q),b);ctx.stroke();ctx.fillStyle='#71807a';ctx.textAlign='center';ctx.fillText(num(q),x(q),b+17);}
      for(const a of [1.5,2,2.5,3,3.5,4]){ctx.beginPath();ctx.strokeStyle='#dce2da';ctx.moveTo(l,y(a));ctx.lineTo(r,y(a));ctx.stroke();ctx.fillStyle='#71807a';ctx.textAlign='right';ctx.fillText(num(a),l-7,y(a)+3);}
      ctx.beginPath();ctx.moveTo(x(.25),y(2.125));ctx.lineTo(x(2),y(3));ctx.strokeStyle='#ca7643';ctx.lineWidth=2;ctx.stroke();
      ctx.beginPath();ctx.moveTo(x(2),t);ctx.lineTo(x(2),b);ctx.strokeStyle='#7388a6';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#4e685d';ctx.textAlign='center';ctx.fillText('Brownian bridge',x(1.1),y(3.5));ctx.fillText('Non-Gaussian candidate',x(1.25),y(2.22));ctx.fillText('Gaussian generalized field',x(1.1),y(1.55));
      ctx.textAlign='left';ctx.fillStyle='#a15e35';ctx.fillText('αc = 2 + q/2',x(.34),y(2.75));ctx.fillStyle='#71807a';ctx.fillText('α',8,15);ctx.textAlign='right';ctx.fillText('q',r,b+28);
      for(const p of window.PARAMETER_SWEEP_STATUS||[{q:1,alpha:2.25}]){ctx.beginPath();ctx.arc(x(p.q),y(p.alpha),3,0,2*Math.PI);ctx.fillStyle='#203b3a';ctx.fill();}
      ctx.beginPath();ctx.arc(x(current.q),y(current.alpha),7,0,2*Math.PI);ctx.strokeStyle='#b56532';ctx.lineWidth=2.5;ctx.stroke();
    }
    function render(){
      current=prediction(Number($('phase-q').value),Number($('phase-alpha').value));
      $('phase-q-value').value=num(current.q);$('phase-alpha-value').value=current.alpha.toFixed(2);
      $('phase-critical').textContent='αc = '+num(current.critical);
      $('phase-law').textContent=current.title;$('phase-amplitude').innerHTML='a<sub>n</sub> = '+amplitude(current);
      $('phase-description').textContent=current.description;$('phase-evidence').textContent=current.status;
      $('phase-pairing').innerHTML='β<sup>'+num(1/current.q)+'</sup> n<sup>−'+num(1+current.power)+'</sup>'+(current.logPower?' (log n)<sup>'+num(-current.logPower)+'</sup>':'')+' Σ f(i/n) φ(i)';
      draw();
    }
    for(const id of ['phase-q','phase-alpha'])$(id).addEventListener('input',render);
    for(const button of document.querySelectorAll('[data-phase-preset]'))button.onclick=()=>{const [q,a]=button.dataset.phasePreset.split(',');$('phase-q').value=q;$('phase-alpha').value=a;render();};
    $('phase-diagram').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect();const q=.25+(e.clientX-rect.left-38)/(rect.width-58)*1.75,a=1.2+(rect.height-30-(e.clientY-rect.top))/(rect.height-46)*2.8;$('phase-q').value=Math.max(.25,Math.min(2,Math.round(q*20)/20));$('phase-alpha').value=Math.max(1.2,Math.min(4,Math.round(a*100)/100));render();};
    const saved=window.SAVED_REAL_EXPERIMENT;
    if(saved?.results?.length){
      const total=saved.results.reduce((s,r)=>s+r.f.count,0),largest=saved.results.at(-1).N;
      $('generated-count').textContent=total.toLocaleString()+' recorded configurations · n ≤ '+largest;
      $('generated-scope').textContent='Saved real-valued q = '+saved.config.q+', α = '+saved.config.alpha+', β = '+saved.config.beta+' data: '+saved.results.length+' sizes, three separately seeded chains per size. Recordings within each chain are correlated.';
      $('generated-table').innerHTML=saved.results.slice(-3).map(r=>'<tr><td>'+r.N+'</td><td>'+r.f.count.toLocaleString()+'</td><td>'+r.candidate.variance.toFixed(5)+'</td><td>'+r.f.excess.toFixed(3)+'</td><td>['+r.kurtosisInterval.map(x=>x.toFixed(3)).join(', ')+']</td></tr>').join('');
    }
    render();new ResizeObserver(draw).observe($('phase-diagram').parentElement);
  }
  return {prediction,amplitude,mount};
});
