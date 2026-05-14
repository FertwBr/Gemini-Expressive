/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Utility responsible for extracting the application's runtime version and rendering it in the UI.
 * It directly hooks into the Chrome Extension API to read the version string defined in the manifest file.
 */
export class VersionDisplay {
    /**
     * Iterates over a collection of DOM elements and populates them with the formatted version string.
     * @param {Array<HTMLElement|null>} elements - A collection of elements designated to display the version number.
     * @returns {void}
     */
    static apply(elements) {
        if (window.chrome && chrome.runtime && chrome.runtime.getManifest) {
            const manifestVersion = 'v' + chrome.runtime.getManifest().version;
            elements.forEach(el => {
                if (el) el.textContent = manifestVersion;
            });
        }
    }
}