/* Real-valued q-SOS samplers and smooth-observable diagnostics. */
(function (root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./model.js') : root.SOS;
  const api = factory(core);
  api.workerSource = '(' + factory.toString() + ')(' + core.workerSource + ')';
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RealSOS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (SOS) {
  'use strict';
  const bump = (t, radius = .8, centre = 0) => {
    const x = (t - centre) / radius;
    return Math.abs(x) < 1 ? Math.exp(1 - 1 / (1 - x * x)) : 0;
  };
  function testFunctions(N, radius = .8) {
    const f = [], g = [];
    for (let i = -N; i <= N; i++) {
      const t = N ? i / N : 0;
      f.push(bump(t, radius));
      g.push(3 * t / radius * bump(t, radius));
    }
    return { f, g };
  }
  function normalGenerator(random) {
    let spare = null;
    return () => {
      if (spare !== null) { const x = spare; spare = null; return x; }
      const r = Math.sqrt(-2 * Math.log(1 - random())), theta = 2 * Math.PI * random();
      spare = r * Math.sin(theta); return r * Math.cos(theta);
    };
  }
  function gaussianFactor(chain) {
    const n = chain.n, L = new Float64Array(n * n), diagonal = 2 * SOS.zetaTail(chain.alpha, 1);
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = i === j ? diagonal : -chain.weights[i - j];
      for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
      L[i * n + j] = i === j ? Math.sqrt(s) : s / L[j * n + j];
    }
    return L;
  }
  function gaussianFunctionalVariance(chain, coefficients, factor = gaussianFactor(chain)) {
    const n = chain.n, y = new Float64Array(n);
    let variance = 0;
    for (let i = 0; i < n; i++) {
      let v = coefficients[i];
      for (let j = 0; j < i; j++) v -= factor[i * n + j] * y[j];
      y[i] = v / factor[i * n + i]; variance += y[i] * y[i];
    }
    return variance / (4 * chain.beta);
  }

  class RealChain extends SOS.Chain {
    constructor(config = {}) {
      super({ N: 32, alpha: 2.25, q: 1, beta: 1, ...config });
      this.localScale = 2 * Math.pow(4 * this.beta * SOS.zetaTail(this.alpha, 1), -1 / this.q);
      this.attempted.smooth = 0; this.accepted.smooth = 0;
      const { f, g } = testFunctions(this.N);
      this.directions = [Array(this.n).fill(1), f, g];
      this.directionScales = this.directions.map(d => {
        const e = this.hamiltonian(d);
        return e > 0 ? 3 * Math.pow(this.beta * e, -1 / this.q) : 0;
      });
      this.proposed = new Float64Array(this.n);
      this.kind = 'continuous-metropolis';
    }
    potential(x) { return this.q === 1 ? Math.abs(x) : this.q === 2 ? x * x : Math.pow(Math.abs(x), this.q); }
    proposalStep() {
      // Continuous symmetric proposal, with a fixed mixture of scales.
      return (2 * this.random() - 1) * this.localScale * (this.random() < .9 ? 1 : 8);
    }
    smoothMove() {
      const k = Math.floor(this.random() * this.directions.length);
      const delta = (2 * this.random() - 1) * this.directionScales[k];
      const d = this.directions[k];
      for (let i = 0; i < this.n; i++) this.proposed[i] = this.heights[i] + delta * d[i];
      const energy = this.hamiltonian(this.proposed);
      this.attempted.smooth++;
      if (this.metropolis(energy - this.energy)) {
        this.heights.set(this.proposed); this.energy = energy; this.accepted.smooth++;
      }
    }
    sweep() { super.sweep(); this.smoothMove(); }
  }
  class GaussianChain extends RealChain {
    constructor(config = {}) {
      super({ ...config, q: 2 });
      this.factor = gaussianFactor(this); this.normal = normalGenerator(this.random);
      this.kind = 'independent-exact-gaussian';
    }
    sweep() {
      const n = this.n, L = this.factor, scale = 1 / Math.sqrt(4 * this.beta);
      let norm = 0;
      for (let i = n - 1; i >= 0; i--) {
        const z = this.normal(); norm += z * z;
        let value = scale * z;
        for (let j = i + 1; j < n; j++) value -= L[j * n + i] * this.heights[j];
        this.heights[i] = value / L[i * n + i];
      }
      this.energy = norm / (2 * this.beta); this.sweeps++;
    }
  }
  function createChain(config) { return config.q === 2 ? new GaussianChain(config) : new RealChain(config); }

  function moments(values) {
    const n = values.length;
    if (!n) return { count: 0, mean: 0, variance: 0, second: 0, skewness: null, excess: null };
    let mean = 0, second = 0;
    for (const x of values) { mean += x / n; second += x * x / n; }
    let m2 = 0, m3 = 0, m4 = 0;
    for (const x of values) { const d = x - mean; m2 += d * d / n; m3 += d ** 3 / n; m4 += d ** 4 / n; }
    return { count: n, mean, variance: m2, second, skewness: m2 ? m3 / m2 ** 1.5 : null, excess: m2 ? m4 / (m2 * m2) - 3 : null };
  }
  function effectiveSamples(values) {
    const n = values.length, m = moments(values);
    if (n < 32 || m.variance === 0) return null;
    const maxLag = Math.min(1000, Math.floor(n / 4));
    let tau = -1, previousPair = Infinity;
    for (let lag = 0; lag + 1 < maxLag; lag += 2) {
      let pair = 0;
      for (const l of [lag, lag + 1]) {
        let covariance = 0;
        for (let i = 0; i < n - l; i++) covariance += (values[i] - m.mean) * (values[i + l] - m.mean);
        pair += covariance / (n * m.variance);
      }
      if (pair < 0) break;
      pair = Math.min(previousPair, pair); previousPair = pair; tau += 2 * pair;
    }
    return Math.min(n, n / Math.max(1, tau));
  }
  function splitRhat(chains, squared = false) {
    const length = Math.floor(Math.min(...chains.map(a => a.length)) / 2);
    if (length < 16) return null;
    const parts = [];
    for (const chain of chains) for (const start of [0, chain.length - length]) {
      const values = chain.slice(start, start + length).map(x => squared ? x * x : x);
      parts.push(moments(values));
    }
    const M = parts.length, mean = parts.reduce((s, p) => s + p.mean, 0) / M;
    const W = parts.reduce((s, p) => s + p.variance * length / (length - 1), 0) / M;
    const B = length * parts.reduce((s, p) => s + (p.mean - mean) ** 2, 0) / (M - 1);
    return W > 0 ? Math.sqrt(Math.max(1, (length - 1) / length + B / (length * W))) : null;
  }
  // Acklam's inverse-normal approximation, sufficient for graphical Q-Q diagnostics.
  function normalQuantile(p) {
    const a = [-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924];
    const b = [-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857];
    const c = [-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878];
    const d = [.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];
    if (p <= 0 || p >= 1) return p === 0 ? -Infinity : Infinity;
    let q, r;
    if (p < .02425 || p > .97575) { q = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p))); r = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); return p < .5 ? r : -r; }
    q = p - .5; r = q*q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  function candidateScaling(q, alpha) {
    const tolerance = 1e-9;
    if (alpha < 2 - tolerance) return { H: (alpha - 2) / 2, logPower: 0 };
    if (Math.abs(alpha - 2) < tolerance) return { H: 0, logPower: 1 / q - .5 };
    if (Math.abs(alpha - (2 + q / 2)) < tolerance) return { H: .5, logPower: -1 / q };
    return { H: Math.min((alpha - 2) / q, .5), logPower: 0 };
  }
  function candidateNormalization(N, q, alpha, beta = 1) {
    const { H, logPower } = candidateScaling(q, alpha), exponent = 1 + H;
    const factor = beta ** (1 / q) / (Math.max(1, N) ** exponent * Math.log(Math.max(2, N)) ** logPower);
    return { exponent, logPower, betaPower: 1 / q, factor };
  }
  function summarizeRuns(runs, config, radius = .8) {
    const all = key => runs.flatMap(r => r[key]);
    const fValues = all('f'), gValues = all('g');
    const fStats = moments(fValues), gStats = moments(gValues);
    const userExponent = 2 * config.alpha - 4;
    const candidateH = candidateScaling(config.q, config.alpha).H;
    const candidate = candidateNormalization(config.N, config.q, config.alpha, config.beta);
    candidate.variance = fStats.variance * candidate.factor ** 2;
    candidate.second = fStats.second * candidate.factor ** 2;
    candidate.mean = fStats.mean * candidate.factor;
    const normalize = p => ({ exponent: p, variance: fStats.variance / config.N ** (2 * p), second: fStats.second / config.N ** (2 * p), mean: fStats.mean / config.N ** p });
    const ess = runs.reduce((s, r) => s + (effectiveSamples(r.f) || 0), 0);
    const essSquared = runs.reduce((s, r) => s + (effectiveSamples(r.f.map(v => v*v)) || 0), 0);
    const rhat = splitRhat(runs.map(r => r.f)), rhatSquared = splitRhat(runs.map(r => r.f), true);
    const rg = splitRhat(runs.map(r => r.g));
    const projections = [0, .5, 1, 2, -1].map(c => ({ coefficient: c, ...moments(fValues.map((x, i) => x + c * gValues[i])) }));
    let covariance = 0, mixedFourth = 0;
    for (let i = 0; i < fValues.length; i++) { const x = fValues[i] - fStats.mean, y = gValues[i] - gStats.mean; covariance += x*y/fValues.length; mixedFourth += x*x*y*y/fValues.length; }
    const wickDenominator = fStats.variance * gStats.variance;
    const wickResidual = wickDenominator ? (mixedFourth - wickDenominator - 2 * covariance * covariance) / wickDenominator : null;
    const incrementMoments = runs[0].lags.map((lag, i) => ({ lag, t: lag / config.N, second: runs.reduce((s, r) => s + r.incrementSums[i], 0) / (runs.length * runs[0].f.length), anchor: 0 }));
    const centre = moments(all('centre'));
    // Batch resampling preserves within-batch dependence and respects chain boundaries.
    // Blocks must exceed correlation times; the reported interval remains heuristic.
    const blockLength = Math.min(Math.floor(runs[0].f.length / 8), Math.max(32, Math.ceil(2 * fValues.length / Math.max(1, essSquared))));
    const blocks = [];
    for (const run of runs) for (let i = 0; i + blockLength <= run.f.length; i += blockLength) {
      const sums = [blockLength, 0, 0, 0, 0];
      for (let j = i; j < i + blockLength; j++) { const x = run.f[j]; for (let k = 1; k <= 4; k++) sums[k] += x ** k; }
      blocks.push(sums);
    }
    const bootstrap = [], rng = SOS.randomGenerator(config.seed + config.N + 9821);
    if (blocks.length >= 16) for (let b = 0; b < 240; b++) {
      const sums = [0,0,0,0,0];
      for (let j = 0; j < blocks.length; j++) { const block = blocks[Math.floor(rng()*blocks.length)]; for (let k = 0; k <= 4; k++) sums[k] += block[k]; }
      const mean = sums[1]/sums[0], m2 = sums[2]/sums[0] - mean*mean;
      const m4 = sums[4]/sums[0] - 4*mean*sums[3]/sums[0] + 6*mean*mean*sums[2]/sums[0] - 3*mean**4;
      if (m2 > 0) bootstrap.push(m4/m2**2 - 3);
    }
    bootstrap.sort((a,b)=>a-b);
    const kurtosisInterval = bootstrap.length ? [bootstrap[Math.floor(.025*bootstrap.length)], bootstrap[Math.floor(.975*bootstrap.length)]] : null;
    let reference = null;
    if (config.q === 2) { const c = new GaussianChain(config), weights = testFunctions(config.N, radius).f; reference = gaussianFunctionalVariance(c, weights, c.factor); }
    return { N: config.N, config, radius, f: fStats, g: gStats, centre, user: normalize(userExponent), candidate, candidateH, effectiveSamples: ess, effectiveSquaredSamples: essSquared, rhat, rhatSquared, rhatG: rg, projections, wickResidual, correlation: covariance/Math.sqrt(wickDenominator), kurtosisInterval, bootstrapBlockLength: blockLength, incrementMoments, reference, runs };
  }
  function runSetup(config, seedIndex, radius = .8) {
    const chain = createChain({ ...config, seed: (config.seed + 104729 * (seedIndex + 1) + 1009 * config.N) >>> 0 });
    const functions = testFunctions(config.N, radius);
    // Dispersed real initial conditions for the MCMC replicas.
    if (config.q !== 2) {
      const H = Math.min((config.alpha - 2) / config.q, .5);
      const amplitude = (seedIndex - 1) * Math.pow(config.N || 1, H) * Math.pow(config.beta, -1/config.q);
      for (let i = 0; i < chain.n; i++) chain.heights[i] = amplitude * functions.f[i];
      chain.energy = chain.hamiltonian();
    }
    const lags = [...new Set([1, 2, 4, 8, 16, Math.floor(config.N/2)].filter(x=>x>=1 && x<=Math.floor(config.N/2)))].sort((a,b)=>a-b);
    return { chain, functions, data: { seed: chain.seed, f: [], g: [], centre: [], lags, incrementSums: lags.map(()=>0) } };
  }
  function recordRun(state) {
    const {chain, functions, data} = state;
    let f = 0, g = 0;
    for (let i=0;i<chain.n;i++) { f += functions.f[i]*chain.heights[i]; g += functions.g[i]*chain.heights[i]; }
    data.f.push(f); data.g.push(g); data.centre.push(chain.heights[chain.N]);
    for (let j=0;j<data.lags.length;j++) { const d = chain.heights[chain.N + data.lags[j]] - chain.heights[chain.N]; data.incrementSums[j] += d*d; }
  }
  return { RealChain, GaussianChain, createChain, testFunctions, bump, moments, effectiveSamples, splitRhat, normalQuantile, gaussianFactor, gaussianFunctionalVariance, candidateScaling, candidateNormalization, summarizeRuns, runSetup, recordRun };
});
