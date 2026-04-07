/**
 * @fileoverview Color picker component logic.
 * @copyright (c) 2026 Fertwbr
 */

export class ColorPicker {
    /**
     * @param {NodeListOf<HTMLElement>} swatches
     * @param {HTMLInputElement} customInput
     * @param {HTMLElement} customWrapper
     * @param {HTMLElement} previewElement
     * @param {Function} onColorSelect
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
     * @private
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
     * @param {string} color
     */
    updatePreview(color) {
        if (this.previewElement) {
            this.previewElement.style.setProperty('--swatch-p', color);
            this.previewElement.style.setProperty('--swatch-s', `color-mix(in srgb, ${color} 70%, gray)`);
            this.previewElement.style.setProperty('--swatch-t', `color-mix(in srgb, ${color} 70%, #a49386)`);
        }
    }

    /**
     * @param {string} color
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