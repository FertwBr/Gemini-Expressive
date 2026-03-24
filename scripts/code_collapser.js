function processCodeBlocks() {
    const blocks = document.querySelectorAll('pre');
    blocks.forEach(block => {
        if (!block.classList.contains('bg-processed')) {
            block.classList.add('bg-processed');

            let header = null;
            const container = block.closest('code-block') || block.closest('.code-block') || block.parentElement?.parentElement;

            if (container) {
                header = container.querySelector('.code-block-decoration.header-formatted, .code-block-header, [data-test-id="code-block-header"], .header-formatted');
            }

            if (!header && block.previousElementSibling && (block.previousElementSibling.classList.contains('code-block-decoration') || block.previousElementSibling.classList.contains('code-block-header') || block.previousElementSibling.classList.contains('header-formatted'))) {
                header = block.previousElementSibling;
            }

            const btn = document.createElement('button');
            btn.className = 'bg-collapse-icon-btn';
            btn.title = getBgString('collapseCode');

            const iconSpan = document.createElement('span');
            iconSpan.className = 'mat-icon notranslate google-symbols mat-ligature-font';
            iconSpan.textContent = 'unfold_less';

            btn.appendChild(iconSpan);

            btn.onclick = () => {
                block.classList.toggle('bg-collapsed');
                const isCollapsed = block.classList.contains('bg-collapsed');
                iconSpan.textContent = isCollapsed ? 'unfold_more' : 'unfold_less';
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
        }
    });
}