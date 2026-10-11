# Arbitrage

**[Click Here to Launch the Interactive Activity](https://financeprofessormckee.github.io/Arbitrage-Activity/)**

> **Status:** v1 prototype under review with David Friedman. Not yet accessibility-audited
> for teaching release.

Discover profitable locked-quote loops and how consistent rates remove the opportunity. Starting with 100 grain, students choose a route through grain, cloth, copper, tea, and salt, preview each conversion, and execute the loop at locked quotes. A reveal searches all 64 routes for the best loop without changing the student's holdings.

## Educator Guide: Classroom Integration

This activity is a browser adaptation of Proposal 15 in David Friedman's
[Living Paper](http://daviddfriedman.com/Living_Paper/living_paper.htm) catalog of teaching programs
([original program descriptions](http://daviddfriedman.com/Living_Paper/Program_Descriptions/program_descriptions.htm)).

### The Economic Model

* **Quotes:** static reciprocal exchange rates with no fees or price impact.
* **Scenarios:** inconsistent quotes (a profitable loop exists) versus corrected quotes (every loop is neutral).
* **Self-checks:** four optional prompts on consistency, a 20% gain, the reverse loss, and corrected quotes.

The full model, its adaptations from Friedman's description, and acceptance cases are in
[SPECIFICATION.md](SPECIFICATION.md). The recorded source brief is in [DESIGN.md](DESIGN.md).

### Running it locally

Open `index.html` in a browser. There's no build step, installation, or server, and
everything is local. Model tests run with Node: `node tests/model-tests.cjs`.

### License and Citation

The source code for this web application is licensed under the [MIT License](LICENSE). You
are free to use, modify, and distribute the software, consistent with the Living Paper's
request that code based on Friedman's proposals remain open source.

The economic concepts are David Friedman's. The West Texas A&M University name, seal, and
branding assets are not covered by the license and do not imply institutional endorsement
of derivative works. If you use or adapt this activity, please cite this repository.

---
*Economic concepts: [David Friedman](http://daviddfriedman.com/Living_Paper/living_paper.htm). Development: [Eric McKee](https://github.com/financeprofessormckee),
Paul and Virginia Engler College of Business, West Texas A&M University.*

## Proposed review improvements

This branch adds exact-amount self-check validation, a reverse-route shortcut,
nearby self-check previews, and active-exercise feedback. See [REVIEW.md](REVIEW.md)
for detailed findings and validation limits. The original economic assumptions remain intact.

Development checks (no application runtime dependencies):

```sh
node tests/model-tests.cjs
npm install --no-save jsdom@30.1.2 playwright
node tests/dom-tests.cjs
npx playwright install chromium
node tests/browser-tests.cjs
```

Set `TEST_URL` to test an HTTP-served copy instead of the default local file,
`ARTIFACT_DIR` to capture screenshots, or `CHROMIUM_EXECUTABLE` for an installed
Chromium. DOM checks do not replace browser reflow and screen-reader testing.
