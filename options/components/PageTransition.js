/**
 * @fileoverview Utility for smooth page transitions.
 * @copyright (c) 2026 Fertwbr
 */

export class PageTransition {
    /**
     * @param {string} selector
     * @param {string} targetUrl
     * @returns {void}
     */
    static bind(selector, targetUrl) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const wrapper = document.querySelector('.page-wrapper');
                if (wrapper) wrapper.classList.add('page-transition-exit');
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 200);
            });
        }
    }
}