/**
 * @fileoverview Manages extension state and storage synchronization.
 * @copyright (c) 2026 Fertwbr
 */

class ExtensionState {
    static settings = {
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

    static listeners = [];

    /**
     * Loads settings from both local and sync storage.
     * @returns {Promise<Object>}
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
     * Starts listening to storage changes.
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
     * Registers a callback for when settings change.
     * @param {Function} callback
     */
    static onChange(callback) {
        this.listeners.push(callback);
    }
}

window.ExtensionState = ExtensionState;