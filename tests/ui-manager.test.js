const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadScript, createClassList } = require('./test-helpers');

function createUIManagerSandbox() {
    const byId = new Map();
    let appendedStyles = 0;
    let appliedThemes = 0;
    const scheduledCallbacks = [];

    const document = {
        body: {
            classList: createClassList(),
            click() {}
        },
        head: {
            appendChild(node) {
                appendedStyles += 1;
                if (node.id) {
                    byId.set(node.id, node);
                }
            }
        },
        getElementById(id) {
            return byId.get(id) || null;
        },
        createElement(tagName) {
            return {
                tagName: tagName.toUpperCase(),
                id: '',
                textContent: '',
                style: {}
            };
        },
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        }
    };

    const sandbox = loadScript(path.join(__dirname, '..', 'scripts', 'core', 'UIManager.js'), {
        window: {},
        document,
        ThemeUtils: {
            applyMaterialTheme() {
                appliedThemes += 1;
            }
        },
        setTimeout(callback) {
            scheduledCallbacks.push(callback);
            return scheduledCallbacks.length;
        }
    });

    return {
        UIManager: sandbox.window.UIManager,
        document,
        getAppendedStyleCount() {
            return appendedStyles;
        },
        getAppliedThemeCount() {
            return appliedThemes;
        },
        flushTimers() {
            while (scheduledCallbacks.length > 0) {
                const cb = scheduledCallbacks.shift();
                cb();
            }
        }
    };
}

test('UIManager.applyFeatureToggles applies feature classes to body', () => {
    const { UIManager, document } = createUIManagerSandbox();

    UIManager.applyFeatureToggles({
        timelineEnabled: false,
        collapseEnabled: true,
        headersEnabled: false,
        codeNavEnabled: true,
        dynamicColorEnabled: true,
        hideUpgradeEnabled: true
    });

    assert.equal(document.body.classList.contains('bg-timeline-disabled'), true);
    assert.equal(document.body.classList.contains('bg-collapse-disabled'), false);
    assert.equal(document.body.classList.contains('bg-headers-disabled'), true);
    assert.equal(document.body.classList.contains('bg-code-nav-disabled'), false);
    assert.equal(document.body.classList.contains('bg-dynamic-theme-enabled'), true);
    assert.equal(document.body.classList.contains('bg-hide-upgrade'), true);
});

test('UIManager.injectUIFixes injects styles only once', () => {
    const { UIManager, getAppendedStyleCount } = createUIManagerSandbox();

    UIManager.injectUIFixes();
    UIManager.injectUIFixes();

    assert.equal(getAppendedStyleCount(), 1);
});

test('UIManager.attemptThemeApplication respects dynamic color and in-flight guard', () => {
    const { UIManager, getAppliedThemeCount, flushTimers } = createUIManagerSandbox();

    UIManager.attemptThemeApplication({
        dynamicColorEnabled: false,
        themeColor: '#6750A4',
        themeMode: 'dark',
        timelineEnabled: true,
        collapseEnabled: true,
        headersEnabled: true,
        codeNavEnabled: true,
        hideUpgradeEnabled: false
    });
    assert.equal(getAppliedThemeCount(), 0);

    UIManager.attemptThemeApplication({
        dynamicColorEnabled: true,
        themeColor: '#6750A4',
        themeMode: 'dark',
        timelineEnabled: true,
        collapseEnabled: true,
        headersEnabled: true,
        codeNavEnabled: true,
        hideUpgradeEnabled: false
    });
    assert.equal(getAppliedThemeCount(), 1);
    assert.equal(UIManager.isApplyingTheme, true);

    UIManager.attemptThemeApplication({
        dynamicColorEnabled: true,
        themeColor: '#6750A4',
        themeMode: 'dark',
        timelineEnabled: true,
        collapseEnabled: true,
        headersEnabled: true,
        codeNavEnabled: true,
        hideUpgradeEnabled: false
    });
    assert.equal(getAppliedThemeCount(), 1);

    flushTimers();
    assert.equal(UIManager.isApplyingTheme, false);
});
