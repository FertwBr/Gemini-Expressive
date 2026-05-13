/**
 * @fileoverview Utility to display the extension version.
 * @copyright (c) 2026 Fertwbr
 */

export class VersionDisplay {
    /**
     * @param {Array<HTMLElement|null>} elements
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