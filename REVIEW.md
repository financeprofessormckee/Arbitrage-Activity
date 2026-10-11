# Detailed review: ambitious trading-lab alternative

Reviewed 11 October 2026 against upstream `63200a1978c3666c94aec1b547b472a4c82a4366`. This branch targets the original `main`, independently of the conservative proposal. It includes the conservative correctness fixes. Choose one alternative rather than merging both wholesale.

## Findings and design response

| Finding | Evidence / implication | Change |
| --- | --- | --- |
| A self-check can certify the wrong amount | The live gain exercise accepts a preview of 50 grain, then explains a 100-to-120 conversion. | Require exactly 100 grain for the four fixed exercises; free trading still accepts arbitrary valid amounts. |
| Balance alone cannot identify stale evidence | A neutral trade changes history without changing balance. The UI invalidates correctly, but the model previously accepted the old preview. | Record and validate history length too. |
| The first meaningful action is far down the page | A long review notice and ten quote rows precede the controls. | Lead with the learning objective and holdings, then a desktop trade/market workspace. Stack it on smaller screens. Put source/review details in educator notes. |
| Students must translate a long quote table into their route | Direction matters, especially for the reversed loss. | Add an accessible rate matrix with directed route highlighting; keep the full ten-pair table in a disclosure. Add quotes between route nodes. |
| A dense prose preview makes the result hard to scan | Amount returned, multiplier, gain, and final balance compete in one paragraph. | Add a return/multiplier/percentage panel and rate-product expression alongside the complete original conversion table and prose. |
| Changing scenario destroys the comparison baseline | Scenario resets are intentional, but make controlled comparisons laborious. | Add an explicitly hypothetical comparison of the same route and amount in all three markets plus its reverse. It does not switch scenarios, reset holdings, or execute. |
| The best-loop answer hides the shape of the opportunity set | Opportunity has 15 profitable, 34 neutral, and 15 losing routes. All 64 are neutral in consistent/corrected markets. | Add an optional exhaustive explorer with filters, outcome counts, deterministic ordering, and a load-only route action. No automatic reveal on startup. |
| Self-check questions are remote from the trading form | Repeated page traversal interrupts the reasoning task. | Preview and inspect evidence beside the question. Expose active exercise state and specific missing-answer feedback. |
| Reversing a full route is awkward | Occupied options are disabled, so users must remove stops to reorder. | Add a reverse-route shortcut that preserves valid goods and invalidates the preview. |
| Executed evidence disappears on reset or reload | No persistence is intentionally provided. | Offer a local CSV download of actual trade history, retaining full numeric precision. Explicitly state what clears history. |

## Preserved intent and boundaries

The five goods, three fixed scenarios, ten reciprocal pairs, 64 routes, opening 100 grain, atomic loops, immediate retrading, deterministic best-loop tie break, unlimited liquidity, no fees, no price impact, and one-billion-grain cap remain unchanged. Quotes never converge because of a trade. Comparisons display an explanatory error if a hypothetical resulting balance would exceed the numerical cap.

No changing rounds, endogenous price adjustment, speculative bets, scores, multiplayer, analytics, services, or persistence are added. All assets and classic scripts remain local and work through `file://`; no application build is required. The WT masthead, original seal, maroon palette, source attribution, and MIT/license boundaries are retained. This is a proposed adaptation, not an institutional endorsement or teaching-release certification.

## Validation

- `node tests/model-tests.cjs`: **25,361 assertions pass**. Independent rational enumeration covers all routes in all markets. Added checks cover exact-amount evidence, stale neutral trades, and CSV content/precision/immutability.
- `node tests/dom-tests.cjs` with jsdom 30.1.2: **82 checks pass**, loading the actual HTML/scripts. Covers controls, focus targets, errors, invalidation, all self-checks, ARIA reference targets, matrix direction, four comparison results, all 64 routes, filters, empty results, loading without trading, and export availability. No script/resource errors observed. DOM checks do not measure visual layout or prove assistive-technology behavior.
- JavaScript syntax checks and `git diff --check` pass.
- The original amount-mismatch defect was reproduced in the live browser.
- `tests/browser-tests.cjs` supplies actual browser workflows, CSV download verification, and 320/375/640/1280px overflow checks. The environment denied local Chromium socket creation; the browser suite and proposed-layout screenshots remain **unverified**. Run before merge.
- No formal WCAG audit, screen-reader trial, cross-browser certification, or classroom evaluation is claimed.

## Review considerations

The interface is intentionally more ambitious than the conservative branch. Review the density of the rate matrix and whether exhaustive route exploration belongs in the intended class exercise. Both extra analyses are optional and clearly distinguished from executed trades. The original `DESIGN.md` is retained as a historical source brief rather than rewritten to imply these additions came from Friedman.
