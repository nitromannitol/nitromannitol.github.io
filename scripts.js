/**
 * Configuration object for the script
 * @type {Object}
 */
const CONFIG = {
    userName: 'Ahmed Bou-Rabee',
    defaultThumbnail: 'images/publications/default_thumbnail.jpg'
};

/**
 * Initializes the page when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeCollapsibles();
        renderPublications();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

/**
 * Initializes all collapsible sections with event listeners.
 * @throws {Error} If there's an issue with DOM manipulation
 */
function initializeCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible');
    
    collapsibles.forEach(collapsible => {
        collapsible.addEventListener('click', () => {
            const isExpanded = collapsible.getAttribute('aria-expanded') === 'true';
            collapsible.setAttribute('aria-expanded', String(!isExpanded));
            
            const contentId = collapsible.getAttribute('aria-controls');
            const content = document.getElementById(contentId);
            
            if (!content) {
                throw new Error(`Content element not found for id: ${contentId}`);
            }
            
            content.classList.toggle('show', !isExpanded);
        });
    });
}

/**
 * Renders the publications dynamically from the publications data.
 * @throws {Error} If there's an issue with DOM manipulation
 */
function renderPublications() {
    const container = document.getElementById('publications-content');
    if (!container) {
        throw new Error('Publications container not found');
    }

    const fragment = document.createDocumentFragment();
    
    publications.forEach(pub => {
        const pubDiv = createPublicationElement(pub);
        fragment.appendChild(pubDiv);
    });
    
    container.innerHTML = ''; // Clear existing content
    container.appendChild(fragment);
}

/**
 * Creates a DOM element for a single publication
 * @param {Object} pub - The publication object
 * @returns {HTMLElement} The created publication element
 */
function createPublicationElement(pub) {
    const pubDiv = document.createElement('div');
    pubDiv.classList.add('publication');

    const primaryLink = getPrimaryLink(pub.links);
    const thumbnailLink = createThumbnailLink(pub, primaryLink);
    pubDiv.appendChild(thumbnailLink);

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('pub-content');

    appendTitle(contentWrapper, pub.title);
    appendAuthors(contentWrapper, pub.authors);
    appendJournalInfo(contentWrapper, pub);
    appendAbstract(contentWrapper, pub.abstract);
    appendLinks(contentWrapper, pub.links);

    pubDiv.appendChild(contentWrapper);
    return pubDiv;
}

/**
 * Gets the primary link for a publication
 * @param {Array} links - Array of link objects
 * @returns {string} The URL of the primary link
 */
function getPrimaryLink(links) {
    const arxivLink = links.find(link => link.type.toLowerCase() === 'arxiv');
    const journalLink = links.find(link => link.type.toLowerCase() === 'journal');
    return (arxivLink || journalLink || { url: '#' }).url;
}

/**
 * Creates a thumbnail link element
 * @param {Object} pub - The publication object
 * @param {string} primaryLink - The primary link URL
 * @returns {HTMLElement} The created thumbnail link element
 */
function createThumbnailLink(pub, primaryLink) {
    const thumbnailLink = document.createElement('a');
    thumbnailLink.href = primaryLink;
    thumbnailLink.target = '_blank';
    thumbnailLink.rel = 'noopener noreferrer';
    thumbnailLink.classList.add('thumbnail-link');

    const imgEl = document.createElement('img');
    imgEl.src = pub.thumbnail || CONFIG.defaultThumbnail;
    imgEl.alt = `${pub.title} Thumbnail`;
    imgEl.classList.add('pub-thumbnail');
    imgEl.loading = 'lazy';

    thumbnailLink.appendChild(imgEl);
    return thumbnailLink;
}

/**
 * Appends the title to the content wrapper
 * @param {HTMLElement} wrapper - The content wrapper element
 * @param {string} title - The publication title
 */
function appendTitle(wrapper, title) {
    const titleEl = document.createElement('h3');
    titleEl.innerHTML = `<em>${title}</em>`;
    wrapper.appendChild(titleEl);
}

/**
 * Appends the authors to the content wrapper
 * @param {HTMLElement} wrapper - The content wrapper element
 * @param {Array} authors - Array of author objects
 */
function appendAuthors(wrapper, authors) {
    if (authors && authors.length) {
        const authorsEl = document.createElement('p');
        const authorsHTML = formatAuthors(authors, CONFIG.userName);
        authorsEl.innerHTML = authorsHTML;
        wrapper.appendChild(authorsEl);
    }
}

/**
 * Appends the journal info to the content wrapper
 * @param {HTMLElement} wrapper - The content wrapper element
 * @param {Object} pub - The publication object
 */
function appendJournalInfo(wrapper, pub) {
    if (pub.journal || pub.year) {
        const journalInfo = document.createElement('p');
        if (pub.journal) {
            journalInfo.innerHTML = `<strong>${pub.journal}</strong>`;
        }
        if (pub.volume || pub.pages || pub.year) {
            journalInfo.innerHTML += ` ${pub.volume || ''}${pub.pages ? ': ' + pub.pages : ''} (${pub.year || ''})`;
        }
        journalInfo.innerHTML += '.';
        wrapper.appendChild(journalInfo);
    }
}

/**
 * Appends the abstract to the content wrapper
 * @param {HTMLElement} wrapper - The content wrapper element
 * @param {string} abstract - The publication abstract
 */
function appendAbstract(wrapper, abstract) {
    if (abstract) {
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
            const isShown = abstractContent.classList.toggle('show');
            abstractBtn.setAttribute('aria-expanded', String(isShown));
        });
    }
}

/**
 * Appends the links to the content wrapper
 * @param {HTMLElement} wrapper - The content wrapper element
 * @param {Array} links - Array of link objects
 */
function appendLinks(wrapper, links) {
    if (links && links.length) {
        const linksDiv = document.createElement('div');
        linksDiv.classList.add('sub-buttons');
        
        links.forEach(link => {
            const linkBtn = document.createElement('button');
            linkBtn.classList.add('resource-btn');
            
            const iconClass = getLinkIconClass(link.type);
            linkBtn.innerHTML = `<i class="fas ${iconClass}"></i> ${capitalizeFirstLetter(link.type)}`;
            linkBtn.setAttribute('aria-label', `${link.type} link`);
            linkBtn.addEventListener('click', () => window.open(link.url, '_blank', 'noopener noreferrer'));
            linksDiv.appendChild(linkBtn);
        });
        wrapper.appendChild(linksDiv);
    }
}

/**
 * Formats the authors' list based on the number of authors and the user's name.
 * @param {Array} authors - Array of author objects with 'name' and 'url'.
 * @param {string} userName - The name to ignore
 * @returns {string} - The formatted authors' string.
 */
function formatAuthors(authors, userName) {
    if (authors.length === 0) {
        return '';
    }
    if (authors.length === 1) {
        return `${formatAuthor(authors[0])}.`;
    }

    const userIndex = authors.findIndex(author => author.name === userName);

    if (userIndex === 0) {
        const otherAuthors = authors.slice(1);
        return otherAuthors.length === 1
            ? `${formatAuthor(authors[0])} with ${formatAuthor(otherAuthors[0])}.`
            : `${formatAuthor(authors[0])} with ${formatAuthorList(otherAuthors, true)}.`;
    } else {
        return `${formatAuthorList(authors)}.`;
    }
}

/**
 * Formats a list of authors, adding 'and' before the last author if specified.
 * @param {Array} authors - Array of author objects with 'name' and 'url'.
 * @param {boolean} [addAnd=false] - Whether to add 'and' before the last author.
 * @returns {string} - The formatted authors' string.
 */
function formatAuthorList(authors, addAnd = false) {
    if (authors.length === 1) {
        return formatAuthor(authors[0]);
    } else if (authors.length === 2) {
        return addAnd
            ? `${formatAuthor(authors[0])} and ${formatAuthor(authors[1])}`
            : `${formatAuthor(authors[0])}, ${formatAuthor(authors[1])}`;
    } else {
        const allButLast = authors.slice(0, -1).map(formatAuthor).join(', ');
        const lastAuthor = formatAuthor(authors[authors.length - 1]);
        return `${allButLast}, and ${lastAuthor}`;
    }
}

/**
 * Formats a single author.
 * @param {Object} author - An author object with 'name' and 'url'.
 * @returns {string} - The formatted author string, possibly with a link.
 */
function formatAuthor(author) {
    return author.url
        ? `<a href="${author.url}" target="_blank" rel="noopener noreferrer">${author.name}</a>`
        : author.name;
}

/**
 * Returns the appropriate Font Awesome icon class based on the link type.
 * @param {string} type - The type of the link.
 * @returns {string} - The corresponding Font Awesome icon class.
 */
function getLinkIconClass(type) {
    const iconMap = {
        arxiv: 'fa-file-alt',
        blog: 'fa-blog',
        code: 'fa-code',
        journal: 'fa-book',
        appendix: 'fa-scroll',
        video: 'fa-video',
        notebook: 'fa-code',
        picture: 'fa-image',
    };
    return iconMap[type.toLowerCase()] || 'fa-external-link-alt';
}

/**
 * Capitalizes the first letter of a string, except for specific exceptions.
 * @param {string} string - The string to capitalize.
 * @returns {string} - The formatted string.
 */
function capitalizeFirstLetter(string) {
    const exceptions = {
        arxiv: 'arXiv'
    };
    
    const lowerCaseString = string.toLowerCase();
    
    return exceptions[lowerCaseString] || (string.charAt(0).toUpperCase() + string.slice(1));
}