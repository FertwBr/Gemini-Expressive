/**
 * Maps a language code to the appropriate flag country code using timezone heuristics.
 * @param {string} languageCode The broad language code.
 * @returns {string} The specific flag country code.
 */
function getFlagCode(languageCode) {
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
 * Initializes and applies localizations to the settings UI.
 */
function applyLocalizations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = getBgString(key);
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = translated;
        } else {
            el.textContent = translated;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', getBgString(key));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyLocalizations();

    const timelineSwitch = document.getElementById('enableTimeline');
    const collapseSwitch = document.getElementById('enableCollapse');
    const codeNavSwitch = document.getElementById('enableCodeNav');
    const headersSwitch = document.getElementById('enableHeaders');
    const colorPicker = document.getElementById('themeColorPicker');
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const versionText = document.getElementById('versionText');
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    if (chrome.runtime && chrome.runtime.getManifest) {
        versionText.textContent = 'v' + chrome.runtime.getManifest().version;
    }

    const dropdownBtn = document.getElementById('langDropdownBtn');
    const dropdownMenu = document.getElementById('langDropdownMenu');
    const currentFlag = document.getElementById('currentFlag');
    const currentLangLabel = document.getElementById('currentLangLabel');
    const menuItems = dropdownMenu.querySelectorAll('.footer-menu-item');

    const themeDropdownBtn = document.getElementById('themeDropdownBtn');
    const themeDropdownMenu = document.getElementById('themeDropdownMenu');
    const currentThemeLabel = document.getElementById('currentThemeLabel');
    const themeMenuItems = themeDropdownMenu.querySelectorAll('.setting-menu-item');
    let selectedThemeMode = 'auto';

    let toastTimeout;

    /**
     * Shows a brief success toast notification.
     * @param {string} msg The message to show.
     */
    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    /**
     * Updates the language dropdown button visuals.
     * @param {string} lang The selected language code.
     */
    const updateDropdownVisuals = (lang) => {
        menuItems.forEach(item => {
            if (item.getAttribute('data-lang') === lang) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (lang === 'auto') {
            currentFlag.style.display = 'none';
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (!autoIcon) {
                autoIcon = document.createElement('span');
                autoIcon.className = 'material-symbols-outlined auto-icon-temp';
                autoIcon.textContent = 'auto_awesome';
                autoIcon.style.fontSize = '16px';
                dropdownBtn.insertBefore(autoIcon, currentLangLabel);
            }
            currentLangLabel.textContent = getBgString('lang_auto');
        } else {
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            currentFlag.style.display = 'block';
            currentFlag.src = `https://flagcdn.com/w40/${getFlagCode(lang)}.png`;
            currentLangLabel.textContent = getBgString(`lang_${lang}`);
        }
    };

    const updateThemeDropdownVisuals = (theme) => {
        themeMenuItems.forEach(item => {
            if (item.getAttribute('data-theme') === theme) {
                item.classList.add('active');
                const spanEl = item.querySelector('span[data-i18n]');
                if (spanEl) {
                    currentThemeLabel.textContent = spanEl.textContent;
                }
            } else {
                item.classList.remove('active');
            }
        });
    };

    /**
     * Updates the dynamic split layout preview for the custom color picker.
     * @param {string} color The hex color to use.
     */
    const updateCustomPreview = (color) => {
        const preview = document.getElementById('customColorPreview');
        if (preview) {
            preview.style.setProperty('--swatch-p', color);
            preview.style.setProperty('--swatch-s', `color-mix(in srgb, ${color} 70%, gray)`);
            preview.style.setProperty('--swatch-t', `color-mix(in srgb, ${color} 70%, #a49386)`);
        }
    };

    /**
     * Updates the active state of color swatches.
     * @param {string} color The hex color to match.
     */
    const updateSwatchSelection = (color) => {
        let matched = false;
        colorSwatches.forEach(swatch => {
            if (swatch.getAttribute('data-color').toLowerCase() === color.toLowerCase()) {
                swatch.classList.add('active');
                matched = true;
            } else {
                swatch.classList.remove('active');
            }
        });

        const wrapper = document.querySelector('.custom-color-wrapper');
        if (!matched) {
            if (wrapper) {
                wrapper.classList.add('active');
            }
            colorPicker.value = color;
            updateCustomPreview(color);
        } else {
            if (wrapper) {
                wrapper.classList.remove('active');
            }
            updateCustomPreview(colorPicker.value);
        }
    };

    let selectedLang = 'auto';

    chrome.storage.sync.get(['timelineEnabled', 'collapseEnabled', 'codeNavEnabled', 'headersEnabled', 'language', 'themeMode', 'themeColor'], (items) => {
        timelineSwitch.checked = items.timelineEnabled !== false;
        collapseSwitch.checked = items.collapseEnabled !== false;
        codeNavSwitch.checked = items.codeNavEnabled !== false;
        headersSwitch.checked = items.headersEnabled !== false;

        if (items.themeMode) {
            selectedThemeMode = items.themeMode;
        }
        updateThemeDropdownVisuals(selectedThemeMode);

        if (items.themeColor) {
            colorPicker.value = items.themeColor;
            updateSwatchSelection(items.themeColor);
        } else {
            updateSwatchSelection('#6750A4');
        }

        if (items.language) {
            selectedLang = items.language;
        }
        updateDropdownVisuals(selectedLang);

        if (typeof applyMaterialTheme === 'function') {
            applyMaterialTheme(colorPicker.value, selectedThemeMode);
        }
    });

    /**
     * Saves settings automatically to Chrome storage.
     */
    function saveSettings() {
        chrome.storage.sync.set({
            timelineEnabled: timelineSwitch.checked,
            collapseEnabled: collapseSwitch.checked,
            codeNavEnabled: codeNavSwitch.checked,
            headersEnabled: headersSwitch.checked,
            themeMode: selectedThemeMode,
            themeColor: colorPicker.value,
            language: selectedLang
        }, () => {
            currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
            if (!BG_LOCALES[currentLanguage]) {
                currentLanguage = 'en';
            }

            applyLocalizations();
            updateDropdownVisuals(selectedLang);
            updateThemeDropdownVisuals(selectedThemeMode);
            if (typeof applyMaterialTheme === 'function') {
                applyMaterialTheme(colorPicker.value, selectedThemeMode);
            }
            showToast(getBgString('statusSaved'));
        });
    }

    timelineSwitch.addEventListener('change', saveSettings);
    collapseSwitch.addEventListener('change', saveSettings);
    codeNavSwitch.addEventListener('change', saveSettings);
    headersSwitch.addEventListener('change', saveSettings);

    themeDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeDropdownBtn.classList.toggle('open');
        themeDropdownMenu.classList.toggle('open');
    });

    themeMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            selectedThemeMode = item.getAttribute('data-theme');
            updateThemeDropdownVisuals(selectedThemeMode);
            themeDropdownBtn.classList.remove('open');
            themeDropdownMenu.classList.remove('open');
            saveSettings();
        });
    });

    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.getAttribute('data-color');
            colorPicker.value = color;
            updateSwatchSelection(color);
            saveSettings();
        });
    });

    colorPicker.addEventListener('change', () => {
        updateSwatchSelection(colorPicker.value);
        saveSettings();
    });

    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownBtn.classList.toggle('open');
        dropdownMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownBtn.classList.remove('open');
            dropdownMenu.classList.remove('open');
        }
        if (!themeDropdownBtn.contains(e.target) && !themeDropdownMenu.contains(e.target)) {
            themeDropdownBtn.classList.remove('open');
            themeDropdownMenu.classList.remove('open');
        }
    });

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            selectedLang = item.getAttribute('data-lang');
            dropdownBtn.classList.remove('open');
            dropdownMenu.classList.remove('open');
            saveSettings();
        });
    });
});