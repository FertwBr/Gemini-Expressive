/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Defines the default configuration parameters for the Better Gemini extension.
 * These values act as the baseline state for user preferences regarding UI features,
 * theming, and localization before any custom settings are loaded from storage.
 * * @constant {Object}
 */
export const DefaultConfig = {
    timelineEnabled: true,
    collapseEnabled: true,
    autoCenterCollapseEnabled: false,
    codeNavEnabled: true,
    headersEnabled: true,
    themeMode: 'auto',
    themeColor: '#6750A4',
    language: 'auto',
    dynamicColorEnabled: true,
    hideUpgradeEnabled: false,
    hideDownloadEnabled: false,
    snippetPrefix: '/'
};