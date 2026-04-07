/**
 * @fileoverview Reusable dropdown menu component.
 * @copyright (c) 2026 Fertwbr
 */

export class DropdownMenu {
    /**
     * @param {HTMLElement} buttonElement
     * @param {HTMLElement} menuElement
     * @param {string} itemSelector
     * @param {string} activeClass
     * @param {Function} onSelect
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
     * @private
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

    toggle() {
        this.buttonElement.classList.toggle('open');
        this.menuElement.classList.toggle('open');
    }

    close() {
        this.buttonElement.classList.remove('open');
        this.menuElement.classList.remove('open');
    }

    /**
     * @param {string} attributeName
     * @param {string} value
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