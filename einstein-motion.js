/* Shared Einstein-relation simulation and space–time drawing.
 *
 * This finite, smooth potential illustrates reversible diffusion. It is not a
 * realization of the finite-range random environment in the paper.
 * With a = I, the generator is (1/2)Delta - grad(V).grad: Brownian noise has
 * unit amplitude, and the Einstein convention is mobility = variance rate.
 */
(function (root) {
    'use strict';

    function potential(x, y) {
        return .46 * Math.sin(x + .23) + .31 * Math.cos(y - .41)
            + .22 * Math.sin(x + .73 * y) + .15 * Math.cos(1.7 * x - .8 * y);
    }

    function gradient(x, y, out) {
        out = out || [0, 0];
        const c = Math.cos(x + .73 * y), s = Math.sin(1.7 * x - .8 * y);
        out[0] = .46 * Math.cos(x + .23) + .22 * c - .255 * s;
        out[1] = -.31 * Math.sin(y - .41) + .1606 * c + .12 * s;
        return out;
    }

    function noise(initial) {
        let seed = (initial >>> 0) || 0x6d2b79f5, spare = null;
        function uniform() {
            seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
            return (seed >>> 0) / 4294967296;
        }
        return function () {
            if (spare !== null) { const z = spare; spare = null; return z; }
            const r = Math.sqrt(-2 * Math.log(Math.max(1e-12, uniform())));
            const a = 2 * Math.PI * uniform();
            spare = r * Math.sin(a);
            return r * Math.cos(a);
        };
    }

    /* All series are ordinary arrays, so runs can be serialized without a
     * custom typed-array conversion. x0[p][s] and x1[p][s] are genuine sampled
     * horizontal trajectories. Intermediate recording times use only linear
     * interpolation between neighboring Euler–Maruyama points (no splines).
     * Statistics use those same samples; they are neither fitted nor forced
     * to agree. Every run starts all pairs at the origin.
     */
    function generate(options) {
        options = options || {};
        const force = options.force === undefined ? .125 : +options.force;
        const seed = options.seed === undefined ? 0x4e554c4c : options.seed >>> 0;
        const pairs = options.pairs === undefined ? 32 : +options.pairs;
        const samples = options.samples === undefined ? 900 : +options.samples;
        if (!(Number.isFinite(force) && force > 0)) throw new RangeError('Force must be positive.');
        if (!(Number.isInteger(pairs) && pairs >= 2)) throw new RangeError('At least two pairs are required.');
        if (!(Number.isInteger(samples) && samples >= 2)) throw new RangeError('At least two samples are required.');

        const dt = .025, duration = 4 / (force * force), steps = Math.ceil(duration / dt);
        const run = {
            force: force, seed: seed, pairs: pairs, samples: samples,
            dt: dt, duration: duration, steps: steps,
            x0: [], x1: [], time: new Array(samples),
            mean0: new Array(samples), mean1: new Array(samples),
            diffusion: new Array(samples), mobility: new Array(samples),
            yMin: 0, yMax: 0
        };
        const ax = new Float64Array(pairs), ay = new Float64Array(pairs);
        const bx = new Float64Array(pairs), by = new Float64Array(pairs);
        const previousA = new Float64Array(pairs), previousB = new Float64Array(pairs);
        const normal = noise(seed), g = [0, 0];
        for (let p = 0; p < pairs; p++) {
            run.x0.push(new Array(samples)); run.x1.push(new Array(samples));
            run.x0[p][0] = 0; run.x1[p][0] = 0;
        }
        for (let s = 0; s < samples; s++) run.time[s] = duration * s / (samples - 1);
        run.mean0[0] = run.mean1[0] = run.diffusion[0] = run.mobility[0] = 0;

        let next = 1, min = 0, max = 0;
        for (let step = 0; step < steps; step++) {
            const t = step * dt, end = Math.min(duration, (step + 1) * dt);
            const h = end - t, sq = Math.sqrt(h);
            for (let p = 0; p < pairs; p++) {
                // The two copies receive exactly the same two Gaussian draws.
                const zx = sq * normal(), zy = sq * normal();
                previousA[p] = ax[p]; previousB[p] = bx[p];
                gradient(ax[p], ay[p], g);
                ax[p] += -g[0] * h + zx; ay[p] += -g[1] * h + zy;
                gradient(bx[p], by[p], g);
                bx[p] += (force - g[0]) * h + zx; by[p] += -g[1] * h + zy;
            }
            while (next < samples && run.time[next] <= end + 1e-10) {
                const fraction = Math.max(0, Math.min(1, (run.time[next] - t) / h));
                let sumA = 0, sumB = 0;
                for (let p = 0; p < pairs; p++) {
                    const a = previousA[p] + fraction * (ax[p] - previousA[p]);
                    const b = previousB[p] + fraction * (bx[p] - previousB[p]);
                    run.x0[p][next] = a; run.x1[p][next] = b;
                    sumA += a; sumB += b;
                    min = Math.min(min, a, b); max = Math.max(max, a, b);
                }
                const meanA = sumA / pairs, meanB = sumB / pairs;
                let squared = 0;
                for (let p = 0; p < pairs; p++) {
                    const centered = run.x0[p][next] - meanA;
                    squared += centered * centered;
                }
                run.mean0[next] = meanA; run.mean1[next] = meanB;
                run.diffusion[next] = squared / ((pairs - 1) * run.time[next]);
                run.mobility[next] = (meanB - meanA) / (force * run.time[next]);
                next++;
            }
        }
        const pad = Math.max(1, max - min) * .085;
        run.yMin = min - pad; run.yMax = max + pad;
        return run;
    }

    function paint(ctx, W, H, run, progress, options) {
        options = options || {};
        const dark = options.dark !== false, compact = !!options.compact;
        const unit = W / (compact ? 420 : 800);
        const labels = Math.max(1, +options.labelScale || 1);
        const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
        const index = p * (run.samples - 1), last = Math.floor(index), fraction = index - last;
        const left = W * (compact ? .07 : .075), right = W * (compact ? .95 : .955);
        const top = H * (compact ? .075 : .13), bottom = H * (compact ? .925 : .855);
        const width = right - left, height = bottom - top;
        const cy = dark ? '#66d9ff' : '#087491', amber = dark ? '#ffc565' : '#b96308';
        const ink = dark ? '#eeeae4' : '#292b35';
        const x = function (s) { return left + width * s / (run.samples - 1); };
        const y = function (v) { return bottom - (v - run.yMin) / (run.yMax - run.yMin) * height; };
        const front = left + width * p;
        const value = function (series) {
            return last >= run.samples - 1 ? series[last]
                : series[last] + fraction * (series[last + 1] - series[last]);
        };
        function trace(series) {
            ctx.beginPath(); ctx.moveTo(left, y(series[0]));
            for (let s = 1; s <= last; s++) ctx.lineTo(x(s), y(series[s]));
            if (fraction > 0) ctx.lineTo(front, y(value(series)));
        }
        function dot(px, py, radius, color, alpha) {
            ctx.globalAlpha = alpha; ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(px, py, radius * unit, 0, Math.PI * 2); ctx.fill();
        }

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = dark ? '#15141c' : '#faf9f5'; ctx.fillRect(0, 0, W, H);
        const wash = ctx.createLinearGradient(0, H, W, 0);
        wash.addColorStop(0, dark ? 'rgba(23,81,99,.10)' : 'rgba(12,117,145,.035)');
        wash.addColorStop(1, dark ? 'rgba(114,76,27,.08)' : 'rgba(185,102,11,.025)');
        ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = ink; ctx.globalAlpha = dark ? .14 : .18; ctx.lineWidth = unit;
        ctx.beginPath(); ctx.moveTo(left, y(0)); ctx.lineTo(right, y(0)); ctx.stroke();
        if (p > .002) {
            ctx.globalAlpha = dark ? .13 : .16;
            ctx.beginPath(); ctx.moveTo(front, top); ctx.lineTo(front, bottom); ctx.stroke();
        }

        // A very faint band is bounded by the two measured ensemble means.
        ctx.beginPath(); ctx.moveTo(left, y(run.mean0[0]));
        for (let s = 1; s <= last; s++) ctx.lineTo(x(s), y(run.mean0[s]));
        if (fraction > 0) ctx.lineTo(front, y(value(run.mean0)));
        ctx.lineTo(front, y(value(run.mean1)));
        for (let s = last; s >= 0; s--) ctx.lineTo(x(s), y(run.mean1[s]));
        ctx.closePath(); ctx.fillStyle = amber; ctx.globalAlpha = dark ? .045 : .035; ctx.fill();

        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (let group = 0; group < 2; group++) {
            const paths = group ? run.x1 : run.x0, color = group ? amber : cy;
            ctx.strokeStyle = color;
            for (let n = 0; n < paths.length; n++) {
                ctx.globalAlpha = compact ? .28 : .23;
                ctx.lineWidth = (compact ? 1.32 : 1.05) * unit;
                trace(paths[n]); ctx.stroke();
            }
            // One actual trajectory retains enough weight to show its jagged increments.
            ctx.globalAlpha = compact ? .64 : .58;
            ctx.lineWidth = (compact ? 1.65 : 1.55) * unit;
            trace(paths[0]); ctx.stroke();
            if (p > .002) for (let n = 0; n < paths.length; n++) {
                dot(front, y(value(paths[n])), compact ? 2.1 : 2.0, color, compact ? .70 : .64);
            }
        }

        [run.mean0, run.mean1].forEach(function (series, group) {
            const color = group ? amber : cy;
            ctx.strokeStyle = color; ctx.globalAlpha = dark ? .12 : .08;
            ctx.lineWidth = (compact ? 8 : 9) * unit; trace(series); ctx.stroke();
            ctx.globalAlpha = 1; ctx.lineWidth = (compact ? 3.2 : 2.9) * unit;
            trace(series); ctx.stroke();
            if (p > .002) {
                dot(front, y(value(series)), compact ? 11 : 12, color, dark ? .09 : .07);
                dot(front, y(value(series)), compact ? 4.7 : 4.4, color, 1);
                dot(front, y(value(series)), compact ? 1.5 : 1.4, dark ? '#fff9e9' : '#fff', .88);
            }
        });
        dot(left, y(0), compact ? 3.1 : 3.0, ink, .85);

        if (!compact) {
            ctx.globalAlpha = dark ? .70 : .76; ctx.fillStyle = ink;
            ctx.font = (11.5 * unit * labels) + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('horizontal displacement', left, H * .060);
            ctx.fillText('time →', left, H * .938);
            ctx.textAlign = 'right';
            ctx.fillText('t = ' + (run.duration * p).toFixed(1), right, H * .938);
            const legendY = H * .060;
            const swatch = 17 * unit, gap = 8 * unit;
            const textWidth = ctx.measureText('+ force').width;
            const legendRight = right;
            ctx.fillStyle = amber; ctx.globalAlpha = 1;
            ctx.fillText('+ force', legendRight, legendY);
            ctx.fillRect(legendRight - textWidth - gap - swatch, legendY - unit, swatch, 2 * unit);
            const secondRight = legendRight - textWidth - gap - swatch - 20 * unit;
            ctx.fillStyle = cy;
            ctx.fillText('no force', secondRight, legendY);
            const secondWidth = ctx.measureText('no force').width;
            ctx.fillRect(secondRight - secondWidth - gap - swatch, legendY - unit, swatch, 2 * unit);
        }
        ctx.restore();
    }

    root.EinsteinMotion = { generate: generate, paint: paint, potential: potential,
        gradient: gradient, noise: noise };
    if (typeof WorkerGlobalScope !== 'undefined' && root instanceof WorkerGlobalScope) {
        root.onmessage = function (event) {
            const data = event.data || {};
            try { root.postMessage({ id: data.id, run: generate(data.options) }); }
            catch (error) { root.postMessage({ id: data.id, error: String(error) }); }
        };
    }
}(globalThis));
