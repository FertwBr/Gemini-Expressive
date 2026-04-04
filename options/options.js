document.addEventListener('DOMContentLoaded', () => {
    applyLocalizations();

    const snippetsListEl = document.getElementById('snippetsList');
    const editorCard = document.getElementById('editorCard');
    const addNewBtn = document.getElementById('addNewBtn');
    const keywordInput = document.getElementById('snippetKeyword');
    const contentInput = document.getElementById('snippetContent');
    const saveBtn = document.getElementById('saveSnippetBtn');
    const deleteBtn = document.getElementById('deleteSnippetBtn');
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    let snippets = [];
    let currentEditingId = null;
    let toastTimeout;

    /**
     * Shows a brief success toast notification.
     * @param {string} msg The message to show.
     */
    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Loads the saved snippets from local storage.
     */
    function loadSnippets() {
        chrome.storage.local.get(['geminiSnippets'], (result) => {
            snippets = result.geminiSnippets || [];
            renderList();
            if (snippets.length === 0) {
                editorCard.style.display = 'none';
                snippetsListEl.innerHTML = `<div style="text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 24px; font-size: 0.9rem;" data-i18n="noSnippetsFound">${getBgString('noSnippetsFound')}</div>`;
            } else if (currentEditingId === null) {
                selectSnippet(snippets[0].id);
            }
        });
    }

    /**
     * Saves the current snippets array to local storage.
     * @param {Function} callback Callback executed after saving.
     */
    function saveSnippets(callback) {
        chrome.storage.local.set({geminiSnippets: snippets}, () => {
            if (callback) {
                callback();
            }
        });
    }

    /**
     * Renders the snippets list in the sidebar.
     */
    function renderList() {
        snippetsListEl.innerHTML = '';
        snippets.forEach(snippet => {
            const item = document.createElement('div');
            item.className = `snippet-list-item ${currentEditingId === snippet.id ? 'active' : ''}`;
            item.innerHTML = `
                <div class="snippet-item-keyword">${snippet.keyword}</div>
                <div class="snippet-item-preview">${snippet.content}</div>
            `;
            item.onclick = () => selectSnippet(snippet.id);
            snippetsListEl.appendChild(item);
        });
    }

    /**
     * Selects a snippet and populates the editor area.
     * @param {string} id The unique identifier of the snippet.
     */
    function selectSnippet(id) {
        currentEditingId = id;
        const snippet = snippets.find(s => s.id === id);
        if (snippet) {
            keywordInput.value = snippet.keyword;
            contentInput.value = snippet.content;
            editorCard.style.display = 'flex';
            deleteBtn.style.display = 'inline-flex';
            renderList();
        }
    }

    addNewBtn.onclick = () => {
        currentEditingId = 'new_' + Date.now();
        keywordInput.value = '';
        contentInput.value = '';
        editorCard.style.display = 'flex';
        deleteBtn.style.display = 'none';
        keywordInput.focus();
        renderList();
    };

    saveBtn.onclick = () => {
        const kw = keywordInput.value.trim();
        const ct = contentInput.value.trim();

        if (!kw || !ct) {
            return;
        }

        const isNew = currentEditingId && currentEditingId.startsWith('new_');
        if (isNew) {
            const newSnippet = {
                id: 'snip_' + Date.now(),
                keyword: kw.startsWith('/') ? kw : '/' + kw,
                content: ct,
                createdAt: Date.now()
            };
            snippets.push(newSnippet);
            currentEditingId = newSnippet.id;
        } else {
            const index = snippets.findIndex(s => s.id === currentEditingId);
            if (index !== -1) {
                snippets[index].keyword = kw.startsWith('/') ? kw : '/' + kw;
                snippets[index].content = ct;
            }
        }

        saveSnippets(() => {
            showToast(getBgString('statusSaved'));
            renderList();
        });
    };

    deleteBtn.onclick = () => {
        if (confirm(getBgString('confirmDelete'))) {
            snippets = snippets.filter(s => s.id !== currentEditingId);
            currentEditingId = null;
            saveSnippets(() => {
                loadSnippets();
            });
        }
    };

    /**
     * Applies localized strings to the DOM elements.
     */
    function applyLocalizations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = getBgString(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = getBgString(key);
        });
    }

    chrome.storage.sync.get(['themeMode', 'themeColor', 'dynamicColorEnabled'], (items) => {
        if (items.dynamicColorEnabled !== false && typeof applyMaterialTheme === 'function') {
            applyMaterialTheme(items.themeColor || '#0b57d0', items.themeMode || 'auto');
        }
    });

    loadSnippets();
});