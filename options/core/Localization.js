/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Provides utility functions to handle internationalization and region-specific
 * visual indicators across the application's user interface.
 */
export class Localization {
    /**
     * Determines the most appropriate regional country code to fetch the correct flag icon.
     * It evaluates the base language code and attempts to refine the geographic region
     * by inspecting the user's current system timezone.
     * * @param {string} languageCode - The base two-letter language code (e.g., 'pt', 'es', 'en').
     * @returns {string} The refined region code matching a flagcdn image identifier.
     */
    static getFlagCode(languageCode) {
        let tz = '';
        try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (e) {
            tz = '';
        }

        if (languageCode === 'pt') {
            if (tz.includes('Europe/') || tz.includes('Africa/')) return 'pt';
            return 'br';
        }
        if (languageCode === 'es') {
            if (tz.includes('Madrid') || tz.includes('Canary')) return 'es';
            if (tz.includes('Argentina')) return 'ar';
            if (tz.includes('Bogota')) return 'co';
            if (tz.includes('Lima') || tz.includes('Rio_Branco')) return 'pe';
            if (tz.includes('Santiago')) return 'cl';
            if (tz.includes('Caracas')) return 've';
            if (tz.includes('America/')) return 'mx';
            return 'es';
        }
        if (languageCode === 'en') {
            if (tz.includes('London')) return 'gb';
            if (tz.includes('Australia')) return 'au';
            if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'ca';
            return 'us';
        }
        if (languageCode === 'de') {
            if (tz.includes('Vienna')) return 'at';
            if (tz.includes('Zurich')) return 'ch';
            return 'de';
        }
        if (languageCode === 'ja') return 'jp';
        if (languageCode === 'hi') return 'in';

        return languageCode;
    }

    /**
     * Scans the document object model for specific localization attributes and replaces
     * the text content or input values of those elements with the corresponding translated strings.
     * Also processes tooltips defined by the data-i18n-title attribute.
     * * @returns {void}
     */
    static apply() {
        if (window.LocaleManager && window.LocaleManager.currentLanguage) {
            document.documentElement.lang = window.LocaleManager.currentLanguage;
        }

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = LocaleManager.getString(key);
            if (el.tagName === 'INPUT' && el.type === 'button') {
                el.value = translated;
            } else {
                el.textContent = translated;
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.setAttribute('title', LocaleManager.getString(key));
        });
    }
}