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
import {BackupManager} from './components/BackupManager.js';
import {LanguageSelector} from './components/LanguageSelector.js';
import {QuickThemeToggle} from './components/QuickThemeToggle.js';
import {PrefixSelector} from './components/PrefixSelector.js';
import {VersionDisplay} from './components/VersionDisplay.js';
import {PageTransition} from './components/PageTransition.js';

document.addEventListener('DOMContentLoaded', async () => {
    Localization.apply();
    TooltipManager.init();

    const toast = new ToastNotification(
        document.getElementById('toast-notification'),
        document.getElementById('toast-message')
    );

    VersionDisplay.apply([
        document.getElementById('versionText'),
        document.getElementById('headerVersionText')
    ]);

    new BackupManager(
        document.getElementById('importBackupBtn'),
        document.getElementById('exportBackupBtn'),
        document.getElementById('importBackupInput'),
        toast
    );

    PageTransition.bind('a[href="snippets.html"]', 'snippets.html');

    const initialSettings = await StorageManager.getSettings();

    let selectedThemeMode = initialSettings.themeMode;
    let selectedLang = initialSettings.language;
    let selectedPrefix = initialSettings.snippetPrefix;
    let selectedColor = initialSettings.themeColor;

    const timelineSwitch = document.getElementById('enableTimeline');
    const collapseSwitch = document.getElementById('enableCollapse');
    const codeNavSwitch = document.getElementById('enableCodeNav');
    const headersSwitch = document.getElementById('enableHeaders');
    const dynamicColorSwitch = document.getElementById('enableDynamicColor');
    const hideUpgradeSwitch = document.getElementById('hideUpgradeBtn');
    const hideDownloadSwitch = document.getElementById('hideDownloadBtn');
    const colorPickerRow = document.getElementById('colorPickerRow');

    timelineSwitch.checked = initialSettings.timelineEnabled;
    collapseSwitch.checked = initialSettings.collapseEnabled;
    codeNavSwitch.checked = initialSettings.codeNavEnabled;
    headersSwitch.checked = initialSettings.headersEnabled;
    dynamicColorSwitch.checked = initialSettings.dynamicColorEnabled;
    hideUpgradeSwitch.checked = initialSettings.hideUpgradeEnabled;
    hideDownloadSwitch.checked = initialSettings.hideDownloadEnabled;

    /**
     * @param {boolean} [isThemeToggle=false]
     * @returns {Promise<void>}
     */
    const saveSettings = async (isThemeToggle = false) => {
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
            hideDownloadEnabled: hideDownloadSwitch.checked,
            snippetPrefix: selectedPrefix
        });

        LocaleManager.currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
        if (!LocaleManager.BG_LOCALES || !LocaleManager.BG_LOCALES[LocaleManager.currentLanguage]) {
            LocaleManager.currentLanguage = 'en';
        }

        Localization.apply();
        languageSelector.updateVisuals(selectedLang);
        themeDropdown.setActiveByAttribute('data-theme', selectedThemeMode);

        themeDropdown.items.forEach(item => {
            if (item.getAttribute('data-theme') === selectedThemeMode) {
                const spanEl = item.querySelector('span[data-i18n]');
                if (spanEl) {
                    document.getElementById('currentThemeLabel').textContent = spanEl.textContent;
                }
            }
        });

        quickThemeToggle.updateVisuals(selectedThemeMode);
        prefixSelector.updateVisuals(selectedPrefix);

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
    };

    const languageSelector = new LanguageSelector(
        document.getElementById('langDropdownBtn'),
        document.getElementById('langDropdownMenu'),
        document.getElementById('currentFlag'),
        document.getElementById('currentLangLabel'),
        selectedLang,
        (lang) => {
            selectedLang = lang;
            saveSettings(false);
        }
    );

    const prefixSelector = new PrefixSelector(
        document.getElementById('prefixDropdownBtn'),
        document.getElementById('prefixDropdownMenu'),
        document.getElementById('currentPrefixLabel'),
        selectedPrefix,
        (prefix) => {
            selectedPrefix = prefix;
            saveSettings(false);
        }
    );

    const quickThemeToggle = new QuickThemeToggle(
        document.getElementById('quickThemeBtn'),
        document.getElementById('quickThemeIcon'),
        selectedThemeMode,
        (theme) => {
            selectedThemeMode = theme;
            saveSettings(true);
        }
    );

    const themeDropdown = new DropdownMenu(
        document.getElementById('themeDropdownBtn'),
        document.getElementById('themeDropdownMenu'),
        '.setting-menu-item',
        'active',
        (item) => {
            selectedThemeMode = item.getAttribute('data-theme');
            quickThemeToggle.updateVisuals(selectedThemeMode);
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

    colorPicker.customInput.value = selectedColor;
    colorPicker.updateSelection(selectedColor);

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

    timelineSwitch.addEventListener('change', () => saveSettings(false));
    collapseSwitch.addEventListener('change', () => saveSettings(false));
    codeNavSwitch.addEventListener('change', () => saveSettings(false));
    headersSwitch.addEventListener('change', () => saveSettings(false));
    dynamicColorSwitch.addEventListener('change', () => saveSettings(true));
    hideUpgradeSwitch.addEventListener('change', () => saveSettings(false));
    hideDownloadSwitch.addEventListener('change', () => saveSettings(false));

    themeDropdown.setActiveByAttribute('data-theme', selectedThemeMode);
    themeDropdown.items.forEach(item => {
        if (item.getAttribute('data-theme') === selectedThemeMode) {
            const spanEl = item.querySelector('span[data-i18n]');
            if (spanEl) {
                document.getElementById('currentThemeLabel').textContent = spanEl.textContent;
            }
        }
    });
});