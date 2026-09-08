/* Reproducible Figure 1 model for arXiv:1909.07849.
   Each site in |x| < R starts at 3 or 5 (one fixed i.i.d. field per seed).
   An even/odd checkerboard sweep performs all legal batch topplings of one
   parity, then the other. No sand is added during stabilization. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <inttypes.h>
#include <math.h>
static uint64_t mix(uint64_t z) { z+=UINT64_C(0x9e3779b97f4a7c15); z=(z^(z>>30))*UINT64_C(0xbf58476d1ce4e5b9); z=(z^(z>>27))*UINT64_C(0x94d049bb133111eb); return z^(z>>31); }
static void frame(FILE *out, int N, int round, int *h, uint32_t *u) {
    fwrite(&round,4,1,out);
    for(int i=0;i<N*N;i++){ unsigned char p[3]={(unsigned char)h[i],(unsigned char)u[i],(unsigned char)(u[i]>>8)}; fwrite(p,3,1,out); }
}
int main(int argc,char **argv){
    if(argc!=5) return 2;
    int R=atoi(argv[1]), seed=atoi(argv[2]), N=4*R+1, c=N/2;
    int *h=calloc((size_t)N*N,sizeof(int)); uint32_t *u=calloc((size_t)N*N,sizeof(uint32_t));
    FILE *out=fopen(argv[3],"wb"),*meta=fopen(argv[4],"w"); if(!h||!u||!out||!meta)return 3;
    uint64_t mass=0, fired=0; int frames=1,last=0; double next=1;
    for(int y=-R;y<=R;y++)for(int x=-R;x<=R;x++)if(x*x+y*y<R*R){uint64_t key=((uint64_t)(uint32_t)y<<32)^(uint32_t)x; int v=(mix((uint64_t)seed^mix(key))&1)?5:3;h[(y+c)*N+x+c]=v;mass+=v;}
    fwrite(&N,4,1,out);frame(out,N,0,h,u);
    int round=0; for(round=1;round<1000000;round++){
        uint64_t active=0;
        for(int parity=0;parity<2;parity++)for(int y=1;y<N-1;y++)for(int x=1+((y+1+parity)&1);x<N-1;x+=2){int i=y*N+x,q=h[i]/4;if(!q)continue;h[i]-=4*q;h[i-1]+=q;h[i+1]+=q;h[i-N]+=q;h[i+N]+=q;u[i]+=q;active+=q;}
        fired+=active;
        if(round>=(int)ceil(next)||!active){frame(out,N,round,h,u);frames++;last=round;next=fmax(next+1,next*1.105);}
        if(!active)break;
    }
    uint64_t check=0,usum=0;int max=0,touched=0,edge=0;
    for(int y=0;y<N;y++)for(int x=0;x<N;x++){int i=y*N+x;check+=h[i];usum+=u[i];if(h[i]>=4)return 4;if(u[i]>(uint32_t)max)max=(int)u[i];if(u[i])touched++;if((!x||!y||x==N-1||y==N-1)&&(h[i]||u[i]))edge++;}
    if(check!=mass||usum!=fired||edge||max>65535){fprintf(stderr,"verification failed\n");return 5;}
    fprintf(meta,"{\"radius\":%d,\"seed\":%d,\"size\":%d,\"frames\":%d,\"sweeps\":%d,\"mass\":%"PRIu64",\"topplings\":%"PRIu64",\"maxOdometer\":%d,\"toppledSites\":%d,\"edgeUntouched\":true,\"massConserved\":true}\n",R,seed,N,frames,last,mass,fired,max,touched);
    fprintf(stderr,"R%d seed%d: %d sweeps, %d frames, mass %"PRIu64", maxU %d\n",R,seed,round,frames,mass,max);
    fclose(out);fclose(meta);free(h);free(u);return 0;
}
