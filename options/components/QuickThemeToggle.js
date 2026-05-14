/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A lightweight UI component for cycling through application themes.
 * It manages the sequential state change between 'auto', 'dark', and 'light' modes,
 * updating the associated Material Icon visually with every click.
 */
export class QuickThemeToggle {
    /**
     * Constructs the theme toggle button logic.
     * @param {HTMLElement} btn - The button element that receives click events.
     * @param {HTMLElement} icon - The element responsible for rendering the Material Symbols icon text.
     * @param {string} initialTheme - The theme state to load initially ('auto', 'light', or 'dark').
     * @param {Function} onToggle - The callback function fired when the user cycles to a new theme.
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
     * Listens for click events on the button and computes the next theme in the cycle sequence.
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
     * Modifies the text content of the icon element to display the appropriate symbol for the active theme.
     * @param {string} theme - The target theme to visually represent.
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