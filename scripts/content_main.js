/**
 * @fileoverview Extension entry point and bootstrap.
 * @copyright (c) 2026 Fertwbr
 */

/**
 * Initializes and orchestrates the core extension modules.
 * Loads user settings, sets up the user interface fixes, binds system theme listeners,
 * initializes interactive features, and starts the DOM observer to handle dynamic content injections.
 * Also registers listeners for real-time setting updates.
 *
 * @async
 * @returns {Promise<void>}
 */
async function bootstrapExtension() {
    const settings = await ExtensionState.load();
    ExtensionState.listen();

    UIManager.injectUIFixes();
    UIManager.attemptThemeApplication(settings);

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (ExtensionState.settings.themeMode === 'auto') {
                UIManager.attemptThemeApplication(ExtensionState.settings);
            }
        });
    }

    if (typeof SnippetInjector !== 'undefined') {
        SnippetInjector.init(ExtensionState.settings);
    }

    DomObserver.start(
        /**
         * Handles debounced general DOM mutations, triggering UI updates and feature injections
         * such as code collapsers, enhanced headers, timeline builders, and settings shortcuts.
         */
        () => {
            UIManager.applyFeatureToggles(ExtensionState.settings);

            if (ExtensionState.settings.collapseEnabled && typeof CodeCollapser !== 'undefined') {
                CodeCollapser.process();
            }
            if (ExtensionState.settings.headersEnabled && typeof CodeHeaderEnhancer !== 'undefined') {
                CodeHeaderEnhancer.enhance();
            }
            if (ExtensionState.settings.timelineEnabled && typeof TimelineBuilder !== 'undefined') {
                TimelineBuilder.update();
            }
            if (typeof SettingsShortcut !== 'undefined') {
                SettingsShortcut.inject();
            }
        },
        /**
         * Handles immediate theme class changes triggered by the native environment or user interactions.
         */
        () => {
            UIManager.applyFeatureToggles(ExtensionState.settings);
            if (ExtensionState.settings.themeMode === 'auto' && ExtensionState.settings.dynamicColorEnabled) {
                UIManager.attemptThemeApplication(ExtensionState.settings);
            }
        }
    );

    ExtensionState.onChange(
        /**
         * Handles real-time updates when user settings are modified from the options page.
         * @param {Object} changes The specific settings that were modified.
         * @param {Object} newSettings The complete updated settings object.
         */
        (changes, newSettings) => {
            if (changes.themeMode) {
                UIManager.syncNativeTheme(newSettings.themeMode, newSettings);
            }

            UIManager.attemptThemeApplication(newSettings);

            if (changes.timelineEnabled && newSettings.timelineEnabled && typeof TimelineBuilder !== 'undefined') {
                TimelineBuilder.update();
            }
            if (changes.collapseEnabled && newSettings.collapseEnabled && typeof CodeCollapser !== 'undefined') {
                CodeCollapser.process();
            }
            if (changes.headersEnabled && newSettings.headersEnabled && typeof CodeHeaderEnhancer !== 'undefined') {
                CodeHeaderEnhancer.enhance();
            }
        }
    );
}

bootstrapExtension();