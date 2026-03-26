// scripts/code_collapser.js
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

            const icon = document.createElement('span');
            icon.className = 'google-symbols';
            icon.textContent = 'unfold_less';
            btn.appendChild(icon);

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isCollapsed = block.classList.toggle('bg-collapsed');
                if (header) {
                    header.classList.toggle('bg-header-collapsed', isCollapsed);
                }
                icon.textContent = isCollapsed ? 'unfold_more' : 'unfold_less';
                btn.title = isCollapsed ? getBgString('expandCode') : getBgString('collapseCode');
            };

            if (header) {
                let buttonsArea = header.querySelector('.buttons, .action-buttons');
                if (!buttonsArea) {
                    buttonsArea = document.createElement('div');
                    buttonsArea.className = 'buttons';
                    buttonsArea.style.display = 'flex';
                    buttonsArea.style.alignItems = 'center';
                    header.appendChild(buttonsArea);
                }
                buttonsArea.insertBefore(btn, buttonsArea.firstChild);
            }

            const navDiv = document.createElement('div');
            navDiv.className = 'bg-code-nav';

            const upBtn = document.createElement('button');
            upBtn.className = 'bg-code-nav-btn';
            upBtn.title = "Previous code block";
            const upIcon = document.createElement('span');
            upIcon.className = 'google-symbols';
            upIcon.textContent = 'keyboard_arrow_up';
            upBtn.appendChild(upIcon);

            const downBtn = document.createElement('button');
            downBtn.className = 'bg-code-nav-btn';
            downBtn.title = "Next code block";
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