/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Upgrades the visual presentation of code block headers by injecting language-specific icons
 * and extracting filename metadata directly from the code content, appending it to the UI label.
 */
class CodeHeaderEnhancer {
    /**
     * Identifies code blocks that haven't been enhanced yet, determines their programming language,
     * fetches the appropriate iconography, searches for file name hints within the raw code string,
     * and restructures the header DOM to display the consolidated information.
     */
    static enhance() {
        const headers = document.querySelectorAll('.code-block-decoration.header-formatted:not(.bg-header-enhanced)');
        headers.forEach(header => {
            header.classList.add('bg-header-enhanced');

            const langSpan = header.querySelector('span:not(.mat-icon)');
            if (!langSpan) {
                return;
            }

            const language = langSpan.textContent.trim();
            const iconName = CodeUtils.getLanguageIcon(language);

            const codeContainer = header.parentElement.querySelector('code');
            const codeText = codeContainer ? codeContainer.textContent : '';
            const fileName = CodeUtils.extractCodeMetadata(codeText, language);

            langSpan.textContent = '';
            langSpan.style.display = 'flex';
            langSpan.style.alignItems = 'baseline';
            langSpan.style.gap = '6px';

            const iconEl = document.createElement('span');
            iconEl.className = 'google-symbols mat-icon';
            iconEl.textContent = iconName;
            iconEl.style.fontSize = '18px';
            iconEl.style.width = '18px';
            iconEl.style.height = '18px';
            iconEl.style.alignSelf = 'center';

            const textEl = document.createElement('span');
            textEl.className = 'bg-lang-name';
            textEl.textContent = language;

            langSpan.appendChild(iconEl);
            langSpan.appendChild(textEl);

            if (fileName) {
                const fileEl = document.createElement('span');
                fileEl.className = 'bg-file-name';
                fileEl.textContent = ' — ' + fileName;
                fileEl.style.opacity = '0.7';
                fileEl.style.fontSize = '0.9em';
                langSpan.appendChild(fileEl);
            }
        });
    }
}

window.CodeHeaderEnhancer = CodeHeaderEnhancer;