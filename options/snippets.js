/**
 * @fileoverview Main entry point for the snippets page.
 * @copyright (c) 2026 Fertwbr
 */

import {StorageManager} from './core/StorageManager.js';
import {Localization} from './core/Localization.js';
import {ToastNotification} from './components/ToastNotification.js';
import {DragDropList} from './components/DragDropList.js';
import {BackupImporter, BackupExporter} from './components/BackupManager.js';
import {LanguageSelector} from './components/LanguageSelector.js';
import {QuickThemeToggle} from './components/QuickThemeToggle.js';
import {PrefixSelector} from './components/PrefixSelector.js';
import {VersionDisplay} from './components/VersionDisplay.js';
import {PageTransition} from './components/PageTransition.js';

document.addEventListener('DOMContentLoaded', async () => {
    window.LocaleManager.initLanguage();
    Localization.apply();

    const snippetsListEl = document.getElementById('snippetsList');
    const editorCard = document.getElementById('editorCard');
    const addNewBtn = document.getElementById('addNewBtn');
    const keywordInput = document.getElementById('snippetKeyword');
    const contentInput = document.getElementById('snippetContent');
    const previewPanel = document.getElementById('snippetPreview');
    const tabWrite = document.getElementById('tabWrite');
    const tabPreview = document.getElementById('tabPreview');
    const saveBtn = document.getElementById('saveSnippetBtn');
    const deleteBtn = document.getElementById('deleteSnippetBtn');

    const editorTitleIcon = document.getElementById('editorTitleIcon');
    const editorTitleText = document.getElementById('editorTitleText');
    const saveSnippetBtnText = document.getElementById('saveSnippetBtnText');

    const deleteConfirmDialog = document.getElementById('deleteConfirmDialog');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    const toast = new ToastNotification(
        document.getElementById('toast-notification'),
        document.getElementById('toast-message')
    );

    VersionDisplay.apply([
        document.getElementById('versionText'),
        document.getElementById('headerVersionText')
    ]);

    new BackupImporter(
        [document.getElementById('importBackupBtn')],
        document.getElementById('importBackupInput'),
        toast,
        null
    );

    new BackupExporter(
        [document.getElementById('exportBackupBtn')],
        toast,
        null
    );

    PageTransition.bind('a[href="settings.html"]', 'settings.html');

    let snippets = [];
    let currentEditingId = null;
    let snippetToDelete = null;
    let currentPrefix = '/';
    let selectedThemeMode = 'auto';

    new LanguageSelector(
        document.getElementById('langDropdownBtn'),
        document.getElementById('langDropdownMenu'),
        document.getElementById('currentFlag'),
        document.getElementById('currentLangLabel'),
        'auto',
        async (lang) => {
            await StorageManager.saveSettings({language: lang});
            window.LocaleManager.currentLanguage = lang === 'auto' ? navigator.language.split('-')[0] : lang;
            if (!window.LocaleManager.BG_LOCALES || !window.LocaleManager.BG_LOCALES[window.LocaleManager.currentLanguage]) {
                window.LocaleManager.currentLanguage = 'en';
            }
            Localization.apply();
            toast.show(window.LocaleManager.getString('statusSaved'));
        }
    );

    const prefixSelector = new PrefixSelector(
        document.getElementById('prefixDropdownBtn'),
        document.getElementById('prefixDropdownMenu'),
        document.getElementById('currentPrefixLabel'),
        currentPrefix,
        async (prefix) => {
            currentPrefix = prefix;
            await StorageManager.saveSettings({snippetPrefix: prefix});
            toast.show(window.LocaleManager.getString('statusSaved'));
            renderList();
        }
    );

    const quickThemeToggle = new QuickThemeToggle(
        document.getElementById('quickThemeBtn'),
        document.getElementById('quickThemeIcon'),
        selectedThemeMode,
        async (theme) => {
            selectedThemeMode = theme;
            await StorageManager.saveSettings({themeMode: theme});
            if (typeof ThemeUtils !== 'undefined') {
                const currentSettings = await StorageManager.getSettings();
                if (currentSettings.dynamicColorEnabled) {
                    ThemeUtils.applyMaterialTheme(currentSettings.themeColor || '#0b57d0', theme);
                }
            }
            toast.show(window.LocaleManager.getString('statusSavedRefresh'), true);
        }
    );

    new DragDropList(snippetsListEl, (draggedIndex, dropIndex) => {
        const draggedSnippet = snippets.splice(draggedIndex, 1)[0];
        if (dropIndex > draggedIndex) dropIndex--;
        snippets.splice(dropIndex, 0, draggedSnippet);

        saveSnippets(() => {
            renderList();
        });
    });

    /**
     * @param {string} text
     * @returns {string}
     */
    function parseMarkdownToHTML(text) {
        if (!text || !text.trim()) return `<div class="preview-empty">${window.LocaleManager.getString('previewEmpty')}</div>`;

        let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const codeBlocks = [];
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const langLabel = lang ? `<div class="preview-code-lang">${lang}</div>` : '';
            codeBlocks.push(`<div class="preview-code-wrapper">${langLabel}<pre><code>${code}</code></pre></div>`);
            return `%%%CODE_BLOCK_${codeBlocks.length - 1}%%%`;
        });

        html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
        html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        html = html.replace(/`([^`\n]+)`/g, '<code class="preview-inline-code">$1</code>');

        html = html.replace(/^\s*[\-\*] (.*$)/gim, '<ul><li>$1</li></ul>');
        html = html.replace(/<\/ul>\n<ul>/g, '\n');

        let lines = html.split('\n');
        let result = '';

        for (let line of lines) {
            if (line.match(/^(<h|<ul|<blockquote|%%%CODE_BLOCK)/)) {
                result += line + '\n';
            } else if (line.trim() !== '') {
                result += `<p>${line}</p>\n`;
            }
        }

        result = result.replace(/%%%CODE_BLOCK_(\d+)%%%/g, (match, index) => {
            return codeBlocks[index];
        });

        return result;
    }

    /**
     * @returns {void}
     */
    function switchToWriteTab() {
        tabWrite.classList.add('active');
        tabPreview.classList.remove('active');
        contentInput.style.display = 'block';
        previewPanel.style.display = 'none';
    }

    tabWrite.onclick = switchToWriteTab;

    tabPreview.onclick = () => {
        tabPreview.classList.add('active');
        tabWrite.classList.remove('active');
        contentInput.style.display = 'none';
        previewPanel.style.display = 'block';

        const safeHtmlString = parseMarkdownToHTML(contentInput.value);
        const parser = new DOMParser();
        const doc = parser.parseFromString(safeHtmlString, 'text/html');

        previewPanel.textContent = '';
        while (doc.body.firstChild) {
            previewPanel.appendChild(doc.body.firstChild);
        }
    };

    /**
     * @returns {Promise<void>}
     */
    async function loadSnippets() {
        const result = await StorageManager.getLocalData(['geminiSnippets']);
        let rawSnippets = result.geminiSnippets || [];

        let needsMigration = false;
        snippets = rawSnippets.map(s => {
            if (s.keyword && s.keyword.match(/^[/*!#@]+/)) {
                s.keyword = s.keyword.replace(/^[/*!#@]+/, '');
                needsMigration = true;
            }
            return s;
        });

        if (needsMigration) {
            await StorageManager.setLocalData({geminiSnippets: snippets});
        }

        renderList();
        if (snippets.length === 0) {
            editorCard.style.display = 'none';
            snippetsListEl.textContent = '';

            const emptyStateWrapper = document.createElement('div');
            emptyStateWrapper.className = 'empty-state-wrapper';

            const emptyStateIcon = document.createElement('span');
            emptyStateIcon.className = 'material-symbols-outlined empty-state-icon';
            emptyStateIcon.textContent = 'note_stack';

            const emptyStateTitle = document.createElement('div');
            emptyStateTitle.className = 'empty-state-title';
            emptyStateTitle.setAttribute('data-i18n', 'noSnippetsFound');
            emptyStateTitle.textContent = window.LocaleManager.getString('noSnippetsFound');

            emptyStateWrapper.appendChild(emptyStateIcon);
            emptyStateWrapper.appendChild(emptyStateTitle);
            snippetsListEl.appendChild(emptyStateWrapper);

            addNewBtn.click();
        } else if (currentEditingId === null) {
            addNewBtn.click();
        }
    }

    /**
     * @param {Function} [callback]
     * @returns {Promise<void>}
     */
    async function saveSnippets(callback) {
        await StorageManager.setLocalData({geminiSnippets: snippets});
        if (callback) {
            callback();
        }
    }

    /**
     * @returns {void}
     */
    function renderList() {
        snippetsListEl.textContent = '';
        snippets.forEach((snippet, index) => {
            const item = document.createElement('div');
            item.className = `snippet-list-item ${currentEditingId === snippet.id ? 'active' : ''}`;
            item.draggable = true;
            item.dataset.index = index;

            const dragHandle = document.createElement('div');
            dragHandle.className = 'snippet-item-drag-handle';

            const dragIcon = document.createElement('span');
            dragIcon.className = 'material-symbols-outlined';
            dragIcon.textContent = 'drag_indicator';
            dragHandle.appendChild(dragIcon);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'snippet-item-content';

            const keywordDiv = document.createElement('div');
            keywordDiv.className = 'snippet-item-keyword';
            keywordDiv.textContent = currentPrefix + snippet.keyword;

            const previewDiv = document.createElement('div');
            previewDiv.className = 'snippet-item-preview';
            previewDiv.textContent = snippet.content.replace(/\n/g, ' ');

            contentDiv.appendChild(keywordDiv);
            contentDiv.appendChild(previewDiv);

            item.appendChild(dragHandle);
            item.appendChild(contentDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'snippet-item-actions';

            if (index > 0) {
                const upBtn = document.createElement('button');
                upBtn.className = 'icon-btn-small';
                const upIconSpan = document.createElement('span');
                upIconSpan.className = 'material-symbols-outlined';
                upIconSpan.textContent = 'arrow_upward';
                upBtn.appendChild(upIconSpan);
                upBtn.title = window.LocaleManager.getString('moveUp');
                upBtn.onclick = (e) => {
                    e.stopPropagation();
                    const temp = snippets[index];
                    snippets[index] = snippets[index - 1];
                    snippets[index - 1] = temp;
                    saveSnippets(() => renderList());
                };
                actionsDiv.appendChild(upBtn);
            }

            if (index < snippets.length - 1) {
                const downBtn = document.createElement('button');
                downBtn.className = 'icon-btn-small';
                const downIconSpan = document.createElement('span');
                downIconSpan.className = 'material-symbols-outlined';
                downIconSpan.textContent = 'arrow_downward';
                downBtn.appendChild(downIconSpan);
                downBtn.title = window.LocaleManager.getString('moveDown');
                downBtn.onclick = (e) => {
                    e.stopPropagation();
                    const temp = snippets[index];
                    snippets[index] = snippets[index + 1];
                    snippets[index + 1] = temp;
                    saveSnippets(() => renderList());
                };
                actionsDiv.appendChild(downBtn);
            }

            const delItemBtn = document.createElement('button');
            delItemBtn.className = 'icon-btn-small danger';
            const delIconSpan = document.createElement('span');
            delIconSpan.className = 'material-symbols-outlined';
            delIconSpan.textContent = 'delete';
            delItemBtn.appendChild(delIconSpan);
            delItemBtn.title = window.LocaleManager.getString('deleteSnippetBtn');
            delItemBtn.onclick = (e) => {
                e.stopPropagation();
                snippetToDelete = snippet.id;
                deleteConfirmDialog.showModal();
            };
            actionsDiv.appendChild(delItemBtn);

            item.appendChild(actionsDiv);

            item.onclick = () => selectSnippet(snippet.id);

            snippetsListEl.appendChild(item);
        });
    }

    /**
     * @param {string} id
     * @returns {void}
     */
    function selectSnippet(id) {
        currentEditingId = id;
        const snippet = snippets.find(s => s.id === id);
        if (snippet) {
            switchToWriteTab();
            keywordInput.value = snippet.keyword;
            contentInput.value = snippet.content;

            editorTitleIcon.textContent = 'edit';
            editorTitleText.textContent = window.LocaleManager.getString('editSnippetTitle');
            saveSnippetBtnText.textContent = window.LocaleManager.getString('saveChangesBtn');
            editorCard.classList.remove('is-new');

            editorCard.style.display = 'flex';
            deleteBtn.style.display = 'inline-flex';
            renderList();
            if (window.innerWidth < 800) {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        }
    }

    addNewBtn.onclick = () => {
        currentEditingId = null;
        switchToWriteTab();
        keywordInput.value = '';
        contentInput.value = '';

        editorTitleIcon.textContent = 'add_circle';
        editorTitleText.textContent = window.LocaleManager.getString('createSnippetTitle');
        saveSnippetBtnText.textContent = window.LocaleManager.getString('createBtn');
        editorCard.classList.add('is-new');

        editorCard.style.display = 'flex';
        deleteBtn.style.display = 'none';
        keywordInput.focus();
        renderList();
        if (window.innerWidth < 800) {
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    };

    saveBtn.onclick = () => {
        const rawKw = keywordInput.value.trim();
        const ct = contentInput.value.trim();

        const cleanKw = rawKw.replace(/^[/*!#@]+/, '');

        if (!cleanKw || !ct) {
            toast.show(window.LocaleManager.getString('errorEmptySnippet'));
            return;
        }

        if (!currentEditingId) {
            const newSnippet = {
                id: 'snip_' + Date.now(),
                keyword: cleanKw,
                content: ct,
                createdAt: Date.now()
            };
            snippets.push(newSnippet);
            currentEditingId = newSnippet.id;
        } else {
            const index = snippets.findIndex(s => s.id === currentEditingId);
            if (index !== -1) {
                snippets[index].keyword = cleanKw;
                snippets[index].content = ct;
            }
        }

        saveSnippets(() => {
            toast.show(window.LocaleManager.getString('statusSaved'));

            editorTitleIcon.textContent = 'edit';
            editorTitleText.textContent = window.LocaleManager.getString('editSnippetTitle');
            saveSnippetBtnText.textContent = window.LocaleManager.getString('saveChangesBtn');
            editorCard.classList.remove('is-new');
            deleteBtn.style.display = 'inline-flex';

            renderList();
        });
    };

    deleteBtn.onclick = (e) => {
        e.preventDefault();
        snippetToDelete = currentEditingId;
        deleteConfirmDialog.showModal();
    };

    confirmDeleteBtn.onclick = () => {
        if (snippetToDelete) {
            snippets = snippets.filter(s => s.id !== snippetToDelete);
            if (currentEditingId === snippetToDelete) {
                currentEditingId = null;
            }
            snippetToDelete = null;
            deleteConfirmDialog.close();
            saveSnippets(() => {
                loadSnippets();
            });
        }
    };

    cancelDeleteBtn.onclick = () => {
        snippetToDelete = null;
        deleteConfirmDialog.close();
    };

    const initialSettings = await StorageManager.getSettings();
    currentPrefix = initialSettings.snippetPrefix;
    selectedThemeMode = initialSettings.themeMode || 'auto';

    prefixSelector.updateVisuals(currentPrefix);
    quickThemeToggle.updateVisuals(selectedThemeMode);

    if (initialSettings.dynamicColorEnabled !== false && typeof ThemeUtils !== 'undefined') {
        const colorToApply = initialSettings.themeColor || '#0b57d0';
        ThemeUtils.applyMaterialTheme(colorToApply, selectedThemeMode);
    }

    await loadSnippets();
});