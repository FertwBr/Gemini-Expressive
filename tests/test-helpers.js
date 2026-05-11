const fs = require('node:fs');
const vm = require('node:vm');

function loadScript(filePath, context = {}) {
    const source = fs.readFileSync(filePath, 'utf8');
    const sandbox = {
        window: {},
        ...context
    };

    if (!sandbox.window) {
        sandbox.window = {};
    }

    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: filePath });
    return sandbox;
}

function createClassList(initialValues = []) {
    const values = new Set(initialValues);

    return {
        add(...tokens) {
            tokens.forEach((token) => values.add(token));
        },
        remove(...tokens) {
            tokens.forEach((token) => values.delete(token));
        },
        contains(token) {
            return values.has(token);
        },
        toggle(token, force) {
            if (typeof force === 'boolean') {
                if (force) {
                    values.add(token);
                } else {
                    values.delete(token);
                }
                return force;
            }

            if (values.has(token)) {
                values.delete(token);
                return false;
            }
            values.add(token);
            return true;
        },
        toArray() {
            return [...values];
        }
    };
}

function createStyleRecorder() {
    const store = new Map();

    return {
        setProperty(name, value, priority = '') {
            store.set(name, { value, priority });
        },
        getPropertyValue(name) {
            return store.get(name)?.value || '';
        },
        getPropertyPriority(name) {
            return store.get(name)?.priority || '';
        },
        entries() {
            return [...store.entries()];
        }
    };
}

module.exports = {
    loadScript,
    createClassList,
    createStyleRecorder
};
