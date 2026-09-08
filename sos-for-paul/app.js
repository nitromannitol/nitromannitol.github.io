'use strict';

// A Blob worker permits both file:// opening and ordinary HTTP hosting.
function workerRuntime() {
  let chain, observations, running = false, timer = null, lastSend = 0;
  const send = () => postMessage({ type: 'snapshot', ...SOS.snapshot(chain, observations), running });
  function tick() {
    timer = null;
    if (!running) return;
    const start = performance.now();
    do { chain.sweep(); observations.record(chain); } while (performance.now() - start < 20);
    if (performance.now() - lastSend > 100) { send(); lastSend = performance.now(); }
    if (running) timer = setTimeout(tick, 12);
  }
  function resume() { running = true; if (timer === null) timer = setTimeout(tick, 0); }
  function stop() { running = false; if (timer !== null) clearTimeout(timer); timer = null; }
  async function scan(config, burnIn, thin) {
    const sizes = [8, 16, 32, 64], results = [];
    const warmup = Math.max(2000, burnIn);
    const totalSweeps = warmup + 2000 * thin;
    for (let k = 0; k < sizes.length; k++) {
      const replicates = [];
      for (let r = 0; r < 3; r++) {
        const c = new SOS.Chain({ ...config, N: sizes[k], seed: (config.seed + 104729 * (k * 3 + r + 1)) >>> 0 });
        const o = new SOS.Observables(warmup, thin);
        while (c.sweeps < totalSweeps) {
          const start = performance.now();
          do { c.sweep(); o.record(c); } while (c.sweeps < totalSweeps && performance.now() - start < 35);
          postMessage({ type: 'scan-progress', progress: (k * 3 + r + c.sweeps / totalSweeps) / 12, N: c.N, replicate: r + 1, results });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        replicates.push({ seed: c.seed, ...o.stats() });
      }
      const variance = replicates.reduce((s, r) => s + r.variance, 0) / 3;
      const between = Math.sqrt(replicates.reduce((s, r) => s + (r.variance - variance) ** 2, 0) / 6);
      const within = Math.sqrt(replicates.reduce((s, r) => s + (r.standardError || 0) ** 2, 0)) / 3;
      results.push({ N: sizes[k], variance, standardError: Math.max(between, within), reference: config.q === 2 ? SOS.continuousVariance({ ...config, N: sizes[k] }) : null, replicates });
    }
    postMessage({ type: 'scan-complete', results, config, burnIn: warmup, thin, samplesPerSeed: 2000 });
  }
  onmessage = e => {
    try {
      const m = e.data;
      if (m.type === 'init') { stop(); chain = new SOS.Chain(m.config); observations = new SOS.Observables(m.burnIn, m.thin); send(); resume(); }
      else if (m.type === 'pause') { stop(); send(); }
      else if (m.type === 'resume') { resume(); send(); }
      else if (m.type === 'step') { stop(); chain.sweep(); observations.record(chain); send(); }
      else if (m.type === 'export') postMessage({ type: 'export', snapshot: SOS.snapshot(chain, observations), samples: observations.trajectory() });
      else if (m.type === 'scan') { stop(); scan(m.config, m.burnIn, m.thin).catch(error => postMessage({ type: 'error', message: error.message })); }
    } catch (error) { postMessage({ type: 'error', message: error.message }); }
  };
}

const $ = id => document.getElementById(id);
const colors = { ink: '#203b3a', muted: '#849188', grid: '#e5e7de', teal: '#147b70', orange: '#ca7643' };
let worker, scanWorker, current = null, previousProfiles = [], paused = false, scanActive = false, scanResults = [], scanData = null, selectedSite = null;
let lastProfileSweep = -1;
const presets = {
  sos: { N: 32, q: 1, alpha: 2.6, beta: 0.4 },
  gaussian: { N: 32, q: 2, alpha: 2.6, beta: 0.2 },
  localised: { N: 32, q: 2, alpha: 1.5, beta: 0.15 },
  marginal: { N: 32, q: 2, alpha: 3, beta: 0.2 },
};
function makeWorker() {
  const blob = new Blob(['const SOS = ' + SOS.workerSource + ';(' + workerRuntime.toString() + ')();'], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const w = new Worker(url);
  URL.revokeObjectURL(url);
  w.onerror = e => showError(e.message || 'Unable to run the simulation worker.');
  return w;
}
function showError(message) { $('error').textContent = message; $('error').classList.remove('hidden'); }
function parameters() {
  const config = Object.fromEntries(['N', 'q', 'alpha', 'beta', 'seed'].map(id => [id, Number($(id).value)]));
  const burnIn = Number($('burn').value), thin = Number($('thin').value);
  if (!Number.isInteger(burnIn) || burnIn < 0 || burnIn > 1000000 || !Number.isInteger(thin) || thin < 1 || thin > 10000 || !Number.isInteger(config.seed) || config.seed < 0 || config.seed > 4294967295) throw Error('Please use valid integer sampling settings and a seed from 0 to 4294967295.');
  return { config, burnIn, thin };
}
function format(x, digits = 2) { return Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—'; }
function updateOutputs() { for (const id of ['q', 'alpha', 'beta']) $(id + '-value').value = Number($(id).value).toFixed(2); }
function apply() {
  try {
    const p = parameters();
    if (worker) worker.terminate();
    if (scanWorker) scanWorker.terminate();
    scanWorker = null; scanActive = false; scanResults = []; scanData = null;
    $('scan').textContent = 'Run size experiment ↗'; $('scan-progress').style.width = '0%';
    $('scan-export').classList.add('hidden');
    $('scan-status').textContent = 'An exploratory finite-size comparison; it does not establish an asymptotic exponent.';
    current = null; previousProfiles = []; lastProfileSweep = -1; selectedSite = null; paused = false;
    $('pause').disabled = false; $('pause').textContent = 'Ⅱ Pause'; $('step').disabled = true;
    $('error').classList.add('hidden');
    $('parameter-hint').textContent = 'Sampling runs locally in your browser.'; $('parameter-hint').classList.remove('dirty');
    const theory = SOS.theory(p.config);
    $('theory-name').textContent = 'Paper prediction · ' + theory.name;
    $('theory-formula').textContent = theory.formula;
    $('theory-detail').textContent = theory.detail;
    $('theory-source').textContent = theory.source;
    $('theory-source').href = '2412.15782.pdf#page=' + (p.config.q === 2 ? 3 : 5);
    $('model-label').textContent = p.config.q === 2 ? 'Integer-valued Gaussian · q = 2' : 'Discrete q-SOS · q = ' + p.config.q;
    worker = makeWorker(); worker.onmessage = onMessage; worker.postMessage({ type: 'init', ...p });
    drawScaling();
  } catch (e) { showError(e.message); }
}
function onMessage(e) {
  const m = e.data;
  if (m.type === 'snapshot') {
    current = m;
    if (m.sweeps !== lastProfileSweep) { previousProfiles.push(m.heights); if (previousProfiles.length > 7) previousProfiles.shift(); lastProfileSweep = m.sweeps; }
    update();
  } else if (m.type === 'export') {
    const c = m.snapshot.config;
    const meta = ['N', 'q', 'alpha', 'beta', 'seed'].map(k => '# ' + k + '=' + c[k]);
    meta.push('# burnIn=' + m.snapshot.burnIn, '# thin=' + m.snapshot.thin, '# energy=ordered-pair Hamiltonian; infinite zero exterior', '# retained=' + m.samples.length + '; total=' + m.snapshot.stats.count);
    const csv = meta.join('\n') + '\nsweep,centre,centre_squared,energy_per_site,mean_square_height\n' + m.samples.map(s => [s.sweep, s.centre, s.centreSquared, s.energyPerSite, s.meanSquareHeight].join(',')).join('\n');
    download('sos-N' + c.N + '-q' + c.q + '-seed' + c.seed + '.csv', csv, 'text/csv');
  } else if (m.type === 'error') showError(m.message);
}
function update() {
  const m = current, s = m.stats;
  const warming = m.sweeps < m.burnIn;
  $('status-text').textContent = scanActive ? 'Size experiment running' : paused ? 'Paused' : warming ? 'Warmup ' + Math.floor(100 * m.sweeps / m.burnIn) + '%' : 'Sampling';
  $('run-description').textContent = (2 * m.config.N + 1) + ' active sites · ' + m.sweeps.toLocaleString() + ' sweeps · α = ' + m.config.alpha + ' · β = ' + m.config.beta;
  $('variance').textContent = s.count ? format(s.variance, 3) : '—';
  $('rms').textContent = s.count ? format(s.rmsHeight, 3) : '—';
  $('acceptance').textContent = format(100 * m.acceptance.local, 1) + '%';
  $('block-acceptance').textContent = 'Interval acceptance ' + format(100 * m.acceptance.block, 1) + '%';
  $('samples').textContent = s.count.toLocaleString();
  $('sample-note').textContent = s.effectiveSamples ? '≈ ' + Math.round(s.effectiveSamples).toLocaleString() + ' effective samples of φ(0)²' : warming ? 'Warmup excluded' : 'Saved every ' + m.thin + ' sweeps';
  $('variance-note').textContent = s.standardError ? '± ' + format(s.standardError, 3) + ' estimated SE (batches)' : '⟨φ(0)²⟩; equilibrium mean is 0';
  $('mean-label').textContent = s.count ? 'Observed centre mean ' + format(s.mean, 3) + ' · symmetry predicts 0.' : 'Waiting for post-warmup samples.';
  drawInterface(); drawHistogram(); drawTrace();
  window.simulationState = m;
}
function canvasContext(id) {
  const canvas = $(id), rect = canvas.getBoundingClientRect(), scale = Math.min(2, window.devicePixelRatio || 1);
  const w = rect.width, h = rect.height;
  if (canvas.width !== Math.round(w * scale) || canvas.height !== Math.round(h * scale)) { canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale); }
  const ctx = canvas.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  return { ctx, w, h };
}
function line(ctx, x1, y1, x2, y2, color = colors.grid, width = 1) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function empty(ctx, w, h, text) { ctx.fillStyle = colors.muted; ctx.textAlign = 'center'; ctx.fillText(text, w / 2, h / 2); }
function drawInterface() {
  const { ctx, w, h } = canvasContext('interface'); if (!current) return;
  const N = current.config.N, heights = current.heights;
  let bound = 4;
  for (const profile of previousProfiles) for (const v of profile) bound = Math.max(bound, Math.abs(v) + 2);
  const tick = Math.max(1, Math.ceil(bound / 4)); bound = tick * Math.ceil(bound / tick);
  const left = 45, right = w - 20, top = 32, bottom = h - 30;
  const x = i => left + (i + N + 3) / (2 * N + 6) * (right - left);
  const y = v => top + (bound - v) / (2 * bound) * (bottom - top);
  ctx.fillStyle = '#f1f2eb'; ctx.fillRect(left, top, x(-N - .5) - left, bottom - top); ctx.fillRect(x(N + .5), top, right - x(N + .5), bottom - top);
  for (let v = -bound; v <= bound; v += tick) { line(ctx, left, y(v), right, y(v), v === 0 ? '#bccbc0' : colors.grid); ctx.fillStyle = colors.muted; ctx.textAlign = 'right'; ctx.fillText(String(v), left - 9, y(v) + 3); }
  for (const i of [-N, -Math.floor(N / 2), 0, Math.floor(N / 2), N]) { line(ctx, x(i), top, x(i), bottom, '#edf0e7'); ctx.fillStyle = colors.muted; ctx.textAlign = 'center'; ctx.fillText(String(i), x(i), bottom + 18); }
  ctx.fillStyle = colors.muted; ctx.textAlign = 'left'; ctx.fillText('HEIGHT φ(i)', left, 17); ctx.textAlign = 'right'; ctx.fillText('SITE i', right, bottom + 18);
  function path(profile, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x(-N - 3), y(0)); ctx.lineTo(x(-N - .5), y(0));
    for (let j = 0; j < profile.length; j++) { ctx.lineTo(x(j - N - .5), y(profile[j])); ctx.lineTo(x(j - N + .5), y(profile[j])); }
    ctx.lineTo(x(N + .5), y(0)); ctx.lineTo(x(N + 3), y(0)); ctx.stroke();
  }
  previousProfiles.slice(0, -1).forEach((p, i) => path(p, 'rgba(20,123,112,' + (0.035 + i * .02) + ')', 1));
  path(heights, colors.teal, 1.9);
  ctx.fillStyle = colors.orange; ctx.beginPath(); ctx.arc(x(0), y(heights[N]), 4.5, 0, Math.PI * 2); ctx.fill();
  if (selectedSite !== null) {
    const i = Math.max(-N, Math.min(N, selectedSite));
    ctx.setLineDash([3, 4]); line(ctx, x(i), top, x(i), bottom, colors.orange); ctx.setLineDash([]);
    $('hover-label').textContent = 'i = ' + i + ' · φ(i) = ' + heights[i + N];
  }
}
function drawHistogram() {
  const { ctx, w, h } = canvasContext('histogram');
  if (!current?.stats.count) return empty(ctx, w, h, 'Histogram appears after warmup.');
  const hist = current.histogram, min = Math.min(-2, hist[0][0]), max = Math.max(2, hist[hist.length - 1][0]);
  const slots = Math.min(60, max - min + 1), width = (max - min + 1) / slots;
  const bins = Array(slots).fill(0);
  for (const [v, count] of hist) bins[Math.min(slots - 1, Math.floor((v - min) / width))] += count;
  const peak = Math.max(...bins), left = 32, right = w - 8, bottom = h - 23, top = 12;
  for (const f of [0, .5, 1]) { const yy = bottom - f * (bottom - top); line(ctx, left, yy, right, yy); ctx.fillStyle = colors.muted; ctx.textAlign = 'right'; ctx.fillText((100 * peak * f / current.stats.count).toFixed(0) + '%', left - 5, yy + 3); }
  for (let i = 0; i < slots; i++) { const bw = (right - left) / slots; ctx.fillStyle = min + i * width <= 0 && min + (i + 1) * width > 0 ? colors.orange : '#6fa797'; const barHeight = bins[i] / peak * (bottom - top); ctx.fillRect(left + i * bw + 1, bottom - barHeight, Math.max(1, bw - 2), barHeight); }
  ctx.fillStyle = colors.muted; ctx.textAlign = 'center';
  for (const v of [...new Set([min, 0, max])]) ctx.fillText(String(v), left + (v - min + .5) / (max - min + 1) * (right - left), bottom + 17);
}
function drawTrace() {
  const { ctx, w, h } = canvasContext('trace');
  const trace = current?.trace;
  if (!trace?.length) return empty(ctx, w, h, 'History appears after warmup.');
  const bound = Math.max(2, ...trace.map(p => Math.abs(p[1]))) + 1;
  const left = 27, right = w - 8, top = 10, bottom = h - 23;
  const y = v => top + (bound - v) / (2 * bound) * (bottom - top);
  for (const v of [-bound, 0, bound]) { line(ctx, left, y(v), right, y(v)); ctx.fillStyle = colors.muted; ctx.textAlign = 'right'; ctx.fillText(String(v), left - 6, y(v) + 3); }
  ctx.strokeStyle = colors.teal; ctx.lineWidth = 1.2; ctx.beginPath(); trace.forEach((p, i) => { const xx = left + i / Math.max(1, trace.length - 1) * (right - left); if (!i) ctx.moveTo(xx, y(p[1])); else ctx.lineTo(xx, y(p[1])); }); ctx.stroke();
  ctx.fillStyle = colors.muted; ctx.textAlign = 'left'; ctx.fillText(trace[0][0].toLocaleString(), left, bottom + 17); ctx.textAlign = 'right'; ctx.fillText(trace[trace.length - 1][0].toLocaleString(), right, bottom + 17);
}
function drawScaling() {
  const { ctx, w, h } = canvasContext('scaling');
  if (!scanResults.length) return empty(ctx, w, h, scanActive ? 'Sampling the first size…' : 'Run the experiment to measure variance across four sizes.');
  const valid = scanResults.filter(p => p.variance > 0);
  if (!valid.length) return empty(ctx, w, h, 'No nonzero heights observed. More sampling or a hotter setting may help.');
  const left = 47, right = w - 22, top = 26, bottom = h - 28;
  let min = Math.min(...valid.map(p => Math.max(p.variance * .2, p.variance - p.standardError))), max = Math.max(...valid.map(p => Math.max(p.variance + p.standardError, p.reference || 0)));
  min /= 1.4; max *= 1.4;
  const x = N => left + Math.log2(N / 8) / 3 * (right - left), y = v => bottom - Math.log(v / min) / Math.log(max / min) * (bottom - top);
  for (const N of [8, 16, 32, 64]) { line(ctx, x(N), top, x(N), bottom); ctx.fillStyle = colors.muted; ctx.textAlign = 'center'; ctx.fillText('N = ' + N, x(N), bottom + 19); }
  for (let k = 0; k <= 3; k++) { const v = min * (max / min) ** (k / 3); line(ctx, left, y(v), right, y(v)); ctx.fillStyle = colors.muted; ctx.textAlign = 'right'; ctx.fillText(format(v, v < 1 ? 3 : 1), left - 8, y(v) + 3); }
  if (valid.some(p => p.reference)) { ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.strokeStyle = colors.orange; valid.forEach((p, i) => { if (!i) ctx.moveTo(x(p.N), y(p.reference)); else ctx.lineTo(x(p.N), y(p.reference)); }); ctx.stroke(); ctx.setLineDash([]); }
  ctx.beginPath(); ctx.strokeStyle = colors.teal; ctx.lineWidth = 1.5; valid.forEach((p, i) => { if (!i) ctx.moveTo(x(p.N), y(p.variance)); else ctx.lineTo(x(p.N), y(p.variance)); }); ctx.stroke();
  for (const p of valid) { const lo = y(Math.max(min, p.variance - p.standardError)), hi = y(p.variance + p.standardError); line(ctx, x(p.N), lo, x(p.N), hi, colors.teal); line(ctx, x(p.N) - 4, lo, x(p.N) + 4, lo, colors.teal); line(ctx, x(p.N) - 4, hi, x(p.N) + 4, hi, colors.teal); ctx.fillStyle = colors.teal; ctx.beginPath(); ctx.arc(x(p.N), y(p.variance), 4, 0, 2 * Math.PI); ctx.fill(); }
  ctx.fillStyle = colors.muted; ctx.textAlign = 'left'; ctx.fillText('VARIANCE · LOG / LOG AXES', left, 12); ctx.textAlign = 'right'; ctx.fillText(valid.some(p => p.reference) ? 'Dashed: real Gaussian reference' : 'Error bars: approximate standard error', right, 12);
}
function togglePause() {
  if (scanActive) return;
  paused = !paused; worker.postMessage({ type: paused ? 'pause' : 'resume' });
  $('pause').textContent = paused ? '▶ Resume' : 'Ⅱ Pause'; $('step').disabled = !paused;
}
function startScan() {
  if (scanActive) { scanWorker.terminate(); scanWorker = null; scanActive = false; $('scan').textContent = 'Run size experiment ↗'; $('scan-status').textContent = 'Experiment stopped. Completed sizes are shown.'; $('pause').disabled = false; $('step').disabled = false; if(current) update(); return; }
  if (!current) return;
  paused = true; worker.postMessage({ type: 'pause' }); $('pause').textContent = '▶ Resume'; $('pause').disabled = true; $('step').disabled = true;
  scanActive = true; scanResults = []; scanData = null; $('scan-export').classList.add('hidden'); $('scan').textContent = 'Stop experiment';
  scanWorker = makeWorker();
  scanWorker.onmessage = e => {
    const m = e.data;
    if (m.type === 'scan-progress') { scanResults = m.results; $('scan-progress').style.width = (100 * m.progress) + '%'; $('scan-status').textContent = 'N = ' + m.N + ' · seed ' + m.replicate + ' of 3 · ' + Math.floor(100 * m.progress) + '% complete'; drawScaling(); }
    else if (m.type === 'scan-complete') {
      scanData = m; scanResults = m.results; window.sizeExperiment = m; scanActive = false;
      $('scan-progress').style.width = '100%'; $('scan').textContent = 'Run again ↗'; $('scan-export').classList.remove('hidden');
      $('scan-status').textContent = 'Complete · ' + m.burnIn.toLocaleString() + ' warmup + ' + (2000 * m.thin).toLocaleString() + ' sampling sweeps per seed. Finite-size estimates; convergence is not guaranteed.';
      $('pause').disabled = false; $('step').disabled = false; scanWorker.terminate(); scanWorker = null; update(); drawScaling();
    } else if (m.type === 'error') { showError(m.message); scanWorker.terminate(); scanWorker = null; scanActive = false; $('scan').textContent = 'Run size experiment ↗'; $('pause').disabled = false; $('step').disabled = false; }
  };
  scanWorker.postMessage({ type: 'scan', config: current.config, burnIn: current.burnIn, thin: current.thin }); drawScaling(); update();
}
function download(name, data, type) { const url = URL.createObjectURL(new Blob([data], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
for (const id of ['q', 'alpha', 'beta', 'N', 'burn', 'thin', 'seed']) $(id).addEventListener('input', () => { updateOutputs(); $('parameter-hint').textContent = 'Apply to sample the new parameters.'; $('parameter-hint').classList.add('dirty'); document.querySelectorAll('.preset').forEach(b => b.classList.remove('active')); });
document.querySelectorAll('.preset').forEach(button => button.addEventListener('click', () => { for (const [id, value] of Object.entries(presets[button.dataset.preset])) $(id).value = value; document.querySelectorAll('.preset').forEach(b => b.classList.toggle('active', b === button)); updateOutputs(); apply(); }));
$('apply').addEventListener('click', apply); $('pause').addEventListener('click', togglePause);
$('step').addEventListener('click', () => worker.postMessage({ type: 'step' }));
$('export').addEventListener('click', () => worker.postMessage({ type: 'export' }));
$('scan').addEventListener('click', startScan);
$('scan-export').addEventListener('click', () => { if(scanData) download('sos-size-experiment.json', JSON.stringify(scanData, null, 2), 'application/json'); });
$('interface').addEventListener('pointermove', e => { if (!current) return; const rect = e.currentTarget.getBoundingClientRect(), N = current.config.N; selectedSite = Math.round((e.clientX - rect.left - 45) / (rect.width - 65) * (2 * N + 6) - N - 3); drawInterface(); });
$('interface').addEventListener('pointerleave', () => { selectedSite = null; $('hover-label').textContent = 'Move over the plot to inspect a site.'; drawInterface(); });
new ResizeObserver(() => { if (current) { drawInterface(); drawHistogram(); drawTrace(); } drawScaling(); }).observe(document.querySelector('.main-column'));
window.addEventListener('beforeunload', () => { worker?.terminate(); scanWorker?.terminate(); });
updateOutputs(); apply();
