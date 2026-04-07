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

    const deleteConfirmDialog = document.getElementById('deleteConfirmDialog');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    const toast = new ToastNotification(toastElement, toastMessageElement);

    let snippets = [];
    let currentEditingId = null;
    let snippetToDelete = null;
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

            LocaleManager.currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
            if (!LocaleManager.BG_LOCALES || !LocaleManager.BG_LOCALES[LocaleManager.currentLanguage]) {
                LocaleManager.currentLanguage = 'en';
            }

            Localization.apply();
            updateLangVisuals(selectedLang);
            toast.show(LocaleManager.getString('statusSaved'));
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
            currentLangLabel.textContent = LocaleManager.getString('lang_auto');
        } else {
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            currentFlag.style.display = 'block';
            currentFlag.src = `https://flagcdn.com/w40/${Localization.getFlagCode(lang)}.png`;
            currentLangLabel.textContent = LocaleManager.getString(`lang_${lang}`);
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
            emptyStateTitle.textContent = LocaleManager.getString('noSnippetsFound');

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

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'snippet-item-actions';

            if (index > 0) {
                const upBtn = document.createElement('button');
                upBtn.className = 'icon-btn-small';
                upBtn.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';
                upBtn.title = LocaleManager.getString('moveUp');
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
                downBtn.innerHTML = '<span class="material-symbols-outlined">arrow_downward</span>';
                downBtn.title = LocaleManager.getString('moveDown');
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
            delItemBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
            delItemBtn.title = LocaleManager.getString('deleteSnippetBtn');
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
     */
    function selectSnippet(id) {
        currentEditingId = id;
        const snippet = snippets.find(s => s.id === id);
        if (snippet) {
            keywordInput.value = snippet.keyword;
            contentInput.value = snippet.content;

            editorTitleIcon.textContent = 'edit';
            editorTitleText.textContent = LocaleManager.getString('editSnippetTitle');
            saveSnippetBtnText.textContent = LocaleManager.getString('saveChangesBtn');
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
        keywordInput.value = '';
        contentInput.value = '';

        editorTitleIcon.textContent = 'add_circle';
        editorTitleText.textContent = LocaleManager.getString('createSnippetTitle');
        saveSnippetBtnText.textContent = LocaleManager.getString('createBtn');
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
            toast.show(LocaleManager.getString('errorEmptySnippet'));
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
            toast.show(LocaleManager.getString('statusSaved'));

            editorTitleIcon.textContent = 'edit';
            editorTitleText.textContent = LocaleManager.getString('editSnippetTitle');
            saveSnippetBtnText.textContent = LocaleManager.getString('saveChangesBtn');
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

    if (initialSettings.dynamicColorEnabled !== false && typeof ThemeUtils !== 'undefined') {
        const colorToApply = initialSettings.themeColor || '#0b57d0';
        ThemeUtils.applyMaterialTheme(colorToApply, initialSettings.themeMode || 'auto');
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