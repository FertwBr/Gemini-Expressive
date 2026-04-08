/**
 * @fileoverview Enhances code blocks headers with icons and file names.
 * @copyright (c) 2026 Fertwbr
 */

class CodeHeaderEnhancer {
    /**
     * @returns {void}
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