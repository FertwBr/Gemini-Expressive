/**
 * @fileoverview Manages UI injections, native theme synchronization, and layout fixes.
 * @copyright (c) 2026 Fertwbr
 */

class UIManager {
    static isApplyingTheme = false;

    /**
     * Applies CSS classes to the body to instantly hide/show features.
     * @param {Object} settings Current extension settings.
     */
    static applyFeatureToggles(settings) {
        if (!document.body) return;
        document.body.classList.toggle('bg-timeline-disabled', !settings.timelineEnabled);
        document.body.classList.toggle('bg-collapse-disabled', !settings.collapseEnabled);
        document.body.classList.toggle('bg-headers-disabled', !settings.headersEnabled);
        document.body.classList.toggle('bg-code-nav-disabled', !settings.codeNavEnabled);
        document.body.classList.toggle('bg-dynamic-theme-enabled', settings.dynamicColorEnabled);
        document.body.classList.toggle('bg-hide-upgrade', settings.hideUpgradeEnabled);
    }

    /**
     * Attempts to apply the Material You theme using ThemeUtils.
     * @param {Object} settings Current extension settings.
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
     * Injects a static <style> element to handle structural layout fixes.
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
                .edit-button-area button.cancel-button .mdc-button__label { color: var(--gem-sys-color--primary) !important; }
                .edit-button-area button.update-button:not(:disabled) { background-color: var(--gem-sys-color--primary) !important; }
                .edit-button-area button.update-button:not(:disabled) .mdc-button__label { color: var(--gem-sys-color--on-primary) !important; }
                .code-block-decoration .buttons button.mdc-icon-button { width: 32px !important; height: 32px !important; padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }
                .code-block-decoration .buttons button.mdc-icon-button mat-icon, .code-block-decoration .buttons button.mdc-icon-button .google-symbols { margin: 0 !important; display: block !important; }
            `;
            document.head.appendChild(style);
        }
    }

    static closeNativeMenus() {
        const backdrop = document.querySelector('.cdk-overlay-backdrop');
        if (backdrop) backdrop.click();
        else document.body.click();
    }

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