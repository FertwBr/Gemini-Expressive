/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Localization} from '../core/Localization.js';
import {DropdownMenu} from './DropdownMenu.js';

/**
 * Manages the language selection UI, extending standard dropdown functionality.
 * It coordinates the rendering of country flags, language labels, and dynamic icon injection
 * when the "auto" language detection option is selected.
 */
export class LanguageSelector {
    /**
     * Initializes the selector, hooking into a generic DropdownMenu instance.
     * @param {HTMLElement} btn - The main button that opens the language menu.
     * @param {HTMLElement} menu - The dropdown menu container holding language options.
     * @param {HTMLElement} flagImg - The image element used to display the selected language's country flag.
     * @param {HTMLElement} label - The text element displaying the name of the currently selected language.
     * @param {string} initialLang - The language code to be selected upon initialization.
     * @param {Function} onChange - The callback function triggered when a new language is selected.
     */
    constructor(btn, menu, flagImg, label, initialLang, onChange) {
        this.btn = btn;
        this.flagImg = flagImg;
        this.label = label;
        this.onChange = onChange;

        this.dropdown = new DropdownMenu(
            btn,
            menu,
            '.footer-menu-item',
            'active',
            (item) => {
                const lang = item.getAttribute('data-lang');
                this.updateVisuals(lang);
                this.onChange(lang);
            }
        );

        this.updateVisuals(initialLang);
    }

    /**
     * Updates the button UI to reflect the newly selected language. Replaces the flag with
     * an icon for the "auto" option, or fetches the appropriate flag URL from flagcdn for specific languages.
     * @param {string} lang - The language code representing the new selection.
     * @returns {void}
     */
    updateVisuals(lang) {
        if (!this.btn || !this.flagImg || !this.label) return;

        this.dropdown.setActiveByAttribute('data-lang', lang);

        if (lang === 'auto') {
            this.flagImg.style.display = 'none';
            let autoIcon = this.btn.querySelector('.auto-icon-temp');
            if (!autoIcon) {
                autoIcon = document.createElement('span');
                autoIcon.className = 'material-symbols-outlined auto-icon-temp';
                autoIcon.textContent = 'auto_awesome';
                autoIcon.style.fontSize = '16px';
                this.btn.insertBefore(autoIcon, this.label);
            }
            this.label.textContent = LocaleManager.getString('lang_auto');
        } else {
            let autoIcon = this.btn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            this.flagImg.style.display = 'block';
            this.flagImg.src = `https://flagcdn.com/w40/${Localization.getFlagCode(lang)}.png`;
            this.label.textContent = LocaleManager.getString(`lang_${lang}`);
        }
    }
}