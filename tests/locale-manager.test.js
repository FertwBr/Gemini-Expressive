const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadScript } = require('./test-helpers');

function loadLocaleManager({ browserLanguage, storedLanguage }) {
    const sandbox = loadScript(path.join(__dirname, '..', 'scripts', 'locales', 'LocaleManager.js'), {
        window: {},
        navigator: {
            language: browserLanguage
        },
        chrome: {
            storage: {
                sync: {
                    get(keys, callback) {
                        callback({ language: storedLanguage });
                    }
                }
            }
        }
    });

    return sandbox.window.LocaleManager;
}

test('LocaleManager.initLanguage applies explicit stored language preference', () => {
    const LocaleManager = loadLocaleManager({
        browserLanguage: 'de-DE',
        storedLanguage: 'pt'
    });

    assert.equal(LocaleManager.currentLanguage, 'pt');
    assert.equal(LocaleManager.getString('modeAuto'), LocaleManager.BG_LOCALES.pt.modeAuto);
});

test('LocaleManager.getString falls back to English and key when missing', () => {
    const LocaleManager = loadLocaleManager({
        browserLanguage: 'fr-FR',
        storedLanguage: 'xx'
    });

    assert.equal(LocaleManager.currentLanguage, 'en');
    assert.equal(LocaleManager.getString('modeDark'), 'Dark');
    assert.equal(LocaleManager.getString('missing.translation.key'), 'missing.translation.key');
});
