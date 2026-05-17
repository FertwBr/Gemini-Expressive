const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadScript } = require('./test-helpers');

test('background listener routes settings and snippets actions', () => {
    let listener = null;
    let optionsOpened = 0;
    const tabCreations = [];

    loadScript(path.join(__dirname, '..', 'background.js'), {
        chrome: {
            runtime: {
                onMessage: {
                    addListener(callback) {
                        listener = callback;
                    }
                },
                openOptionsPage() {
                    optionsOpened += 1;
                }
            },
            tabs: {
                create(payload) {
                    tabCreations.push(payload);
                }
            }
        }
    });

    assert.equal(typeof listener, 'function');

    listener({ action: 'openSettings' });
    listener({ action: 'openSnippets' });
    listener({ action: 'noop' });

    assert.equal(optionsOpened, 1);
    assert.equal(tabCreations.length, 1);
    assert.equal(tabCreations[0].url, 'options/snippets.html');
});
