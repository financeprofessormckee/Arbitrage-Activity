'use strict';
const assert = require('assert/strict');
const M = require('../js/model.js');
let checks = 0;
function ok(c, message) { checks++; assert.ok(c, message); }
function equal(a, b, message) { checks++; assert.deepEqual(a, b, message); }
function close(a, b, message) { ok(Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b)), message + ': ' + a + ' / ' + b); }
const snapshot = x => JSON.stringify(x);

// Independent base-four enumeration: no model recursion or quote helpers.
const routes = [];
for (let length = 1; length <= 4; length++) {
  for (let code = 0; code < 4 ** length; code++) {
    let n = code, route = [];
    for (let digit = 0; digit < length; digit++) { route.push(1 + n % 4); n = Math.floor(n / 4); }
    if (new Set(route).size === length) routes.push(route);
  }
}
equal(routes.length, 64, 'Independent count');
const values = [1n, 2n, 4n, 5n, 10n];
function fraction(scenario, a, b) {
  if (scenario === 'opportunity' && a === 0 && b === 3) return [24n, 100n];
  if (scenario === 'opportunity' && a === 3 && b === 0) return [100n, 24n];
  return [values[a], values[b]];
}
function product(scenario, route) {
  const path = [0, ...route, 0]; let numerator = 1n, denominator = 1n;
  for (let i = 1; i < path.length; i++) { const [a, b] = fraction(scenario, path[i - 1], path[i]); numerator *= a; denominator *= b; }
  return [numerator, denominator];
}
for (const scenario of ['consistent', 'opportunity', 'corrected']) {
  const q = M.quotes(scenario), s = M.start(scenario), original = snapshot(s);
  const listed = M.enumerate(scenario);
  equal(new Set(listed.map(x => snapshot(x.route))).size, 64, 'Enumeration unique');
  equal(listed.map(x => snapshot(x.route)).sort(), routes.map(snapshot).sort(), 'Enumeration complete');
  for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
    const [n, d] = fraction(scenario, a, b); close(q[a][b], Number(n) / Number(d), 'Independent quote'); close(q[a][b] * q[b][a], 1, 'Reciprocity');
  }
  for (const route of routes) {
    const [numerator, denominator] = product(scenario, route), expected = Number(numerator) / Number(denominator);
    const status = numerator > denominator ? 'Profitable' : numerator < denominator ? 'Losing' : 'Neutral';
    const item = listed.find(x => snapshot(x.route) === snapshot(route));
    close(item.multiplier, expected, 'Enumerated rational product'); equal(item.classification, status, 'Exact rational classification');
    for (const amount of [0.000001, 0.005, 1, 17.25, 50, 100]) {
      const p = M.preview(s, route, amount); ok(p.ok, 'Valid preview');
      close(p.multiplier, expected, 'Preview product'); close(p.returned, amount * expected, 'Return'); close(p.profit, amount * (expected - 1), 'Profit');
      close(p.after, 100 + amount * (expected - 1), 'Unused balance retained'); equal(p.classification, status, 'Preview classification');
      equal(p.legs.length, route.length + 1, 'Leg count');
      let running = amount;
      for (const leg of p.legs) { const [n, d] = fraction(scenario, leg.from, leg.to); close(leg.before, running, 'Leg starts with previous amount'); running = running * Number(n) / Number(d); close(leg.after, running, 'Independent leg conversion'); }
      const result = M.execute(s, route, amount); ok(result.ok, 'Executes'); close(result.state.balance, p.after, 'Atomic balance'); equal(result.state.history.length, 1, 'One history record');
      equal(result.state.history[0].route, route, 'Recorded route'); close(result.state.history[0].returned, amount * expected, 'Recorded return');
      equal(snapshot(s), original, 'Original state unchanged');
    }
  }
  const best = M.bestLoop(scenario); equal(best.count, 64, 'Best searches every route');
  equal(best.route, scenario === 'opportunity' ? [3, 1] : [1], 'Shortest then goods-order tie break');
  close(best.multiplier, scenario === 'opportunity' ? 1.2 : 1, 'Best rational multiplier'); equal(best.profitable, scenario === 'opportunity', 'No gain at consistent quotes');
  equal(M.bestLoop(scenario), best, 'Deterministic reveal');
}

let s = M.start();
let p = M.preview(s, [3, 2], 100); close(p.returned, 120, 'Hand-calculated 20% gain'); close(p.after, 120, 'All-holdings gain');
p = M.preview(s, [2, 3], 100); close(p.returned, 100 * 5 / 6, 'Reverse loses');
p = M.preview(s, [3], 100); close(p.returned, 100, 'Reciprocal direct round trip');
p = M.preview(s, [3, 2], 40); close(p.after, 108, '40 exchanged plus 60 unused');
close(M.preview(s, [3, 2], '0.005').after, 100.001, 'No denomination restriction');
ok(M.preview(s, [3, 2], '1e2').ok, 'Finite scientific notation');
for (let i = 1; i <= 50; i++) {
  const original = snapshot(s), quotes = snapshot(M.quotes(s.scenario)), prior = s.balance;
  const result = M.execute(s, [3, 2], s.balance); ok(result.ok, 'Repeated loop valid');
  close(result.state.balance, 100 * 1.2 ** i, 'Repeated compounding'); equal(result.state.history.length, i, 'History grows once');
  close(result.state.history[i - 1].before, prior, 'History before balance'); equal(snapshot(s), original, 'Repeated execution immutable');
  equal(snapshot(M.quotes(result.state.scenario)), quotes, 'Trades never move quotes'); s = result.state;
}
for (const route of [null, [], [0], [5], [1, 1], [1.5], ['1'], [1, 2, 3, 4, 1], [NaN], [undefined]]) {
  const before = snapshot(s), result = M.execute(s, route, 1); ok(!result.ok && result.errors.route, 'Invalid route rejected'); equal(result.state, s, 'Invalid route retains state'); equal(snapshot(s), before, 'Invalid route preserves history');
}
for (const amount of ['', '  ', null, true, {}, [], 'oops', NaN, Infinity, -Infinity, 0, -1, s.balance + 1]) {
  const before = snapshot(s), result = M.execute(s, [3, 2], amount); ok(!result.ok && result.errors.amount, 'Invalid amount rejected'); equal(result.state, s, 'Invalid amount retains state'); equal(snapshot(s), before, 'Invalid amount preserves history');
}
ok(!M.preview(M.start(), [1], Number.MIN_VALUE).ok, 'Subnormal conversion underflow rejected');
ok(M.preview(M.start(), [3, 2], 1e-200).ok, 'Representable tiny amount retained');
const limit = { scenario: 'opportunity', balance: M.maxBalance, history: [] };
ok(!M.execute(limit, [3, 2], 1).ok, 'Overflow result rejected');
ok(M.execute(limit, [1], limit.balance).ok, 'Neutral loop at exact limit');
const below = { scenario: 'opportunity', balance: M.maxBalance - 1, history: [] };
ok(M.execute(below, [3, 2], 5).ok, 'Gain reaches exact limit');
ok(!M.execute(below, [3, 2], 6).ok, 'Gain past limit fails');
for (const bad of [null, { scenario: 'unknown', balance: 100, history: [] }, { scenario: 'opportunity', balance: 0, history: [] }, { scenario: 'opportunity', balance: Infinity, history: [] }, { scenario: 'opportunity', balance: 1e10, history: [] }, { scenario: 'opportunity', balance: 100 }]) ok(!M.preview(bad, [1], 1).ok, 'Invalid state rejected');
equal(M.classification(1 + 0.5e-9), 'Neutral', 'Positive tolerance'); equal(M.classification(1 - 0.5e-9), 'Neutral', 'Negative tolerance');
equal(M.classification(1 + 2e-9), 'Profitable', 'Above tolerance'); equal(M.classification(1 - 2e-9), 'Losing', 'Below tolerance');
equal(M.start('opportunity'), { scenario: 'opportunity', balance: 100, history: [] }, 'Restart default');
equal(M.start('corrected').balance, 100, 'Scenario restart balance');
checks++; assert.throws(() => M.quotes('unknown'), RangeError); checks++; assert.throws(() => M.prompt('unknown'), RangeError);

for (const info of M.prompts) {
  const task = M.prompt(info.id), state = M.start(task.scenario), preview = M.preview(state, task.route, 100);
  ok(!M.checkPrompt(info.id, state, null, task.answer).complete, 'Prompt requires preview');
  ok(!M.checkPrompt(info.id, state, preview, '').complete, 'Prompt requires answer');
  for (const option of task.options) equal(M.checkPrompt(info.id, state, preview, option[0]).complete, option[0] === task.answer, 'Each conceptual option');
  close(preview.multiplier, task.multiplier, 'Prompt expected multiplier');
  const changed = M.execute(state, task.route, 50).state;
  if (changed.balance !== state.balance) ok(!M.checkPrompt(info.id, changed, preview, task.answer).complete, 'Stale balance cannot pass prompt');
  const wrongRoute = M.preview(state, [4], 100); if (snapshot(task.route) !== '[4]') ok(!M.checkPrompt(info.id, state, wrongRoute, task.answer).complete, 'Wrong route cannot pass');
  const wrongScenario = M.start(task.scenario === 'consistent' ? 'opportunity' : 'consistent');
  ok(!M.checkPrompt(info.id, wrongScenario, M.preview(wrongScenario, task.route, 100), task.answer).complete, 'Wrong scenario cannot pass');
}

// Ensure callers cannot alter scenario mathematics or future task copies.
const q = M.quotes('opportunity'); q[0][3] = 999; close(M.quotes('opportunity')[0][3], .24, 'Quote copy');
const task = M.prompt('gain'); task.route[0] = 4; task.options[0][0] = 'changed'; equal(M.prompt('gain').route, [3, 2], 'Prompt route copy');
equal(M.prompt('gain').options[0][0], 'future', 'Prompt answer copy');
// Self-check evidence must match both the amount and the trade history.
for (const info of M.prompts) {
  const task = M.prompt(info.id), state = M.start(task.scenario);
  for (const amount of [1, 50, 99.99]) {
    const wrongAmount = M.preview(state, task.route, amount);
    ok(!M.checkPrompt(info.id, state, wrongAmount, task.answer).complete, 'Self-check rejects a different amount');
  }
  const evidence = M.preview(state, task.route, 100);
  const afterNeutralTrade = M.execute(state, [1], 100).state;
  equal(afterNeutralTrade.balance, state.balance, 'Neutral trade retains the same balance');
  ok(!M.checkPrompt(info.id, afterNeutralTrade, evidence, task.answer).complete, 'Neutral trade invalidates earlier evidence');
  ok(M.checkPrompt(info.id, afterNeutralTrade, M.preview(afterNeutralTrade, task.route, 100), task.answer).complete, 'Fresh evidence passes');
  equal(M.checkPrompt(info.id, state, evidence, '').message, 'Choose an answer before checking it.', 'Missing answer has actionable feedback');
}
console.log(JSON.stringify({ checks, failures: 0, routes: 64, scenarios: 3 }, null, 2));
