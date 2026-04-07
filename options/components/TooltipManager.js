/**
 * @fileoverview Tooltip positioning manager.
 * @copyright (c) 2026 Fertwbr
 */

export class TooltipManager {
    /**
     * @param {string} [selector='.help-tooltip-container']
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