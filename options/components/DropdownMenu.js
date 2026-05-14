/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A reusable component that manages the state and interactions of a dropdown menu.
 * Handles toggling visibility, closing when clicking outside the component, and highlighting
 * the active selection based on custom HTML attributes.
 */
export class DropdownMenu {
    /**
     * Binds the target UI elements to construct the dropdown behavior.
     * @param {HTMLElement} buttonElement - The button that triggers the dropdown visibility.
     * @param {HTMLElement} menuElement - The container holding the dropdown options.
     * @param {string} itemSelector - The CSS selector used to identify individual clickable items within the menu.
     * @param {string} activeClass - The CSS class applied to visually indicate the currently selected item.
     * @param {Function} onSelect - Callback executed when a dropdown item is clicked.
     */
    constructor(buttonElement, menuElement, itemSelector, activeClass, onSelect) {
        this.buttonElement = buttonElement;
        this.menuElement = menuElement;
        this.items = menuElement.querySelectorAll(itemSelector);
        this.activeClass = activeClass;
        this.onSelect = onSelect;

        this._initEvents();
    }

    /**
     * Binds internal events to handle button clicks, document-wide clicks for outside closure,
     * and individual item selection.
     * @private
     * @returns {void}
     */
    _initEvents() {
        this.buttonElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (!this.buttonElement.contains(e.target) && !this.menuElement.contains(e.target)) {
                this.close();
            }
        });

        this.items.forEach(item => {
            item.addEventListener('click', () => {
                this.onSelect(item);
                this.close();
            });
        });
    }

    /**
     * Reverses the current visibility state of the dropdown menu by toggling the CSS class.
     * @returns {void}
     */
    toggle() {
        this.buttonElement.classList.toggle('open');
        this.menuElement.classList.toggle('open');
    }

    /**
     * Forces the dropdown menu into a hidden state by removing the active CSS class.
     * @returns {void}
     */
    close() {
        this.buttonElement.classList.remove('open');
        this.menuElement.classList.remove('open');
    }

    /**
     * Iterates through the dropdown items and applies the active CSS class only to the element
     * that matches the specified attribute and value, removing it from all others.
     * @param {string} attributeName - The name of the HTML attribute to check (e.g., 'data-lang').
     * @param {string} value - The value that identifies the item to be marked as active.
     * @returns {void}
     */
    setActiveByAttribute(attributeName, value) {
        this.items.forEach(item => {
            if (item.getAttribute(attributeName) === value) {
                item.classList.add(this.activeClass);
            } else {
                item.classList.remove(this.activeClass);
            }
        });
    }
}