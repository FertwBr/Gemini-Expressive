/**
 * @fileoverview Centralized MutationObserver with debouncing.
 * @copyright (c) 2026 Fertwbr
 */

class DomObserver {
    static debounceTimer = null;
    static observer = null;

    /**
     * Starts the observer.
     * @param {Function} onMutationCallback Called debounced when any UI changes occur.
     * @param {Function} onThemeClassChangeCallback Called instantly when body theme classes change.
     */
    static start(onMutationCallback, onThemeClassChangeCallback) {
        this.observer = new MutationObserver((mutations) => {
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
                onThemeClassChangeCallback();
            }

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                if (onMutationCallback) onMutationCallback();
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
     * Stops the observer.
     */
    static stop() {
        if (this.observer) this.observer.disconnect();
    }
}

window.DomObserver = DomObserver;