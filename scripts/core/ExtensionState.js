/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Acts as the central state management system for the extension.
 * It loads user preferences from both local and synchronized Chrome storage, merges them
 * into a single unified state, and broadcasts updates to registered listeners whenever changes occur.
 */
class ExtensionState {
    static settings = {
        timelineEnabled: true,
        collapseEnabled: true,
        autoCenterCollapseEnabled: false,
        headersEnabled: true,
        codeNavEnabled: true,
        themeMode: 'auto',
        themeColor: '#0b57d0',
        snippets: [],
        snippetPrefix: '/',
        dynamicColorEnabled: true,
        hideUpgradeEnabled: false
    };

    static listeners = [];

    /**
     * Retrieves the latest configuration states. It fetches heavy/device-specific data (like snippets)
     * from local storage and user preferences from sync storage, combining them into the active settings object.
     * @returns {Promise<Object>} A promise resolving to the fully merged settings object.
     */
    static async load() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['geminiSnippets'], (localItems) => {
                this.settings.snippets = localItems.geminiSnippets || [];

                chrome.storage.sync.get(Object.keys(this.settings), (syncItems) => {
                    this.settings = {...this.settings, ...syncItems};
                    resolve(this.settings);
                });
            });
        });
    }

    /**
     * Attaches an event listener to the Chrome Storage API to detect real-time changes
     * made in other tabs or contexts, updating the internal state and notifying UI components.
     */
    static listen() {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            let hasChanges = false;

            if (namespace === 'local' && changes.geminiSnippets) {
                this.settings.snippets = changes.geminiSnippets.newValue || [];
                hasChanges = true;
            }

            if (namespace === 'sync') {
                for (const key in changes) {
                    if (this.settings.hasOwnProperty(key)) {
                        this.settings[key] = changes[key].newValue;
                        hasChanges = true;
                    }
                }
            }

            if (hasChanges) {
                this.listeners.forEach(callback => callback(changes, this.settings));
            }
        });
    }

    /**
     * Registers a callback function to be executed whenever the extension's settings change.
     * @param {Function} callback - The function to invoke, receiving the changed keys and the new state.
     */
    static onChange(callback) {
        this.listeners.push(callback);
    }
}

window.ExtensionState = ExtensionState;