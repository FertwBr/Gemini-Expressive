/**
 * @fileoverview Injects the extension's settings shortcut into the native UI.
 * @copyright (c) 2026 Fertwbr
 */

class SettingsShortcut {
    /**
     * Safely fetches the localized string for the settings menu.
     * @returns {string}
     */
    static getExpressiveLabel() {
        return (typeof LocaleManager !== 'undefined') ? LocaleManager.getString('expressiveSettings') : 'Expressive Settings';
    }

    /**
     * Injects a settings shortcut button into the Gemini sidebar natively (Supports Desktop and Mobile).
     */
    static inject() {
        const nativeSettingsBtns = document.querySelectorAll(
            'side-nav-action-button[data-test-id="settings-and-help-button"], ' +
            'button[data-test-id="mobile-settings-and-help-control"]'
        );

        nativeSettingsBtns.forEach(nativeBtn => {
            let wrapperToClone = nativeBtn;

            if (nativeBtn.tagName !== 'SIDE-NAV-ACTION-BUTTON' && nativeBtn.closest('side-nav-action-button')) {
                wrapperToClone = nativeBtn.closest('side-nav-action-button');
            }

            if (wrapperToClone.previousElementSibling && wrapperToClone.previousElementSibling.classList.contains('bg-expressive-settings-shortcut')) {
                return;
            }

            let customWrapper;
            let isMobile = false;

            if (wrapperToClone.tagName.includes('-')) {
                customWrapper = document.createElement('div');
                Array.from(wrapperToClone.attributes).forEach(attr => {
                    if (attr.name !== 'id' && attr.name !== 'data-test-id') {
                        customWrapper.setAttribute(attr.name, attr.value);
                    }
                });
                Array.from(wrapperToClone.childNodes).forEach(child => {
                    customWrapper.appendChild(child.cloneNode(true));
                });
            } else {
                isMobile = true;
                customWrapper = wrapperToClone.cloneNode(true);
                customWrapper.removeAttribute('id');
            }

            customWrapper.classList.add('bg-expressive-settings-shortcut');
            customWrapper.removeAttribute('data-test-id');
            customWrapper.querySelectorAll('[data-test-id]').forEach(el => el.removeAttribute('data-test-id'));

            const button = customWrapper.tagName === 'BUTTON' ? customWrapper : customWrapper.querySelector('button');

            if (button) {
                button.classList.remove('mat-mdc-menu-trigger', 'mat-mdc-tooltip-trigger');
                button.removeAttribute('aria-controls');
                button.removeAttribute('aria-expanded');
                button.removeAttribute('aria-haspopup');
                button.removeAttribute('mattooltip');
                button.removeAttribute('mattooltipposition');
                button.removeAttribute('title');

                const labelText = this.getExpressiveLabel();
                button.setAttribute('aria-label', labelText);

                if (!isMobile) {
                    let tooltip = document.getElementById('bg-expressive-sidebar-tooltip');
                    if (!tooltip) {
                        tooltip = document.createElement('div');
                        tooltip.id = 'bg-expressive-sidebar-tooltip';
                        tooltip.className = 'bg-sidebar-tooltip';
                        document.body.appendChild(tooltip);
                    }

                    button.addEventListener('mouseenter', () => {
                        tooltip.textContent = this.getExpressiveLabel();
                        const expandedSidebar = document.querySelector('.sidenav-with-history-container.expanded');

                        if (!expandedSidebar) {
                            const rect = button.getBoundingClientRect();
                            tooltip.style.left = (rect.right + 8) + 'px';
                            tooltip.style.top = (rect.top + rect.height / 2) + 'px';
                            tooltip.classList.add('visible');
                        }
                    });

                    button.addEventListener('mouseleave', () => {
                        tooltip.classList.remove('visible');
                    });
                }

                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const tooltip = document.getElementById('bg-expressive-sidebar-tooltip');
                    if (tooltip) tooltip.classList.remove('visible');
                    chrome.runtime.sendMessage({action: 'openSettings'});
                });
            }

            if (isMobile) {
                const matIcon = customWrapper.querySelector('mat-icon');
                if (matIcon) {
                    const customIcon = document.createElement('span');
                    customIcon.className = 'bg-expressive-sidebar-icon mat-mdc-list-item-icon mdc-list-item__start';
                    customIcon.style.setProperty('--bg-icon-url', `url(${chrome.runtime.getURL('assets/icons/expressive.svg')})`);
                    matIcon.parentNode.replaceChild(customIcon, matIcon);
                }

                const textSpan = customWrapper.querySelector('.mdc-button__label .gds-label-l');
                if (textSpan) {
                    textSpan.textContent = this.getExpressiveLabel();
                    textSpan.removeAttribute('mattooltip');
                    textSpan.classList.remove('mat-mdc-tooltip-trigger');
                }
            } else {
                const iconContainer = customWrapper.querySelector('.mat-mdc-list-item-icon, .icon-container');
                if (iconContainer) {
                    iconContainer.textContent = '';
                    const customIcon = document.createElement('span');
                    customIcon.className = 'bg-expressive-sidebar-icon';
                    customIcon.style.setProperty('--bg-icon-url', `url(${chrome.runtime.getURL('assets/icons/expressive.svg')})`);
                    iconContainer.appendChild(customIcon);
                }

                const textContainer = customWrapper.querySelector('.mdc-list-item__primary-text');
                if (textContainer) {
                    const innerSpan = textContainer.querySelector('span');
                    if (innerSpan) {
                        innerSpan.textContent = this.getExpressiveLabel();
                    } else {
                        textContainer.textContent = this.getExpressiveLabel();
                    }
                }
            }

            wrapperToClone.parentNode.insertBefore(customWrapper, wrapperToClone);
        });
    }
}

window.SettingsShortcut = SettingsShortcut;