/**
 * @fileoverview Localization utilities.
 * @copyright (c) 2026 Fertwbr
 */

export class Localization {
    /**
     * @param {string} languageCode
     * @returns {string}
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
     * @returns {void}
     */
    static apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = window.getBgString(key);
            if (el.tagName === 'INPUT' && el.type === 'button') {
                el.value = translated;
            } else {
                el.textContent = translated;
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.setAttribute('title', window.getBgString(key));
        });
    }
}