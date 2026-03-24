/**
 * Global observer to manage which timeline item is currently active on the screen.
 * @type {IntersectionObserver|null}
 */
let timelineObserver = null;

/**
 * Flag to prevent the observer from firing while the user is clicking to scroll.
 * @type {boolean}
 */
let isManualScrolling = false;

/**
 * Timeout reference to reset the manual scrolling flag.
 * @type {number|null}
 */
let scrollTimeout = null;

/**
 * Retrieves the main message blocks from the DOM, ensuring no nested duplicates are included.
 * @returns {Array<Element>} Array of root chat block elements.
 */
function getMessageBlocks() {
    const selectors = 'user-query, model-response, message-row, chunked-message, [data-message-author], [data-test-id*="message"]';
    const blocks = Array.from(document.querySelectorAll(selectors));
    return blocks.filter(block => !block.parentElement.closest(selectors));
}

/**
 * Extracts a meaningful preview string from the message block.
 * @param {Element} block The message block element.
 * @returns {Object} An object containing the preview text and an optional icon.
 */
function getPreviewData(block) {
    let p = block.querySelector('p');
    if (p && p.textContent.trim().length > 0) {
        return {text: cleanText(p.textContent), icon: null};
    }

    let codeHeader = block.querySelector('.code-block-decoration');
    if (codeHeader) {
        let langSpan = codeHeader.querySelector('.bg-lang-name');
        let language = langSpan ? langSpan.textContent.trim() : '';

        if (!language) {
            let fallbackSpan = codeHeader.querySelector('span:not(.mat-icon)');
            if (fallbackSpan) {
                language = fallbackSpan.textContent.trim();
            }
        }

        if (language) {
            let previewText = language;
            const codeContainer = block.querySelector('code');
            const codeText = codeContainer ? codeContainer.textContent : '';
            const fileName = extractCodeMetadata(codeText, language);

            if (fileName) {
                previewText += ' - ' + fileName;
            } else {
                previewText += ' Code';
            }

            return {text: previewText, icon: getLanguageIcon(language)};
        }
    }
    return {text: cleanText(block.textContent), icon: null};
}

/**
 * Creates and injects the timeline container into the DOM.
 * @returns {HTMLElement} The timeline container element.
 */
function createTimelineContainer() {
    const container = document.createElement('div');
    container.id = 'better-gemini-timeline';

    const line = document.createElement('div');
    line.className = 'bg-timeline-line';
    container.appendChild(line);

    const itemsContainer = document.createElement('div');
    itemsContainer.id = 'bg-timeline-items';
    container.appendChild(itemsContainer);

    document.body.appendChild(container);

    window.addEventListener('scroll', () => {
        const tooltip = document.getElementById('bg-global-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }, {passive: true, capture: true});

    return container;
}

/**
 * Creates or retrieves the single global tooltip element attached to the body.
 * @returns {HTMLElement} The global tooltip element.
 */
function createGlobalTooltip() {
    let tooltip = document.getElementById('bg-global-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'bg-global-tooltip';
        tooltip.className = 'timeline-global-tooltip';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'google-symbols timeline-icon';
        iconSpan.id = 'bg-global-tooltip-icon';

        const textSpan = document.createElement('span');
        textSpan.className = 'timeline-text';
        textSpan.id = 'bg-global-tooltip-text';

        tooltip.appendChild(iconSpan);
        tooltip.appendChild(textSpan);
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

/**
 * Updates the timeline items and configures the IntersectionObserver for precise scroll tracking.
 */
function updateTimeline() {
    const container = document.getElementById('better-gemini-timeline') || createTimelineContainer();
    const itemsContainer = document.getElementById('bg-timeline-items');

    const globalTooltip = createGlobalTooltip();
    const tooltipIcon = document.getElementById('bg-global-tooltip-icon');
    const tooltipText = document.getElementById('bg-global-tooltip-text');

    const dialogBlocks = getMessageBlocks();
    let processedCount = 0;

    if (!timelineObserver) {
        timelineObserver = new IntersectionObserver(() => {
            if (isManualScrolling) {
                return;
            }

            const blocks = getMessageBlocks();
            let activeBlock = null;

            for (let i = 0; i < blocks.length; i++) {
                const rect = blocks[i].getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.2) {
                    activeBlock = blocks[i];
                    break;
                }
            }

            if (activeBlock) {
                const targetId = activeBlock.getAttribute('data-bg-id');
                const activeLink = document.getElementById('timeline-link-' + targetId);
                if (activeLink && !activeLink.classList.contains('active')) {
                    document.querySelectorAll('.timeline-item.active').forEach(el => el.classList.remove('active'));
                    activeLink.classList.add('active');
                }
            }
        }, {threshold: [0, 0.1, 0.5, 0.9]});
    }

    dialogBlocks.forEach((block, index) => {
        const textContent = cleanText(block.textContent);
        if (textContent.length === 0) {
            return;
        }

        processedCount++;
        const blockId = 'bg-block-' + index;

        if (!block.hasAttribute('data-bg-id')) {
            block.setAttribute('data-bg-id', blockId);
            timelineObserver.observe(block);
        }

        let link = document.getElementById('timeline-link-' + blockId);
        const isUser = block.tagName.toLowerCase() === 'user-query' ||
            block.tagName.toLowerCase() === 'user-message' ||
            block.getAttribute('data-message-author') === 'user' ||
            block.getAttribute('data-test-id') === 'user-message' ||
            (block.className && typeof block.className === 'string' && block.className.includes('user')) ||
            block.querySelector('[data-test-id="user-message"]') !== null;
        const defaultText = isUser ? getBgString('userPrompt') : getBgString('geminiResponse');

        if (!link) {
            link = document.createElement('a');
            link.href = '#';
            link.className = 'timeline-item ' + (isUser ? 'user' : 'gemini');
            link.id = 'timeline-link-' + blockId;

            const dot = document.createElement('div');
            dot.className = 'bg-timeline-dot';

            link.appendChild(dot);

            link.addEventListener('mouseenter', () => {
                const rect = link.getBoundingClientRect();

                const currentBlock = document.querySelector(`[data-bg-id="${blockId}"]`);
                let previewData = {text: '', icon: null};

                if (currentBlock) {
                    previewData = getPreviewData(currentBlock);
                }

                tooltipIcon.textContent = previewData.icon || (isUser ? 'person' : 'smart_toy');
                tooltipText.textContent = previewData.text || defaultText;

                globalTooltip.style.top = (rect.top + rect.height / 2) + 'px';
                globalTooltip.style.right = (window.innerWidth - rect.left + 12) + 'px';
                globalTooltip.classList.add('visible');
            });

            link.addEventListener('mouseleave', () => {
                globalTooltip.classList.remove('visible');
            });

            link.onclick = (e) => {
                e.preventDefault();
                isManualScrolling = true;
                clearTimeout(scrollTimeout);

                document.querySelectorAll('.timeline-item.active').forEach(el => el.classList.remove('active'));
                link.classList.add('active');

                block.scrollIntoView({behavior: 'smooth', block: 'center'});
                globalTooltip.classList.remove('visible');

                scrollTimeout = setTimeout(() => {
                    isManualScrolling = false;
                }, 800);
            };

            itemsContainer.appendChild(link);
        }
    });

    if (processedCount === 0) {
        container.style.display = 'none';
    } else {
        container.style.display = 'flex';
    }
}