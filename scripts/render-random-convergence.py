#!/usr/bin/env python3
"""Bake checked chronological states of the random Abelian sandpile.

Run: python scripts/render-random-convergence.py
Requires numpy, Pillow and a C compiler. The law and disk are Figure 1 of
arXiv:1909.07849; x/R and u/R² are the rescalings in Theorem 1.1.
Each RGB data pixel encodes current height, odometer low byte, high byte.
States are whole legal checkerboard sweeps, sampled logarithmically in time.
No final-height reveal or spatial filtering is used by the evolution player.
"""
from pathlib import Path
import json, math, os, struct, subprocess
import numpy as np
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent.parent
WORK = Path(os.environ.get('RANDOM_CONVERGENCE_WORK', '/tmp/random-convergence'))
OUT = ROOT / 'gallery' / 'plates'
RADII = [12, 24, 48, 96, 192]
SEEDS = [777, 927]
COLORS = np.array([[21,19,26], [82,68,105], [186,92,116], [166,218,230], [249,216,119]],dtype=np.uint8)
RAMP = np.array([[21,19,26],[42,43,77],[82,78,145],[174,91,144],[244,167,130],[255,232,179]],dtype=float)
def ramp(q):
    t=np.clip(q,0,1)*(len(RAMP)-1); lo=np.minimum(np.floor(t).astype(int),len(RAMP)-2); f=t-lo
    return np.uint8(np.round(RAMP[lo]*(1-f[...,None])+RAMP[lo+1]*f[...,None]))

def read_run(radius, seed):
    tag=f'r{radius}s{seed}'; raw=WORK/f'{tag}.raw'; meta=WORK/f'{tag}.json'
    if not raw.exists() or not meta.exists():
        subprocess.run([str(WORK/'sim'),str(radius),str(seed),str(raw),str(meta)],check=True)
    info=json.loads(meta.read_text()); n=info['size']; block=n*n*3+4
    b=raw.read_bytes(); assert len(b)==4+info['frames']*block
    states=[]; initial=None; prev=None
    for j in range(info['frames']):
        at=4+j*block; sweep=struct.unpack_from('<I',b,at)[0]
        a=np.frombuffer(b,dtype=np.uint8,count=n*n*3,offset=at+4).reshape(n,n,3).copy()
        h=a[:,:,0].astype(np.int32); u=a[:,:,1].astype(np.int32)+256*a[:,:,2].astype(np.int32)
        if initial is None: initial=h.copy()
        assert int(h.sum())==info['mass'], (tag,sweep,'mass')
        lap=np.roll(u,1,0)+np.roll(u,-1,0)+np.roll(u,1,1)+np.roll(u,-1,1)-4*u
        assert np.array_equal(h, initial+lap),(tag,sweep,'odometer equation')
        assert not np.any(h[[0,-1],:]) and not np.any(h[:,[0,-1]])
        if prev is not None: assert np.all(u>=prev)
        prev=u
        states.append((sweep,a))
    assert np.max(states[-1][1][:,:,0])<4
    c=n//2; half=math.ceil(radius*1.52); side=2*half+1
    assert not np.any(h[:c-half]) and not np.any(h[c+half+1:])
    assert not np.any(h[:,:c-half]) and not np.any(h[:,c+half+1:])
    # Keep at most 64 honest stored states, with the initial and final included.
    keep=np.unique(np.round(np.linspace(0,len(states)-1,min(64,len(states)))).astype(int))
    columns=8; rows=math.ceil(len(keep)/columns)
    atlas=Image.new('RGB',(columns*side,rows*side)); sweeps=[]; active=[]; topplings=[]
    for k,j in enumerate(keep):
        sweep,a=states[j]; tile=a[c-half:c+half+1,c-half:c+half+1]
        atlas.paste(Image.fromarray(tile),(k%columns*side,k//columns*side)); sweeps.append(sweep)
        active.append(int(np.sum(a[:,:,0]>=4))); topplings.append(int((a[:,:,1].astype(np.uint32)+256*a[:,:,2].astype(np.uint32)).sum()))
    name=f'random-convergence-r{radius}-{seed}.png'
    atlas.save(OUT/name,optimize=True)
    info.update({'file':name,'size':side,'extent':half/radius,'columns':columns,'frames':len(keep),'sweeps':sweeps,'unstable':active,'topplings':topplings})
    xx=np.linspace(-1.52,1.52,193); axis=(np.arange(n)-c)/radius
    info['profile']=[round(float(z),6) for z in np.interp(xx,axis,u[c]/radius**2)]
    info['peakScaled']=round(info['maxOdometer']/radius**2,6)
    final=states[-1][1][c-half:c+half+1,c-half:c+half+1]
    return info,final

def main():
    WORK.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True)
    subprocess.run(['cc','-O3','-Wall','-Wextra','-Werror',str(ROOT/'scripts/random-convergence.c'),'-lm','-o',str(WORK/'sim')],check=True)
    meta={'model':'Independent heights 3 or 5, probability 1/2 each, inside |x| < R; zero outside.', 'source':'https://arxiv.org/html/1909.07849v2#S1','schedule':'Each sweep batch-topples even sites, then odd sites. Stored states use logarithmically spaced sweep counts.', 'rescaling':'x/R and odometer/R^2; the height field is not smoothed.', 'radii':RADII,'seeds':SEEDS,'odometerScale':0.65,'displayExtent':1.6,'runs':[]}
    for seed in SEEDS:
        finals=[]
        for radius in RADII:
            info,final=read_run(radius,seed);meta['runs'].append(info);finals.append(final)
            print(info['file'],(OUT/info['file']).stat().st_size,flush=True)
        # A small direct-encoded atlas keeps the scale comparison light to load.
        tile=385; sheet=Image.new('RGB',(tile*len(RADII),tile))
        for i,a in enumerate(finals):
            # The five tiles share exactly [-1.6,1.6]^2 in x/R. Resizing each
            # integer crop independently would introduce a radius-dependent zoom.
            radius=RADII[i]; half=a.shape[0]//2
            z=np.rint(((np.arange(tile)+.5)/tile*3.2-1.6)*radius).astype(int)+half
            valid=(z>=0)&(z<a.shape[0]); clamped=np.clip(z,0,a.shape[0]-1)
            normalized=a[clamped[:,None],clamped[None,:]].copy()
            normalized[~valid,:]=0; normalized[:,~valid]=0
            sheet.paste(Image.fromarray(normalized),(i*tile,0))
        sheet.save(OUT/f'random-convergence-scales-{seed}.png',optimize=True)
        if seed==SEEDS[0]:
            a=finals[-1]; h=a[:,:,0]; u=a[:,:,1].astype(float)+256*a[:,:,2].astype(float)
            grain=Image.fromarray(COLORS[np.minimum(h,4)])
            odo=Image.fromarray(ramp(u/RADII[-1]**2/meta['odometerScale']))
            # Shared art for the wall and no-motion preview: actual final state.
            Image.fromarray(COLORS[np.minimum(h,4)]).save(OUT/'random-convergence-hero.png',optimize=True)
            for variant,bg in [('void',(21,19,26)),('paper',(242,237,226))]:
                wall=Image.new('RGB',(1200,640),bg);d=ImageDraw.Draw(wall)
                for x,im in [(20,grain),(620,odo)]:
                    if variant=='paper':
                        ar=np.array(im); untouched=(h==0)&(u==0); ar[untouched]=bg; im=Image.fromarray(ar)
                    wall.paste(im.resize((560,560),Image.Resampling.NEAREST),(x,36))
                wall.save(OUT/f'random-convergence-wall-{variant}.png',optimize=True)
    (OUT/'random-convergence.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
if __name__=='__main__':main()
