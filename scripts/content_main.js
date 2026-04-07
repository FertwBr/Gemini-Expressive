/**
 * @fileoverview Main orchestrator script.
 * @copyright (c) 2026 Fertwbr
 */

/**
 * Timeout reference for debouncing the mutation observer.
 * @type {number|null}
 */
let debounceTimer = null;

/**
 * Lock to prevent recursive theme application loops.
 * @type {boolean}
 */
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
 * Applies CSS classes to the body to instantly hide or show features based on user settings.
 * @returns {void}
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
 * Attempts to apply the Material You theme using ThemeUtils if dynamic color is enabled.
 * @returns {void}
 */
function attemptThemeApplication() {
    applyFeatureToggles();

    if (!extensionSettings.dynamicColorEnabled) return;

    if (typeof ThemeUtils !== 'undefined' && !isApplyingTheme) {
        isApplyingTheme = true;
        ThemeUtils.applyMaterialTheme(extensionSettings.themeColor, extensionSettings.themeMode);
        setTimeout(() => {
            isApplyingTheme = false;
        }, 150);
    }
}

/**
 * Simulates a click on the overlay backdrop to close native Gemini menus.
 * @returns {void}
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
 * Executes a click sequence to match the extension's theme with the native UI theme.
 * @param {HTMLElement} themeButton The native theme trigger button.
 * @param {string} targetMode The requested theme mode ('light', 'dark', or 'auto').
 * @returns {void}
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
 * Finds the native settings menu and orchestrates the synchronization of the theme.
 * @param {string} targetMode The theme mode to sync.
 * @returns {void}
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
 * Main DOM observer that detects dynamic UI changes and re-applies features/styles.
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

        if (extensionSettings.collapseEnabled && typeof CodeCollapser !== 'undefined') {
            CodeCollapser.process();
        }
        if (extensionSettings.headersEnabled && typeof CodeHeaderEnhancer !== 'undefined') {
            CodeHeaderEnhancer.enhance();
        }
        if (extensionSettings.timelineEnabled && typeof TimelineBuilder !== 'undefined') {
            TimelineBuilder.update();
        }
        if (typeof SettingsShortcut !== 'undefined') {
            SettingsShortcut.inject();
        }
    }, 800);
});

/**
 * Injects a static <style> element to handle structural layout fixes in the host UI.
 * @returns {void}
 */
function injectUIFixes() {
    if (!document.getElementById('bg-ui-fixes')) {
        const style = document.createElement('style');
        style.id = 'bg-ui-fixes';
        style.textContent = `
            .disclaimer-container .main-text, .disclaimer-container .content-container, .disclaimer-container.promo .main-text { background: transparent !important; color: var(--gem-sys-color--on-surface-variant) !important; }
            .disclaimer-container .action-button-wrapper button, .disclaimer-container button.action-button { background: transparent !important; background-color: transparent !important; color: var(--gem-sys-color--primary) !important; box-shadow: none !important; }
            .disclaimer-container .action-button-wrapper button .mdc-button__label, .disclaimer-container button.action-button .mdc-button__label { color: var(--gem-sys-color--primary) !important; }
            code-block, .code-block, .code-container { max-width: 100% !important; }
            pre { overflow-x: auto !important; max-width: 100% !important; }
            .code-block-decoration, .code-block-header, .header-formatted { border-top-left-radius: inherit; border-top-right-radius: inherit; }
            pre.bg-processed:not(.bg-collapsed) { padding-bottom: 56px !important; }
            .bg-code-nav { position: sticky; bottom: 16px; left: 50%; transform: translateX(-50%); width: max-content; display: flex; flex-direction: row; gap: 12px; z-index: 10; opacity: 0; transition: opacity 0.2s ease-in-out; pointer-events: none; margin-top: -52px; margin-bottom: 16px; }
            .bg-code-nav-disabled .bg-code-nav { display: none !important; }
            code-block:hover .bg-code-nav, .code-block:hover .bg-code-nav, pre:hover ~ .bg-code-nav, .bg-code-nav:hover { opacity: 1; }
            pre.bg-collapsed ~ .bg-code-nav { display: none !important; }
            .bg-code-nav-btn { background: var(--gem-sys-color--surface-container-highest, #36343b); color: var(--gem-sys-color--on-surface, #e3e2e6); border: 1px solid var(--gem-sys-color--outline-variant, #44474e); border-radius: 50%; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: background 0.2s, transform 0.1s; pointer-events: auto; }
            .bg-code-nav-btn .google-symbols { margin: 0 !important; display: block !important; font-size: 24px; line-height: 1; }
            .bg-code-nav-btn:hover { background: var(--gem-sys-color--surface-variant, #44474e); transform: scale(1.05); }
            .bg-code-nav-btn:active { transform: scale(0.95); }
            .edit-button-area button.cancel-button .mdc-button__label { color: var(--gem-sys-color--primary) !important; }
            .edit-button-area button.update-button:not(:disabled) { background-color: var(--gem-sys-color--primary) !important; }
            .edit-button-area button.update-button:not(:disabled) .mdc-button__label { color: var(--gem-sys-color--on-primary) !important; }
            .code-block-decoration .buttons button.mdc-icon-button { width: 32px !important; height: 32px !important; padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }
            .code-block-decoration .buttons button.mdc-icon-button mat-icon, .code-block-decoration .buttons button.mdc-icon-button .google-symbols { margin: 0 !important; display: block !important; }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Initializes the extension state, storage listeners, and DOM observers.
 * @returns {void}
 */
function initializeExtension() {
    injectUIFixes();

    chrome.storage.local.get(['geminiSnippets'], (localItems) => {
        extensionSettings.snippets = localItems.geminiSnippets || [];
    });

    chrome.storage.sync.get(['timelineEnabled', 'collapseEnabled', 'codeNavEnabled', 'headersEnabled', 'themeMode', 'themeColor', 'snippetPrefix', 'dynamicColorEnabled', 'hideUpgradeEnabled'], (items) => {
        if (items.timelineEnabled !== undefined) extensionSettings.timelineEnabled = items.timelineEnabled;
        if (items.collapseEnabled !== undefined) extensionSettings.collapseEnabled = items.collapseEnabled;
        if (items.headersEnabled !== undefined) extensionSettings.headersEnabled = items.headersEnabled;
        if (items.codeNavEnabled !== undefined) extensionSettings.codeNavEnabled = items.codeNavEnabled;
        if (items.themeMode !== undefined) extensionSettings.themeMode = items.themeMode;
        if (items.themeColor !== undefined) extensionSettings.themeColor = items.themeColor;
        if (items.snippetPrefix !== undefined) extensionSettings.snippetPrefix = items.snippetPrefix;
        if (items.dynamicColorEnabled !== undefined) extensionSettings.dynamicColorEnabled = items.dynamicColorEnabled;
        if (items.hideUpgradeEnabled !== undefined) extensionSettings.hideUpgradeEnabled = items.hideUpgradeEnabled;

        attemptThemeApplication();

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (extensionSettings.themeMode === 'auto') attemptThemeApplication();
            });
        }

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
        if (document.documentElement) observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });

        if (typeof SnippetInjector !== 'undefined') {
            SnippetInjector.init(extensionSettings);
        }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.geminiSnippets) {
            extensionSettings.snippets = changes.geminiSnippets.newValue || [];
        }
        if (namespace === 'sync') {
            if (changes.themeMode) {
                extensionSettings.themeMode = changes.themeMode.newValue;
                syncNativeTheme(extensionSettings.themeMode);
            }
            if (changes.themeColor) extensionSettings.themeColor = changes.themeColor.newValue;
            if (changes.timelineEnabled) extensionSettings.timelineEnabled = changes.timelineEnabled.newValue;
            if (changes.collapseEnabled) extensionSettings.collapseEnabled = changes.collapseEnabled.newValue;
            if (changes.codeNavEnabled) extensionSettings.codeNavEnabled = changes.codeNavEnabled.newValue;
            if (changes.headersEnabled) extensionSettings.headersEnabled = changes.headersEnabled.newValue;
            if (changes.snippetPrefix) extensionSettings.snippetPrefix = changes.snippetPrefix.newValue;
            if (changes.dynamicColorEnabled !== undefined) extensionSettings.dynamicColorEnabled = changes.dynamicColorEnabled.newValue;
            if (changes.hideUpgradeEnabled !== undefined) extensionSettings.hideUpgradeEnabled = changes.hideUpgradeEnabled.newValue;

            attemptThemeApplication();

            if (changes.timelineEnabled && changes.timelineEnabled.newValue && typeof TimelineBuilder !== 'undefined') {
                TimelineBuilder.update();
            }
            if (changes.collapseEnabled && changes.collapseEnabled.newValue && typeof CodeCollapser !== 'undefined') {
                CodeCollapser.process();
            }
            if (changes.headersEnabled && changes.headersEnabled.newValue && typeof CodeHeaderEnhancer !== 'undefined') {
                CodeHeaderEnhancer.enhance();
            }
        }
    });
}

initializeExtension();