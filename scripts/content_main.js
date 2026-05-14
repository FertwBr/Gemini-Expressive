/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Acts as the primary entry point and orchestrator for the content script environment.
 * It manages the initialization sequence by resolving user states from storage, configuring
 * the UI manager, attaching system media query listeners, and binding the mutation observers
 * necessary for dynamically injecting extension features into the host DOM.
 * @async
 * @returns {Promise<void>} Resolves when the initial bootstrap sequence is completed.
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

    /**
     * Callback function executed by the DomObserver on a debounced schedule when structural DOM changes occur.
     * Triggers the re-evaluation of feature toggles and re-injects components like the code collapser and timeline.
     */
    const handleGeneralMutations = () => {
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
    };

    /**
     * Callback function executed instantly by the DomObserver when critical theme attributes change natively.
     * Forces immediate re-application of the custom Material theme to prevent visual flashing.
     */
    const handleThemeMutations = () => {
        UIManager.applyFeatureToggles(ExtensionState.settings);
        if (ExtensionState.settings.themeMode === 'auto' && ExtensionState.settings.dynamicColorEnabled) {
            UIManager.attemptThemeApplication(ExtensionState.settings);
        }
    };

    DomObserver.start(handleGeneralMutations, handleThemeMutations);

    /**
     * Subscriber callback triggered by the ExtensionState manager whenever stored configuration values change.
     * Coordinates the runtime updates across all active extension modules without requiring a page reload.
     * @param {Object} changes - The specific dictionary keys and values that were updated.
     * @param {Object} newSettings - The consolidated, fresh configuration state object.
     */
    const onSettingsChanged = (changes, newSettings) => {
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
    };

    ExtensionState.onChange(onSettingsChanged);
}

bootstrapExtension();