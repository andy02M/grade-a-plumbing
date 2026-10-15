const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(fail = false) {
  const values = new Map();
  const context = { exports: {}, require: () => ({
    getDurableStoredJson: async (kind, key) => {
      if (fail) throw new Error('offline');
      return values.get(key) ?? null;
    },
    setDurableStoredJson: async (kind, key, value) => {
      if (fail) throw new Error('offline');
      values.set(key, value);
    }
  }) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/call-block-list.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText, context);
  return { api: context.exports, values };
}

test('local, international and spaced Australian numbers match', async () => {
  const { api } = load();
  await api.blockCallerNumber('0412 345 678');
  for (const number of ['+61412345678', '0061412345678', '(04) 1234 5678']) {
    assert.equal(await api.isCallerNumberBlocked(number), true);
  }
});
test('never falls back to best contact or recording identifiers', () => {
  const { api } = load();
  assert.equal(api.extractCallerNumberFromAlertText('📲 CALLER ID: Unknown\nBEST CONTACT: +61499999999'), '');
  assert.equal(api.extractCallerNumberFromAlertText('Recording: 1234567890'), '');
  assert.equal(api.extractCallerNumberFromAlertText('📲 CALLER ID: +61412345678\nBEST CONTACT: +61499999999'), '61412345678');
});
test('concurrent blocks survive and existing legacy list remains supported', async () => {
  const { api, values } = load();
  values.set('numbers', { numbers: ['0433333333'] });
  await Promise.all([api.blockCallerNumber('0411111111'), api.blockCallerNumber('0422222222')]);
  for (const number of ['0411111111', '0422222222', '0433333333']) assert.equal(await api.isCallerNumberBlocked(number), true);
});
test('storage outage rejects instead of reporting success', async () => {
  const { api } = load(true);
  await assert.rejects(api.blockCallerNumber('0412345678'));
  await assert.rejects(api.isCallerNumberBlocked('0412345678'));
});
