/**
 * @fileoverview Toast notification component.
 * @copyright (c) 2026 Fertwbr
 */

/**
 * Handles displaying toast notifications.
 */
export class ToastNotification {
    /**
     * @param {HTMLElement} element
     * @param {HTMLElement} messageElement
     */
    constructor(element, messageElement) {
        this.element = element;
        this.messageElement = messageElement;
        this.timeoutId = null;
    }

    /**
     * Shows the toast notification.
     * @param {string} message
     * @param {boolean} [isLong=false]
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