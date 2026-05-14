/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {StorageManager} from '../core/StorageManager.js';

/**
 * Facilitates the exportation of application data to a downloadable JSON file.
 * It interacts with the local storage manager to retrieve current user configurations,
 * appends a timestamp indicating when the backup was created, and triggers a file
 * download natively in the browser.
 */
export class BackupExporter {
    /**
     * Initializes the exporter with the necessary UI elements.
     * @param {Array<HTMLElement>|HTMLElement} exportBtns - The button or array of buttons that trigger the export.
     * @param {Object} toast - The notification system used to display success or error messages.
     * @param {HTMLElement} [lastBackupEl=null] - The DOM element where the last backup date is displayed.
     */
    constructor(exportBtns, toast, lastBackupEl = null) {
        this.exportBtns = Array.isArray(exportBtns) ? exportBtns : [exportBtns];
        this.toast = toast;
        this.lastBackupEl = lastBackupEl;

        this._initEvents();
        this._loadDate();
    }

    /**
     * Binds the click event listeners to the export buttons.
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
     * Retrieves the last backup date from local storage and updates the UI element to reflect it.
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
     * Gathers all local storage data, updates the backup timestamp, and generates a downloadable JSON blob.
     * Displays a toast notification based on the success or failure of the operation.
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

/**
 * Handles the importation and restoration of application data from a JSON file.
 * Validates the uploaded file format, overwrites the local storage with the new data,
 * updates the restoration timestamp, and reloads the application to apply the changes.
 */
export class BackupImporter {
    /**
     * Initializes the importer with UI components and the hidden file input element.
     * @param {Array<HTMLElement>|HTMLElement} importBtns - The visible button(s) that trigger the hidden file input.
     * @param {HTMLInputElement} importInput - The hidden file input element that accepts the JSON file.
     * @param {Object} toast - The notification system for displaying operation status.
     * @param {HTMLElement} [lastRestoreEl=null] - The DOM element displaying the last restoration date.
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
     * Binds the necessary event listeners to trigger the file selector and handle the file upload change event.
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
     * Retrieves the last restore date from local storage and updates the corresponding UI element.
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
     * Processes the selected file, parses its JSON content, validates its structure,
     * saves the new configuration to local storage, and triggers a page reload with a transition.
     * @private
     * @param {Event} event - The file input change event.
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