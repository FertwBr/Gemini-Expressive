/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openSettings') {
        chrome.runtime.openOptionsPage();
    } else if (request.action === 'openSnippets') {
        chrome.tabs.create({ url: 'options/snippets.html' });
    }
});