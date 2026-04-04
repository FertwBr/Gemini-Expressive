/**
 * Processes code blocks to add collapse/expand functionality and navigation.
 */
function processCodeBlocks() {
    const blocks = document.querySelectorAll('pre');
    blocks.forEach(block => {
        if (!block.classList.contains('bg-processed')) {
            block.classList.add('bg-processed');

            let header = null;
            const container = block.closest('code-block') || block.closest('.code-block') || block.parentElement?.parentElement;

            if (container) {
                header = container.querySelector('.code-block-decoration.header-formatted, .code-block-header, [data-test-id="code-block-header"], .header-formatted');
                if (window.getComputedStyle(container).position === 'static') {
                    container.style.position = 'relative';
                }
            }

            if (!header && block.previousElementSibling && (block.previousElementSibling.classList.contains('code-block-decoration') || block.previousElementSibling.classList.contains('code-block-header') || block.previousElementSibling.classList.contains('header-formatted'))) {
                header = block.previousElementSibling;
                if (block.parentElement && window.getComputedStyle(block.parentElement).position === 'static') {
                    block.parentElement.style.position = 'relative';
                }
            }

            if (header) {
                let buttonsArea = header.querySelector('.buttons, .action-buttons');
                if (!buttonsArea) {
                    buttonsArea = document.createElement('div');
                    buttonsArea.className = 'buttons';
                    buttonsArea.style.display = 'flex';
                    buttonsArea.style.alignItems = 'center';
                    header.appendChild(buttonsArea);
                }

                let btn;
                const existingBtn = buttonsArea.querySelector('button.mdc-icon-button, button.mat-mdc-icon-button');

                if (existingBtn) {
                    btn = existingBtn.cloneNode(true);
                    btn.classList.add('bg-collapse-icon-btn');
                    btn.removeAttribute('data-test-id');
                    btn.removeAttribute('mattooltip');
                    btn.removeAttribute('title');

                    const existingIcons = btn.querySelectorAll('mat-icon, .google-symbols, svg, img');
                    existingIcons.forEach(i => i.remove());
                } else {
                    btn = document.createElement('button');
                    btn.className = 'mdc-icon-button mat-mdc-icon-button bg-collapse-icon-btn';
                    const touchTarget = document.createElement('span');
                    touchTarget.className = 'mat-mdc-button-touch-target';
                    btn.appendChild(touchTarget);
                }

                btn.setAttribute('aria-label', getBgString('collapseCode'));

                const icon = document.createElement('span');
                icon.className = 'bg-collapse-svg-icon';
                icon.style.setProperty('--bg-icon-url', `url(${chrome.runtime.getURL('assets/icons/expanded.svg')})`);
                btn.appendChild(icon);

                const tooltip = document.createElement('div');
                tooltip.className = 'bg-custom-tooltip';
                tooltip.textContent = getBgString('collapseCode');
                btn.appendChild(tooltip);

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isCollapsed = block.classList.toggle('bg-collapsed');
                    if (header) {
                        header.classList.toggle('bg-header-collapsed', isCollapsed);
                    }

                    icon.style.setProperty('--bg-icon-url', `url(${chrome.runtime.getURL(isCollapsed ? 'assets/icons/collapsed.svg' : 'assets/icons/expanded.svg')})`);

                    const newText = isCollapsed ? getBgString('expandCode') : getBgString('collapseCode');
                    tooltip.textContent = newText;
                    btn.setAttribute('aria-label', newText);
                };

                buttonsArea.insertBefore(btn, buttonsArea.firstChild);
            }

            const navDiv = document.createElement('div');
            navDiv.className = 'bg-code-nav';

            const upBtn = document.createElement('button');
            upBtn.className = 'bg-code-nav-btn';

            const upTooltip = document.createElement('div');
            upTooltip.className = 'bg-custom-tooltip';
            upTooltip.textContent = "Previous code block";
            upBtn.appendChild(upTooltip);

            const upIcon = document.createElement('span');
            upIcon.className = 'google-symbols';
            upIcon.textContent = 'keyboard_arrow_up';
            upBtn.appendChild(upIcon);

            const downBtn = document.createElement('button');
            downBtn.className = 'bg-code-nav-btn';

            const downTooltip = document.createElement('div');
            downTooltip.className = 'bg-custom-tooltip';
            downTooltip.textContent = "Next code block";
            downBtn.appendChild(downTooltip);

            const downIcon = document.createElement('span');
            downIcon.className = 'google-symbols';
            downIcon.textContent = 'keyboard_arrow_down';
            downBtn.appendChild(downIcon);

            upBtn.onclick = (e) => {
                e.preventDefault();
                const allProcessed = Array.from(document.querySelectorAll('pre.bg-processed'));
                const currentIndex = allProcessed.indexOf(block);
                if (currentIndex > 0) {
                    const target = allProcessed[currentIndex - 1];
                    const targetContainer = target.closest('code-block') || target;
                    targetContainer.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            };

            downBtn.onclick = (e) => {
                e.preventDefault();
                const allProcessed = Array.from(document.querySelectorAll('pre.bg-processed'));
                const currentIndex = allProcessed.indexOf(block);
                if (currentIndex < allProcessed.length - 1) {
                    const target = allProcessed[currentIndex + 1];
                    const targetContainer = target.closest('code-block') || target;
                    targetContainer.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            };

            navDiv.appendChild(upBtn);
            navDiv.appendChild(downBtn);

            if (block.nextSibling) {
                block.parentNode.insertBefore(navDiv, block.nextSibling);
            } else {
                block.parentNode.appendChild(navDiv);
            }
        }
    });
}