/**
 * @fileoverview Main entry point for the snippets page.
 * @copyright (c) 2026 Fertwbr
 */

import {StorageManager} from './core/StorageManager.js';
import {Localization} from './core/Localization.js';
import {ToastNotification} from './components/ToastNotification.js';
import {DropdownMenu} from './components/DropdownMenu.js';
import {DragDropList} from './components/DragDropList.js';

document.addEventListener('DOMContentLoaded', async () => {
    Localization.apply();

    const snippetsListEl = document.getElementById('snippetsList');
    const editorCard = document.getElementById('editorCard');
    const addNewBtn = document.getElementById('addNewBtn');
    const keywordInput = document.getElementById('snippetKeyword');
    const contentInput = document.getElementById('snippetContent');
    const saveBtn = document.getElementById('saveSnippetBtn');
    const deleteBtn = document.getElementById('deleteSnippetBtn');
    const toastElement = document.getElementById('toast-notification');
    const toastMessageElement = document.getElementById('toast-message');
    const versionText = document.getElementById('versionText');

    const editorTitleIcon = document.getElementById('editorTitleIcon');
    const editorTitleText = document.getElementById('editorTitleText');
    const saveSnippetBtnText = document.getElementById('saveSnippetBtnText');

    const dropdownBtn = document.getElementById('langDropdownBtn');
    const currentFlag = document.getElementById('currentFlag');
    const currentLangLabel = document.getElementById('currentLangLabel');

    const toast = new ToastNotification(toastElement, toastMessageElement);

    let snippets = [];
    let currentEditingId = null;
    let currentPrefix = '/';

    if (versionText && chrome.runtime && chrome.runtime.getManifest) {
        versionText.textContent = 'v' + chrome.runtime.getManifest().version;
    }

    const langDropdown = new DropdownMenu(
        dropdownBtn,
        document.getElementById('langDropdownMenu'),
        '.footer-menu-item',
        'active',
        async (item) => {
            const selectedLang = item.getAttribute('data-lang');
            await StorageManager.saveSettings({language: selectedLang});
            window.currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
            if (!window.BG_LOCALES || !window.BG_LOCALES[window.currentLanguage]) {
                window.currentLanguage = 'en';
            }
            Localization.apply();
            updateLangVisuals(selectedLang);
            toast.show(window.getBgString('statusSaved'));
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
     * @param {string} lang
     */
    function updateLangVisuals(lang) {
        if (!dropdownBtn || !currentFlag || !currentLangLabel) return;

        langDropdown.setActiveByAttribute('data-lang', lang);

        if (lang === 'auto') {
            currentFlag.style.display = 'none';
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (!autoIcon) {
                autoIcon = document.createElement('span');
                autoIcon.className = 'material-symbols-outlined auto-icon-temp';
                autoIcon.textContent = 'auto_awesome';
                autoIcon.style.fontSize = '16px';
                dropdownBtn.insertBefore(autoIcon, currentLangLabel);
            }
            currentLangLabel.textContent = window.getBgString('lang_auto');
        } else {
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            currentFlag.style.display = 'block';
            currentFlag.src = `https://flagcdn.com/w40/${Localization.getFlagCode(lang)}.png`;
            currentLangLabel.textContent = window.getBgString(`lang_${lang}`);
        }
    }

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
            emptyStateTitle.textContent = window.getBgString('noSnippetsFound');

            emptyStateWrapper.appendChild(emptyStateIcon);
            emptyStateWrapper.appendChild(emptyStateTitle);
            snippetsListEl.appendChild(emptyStateWrapper);
        } else if (currentEditingId === null) {
            selectSnippet(snippets[0].id);
        }
    }

    /**
     * @param {Function} [callback]
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
            previewDiv.textContent = snippet.content;

            contentDiv.appendChild(keywordDiv);
            contentDiv.appendChild(previewDiv);

            item.appendChild(dragHandle);
            item.appendChild(contentDiv);

            item.onclick = () => selectSnippet(snippet.id);

            snippetsListEl.appendChild(item);
        });
    }

    /**
     * @param {string} id
     */
    function selectSnippet(id) {
        currentEditingId = id;
        const snippet = snippets.find(s => s.id === id);
        if (snippet) {
            keywordInput.value = snippet.keyword;
            contentInput.value = snippet.content;

            editorTitleIcon.textContent = 'edit';
            editorTitleText.textContent = window.getBgString('editSnippetTitle');
            saveSnippetBtnText.textContent = window.getBgString('saveChangesBtn');
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
        currentEditingId = 'new_' + Date.now();
        keywordInput.value = '';
        contentInput.value = '';

        editorTitleIcon.textContent = 'add_circle';
        editorTitleText.textContent = window.getBgString('createSnippetTitle');
        saveSnippetBtnText.textContent = window.getBgString('createBtn');
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
            return;
        }

        const isNew = currentEditingId && currentEditingId.startsWith('new_');
        if (isNew) {
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
            toast.show(window.getBgString('statusSaved'));

            editorTitleIcon.textContent = 'edit';
            editorTitleText.textContent = window.getBgString('editSnippetTitle');
            saveSnippetBtnText.textContent = window.getBgString('saveChangesBtn');
            editorCard.classList.remove('is-new');
            deleteBtn.style.display = 'inline-flex';

            renderList();
        });
    };

    deleteBtn.onclick = () => {
        if (confirm(window.getBgString('confirmDelete'))) {
            snippets = snippets.filter(s => s.id !== currentEditingId);
            currentEditingId = null;
            saveSnippets(() => {
                loadSnippets();
            });
        }
    };

    const initialSettings = await StorageManager.getSettings();
    currentPrefix = initialSettings.snippetPrefix;

    if (initialSettings.dynamicColorEnabled !== false && typeof window.applyMaterialTheme === 'function') {
        const colorToApply = initialSettings.themeColor || '#0b57d0';
        window.applyMaterialTheme(colorToApply, initialSettings.themeMode || 'auto');
    }

    updateLangVisuals(initialSettings.language);
    await loadSnippets();

    const backToSettingsBtn = document.querySelector('a[href="settings.html"]');
    if (backToSettingsBtn) {
        backToSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.page-wrapper').classList.add('page-transition-exit');
            setTimeout(() => {
                window.location.href = 'settings.html';
            }, 150);
        });
    }
});