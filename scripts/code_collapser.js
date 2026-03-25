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

            const btn = document.createElement('button');
            btn.className = 'bg-collapse-icon-btn';
            btn.title = getBgString('collapseCode');

            const iconSpan = document.createElement('span');
            iconSpan.className = 'mat-icon notranslate google-symbols mat-ligature-font';
            iconSpan.textContent = 'collapse_content';

            btn.appendChild(iconSpan);

            btn.onclick = () => {
                block.classList.toggle('bg-collapsed');
                const isCollapsed = block.classList.contains('bg-collapsed');
                iconSpan.textContent = isCollapsed ? 'expand_content' : 'collapse_content';
                btn.title = isCollapsed ? getBgString('expandCode') : getBgString('collapseCode');

                if (header) {
                    if (isCollapsed) {
                        header.classList.add('bg-header-collapsed');
                    } else {
                        header.classList.remove('bg-header-collapsed');
                    }
                }
            };

            if (header) {
                const touchTarget = header.querySelector('.mat-mdc-button-touch-target');
                const copyBtn = touchTarget ? touchTarget.closest('button') : (header.querySelector('button[aria-label*="Copy"]') || header.querySelector('button'));

                if (copyBtn && copyBtn.parentElement) {
                    copyBtn.parentElement.style.display = 'flex';
                    copyBtn.parentElement.style.alignItems = 'center';
                    copyBtn.style.margin = '0';

                    if (copyBtn.nextSibling) {
                        copyBtn.parentElement.insertBefore(btn, copyBtn.nextSibling);
                    } else {
                        copyBtn.parentElement.appendChild(btn);
                    }
                } else {
                    header.appendChild(btn);
                }
            } else {
                block.parentNode.insertBefore(btn, block);
            }

            const navDiv = document.createElement('div');
            navDiv.className = 'bg-code-nav';

            const upBtn = document.createElement('button');
            upBtn.className = 'bg-code-nav-btn';
            upBtn.title = 'Previous Code Block';

            const upIcon = document.createElement('span');
            upIcon.className = 'mat-icon notranslate google-symbols mat-ligature-font';
            upIcon.textContent = 'keyboard_arrow_up';
            upBtn.appendChild(upIcon);

            const downBtn = document.createElement('button');
            downBtn.className = 'bg-code-nav-btn';
            downBtn.title = 'Next Code Block';

            const downIcon = document.createElement('span');
            downIcon.className = 'mat-icon notranslate google-symbols mat-ligature-font';
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