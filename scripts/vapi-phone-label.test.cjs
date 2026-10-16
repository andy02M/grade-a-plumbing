const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {}, process: { env: { VAPI_PRIVATE_KEY: 'test-only' } }, AbortSignal,
  fetch: async () => ({ ok: true, json: async () => ({ name: 'SouthMorang|Williamstown|MtWaverly' }) }) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/vapi-phone-label.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, context);
test('cleans separators and joined words', () => {
  assert.equal(context.exports.cleanPhoneLabel(' SouthMorang|Williamstown & MtWaverly '), 'South Morang | Williamstown | Mt Waverly');
});
test('places label between title banner and customer details without losing data', () => {
  const source = '🟩🟦\n🚰 GRADE A PLUMBING\n✅ NEW PLUMBING LEAD\n🟩🟦\n\n👤 CUSTOMER\nName: Andy';
  const result = context.exports.insertPhoneLabel(source, 'Melbourne|Richmond');
  assert.ok(result.indexOf('NEW PLUMBING LEAD') < result.indexOf('Melbourne | Richmond'));
  assert.ok(result.indexOf('Melbourne | Richmond') < result.indexOf('👤 CUSTOMER'));
  assert.ok(result.endsWith('Name: Andy'));
});
test('uses inline Vapi label or retrieves the label from Vapi', async () => {
  assert.equal(await context.exports.resolveVapiPhoneLabel({ id: 'a', label: 'Geelong|Toorak', number: '' }), 'Geelong | Toorak');
  assert.equal(await context.exports.resolveVapiPhoneLabel({ id: 'b', label: '', number: '' }), 'South Morang | Williamstown | Mt Waverly');
});
test('API failure does not prevent call delivery', async () => {
  context.fetch = async () => { throw new Error('offline'); };
  assert.equal(await context.exports.resolveVapiPhoneLabel({ id: 'unavailable', label: '', number: '' }), '');
});
