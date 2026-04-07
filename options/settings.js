/**
 * @fileoverview Main entry point for the settings page.
 * @copyright (c) 2026 Fertwbr
 */

import {StorageManager} from './core/StorageManager.js';
import {Localization} from './core/Localization.js';
import {ToastNotification} from './components/ToastNotification.js';
import {TooltipManager} from './components/TooltipManager.js';
import {DropdownMenu} from './components/DropdownMenu.js';
import {ColorPicker} from './components/ColorPicker.js';

document.addEventListener('DOMContentLoaded', async () => {
    Localization.apply();
    TooltipManager.init();

    const timelineSwitch = document.getElementById('enableTimeline');
    const collapseSwitch = document.getElementById('enableCollapse');
    const codeNavSwitch = document.getElementById('enableCodeNav');
    const headersSwitch = document.getElementById('enableHeaders');
    const dynamicColorSwitch = document.getElementById('enableDynamicColor');
    const hideUpgradeSwitch = document.getElementById('hideUpgradeBtn');
    const colorPickerRow = document.getElementById('colorPickerRow');
    const versionText = document.getElementById('versionText');
    const toastElement = document.getElementById('toast-notification');
    const toastMessageElement = document.getElementById('toast-message');

    const toast = new ToastNotification(toastElement, toastMessageElement);

    let selectedPrefix = '/';
    let selectedThemeMode = 'auto';
    let selectedLang = 'auto';
    let selectedColor = '#1A73E8';

    if (window.chrome && chrome.runtime && chrome.runtime.getManifest) {
        versionText.textContent = 'v' + chrome.runtime.getManifest().version;
    }

    const currentPrefixLabel = document.getElementById('currentPrefixLabel');
    const prefixDropdown = new DropdownMenu(
        document.getElementById('prefixDropdownBtn'),
        document.getElementById('prefixDropdownMenu'),
        '.setting-menu-item',
        'active',
        (item) => {
            selectedPrefix = item.getAttribute('data-prefix');
            updatePrefixVisuals(selectedPrefix);
            saveSettings(false);
        }
    );

    const currentThemeLabel = document.getElementById('currentThemeLabel');
    const themeDropdown = new DropdownMenu(
        document.getElementById('themeDropdownBtn'),
        document.getElementById('themeDropdownMenu'),
        '.setting-menu-item',
        'active',
        (item) => {
            selectedThemeMode = item.getAttribute('data-theme');
            updateThemeVisuals(selectedThemeMode);
            saveSettings(false);
        }
    );

    const dropdownBtn = document.getElementById('langDropdownBtn');
    const currentFlag = document.getElementById('currentFlag');
    const currentLangLabel = document.getElementById('currentLangLabel');
    const langDropdown = new DropdownMenu(
        dropdownBtn,
        document.getElementById('langDropdownMenu'),
        '.footer-menu-item',
        'active',
        (item) => {
            selectedLang = item.getAttribute('data-lang');
            updateLangVisuals(selectedLang);
            saveSettings(false);
        }
    );

    const colorPicker = new ColorPicker(
        document.querySelectorAll('.color-swatch'),
        document.getElementById('themeColorPicker'),
        document.querySelector('.custom-color-wrapper'),
        document.getElementById('customColorPreview'),
        (color) => {
            selectedColor = color;
            saveSettings(false);
        }
    );

    /**
     * @param {string} prefix
     */
    function updatePrefixVisuals(prefix) {
        prefixDropdown.setActiveByAttribute('data-prefix', prefix);
        prefixDropdown.items.forEach(item => {
            if (item.getAttribute('data-prefix') === prefix) {
                const spans = item.getElementsByTagName('span');
                if (spans.length > 1) {
                    currentPrefixLabel.textContent = prefix + ' (' + spans[1].textContent + ')';
                }
            }
        });
    }

    /**
     * @param {string} theme
     */
    function updateThemeVisuals(theme) {
        themeDropdown.setActiveByAttribute('data-theme', theme);
        themeDropdown.items.forEach(item => {
            if (item.getAttribute('data-theme') === theme) {
                const spanEl = item.querySelector('span[data-i18n]');
                if (spanEl) {
                    currentThemeLabel.textContent = spanEl.textContent;
                }
            }
        });
    }

    /**
     * @param {string} lang
     */
    function updateLangVisuals(lang) {
        langDropdown.setActiveByAttribute('data-lang', lang);

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
            currentLangLabel.textContent = LocaleManager.getString('lang_auto');
        } else {
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            currentFlag.style.display = 'block';
            currentFlag.src = `https://flagcdn.com/w40/${Localization.getFlagCode(lang)}.png`;
            currentLangLabel.textContent = LocaleManager.getString(`lang_${lang}`);
        }
    }

    const initialSettings = await StorageManager.getSettings();

    timelineSwitch.checked = initialSettings.timelineEnabled;
    collapseSwitch.checked = initialSettings.collapseEnabled;
    codeNavSwitch.checked = initialSettings.codeNavEnabled;
    headersSwitch.checked = initialSettings.headersEnabled;
    dynamicColorSwitch.checked = initialSettings.dynamicColorEnabled;
    hideUpgradeSwitch.checked = initialSettings.hideUpgradeEnabled;

    selectedPrefix = initialSettings.snippetPrefix;
    updatePrefixVisuals(selectedPrefix);

    selectedThemeMode = initialSettings.themeMode;
    updateThemeVisuals(selectedThemeMode);

    selectedColor = initialSettings.themeColor;
    colorPicker.customInput.value = selectedColor;
    colorPicker.updateSelection(selectedColor);

    selectedLang = initialSettings.language;
    updateLangVisuals(selectedLang);

    if (!dynamicColorSwitch.checked) {
        colorPickerRow.style.opacity = '0.5';
        colorPickerRow.style.pointerEvents = 'none';
    } else {
        colorPickerRow.style.opacity = '1';
        colorPickerRow.style.pointerEvents = 'auto';
        if (typeof ThemeUtils !== 'undefined') {
            ThemeUtils.applyMaterialTheme(selectedColor, selectedThemeMode);
        }
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
            themeColor: selectedColor,
            language: selectedLang,
            dynamicColorEnabled: dynamicColorSwitch.checked,
            hideUpgradeEnabled: hideUpgradeSwitch.checked,
            snippetPrefix: selectedPrefix
        });

        LocaleManager.currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
        if (!LocaleManager.BG_LOCALES || !LocaleManager.BG_LOCALES[LocaleManager.currentLanguage]) {
            LocaleManager.currentLanguage = 'en';
        }

        Localization.apply();
        updateLangVisuals(selectedLang);
        updateThemeVisuals(selectedThemeMode);
        updatePrefixVisuals(selectedPrefix);

        if (dynamicColorSwitch.checked) {
            colorPickerRow.style.opacity = '1';
            colorPickerRow.style.pointerEvents = 'auto';
            if (typeof ThemeUtils !== 'undefined') {
                ThemeUtils.applyMaterialTheme(selectedColor, selectedThemeMode);
            }
        } else {
            colorPickerRow.style.opacity = '0.5';
            colorPickerRow.style.pointerEvents = 'none';
        }

        if (isThemeToggle) {
            toast.show(LocaleManager.getString('statusSavedRefresh'), true);
        } else {
            toast.show(LocaleManager.getString('statusSaved'));
        }
    }

    timelineSwitch.addEventListener('change', () => saveSettings(false));
    collapseSwitch.addEventListener('change', () => saveSettings(false));
    codeNavSwitch.addEventListener('change', () => saveSettings(false));
    headersSwitch.addEventListener('change', () => saveSettings(false));
    dynamicColorSwitch.addEventListener('change', () => saveSettings(true));
    hideUpgradeSwitch.addEventListener('change', () => saveSettings(false));

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