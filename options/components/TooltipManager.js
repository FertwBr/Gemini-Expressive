/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Manages the dynamic positioning of informational tooltips to prevent them from clipping off-screen.
 * It listens for hover events and evaluates the tooltip's bounding rectangle against the current
 * viewport dimensions, applying corrective CSS classes to reposition the card on the fly.
 */
export class TooltipManager {
    /**
     * Scans the document for tooltip containers and attaches the boundary-checking logic.
     * @param {string} [selector='.help-tooltip-container'] - The CSS selector for the wrapper element that triggers the hover state.
     * @returns {void}
     */
    static init(selector = '.help-tooltip-container') {
        document.querySelectorAll(selector).forEach(container => {
            container.addEventListener('mouseenter', () => {
                const card = container.querySelector('.help-tooltip-card');
                if (!card) return;

                card.classList.remove('pos-bottom', 'pos-left', 'pos-right');

                const rect = card.getBoundingClientRect();
                const viewportWidth = window.innerWidth;

                if (rect.top < 0) {
                    card.classList.add('pos-bottom');
                }

                const updatedRect = card.getBoundingClientRect();

                if (updatedRect.left < 0) {
                    card.classList.add('pos-right');
                } else if (updatedRect.right > viewportWidth) {
                    card.classList.add('pos-left');
                }
            });
        });
    }
}