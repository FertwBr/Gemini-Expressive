/**
 * @fileoverview Manages prompt snippet injection and UI.
 * @copyright (c) 2026 Fertwbr
 */

class SnippetInjector {
    static state = {
        isOpen: false,
        query: '',
        matches: [],
        activeIndex: 0,
        node: null,
        startOffset: 0,
        endOffset: 0
    };

    static settingsRef = null;

    /**
     * Initializes the snippet listener.
     * @param {Object} settings Reference to the global extension settings.
     */
    static init(settings) {
        this.settingsRef = settings;
        document.addEventListener('keydown', (e) => this.handleKeydown(e), true);
        document.addEventListener('keyup', (e) => this.handleKeyup(e), true);
        document.addEventListener('mousedown', (e) => this.handleClick(e), true);
    }

    static closeMenu() {
        this.state.isOpen = false;
        this.state.matches = [];
        const menu = document.getElementById('bg-snippet-menu');
        if (menu) {
            menu.classList.remove('visible');
        }
    }

    static insertSnippet(snippet) {
        if (!this.state.node) return;

        const range = document.createRange();
        range.setStart(this.state.node, this.state.startOffset);
        range.setEnd(this.state.node, this.state.endOffset);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const formattedContent = snippet.content.replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, formattedContent);

        const targetEditor = this.state.node.parentElement ? this.state.node.parentElement.closest('.ql-editor') : null;
        if (targetEditor) {
            targetEditor.dispatchEvent(new Event('input', {bubbles: true}));
        }

        this.closeMenu();
    }

    static renderMenu() {
        let menu = document.getElementById('bg-snippet-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'bg-snippet-menu';
            const inputContainer = document.querySelector('.text-input-field');
            if (inputContainer) {
                inputContainer.appendChild(menu);
            } else {
                document.body.appendChild(menu);
            }
        }

        menu.textContent = '';

        const header = document.createElement('div');
        header.className = 'bg-snippet-menu-header';

        const headerIcon = document.createElement('span');
        headerIcon.className = 'google-symbols';
        headerIcon.textContent = 'bolt';

        const headerText = document.createElement('span');
        headerText.textContent = LocaleManager.getString('snippetsTitle');

        header.appendChild(headerIcon);
        header.appendChild(headerText);
        menu.appendChild(header);

        if (this.state.matches.length === 0) {
            const emptyContainer = document.createElement('div');
            emptyContainer.className = 'bg-snippet-empty';

            const emptyText = document.createElement('span');
            emptyText.className = 'bg-snippet-empty-text';
            emptyText.textContent = LocaleManager.getString('snippetDropdownEmpty');

            const addBtn = document.createElement('button');
            addBtn.className = 'bg-snippet-add-btn';
            if (this.state.activeIndex === 0) {
                addBtn.classList.add('active');
            }

            const addIcon = document.createElement('span');
            addIcon.className = 'google-symbols';
            addIcon.textContent = 'add';
            addIcon.style.fontSize = '18px';

            const addText = document.createElement('span');
            addText.textContent = LocaleManager.getString('snippetDropdownAdd');

            addBtn.appendChild(addIcon);
            addBtn.appendChild(addText);

            addBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeMenu();
                chrome.runtime.sendMessage({action: 'openSnippets'});
            });

            addBtn.addEventListener('mouseenter', () => {
                this.state.activeIndex = 0;
                const allItems = menu.querySelectorAll('.bg-snippet-add-btn');
                allItems.forEach(i => i.classList.remove('active'));
                addBtn.classList.add('active');
            });

            emptyContainer.appendChild(emptyText);
            emptyContainer.appendChild(addBtn);
            menu.appendChild(emptyContainer);
        } else {
            this.state.matches.forEach((snippet, index) => {
                const item = document.createElement('button');
                item.className = 'bg-snippet-menu-item';
                if (index === this.state.activeIndex) {
                    item.classList.add('active');
                }

                const iconContainer = document.createElement('div');
                iconContainer.className = 'bg-snippet-icon-container';
                const icon = document.createElement('span');
                icon.className = 'google-symbols';
                icon.textContent = 'edit_note';
                iconContainer.appendChild(icon);

                const textContainer = document.createElement('div');
                textContainer.className = 'bg-snippet-text-container';

                const keywordNode = document.createElement('span');
                keywordNode.className = 'bg-snippet-keyword';
                const cleanKw = snippet.keyword.replace(/^[/*!#@]+/, '');
                keywordNode.textContent = this.settingsRef.snippetPrefix + cleanKw;

                const previewNode = document.createElement('span');
                previewNode.className = 'bg-snippet-preview';
                previewNode.textContent = snippet.content;

                textContainer.appendChild(keywordNode);
                textContainer.appendChild(previewNode);

                item.appendChild(iconContainer);
                item.appendChild(textContainer);

                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.insertSnippet(snippet);
                });

                item.addEventListener('mouseenter', () => {
                    this.state.activeIndex = index;
                    const allItems = menu.querySelectorAll('.bg-snippet-menu-item');
                    allItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                });

                menu.appendChild(item);
            });
        }

        menu.classList.add('visible');

        const activeItem = menu.querySelector('.bg-snippet-menu-item.active, .bg-snippet-add-btn.active');
        if (activeItem) {
            activeItem.scrollIntoView({block: 'nearest'});
        }
    }

    static openMenu(query, matches, node, startOffset, endOffset) {
        this.state.isOpen = true;
        this.state.query = query;
        this.state.matches = matches;
        this.state.activeIndex = 0;
        this.state.node = node;
        this.state.startOffset = startOffset;
        this.state.endOffset = endOffset;
        this.renderMenu();
    }

    static checkTrigger() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) {
            this.closeMenu();
            return;
        }

        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            this.closeMenu();
            return;
        }

        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) {
            this.closeMenu();
            return;
        }

        const editor = node.parentElement ? node.parentElement.closest('.ql-editor') : null;
        if (!editor) {
            this.closeMenu();
            return;
        }

        const text = node.textContent;
        const offset = range.startOffset;
        const textBeforeCursor = text.substring(0, offset);

        const safePrefix = this.settingsRef.snippetPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(?:^|\\s)(' + safePrefix + '([\\w-]*))$');
        const match = textBeforeCursor.match(regex);

        if (match) {
            const fullTypedText = match[1];
            const searchWord = match[2].toLowerCase();

            let matches = [];
            if (this.settingsRef.snippets && Array.isArray(this.settingsRef.snippets)) {
                matches = this.settingsRef.snippets.filter(s => {
                    const cleanKw = s.keyword.replace(/^[/*!#@]+/, '').toLowerCase();
                    return cleanKw.startsWith(searchWord);
                }).slice(0, 5);
            }

            const startOffset = offset - fullTypedText.length;
            this.openMenu(fullTypedText, matches, node, startOffset, offset);
        } else {
            this.closeMenu();
        }
    }

    static handleKeydown(event) {
        if (!this.state.isOpen) return;

        const maxIndex = this.state.matches.length > 0 ? this.state.matches.length : 1;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            this.state.activeIndex = (this.state.activeIndex + 1) % maxIndex;
            this.renderMenu();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            this.state.activeIndex = (this.state.activeIndex - 1 + maxIndex) % maxIndex;
            this.renderMenu();
        } else if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            if (this.state.matches.length === 0) {
                this.closeMenu();
                chrome.runtime.sendMessage({action: 'openSnippets'});
            } else {
                this.insertSnippet(this.state.matches[this.state.activeIndex]);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeMenu();
        }
    }

    static handleKeyup(event) {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
            return;
        }
        this.checkTrigger();
    }

    static handleClick(event) {
        const menu = document.getElementById('bg-snippet-menu');
        if (menu && !menu.contains(event.target)) {
            this.closeMenu();
        }
    }
}

window.SnippetInjector = SnippetInjector;