/**
 * @fileoverview Quick theme toggle button component.
 * @copyright (c) 2026 Fertwbr
 */

export class QuickThemeToggle {
    /**
     * @param {HTMLElement} btn
     * @param {HTMLElement} icon
     * @param {string} initialTheme
     * @param {Function} onToggle
     */
    constructor(btn, icon, initialTheme, onToggle) {
        this.btn = btn;
        this.icon = icon;
        this.currentTheme = initialTheme;
        this.onToggle = onToggle;

        this.updateVisuals(initialTheme);
        this._initEvents();
    }

    /**
     * @private
     * @returns {void}
     */
    _initEvents() {
        if (this.btn) {
            this.btn.addEventListener('click', () => {
                if (this.currentTheme === 'auto') this.currentTheme = 'dark';
                else if (this.currentTheme === 'dark') this.currentTheme = 'light';
                else this.currentTheme = 'auto';

                this.updateVisuals(this.currentTheme);
                this.onToggle(this.currentTheme);
            });
        }
    }

    /**
     * @param {string} theme
     * @returns {void}
     */
    updateVisuals(theme) {
        this.currentTheme = theme;
        if (this.icon) {
            if (theme === 'auto') this.icon.textContent = 'brightness_auto';
            if (theme === 'light') this.icon.textContent = 'light_mode';
            if (theme === 'dark') this.icon.textContent = 'dark_mode';
        }
    }
}