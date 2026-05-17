const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadScript } = require('./test-helpers');

function loadTracker(getLocalStorageValue, nowProvider = () => 0) {
    const timeCalls = [];
    const infoCalls = [];
    const tableCalls = [];

    const sandbox = loadScript(path.join(__dirname, '..', 'scripts', 'utils', 'PerformanceTracker.js'), {
        window: {
            localStorage: {
                getItem() {
                    return getLocalStorageValue();
                }
            }
        },
        performance: {
            now: nowProvider
        },
        console: {
            time(label) {
                timeCalls.push({ type: 'time', label });
            },
            timeEnd(label) {
                timeCalls.push({ type: 'timeEnd', label });
            },
            info(message) {
                infoCalls.push(message);
            },
            table(rows) {
                tableCalls.push(rows);
            }
        }
    });

    return {
        tracker: sandbox.window.PerformanceTracker,
        timeCalls,
        infoCalls,
        tableCalls
    };
}

test('PerformanceTracker stays inert when runtime profiling is disabled', () => {
    const { tracker, timeCalls, infoCalls, tableCalls } = loadTracker(() => null, () => 10);

    assert.equal(tracker.enabled, false);
    assert.equal(tracker.start('cycle'), null);

    tracker.end(null);
    tracker.mark('boot');
    tracker.report();

    assert.deepEqual(Object.keys(tracker.metrics), []);
    assert.equal(timeCalls.length, 0);
    assert.equal(infoCalls.length, 0);
    assert.equal(tableCalls.length, 0);
});

test('PerformanceTracker records metrics and emits report rows when enabled', () => {
    let now = 100;
    const { tracker, timeCalls, infoCalls, tableCalls } = loadTracker(() => '1', () => now);

    assert.equal(tracker.enabled, true);

    const first = tracker.start('timeline-update');
    now = 160;
    tracker.end(first);

    const second = tracker.start('timeline-update');
    now = 190;
    tracker.end(second);

    tracker.mark('post-render');
    tracker.report();

    assert.equal(tracker.metrics['timeline-update'].count, 2);
    assert.equal(Math.round(tracker.metrics['timeline-update'].total), 90);
    assert.equal(Math.round(tracker.metrics['timeline-update'].max), 60);
    assert.equal(Math.round(tracker.metrics['timeline-update'].min), 30);
    assert.equal(timeCalls.filter((entry) => entry.type === 'time').length, 2);
    assert.equal(timeCalls.filter((entry) => entry.type === 'timeEnd').length, 2);
    assert.equal(infoCalls.length, 1);
    assert.equal(tableCalls.length, 1);
    assert.equal(tableCalls[0][0].metric, 'timeline-update');
});
