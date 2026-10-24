const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('app/api/call-alert/route.ts', 'utf8');
const start = source.indexOf('function getAlertStage(');
const end = source.indexOf('function shouldPollForRecording(', start);
const scope = { exports: {} };
vm.runInNewContext(ts.transpileModule(source.slice(start, end) + '\nexports.stage = getAlertStage;', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, scope);
const call = { status: 'ended', eventType: 'status-update', recordingUrl: '', endedReason: '', summary: '', provider: 'vapi' };

test('hang-up updates immediately without waiting for a recording', () => {
  assert.equal(scope.exports.stage(call), 'ended');
  assert.equal(scope.exports.stage({ ...call, eventType: 'end-of-call-report' }), 'ended');
});

test('final report remains separate from the immediate ended update', () => {
  assert.equal(scope.exports.stage({ ...call, recordingUrl: 'https://example.com/audio.wav' }), 'completed');
  assert.equal(scope.exports.stage({ ...call, status: 'in-progress' }), 'started');
  assert.equal(scope.exports.stage({ ...call, status: 'no-answer' }), 'missed');
  assert.equal(scope.exports.stage({ ...call, eventType: 'transcript' }), 'ignored');
});
