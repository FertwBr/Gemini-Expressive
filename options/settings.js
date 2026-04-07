/**
 * @fileoverview Main entry point for the settings page.
 * @copyright (c) 2026 Fertwbr
 */

import {StorageManager} from './core/StorageManager.js';
import {ToastNotification} from './components/ToastNotification.js';

/**
 * @param {string} languageCode
 * @returns {string}
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
 * @returns {void}
 */
function applyLocalizations() {
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

document.addEventListener('DOMContentLoaded', async () => {
    applyLocalizations();

    const timelineSwitch = document.getElementById('enableTimeline');
    const collapseSwitch = document.getElementById('enableCollapse');
    const codeNavSwitch = document.getElementById('enableCodeNav');
    const headersSwitch = document.getElementById('enableHeaders');
    const dynamicColorSwitch = document.getElementById('enableDynamicColor');
    const hideUpgradeSwitch = document.getElementById('hideUpgradeBtn');
    const colorPickerRow = document.getElementById('colorPickerRow');
    const colorPicker = document.getElementById('themeColorPicker');
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const versionText = document.getElementById('versionText');
    const toastElement = document.getElementById('toast-notification');
    const toastMessageElement = document.getElementById('toast-message');

    const prefixDropdownBtn = document.getElementById('prefixDropdownBtn');
    const prefixDropdownMenu = document.getElementById('prefixDropdownMenu');
    const currentPrefixLabel = document.getElementById('currentPrefixLabel');
    const prefixMenuItems = prefixDropdownMenu.querySelectorAll('.setting-menu-item');

    const dropdownBtn = document.getElementById('langDropdownBtn');
    const dropdownMenu = document.getElementById('langDropdownMenu');
    const currentFlag = document.getElementById('currentFlag');
    const currentLangLabel = document.getElementById('currentLangLabel');
    const menuItems = dropdownMenu.querySelectorAll('.footer-menu-item');

    const themeDropdownBtn = document.getElementById('themeDropdownBtn');
    const themeDropdownMenu = document.getElementById('themeDropdownMenu');
    const currentThemeLabel = document.getElementById('currentThemeLabel');
    const themeMenuItems = themeDropdownMenu.querySelectorAll('.setting-menu-item');

    const toast = new ToastNotification(toastElement, toastMessageElement);

    let selectedPrefix = '/';
    let selectedThemeMode = 'auto';
    let selectedLang = 'auto';

    if (window.chrome && chrome.runtime && chrome.runtime.getManifest) {
        versionText.textContent = 'v' + chrome.runtime.getManifest().version;
    }

    document.querySelectorAll('.help-tooltip-container').forEach(container => {
        container.addEventListener('mouseenter', () => {
            const card = container.querySelector('.help-tooltip-card');
            if (!card) return;

            card.classList.remove('pos-bottom', 'pos-left', 'pos-right');

            const rect = card.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            if (rect.top < 0) {
                card.classList.add('pos-bottom');
            }

            const updatedRect = card.getBoundingClientRect();

            if (updatedRect.left < 0) {
                card.classList.add('pos-right');
            } else if (updatedRect.right > viewportWidth) {
                card.classList.add('pos-left');
            }
        });
    });

    /**
     * @param {string} lang
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
            currentLangLabel.textContent = window.getBgString('lang_auto');
        } else {
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            currentFlag.style.display = 'block';
            currentFlag.src = `https://flagcdn.com/w40/${getFlagCode(lang)}.png`;
            currentLangLabel.textContent = window.getBgString(`lang_${lang}`);
        }
    };

    /**
     * @param {string} theme
     */
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
     * @param {string} prefix
     */
    const updatePrefixDropdownVisuals = (prefix) => {
        prefixMenuItems.forEach(item => {
            if (item.getAttribute('data-prefix') === prefix) {
                item.classList.add('active');
                const spans = item.getElementsByTagName('span');
                if (spans.length > 1) {
                    currentPrefixLabel.textContent = prefix + ' (' + spans[1].textContent + ')';
                }
            } else {
                item.classList.remove('active');
            }
        });
    };

    /**
     * @param {string} color
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
     * @param {string} color
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

    const initialSettings = await StorageManager.getSettings();

    timelineSwitch.checked = initialSettings.timelineEnabled;
    collapseSwitch.checked = initialSettings.collapseEnabled;
    codeNavSwitch.checked = initialSettings.codeNavEnabled;
    headersSwitch.checked = initialSettings.headersEnabled;
    dynamicColorSwitch.checked = initialSettings.dynamicColorEnabled;
    hideUpgradeSwitch.checked = initialSettings.hideUpgradeEnabled;

    selectedPrefix = initialSettings.snippetPrefix;
    updatePrefixDropdownVisuals(selectedPrefix);

    if (!dynamicColorSwitch.checked) {
        colorPickerRow.style.opacity = '0.5';
        colorPickerRow.style.pointerEvents = 'none';
    } else {
        colorPickerRow.style.opacity = '1';
        colorPickerRow.style.pointerEvents = 'auto';
    }

    selectedThemeMode = initialSettings.themeMode;
    updateThemeDropdownVisuals(selectedThemeMode);

    colorPicker.value = initialSettings.themeColor;
    updateSwatchSelection(initialSettings.themeColor);

    selectedLang = initialSettings.language;
    updateDropdownVisuals(selectedLang);

    if (typeof window.applyMaterialTheme === 'function' && dynamicColorSwitch.checked) {
        window.applyMaterialTheme(colorPicker.value, selectedThemeMode);
    }

    /**
     * @param {boolean} [isThemeToggle=false]
     * @returns {Promise<void>}
     */
    async function saveSettings(isThemeToggle = false) {
        await StorageManager.saveSettings({
            timelineEnabled: timelineSwitch.checked,
            collapseEnabled: collapseSwitch.checked,
            codeNavEnabled: codeNavSwitch.checked,
            headersEnabled: headersSwitch.checked,
            themeMode: selectedThemeMode,
            themeColor: colorPicker.value,
            language: selectedLang,
            dynamicColorEnabled: dynamicColorSwitch.checked,
            hideUpgradeEnabled: hideUpgradeSwitch.checked,
            snippetPrefix: selectedPrefix
        });

        window.currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
        if (!window.BG_LOCALES || !window.BG_LOCALES[window.currentLanguage]) {
            window.currentLanguage = 'en';
        }

        applyLocalizations();
        updateDropdownVisuals(selectedLang);
        updateThemeDropdownVisuals(selectedThemeMode);
        updatePrefixDropdownVisuals(selectedPrefix);

        if (dynamicColorSwitch.checked) {
            colorPickerRow.style.opacity = '1';
            colorPickerRow.style.pointerEvents = 'auto';
            if (typeof window.applyMaterialTheme === 'function') {
                window.applyMaterialTheme(colorPicker.value, selectedThemeMode);
            }
        } else {
            colorPickerRow.style.opacity = '0.5';
            colorPickerRow.style.pointerEvents = 'none';
        }

        if (isThemeToggle) {
            toast.show(window.getBgString('statusSavedRefresh'), true);
        } else {
            toast.show(window.getBgString('statusSaved'));
        }
    }

    timelineSwitch.addEventListener('change', () => saveSettings(false));
    collapseSwitch.addEventListener('change', () => saveSettings(false));
    codeNavSwitch.addEventListener('change', () => saveSettings(false));
    headersSwitch.addEventListener('change', () => saveSettings(false));
    dynamicColorSwitch.addEventListener('change', () => saveSettings(true));
    hideUpgradeSwitch.addEventListener('change', () => saveSettings(false));

    prefixDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prefixDropdownBtn.classList.toggle('open');
        prefixDropdownMenu.classList.toggle('open');
    });

    prefixMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            selectedPrefix = item.getAttribute('data-prefix');
            updatePrefixDropdownVisuals(selectedPrefix);
            prefixDropdownBtn.classList.remove('open');
            prefixDropdownMenu.classList.remove('open');
            saveSettings(false);
        });
    });

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
            saveSettings(false);
        });
    });

    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.getAttribute('data-color');
            colorPicker.value = color;
            updateSwatchSelection(color);
            saveSettings(false);
        });
    });

    colorPicker.addEventListener('change', () => {
        updateSwatchSelection(colorPicker.value);
        saveSettings(false);
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
        if (!prefixDropdownBtn.contains(e.target) && !prefixDropdownMenu.contains(e.target)) {
            prefixDropdownBtn.classList.remove('open');
            prefixDropdownMenu.classList.remove('open');
        }
    });

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            selectedLang = item.getAttribute('data-lang');
            dropdownBtn.classList.remove('open');
            dropdownMenu.classList.remove('open');
            saveSettings(false);
        });
    });

    const manageSnippetsBtn = document.querySelector('a[href="snippets.html"]');
    if (manageSnippetsBtn) {
        manageSnippetsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.page-wrapper').classList.add('page-transition-exit');
            setTimeout(() => {
                window.location.href = 'snippets.html';
            }, 150);
        });
    }
});