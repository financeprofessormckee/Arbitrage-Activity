# Arbitrage — browser specification (v1)

- **Decided:** 2026-10-02 by Eric McKee; David Friedman's review is invited.
- **Reference:** proposal 15, recorded in DESIGN.md. The live source was unavailable during planning. Fresh browser code; no legacy import.

## Objective and selected adaptations

Discover inconsistent exchange rates by multiplying the quotes around a closed loop. Five goods and ten reciprocal pairs retain the source's setting. Static scenarios and immediate retrading at locked quotes are Eric's selected adaptations, replacing the source's changing prices and opening-inventory turn restriction. The player is small and does not move prices. Market impact, delayed trades, changing rounds, fees, multiplayer, persistence, services, and analytics are excluded. Hansa remains last in the initial seven-activity queue.

## Model

Goods, in tie-breaking order: grain, cloth, copper, tea, salt. Consistent reference values are [1, 2, 4, 5, 10]. Quote i→j gives units of j received per unit of i surrendered and equals value[i]/value[j]. All reverse quotes are reciprocals. Consistent rates and Corrected rates use this matrix. Arbitrage opportunity (default) changes grain→tea from 0.2 to 0.24 and tea→grain to 1/0.24. Corrected rates illustrate restoring consistency; executing trades never corrects quotes.

Start with 100 grain. A route begins/ends in grain and contains one to four distinct intermediate goods. There are 64 valid routes. Native selectors with Add/Remove last stop preserve this constraint. Initial route: grain→tea→copper→grain. Enter any finite positive amount ≤ holdings (no denomination or step restriction), or Use all holdings. Preview each conversion, product m, returned grain = amount×m, profit = returned−amount, and balance = holdings−amount+returned. Execute applies the full loop atomically and records route/amount/product/return/balance; intermediate goods are held only within that action. Losing and neutral trades are allowed.

Use full double precision internally, never rounded quotes. Classify m>1+1e−9 as profitable, m<1−1e−9 as losing, otherwise neutral; the tolerance classifies and does not change cashflows. Display amounts/rates with up to six fractional digits, scientific notation for nonzero amounts below 0.000001, and enough explanatory precision to avoid presenting a tiny gain as a proven zero. Reject blanks, nonfinite/nonpositive/over-budget amounts, malformed routes, and nonfinite or >1,000,000,000 resulting holdings. Invalid actions retain balances/history and associate errors with controls; focus the first error on submission. Subnormal amounts whose leg conversions underflow to zero are rejected rather than silently destroying holdings.

Preview is an explicit action. Input changes invalidate it and disable Execute until a new valid preview. Execution invalidates the preview, keeps the route, and sets the amount to min(previous amount, remaining holdings). Use all holdings copies the exact balance. Scenario changes restart holdings/history, restore the initial route/100 amount, and clear prompts. Restart does the same while retaining the scenario. Summary shows holdings, cumulative profit relative to 100 grain, and final/initial ratio. No arbitrary turn limit or score leaderboard.

Reveal best loop enumerates all 64 routes and ranks multiplier (ties within 1e−9), then fewer legs, then lexicographic goods order. It explains each conversion for the entered amount without executing or replacing the student's route. In a consistent scenario it reports no profitable loop. Unlimited liquidity, no fees, and static inconsistent quotes permit repeated profits; this is an idealized arbitrage lesson, not a model of real market execution or convergence.

## Teaching checks and interface

Four optional prompts load exact scenario/route/100 amount: (1) Consistent rates, grain→cloth→grain, m=1; (2) Opportunity, grain→tea→copper→grain, m=1.2; (3) Opportunity, grain→copper→tea→grain, m=5/6; (4) Corrected rates, grain→tea→copper→grain, m=1. Require a valid preview in the loaded scenario/route plus the correct conceptual answer. These are preview exercises; executing a trade invalidates the evidence until previewed again. Parameter/route/amount/answer edits clear success. Prompt 4 compares its product to the former opportunity's 1.2 and explains that quote correction was imposed, not caused by trades. Reveal remains optional.

Local classic scripts js/model.js, js/view.js, js/app.js separate math, rendering, and controls. ArbitrageModel exposes goods/scenarios, state creation, validation, preview/execution, enumeration/best loop, and prompt checking in browsers/CommonJS; no public network API or save schema. Keep WT masthead/assets and contributor credits local. Quote table shows ten pairs in both directions; route diagram uses labelled goods/arrows; conversion and history tables plus textual summaries convey every visual value.

Native controls support the complete keyboard/single-pointer workflow. Preserve focus on ordinary actions; focus added/remaining route selectors after structural edits. Use skip navigation, associated errors, deliberate polite status messages, visible unobscured focus, ≥44px controls, labelled keyboard-focusable table scrollers, 320px reflow, and reduced-motion CSS. No dragging/playback. Functional checks do not certify conformance.

## Verification and freeze

Independently check all products/reciprocals/64 routes, 20% gain, reverse loss, corrected neutrality, partial/repeated trading and histories, best-loop ties, invalid inputs/underflow/numerical limits, immutability, resets, and all prompts. Browser checks cover keyboard workflows, preview invalidation, associated errors/focus, route editing/reveal/history/prompts, file/HTTP agreement, desktop/mobile screenshots, all seven pages at 1280/640/375/320px, links/assets/Parsing, contrast, and handoff limits. Evidence and limitations belong in VERIFICATION.md (in the authoring collection).

Commit/push privately and freeze verified v1 for David's review. Existing five activities remain frozen. Before teaching release, incorporate review and complete WCAG 2.2/2.1 AA audit including Parsing, ACCESSIBILITY.md, and Accessibility Conformance Report.docx; screen-reader/classroom evaluation and release terms remain pending. No public publishing, deployment, outreach, or license selection in this task.

## Proposed trading-lab revision · 2026-10-11

The original model above is retained. Additions are teaching-interface adaptations:

- Self-check previews require exactly 100 grain and matching trade-history length;
  missing answers have specific feedback. Local previews remain synchronized with
  the trade preview and are cleared by edits. Free trading remains unrestricted
  within the original numerical limits.
- Reverse route changes the selected stops only and requires a fresh preview.
- A directional matrix and route quote labels supplement the original table.
  Return cards and a rounded rate-product expression supplement the full conversion
  table. A neutral percentage is displayed as approximately zero under the existing
  multiplier tolerance.
- After a valid preview, an optional comparison uses the same route, amount, and
  current opening balance with each scenario's quotes and the current market's
  reversed route. It never mutates state. Numerical-limit failures are explicit.
- The optional route explorer enumerates all 64 loops, shows their outcome counts,
  and filters by classification. Within each outcome, shorter routes precede the
  goods-order tie break. Return figures use a clearly labeled hypothetical 100 grain.
  Loading a route changes the plan, invalidates evidence, and focuses Preview; it
  does not exchange grain. Input/scenario changes hide outdated analysis panels.
- Trade-history CSV is a user-initiated local download, with scenario, route, loop
  number, amount, multiplier, return, profit, and before/after balances. Values retain
  full calculation precision. There is still no persistence or network service.

These are proposals for review. Historical freeze/release statements above describe
v1 and do not certify this alternative for release. See REVIEW.md for known limits.
