/**
 * Maps a language code to the appropriate flag country code using timezone heuristics.
 * @param {string} languageCode The broad language code.
 * @returns {string} The specific flag country code.
 */
function getFlagCode(languageCode) {
    let tz = '';
    try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
        tz = '';
    }

    if (languageCode === 'pt') {
        if (tz.includes('Europe/') || tz.includes('Africa/')) return 'pt';
        return 'br';
    }
    if (languageCode === 'es') {
        if (tz.includes('Madrid') || tz.includes('Canary')) return 'es';
        if (tz.includes('Argentina')) return 'ar';
        if (tz.includes('Bogota')) return 'co';
        if (tz.includes('Lima') || tz.includes('Rio_Branco')) return 'pe';
        if (tz.includes('Santiago')) return 'cl';
        if (tz.includes('Caracas')) return 've';
        if (tz.includes('America/')) return 'mx';
        return 'es';
    }
    if (languageCode === 'en') {
        if (tz.includes('London')) return 'gb';
        if (tz.includes('Australia')) return 'au';
        if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'ca';
        return 'us';
    }
    if (languageCode === 'de') {
        if (tz.includes('Vienna')) return 'at';
        if (tz.includes('Zurich')) return 'ch';
        return 'de';
    }
    if (languageCode === 'ja') return 'jp';
    if (languageCode === 'hi') return 'in';

    return languageCode;
}

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
    const versionText = document.getElementById('versionText');

    const dropdownBtn = document.getElementById('langDropdownBtn');
    const dropdownMenu = document.getElementById('langDropdownMenu');
    const currentFlag = document.getElementById('currentFlag');
    const currentLangLabel = document.getElementById('currentLangLabel');
    const menuItems = dropdownMenu ? dropdownMenu.querySelectorAll('.footer-menu-item') : [];

    let snippets = [];
    let currentEditingId = null;
    let toastTimeout;
    let currentPrefix = '/';

    if (versionText && chrome.runtime && chrome.runtime.getManifest) {
        versionText.textContent = 'v' + chrome.runtime.getManifest().version;
    }

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
     * Updates the language dropdown button visuals.
     * @param {string} lang The selected language code.
     */
    function updateDropdownVisuals(lang) {
        if (!dropdownBtn || !currentFlag || !currentLangLabel) {
            return;
        }
        menuItems.forEach(item => {
            if (item.getAttribute('data-lang') === lang) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

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
            currentLangLabel.textContent = getBgString('lang_auto');
        } else {
            let autoIcon = dropdownBtn.querySelector('.auto-icon-temp');
            if (autoIcon) {
                autoIcon.remove();
            }
            currentFlag.style.display = 'block';
            currentFlag.src = `https://flagcdn.com/w40/${getFlagCode(lang)}.png`;
            currentLangLabel.textContent = getBgString(`lang_${lang}`);
        }
    }

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownBtn.classList.toggle('open');
            dropdownMenu.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownBtn.classList.remove('open');
                dropdownMenu.classList.remove('open');
            }
        });

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const selectedLang = item.getAttribute('data-lang');
                dropdownBtn.classList.remove('open');
                dropdownMenu.classList.remove('open');
                chrome.storage.sync.set({language: selectedLang}, () => {
                    currentLanguage = selectedLang === 'auto' ? navigator.language.split('-')[0] : selectedLang;
                    if (!BG_LOCALES[currentLanguage]) {
                        currentLanguage = 'en';
                    }
                    applyLocalizations();
                    updateDropdownVisuals(selectedLang);
                    showToast(getBgString('statusSaved'));
                });
            });
        });
    }

    /**
     * Loads the saved snippets from local storage and cleans old prefixed keywords.
     */
    function loadSnippets() {
        chrome.storage.local.get(['geminiSnippets'], (result) => {
            let rawSnippets = result.geminiSnippets || [];

            // MIGRATION: Remove any prefix saved historically in the keyword field
            let needsMigration = false;
            snippets = rawSnippets.map(s => {
                if (s.keyword && s.keyword.match(/^[/*!#@]+/)) {
                    s.keyword = s.keyword.replace(/^[/*!#@]+/, '');
                    needsMigration = true;
                }
                return s;
            });

            if (needsMigration) {
                chrome.storage.local.set({geminiSnippets: snippets});
            }

            renderList();
            if (snippets.length === 0) {
                editorCard.style.display = 'none';
                snippetsListEl.innerHTML = `
                    <div class="empty-state-wrapper">
                        <span class="material-symbols-outlined empty-state-icon">note_stack</span>
                        <div class="empty-state-title" data-i18n="noSnippetsFound">${getBgString('noSnippetsFound')}</div>
                    </div>
                `;
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
                <div class="snippet-item-keyword">${currentPrefix}${snippet.keyword}</div>
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
            if (window.innerWidth < 800) {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
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
        if (window.innerWidth < 800) {
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    };

    saveBtn.onclick = () => {
        const rawKw = keywordInput.value.trim();
        const ct = contentInput.value.trim();

        // Strip any prefix the user might have typed by habit
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

    chrome.storage.sync.get(['themeMode', 'themeColor', 'dynamicColorEnabled', 'language', 'snippetPrefix'], (items) => {
        currentPrefix = items.snippetPrefix || '/';
        if (items.dynamicColorEnabled !== false && typeof applyMaterialTheme === 'function') {
            const colorToApply = items.dynamicColorEnabled !== false ? (items.themeColor || '#0b57d0') : '#0b57d0';
            applyMaterialTheme(colorToApply, items.themeMode || 'auto');
        }
        updateDropdownVisuals(items.language || 'auto');
    });

    loadSnippets();
});