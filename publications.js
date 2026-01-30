
const publications = [
{
  id: "algebraic-sd",
  title: "Superdiffusion and anomalous regularization in self-similar random incompressible flows",
  thumbnail: "images/algebraic-sd.png",
  authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Scott Armstrong", url: "https://www.scottnarmstrong.com" },
      { name: "Tuomo Kuusi", url: "https://sites.google.com/site/tuomokuusimath/home" }
    ],
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2601.22142" },
      { type: "Blog", url: "https://www.scottnarmstrong.com/2026/01/superdiffusivity-anomalous-regularization/" }
    ],
abstract: 'A Brownian particle advected by an incompressible random drift undergoes enhanced diffusion. When the drift has long-range correlations—specifically, when the stream matrix has positive Hurst exponent γ > 0—physicists <a href="references/sdphys1.pdf">predicted</a> <a href="references/sdphys2.pdf">since</a> <a href="references/sdphys3.pdf">the</a> <a href="references/sdphys4.pdf">1980s</a> that the particle should be superdiffusive, with mean squared displacement growing like t<sup>2/(2-γ)</sup>. We prove this prediction in the perturbative regime γ ≪ 1. In <a href="https://arxiv.org/abs/2404.01115">previous work</a>, we treated the critical case γ = 0 and proved convergence to Brownian motion under superdiffusive scaling; here the power-law growth is too fast for Gaussian behavior, and we show the particle has tails inconsistent with any Brownian limit. We also prove anomalous regularization: solutions of the associated elliptic equation are Hölder continuous with exponent 1 - Cγ<sup>1/2</sup>, uniformly in the molecular diffusivity. See this <a href="https://www.scottnarmstrong.com/2026/01/superdiffusivity-anomalous-regularization/">blog post</a> for more.', 
  year: 2026
 },
  {
    id: "random-walk-sphere-packings",
    title: "Random walk on sphere packings and Delaunay triangulations in arbitrary dimension",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Ewain Gwynne", url: "https://math.uchicago.edu/~ewain/" }
    ],
    journal: "Proceedings of the London Mathematical Society", 
    status: "to appear",
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2405.11673" }
    ],
abstract: 'Random walks on graphs approximating Euclidean space are known to converge to Brownian motion. We introduce a family of graphs, orthogonal tiling graphs, flexible enough to approximate irregular manifolds in arbitrary dimension, for which we prove that the trace of random walk converges to the trace of Brownian motion. This family includes Voronoi tessellations of Gaussian multiplicative chaos in arbitrary dimension, and so our result implies a higher-dimensional generalization of <a href="https://www.intlpress.com/site/pub/pages/journals/items/acta/content/vols/0228/0002/a002/index.php">Gwynne, Miller, and Sheffield (2022)</a>. Our proof proceeds by showing convergence of a finite volume scheme that induces a non-uniformly elliptic operator on the graph. One of our main contributions is an L<sup>2</sup>-L<sup>∞</sup> estimate for this operator. In the special case of 2D, our method also leads to a short proof of <a href="https://www.sciencedirect.com/science/article/abs/pii/S0001870820304072">Gurel-Gurevich, Jerison, and Nachmias (2020)</a>, which in turn generalized earlier work by <a href="references/dubjeko1999.pdf">Dubejko (1999)</a>, <a href="https://www.sciencedirect.com/science/article/pii/S0001870811002143">Chelkak-Smirnov (2011)</a>, <a href="https://www.sciencedirect.com/science/article/pii/S0001870813000637">Skopenkov (2013)</a>, and <a href="https://arxiv.org/abs/1511.01209">Werness (2015)</a>. Orthogonal tiling graphs in 2D include isoradial graphs, which were used by <a href="https://link.springer.com/article/10.1007/s00222-011-0371-2">Chelkak and Smirnov (2012)</a> to establish the universality of critical Ising models. We believe orthogonal tiling graphs could help in studying this model and others in d > 2.',
    thumbnail: "images/rw_sphere_packing.png",
    year: 2024
  },
  {
    id: "superdiffusive-clt-brownian-particle",
    title: "Superdiffusive central limit theorem for a Brownian particle in a critically-correlated incompressible random drift",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Scott Armstrong", url: "https://www.scottnarmstrong.com" },
      { name: "Tuomo Kuusi", url: "https://sites.google.com/site/tuomokuusimath/home" }
    ],
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2404.01115" },
      { type: "Quanta", url: "https://www.quantamagazine.org/new-superdiffusion-proof-probes-the-mysterious-math-of-turbulence-20250516/" },
      { type: "Blog", url: "https://www.scottnarmstrong.com/2024/04/superdiffusive-CLT/" }

    ],
abstract: 'A Brownian particle advected by an incompressible vector field undergoes enhanced diffusion. The extent of this enhancement depends on the correlation structure of the field. Above a critical correlation threshold, the particle is superdiffusive, with mean squared displacement scaling algebraically in time (t<sup>α</sup>, α > 1). Below the threshold, diffusion is enhanced, but the particle retains the usual diffusive scaling (α = 1). In this paper, we consider the critical case and show that under the superdiffusive scaling of (√log(t)·t), in the long-time limit, the particle converges, in a quenched sense, to ordinary Brownian motion. This problem has been considered heuristically by physicists <a href="references/sdphys1.pdf">since</a> <a href="references/sdphys2.pdf">at</a> <a href="references/sdphys3.pdf">least</a> <a href="references/sdphys4.pdf">1983</a>, where the (√log(t)·t) rate was predicted using heuristic renormalization group arguments. Our proof makes these renormalization group arguments rigorous using ideas from stochastic homogenization. To the best of our knowledge, this is the first critical, infinite-scale, random model that has been shown to homogenize. We hope to apply these ideas to other critical models with an infinite number of length scales. See this <a href="https://www.scottnarmstrong.com/2024/04/superdiffusive-clt/">blog post</a> and <a href="https://www.quantamagazine.org/new-superdiffusion-proof-probes-the-mysterious-math-of-turbulence-20250516/"> Quanta article </a> for more.',
    thumbnail: "images/sd.png",
    year: 2024
  },
  {
    id: "unique-continuation-planar-graphs",
    title: "Unique continuation on planar graphs",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Bill Cooperman", url: "https://cprmn.org/" },
      { name: "Shirshendu Ganguly", url: "https://www.stat.berkeley.edu/~sganguly/" }
    ],
  journal: "Discrete Analysis", 
  status: "to appear",
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2309.13728" }
    ],
    abstract: 'Bounded harmonic functions are constant. However, there are non-constant harmonic functions on R<sup>d</sup> that are bounded on all but a tiny fraction of space (see, <a href="https://link.springer.com/book/10.1007/978-3-642-61983-0">[Ch 3, Problems 158-160]</a>). These functions have no immediate discrete analogue, and, it turns out, cannot exist on periodic planar graphs. We prove that for any periodic planar graph G, there exists a constant &alpha;(G) such that any discrete harmonic function which is bounded on a (1 - &alpha;(G))-density of the graph is constant. A key aspect of the argument is a new unique continuation result for periodic planar graphs. Our proof is based on the maximum principle and elementary geometric arguments. It generalizes and simplifies earlier work by <a href="https://projecteuclid.org/journals/duke-mathematical-journal/volume-171/issue-6/A-discrete-harmonic-function-bounded-on-a-large-portion-of/10.1215/00127094-2021-0037.short">Lev Buhovsky, Alexander Logunov, Eugenia Malinnikova, and Mikhail Sodin</a>, who established this result on the square lattice using techniques specific to that setting. The ideas in Buhovsky-Logunov-Malinnikova-Sodin were later applied by <a href="https://link.springer.com/article/10.1007/s00222-019-00910-4">Charles Smart and Jian Ding</a> to establish localization near the edge for the Anderson-Bernoulli model on the square lattice. We are currently exploring the implications of our new proof technique to Anderson localization.',
    thumbnail: "images/unique_continuation.png",
    year: 2025
  },
  {
    id: "rigidity-harmonic-functions",
    title: "Rigidity of harmonic functions on the supercritical percolation cluster",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Bill Cooperman", url: "https://cprmn.org/" },
      { name: "Paul Dario", url: "https://www.math.ens.psl.eu/~dario/index.html" }
    ],
    journal: "Transactions of the American Mathematical Society",
    volume: "378(06)",
    pages: "3823-3896",
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2303.04736" }
    ],
  abstract: 'H. A. Heilbronn <a href="references/heilbronn.pdf">showed</a> in 1949 that the dimension of the space of discrete harmonic polynomials on Z<sup>d</sup> coincides with that of R<sup>d</sup>. This theorem holds for any periodic lattice and was recently extended by <a href="https://arxiv.org/abs/1609.09431">Scott Armstrong and Paul Dario</a> to the supercritical percolation cluster, where their proof used the fact that, on large scales, the cluster resembles R<sup>d</sup>. However, in models such as the <a href="https://arxiv.org/abs/1109.0449?context=math">Ising model</a>, the <a href="https://arxiv.org/abs/1012.4809">Abelian sandpile</a>, and <a href="https://arxiv.org/abs/1508.04284">Anderson localization</a>, small-scale changes in the graph induce qualitatively distinct global behavior. Motivated by this, we prove three theorems on the supercritical cluster that do not hold on Z<sup>d</sup>. Using quantitative homogenization, we show the absence of Lipschitz harmonic functions, the absence of integer-valued harmonic functions with polynomial growth, and, in dimension 2, the absence of functions with integer-valued graph Laplacians decaying faster than 1/|x| at infinity. We expect these results and our techniques will help in understanding other models on the cluster. (The final section includes many conjectures and partial results regarding the Abelian sandpile on the cluster.)',
    thumbnail: "images/lipschitz-percolation-harmonic.png",
    year: 2025
  },
  {
    id: "internal-dla-mated-crt-maps",
    title: "Internal DLA on mated-CRT maps",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Ewain Gwynne", url: "https://math.uchicago.edu/~ewain/" }
    ],
    journal: "Annals of Probability",
    volume: "52(6)",
    pages: "2173-2237",
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2211.04891" }
    ],
    abstract: 'We prove the convergence of internal diffusion limited aggregation on a family of random planar maps, mated-CRT maps, to the LQG harmonic balls constructed in <a href="https://arxiv.org/abs/2208.11795">our previous work</a>. The proof combines an idea of <a href="https://arxiv.org/abs/1111.0486">Hugo Duminil-Copin, Cyrille Lucas, Ariel Yadin, and Amir Yehudayoff</a> together with inputs from LQG theory. Mated-CRT maps are currently the only random planar maps for which the <a href="https://arxiv.org/abs/2003.10320">convergence of random walk to Liouville Brownian motion</a> has been established, and this fact plays a crucial role in our proof. It would be particularly interesting to determine the law governing the fluctuations around the limit shape.',
    thumbnail: "images/idla_matedcrt.png",
    year: 2024
  },
  {
    id: "harmonic-balls-liouville-quantum-gravity",
    title: "Harmonic balls in Liouville quantum gravity",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Ewain Gwynne", url: "https://math.uchicago.edu/~ewain/" }
    ],
      journal: "Proceedings of the London Mathematical Society", 
      volume: "130",
      pages: "e70018",
      year: 2025,
    links: [
      { type: "arXiv", url: "https://arxiv.org/abs/2208.11795" }
    ],
    abstract: 'We prove the well-posedness of Hele-Shaw flow on Liouville Quantum Gravity (LQG) surfaces and then use this to construct LQG harmonic balls, domains that satisfy the mean value property on LQG surfaces. LQG harmonic balls are the conjectured scaling limit of internal diffusion-limited aggregation on random planar maps, and our results show that they are a novel mathematical object: they are not <a href = "https://arxiv.org/abs/2109.01252">LQG metric balls</a> and exhibit significant irregularity: we prove they are not Lipschitz domains, and the argument indicates they are not even <a href="references/Jerison-DirichletProblemNonSmooth-1981.pdf">non-tangentially accessible</a>. There are many interesting properties of LQG harmonic balls to explore, such as their Hausdorff dimension and the structure of their induced geodesics.',
    thumbnail: "images/harmonic_ball.png",
  },
  {
    id: "integer-superharmonic-matrices",
    title: "Integer superharmonic matrices on the F-lattice",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" }
    ],
    journal: "Advances in Mathematics",
    volume: "436",
    pages: "109400",
    year: 2024,
    links: [
      { type: "Journal", url: "https://doi.org/10.1016/j.aim.2023.109400" },
      { type: "arXiv", url: "http://arxiv.org/abs/2110.07556" },
      { type: "Appendix", url: "manuscripts/appendix.pdf" },
      { type: "Code", url: "https://github.com/nitromannitol/f-lattice-recursion" }
    ],
abstract: 'The scaling limit of the Abelian sandpile is a fully nonlinear elliptic PDE with a delicate lattice dependence. This dependence is expressed through the quadratic growths of integer-valued, lattice-superharmonic functions (see <a href="https://arxiv.org/pdf/1611.00411">Section 6 of this survey</a> for an exposition). <a href="https://annals.math.princeton.edu/2017/186-1/p01">Lionel Levine, Wesley Pegden, and Charles Smart showed</a> that these functions on Z<sup>2</sup> are characterized by an Apollonian packing of the plane. While their proof was specific to Z<sup>2</sup>, with some effort it can likely be adapted to the triangular, hexagonal, and trihexagonal lattices, where the Apollonian packing is replaced by other circle packings (see these <a href="https://www.math.cmu.edu/~wes/sandgallery.html">simulations by Pegden</a>). However, the F-lattice presents a distinct situation. In this paper, I show that the set of integer superharmonic functions on the F-lattice is governed by a recursion involving rational points on a hyperbola. I conjecture that the objects describing the scaling limits of the Abelian sandpile on general, periodic graphs are <a href="https://arxiv.org/abs/2104.13838">Kleinian bugs</a>.'
,
    thumbnail: "images/flattice.png"
  },
  {
    id: "hamilton-jacobi-scaling-limits",
    title: "Hamilton-Jacobi scaling limits of Pareto peeling in 2D",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" },
      { name: "Peter S. Morfe", url: "https://personal-homepages.mis.mpg.de/morfe/" }
    ],
    journal: "Probability Theory and Related Fields",
    volume: "188",
    pages: "235-307",
    year: 2024,
    links: [
      { type: "Journal", url: "https://doi.org/10.1007/s00440-023-01234-4" },
      { type: "arXiv", url: "https://arxiv.org/abs/2110.06016" },
      { type: "Code", url: "https://github.com/nitromannitol/2d_pareto_peeling" }
    ],
  abstract: 'Pareto peeling is an algorithm for sorting large amounts of multivariate data. For random initial data in 2D, we prove that Pareto peeling converges, in the large sample limit, to the viscosity solution of an explicit Hamilton-Jacobi equation. This resolves a <a href="references/caldernotes.pdf">question posed by Jeff Calder</a> and complements earlier work by <a href="https://arxiv.org/abs/1805.08278">Jeff Calder and Charles Smart</a>. While some of our theorems apply in arbitrary dimension, we now think that for d > 2 the process may not always converge.',
    thumbnail: "images/pareto_peeling.png"
  },
  {
    id: "shape-theorem-exploding-sandpiles",
    title: "A shape theorem for exploding sandpiles",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" }
    ],
    journal: "Annals of Applied Probability",
    volume: "34(1A)",
    pages: "714-742",
    year: 2022,
    links: [
      { type: "Journal", url: "https://doi.org/10.1214/23-AAP1976" },
      { type: "arXiv", url: "https://arxiv.org/abs/2102.04422" },
      { type: "Notebook", url: "notebooks/exploding_sandpiles.html" }
    ],
  abstract: 'Some sandpiles explode: sites topple without stopping. I prove that random, exploding sandpiles have a limit shape. The proof uses ideas from my <a href="https://arxiv.org/abs/2009.05968">dimensional reduction paper</a> to compare the dynamics of an exploding sandpile to a <a href="references/schonmann.pdf">bootstrap percolation</a> process. This project grew out of a question posed by Lionel Levine during <a href="https://math7710.wordpress.com/2020/10/13/october-13-student-research-projects/"> an online topics class he ran during the COVID pandemic.</a>',
    thumbnail: "images/exploding_pile.png"
  },
  {
    id: "dynamic-dimensional-reduction",
    title: "Dynamic dimensional reduction in the Abelian sandpile",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" }
    ],
    journal: "Communications in Mathematical Physics",
    volume: "390",
    pages: "933-958",
    year: 2022,
    links: [
      { type: "Journal", url: "https://doi.org/10.1007/s00220-022-04322-z" },
      { type: "arXiv", url: "https://arxiv.org/abs/2009.05968" },
      { type: "Code", url: "https://github.com/nitromannitol/arbitrarydim_sandpiles" }
    ],
abstract: 'Dimensional reduction in sandpiles, the property that slices of higher-dimensional sandpiles correspond to lower-dimensional ones, has been conjectured since <a href="references/LKG.pdf">at least 1990</a>. I prove an exact version of this conjecture. The key insight is that dimensional reduction is closely tied to a discrete parabolic regularity of the sandpile. The proof demonstrates that the "flow" of sandpile dynamics preserves certain derivative bounds, allowing dimensional reduction to occur.',
    thumbnail: "images/dim_reduction.png"
  },
  {
    id: "convergence-random-abelian-sandpile",
    title: "Convergence of the random Abelian sandpile",
    authors: [
      { name: "Ahmed Bou-Rabee", url: "#" }
    ],
    journal: "Annals of Probability",
    volume: "49(6)",
    pages: "3168-3196",
    year: 2021,
    links: [
      { type: "Journal", url: "http://dx.doi.org/10.1214/21-AOP1528" },
      { type: "arXiv", url: "http://arxiv.org/abs/1909.07849" },
      { type: "Pictures", url: "https://twitter.com/sandpileofthed1" }
    ],
        abstract:"I show that the Abelian sandpile, started with a random initial configuration on any periodic lattice, approximates the solution of a deterministic, fully nonlinear elliptic PDE at large scales. The PDE is implicitly identified through the ergodic theorem, using ideas from non-divergence form stochastic homogenization. Although the exact form of the PDE remains unknown, it is definitively non-universal: it depends on the fine, local structure of both the initial lattice and randomness.",
    thumbnail: "images/random_pile.png"
  }
];

