'use strict';
// Install Playwright separately; the activity itself has no runtime dependencies.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
  let checks = 0;
  const ok = (value, message) => { checks++; assert.ok(value, message); };
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const target = process.env.TEST_URL || pathToFileURL(path.resolve(__dirname, '../index.html')).href;
  try {
    await page.goto(target);
    await page.locator('#preview').click();
    ok((await page.locator('#preview-summary').innerText()).includes('120'), 'Default preview returns 120 grain');
    await page.locator('#execute').click();
    ok((await page.locator('#balance').innerText()).includes('120'), 'Execution updates holdings');
    ok(await page.locator('#execute').isDisabled(), 'Execution invalidates preview');
    await page.locator('#reverse-route').click();
    await page.locator('#preview').click();
    ok((await page.locator('#preview-summary').innerText()).includes('Losing'), 'Reversed loop loses');
    await page.locator('#amount').fill('121');
    ok(await page.locator('#execute').isDisabled(), 'Editing amount invalidates preview');
    await page.locator('#preview').click();
    ok(await page.locator('#amount').evaluate(n=>n === document.activeElement), 'Invalid amount receives focus');
    ok(await page.locator('#amount').getAttribute('aria-invalid') === 'true', 'Invalid amount is associated with feedback');
    ok(await page.locator('#history-table tbody tr').count() === 1, 'Invalid action preserves history');
    await page.locator('#restart').click();
    await page.locator('#add-stop').click(); await page.locator('#add-stop').click();
    ok(await page.locator('#add-stop').isDisabled(), 'Route caps at four stops');
    await page.locator('#reverse-route').click();
    const stops = await page.locator('#route-selectors select').evaluateAll(ns=>ns.map(n=>n.value));
    ok(new Set(stops).size === 4 && stops.join(',') === '4,1,2,3', 'Reverse preserves distinct stops');
    await page.locator('#prompt-gain').click();
    ok(await page.locator('#prompt-gain').getAttribute('aria-pressed') === 'true', 'Active prompt is exposed');
    await page.locator('#amount').fill('50'); await page.locator('#preview-prompt').click();
    await page.locator('input[value="inconsistent"]').check(); await page.locator('#check-prompt').click();
    ok((await page.locator('#prompt-result').innerText()).includes('exactly 100'), 'Wrong-amount exercise cannot pass');
    const answers = {consistent:'reciprocal', gain:'inconsistent', reverse:'inverse', corrected:'correction'};
    for (const [id, answer] of Object.entries(answers)) {
      await page.locator('#prompt-'+id).click(); await page.locator('#preview-prompt').click();
      await page.locator('#check-prompt').click();
      ok((await page.locator('#prompt-result').innerText()).includes('Choose an answer'), 'Missing answer is explained');
      await page.locator('input[value="'+answer+'"]').check(); await page.locator('#check-prompt').click();
      ok((await page.locator('#prompt-result').innerText()).includes('Self-check complete'), 'Exercise '+id+' passes');
      await page.locator('#amount').fill('50');
      ok((await page.locator('#prompt-result').innerText()) === '', 'Edit clears success');
      ok(!(await page.locator('#prompt-preview-summary').innerText()).includes('multiplier'), 'Edit clears nearby preview evidence');
    }
    await page.locator('#scenario').selectOption('opportunity');
    await page.locator('#reveal').click();
    ok((await page.locator('#reveal-summary').innerText()).includes('64 routes'), 'Reveal enumerates all routes');
    ok((await page.locator('#balance').innerText()).startsWith('100'), 'Reveal does not trade');
    await page.locator('#preview').click();
    for (const width of [1280, 640, 375, 320]) {
      await page.setViewportSize({width,height:900});
      ok(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth), 'No document overflow at '+width+'px');
      if (process.env.ARTIFACT_DIR) {
        fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});
        await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,'activity-'+width+'.png'),fullPage:true});
      }
    }
    ok(errors.length === 0, 'No uncaught browser errors: '+errors.join('; '));
    console.log(JSON.stringify({checks,failures:0,target}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
