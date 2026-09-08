#!/usr/bin/env node
/* Rebuild both gallery covers from the same legal walk shown in the study. */
import fs from 'node:fs';
import vm from 'node:vm';
const model = vm.createContext({}); vm.runInContext(fs.readFileSync(new URL('../gallery/manhattan.js', import.meta.url),'utf8'), model);
const run = model.ManhattanGallery.generate({steps:1400});
const W=900,H=600,n=run.steps,pad=42,cell=Math.min((W-pad*2)/(run.xMax[n]-run.xMin[n]),(H-pad*2)/(run.yMax[n]-run.yMin[n]));
const cx=(run.xMax[n]+run.xMin[n])/2,cy=(run.yMax[n]+run.yMin[n])/2,sx=x=>W/2+(x-cx)*cell,sy=y=>H/2-(y-cy)*cell;
const num = n => n.toFixed(2);
for (const dark of [false,true]) {
 const bg=dark?'#15131a':'#f2ede2',grid=dark?'#494452':'#a59d99';
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="A 1,400-step random walk on independently oriented Manhattan streets, coloured from blue to rose"><rect width="${W}" height="${H}" fill="${bg}"/><g stroke="${grid}" opacity=".17" stroke-width=".7">`;
 for(let x=Math.floor(cx-W/2/cell);x<cx+W/2/cell;x++) svg+=`<path d="M${num(sx(x))} 0V${H}"/>`;
 for(let y=Math.floor(cy-H/2/cell);y<cy+H/2/cell;y++) svg+=`<path d="M0 ${num(sy(y))}H${W}"/>`;
 svg+='</g><g fill="none" stroke-linejoin="round" stroke-linecap="round">';
 for(let start=1;start<=n;start+=35){
  const end=Math.min(n,start+34),age=end/n;
  const rgb=dark?[Math.round(93+125*age),Math.round(166-25*age),Math.round(186-21*age)]:[Math.round(45+111*age),Math.round(119-54*age),Math.round(141-57*age)];
  let d=`M${num(sx(run.x[start-1]))} ${num(sy(run.y[start-1]))}`;
  for(let i=start;i<=end;i++) d+=`L${num(sx(run.x[i]))} ${num(sy(run.y[i]))}`;
  svg+=`<path d="${d}" stroke="rgb(${rgb.join(',')})" stroke-width="2.2"/>`;
 }
 svg+=`</g><circle cx="${num(sx(0))}" cy="${num(sy(0))}" r="5" fill="${bg}" stroke="${dark?'#f2ede2':'#15131a'}" stroke-width="2"/><circle cx="${num(sx(run.x[n]))}" cy="${num(sy(run.y[n]))}" r="5.5" fill="${dark?'#f3c577':'#b06928'}"/></svg>\n`;
 fs.writeFileSync(new URL(`../gallery/plates/p-manhattan-wall-${dark?'void':'paper'}.svg`, import.meta.url),svg);
}
