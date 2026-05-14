/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {DefaultConfig} from './Config.js';

/**
 * Acts as a centralized interface for interacting with the Chrome Extensions Storage API.
 * It abstracts the asynchronous read and write operations, providing distinct methods for
 * handling synchronized user preferences (sync) and device-specific application state (local).
 */
export class StorageManager {
    /**
     * Retrieves user configuration settings from Chrome's synchronized storage.
     * Automatically merges the retrieved settings with the baseline application defaults
     * to ensure all expected configuration keys are populated even if omitted in storage.
     * * @param {Array<string>|null} [keys=null] - Specific configuration keys to retrieve, or null for all settings.
     * @returns {Promise<Object>} A promise resolving to the merged configuration object.
     */
    static async getSettings(keys = null) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(keys, (items) => {
                resolve({...DefaultConfig, ...items});
            });
        });
    }

    /**
     * Persists user configuration settings to Chrome's synchronized storage, making them
     * available across all browser instances logged into the same user account.
     * * @param {Object} settings - A key-value map of configuration changes to save.
     * @returns {Promise<void>} A promise that resolves when the save operation completes.
     */
    static async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set(settings, () => {
                resolve();
            });
        });
    }

    /**
     * Retrieves raw application data from Chrome's local storage. This is typically used
     * for device-specific state, caches, or backups that do not need to be synchronized remotely.
     * * @param {Array<string>|string|Object|null} [keys=null] - Keys to retrieve, or null for the entire local dataset.
     * @returns {Promise<Object>} A promise resolving to the requested local storage data.
     */
    static async getLocalData(keys = null) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    }

    /**
     * Saves raw application data directly to Chrome's local storage.
     * * @param {Object} data - A key-value map of local data state to save.
     * @returns {Promise<void>} A promise that resolves when the local save operation completes.
     */
    static async setLocalData(data) {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                resolve();
            });
        });
    }

    /**
     * Registers a listener callback that triggers whenever there is a modification
     * specifically to the synchronized storage area.
     * * @param {Function} callback - The function to execute when a sync storage change is detected.
     */
    static onChange(callback) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                callback(changes);
            }
        });
    }
}