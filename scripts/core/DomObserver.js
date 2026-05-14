/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Monitors the Document Object Model for structural changes and attribute modifications,
 * specifically targeting theme-related classes. Utilizes debouncing to prevent excessive
 * callback execution and includes safeguards against infinite mutation loops caused by
 * the extension's own DOM modifications.
 */
class DomObserver {
    static debounceTimer = null;
    static observer = null;
    static isMutating = false;

    /**
     * Initializes and starts the MutationObserver to track changes in the document body and root.
     * It handles structural mutations with a debounce timer and prioritizes instant execution
     * for critical theme class changes to avoid visual flickering.
     * @param {Function} onMutationCallback - Debounced callback executed when general UI elements change.
     * @param {Function} onThemeClassChangeCallback - Instant callback executed specifically when 'class' or 'data-theme' attributes change on the root elements.
     */
    static start(onMutationCallback, onThemeClassChangeCallback) {
        this.observer = new MutationObserver((mutations) => {
            if (this.isMutating) return;

            let themeChanged = false;
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
                    const target = mutation.target;
                    if (target === document.body || target === document.documentElement) {
                        themeChanged = true;
                    }
                }
            }

            if (themeChanged && onThemeClassChangeCallback) {
                this.isMutating = true;
                onThemeClassChangeCallback();
                setTimeout(() => {
                    this.isMutating = false;
                }, 50);
            }

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.isMutating = true;
                if (onMutationCallback) onMutationCallback();
                setTimeout(() => {
                    this.isMutating = false;
                }, 50);
            }, 800);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
        if (document.documentElement) {
            this.observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'data-theme']
            });
        }
    }

    /**
     * Halts the observation process and disconnects the MutationObserver to free up browser resources.
     */
    static stop() {
        if (this.observer) this.observer.disconnect();
    }
}

window.DomObserver = DomObserver;