/* Numerical core. No browser dependencies; also usable from Node.js. */
(function (root, factory) {
  const api = factory();
  api.workerSource = '(' + factory.toString() + ')()';
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SOS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function randomGenerator(seed) {
    let a = Number(seed) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Sum_{r=start}^infinity r^{-s}: 32 explicit terms, then Euler–Maclaurin.
  // The last five terms are B_{2k}/(2k)! * (s)_{2k-1} * x^{-s-2k+1}.
  function zetaTail(s, start) {
    if (!(s > 1) || !Number.isInteger(start) || start < 1) throw Error('Invalid zeta tail');
    const x = start + 32;
    let sum = 0;
    for (let r = start; r < x; r++) sum += Math.pow(r, -s);
    sum += Math.pow(x, 1 - s) / (s - 1) + 0.5 * Math.pow(x, -s);
    const coefficients = [1 / 12, -1 / 720, 1 / 30240, -1 / 1209600, 1 / 47900160];
    let rising = s;
    for (let k = 1; k <= coefficients.length; k++) {
      if (k > 1) rising *= (s + 2 * k - 3) * (s + 2 * k - 2);
      sum += coefficients[k - 1] * rising * Math.pow(x, -s - 2 * k + 1);
    }
    return sum;
  }

  class Chain {
    constructor(config = {}) {
      this.N = config.N ?? 32;
      this.alpha = config.alpha ?? 2.6;
      this.beta = config.beta ?? 0.4;
      this.q = config.q ?? 1;
      this.seed = Number(config.seed ?? 15782) >>> 0;
      if (!Number.isInteger(this.N) || this.N < 0 || this.N > 256 ||
          !(this.alpha > 1 && this.alpha <= 10) || !(this.beta > 0 && Number.isFinite(this.beta)) ||
          !(this.q > 0 && this.q <= 2)) throw Error('Invalid model parameters');
      this.n = 2 * this.N + 1;
      this.random = randomGenerator(this.seed);
      this.heights = new Float64Array(this.n);
      this.weights = new Float64Array(this.n);
      this.boundary = new Float64Array(this.n);
      this.powers = [0];
      for (let d = 1; d < this.n; d++) this.weights[d] = Math.pow(d, -this.alpha);
      for (let i = 0; i < this.n; i++) {
        this.boundary[i] = zetaTail(this.alpha, i + 1) + zetaTail(this.alpha, this.n - i);
      }
      this.sweeps = 0;
      this.energy = 0;
      this.attempted = { local: 0, block: 0 };
      this.accepted = { local: 0, block: 0 };
    }

    potential(x) {
      if (this.q === 2) return x * x;
      x = Math.abs(x);
      if (this.q === 1) return x;
      // Cache common integer differences without imposing a height cutoff.
      if (x > 16384) return Math.pow(x, this.q);
      if (this.powers[x] === undefined) this.powers[x] = Math.pow(x, this.q);
      return this.powers[x];
    }

    hamiltonian(heights = this.heights) {
      let e = 0;
      for (let i = 0; i < this.n; i++) {
        e += this.boundary[i] * this.potential(heights[i]);
        for (let j = i + 1; j < this.n; j++) {
          e += this.weights[j - i] * this.potential(heights[i] - heights[j]);
        }
      }
      // Definitions 1.1/1.4 sum over ordered i != j, hence the factor 2.
      return 2 * e;
    }

    localDelta(i, step) {
      const h = this.heights;
      const old = h[i];
      let delta = this.boundary[i] * (this.potential(old + step) - this.potential(old));
      for (let j = 0; j < this.n; j++) {
        if (j === i) continue;
        const d = old - h[j];
        delta += this.weights[Math.abs(i - j)] * (this.potential(d + step) - this.potential(d));
      }
      return 2 * delta;
    }

    blockDelta(left, right, step) {
      const h = this.heights;
      let delta = 0;
      for (let i = left; i <= right; i++) {
        delta += this.boundary[i] * (this.potential(h[i] + step) - this.potential(h[i]));
        for (let j = 0; j < left; j++) {
          const d = h[i] - h[j];
          delta += this.weights[i - j] * (this.potential(d + step) - this.potential(d));
        }
        for (let j = right + 1; j < this.n; j++) {
          const d = h[i] - h[j];
          delta += this.weights[j - i] * (this.potential(d + step) - this.potential(d));
        }
      }
      return 2 * delta;
    }

    proposalStep() {
      const sign = this.random() < 0.5 ? -1 : 1;
      // A symmetric, state-independent mixture of unit and larger moves.
      return sign * (this.random() < 0.85 ? 1 : 2 ** (1 + Math.floor(5 * this.random())));
    }

    metropolis(delta) {
      return delta <= 0 || Math.log(1 - this.random()) < -this.beta * delta;
    }

    localMove() {
      const i = Math.floor(this.random() * this.n);
      const step = this.proposalStep();
      const delta = this.localDelta(i, step);
      this.attempted.local++;
      if (this.metropolis(delta)) {
        this.heights[i] += step;
        this.energy += delta;
        this.accepted.local++;
      }
    }

    blockMove() {
      const length = Math.min(this.n, 2 ** Math.floor(this.random() * (Math.ceil(Math.log2(this.n)) + 1)));
      const left = Math.floor(this.random() * (this.n - length + 1));
      const right = left + length - 1;
      const step = this.proposalStep();
      const delta = this.blockDelta(left, right, step);
      this.attempted.block++;
      if (this.metropolis(delta)) {
        for (let i = left; i <= right; i++) this.heights[i] += step;
        this.energy += delta;
        this.accepted.block++;
      }
    }

    sweep() {
      for (let i = 0; i < this.n; i++) this.localMove();
      for (let k = 0; k < 4; k++) this.blockMove();
      this.sweeps++;
      // Recompute periodically to prevent accumulated floating point drift.
      if (this.sweeps % 1024 === 0) this.energy = this.hamiltonian();
    }

    config() {
      return { N: this.N, alpha: this.alpha, beta: this.beta, q: this.q, seed: this.seed };
    }
  }

  class Observables {
    constructor(burnIn = 2000, thin = 5) {
      if (!Number.isInteger(burnIn) || burnIn < 0 || !Number.isInteger(thin) || thin < 1) throw Error('Invalid sampling schedule');
      this.burnIn = burnIn;
      this.thin = thin;
      this.count = 0;
      this.mean = 0;
      this.second = 0;
      this.secondM2 = 0;
      this.meanSquareHeight = 0;
      this.meanEnergy = 0;
      this.histogram = new Map();
      this.trace = [];
      this.samples = [];
      this.sampleCursor = 0;
      this.sampleLimit = 50000;
      this.batchSize = 64;
      this.batchSum = 0;
      this.batchCount = 0;
      this.batchMean = 0;
      this.batchM2 = 0;
    }

    record(chain) {
      if (chain.sweeps <= this.burnIn || (chain.sweeps - this.burnIn) % this.thin !== 0) return false;
      const centre = chain.heights[chain.N];
      const square = centre * centre;
      let spatialSecond = 0;
      for (const h of chain.heights) spatialSecond += h * h;
      spatialSecond /= chain.n;
      const k = ++this.count;
      this.mean += (centre - this.mean) / k;
      const diff = square - this.second;
      this.second += diff / k;
      this.secondM2 += diff * (square - this.second);
      this.meanSquareHeight += (spatialSecond - this.meanSquareHeight) / k;
      this.meanEnergy += (chain.energy / chain.n - this.meanEnergy) / k;
      this.histogram.set(centre, (this.histogram.get(centre) || 0) + 1);
      const sample = { sweep: chain.sweeps, centre, centreSquared: square, energyPerSite: chain.energy / chain.n, meanSquareHeight: spatialSecond };
      if (this.samples.length < this.sampleLimit) this.samples.push(sample);
      else { this.samples[this.sampleCursor] = sample; this.sampleCursor = (this.sampleCursor + 1) % this.sampleLimit; }
      this.trace.push([chain.sweeps, centre]);
      if (this.trace.length > 400) this.trace.shift();
      this.batchSum += square;
      if (k % this.batchSize === 0) {
        const value = this.batchSum / this.batchSize;
        this.batchCount++;
        const d = value - this.batchMean;
        this.batchMean += d / this.batchCount;
        this.batchM2 += d * (value - this.batchMean);
        this.batchSum = 0;
      }
      return true;
    }

    stats() {
      const enough = this.batchCount >= 8 && this.batchM2 > 0;
      const batchVariance = enough ? this.batchM2 / (this.batchCount - 1) : null;
      const standardError = enough ? Math.sqrt(batchVariance / this.batchCount) : null;
      const varianceOfSquaredHeight = this.count > 1 ? this.secondM2 / (this.count - 1) : 0;
      const effectiveSamples = enough ? Math.min(this.count, Math.max(1, this.count * varianceOfSquaredHeight / (this.batchSize * batchVariance))) : null;
      return {
        count: this.count, mean: this.mean, variance: this.second,
        empiricalCenteredVariance: Math.max(0, this.second - this.mean * this.mean),
        rmsHeight: Math.sqrt(this.meanSquareHeight), energyPerSite: this.meanEnergy,
        standardError, effectiveSamples, batchCount: this.batchCount,
        batchSize: this.batchSize, retainedSamples: this.samples.length,
      };
    }

    trajectory() {
      return this.samples.slice(this.sampleCursor).concat(this.samples.slice(0, this.sampleCursor));
    }
  }

  function snapshot(chain, obs) {
    return {
      config: chain.config(), heights: Array.from(chain.heights), sweeps: chain.sweeps,
      instantaneousEnergy: chain.energy, stats: obs.stats(),
      burnIn: obs.burnIn, thin: obs.thin,
      acceptance: {
        local: chain.attempted.local ? chain.accepted.local / chain.attempted.local : 0,
        block: chain.attempted.block ? chain.accepted.block / chain.attempted.block : 0,
      },
      histogram: Array.from(obs.histogram).sort((a, b) => a[0] - b[0]),
      trace: obs.trace.slice(),
    };
  }

  // Continuous q=2 reference: Cov(phi) = (4 beta L)^(-1).
  // This is a reference for a different (real-valued) model, not the discrete answer.
  function continuousVariance(config) {
    const chain = new Chain({ ...config, q: 2 });
    const n = chain.n;
    const lower = new Float64Array(n * n);
    const diagonal = 2 * zetaTail(chain.alpha, 1);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = i === j ? diagonal : -chain.weights[i - j];
        for (let k = 0; k < j; k++) sum -= lower[i * n + k] * lower[j * n + k];
        lower[i * n + j] = i === j ? Math.sqrt(sum) : sum / lower[j * n + j];
      }
    }
    const y = new Float64Array(n);
    let norm = 0;
    for (let i = 0; i < n; i++) {
      let value = i === chain.N ? 1 : 0;
      for (let j = 0; j < i; j++) value -= lower[i * n + j] * y[j];
      y[i] = value / lower[i * n + i];
      norm += y[i] * y[i];
    }
    return norm / (4 * chain.beta);
  }

  function theory(config) {
    const { alpha: a, q } = config;
    const equal = (x, y) => Math.abs(x - y) < 1e-8;
    if (equal(q, 2)) {
      if (a < 2 && !equal(a, 2)) return { name: 'Localised', formula: 'Var φ(0) ≍ 1', detail: 'Bounded centre variance as N grows; every temperature.', source: 'Theorem 1.2' };
      if (equal(a, 2)) return { name: 'Temperature-dependent', formula: 'log N at high temperature', detail: 'Localisation at low temperature. The paper does not give an exact critical β.', source: 'Theorem 1.2 · Remark 1.3' };
      if (a < 3 && !equal(a, 3)) return { name: 'Delocalised', formula: `Var φ(0) ≍ N^${(a - 2).toFixed(2)}`, detail: 'Matching growth exponents at every temperature; unknown multiplicative constants.', source: 'Theorem 1.2' };
      if (equal(a, 3)) return { name: 'Marginal growth', formula: 'Var φ(0) ≍ N / log N', detail: 'A logarithmic correction to linear variance growth.', source: 'Theorem 1.2' };
      return { name: 'Diffusive growth', formula: 'Var φ(0) ≍ N', detail: 'Matching linear variance bounds at every temperature.', source: 'Theorem 1.2' };
    }
    let lower;
    if (a <= 2) lower = '1';
    else if (equal(a, 2 + q / 2)) lower = `N / (log N)^${(2 / q).toFixed(2)}`;
    else if (a < 2 + q / 2) lower = `N^${(2 * (a - 2) / q).toFixed(2)}`;
    else lower = 'N';
    let upper;
    if (equal(a, q)) upper = 'log N';
    else if (a < q) upper = '1';
    else upper = 2 * a / q - 2 >= 1 ? 'N' : `N^${(2 * a / q - 2).toFixed(2)}`;
    return {
      name: a < q ? 'Localised' : a > 2 ? (a > 2 + q / 2 && !equal(a, 2 + q / 2) ? 'Diffusive growth' : 'Delocalised') : 'Bounds leave a gap',
      formula: `${lower} ≲ Var φ(0) ≲ ${upper}`,
      detail: 'Bounds up to constants depending on α, β, q. General q-SOS exponents need not match.',
      source: 'Theorem 1.5 · §4.2.2',
    };
  }

  return { Chain, Observables, snapshot, continuousVariance, randomGenerator, zetaTail, theory };
});
