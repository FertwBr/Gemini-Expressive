const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
    loadScript,
    createClassList,
    createStyleRecorder
} = require('./test-helpers');

function createThemeSandbox(matchMediaMatches = false) {
    const rootStyle = createStyleRecorder();
    const bodyStyle = createStyleRecorder();

    const root = {
        classList: createClassList(),
        style: rootStyle,
        getAttribute() {
            return null;
        }
    };

    const body = {
        classList: createClassList(),
        style: bodyStyle,
        getAttribute() {
            return null;
        }
    };

    const metaThemeColor = {
        content: '',
        setAttribute(name, value) {
            if (name === 'content') {
                this.content = value;
            }
        }
    };

    const sandbox = loadScript(path.join(__dirname, '..', 'scripts', 'utils', 'ThemeUtils.js'), {
        window: {
            matchMedia() {
                return { matches: matchMediaMatches };
            }
        },
        document: {
            body,
            documentElement: root,
            querySelector(selector) {
                if (selector === 'meta[name=theme-color]') {
                    return metaThemeColor;
                }
                return null;
            }
        }
    });

    return {
        ThemeUtils: sandbox.window.ThemeUtils,
        root,
        body,
        metaThemeColor
    };
}

test('ThemeUtils color conversion helpers produce stable values', () => {
    const { ThemeUtils } = createThemeSandbox(false);

    assert.deepEqual([...ThemeUtils.hexToHsl('#ff0000')], [0, 100, 50]);
    assert.equal(ThemeUtils.hslToHex(0, 100, 50), '#ff0000');
    assert.equal(ThemeUtils.hexToRgbString('#6750a4'), '103, 80, 164');
});

test('ThemeUtils.isDarkModeActive respects explicit mode and environment', () => {
    const darkEnv = createThemeSandbox(true);
    assert.equal(darkEnv.ThemeUtils.isDarkModeActive('dark'), true);
    assert.equal(darkEnv.ThemeUtils.isDarkModeActive('light'), false);
    assert.equal(darkEnv.ThemeUtils.isDarkModeActive('auto'), true);

    const lightEnv = createThemeSandbox(false);
    assert.equal(lightEnv.ThemeUtils.isDarkModeActive('auto'), false);
});

test('ThemeUtils.applyMaterialTheme sets CSS tokens and theme metadata', () => {
    const { ThemeUtils, root, body, metaThemeColor } = createThemeSandbox(false);

    ThemeUtils.applyMaterialTheme('#6750A4', 'light');

    assert.equal(root.classList.contains('light-theme'), true);
    assert.equal(root.style.colorScheme, 'light');
    assert.match(root.style.getPropertyValue('--bg-sys-color-primary'), /^#/);
    assert.match(root.style.getPropertyValue('--md-sys-color-primary'), /^#/);
    assert.match(body.style.getPropertyValue('--bard-color-sidenav-background-desktop'), /^#/);
    assert.match(metaThemeColor.content, /^#/);
});
