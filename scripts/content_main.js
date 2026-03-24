/**
 * Timeout reference for debouncing the mutation observer.
 * @type {number|null}
 */
let debounceTimer = null;

/**
 * Extension settings cache to respect user preferences.
 * @type {Object}
 */
let extensionSettings = {
    timelineEnabled: true,
    collapseEnabled: true,
    headersEnabled: true,
    themeMode: 'auto',
    themeColor: '#0b57d0'
};

/**
 * Applies dynamic themes specifically via the bundled or exposed theme utilities.
 */
function attemptThemeApplication() {
    if (typeof applyMaterialTheme === 'function') {
        applyMaterialTheme(extensionSettings.themeColor, extensionSettings.themeMode);
    }
}

/**
 * Main observer to track DOM changes and trigger necessary UI updates based on settings.
 * @type {MutationObserver}
 */
const observer = new MutationObserver((mutations) => {
    let themeChanged = false;
    for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target;
            if (target === document.body || target === document.documentElement) {
                themeChanged = true;
            }
        }
    }

    if (themeChanged && extensionSettings.themeMode === 'auto') {
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

/**
 * Initializes the extension by fetching settings, starting the observer, and listening for changes.
 */
function initializeExtension() {
    chrome.storage.sync.get(['timelineEnabled', 'collapseEnabled', 'headersEnabled', 'themeMode', 'themeColor'], (items) => {
        if (items.timelineEnabled !== undefined) {
            extensionSettings.timelineEnabled = items.timelineEnabled;
        }
        if (items.collapseEnabled !== undefined) {
            extensionSettings.collapseEnabled = items.collapseEnabled;
        }
        if (items.headersEnabled !== undefined) {
            extensionSettings.headersEnabled = items.headersEnabled;
        }
        if (items.themeMode !== undefined) {
            extensionSettings.themeMode = items.themeMode;
        }
        if (items.themeColor !== undefined) {
            extensionSettings.themeColor = items.themeColor;
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
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
            if (changes.themeMode) {
                extensionSettings.themeMode = changes.themeMode.newValue;
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
            if (changes.headersEnabled) {
                extensionSettings.headersEnabled = changes.headersEnabled.newValue;
            }

            attemptThemeApplication();
        }
    });
}

initializeExtension();