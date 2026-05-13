/**
 * @fileoverview Prefix selector component.
 * @copyright (c) 2026 Fertwbr
 */

import {DropdownMenu} from './DropdownMenu.js';

export class PrefixSelector {
    /**
     * @param {HTMLElement} btn
     * @param {HTMLElement} menu
     * @param {HTMLElement} label
     * @param {string} initialPrefix
     * @param {Function} onChange
     */
    constructor(btn, menu, label, initialPrefix, onChange) {
        this.label = label;
        this.onChange = onChange;

        this.dropdown = new DropdownMenu(
            btn,
            menu,
            '.setting-menu-item',
            'active',
            (item) => {
                const prefix = item.getAttribute('data-prefix');
                this.updateVisuals(prefix);
                this.onChange(prefix);
            }
        );

        this.updateVisuals(initialPrefix);
    }

    /**
     * @param {string} prefix
     * @returns {void}
     */
    updateVisuals(prefix) {
        if (!this.label) return;
        this.dropdown.setActiveByAttribute('data-prefix', prefix);
        this.label.textContent = prefix;
    }
}