/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Handles direct DOM manipulations to enforce UI features, inject structural layout fixes,
 * and synchronize the application's appearance with the native Material You theme settings.
 * Includes fallback logic to interact with native interface menus invisibly.
 */
class UIManager {
    static isApplyingTheme = false;

    /**
     * Maps the current extension settings to specific CSS classes on the document body,
     * acting as global toggles to show or hide injected features purely via CSS rules.
     * @param {Object} settings - The current extension state containing boolean feature flags.
     */
    static applyFeatureToggles(settings) {
        if (!document.body) return;

        document.body.classList.toggle('bg-timeline-disabled', !settings.timelineEnabled);
        document.body.classList.toggle('bg-collapse-disabled', !settings.collapseEnabled);
        document.body.classList.toggle('bg-auto-center-enabled', settings.autoCenterCollapseEnabled);
        document.body.classList.toggle('bg-headers-disabled', !settings.headersEnabled);
        document.body.classList.toggle('bg-code-nav-disabled', !settings.codeNavEnabled);
        document.body.classList.toggle('bg-dynamic-theme-enabled', settings.dynamicColorEnabled);
        document.body.classList.toggle('bg-hide-upgrade', settings.hideUpgradeEnabled);
        document.body.classList.toggle('bg-hide-download', settings.hideDownloadEnabled);
    }

    /**
     * Requests the ThemeUtils library to generate and apply a Material You theme scheme
     * based on the user's chosen hex color and light/dark mode preference.
     * @param {Object} settings - The current settings containing themeMode and themeColor.
     */
    static attemptThemeApplication(settings) {
        this.applyFeatureToggles(settings);
        if (!settings.dynamicColorEnabled) return;

        if (typeof ThemeUtils !== 'undefined' && !this.isApplyingTheme) {
            this.isApplyingTheme = true;
            ThemeUtils.applyMaterialTheme(settings.themeColor, settings.themeMode);
            setTimeout(() => {
                this.isApplyingTheme = false;
            }, 150);
        }
    }

    /**
     * Injects a persistent <style> tag into the document head containing critical layout
     * overwrites required for the extension's custom components to render correctly over the native UI.
     */
    static injectUIFixes() {
        if (!document.getElementById('bg-ui-fixes')) {
            const style = document.createElement('style');
            style.id = 'bg-ui-fixes';
            style.textContent = `
                .disclaimer-container .main-text, .disclaimer-container .content-container, .disclaimer-container.promo .main-text { background: transparent !important; color: var(--gem-sys-color--on-surface-variant) !important; }
                .disclaimer-container .action-button-wrapper button, .disclaimer-container button.action-button { background: transparent !important; background-color: transparent !important; color: var(--gem-sys-color--primary) !important; box-shadow: none !important; }
                .disclaimer-container .action-button-wrapper button .mdc-button__label, .disclaimer-container button.action-button .mdc-button__label { color: var(--gem-sys-color--primary) !important; }
                code-block, .code-block, .code-container { max-width: 100% !important; }
                pre { overflow-x: auto !important; max-width: 100% !important; }
                .code-block-decoration, .code-block-header, .header-formatted { border-top-left-radius: inherit; border-top-right-radius: inherit; }
                pre.bg-processed:not(.bg-collapsed) { padding-bottom: 56px !important; }
                .bg-code-nav { position: sticky; bottom: 16px; left: 50%; transform: translateX(-50%); width: max-content; display: flex; flex-direction: row; gap: 12px; z-index: 10; opacity: 0; transition: opacity 0.2s ease-in-out; pointer-events: none; margin-top: -52px; margin-bottom: 16px; }
                .bg-code-nav-disabled .bg-code-nav { display: none !important; }
                code-block:hover .bg-code-nav, .code-block:hover .bg-code-nav, pre:hover ~ .bg-code-nav, .bg-code-nav:hover { opacity: 1; }
                pre.bg-collapsed ~ .bg-code-nav { display: none !important; }
                .bg-code-nav-btn { background: var(--gem-sys-color--surface-container-highest, #36343b); color: var(--gem-sys-color--on-surface, #e3e2e6); border: 1px solid var(--gem-sys-color--outline-variant, #44474e); border-radius: 50%; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: background 0.2s, transform 0.1s; pointer-events: auto; }
                .bg-code-nav-btn .google-symbols { margin: 0 !important; display: block !important; font-size: 24px; line-height: 1; }
                .bg-code-nav-btn:hover { background: var(--gem-sys-color--surface-variant, #44474e); transform: scale(1.05); }
                .bg-code-nav-btn:active { transform: scale(0.95); }
                .edit-button-area button.cancel-button:not(:disabled):not([disabled]) .mdc-button__label { color: var(--gem-sys-color--primary) !important; }
                .edit-button-area button.update-button:not(:disabled):not([disabled]) { background-color: var(--gem-sys-color--primary) !important; }
                .edit-button-area button.update-button:not(:disabled):not([disabled]) .mdc-button__label { color: var(--gem-sys-color--on-primary) !important; }
                .code-block-decoration .buttons button.mdc-icon-button { width: 32px !important; height: 32px !important; padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }
                .code-block-decoration .buttons button.mdc-icon-button mat-icon, .code-block-decoration .buttons button.mdc-icon-button .google-symbols { margin: 0 !important; display: block !important; }
                
                body.bg-hide-download button.mat-mdc-icon-button:has(mat-icon[data-mat-icon-name="download"]),
                body.bg-hide-download button.mat-mdc-icon-button:has(mat-icon[fonticon="download"]) {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Programmatically dismisses active native dropdown menus or overlays by simulating
     * a click on the backdrop or the body element.
     */
    static closeNativeMenus() {
        const backdrop = document.querySelector('.cdk-overlay-backdrop');
        if (backdrop) backdrop.click();
        else document.body.click();
    }

    /**
     * Simulates interactions with the native theme selection menu. It opens the menu,
     * identifies the correct radio button based on localized keywords, clicks it, and closes the menu.
     * @param {HTMLElement} themeButton - The DOM button element that triggers the native theme menu.
     * @param {string} targetMode - The desired theme state ('light', 'dark', or 'auto').
     * @param {Object} settings - The current extension settings.
     */
    static executeThemeClick(themeButton, targetMode, settings) {
        themeButton.click();
        setTimeout(() => {
            const openMenus = document.querySelectorAll('.mat-mdc-menu-panel .mat-mdc-menu-content');
            const activeMenu = openMenus[openMenus.length - 1];

            if (activeMenu) {
                const options = activeMenu.querySelectorAll('[role="menuitemradio"]');
                let targetIndex = -1;
                const keywords = {
                    light: ['light', 'claro', 'clair', 'hell', 'chiaro'],
                    dark: ['dark', 'escur', 'oscur', 'sombre', 'dunkel', 'scuro'],
                    auto: ['auto', 'system', 'sistema', 'padrão', 'standard', 'predeterminado', 'device', 'dispositivo']
                };

                for (let i = 0; i < options.length; i++) {
                    const text = options[i].textContent.toLowerCase();
                    if (keywords[targetMode].some(kw => text.includes(kw))) {
                        targetIndex = i;
                        break;
                    }
                }

                if (targetIndex === -1 && options.length >= 3) {
                    if (targetMode === 'light') targetIndex = 0;
                    else if (targetMode === 'dark') targetIndex = 1;
                    else if (targetMode === 'auto') targetIndex = 2;
                }

                if (targetIndex !== -1 && options[targetIndex]) {
                    if (options[targetIndex].getAttribute('aria-checked') !== 'true') {
                        options[targetIndex].click();
                    }
                }
            }

            setTimeout(() => {
                this.closeNativeMenus();
                if (targetMode === 'auto') this.attemptThemeApplication(settings);
            }, 50);
        }, 150);
    }

    /**
     * Initiates the process of aligning the native web application's theme with the extension's state.
     * If the theme button is hidden inside a settings sub-menu, it navigates the UI tree to find and trigger it.
     * @param {string} targetMode - The target theme mode to apply.
     * @param {Object} settings - The current extension settings.
     */
    static syncNativeTheme(targetMode, settings) {
        try {
            const themeButton = document.querySelector('[data-test-id="desktop-theme-menu-button"]');
            if (!themeButton) {
                const settingsBtn = document.querySelector('button[aria-controls="settings-menu"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => {
                        const icon = b.querySelector('mat-icon');
                        return icon && icon.textContent.trim() === 'settings';
                    });

                if (settingsBtn) {
                    settingsBtn.click();
                    setTimeout(() => {
                        const dynamicThemeBtn = document.querySelector('[data-test-id="desktop-theme-menu-button"]');
                        if (dynamicThemeBtn) this.executeThemeClick(dynamicThemeBtn, targetMode, settings);
                        else this.closeNativeMenus();
                    }, 150);
                }
            } else {
                this.executeThemeClick(themeButton, targetMode, settings);
            }
        } catch (e) {
        }
    }
}

window.UIManager = UIManager;