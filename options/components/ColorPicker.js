/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Manages the logic for a custom color picker interface.
 * It handles the selection of predefined color swatches, syncs a custom HTML color input,
 * updates CSS variables dynamically on a preview element to reflect the chosen color,
 * and triggers a callback when the selection changes.
 */
export class ColorPicker {
    /**
     * Constructs the color picker and binds the relevant DOM elements.
     * @param {NodeListOf<HTMLElement>} swatches - A collection of predefined color swatch elements.
     * @param {HTMLInputElement} customInput - The native HTML color input for custom selections.
     * @param {HTMLElement} customWrapper - The wrapper element around the custom color input for styling active states.
     * @param {HTMLElement} previewElement - The target element where CSS color variables will be injected for preview.
     * @param {Function} onColorSelect - Callback function executed when a new color is successfully chosen.
     */
    constructor(swatches, customInput, customWrapper, previewElement, onColorSelect) {
        this.swatches = swatches;
        this.customInput = customInput;
        this.customWrapper = customWrapper;
        this.previewElement = previewElement;
        this.onColorSelect = onColorSelect;

        this._initEvents();
    }

    /**
     * Attaches click listeners to the swatches and change listeners to the custom color input.
     * @private
     * @returns {void}
     */
    _initEvents() {
        this.swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.getAttribute('data-color');
                this.customInput.value = color;
                this.updateSelection(color);
                this.onColorSelect(color);
            });
        });

        this.customInput.addEventListener('change', () => {
            this.updateSelection(this.customInput.value);
            this.onColorSelect(this.customInput.value);
        });
    }

    /**
     * Updates the CSS custom properties on the preview element to reflect the primary color
     * and auto-generated mixed variants (secondary and tertiary).
     * @param {string} color - The hex value of the selected color.
     * @returns {void}
     */
    updatePreview(color) {
        if (this.previewElement) {
            this.previewElement.style.setProperty('--swatch-p', color);
            this.previewElement.style.setProperty('--swatch-s', `color-mix(in srgb, ${color} 70%, gray)`);
            this.previewElement.style.setProperty('--swatch-t', `color-mix(in srgb, ${color} 70%, #a49386)`);
        }
    }

    /**
     * Syncs the active state across the UI elements. If the color matches a swatch,
     * it highlights the swatch. If it's a custom color, it highlights the custom input wrapper.
     * @param {string} color - The hex value of the current color to evaluate.
     * @returns {void}
     */
    updateSelection(color) {
        let matched = false;
        this.swatches.forEach(swatch => {
            if (swatch.getAttribute('data-color').toLowerCase() === color.toLowerCase()) {
                swatch.classList.add('active');
                matched = true;
            } else {
                swatch.classList.remove('active');
            }
        });

        if (!matched) {
            if (this.customWrapper) {
                this.customWrapper.classList.add('active');
            }
            this.customInput.value = color;
            this.updatePreview(color);
        } else {
            if (this.customWrapper) {
                this.customWrapper.classList.remove('active');
            }
            this.updatePreview(this.customInput.value);
        }
    }
}