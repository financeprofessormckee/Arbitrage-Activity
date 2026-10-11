/* Economic concepts: David Friedman. Development: Eric McKee. */
(function () {
  'use strict';
  var M = window.ArbitrageModel, V = window.ArbitrageView, el = V.el;
  var state = M.start(), route = [3, 2], currentPreview = null, activePrompt = null;
  function announce(message) { el('status').textContent = message; }
  function clearErrors() {
    ['amount', 'route'].forEach(function (key) { el(key + '-error').textContent = ''; el(key + '-error').hidden = true; });
    el('amount').removeAttribute('aria-invalid');
    el('route-selectors').querySelectorAll('select').forEach(function (select) { select.removeAttribute('aria-invalid'); });
  }
  function showErrors(errors) {
    clearErrors();
    ['route', 'amount'].forEach(function (key) {
      if (!errors[key]) return;
      el(key + '-error').textContent = errors[key]; el(key + '-error').hidden = false;
      if (key === 'amount') el('amount').setAttribute('aria-invalid', 'true');
      else el('route-selectors').querySelectorAll('select').forEach(function (select) { select.setAttribute('aria-invalid', 'true'); });
    });
    announce('Loop not applied. ' + Object.values(errors).join(' '));
    if (errors.route) el('route-selectors').querySelector('select').focus();
    else if (errors.amount) el('amount').focus();
  }
  function clearSuccess() { el('prompt-result').textContent = ''; el('prompt-result').className = ''; }
  function invalidate(message) {
    currentPreview = null; el('execute').disabled = true; V.preview(null);
    el('prompt-preview-summary').textContent = 'Preview the loaded loop to see the evidence for your answer.';
    el('reveal-panel').hidden = true; clearErrors(); clearSuccess();
    if (message) announce(message);
  }
  function refreshOptions() {
    el('route-selectors').querySelectorAll('select').forEach(function (select, i) {
      Array.from(select.options).forEach(function (option) { option.disabled = route.indexOf(Number(option.value)) !== -1 && Number(option.value) !== route[i]; });
    });
    el('add-stop').disabled = route.length === 4; el('remove-stop').disabled = route.length === 1;
    V.diagram(route);
  }
  function buildRoute() {
    var container = el('route-selectors'); container.replaceChildren();
    route.forEach(function (good, i) {
      var box = V.node('div'), label = V.node('label', 'Stop ' + (i + 1)), select = V.node('select');
      select.id = 'stop-' + (i + 1); label.htmlFor = select.id; select.setAttribute('aria-describedby', 'route-help route-error');
      for (var g = 1; g <= 4; g++) { var option = V.node('option', M.goods[g]); option.value = String(g); select.appendChild(option); }
      select.value = String(good);
      select.addEventListener('change', function () { route[i] = Number(select.value); invalidate('Route changed. Preview it again before executing.'); refreshOptions(); });
      box.append(label, select); container.appendChild(box);
    });
    refreshOptions();
  }
  function markPrompt() {
    el('prompt-buttons').querySelectorAll('button').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.id === 'prompt-' + activePrompt));
    });
  }
  function clearPrompt() { activePrompt = null; el('prompt-panel').hidden = true; clearSuccess(); markPrompt(); }
  function restart(id, keepPrompt) {
    state = M.start(id); route = [3, 2]; el('scenario').value = id; el('amount').value = '100';
    invalidate(); if (!keepPrompt) clearPrompt(); buildRoute(); V.quotes(state); V.summary(state); V.history(state);
  }
  el('scenario').addEventListener('change', function () {
    restart(el('scenario').value, false); announce('Loaded ' + M.scenario(state.scenario).title + '. Holdings restarted at 100 grain; history cleared.');
  });
  el('restart').addEventListener('click', function () { restart(state.scenario, false); announce('Restarted this scenario at 100 grain. History, preview, and self-check cleared.'); });
  el('add-stop').addEventListener('click', function () {
    if (route.length >= 4) return;
    route.push([1, 2, 3, 4].find(function (g) { return route.indexOf(g) === -1; }));
    invalidate('Stop added. Preview the new route.'); buildRoute(); el('stop-' + route.length).focus();
  });
  el('remove-stop').addEventListener('click', function () {
    if (route.length <= 1) return;
    route.pop(); invalidate('Last stop removed. Preview the new route.'); buildRoute(); el('stop-' + route.length).focus();
  });
  el('reverse-route').addEventListener('click', function () {
    route.reverse(); invalidate('Route reversed. Preview it to compare the reciprocal multiplier.'); buildRoute();
  });
  el('amount').addEventListener('input', function () { invalidate('Amount changed. Preview it again before executing.'); });
  el('all-holdings').addEventListener('click', function () { el('amount').value = String(state.balance); invalidate('Amount set to all ' + V.number(state.balance) + ' grain. Preview before executing.'); });
  function previewLoop() {
    invalidate();
    var p = M.preview(state, route, el('amount').value);
    if (!p.ok) { showErrors(p.errors); return; }
    currentPreview = p; V.preview(p); el('execute').disabled = false;
    el('prompt-preview-summary').textContent = el('preview-summary').textContent;
    announce(p.classification + ' preview. ' + V.number(p.amount) + ' grain would return ' + V.number(p.returned) + ' grain, multiplier ' + V.number(p.multiplier) + '. No trade executed.');
  }
  el('trade-form').addEventListener('submit', function (event) {
    event.preventDefault(); previewLoop();
  });
  el('preview-prompt').addEventListener('click', previewLoop);
  el('execute').addEventListener('click', function () {
    if (!currentPreview) return;
    // Read current controls and revalidate; never execute a stale or invalid preview.
    if (currentPreview.amount !== Number(el('amount').value) || JSON.stringify(currentPreview.route) !== JSON.stringify(route) || currentPreview.before !== state.balance) {
      invalidate('Preview is out of date. Preview the current route and amount again.'); return;
    }
    var result = M.execute(state, route, el('amount').value);
    if (!result.ok) { invalidate(); showErrors(result.errors); return; }
    state = result.state; el('amount').value = String(Math.min(result.preview.amount, state.balance));
    invalidate(); V.summary(state); V.history(state);
    announce('Executed ' + V.routeText(route) + '. Returned ' + V.number(result.preview.returned) + ' grain; holdings now ' + V.number(state.balance) + ' grain. Quotes unchanged. Preview again for another trade.');
    // Execute becomes disabled; move focus to the next usable action rather than leaving it on a disabled control.
    el('preview').focus();
  });
  el('reveal').addEventListener('click', function () {
    var best = M.bestLoop(state.scenario), p = M.preview(state, best.route, el('amount').value);
    if (!p.ok) { showErrors(p.errors); return; }
    clearErrors(); V.reveal(best, p);
    announce(best.profitable ? 'Best loop revealed: ' + V.routeText(best.route) + ', multiplier ' + V.number(best.multiplier) + '. Your route and holdings are unchanged.' : 'Searched all 64 routes. No profitable loop exists at these quotes.');
  });
  M.prompts.forEach(function (info) {
    var button = V.node('button', info.title); button.type = 'button'; button.id = 'prompt-' + info.id;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', function () {
      var task = M.prompt(info.id); restart(task.scenario, true); activePrompt = task.id; markPrompt();
      route = task.route.slice(); buildRoute(); el('prompt-panel').hidden = false;
      el('prompt-title').textContent = task.title; el('prompt-question').textContent = task.question;
      var options = el('prompt-options'); options.replaceChildren();
      task.options.forEach(function (option, i) {
        var label = V.node('label', undefined, 'answer'), radio = V.node('input'), text = V.node('span', option[1]);
        radio.type = 'radio'; radio.name = 'prompt-answer'; radio.value = option[0]; radio.id = 'answer-' + i; label.htmlFor = radio.id;
        radio.addEventListener('change', clearSuccess); label.append(radio, text); options.appendChild(label);
      });
      announce(task.title + ' loaded. Holdings and history restarted. Preview ' + V.routeText(route) + ', then choose an answer.');
    });
    el('prompt-buttons').appendChild(button);
  });
  el('check-prompt').addEventListener('click', function () {
    if (!activePrompt) return;
    var selected = el('prompt-options').querySelector('input:checked');
    var result = M.checkPrompt(activePrompt, state, currentPreview, selected ? selected.value : '');
    el('prompt-result').textContent = result.message; el('prompt-result').className = result.complete ? 'success' : '';
    announce(result.message);
  });
  restart('opportunity', false);
})();
