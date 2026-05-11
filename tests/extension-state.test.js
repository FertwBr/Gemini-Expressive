const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadScript } = require('./test-helpers');

function createExtensionStateSandbox(overrides = {}) {
    let storageChangeListener = null;

    const sandbox = loadScript(path.join(__dirname, '..', 'scripts', 'core', 'ExtensionState.js'), {
        window: {},
        chrome: {
            storage: {
                local: {
                    get(keys, callback) {
                        callback({
                            geminiSnippets: [{ id: 'snip-1', keyword: 'hello', content: 'world' }],
                            ...(overrides.localItems || {})
                        });
                    }
                },
                sync: {
                    get(keys, callback) {
                        callback({
                            themeMode: 'dark',
                            timelineEnabled: false,
                            ...(overrides.syncItems || {})
                        });
                    }
                },
                onChanged: {
                    addListener(callback) {
                        storageChangeListener = callback;
                    }
                }
            }
        }
    });

    return {
        ExtensionState: sandbox.window.ExtensionState,
        emitStorageChange(changes, namespace) {
            assert.equal(typeof storageChangeListener, 'function');
            storageChangeListener(changes, namespace);
        }
    };
}

test('ExtensionState.load merges sync settings with local snippets', async () => {
    const { ExtensionState } = createExtensionStateSandbox();

    const settings = await ExtensionState.load();
    assert.equal(settings.timelineEnabled, false);
    assert.equal(settings.themeMode, 'dark');
    assert.deepEqual(settings.snippets, [{ id: 'snip-1', keyword: 'hello', content: 'world' }]);
});

test('ExtensionState.listen updates state and notifies listeners for relevant changes', async () => {
    const { ExtensionState, emitStorageChange } = createExtensionStateSandbox();

    await ExtensionState.load();
    ExtensionState.listen();

    let callbackCount = 0;
    ExtensionState.onChange((changes, newSettings) => {
        callbackCount += 1;
        assert.ok(changes);
        assert.ok(newSettings);
    });

    emitStorageChange(
        {
            geminiSnippets: {
                oldValue: [],
                newValue: [{ id: 'snip-2', keyword: 'x', content: 'y' }]
            }
        },
        'local'
    );
    assert.deepEqual(ExtensionState.settings.snippets, [{ id: 'snip-2', keyword: 'x', content: 'y' }]);

    emitStorageChange(
        {
            themeMode: {
                oldValue: 'dark',
                newValue: 'light'
            },
            hideUpgradeEnabled: {
                oldValue: false,
                newValue: true
            }
        },
        'sync'
    );
    assert.equal(ExtensionState.settings.themeMode, 'light');
    assert.equal(ExtensionState.settings.hideUpgradeEnabled, true);

    emitStorageChange(
        {
            irrelevant: {
                oldValue: 1,
                newValue: 2
            }
        },
        'sync'
    );

    assert.equal(callbackCount, 2);
});
