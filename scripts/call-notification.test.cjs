const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/call-notification.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, context);
const render = context.exports.renderCallNotification;
const source = [
  '🟩🟦🟩🟩🟦🟩🟩🟦🟩', '🚰 GRADE A PLUMBING', '✅ NEW PLUMBING LEAD', '🟩🟦🟩🟩🟦🟩🟩🟦🟩',
  '', '📞 CUSTOMER BEING CALLED', '====================================', '👤 CALLING: Andy',
  '🕒 STARTED: Today', '⚠️ Please avoid duplicate calls until this changes.', '====================================',
  '', '👤 CUSTOMER', 'Name: Amit', 'Caller: +61400000000', 'Location: Preston VIC 3072',
  '', '🔧 JOB DETAILS', 'Issue: Leaking pipe', 'Urgency: Not urgent',
  '🟩🟦🟩 MAPS & ETA 🟩🟦🟩', '🟢 Best: Kamil 19 min / 10.1 km',
  '- James 24 min / 16 km | Rahim 34 min / 42 km', '- Dean 34 min / 42 km | Adam 46 min / 41 km',
  '🎧 RECORDING', 'https://example.com/recording', '🎯 NEXT ACTION', 'Confirm availability with the team.'
].join('\n');
test('compact presentation keeps customer, calling status, recording and next action', () => {
  const result = render(source);
  const quote = result.entities.find(entity => entity.type === 'blockquote');
  assert.ok(result.text.startsWith('🚨 NEW PLUMBING LEAD 🚨'));
  assert.equal(result.text.slice(quote.offset, quote.offset + quote.length), result.text.slice(result.text.indexOf('\n') + 1));
  for (const value of ['Name: Amit', 'Caller: +61400000000', 'Location: Preston', 'CALLING: Andy', 'Issue: Leaking pipe', 'https://example.com/recording', 'Confirm availability']) assert.ok(result.text.includes(value));
  assert.equal(result.hasMoreEtas, true);
  assert.ok(!result.text.includes('Adam 46 min'));
  assert.ok(result.text.indexOf('CALLING: Andy') < result.text.indexOf('Name: Amit'));
  assert.ok(!result.text.includes('===='));
});
test('expanded view restores remaining ETAs and bold entities use UTF-16 offsets', () => {
  const result = render(source, true);
  assert.ok(result.text.includes('Adam 46 min'));
  assert.ok(result.entities.some(entity => result.text.slice(entity.offset, entity.offset + entity.length) === 'Name: Amit'));
  assert.equal(source.includes('Adam 46 min'), true);
});

test('animated icons reference exact emoji text and leave coloured section accents visible', () => {
  const result = render(source);
  assert.ok(result.text.includes('🟦 CUSTOMER DETAILS'));
  assert.ok(result.text.includes('🟧 JOB DETAILS'));
  assert.ok(result.text.includes('🟩 NEAREST PLUMBER'));
  const custom = result.entities.filter(entity => entity.type === 'custom_emoji');
  assert.ok(custom.length >= 3);
  for (const entity of custom) {
    const emoji = result.text.slice(entity.offset, entity.offset + entity.length);
    assert.equal(context.exports.notificationEmoji[emoji], entity.custom_emoji_id);
  }
});

test('repeated calling and final booking preserve every customer field', () => {
  const route = fs.readFileSync('app/api/telegram/call-actions/route.ts', 'utf8');
  const functions = route.slice(route.indexOf('function formatCallingCustomerAlertText('), route.indexOf('function formatTelegramUser('));
  const scope = { exports: {}, alertDivider: '====================================', formatTimestamp: () => 'Today' };
  vm.runInNewContext(ts.transpileModule(functions + '\nexports.calling = formatCallingCustomerAlertText; exports.handled = formatHandledAlertText;', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText, scope);
  const twice = scope.exports.calling(scope.exports.calling(source, 'Andy'), 'Emad');
  const booked = scope.exports.handled(twice, 'Booked', '02 Booked', 'Emad');
  for (const value of ['Name: Amit', 'Caller: +61400000000', 'Location: Preston', 'Issue: Leaking pipe', 'Adam 46 min', 'https://example.com/recording']) {
    assert.ok(twice.includes(value), value);
    assert.ok(booked.includes(value), value);
  }
  assert.equal((twice.match(/CUSTOMER BEING CALLED/g) || []).length, 1);
  assert.ok(!booked.includes('CUSTOMER BEING CALLED'));
});
