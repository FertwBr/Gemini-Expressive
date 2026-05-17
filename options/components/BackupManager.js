/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {StorageManager} from '../core/StorageManager.js';

/**
 * Facilitates the exportation of application data to a downloadable JSON file.
 * It aggregates both local device-specific data and synchronized user preferences,
 * packages them into a versioned JSON payload, appends a creation timestamp,
 * and triggers a native browser file download.
 */
export class BackupExporter {
    /**
     * Initializes the BackupExporter instance and binds necessary UI interactions.
     * * @param {HTMLElement|HTMLElement[]} exportBtns - A single DOM element or an array of DOM elements that trigger the export process when clicked.
     * @param {Object} toast - The notification manager instance used to display operation success or failure messages.
     * @param {HTMLElement|null} [lastBackupEl=null] - The optional DOM element used to display the formatted date of the most recent backup.
     */
    constructor(exportBtns, toast, lastBackupEl = null) {
        this.exportBtns = Array.isArray(exportBtns) ? exportBtns : [exportBtns];
        this.toast = toast;
        this.lastBackupEl = lastBackupEl;

        this._initEvents();
        this._loadDate();
    }

    /**
     * Attaches click event listeners to all registered export buttons to initiate the data export sequence.
     * * @private
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
     * Retrieves the timestamp of the last successful backup from local storage and updates the corresponding UI element.
     * * @private
     * @returns {Promise<void>} A promise that resolves when the UI has been updated with the stored date.
     */
    async _loadDate() {
        const data = await StorageManager.getLocalData(['lastBackupDate']);
        if (this.lastBackupEl && data.lastBackupDate) {
            this.lastBackupEl.textContent = new Date(data.lastBackupDate).toLocaleString();
        }
    }

    /**
     * Orchestrates the data gathering, payload structuring, and file download processes.
     * Combines both local storage data and synchronized settings into a version 2 backup structure,
     * updates the local backup timestamp, creates a Blob, and simulates a click to download the JSON file.
     * * @private
     * @returns {Promise<void>} A promise that resolves when the export process completes or fails, triggering a toast notification.
     */
    async _handleExport() {
        try {
            const localData = await StorageManager.getLocalData(null) || {};
            const syncData = await StorageManager.getSettings(null) || {};
            const backupDate = Date.now();

            localData.lastBackupDate = backupDate;
            await StorageManager.setLocalData({lastBackupDate: backupDate});

            if (this.lastBackupEl) {
                this.lastBackupEl.textContent = new Date(backupDate).toLocaleString();
            }

            const backupPayload = {
                version: 2,
                local: localData,
                sync: syncData
            };

            const dataStr = JSON.stringify(backupPayload, null, 2);
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
 * Handles the importation and restoration of application data from a previously exported JSON file.
 * It validates the file structure, manages backwards compatibility for older unversioned backups,
 * distributes data to local and synchronized storage appropriately, and reloads the application to apply changes.
 */
export class BackupImporter {
    /**
     * Initializes the BackupImporter instance and configures the hidden file input mechanisms.
     * * @param {HTMLElement|HTMLElement[]} importBtns - The visible DOM element(s) that act as proxies to trigger the hidden file input.
     * @param {HTMLInputElement} importInput - The hidden file input element responsible for accepting the JSON file.
     * @param {Object} toast - The notification manager instance used to display operation status updates.
     * @param {HTMLElement|null} [lastRestoreEl=null] - The optional DOM element used to display the formatted date of the most recent restoration.
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
     * Binds click events on proxy buttons to trigger the file selector, and attaches the change listener to the file input to process the upload.
     * * @private
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
     * Retrieves the timestamp of the last successful restoration from local storage and visually updates the associated UI element.
     * * @private
     * @returns {Promise<void>} A promise that resolves when the UI reflects the loaded restore date.
     */
    async _loadDate() {
        const data = await StorageManager.getLocalData(['lastRestoreDate']);
        if (this.lastRestoreEl && data.lastRestoreDate) {
            this.lastRestoreEl.textContent = new Date(data.lastRestoreDate).toLocaleString();
        }
    }

    /**
     * Processes the uploaded JSON file, parsing and validating its contents.
     * Routes data to local and sync storage based on the backup payload version, updates the restoration timestamp,
     * triggers a success notification, and initiates a UI transition followed by a page reload.
     * * @private
     * @param {Event} event - The DOM event triggered when a file is selected via the file input.
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

                if (data.version === 2) {
                    const localPayload = data.local || {};
                    localPayload.lastRestoreDate = restoreDate;
                    await StorageManager.setLocalData(localPayload);

                    if (data.sync && Object.keys(data.sync).length > 0) {
                        await StorageManager.saveSettings(data.sync);
                    }
                } else {
                    data.lastRestoreDate = restoreDate;
                    await StorageManager.setLocalData(data);
                }

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