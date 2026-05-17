const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadScript } = require('./test-helpers');

function getCodeUtils() {
    const sandbox = loadScript(path.join(__dirname, '..', 'scripts', 'utils', 'CodeUtils.js'), {
        window: {}
    });
    return sandbox.window.CodeUtils;
}

test('CodeUtils.cleanText removes known UI prompt labels', () => {
    const CodeUtils = getCodeUtils();
    const cleaned = CodeUtils.cleanText('You said  Mostrar raciocínio  Gemini said  console.log(1)');
    assert.equal(cleaned, 'console.log(1)');
});

test('CodeUtils.getLanguageIcon maps language families to expected symbols', () => {
    const CodeUtils = getCodeUtils();
    assert.equal(CodeUtils.getLanguageIcon('sql'), 'database');
    assert.equal(CodeUtils.getLanguageIcon('python'), 'terminal');
    assert.equal(CodeUtils.getLanguageIcon('yaml'), 'data_object');
    assert.equal(CodeUtils.getLanguageIcon('typescript'), 'code');
});

test('CodeUtils.extractCodeMetadata infers filenames by language heuristics', () => {
    const CodeUtils = getCodeUtils();

    assert.equal(
        CodeUtils.extractCodeMetadata('function saveConfig() {}', 'javascript'),
        'saveConfig.js'
    );
    assert.equal(
        CodeUtils.extractCodeMetadata('class UserService {}', 'typescript'),
        'UserService.ts'
    );
    assert.equal(
        CodeUtils.extractCodeMetadata('def generate_report():\n    pass', 'python'),
        'generate_report.py'
    );
    assert.equal(
        CodeUtils.extractCodeMetadata('plain text without declarations', 'ruby'),
        null
    );
});
