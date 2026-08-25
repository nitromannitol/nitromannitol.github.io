const CONFIG = {
    userName: 'Ahmed Bou-Rabee',
    defaultThumbnail: 'images/publications/default_thumbnail.jpg'
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
        collapsible.setAttribute('role', 'button');
        if (!collapsible.hasAttribute('tabindex')) {
            collapsible.setAttribute('tabindex', '0');
        }
        const toggle = () => {
            const isExpanded = collapsible.getAttribute('aria-expanded') === 'true';
            const p = setCollapsibleOpen(collapsible, !isExpanded);
            if (p) p.catch(() => { /* superseded */ });
        };
        collapsible.addEventListener('click', toggle);
        collapsible.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
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
        const fullyOpen = el.classList.contains('show') && el.style.maxHeight === 'none';
        const fullyClosed = !el.classList.contains('show') && !el.style.maxHeight;
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
            if (!el.classList.contains('show')) el.classList.add('show');
            el.style.maxHeight = el.scrollHeight + 'px';
        } else {
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
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    appendAbstract(contentWrapper, pub.abstract);
    appendLinks(contentWrapper, pub.links);

    pubDiv.appendChild(contentWrapper);
    return pubDiv;
}

function isRealUrl(url) {
    return typeof url === 'string' && url.length > 0 && url !== '#';
}

function getPrimaryLink(links) {
    const arxivLink = links.find(l => l.type.toLowerCase() === 'arxiv' && isRealUrl(l.url));
    const journalLink = links.find(l => l.type.toLowerCase() === 'journal' && isRealUrl(l.url));
    const firstReal = links.find(l => isRealUrl(l.url));
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
    return container;
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
    btn.innerHTML = '<i class="fas fa-link"></i>';
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
    btn.innerHTML = '<i class="fas fa-quote-right"></i>';
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
    lines.push(`  title   = {${pub.title}},`);
    if (pub.journal) lines.push(`  journal = {${pub.journal}},`);
    if (pub.volume) lines.push(`  volume  = {${pub.volume}},`);
    if (pub.pages) lines.push(`  pages   = {${pub.pages}},`);
    if (pub.year) lines.push(`  year    = {${pub.year}},`);
    if (pub.status) lines.push(`  note    = {${pub.status}},`);
    if (arxivId) lines.push(`  eprint  = {${arxivId}},\n  archivePrefix = {arXiv},`);
    lines.push('}');
    return lines.join('\n');
}

function copyToClipboard(text, btn, successMsg) {
    const done = () => flashButton(btn, successMsg);
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else {
        fallbackCopy(text, done);
    }
}

function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* noop */ }
    document.body.removeChild(ta);
    done();
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

function appendAbstract(wrapper, abstract) {
    if (!abstract) return;

    const abstractBtn = document.createElement('button');
    abstractBtn.classList.add('abstract-btn');
    abstractBtn.innerHTML = '<i class="fas fa-book-open"></i> Summary';
    abstractBtn.setAttribute('aria-expanded', 'false');
    wrapper.appendChild(abstractBtn);

    const abstractContent = document.createElement('div');
    abstractContent.classList.add('abstract-content');
    abstractContent.innerHTML = abstract;
    wrapper.appendChild(abstractContent);

    abstractBtn.addEventListener('click', () => {
        const willShow = !abstractContent.classList.contains('show');
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

        const linkBtn = document.createElement('button');
        linkBtn.classList.add('resource-btn', `resource-btn--${typeKey}`);
        if (placeholder) {
            linkBtn.classList.add('resource-btn--placeholder');
            linkBtn.disabled = true;
            linkBtn.title = 'Link not yet available';
        }

        const iconClass = getLinkIconClass(link.type);
        linkBtn.innerHTML = `<i class="fas ${iconClass}"></i> ${capitalizeFirstLetter(link.type)}`;
        linkBtn.setAttribute('aria-label', `${link.type} link`);
        if (!placeholder) {
            linkBtn.addEventListener('click', () => window.open(link.url, '_blank', 'noopener noreferrer'));
        }
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

function getLinkIconClass(type) {
    const iconMap = {
        arxiv: 'fa-file-alt',
        pdf: 'fa-file-pdf',
        blog: 'fa-blog',
        quanta: 'fa-newspaper',
        code: 'fa-code',
        journal: 'fa-book',
        appendix: 'fa-scroll',
        video: 'fa-video',
        notebook: 'fa-code',
        picture: 'fa-image',
        pictures: 'fa-image',
    };
    return iconMap[type.toLowerCase()] || 'fa-external-link-alt';
}

function capitalizeFirstLetter(string) {
    const exceptions = { arxiv: 'arXiv' };
    const lower = string.toLowerCase();
    return exceptions[lower] || (string.charAt(0).toUpperCase() + string.slice(1));
}
