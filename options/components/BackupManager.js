/**
 * @fileoverview Manager for backup import and export operations.
 * @copyright (c) 2026 Fertwbr
 */

import {StorageManager} from '../core/StorageManager.js';

export class BackupExporter {
    /**
     * @param {Array<HTMLElement>|HTMLElement} exportBtns
     * @param {Object} toast
     * @param {HTMLElement} [lastBackupEl=null]
     */
    constructor(exportBtns, toast, lastBackupEl = null) {
        this.exportBtns = Array.isArray(exportBtns) ? exportBtns : [exportBtns];
        this.toast = toast;
        this.lastBackupEl = lastBackupEl;

        this._initEvents();
        this._loadDate();
    }

    /**
     * @private
     * @returns {void}
     */
    _initEvents() {
        this.exportBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', async () => {
                    await this._handleExport();
                });
            }
        });
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async _loadDate() {
        const data = await StorageManager.getLocalData(['lastBackupDate']);
        if (this.lastBackupEl && data.lastBackupDate) {
            this.lastBackupEl.textContent = new Date(data.lastBackupDate).toLocaleString();
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async _handleExport() {
        try {
            const currentData = await StorageManager.getLocalData(null);
            const backupDate = Date.now();
            currentData.lastBackupDate = backupDate;

            await StorageManager.setLocalData({lastBackupDate: backupDate});

            if (this.lastBackupEl) {
                this.lastBackupEl.textContent = new Date(backupDate).toLocaleString();
            }

            const dataStr = JSON.stringify(currentData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gemini_expressive_backup_${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            this.toast.show(window.LocaleManager.getString('backupSuccess'));
        } catch (error) {
            this.toast.show(window.LocaleManager.getString('backupError'), true);
        }
    }
}

export class BackupImporter {
    /**
     * @param {Array<HTMLElement>|HTMLElement} importBtns
     * @param {HTMLInputElement} importInput
     * @param {Object} toast
     * @param {HTMLElement} [lastRestoreEl=null]
     */
    constructor(importBtns, importInput, toast, lastRestoreEl = null) {
        this.importBtns = Array.isArray(importBtns) ? importBtns : [importBtns];
        this.importInput = importInput;
        this.toast = toast;
        this.lastRestoreEl = lastRestoreEl;

        this._initEvents();
        this._loadDate();
    }

    /**
     * @private
     * @returns {void}
     */
    _initEvents() {
        if (this.importInput) {
            this.importBtns.forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', () => {
                        this.importInput.click();
                    });
                }
            });

            this.importInput.addEventListener('change', (e) => {
                this._handleImport(e);
            });
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async _loadDate() {
        const data = await StorageManager.getLocalData(['lastRestoreDate']);
        if (this.lastRestoreEl && data.lastRestoreDate) {
            this.lastRestoreEl.textContent = new Date(data.lastRestoreDate).toLocaleString();
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

                const restoreDate = Date.now();
                data.lastRestoreDate = restoreDate;

                await StorageManager.setLocalData(data);

                if (this.lastRestoreEl) {
                    this.lastRestoreEl.textContent = new Date(restoreDate).toLocaleString();
                }

                this.toast.show(window.LocaleManager.getString('restoreSuccess'));

                setTimeout(() => {
                    const wrapper = document.querySelector('.page-wrapper');
                    if (wrapper) wrapper.classList.add('page-transition-exit');
                    setTimeout(() => {
                        window.location.reload();
                    }, 200);
                }, 1300);

            } catch (error) {
                this.toast.show(window.LocaleManager.getString('restoreInvalidFile'), true);
            }

            this.importInput.value = '';
        };

        reader.onerror = () => {
            this.toast.show(window.LocaleManager.getString('restoreError'), true);
            this.importInput.value = '';
        };

        reader.readAsText(file);
    }
}