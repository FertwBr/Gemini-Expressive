// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openSettings') {
        chrome.runtime.openOptionsPage();
    } else if (request.action === 'openSnippets') {
        chrome.tabs.create({ url: 'options/snippets.html' });
    }
});