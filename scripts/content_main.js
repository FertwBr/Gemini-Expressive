/**
 * Timeout reference for debouncing the mutation observer.
 * @type {number|null}
 */
let debounceTimer = null;

let isApplyingTheme = false;

/**
 * Extension settings cache to respect user preferences.
 * @type {Object}
 */
let extensionSettings = {
    timelineEnabled: true,
    collapseEnabled: true,
    headersEnabled: true,
    codeNavEnabled: true,
    themeMode: 'auto',
    themeColor: '#0b57d0',
    snippets: [],
    snippetPrefix: '/',
    dynamicColorEnabled: true,
    hideUpgradeEnabled: false
};

/**
 * Applies CSS classes to the body to instantly hide/show features based on settings.
 * This is our "source of truth" to protect against Angular overwriting the body classes.
 */
function applyFeatureToggles() {
    if (document.body) {
        document.body.classList.toggle('bg-timeline-disabled', !extensionSettings.timelineEnabled);
        document.body.classList.toggle('bg-collapse-disabled', !extensionSettings.collapseEnabled);
        document.body.classList.toggle('bg-headers-disabled', !extensionSettings.headersEnabled);
        document.body.classList.toggle('bg-code-nav-disabled', !extensionSettings.codeNavEnabled);
        document.body.classList.toggle('bg-dynamic-theme-enabled', extensionSettings.dynamicColorEnabled);
        document.body.classList.toggle('bg-hide-upgrade', extensionSettings.hideUpgradeEnabled);
    }
}

/**
 * Applies dynamic themes specifically via the bundled or exposed theme utilities.
 */
function attemptThemeApplication() {
    applyFeatureToggles();

    if (!extensionSettings.dynamicColorEnabled) {
        return;
    }

    if (typeof applyMaterialTheme === 'function' && !isApplyingTheme) {
        isApplyingTheme = true;
        applyMaterialTheme(extensionSettings.themeColor, extensionSettings.themeMode);
        setTimeout(() => {
            isApplyingTheme = false;
        }, 150);
    }
}

/**
 * Closes any open native Material menus by targeting the backdrop.
 */
function closeNativeMenus() {
    const backdrop = document.querySelector('.cdk-overlay-backdrop');
    if (backdrop) {
        backdrop.click();
    } else {
        document.body.click();
    }
}

/**
 * Executes the sequence of clicks to select the theme from the native menu.
 * @param {Element} themeButton The native theme menu button element.
 * @param {string} targetMode The desired theme mode.
 */
function executeThemeClick(themeButton, targetMode) {
    themeButton.click();

    setTimeout(() => {
        const openMenus = document.querySelectorAll('.mat-mdc-menu-panel .mat-mdc-menu-content');
        const activeMenu = openMenus[openMenus.length - 1];

        if (activeMenu) {
            const options = activeMenu.querySelectorAll('[role="menuitemradio"]');
            let targetIndex = -1;

            const keywords = {
                light: ['light', 'claro', 'clair', 'hell', 'chiaro'],
                dark: ['dark', 'escur', 'oscur', 'sombre', 'dunkel', 'scuro'],
                auto: ['auto', 'system', 'sistema', 'padrão', 'standard', 'predeterminado', 'device', 'dispositivo']
            };

            for (let i = 0; i < options.length; i++) {
                const text = options[i].textContent.toLowerCase();
                if (keywords[targetMode].some(kw => text.includes(kw))) {
                    targetIndex = i;
                    break;
                }
            }

            if (targetIndex === -1 && options.length >= 3) {
                if (targetMode === 'light') targetIndex = 0;
                else if (targetMode === 'dark') targetIndex = 1;
                else if (targetMode === 'auto') targetIndex = 2;
            }

            if (targetIndex !== -1 && options[targetIndex]) {
                const currentState = options[targetIndex].getAttribute('aria-checked');
                if (currentState !== 'true') {
                    options[targetIndex].click();
                }
            }
        }

        setTimeout(() => {
            closeNativeMenus();
            if (targetMode === 'auto') {
                attemptThemeApplication();
            }
        }, 50);
    }, 150);
}

/**
 * Attempts to synchronize the extension's theme with Gemini's native theme setting.
 * @param {string} targetMode The theme mode to sync.
 */
function syncNativeTheme(targetMode) {
    try {
        const themeButton = document.querySelector('[data-test-id="desktop-theme-menu-button"]');

        if (!themeButton) {
            const settingsBtn = document.querySelector('button[aria-controls="settings-menu"]') ||
                Array.from(document.querySelectorAll('button')).find(b => {
                    const icon = b.querySelector('mat-icon');
                    return icon && icon.textContent.trim() === 'settings';
                });

            if (settingsBtn) {
                settingsBtn.click();
                setTimeout(() => {
                    const dynamicThemeBtn = document.querySelector('[data-test-id="desktop-theme-menu-button"]');
                    if (dynamicThemeBtn) {
                        executeThemeClick(dynamicThemeBtn, targetMode);
                    } else {
                        closeNativeMenus();
                    }
                }, 150);
            }
        } else {
            executeThemeClick(themeButton, targetMode);
        }
    } catch (e) {
    }
}

/**
 * Safely fetches the localized string, fallback to default if strings.js is delayed.
 * @returns {string} The text label for the Settings Menu
 */
function getExpressiveLabel() {
    return (typeof getBgString === 'function') ? getBgString('expressiveSettings') : 'Expressive Settings';
}

/**
 * Injects a settings shortcut button into the Gemini sidebar natively (Supports Desktop and Mobile).
 */
function injectSettingsShortcut() {
    const nativeSettingsBtns = document.querySelectorAll(
        'side-nav-action-button[data-test-id="settings-and-help-button"], ' +
        'button[data-test-id="mobile-settings-and-help-control"]'
    );

    nativeSettingsBtns.forEach(nativeBtn => {
        let wrapperToClone = nativeBtn;

        if (nativeBtn.tagName !== 'SIDE-NAV-ACTION-BUTTON' && nativeBtn.closest('side-nav-action-button')) {
            wrapperToClone = nativeBtn.closest('side-nav-action-button');
        }

        if (wrapperToClone.previousElementSibling && wrapperToClone.previousElementSibling.classList.contains('bg-expressive-settings-shortcut')) {
            return;
        }

        let customWrapper;
        let isMobile = false;

        if (wrapperToClone.tagName.includes('-')) {
            customWrapper = document.createElement('div');
            Array.from(wrapperToClone.attributes).forEach(attr => {
                if (attr.name !== 'id' && attr.name !== 'data-test-id') {
                    customWrapper.setAttribute(attr.name, attr.value);
                }
            });
            Array.from(wrapperToClone.childNodes).forEach(child => {
                customWrapper.appendChild(child.cloneNode(true));
            });
        } else {
            isMobile = true;
            customWrapper = wrapperToClone.cloneNode(true);
            customWrapper.removeAttribute('id');
        }

        customWrapper.classList.add('bg-expressive-settings-shortcut');

        customWrapper.removeAttribute('data-test-id');
        customWrapper.querySelectorAll('[data-test-id]').forEach(el => el.removeAttribute('data-test-id'));

        const button = customWrapper.tagName === 'BUTTON' ? customWrapper : customWrapper.querySelector('button');

        if (button) {
            button.classList.remove('mat-mdc-menu-trigger', 'mat-mdc-tooltip-trigger');
            button.removeAttribute('aria-controls');
            button.removeAttribute('aria-expanded');
            button.removeAttribute('aria-haspopup');
            button.removeAttribute('mattooltip');
            button.removeAttribute('mattooltipposition');
            button.removeAttribute('title');

            const labelText = getExpressiveLabel();
            button.setAttribute('aria-label', labelText);

            if (!isMobile) {
                let tooltip = document.getElementById('bg-expressive-sidebar-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'bg-expressive-sidebar-tooltip';
                    tooltip.className = 'bg-sidebar-tooltip';
                    document.body.appendChild(tooltip);
                }

                button.addEventListener('mouseenter', () => {
                    tooltip.textContent = getExpressiveLabel();
                    const expandedSidebar = document.querySelector('.sidenav-with-history-container.expanded');

                    if (!expandedSidebar) {
                        const rect = button.getBoundingClientRect();
                        tooltip.style.left = (rect.right + 8) + 'px';
                        tooltip.style.top = (rect.top + rect.height / 2) + 'px';
                        tooltip.classList.add('visible');
                    }
                });

                button.addEventListener('mouseleave', () => {
                    tooltip.classList.remove('visible');
                });
            }

            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tooltip = document.getElementById('bg-expressive-sidebar-tooltip');
                if (tooltip) tooltip.classList.remove('visible');
                chrome.runtime.sendMessage({action: 'openSettings'});
            });
        }

        if (isMobile) {
            const matIcon = customWrapper.querySelector('mat-icon');
            if (matIcon) {
                const customIcon = document.createElement('span');
                customIcon.className = 'bg-expressive-sidebar-icon mat-mdc-list-item-icon mdc-list-item__start';
                customIcon.style.setProperty('--bg-icon-url', `url(${chrome.runtime.getURL('assets/icons/expressive.svg')})`);
                matIcon.parentNode.replaceChild(customIcon, matIcon);
            }

            const textSpan = customWrapper.querySelector('.mdc-button__label .gds-label-l');
            if (textSpan) {
                textSpan.textContent = getExpressiveLabel();
                textSpan.removeAttribute('mattooltip');
                textSpan.classList.remove('mat-mdc-tooltip-trigger');
            }
        } else {
            const iconContainer = customWrapper.querySelector('.mat-mdc-list-item-icon, .icon-container');
            if (iconContainer) {
                iconContainer.textContent = '';
                const customIcon = document.createElement('span');
                customIcon.className = 'bg-expressive-sidebar-icon';
                customIcon.style.setProperty('--bg-icon-url', `url(${chrome.runtime.getURL('assets/icons/expressive.svg')})`);
                iconContainer.appendChild(customIcon);
            }

            const textContainer = customWrapper.querySelector('.mdc-list-item__primary-text');
            if (textContainer) {
                const innerSpan = textContainer.querySelector('span');
                if (innerSpan) {
                    innerSpan.textContent = getExpressiveLabel();
                } else {
                    textContainer.textContent = getExpressiveLabel();
                }
            }
        }

        wrapperToClone.parentNode.insertBefore(customWrapper, wrapperToClone);
    });
}

let snippetState = {
    isOpen: false,
    query: '',
    matches: [],
    activeIndex: 0,
    node: null,
    startOffset: 0,
    endOffset: 0
};

function closeSnippetMenu() {
    snippetState.isOpen = false;
    snippetState.matches = [];
    const menu = document.getElementById('bg-snippet-menu');
    if (menu) {
        menu.classList.remove('visible');
    }
}

function insertSnippet(snippet) {
    if (!snippetState.node) {
        return;
    }
    const range = document.createRange();
    range.setStart(snippetState.node, snippetState.startOffset);
    range.setEnd(snippetState.node, snippetState.endOffset);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const formattedContent = snippet.content.replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, formattedContent);

    const targetEditor = snippetState.node.parentElement ? snippetState.node.parentElement.closest('.ql-editor') : null;
    if (targetEditor) {
        targetEditor.dispatchEvent(new Event('input', {bubbles: true}));
    }

    closeSnippetMenu();
}

function renderSnippetMenu() {
    let menu = document.getElementById('bg-snippet-menu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'bg-snippet-menu';
        const inputContainer = document.querySelector('.text-input-field');
        if (inputContainer) {
            inputContainer.appendChild(menu);
        } else {
            document.body.appendChild(menu);
        }
    }

    menu.textContent = '';

    const header = document.createElement('div');
    header.className = 'bg-snippet-menu-header';

    const headerIcon = document.createElement('span');
    headerIcon.className = 'google-symbols';
    headerIcon.textContent = 'bolt';

    const headerText = document.createElement('span');
    headerText.textContent = getBgString('snippetsTitle');

    header.appendChild(headerIcon);
    header.appendChild(headerText);
    menu.appendChild(header);

    if (snippetState.matches.length === 0) {
        const emptyContainer = document.createElement('div');
        emptyContainer.className = 'bg-snippet-empty';

        const emptyText = document.createElement('span');
        emptyText.className = 'bg-snippet-empty-text';
        emptyText.textContent = getBgString('snippetDropdownEmpty');

        const addBtn = document.createElement('button');
        addBtn.className = 'bg-snippet-add-btn';
        if (snippetState.activeIndex === 0) {
            addBtn.classList.add('active');
        }

        const addIcon = document.createElement('span');
        addIcon.className = 'google-symbols';
        addIcon.textContent = 'add';
        addIcon.style.fontSize = '18px';

        const addText = document.createElement('span');
        addText.textContent = getBgString('snippetDropdownAdd');

        addBtn.appendChild(addIcon);
        addBtn.appendChild(addText);

        addBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSnippetMenu();
            window.open(chrome.runtime.getURL('options/snippets.html'), '_blank');
        });

        addBtn.addEventListener('mouseenter', () => {
            snippetState.activeIndex = 0;
            const allItems = menu.querySelectorAll('.bg-snippet-add-btn');
            allItems.forEach(i => i.classList.remove('active'));
            addBtn.classList.add('active');
        });

        emptyContainer.appendChild(emptyText);
        emptyContainer.appendChild(addBtn);
        menu.appendChild(emptyContainer);
    } else {
        snippetState.matches.forEach((snippet, index) => {
            const item = document.createElement('button');
            item.className = 'bg-snippet-menu-item';
            if (index === snippetState.activeIndex) {
                item.classList.add('active');
            }

            const iconContainer = document.createElement('div');
            iconContainer.className = 'bg-snippet-icon-container';
            const icon = document.createElement('span');
            icon.className = 'google-symbols';
            icon.textContent = 'edit_note';
            iconContainer.appendChild(icon);

            const textContainer = document.createElement('div');
            textContainer.className = 'bg-snippet-text-container';

            const keywordNode = document.createElement('span');
            keywordNode.className = 'bg-snippet-keyword';
            const cleanKw = snippet.keyword.replace(/^[/*!#@]+/, '');
            keywordNode.textContent = extensionSettings.snippetPrefix + cleanKw;

            const previewNode = document.createElement('span');
            previewNode.className = 'bg-snippet-preview';
            previewNode.textContent = snippet.content;

            textContainer.appendChild(keywordNode);
            textContainer.appendChild(previewNode);

            item.appendChild(iconContainer);
            item.appendChild(textContainer);

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                insertSnippet(snippet);
            });

            item.addEventListener('mouseenter', () => {
                snippetState.activeIndex = index;
                const allItems = menu.querySelectorAll('.bg-snippet-menu-item');
                allItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });

            menu.appendChild(item);
        });
    }

    menu.classList.add('visible');

    const activeItem = menu.querySelector('.bg-snippet-menu-item.active, .bg-snippet-add-btn.active');
    if (activeItem) {
        activeItem.scrollIntoView({block: 'nearest'});
    }
}

function openSnippetMenu(query, matches, node, startOffset, endOffset) {
    snippetState.isOpen = true;
    snippetState.query = query;
    snippetState.matches = matches;
    snippetState.activeIndex = 0;
    snippetState.node = node;
    snippetState.startOffset = startOffset;
    snippetState.endOffset = endOffset;
    renderSnippetMenu();
}

function checkSnippetTrigger() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
        closeSnippetMenu();
        return;
    }

    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
        closeSnippetMenu();
        return;
    }

    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
        closeSnippetMenu();
        return;
    }

    const editor = node.parentElement ? node.parentElement.closest('.ql-editor') : null;
    if (!editor) {
        closeSnippetMenu();
        return;
    }

    const text = node.textContent;
    const offset = range.startOffset;
    const textBeforeCursor = text.substring(0, offset);

    const safePrefix = extensionSettings.snippetPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp('(?:^|\\s)(' + safePrefix + '([\\w-]*))$');
    const match = textBeforeCursor.match(regex);

    if (match) {
        const fullTypedText = match[1];
        const searchWord = match[2].toLowerCase();

        let matches = [];
        if (extensionSettings.snippets && Array.isArray(extensionSettings.snippets)) {
            matches = extensionSettings.snippets.filter(s => {
                const cleanKw = s.keyword.replace(/^[/*!#@]+/, '').toLowerCase();
                return cleanKw.startsWith(searchWord);
            }).slice(0, 5);
        }

        const startOffset = offset - fullTypedText.length;
        openSnippetMenu(fullTypedText, matches, node, startOffset, offset);
    } else {
        closeSnippetMenu();
    }
}

function handleSnippetKeydown(event) {
    if (!snippetState.isOpen) {
        return;
    }

    const maxIndex = snippetState.matches.length > 0 ? snippetState.matches.length : 1;

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        snippetState.activeIndex = (snippetState.activeIndex + 1) % maxIndex;
        renderSnippetMenu();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        snippetState.activeIndex = (snippetState.activeIndex - 1 + maxIndex) % maxIndex;
        renderSnippetMenu();
    } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        if (snippetState.matches.length === 0) {
            closeSnippetMenu();
            window.open(chrome.runtime.getURL('options/snippets.html'), '_blank');
        } else {
            insertSnippet(snippetState.matches[snippetState.activeIndex]);
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeSnippetMenu();
    }
}

function handleSnippetKeyup(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === 'Tab' || event.key === 'Escape') {
        return;
    }
    checkSnippetTrigger();
}

function handleSnippetClick(event) {
    const menu = document.getElementById('bg-snippet-menu');
    if (menu && !menu.contains(event.target)) {
        closeSnippetMenu();
    }
}

/**
 * Main observer to track DOM changes and trigger necessary UI updates based on settings.
 * @type {MutationObserver}
 */
const observer = new MutationObserver((mutations) => {
    let themeChanged = false;
    for (const mutation of mutations) {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
            const target = mutation.target;
            if (target === document.body || target === document.documentElement) {
                themeChanged = true;
            }
        }
    }

    if (themeChanged) {
        applyFeatureToggles();

        if (extensionSettings.themeMode === 'auto' && !isApplyingTheme && extensionSettings.dynamicColorEnabled) {
            attemptThemeApplication();
        }
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        applyFeatureToggles();

        if (extensionSettings.collapseEnabled && typeof processCodeBlocks === 'function') {
            processCodeBlocks();
        }
        if (extensionSettings.headersEnabled && typeof enhanceCodeHeaders === 'function') {
            enhanceCodeHeaders();
        }
        if (extensionSettings.timelineEnabled && typeof updateTimeline === 'function') {
            updateTimeline();
        }

        injectSettingsShortcut();
    }, 800);
});

/**
 * Injects necessary UI CSS fixes to prevent layout breakages.
 */
function injectUIFixes() {
    if (!document.getElementById('bg-ui-fixes')) {
        const style = document.createElement('style');
        style.id = 'bg-ui-fixes';
        style.textContent = `
            .disclaimer-container .main-text,
            .disclaimer-container .content-container,
            .disclaimer-container.promo .main-text {
                background: transparent !important;
                color: var(--gem-sys-color--on-surface-variant) !important;
            }
            .disclaimer-container .action-button-wrapper button,
            .disclaimer-container button.action-button {
                background: transparent !important;
                background-color: transparent !important;
                color: var(--gem-sys-color--primary) !important;
                box-shadow: none !important;
            }
            .disclaimer-container .action-button-wrapper button .mdc-button__label,
            .disclaimer-container button.action-button .mdc-button__label {
                color: var(--gem-sys-color--primary) !important;
            }
            code-block, .code-block, .code-container {
                max-width: 100% !important;
            }
            pre {
                overflow-x: auto !important;
                max-width: 100% !important;
            }
            .code-block-decoration, .code-block-header, .header-formatted {
                border-top-left-radius: inherit;
                border-top-right-radius: inherit;
            }
            pre.bg-processed:not(.bg-collapsed) {
                padding-bottom: 56px !important;
            }
            
            .bg-code-nav {
                position: sticky;
                bottom: 16px;
                left: 50%;
                transform: translateX(-50%);
                width: max-content;
                display: flex;
                flex-direction: row;
                gap: 12px;
                z-index: 10;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                pointer-events: none;
                margin-top: -52px;
                margin-bottom: 16px;
            }
            .bg-code-nav-disabled .bg-code-nav {
                display: none !important;
            }
            code-block:hover .bg-code-nav, 
            .code-block:hover .bg-code-nav, 
            pre:hover ~ .bg-code-nav, 
            .bg-code-nav:hover {
                opacity: 1;
            }
            pre.bg-collapsed ~ .bg-code-nav {
                display: none !important;
            }
            .bg-code-nav-btn {
                background: var(--gem-sys-color--surface-container-highest, #36343b);
                color: var(--gem-sys-color--on-surface, #e3e2e6);
                border: 1px solid var(--gem-sys-color--outline-variant, #44474e);
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                transition: background 0.2s, transform 0.1s;
                pointer-events: auto;
            }
            .bg-code-nav-btn .google-symbols {
                margin: 0 !important;
                display: block !important;
                font-size: 24px;
                line-height: 1;
            }
            .bg-code-nav-btn:hover {
                background: var(--gem-sys-color--surface-variant, #44474e);
                transform: scale(1.05);
            }
            .bg-code-nav-btn:active {
                transform: scale(0.95);
            }
            
            .edit-button-area button.cancel-button .mdc-button__label {
                color: var(--gem-sys-color--primary) !important;
            }
            .edit-button-area button.update-button:not(:disabled) {
                background-color: var(--gem-sys-color--primary) !important;
            }
            .edit-button-area button.update-button:not(:disabled) .mdc-button__label {
                color: var(--gem-sys-color--on-primary) !important;
            }
            
            .code-block-decoration .buttons button.mdc-icon-button {
                width: 32px !important;
                height: 32px !important;
                padding: 0 !important; 
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .code-block-decoration .buttons button.mdc-icon-button mat-icon,
            .code-block-decoration .buttons button.mdc-icon-button .google-symbols {
                margin: 0 !important;
                display: block !important;
            }
            
            /* RESTORED FROM ORIGINAL CODE TO FIX COLLAPSE ICON COLOR */
            :root {
               --bg-svg-filter: none;
            }
            
            @media (prefers-color-scheme: dark) {
               :root {
                  --bg-svg-filter: invert(1);
               }
            }
            
            body.bg-dynamic-theme-enabled .bg-collapse-svg-icon {
               filter: invert(0); 
            }
            
            body.bg-dynamic-theme-enabled.dark-theme .bg-collapse-svg-icon {
               filter: invert(1);
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Initializes the extension by fetching settings, starting the observer, and listening for changes.
 */
function initializeExtension() {
    injectUIFixes();

    chrome.storage.local.get(['geminiSnippets'], (localItems) => {
        extensionSettings.snippets = localItems.geminiSnippets || [];
    });

    chrome.storage.sync.get(['timelineEnabled', 'collapseEnabled', 'codeNavEnabled', 'headersEnabled', 'themeMode', 'themeColor', 'snippetPrefix', 'dynamicColorEnabled', 'hideUpgradeEnabled'], (items) => {
        if (items.timelineEnabled !== undefined) {
            extensionSettings.timelineEnabled = items.timelineEnabled;
        }
        if (items.collapseEnabled !== undefined) {
            extensionSettings.collapseEnabled = items.collapseEnabled;
        }
        if (items.headersEnabled !== undefined) {
            extensionSettings.headersEnabled = items.headersEnabled;
        }
        if (items.codeNavEnabled !== undefined) {
            extensionSettings.codeNavEnabled = items.codeNavEnabled;
        }
        if (items.themeMode !== undefined) {
            extensionSettings.themeMode = items.themeMode;
        }
        if (items.themeColor !== undefined) {
            extensionSettings.themeColor = items.themeColor;
        }
        if (items.snippetPrefix !== undefined) {
            extensionSettings.snippetPrefix = items.snippetPrefix;
        }
        if (items.dynamicColorEnabled !== undefined) {
            extensionSettings.dynamicColorEnabled = items.dynamicColorEnabled;
        }
        if (items.hideUpgradeEnabled !== undefined) {
            extensionSettings.hideUpgradeEnabled = items.hideUpgradeEnabled;
        }

        attemptThemeApplication();

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (extensionSettings.themeMode === 'auto') {
                    attemptThemeApplication();
                }
            });
        }

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });

        if (document.documentElement) {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'data-theme']
            });
        }

        document.addEventListener('keydown', handleSnippetKeydown, true);
        document.addEventListener('keyup', handleSnippetKeyup, true);
        document.addEventListener('mousedown', handleSnippetClick, true);
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.geminiSnippets) {
                extensionSettings.snippets = changes.geminiSnippets.newValue || [];
            }
        }
        if (namespace === 'sync') {
            if (changes.themeMode) {
                extensionSettings.themeMode = changes.themeMode.newValue;
                syncNativeTheme(extensionSettings.themeMode);
            }
            if (changes.themeColor) {
                extensionSettings.themeColor = changes.themeColor.newValue;
            }
            if (changes.timelineEnabled) {
                extensionSettings.timelineEnabled = changes.timelineEnabled.newValue;
            }
            if (changes.collapseEnabled) {
                extensionSettings.collapseEnabled = changes.collapseEnabled.newValue;
            }
            if (changes.codeNavEnabled) {
                extensionSettings.codeNavEnabled = changes.codeNavEnabled.newValue;
            }
            if (changes.headersEnabled) {
                extensionSettings.headersEnabled = changes.headersEnabled.newValue;
            }
            if (changes.snippetPrefix) {
                extensionSettings.snippetPrefix = changes.snippetPrefix.newValue;
            }
            if (changes.dynamicColorEnabled !== undefined) {
                extensionSettings.dynamicColorEnabled = changes.dynamicColorEnabled.newValue;
            }
            if (changes.hideUpgradeEnabled !== undefined) {
                extensionSettings.hideUpgradeEnabled = changes.hideUpgradeEnabled.newValue;
            }

            attemptThemeApplication();

            if (changes.timelineEnabled && changes.timelineEnabled.newValue && typeof updateTimeline === 'function') {
                updateTimeline();
            }
            if (changes.collapseEnabled && changes.collapseEnabled.newValue && typeof processCodeBlocks === 'function') {
                processCodeBlocks();
            }
            if (changes.headersEnabled && changes.headersEnabled.newValue && typeof enhanceCodeHeaders === 'function') {
                enhanceCodeHeaders();
            }
        }
    });
}

initializeExtension();