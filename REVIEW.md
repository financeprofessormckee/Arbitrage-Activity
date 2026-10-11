# Detailed review: conservative alternative

Reviewed 11 October 2026 against upstream `63200a1978c3666c94aec1b547b472a4c82a4366`. This is a proposed change, not a teaching-release certification. The deployed HTML matched that commit during review.

## Findings

| Priority | Finding and evidence | Proposed treatment |
| --- | --- | --- |
| Medium | The gain self-check accepts a 50-grain preview, then announces that 100 grain became 120. Reproduced in the live browser and model. All four tasks describe a fixed 100-grain exercise. | Require exactly 100 grain in self-check evidence; preserve arbitrary positive amounts in free exploration. |
| Low | `checkPrompt` identifies stale evidence using balance alone. Executing a neutral trade leaves balance unchanged, so the model accepts an older preview. The UI already invalidated it correctly. | Also record and compare history length; test fresh evidence after a neutral trade. |
| Low | Loading a self-check leaves its question below the trading form, with no preview action nearby. Students must repeatedly traverse the page. | Add a local preview button and synchronized evidence summary. Changes invalidate both summaries. |
| Low | Reversing a route requires selecting temporary goods or deleting stops because occupied options are disabled. Four-stop routes cannot be reordered directly. | Add one explicit reverse-route action; preserve uniqueness and invalidate the preview. |
| Low | Active self-check selection is neither visually distinguished nor exposed as a pressed button. Missing answers receive the same conceptual-error message as incorrect answers. | Add `aria-pressed` and specific missing-answer feedback. |
| Opportunity | Ten market rows and a lengthy introductory section precede the first trade. Useful documentation competes with the learning workflow. | Add direct activity navigation here; reserve structural redesign for the ambitious alternative. |

## What is already sound

- All 64 distinct routes, reciprocal quotes, the 1.2 gain, its 5/6 reverse, and both consistent scenarios agree with independent rational calculations in the existing tests.
- Execution is atomic, revalidates inputs, preserves unused grain, and leaves quotes unchanged. Losing and neutral loops are intentionally allowed.
- Clear model boundaries distinguish arbitrage from speculation and externally corrected quotes from endogenous convergence.
- Native controls, associated errors, focus handling after execution and structural edits, table alternatives, local assets, and reduced-motion support form a strong base.
- No network services, analytics, persistence, runtime dependencies, or build step are needed.

## Scope

The fixed-quote model, goods, scenarios, starting route, 100-grain opening balance, one-billion-grain cap, institution branding, license, and attribution are retained. No fees, random shocks, market impact, or changing-round assumptions are introduced. `DESIGN.md` remains a historical record of the original source brief.

## Verification

- `node tests/model-tests.cjs`: **25,353 assertions pass**, including 28 new regression assertions for wrong amounts, neutral-trade staleness, fresh evidence, and missing answers.
- `node tests/dom-tests.cjs` with jsdom 30.1.2: **62 integration checks pass**, loading actual HTML/scripts. Covers route editing, error association/focus, preview invalidation, all self-checks, nearby evidence synchronization, unique IDs, ARIA references, and non-mutating reveal. No script/resource errors observed. DOM checks do not measure layout or prove screen-reader behavior.
- JavaScript syntax checks pass.
- The live browser reproduction confirmed the original 50-grain self-check bug.
- `tests/browser-tests.cjs` supplies repeatable functional, focus, invalidation, and 320/375/640/1280px reflow checks. It requires a separate Playwright installation. This environment prevented a local Chromium launch (socket creation denied), so this browser suite and proposed-layout screenshots have **not** been verified here.
- No claim of WCAG conformance, screen-reader testing, or classroom evaluation is made.

## Acceptance before merge

Run the browser suite on a machine with Chromium, inspect desktop/mobile layouts, and review the proposed interaction changes. This PR and the ambitious alternative both target the original `main`; choose one rather than merging both wholesale.
