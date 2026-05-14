/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {DropdownMenu} from './DropdownMenu.js';

/**
 * Handles the selection of a text prefix from a predefined list.
 * It encapsulates an instance of DropdownMenu to manage the dropdown interactions
 * and updates the trigger button's label to match the current selection.
 */
export class PrefixSelector {
    /**
     * Initializes the selector and establishes the internal dropdown logic.
     * @param {HTMLElement} btn - The primary button element acting as the dropdown trigger.
     * @param {HTMLElement} menu - The container element holding the selectable prefix options.
     * @param {HTMLElement} label - The text element within the button that displays the active prefix.
     * @param {string} initialPrefix - The starting prefix value to apply upon instantiation.
     * @param {Function} onChange - The callback function executed when the prefix value changes.
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
     * Synchronizes the active state within the dropdown and updates the visible label text.
     * @param {string} prefix - The string value of the selected prefix.
     * @returns {void}
     */
    updateVisuals(prefix) {
        if (!this.label) return;
        this.dropdown.setActiveByAttribute('data-prefix', prefix);
        this.label.textContent = prefix;
    }
}