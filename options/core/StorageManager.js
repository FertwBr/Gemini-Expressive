/**
 * @fileoverview Storage management utility for Chrome extensions.
 * @copyright (c) 2026 Fertwbr
 */

import { DefaultConfig } from './Config.js';

/**
 * Manager for Chrome storage operations.
 */
export class StorageManager {
    /**
     * Retrieves all sync settings or a specific set of keys.
     * @param {Array<string>|null} [keys=null]
     * @returns {Promise<Object>}
     */
    static async getSettings(keys = null) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(keys, (items) => {
                resolve({ ...DefaultConfig, ...items });
            });
        });
    }

    /**
     * Saves sync settings to Chrome storage.
     * @param {Object} settings
     * @returns {Promise<void>}
     */
    static async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set(settings, () => {
                resolve();
            });
        });
    }

    /**
     * Retrieves data from local storage.
     * @param {Array<string>|string|Object|null} [keys=null]
     * @returns {Promise<Object>}
     */
    static async getLocalData(keys = null) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    }

    /**
     * Saves data to local storage.
     * @param {Object} data
     * @returns {Promise<void>}
     */
    static async setLocalData(data) {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                resolve();
            });
        });
    }

    /**
     * Listens for changes in the storage.
     * @param {Function} callback
     */
    static onChange(callback) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                callback(changes);
            }
        });
    }
}