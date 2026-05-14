/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Controls transient alert messages (toasts) presented over the main UI.
 * Handles the application and automatic removal of CSS visibility classes based on a timer,
 * ensuring overlapping requests clear the previous timeout to avoid premature hiding.
 */
export class ToastNotification {
    /**
     * Binds the core layout elements needed to render the toast notification.
     * @param {HTMLElement} element - The main wrapper element of the toast container.
     * @param {HTMLElement} messageElement - The inner node where the text string is injected.
     */
    constructor(element, messageElement) {
        this.element = element;
        this.messageElement = messageElement;
        this.timeoutId = null;
    }

    /**
     * Activates the toast element to display a message, queuing its automatic disappearance.
     * @param {string} message - The textual content to present to the user.
     * @param {boolean} [isLong=false] - Whether the notification should stay visible for an extended duration (5s vs 2.5s).
     * @returns {void}
     */
    show(message, isLong = false) {
        this.messageElement.textContent = message;
        this.element.classList.add('show');
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            this.element.classList.remove('show');
        }, isLong ? 5000 : 2500);
    }
}