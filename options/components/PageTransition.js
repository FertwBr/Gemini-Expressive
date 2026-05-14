/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Utility class to manage programmatic page transitions.
 * It intercepts link clicks to inject a CSS animation class on the main wrapper,
 * delaying the actual navigation until the exit animation visually completes.
 */
export class PageTransition {
    /**
     * Attaches an event listener to the specified element to handle smooth exit routing.
     * @param {string} selector - The CSS selector for the button or link triggering the transition.
     * @param {string} targetUrl - The destination URL to navigate to after the animation ends.
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