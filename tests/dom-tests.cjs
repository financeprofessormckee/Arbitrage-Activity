'use strict';
// Integration tests without a browser. Install jsdom 30.1.2 as a development tool.
const assert = require('node:assert/strict');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
(async () => {
  const errors = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = await JSDOM.fromFile(path.resolve(__dirname, '../index.html'), {runScripts:'dangerously', resources:'usable', virtualConsole});
  const w = dom.window, d = w.document;
  try {
    if (d.readyState !== 'complete') await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
    let checks = 0;
    const ok = (value,message) => {checks++;assert.ok(value,message);};
    const el = id=>d.getElementById(id), click=id=>el(id).click(), text=id=>el(id).textContent;
    const input = (id,value,type='input')=>{el(id).value=value;el(id).dispatchEvent(new w.Event(type,{bubbles:true}));};
    const rows = id=>el(id).tBodies[0].rows.length;
    const stateSnapshot = ()=>[text('balance'),text('profit'),text('ratio'),el('history-table').textContent].join('|');
    const ids = [...d.querySelectorAll('[id]')].map(n=>n.id);
    ok(ids.length === new Set(ids).size,'All element IDs are unique');
    for(const n of d.querySelectorAll('[aria-labelledby],[aria-describedby]')) {
      for(const id of (n.getAttribute('aria-labelledby')||n.getAttribute('aria-describedby')).split(/\s+/)) ok(!!el(id),'ARIA target exists: '+id);
    }
    ok(rows('quotes-table')===10,'All ten reciprocal pairs render');
    click('preview');ok(text('preview-summary').includes('120 grain'),'Default preview returns 120');
    click('execute');ok(text('balance').startsWith('120'),'Execute changes holdings once');
    ok(el('execute').disabled,'Execute invalidates preview');
    ok(d.activeElement===el('preview'),'Focus returns to usable preview control');
    click('reverse-route');click('preview');ok(text('preview-summary').includes('Losing'),'Reversing the route loses');
    input('amount','121');ok(el('execute').disabled,'Amount edits invalidate preview');
    const before=stateSnapshot();click('preview');
    ok(el('amount').getAttribute('aria-invalid')==='true','Budget error is associated with amount');
    ok(d.activeElement===el('amount'),'Invalid amount receives focus');
    ok(before===stateSnapshot(),'Invalid actions preserve results and history');
    click('restart');click('add-stop');click('add-stop');
    ok(el('add-stop').disabled,'Four-stop maximum enforced');
    ok(d.activeElement===el('stop-4'),'New stop receives focus');
    click('reverse-route');
    ok([...d.querySelectorAll('#route-selectors select')].map(n=>n.value).join(',')==='4,1,2,3','Four-stop route reverses without duplicate goods');
    click('remove-stop');ok(d.activeElement===el('stop-3'),'Remaining stop receives focus');
    click('prompt-gain');input('amount','50');click('preview-prompt');
    d.querySelector('input[value="inconsistent"]').click();click('check-prompt');
    ok(text('prompt-result').includes('exactly 100'),'Wrong-amount self-check is rejected');
    const answers={consistent:'reciprocal',gain:'inconsistent',reverse:'inverse',corrected:'correction'};
    for(const [id,answer] of Object.entries(answers)) {
      click('prompt-'+id);ok(el('prompt-'+id).getAttribute('aria-pressed')==='true','Selected exercise is exposed');
      click('preview-prompt');ok(text('prompt-preview-summary')===text('preview-summary'),'Local evidence agrees with trading preview');
      click('check-prompt');ok(text('prompt-result').includes('Choose an answer'),'Missing answer gives specific feedback');
      d.querySelector('input[value="'+answer+'"]').click();click('check-prompt');
      ok(text('prompt-result').startsWith('Self-check complete.'),'Self-check '+id+' completes');
      input('amount','50');ok(text('prompt-result')==='','Edits clear success');
      ok(!text('prompt-preview-summary').includes('multiplier'),'Edits clear local evidence');
    }
    input('scenario','opportunity','change');
    ok(el('prompt-panel').hidden,'Scenario change clears active prompt');
    const initial=stateSnapshot();click('reveal');
    ok(text('reveal-summary').includes('64 routes'),'Best-loop search explains its scope');
    ok(initial===stateSnapshot(),'Reveal never executes a trade');
    click('preview');
    if(el('explore-routes')) {
      ok(el('quote-matrix').querySelectorAll('td.in-route').length===3,'Matrix highlights all three directed legs');
      ok(text('rate-equation').includes('0.24 × 1.25 × 4'),'Rate expression matches the selected route');
      ok(text('result-return')==='120' && text('result-percent')==='+20%','Result card shows correct return and percentage');
      click('compare-scenarios');
      ok(rows('comparison-table')===4,'Compare includes three scenarios and reverse');
      const comparisonRows=[...el('comparison-table').tBodies[0].rows].map(tr=>[...tr.cells].map(n=>n.textContent));
      ok(comparisonRows.map(r=>r[2]).join(',')==='100,120,100,83.333333','Independent expected scenario returns');
      ok(initial===stateSnapshot(),'Comparison does not mutate trading state');
      click('explore-routes');ok(rows('explorer-table')===64,'Explorer includes every route');
      ok(text('explorer-summary').includes('15 profitable, 34 neutral, 15 losing'),'Explorer outcome counts are correct');
      input('route-filter','Profitable','change');ok(rows('explorer-table')===15,'Profitable filter shows all 15 gains');
      el('explorer-table').querySelector('button').click();
      ok(initial===stateSnapshot(),'Loading a route does not trade or reset balance');
      ok(el('execute').disabled && el('comparison-panel').hidden,'Loaded route invalidates preview and comparison');
      ok(d.activeElement===el('preview'),'Loaded route focuses preview');
      click('preview');click('execute');ok(!el('download-history').disabled,'Executed history is exportable');
      input('scenario','consistent','change');click('explore-routes');input('route-filter','Profitable','change');
      ok(rows('explorer-table')===0 && !el('explorer-empty').hidden,'Neutral market has an explicit empty profitable set');
      ok(el('download-history').disabled,'Reset disables history export');
      const losses=d.querySelectorAll('#quote-matrix td.in-route');ok(losses.length===3,'Matrix route emphasis survives scenario change');
    }
    ok(errors.length===0,'No script or resource errors: '+errors.join('; '));
    console.log(JSON.stringify({checks,failures:0,variant:el('explore-routes')?'lab':'conservative'}));
  } finally {w.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
