/**
 * @fileoverview Manager for backup import and export operations.
 * @copyright (c) 2026 Fertwbr
 */

import {StorageManager} from '../core/StorageManager.js';

export class BackupManager {
    /**
     * @param {HTMLElement} importBtn
     * @param {HTMLElement} exportBtn
     * @param {HTMLInputElement} importInput
     * @param {Object} toast
     */
    constructor(importBtn, exportBtn, importInput, toast) {
        this.importBtn = importBtn;
        this.exportBtn = exportBtn;
        this.importInput = importInput;
        this.toast = toast;

        this._initEvents();
    }

    /**
     * @private
     * @returns {void}
     */
    _initEvents() {
        if (this.importBtn && this.importInput) {
            this.importBtn.addEventListener('click', () => {
                this.importInput.click();
            });

            this.importInput.addEventListener('change', (e) => {
                this._handleImport(e);
            });
        }

        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', async () => {
                await this._handleExport();
            });
        }
    }

    /**
     * @private
     * @param {Event} event
     * @returns {void}
     */
    _handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                    throw new Error('Invalid format');
                }

                await StorageManager.setLocalData(data);

                this.toast.show(LocaleManager.getString('restoreSuccess'));

                setTimeout(() => {
                    const wrapper = document.querySelector('.page-wrapper');
                    if (wrapper) wrapper.classList.add('page-transition-exit');
                    setTimeout(() => {
                        window.location.reload();
                    }, 200);
                }, 1300);

            } catch (error) {
                this.toast.show(LocaleManager.getString('restoreInvalidFile'), true);
            }

            this.importInput.value = '';
        };

        reader.onerror = () => {
            this.toast.show(LocaleManager.getString('restoreError'), true);
            this.importInput.value = '';
        };

        reader.readAsText(file);
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async _handleExport() {
        try {
            const currentData = await StorageManager.getLocalData(null);
            const dataStr = JSON.stringify(currentData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gemini_expressive_backup_${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            this.toast.show(LocaleManager.getString('backupSuccess'));
        } catch (error) {
            this.toast.show(LocaleManager.getString('backupError'), true);
        }
    }
}