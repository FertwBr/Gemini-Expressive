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
    dynamicColorEnabled: true
};

/**
 * Applies dynamic themes specifically via the bundled or exposed theme utilities.
 */
function attemptThemeApplication() {
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
 * Applies CSS classes to the body to instantly hide/show features based on settings.
 */
function applyFeatureToggles() {
    if (document.body) {
        document.body.classList.toggle('bg-timeline-disabled', !extensionSettings.timelineEnabled);
        document.body.classList.toggle('bg-collapse-disabled', !extensionSettings.collapseEnabled);
        document.body.classList.toggle('bg-headers-disabled', !extensionSettings.headersEnabled);
        document.body.classList.toggle('bg-code-nav-disabled', !extensionSettings.codeNavEnabled);
        document.body.classList.toggle('bg-dynamic-theme-enabled', extensionSettings.dynamicColorEnabled === true);
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

    if (themeChanged && extensionSettings.themeMode === 'auto' && !isApplyingTheme) {
        attemptThemeApplication();
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (extensionSettings.collapseEnabled && typeof processCodeBlocks === 'function') {
            processCodeBlocks();
        }
        if (extensionSettings.headersEnabled && typeof enhanceCodeHeaders === 'function') {
            enhanceCodeHeaders();
        }
        if (extensionSettings.timelineEnabled && typeof updateTimeline === 'function') {
            updateTimeline();
        }
    }, 800);
});

function injectUIFixes(dynamicColorEnabled) {
    if (!document.getElementById('bg-ui-fixes')) {
        const style = document.createElement('style');
        style.id = 'bg-ui-fixes';

        let cssContent = `
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
                margin-left: auto;
                margin-right: 16px;
                margin-top: -52px;
                width: max-content;
                display: flex;
                flex-direction: row;
                gap: 8px;
                z-index: 10;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                pointer-events: none;
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
                background: var(--gem-sys-color--surface-container-high, #2b2930);
                color: var(--gem-sys-color--on-surface, #e3e2e6);
                border: 1px solid var(--gem-sys-color--outline-variant, #44474e);
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: background 0.2s, transform 0.1s;
                pointer-events: auto;
            }
            .bg-code-nav-btn:hover {
                background: var(--gem-sys-color--surface-container-highest, #36343b);
                transform: scale(1.05);
            }
            .bg-code-nav-btn:active {
                transform: scale(0.95);
            }
        `;

        if (dynamicColorEnabled) {
            cssContent += `
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
            .edit-button-area button.cancel-button .mdc-button__label {
                color: var(--gem-sys-color--primary) !important;
            }
            .edit-button-area button.update-button:not(:disabled) {
                background-color: var(--gem-sys-color--primary) !important;
            }
            .edit-button-area button.update-button:not(:disabled) .mdc-button__label {
                color: var(--gem-sys-color--on-primary) !important;
            }
            `;
        }

        style.textContent = cssContent;
        document.head.appendChild(style);
    }
}

/**
 * Initializes the extension by fetching settings, starting the observer, and listening for changes.
 */
function initializeExtension() {
    chrome.storage.sync.get(['timelineEnabled', 'collapseEnabled', 'codeNavEnabled', 'headersEnabled', 'themeMode', 'themeColor', 'dynamicColorEnabled'], (items) => {
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
        if (items.dynamicColorEnabled !== undefined) {
            extensionSettings.dynamicColorEnabled = items.dynamicColorEnabled;
        }

        injectUIFixes(extensionSettings.dynamicColorEnabled);

        applyFeatureToggles();
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
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
            if (changes.dynamicColorEnabled) {
                extensionSettings.dynamicColorEnabled = changes.dynamicColorEnabled.newValue;
            }
            if (changes.themeMode) {
                extensionSettings.themeMode = changes.themeMode.newValue;
                if (extensionSettings.dynamicColorEnabled) {
                    syncNativeTheme(extensionSettings.themeMode);
                }
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

            applyFeatureToggles();
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