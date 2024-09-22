document.addEventListener('DOMContentLoaded', () => {
    initializeCollapsibles();
    renderPublications();
});

/**
 * Define the user's name to handle 'with ' appropriately.
 * Update this variable if your name changes or to handle different users.
 */
const userName = 'Ahmed Bou-Rabee';

/**
 * Initializes all collapsible sections with event listeners.
 */
function initializeCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible');
    
    collapsibles.forEach(collapsible => {
        collapsible.addEventListener('click', () => {
            const isExpanded = collapsible.getAttribute('aria-expanded') === 'true';
            collapsible.setAttribute('aria-expanded', String(!isExpanded));
            
            const contentId = collapsible.getAttribute('aria-controls');
            const content = document.getElementById(contentId);
            
            if (isExpanded) {
                content.classList.remove('show');
            } else {
                content.classList.add('show');
                // Scroll the collapsible section into view for better UX
                //content.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Renders the publications dynamically from the publications.js data.
 */
function renderPublications() {
    const container = document.getElementById('publications-content');
    container.innerHTML = ''; // Clear existing content
    
    publications.forEach(pub => {
        const pubDiv = document.createElement('div');
        pubDiv.classList.add('publication');

        // Determine the primary link for the thumbnail
        let primaryLink = '#';
        const arxivLink = pub.links.find(link => link.type.toLowerCase() === 'arxiv');
        if (arxivLink) {
            primaryLink = arxivLink.url;
        } else {
            const journalLink = pub.links.find(link => link.type.toLowerCase() === 'journal');
            if (journalLink) {
                primaryLink = journalLink.url;
            }
        }

        // Thumbnail Image Wrapped in <a> Tag
        const thumbnail = pub.thumbnail || 'images/publications/default_thumbnail.jpg'; // Default image path
        const thumbnailLink = document.createElement('a');
        thumbnailLink.href = primaryLink;
        thumbnailLink.target = '_blank';
        thumbnailLink.rel = 'noopener noreferrer';
        thumbnailLink.classList.add('thumbnail-link'); // For CSS styling

        const imgEl = document.createElement('img');
        imgEl.src = thumbnail;
        imgEl.alt = `${pub.title} Thumbnail`;
        imgEl.classList.add('pub-thumbnail');
        imgEl.loading = 'lazy'; // Optional: Lazy loading for performance

        thumbnailLink.appendChild(imgEl);
        pubDiv.appendChild(thumbnailLink);

        // Content Wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('pub-content');

        // Title
        const titleEl = document.createElement('h3');
        titleEl.innerHTML = `<em>${pub.title}</em>`;
        contentWrapper.appendChild(titleEl);

        // Authors
        if (pub.authors && pub.authors.length) {
            const authorsEl = document.createElement('p');
            const authorsHTML = formatAuthors(pub.authors, userName);
            authorsEl.innerHTML = authorsHTML;
            contentWrapper.appendChild(authorsEl);
        }

        // Journal Info
        if (pub.journal || pub.year) {
            const journalInfo = document.createElement('p');
            if (pub.journal) {
                journalInfo.innerHTML = `<strong>${pub.journal}</strong>`;
            }
            if (pub.volume || pub.pages || pub.year) {
                journalInfo.innerHTML += ` ${pub.volume || ''}${pub.pages ? ': ' + pub.pages : ''} (${pub.year || ''})`;
            }
            journalInfo.innerHTML += '.';
            contentWrapper.appendChild(journalInfo);
        }

        // Abstract Button and Content
        if (pub.abstract) {
            // Abstract Button
            const abstractBtn = document.createElement('button');
            abstractBtn.classList.add('abstract-btn');
            abstractBtn.innerHTML = '<i class="fas fa-book-open"></i> Summary';
            abstractBtn.setAttribute('aria-expanded', 'false'); // Accessibility
            contentWrapper.appendChild(abstractBtn);

            // Abstract Content
            const abstractContent = document.createElement('div');
            abstractContent.classList.add('abstract-content');
            abstractContent.innerHTML = pub.abstract;
            contentWrapper.appendChild(abstractContent);

            // Event Listener for Abstract Button
            abstractBtn.addEventListener('click', () => {
                const isShown = abstractContent.classList.toggle('show');
                abstractBtn.setAttribute('aria-expanded', isShown);
                
                // if (isShown) {
                //     // Allow time for the content to render before scrolling
                //     setTimeout(() => {
                //         abstractContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                //     }, 300); // Delay matches the CSS transition duration
                // }
            });
        }

        // Links
        if (pub.links && pub.links.length) {
            const linksDiv = document.createElement('div');
            linksDiv.classList.add('sub-buttons');
            
            pub.links.forEach(link => {
                const linkBtn = document.createElement('button');
                linkBtn.classList.add('resource-btn');
                
                const iconClass = getLinkIconClass(link.type);
                linkBtn.innerHTML = `<i class="fas ${iconClass}"></i> ${capitalizeFirstLetter(link.type)}`;
                linkBtn.setAttribute('aria-label', `${link.type} link`);
                linkBtn.addEventListener('click', () => window.open(link.url, '_blank', 'noopener noreferrer'));
                linksDiv.appendChild(linkBtn);
            });
            contentWrapper.appendChild(linksDiv);
        }

        pubDiv.appendChild(contentWrapper);
        container.appendChild(pubDiv);
    });
}

/**
 * Formats the authors' list based on the number of authors and the user's name.
 * @param {Array} authors - Array of author objects with 'name' and 'url'.
 * @param {string} userName - The user's name to handle special formatting.
 * @returns {string} - The formatted authors' string.
 */
function formatAuthors(authors, userName) {
    if (authors.length === 0) {
        return '';
    }
    if (authors.length === 1) {
        const author = authors[0];
        return formatAuthor(author) + '.';
    }

    const userIndex = authors.findIndex(author => author.name === userName);

    if (userIndex === 0) {
        // User is the first author
        const otherAuthors = authors.slice(1);
        if (otherAuthors.length === 1) {
            return `${formatAuthor(authors[0])} with ${formatAuthor(otherAuthors[0])}.`;
        } else {
            return `${formatAuthor(authors[0])} with ${formatAuthorList(otherAuthors, true)}.`;
        }
    } else {
        // User is not the first author
        return `${formatAuthorList(authors)}.`;
    }
}

/**
 * Formats a list of authors, adding 'and' before the last author if specified.
 * @param {Array} authors - Array of author objects with 'name' and 'url'.
 * @param {boolean} addAnd - Whether to add 'and' before the last author.
 * @returns {string} - The formatted authors' string.
 */
function formatAuthorList(authors, addAnd = false) {
    if (authors.length === 1) {
        return formatAuthor(authors[0]);
    } else if (authors.length === 2) {
        if (addAnd) {
            return `${formatAuthor(authors[0])} and ${formatAuthor(authors[1])}`;
        } else {
            return `${formatAuthor(authors[0])}, ${formatAuthor(authors[1])}`;
        }
    } else {
        // More than two authors
        const allButLast = authors.slice(0, -1).map(author => formatAuthor(author)).join(', ');
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
    if (author.url) {
        return `<a href="${author.url}" target="_blank" rel="noopener noreferrer">${author.name}</a>`;
    } else {
        return author.name;
    }
}

/**
 * Returns the appropriate Font Awesome icon class based on the link type.
 * @param {string} type - The type of the link.
 * @returns {string} - The corresponding Font Awesome icon class.
 */
function getLinkIconClass(type) {
    const iconMap = {
        'arxiv': 'fa-file-alt',
        'blog': 'fa-blog',
        'code': 'fa-code',
        'journal': 'fa-book',
        'appendix': 'fa-scroll',
        'video': 'fa-video',
        'notebook': 'fa-code',
        'picture': 'fa-image',
        // Add more mappings as needed
    };
    return iconMap[type.toLowerCase()] || 'fa-external-link-alt';
}

/**
 * Capitalizes the first letter of a string, except for specific exceptions.
 * Currently, "arxiv" is an exception and is formatted as "arXiv".
 * 
 * @param {string} string - The string to capitalize.
 * @returns {string} - The formatted string.
 */
function capitalizeFirstLetter(string) {
    const exceptions = {
        'arxiv': 'arXiv'
        // You can add more exceptions here if needed
        // e.g., 'doi': 'DOI', 'pdf': 'PDF'
    };
    
    const lowerCaseString = string.toLowerCase();
    
    if (exceptions.hasOwnProperty(lowerCaseString)) {
        return exceptions[lowerCaseString];
    }
    
    return string.charAt(0).toUpperCase() + string.slice(1);
}
