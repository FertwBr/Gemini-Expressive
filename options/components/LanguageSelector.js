/**
 * @fileoverview Language selector dropdown component.
 * @copyright (c) 2026 Fertwbr
 */

import {Localization} from '../core/Localization.js';
import {DropdownMenu} from './DropdownMenu.js';

export class LanguageSelector {
    /**
     * @param {HTMLElement} btn
     * @param {HTMLElement} menu
     * @param {HTMLElement} flagImg
     * @param {HTMLElement} label
     * @param {string} initialLang
     * @param {Function} onChange
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
     * @param {string} lang
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