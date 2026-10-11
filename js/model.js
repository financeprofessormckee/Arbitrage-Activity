/* Economic concepts: David Friedman. Development: Eric McKee.
   Fresh fixed-quote model. Adaptations are recorded in SPECIFICATION.md. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArbitrageModel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var GOODS = ['Grain', 'Cloth', 'Copper', 'Tea', 'Salt'];
  var VALUES = [1, 2, 4, 5, 10], EPS = 1e-9, MAX = 1000000000;
  var SCENARIOS = [
    { id: 'consistent', title: 'Consistent rates', explanation: 'All quotes agree with one set of relative values. Every closed loop returns the amount it started with, apart from floating-point precision.' },
    { id: 'opportunity', title: 'Arbitrage opportunity', explanation: 'Grain buys 0.24 tea instead of 0.2. The reverse quote is reciprocal, but this pair disagrees with the other markets. Can you find a profitable loop?' },
    { id: 'corrected', title: 'Corrected rates', explanation: 'Grain buys 0.2 tea again. Restoring the consistent quotes removes the former gain. This scenario changes quotes explicitly; your trades do not change them.' }
  ];
  var PROMPTS = [
    { id: 'consistent', title: '1. Test consistent quotes', scenario: 'consistent', route: [1], multiplier: 1,
      question: 'Why does grain → cloth → grain return the amount you started with?', answer: 'reciprocal',
      options: [['gain', 'Any exchange automatically creates a profit'], ['reciprocal', 'The two rates are reciprocals, so their product is one'], ['time', 'The return depends on future price changes']],
      explanation: 'Reciprocal quotes cancel in a two-leg round trip. Here all relative prices also agree, so longer loops are neutral too.' },
    { id: 'gain', title: '2. Find the 20% gain', scenario: 'opportunity', route: [3, 2], multiplier: 1.2,
      question: 'Why can this locked-quote loop return 120 grain from 100?', answer: 'inconsistent',
      options: [['future', 'It bets that tea prices rise later'], ['impact', 'Your trade raises the exchange rates'], ['inconsistent', 'The three current quotes have a product greater than one']],
      explanation: '100 grain × 0.24 tea/grain × 1.25 copper/tea × 4 grain/copper = 120 grain. All three quotes are locked during execution; no future price prediction is required.' },
    { id: 'reverse', title: '3. Reverse the route', scenario: 'opportunity', route: [2, 3], multiplier: 5 / 6,
      question: 'Why does the reverse loop lose grain?', answer: 'inverse',
      options: [['inverse', 'Its multiplier is 1/1.2 = 5/6, below one'], ['same', 'Both directions must earn the same gain'], ['fee', 'A transaction fee was charged']],
      explanation: 'Reversing every quote inverts the original product. The loop returns about 83.333333 grain from 100. There are no transaction fees in this model.' },
    { id: 'corrected', title: '4. Remove the inconsistency', scenario: 'corrected', route: [3, 2], multiplier: 1,
      question: 'What removed the former 20% gain?', answer: 'correction',
      options: [['trade', 'Executing a loop changed the market quotes'], ['correction', 'The scenario restored consistent relative prices'], ['smaller', 'Trading a smaller amount eliminated arbitrage']],
      explanation: 'The same route now multiplies to 1 instead of 1.2. The scenario explicitly restores consistent rates; trades themselves never change quotes here.' }
  ];
  function scenario(id) {
    var s = SCENARIOS.find(function (item) { return item.id === id; });
    if (!s) throw new RangeError('Choose a known scenario.');
    return Object.assign({}, s);
  }
  function quotes(id) {
    scenario(id);
    var q = VALUES.map(function (a) { return VALUES.map(function (b) { return a / b; }); });
    if (id === 'opportunity') { q[0][3] = 0.24; q[3][0] = 1 / 0.24; }
    return q;
  }
  function start(id) { scenario(id = id || 'opportunity'); return { scenario: id, balance: 100, history: [] }; }
  function stateError(s) {
    if (!s || !SCENARIOS.some(function (x) { return x.id === s.scenario; }) ||
      !Number.isFinite(s.balance) || s.balance <= 0 || s.balance > MAX || !Array.isArray(s.history)) return 'Invalid activity state.';
    return '';
  }
  function routeError(route) {
    if (!Array.isArray(route) || route.length < 1 || route.length > 4) return 'Choose one to four intermediate goods.';
    var seen = {};
    for (var i = 0; i < route.length; i++) {
      var g = route[i];
      if (!Number.isInteger(g) || g < 1 || g > 4 || seen[g]) return 'Choose distinct intermediate goods; grain is the start and finish.';
      seen[g] = true;
    }
    return '';
  }
  function amountError(value, balance) {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '' || !Number.isFinite(Number(value))) return 'Enter a finite positive amount of grain.';
    var n = Number(value);
    if (n <= 0) return 'Enter an amount greater than zero.';
    if (n > balance) return 'The amount cannot exceed your current grain holdings.';
    return '';
  }
  function classification(multiplier) { return multiplier > 1 + EPS ? 'Profitable' : multiplier < 1 - EPS ? 'Losing' : 'Neutral'; }
  function validate(s, route, amount) {
    var errors = {}, invalidState = stateError(s);
    if (invalidState) { errors.state = invalidState; return errors; }
    var re = routeError(route), ae = amountError(amount, s.balance);
    if (re) errors.route = re;
    if (ae) errors.amount = ae;
    if (re || ae) return errors;
    var q = quotes(s.scenario), path = [0].concat(route, [0]), running = Number(amount), product = 1;
    for (var i = 0; i < path.length - 1; i++) {
      var rate = q[path[i]][path[i + 1]];
      product *= rate; running *= rate;
      if (!Number.isFinite(running) || running <= 0) { errors.amount = 'This amount is too small or large for reliable conversion. Choose another amount.'; return errors; }
    }
    var returned = Number(amount) * product, after = s.balance - Number(amount) + returned;
    if (!Number.isFinite(after) || after > MAX) errors.amount = 'This loop would exceed the activity limit of 1,000,000,000 grain. Choose a smaller amount or restart.';
    if (returned <= 0 || after <= 0) errors.amount = 'This amount is too small for reliable conversion. Choose another amount.';
    return errors;
  }
  function preview(s, route, amount) {
    var errors = validate(s, route, amount);
    if (Object.keys(errors).length) return { ok: false, errors: errors };
    amount = Number(amount);
    var q = quotes(s.scenario), path = [0].concat(route, [0]), product = 1, legs = [];
    // Prefix products keep all quantities tied to the original amount without intermediate rounding.
    for (var i = 0; i < path.length - 1; i++) {
      var before = amount * product, rate = q[path[i]][path[i + 1]];
      product *= rate;
      legs.push({ from: path[i], to: path[i + 1], rate: rate, before: before, after: amount * product });
    }
    var returned = amount * product;
    return { ok: true, scenario: s.scenario, route: route.slice(), path: path, amount: amount,
      multiplier: product, classification: classification(product), legs: legs, returned: returned,
      profit: returned - amount, before: s.balance, after: s.balance - amount + returned,
      historyLength: s.history.length };
  }
  function execute(s, route, amount) {
    var p = preview(s, route, amount);
    if (!p.ok) return { ok: false, errors: p.errors, state: s };
    var record = { number: s.history.length + 1, route: p.route.slice(), amount: p.amount,
      multiplier: p.multiplier, returned: p.returned, profit: p.profit, before: p.before, after: p.after };
    return { ok: true, preview: p, state: { scenario: s.scenario, balance: p.after, history: s.history.concat([record]) } };
  }
  function enumerate(id) {
    var q = quotes(id), results = [];
    function visit(route, unused) {
      if (route.length) {
        var path = [0].concat(route, [0]), multiplier = 1;
        for (var i = 0; i < path.length - 1; i++) multiplier *= q[path[i]][path[i + 1]];
        results.push({ route: route.slice(), multiplier: multiplier, classification: classification(multiplier) });
      }
      unused.forEach(function (g) { visit(route.concat([g]), unused.filter(function (x) { return x !== g; })); });
    }
    visit([], [1, 2, 3, 4]); return results;
  }
  function bestLoop(id) {
    var list = enumerate(id), highest = Math.max.apply(null, list.map(function (r) { return r.multiplier; }));
    // First form the maximum's tolerance group; avoid non-transitive tolerance comparators.
    var best = list.filter(function (r) { return highest - r.multiplier <= EPS; }).sort(function (a, b) {
      if (a.route.length !== b.route.length) return a.route.length - b.route.length;
      for (var i = 0; i < a.route.length; i++) if (a.route[i] !== b.route[i]) return a.route[i] - b.route[i];
      return 0;
    })[0];
    return { route: best.route.slice(), multiplier: best.multiplier, profitable: highest > 1 + EPS, count: list.length };
  }
  function prompt(id) {
    var p = PROMPTS.find(function (x) { return x.id === id; });
    if (!p) throw new RangeError('Choose a known self-check.');
    return Object.assign({}, p, { route: p.route.slice(), options: p.options.map(function (x) { return x.slice(); }) });
  }
  function checkPrompt(id, s, p, answer) {
    var task = prompt(id);
    if (!p || !p.ok || p.scenario !== s.scenario || p.before !== s.balance || p.historyLength !== s.history.length ||
      s.scenario !== task.scenario || JSON.stringify(p.route) !== JSON.stringify(task.route)) return { complete: false, message: 'Preview the self-check’s loaded route in its scenario before checking your answer.' };
    if (p.amount !== 100) return { complete: false, message: 'This self-check uses exactly 100 grain. Reload the self-check, then preview its loop before answering.' };
    var actual = preview(s, p.route, p.amount);
    if (!actual.ok || Math.abs(actual.multiplier - task.multiplier) > EPS) return { complete: false, message: 'Preview the self-check’s loaded route before checking your answer.' };
    if (!answer) return { complete: false, message: 'Choose an answer before checking it.' };
    if (answer !== task.answer) return { complete: false, message: 'Not yet. Compare the rate product with one, then try your answer again.' };
    return { complete: true, message: 'Self-check complete. ' + task.explanation };
  }
  return { goods: GOODS.slice(), scenarios: SCENARIOS.map(function (s) { return Object.assign({}, s); }),
    maxBalance: MAX, tolerance: EPS, scenario: scenario, quotes: quotes, start: start,
    routeError: routeError, amountError: amountError, validate: validate, classification: classification,
    preview: preview, execute: execute, enumerate: enumerate, bestLoop: bestLoop,
    prompts: PROMPTS.map(function (p) { return { id: p.id, title: p.title }; }), prompt: prompt, checkPrompt: checkPrompt };
});
