const CONFIG = {
    userName: 'Ahmed Bou-Rabee',
    defaultThumbnail: 'images/default_thumbnail.svg'
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeCollapsibles();
        renderPublications();
        handleDeepLink();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

window.addEventListener('hashchange', handleDeepLink);

function initializeCollapsibles() {
    document.querySelectorAll('.collapsible').forEach(collapsible => {
        const content = document.getElementById(collapsible.getAttribute('aria-controls'));
        const startsOpen = collapsible.getAttribute('aria-expanded') === 'true';
        if (content) {
            content.hidden = !startsOpen;
            content.inert = !startsOpen;
            content.setAttribute('aria-hidden', String(!startsOpen));
            if (startsOpen) {
                content.classList.add('show');
                content.style.maxHeight = 'none';
            }
        }

        const toggle = () => {
            const isExpanded = collapsible.getAttribute('aria-expanded') === 'true';
            const p = setCollapsibleOpen(collapsible, !isExpanded);
            if (p) p.catch(() => { /* superseded */ });
        };
        collapsible.addEventListener('click', toggle);
    });
}

function setCollapsibleOpen(collapsible, open) {
    collapsible.setAttribute('aria-expanded', String(open));
    const content = document.getElementById(collapsible.getAttribute('aria-controls'));
    if (!content) return Promise.resolve();
    return animateExpand(content, open);
}

const animState = new WeakMap();

function animateExpand(el, open) {
    // Supersede any in-flight animation on the same element.
    const prev = animState.get(el);
    if (prev) prev.abort();

    return new Promise((resolve, reject) => {
        // Short-circuit when already at the requested state.
        const fullyOpen = !el.hidden && el.classList.contains('show') && el.style.maxHeight === 'none';
        const fullyClosed = el.hidden && !el.classList.contains('show') && !el.style.maxHeight;
        if (open && fullyOpen) { resolve(); return; }
        if (!open && fullyClosed) { resolve(); return; }

        let onEnd;
        let timeoutId;

        const finalize = () => {
            if (animState.get(el) !== state) return; // superseded
            animState.delete(el);
            el.removeEventListener('transitionend', onEnd);
            clearTimeout(timeoutId);
            if (open && el.classList.contains('show')) {
                // Lift the max-height cap so the content can grow (images
                // loading, nested expansion) without clipping on mobile.
                el.style.maxHeight = 'none';
            } else if (!open && !el.classList.contains('show')) {
                el.hidden = true;
            }
            resolve();
        };

        // Reject on abort so dependent flows (e.g. deep-link scroll) can
        // opt out when the animation they're waiting on has been superseded.
        const abort = () => {
            if (animState.get(el) !== state) return;
            animState.delete(el);
            el.removeEventListener('transitionend', onEnd);
            clearTimeout(timeoutId);
            reject(new Error('animation superseded'));
        };

        onEnd = (e) => {
            if (e.propertyName !== 'max-height' || e.target !== el) return;
            finalize();
        };

        const state = { abort };
        animState.set(el, state);

        if (open) {
            el.hidden = false;
            el.inert = false;
            el.setAttribute('aria-hidden', 'false');
            if (!el.classList.contains('show')) el.classList.add('show');
            el.style.maxHeight = el.scrollHeight + 'px';
        } else {
            el.inert = true;
            el.setAttribute('aria-hidden', 'true');
            el.style.maxHeight = el.scrollHeight + 'px';
            void el.offsetHeight; // flush the freeze so the next change transitions
            el.classList.remove('show');
            el.style.maxHeight = '';
        }

        el.addEventListener('transitionend', onEnd);
        const duration = parseTransitionDurationMs(el);
        timeoutId = setTimeout(finalize, duration + 120);
    });
}

function parseTransitionDurationMs(el) {
    const dur = getComputedStyle(el).transitionDuration.split(',')[0].trim();
    let ms = 0;
    if (dur.endsWith('ms')) ms = parseFloat(dur);
    else if (dur.endsWith('s')) ms = parseFloat(dur) * 1000;
    return Number.isFinite(ms) && ms > 0 ? ms : 500;
}

function openSectionById(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return null;
    const collapsible = section.querySelector('.collapsible');
    if (!collapsible) return Promise.resolve();
    return setCollapsibleOpen(collapsible, true);
}

function handleDeepLink() {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    };

    const onOpened = () => scrollTo(hash);
    const ignoreAbort = () => { /* animation was superseded; skip scroll */ };

    if (hash.startsWith('pub-')) {
        const done = openSectionById('publications');
        if (done) done.then(onOpened, ignoreAbort);
        return;
    }

    const done = openSectionById(hash);
    if (done) done.then(onOpened, ignoreAbort);
}

function renderPublications() {
    const container = document.getElementById('publications-content');
    if (!container) {
        throw new Error('Publications container not found');
    }

    const fragment = document.createDocumentFragment();
    publications.forEach(pub => fragment.appendChild(createPublicationElement(pub)));

    container.innerHTML = '';
    container.appendChild(fragment);
}

function createPublicationElement(pub) {
    const pubDiv = document.createElement('div');
    pubDiv.classList.add('publication');
    pubDiv.id = `pub-${pub.id}`;

    const primaryLink = getPrimaryLink(pub.links);
    pubDiv.appendChild(createThumbnailLink(pub, primaryLink));

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('pub-content');

    appendTitle(contentWrapper, pub);
    appendAuthors(contentWrapper, pub.authors);
    appendJournalInfo(contentWrapper, pub);
    appendAbstract(contentWrapper, pub.id, pub.abstract);
    appendLinks(contentWrapper, pub.links);

    pubDiv.appendChild(contentWrapper);
    return pubDiv;
}

function isRealUrl(url) {
    return typeof url === 'string' && url.length > 0 && url !== '#';
}

function getPrimaryLink(links) {
    const safeLinks = links || [];
    const arxivLink = safeLinks.find(l => l.type.toLowerCase() === 'arxiv' && isRealUrl(l.url));
    const journalLink = safeLinks.find(l => l.type.toLowerCase() === 'journal' && isRealUrl(l.url));
    const firstReal = safeLinks.find(l => isRealUrl(l.url));
    return (arxivLink || journalLink || firstReal || { url: '#' }).url;
}

function createThumbnailLink(pub, primaryLink) {
    const hasLink = isRealUrl(primaryLink);
    const container = document.createElement(hasLink ? 'a' : 'span');
    container.classList.add('thumbnail-link');
    if (hasLink) {
        container.href = primaryLink;
        container.target = '_blank';
        container.rel = 'noopener noreferrer';
    }

    const imgEl = document.createElement('img');
    imgEl.src = pub.thumbnail || CONFIG.defaultThumbnail;
    imgEl.alt = pub.altText || `Figure for: ${pub.title}`;
    imgEl.classList.add('pub-thumbnail');
    imgEl.loading = 'lazy';

    container.appendChild(imgEl);
    if (pub.thumbnailAnimation) {
        const canvas = document.createElement('canvas');
        canvas.width = 420;
        canvas.height = 420;
        canvas.classList.add('pub-thumbnail', 'pub-thumbnail-canvas');
        canvas.setAttribute('aria-hidden', 'true');
        container.appendChild(canvas);
        attachPublicationThumbnailAnimation(canvas, pub.thumbnailAnimation);
    }
    return container;
}

function attachPublicationThumbnailAnimation(canvas, kind) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = false;
    let raf = 0;
    let start = 0;

    const mix = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
    const hash = (x, y) => {
        let z = (Math.imul(x + 37, 0x45d9f3b) ^ Math.imul(y + 71, 0x119de1f3)) >>> 0;
        z = Math.imul(z ^ (z >>> 16), 0x45d9f3b) >>> 0;
        return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
    };

    function ground() {
        const g = ctx.createLinearGradient(0, 0, W, W);
        g.addColorStop(0, '#10141f');
        g.addColorStop(1, '#24192c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, W);
    }

    function drawParking(t) {
        ground();
        const n = 14, pad = 21, cell = (W - 2 * pad) / n;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const pulse = Math.max(0, Math.sin(.8 * x + .61 * y + t * 1.7));
            ctx.fillStyle = `rgba(205,82,122,${(.025 + .13 * pulse * pulse).toFixed(3)})`;
            ctx.fillRect(pad + x * cell + 1, pad + y * cell + 1, cell - 2, cell - 2);
        }
        ctx.strokeStyle = 'rgba(226,218,200,.11)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const q = pad + i * cell;
            ctx.moveTo(pad, q); ctx.lineTo(W - pad, q);
            ctx.moveTo(q, pad); ctx.lineTo(q, W - pad);
        }
        ctx.stroke();

        const spots = [[2,2],[7,1],[12,3],[4,9],[9,7],[11,12],[2,12]];
        ctx.strokeStyle = '#68c7ea'; ctx.lineWidth = 4;
        spots.forEach(p => {
            ctx.beginPath();
            ctx.arc(pad + (p[0] + .5) * cell, pad + (p[1] + .5) * cell, cell * .22, 0, Math.PI * 2);
            ctx.stroke();
        });

        const paths = [
            [[1,11],[2,11],[2,10],[2,9],[3,9],[3,8],[4,8],[4,9]],
            [[11,1],[11,2],[11,3],[10,3],[10,4],[10,5],[9,5],[9,6],[9,7]],
            [[13,10],[12,10],[12,11],[11,11],[11,12]]
        ];
        const colors = ['#f2c861','#ee9a55','#f0d96b'];
        paths.forEach((path, j) => {
            const q = (t * (.19 + .018 * j) + .24 * j) % 1;
            const progress = Math.min(1, q / .72);
            const u = progress * (path.length - 1), k = Math.min(path.length - 2, Math.floor(u)), a = u - k;
            ctx.beginPath();
            path.forEach((p, i) => {
                const x = pad + (p[0] + .5) * cell, y = pad + (p[1] + .5) * cell;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = colors[j]; ctx.globalAlpha = .62; ctx.lineWidth = 3; ctx.stroke();
            ctx.globalAlpha = 1;
            const p = path[k], r = path[k + 1];
            const x = pad + (mix(p[0], r[0], a) + .5) * cell;
            const y = pad + (mix(p[1], r[1], a) + .5) * cell;
            ctx.beginPath(); ctx.arc(x, y, cell * .25, 0, Math.PI * 2);
            if (q < .72) {
                ctx.fillStyle = colors[j]; ctx.fill();
                ctx.strokeStyle = '#10141f'; ctx.lineWidth = 3; ctx.stroke();
            } else {
                ctx.globalAlpha = q < .9 ? 1 : Math.max(0, (1 - q) / .1);
                ctx.fillStyle = '#68c7ea'; ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }

    const PERC_N = 23;
    const percField = (() => {
        let a = new Float32Array(PERC_N * PERC_N);
        for (let y = 0; y < PERC_N; y++) for (let x = 0; x < PERC_N; x++) a[y * PERC_N + x] = hash(x, y);
        for (let pass = 0; pass < 4; pass++) {
            const b = new Float32Array(a.length);
            for (let y = 0; y < PERC_N; y++) for (let x = 0; x < PERC_N; x++) {
                let s = 2 * a[y * PERC_N + x], m = 2;
                [[1,0],[-1,0],[0,1],[0,-1]].forEach(d => {
                    const xx = x + d[0], yy = y + d[1];
                    if (xx >= 0 && xx < PERC_N && yy >= 0 && yy < PERC_N) { s += a[yy * PERC_N + xx]; m++; }
                });
                b[y * PERC_N + x] = s / m;
            }
            a = b;
        }
        return a;
    })();

    function drawPercolation(t) {
        ground();
        const pad = 19, cell = (W - 2 * pad) / PERC_N;
        const wave = .5 - .5 * Math.cos(2 * Math.PI * ((t * .085) % 1));
        const threshold = .61 - .12 * wave;
        const active = new Uint8Array(PERC_N * PERC_N);
        for (let i = 0; i < active.length; i++) active[i] = percField[i] > threshold ? 1 : 0;
        let best = [], seen = new Uint8Array(active.length);
        for (let i = 0; i < active.length; i++) if (active[i] && !seen[i]) {
            const stack = [i], component = []; seen[i] = 1;
            while (stack.length) {
                const v = stack.pop(), x = v % PERC_N, y = (v / PERC_N) | 0;
                component.push(v);
                [[1,0],[-1,0],[0,1],[0,-1]].forEach(d => {
                    const xx = x + d[0], yy = y + d[1], u = yy * PERC_N + xx;
                    if (xx >= 0 && xx < PERC_N && yy >= 0 && yy < PERC_N && active[u] && !seen[u]) {
                        seen[u] = 1; stack.push(u);
                    }
                });
            }
            if (component.length > best.length) best = component;
        }
        const largest = new Uint8Array(active.length);
        best.forEach(i => { largest[i] = 1; });
        for (let y = 0; y < PERC_N; y++) for (let x = 0; x < PERC_N; x++) {
            const i = y * PERC_N + x;
            ctx.fillStyle = largest[i] ? '#56b4e9' : active[i] ? '#8b719d' : 'rgba(133,147,181,.10)';
            ctx.fillRect(pad + x * cell + .8, pad + y * cell + .8, cell - 1.6, cell - 1.6);
        }
        ctx.strokeStyle = '#f0d96b'; ctx.lineWidth = 2;
        best.forEach(i => {
            const x = i % PERC_N, y = (i / PERC_N) | 0;
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(d => {
                const xx = x + d[0], yy = y + d[1];
                if (xx < 0 || xx >= PERC_N || yy < 0 || yy >= PERC_N || !largest[yy * PERC_N + xx]) {
                    const x0 = pad + x * cell, y0 = pad + y * cell;
                    ctx.beginPath();
                    if (d[0] === 1) { ctx.moveTo(x0 + cell, y0); ctx.lineTo(x0 + cell, y0 + cell); }
                    if (d[0] === -1) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cell); }
                    if (d[1] === 1) { ctx.moveTo(x0, y0 + cell); ctx.lineTo(x0 + cell, y0 + cell); }
                    if (d[1] === -1) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cell, y0); }
                    ctx.stroke();
                }
            });
        });
    }

    function draw(now) {
        if (!start) start = now || performance.now();
        const t = ((now || start) - start) / 1000;
        if (kind === 'parking') drawParking(t);
        else if (kind === 'divisible-percolation') drawPercolation(t);
    }
    function frame(now) {
        if (!running) return;
        draw(now);
        raf = requestAnimationFrame(frame);
    }
    function play() {
        if (reduced || running || document.hidden) return;
        running = true;
        raf = requestAnimationFrame(frame);
    }
    function pause() {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
    }

    draw(performance.now() + (reduced ? 3200 : 0));
    if (!reduced && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) play(); else pause();
        }, { threshold: .12 });
        requestAnimationFrame(() => observer.observe(canvas));
    } else if (!reduced) {
        play();
    }
    document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
}

function appendTitle(wrapper, pub) {
    const titleRow = document.createElement('div');
    titleRow.classList.add('pub-title-row');

    const titleEl = document.createElement('h3');
    titleEl.innerHTML = `<em>${pub.title}</em>`;
    titleRow.appendChild(titleEl);

    const meta = document.createElement('div');
    meta.classList.add('pub-meta-buttons');
    meta.appendChild(createPermalinkButton(pub));
    meta.appendChild(createBibtexButton(pub));
    titleRow.appendChild(meta);

    wrapper.appendChild(titleRow);
}

function createPermalinkButton(pub) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('icon-btn');
    btn.setAttribute('aria-label', 'Copy link to this publication');
    btn.title = 'Copy permalink';
    btn.innerHTML = '<span class="btn-mark" aria-hidden="true">#</span>';
    btn.addEventListener('click', () => {
        const base = location.href.split('#')[0];
        const url = `${base}#pub-${pub.id}`;
        copyToClipboard(url, btn, 'Link copied');
        history.replaceState(null, '', `#pub-${pub.id}`);
    });
    return btn;
}

function createBibtexButton(pub) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('icon-btn');
    btn.setAttribute('aria-label', 'Copy BibTeX for this publication');
    btn.title = 'Copy BibTeX';
    btn.innerHTML = '<span class="btn-mark" aria-hidden="true">@</span>';
    btn.addEventListener('click', () => {
        copyToClipboard(buildBibtex(pub), btn, 'BibTeX copied');
    });
    return btn;
}

function buildBibtex(pub) {
    const authorStr = pub.authors.map(a => a.name).join(' and ');
    const arxivLink = (pub.links || []).find(l => l.type.toLowerCase() === 'arxiv' && isRealUrl(l.url));
    const arxivId = arxivLink ? arxivLink.url.replace(/.*arxiv\.org\/abs\//i, '').replace(/\/$/, '') : null;

    const isPublished = !!pub.journal && !pub.status;
    const entryType = isPublished ? 'article' : 'unpublished';

    const lines = [`@${entryType}{${pub.id.replace(/-/g, '_')},`];
    lines.push(`  author  = {${authorStr}},`);
    const bibtexTitle = pub.bibtexTitle || htmlToPlainText(pub.title);
    lines.push(`  title   = {${bibtexTitle}},`);
    if (pub.journal) lines.push(`  journal = {${pub.journal}},`);
    if (pub.volume) lines.push(`  volume  = {${pub.volume}},`);
    if (pub.pages) lines.push(`  pages   = {${pub.pages}},`);
    if (pub.year) lines.push(`  year    = {${pub.year}},`);
    if (pub.status) lines.push(`  note    = {${pub.status}},`);
    if (arxivId) lines.push(`  eprint  = {${arxivId}},\n  archivePrefix = {arXiv},`);
    lines.push('}');
    return lines.join('\n');
}

function htmlToPlainText(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return (template.content.textContent || '').trim();
}

function copyToClipboard(text, btn, successMsg) {
    const done = () => flashButton(btn, successMsg);
    const failed = () => flashButton(btn, 'Copy failed');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text) ? done() : failed());
    } else {
        fallbackCopy(text) ? done() : failed();
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* noop */ }
    document.body.removeChild(ta);
    return copied;
}

function flashButton(btn, msg) {
    const existing = btn.querySelector('.copy-toast');
    if (existing) existing.remove();
    const toast = document.createElement('span');
    toast.className = 'copy-toast';
    toast.textContent = msg;
    btn.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
}

function appendAuthors(wrapper, authors) {
    if (authors && authors.length) {
        const authorsEl = document.createElement('p');
        authorsEl.innerHTML = formatAuthors(authors, CONFIG.userName);
        wrapper.appendChild(authorsEl);
    }
}

function appendJournalInfo(wrapper, pub) {
    if (!pub.journal && !pub.year && !pub.status) return;
    const journalInfo = document.createElement('p');
    const parts = [];
    if (pub.journal) parts.push(`<strong>${pub.journal}</strong>`);
    const locator = [];
    if (pub.volume) locator.push(pub.volume);
    if (pub.pages) locator.push(pub.pages);
    if (locator.length) parts.push(locator.join(': '));
    if (pub.year) parts.push(`(${pub.year})`);
    if (pub.status) parts.push(pub.status);
    journalInfo.innerHTML = parts.join(' ') + '.';
    wrapper.appendChild(journalInfo);
}

function appendAbstract(wrapper, publicationId, abstract) {
    if (!abstract) return;

    const abstractBtn = document.createElement('button');
    const abstractId = `abstract-${publicationId}`;
    abstractBtn.type = 'button';
    abstractBtn.classList.add('abstract-btn');
    abstractBtn.textContent = 'Summary';
    abstractBtn.setAttribute('aria-expanded', 'false');
    abstractBtn.setAttribute('aria-controls', abstractId);
    wrapper.appendChild(abstractBtn);

    const abstractContent = document.createElement('div');
    abstractContent.id = abstractId;
    abstractContent.classList.add('abstract-content');
    abstractContent.innerHTML = abstract;
    abstractContent.hidden = true;
    abstractContent.inert = true;
    abstractContent.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(abstractContent);

    abstractBtn.addEventListener('click', () => {
        const willShow = abstractContent.hidden || !abstractContent.classList.contains('show');
        abstractBtn.setAttribute('aria-expanded', String(willShow));
        animateExpand(abstractContent, willShow).catch(() => { /* superseded */ });
    });
}

function appendLinks(wrapper, links) {
    if (!links || !links.length) return;

    const linksDiv = document.createElement('div');
    linksDiv.classList.add('sub-buttons');

    links.forEach(link => {
        const typeKey = link.type.toLowerCase();
        const placeholder = !isRealUrl(link.url);

        const linkBtn = document.createElement(placeholder ? 'button' : 'a');
        linkBtn.classList.add('resource-btn', `resource-btn--${typeKey}`);
        if (placeholder) {
            linkBtn.type = 'button';
            linkBtn.classList.add('resource-btn--placeholder');
            linkBtn.disabled = true;
            linkBtn.title = 'Link not yet available';
        } else {
            linkBtn.href = link.url;
            linkBtn.target = '_blank';
            linkBtn.rel = 'noopener noreferrer';
        }

        linkBtn.textContent = capitalizeFirstLetter(link.type);
        linkBtn.setAttribute('aria-label', `${link.type} link`);
        linksDiv.appendChild(linkBtn);
    });
    wrapper.appendChild(linksDiv);
}

function formatAuthors(authors, userName) {
    if (authors.length === 0) return '';
    if (authors.length === 1) return `${formatAuthor(authors[0])}.`;

    const userIndex = authors.findIndex(a => a.name === userName);
    if (userIndex === 0) {
        const otherAuthors = authors.slice(1);
        return otherAuthors.length === 1
            ? `${formatAuthor(authors[0])} with ${formatAuthor(otherAuthors[0])}.`
            : `${formatAuthor(authors[0])} with ${formatAuthorList(otherAuthors, true)}.`;
    }
    return `${formatAuthorList(authors)}.`;
}

function formatAuthorList(authors, addAnd = false) {
    if (authors.length === 1) return formatAuthor(authors[0]);
    if (authors.length === 2) {
        return addAnd
            ? `${formatAuthor(authors[0])} and ${formatAuthor(authors[1])}`
            : `${formatAuthor(authors[0])}, ${formatAuthor(authors[1])}`;
    }
    const allButLast = authors.slice(0, -1).map(formatAuthor).join(', ');
    const lastAuthor = formatAuthor(authors[authors.length - 1]);
    return `${allButLast}, and ${lastAuthor}`;
}

function formatAuthor(author) {
    return author.url
        ? `<a href="${author.url}" target="_blank" rel="noopener noreferrer">${author.name}</a>`
        : author.name;
}

function capitalizeFirstLetter(string) {
    const exceptions = { arxiv: 'arXiv' };
    const lower = string.toLowerCase();
    return exceptions[lower] || (string.charAt(0).toUpperCase() + string.slice(1));
}
