# Design notes

*Ledger — Copyright 2026 Ashish Gulati. All rights reserved.*

Reasoning behind the interface and the analytics. Most decisions here were made against published research rather than taste, and the sources are cited where they apply.

---

## Entry

**Natural language is the default input.** Habit-formation research holds that a behaviour needing more than about two steps to initiate doesn't stick without strong motivation, and manual entry is consistently identified as the primary failure point of budgeting apps — most people abandon manual tracking within two to four weeks. A four-field form per expense is that failure mode. So the default is one text box that parses amount, category and date out of what you type.

**Repeat purchases get one tap.** Anything entered twice appears as a chip.

**The categoriser only learns from confirmed choices.** Seed keywords give a cold start; every manual correction adds weighted votes for the words in that description, at three times the weight of a seed. Learning from its own guesses would reinforce its own mistakes.

**Typos are caught at entry, not in review.** Outlier detection also runs in the analysis views, but by then a mistyped extra zero has already skewed the median, the variance bridge, the concentration curve and the recurring amounts it feeds. The entry-time threshold is deliberately stricter than the review-time one — 3.5 MAD against 2.5 — because a false alarm here interrupts every single entry, whereas a false alarm in a list is just a row you skip.

## Layout

**Controls sit low.** Steven Hoober's research on phone handling found roughly half of use is one-handed and the large majority of interactions are thumb-driven, which established the thumb-zone model: bottom third easy, top corners awkward. Mobile dataviz guidance extends this specifically to filters and period selectors. Month selection also works by horizontal swipe, which beats a dropdown for a thumb.

**Delete uses undo, not a confirmation dialog.** NN/g is direct about this: don't spend confirmation dialogs on routine actions, because click-through fatigue makes them stop working, and prefer recovery over prevention. Deletes were already soft, so undo was nearly free. NN/g also warns against placing consequential and benign options close together, so Delete is separated from Save with clear space and a different colour. The one remaining confirmation is on resetting the categoriser — rare and genuinely irreversible, which is what dialogs are for.

**Contrast and target sizes.** WCAG 2.2 SC 2.5.8 requires 24×24 CSS px targets at AA and SC 2.5.5 requires 44×44 at AAA; Material asks for 48dp. Everything interactive has a 44px minimum. The palette measures 5.2:1 or better against card surfaces, above the 4.5:1 AA threshold for body text.

**Fewer colours in charts.** Mobile dataviz guidance is consistent that three or four colours beat a rainbow, and that hover tooltips don't exist on a phone. Bars use one hue at two intensities, the selected bar prints its own value, and tapping a bar navigates. Category dots remain as identity markers in lists, with no category sharing the selection accent — one colour meaning two things is a real source of confusion.

## Trends

**Four views behind a segmented control, not one long scroll.** Harms et al. (2015) tested four layouts for long content on smartphones and found plain scrolling performed worst of the four, with tabs, menus and collapsible sections all doing better. NN/g's dashboard research agrees from the other side: users abandon dashboards that are too dense, and the fix is a summary with drill-down.

Material Design 3 caps this: *avoid more than four tabs at once; at five or more the container becomes cramped* — and forbids the obvious workaround, *do not include a set of tabbed content within a tab*. Scrollable tabs were the other option, but those are for browsing contexts where you don't need to compare labels, which is the opposite of pivoting between analyses. So absorbing the commitments view meant consolidating to four rather than growing to seven.

**One period control per view.** Overview is range-based, Categories and Patterns are month-based, Committed is forward-looking. Previously a range selector and a month picker shared a screen meaning different things, which is a mapping problem — the relationship between a control and its effect has to be obvious.

**Answer first.** Tableau's eye-tracking work found big numbers command attention before anything else, and that in a repeating row of cards attention is strongest at the first item and falls away after it. So each view opens with the conclusion in plain words and one dominant figure, rather than four equal cards that force you to work out which matters.

## The chart

**Timeframe selector directly under the chart.** Trading-app UX guidance is specific that timeframe selectors belong adjacent to the chart module rather than in a menu, since rapid switching is the core behaviour and friction there breaks the exploration.

**Drag to read any point.** Apple Stocks updates the date and value above the chart as the pointer moves; the same here, with a crosshair and a haptic tick. This matters more on a phone than on desktop because there is no hover. Built on pointer events, so it also works with a mouse in the read-only viewer.

**Buckets adapt to range** — daily up to three months, weekly to a year, monthly for all time. 365 daily points across a 340px chart is noise, not detail.

**Gesture conflict.** Charting guidance flags this directly: avoid blocking gestures. The page-level swipe handler ignores any touch starting inside the chart, and the chart sets `touch-action: none` so the page doesn't scroll under a drag.

## Statistics

**Medians, not means.** Spending is strongly right-skewed — a few large days drag the average well above what a normal day looks like. Typical-day figures use the median with the mean shown beside it, so the gap between them is visible instead of misleading. Quartiles show the spread.

**Outliers by median ± 2.5 × MAD on the log of the amount**, following Leys et al. (2013), rather than mean ± SD. Spending amounts are roughly lognormal, so a ₹40 coffee and a ₹400 dinner sit on one scale only after taking logs; on raw amounts nearly every large purchase looked unusual. MAD is multiplied by 1.4826 so it estimates a standard deviation — without that constant the threshold is about a third too tight. The reason is specific: the mean and standard deviation are themselves distorted by the outliers being hunted, so that rule routinely misses obvious ones. MAD has a 50% breakdown point. Transactions are compared against their own category's history — a large coffee is unusual, a large dinner may not be — falling back to all spending for categories with too little history to have a norm. Fixed-cost categories are never flagged: rent being large is the point of rent.

**Concentration is measured, not assumed.** The 80/20 rule is quoted far more often than it holds; Byron Sharp's work puts the real ratio nearer 50/20 in consumer data. So the app reports the actual curve — how many transactions carry half a month, and what share the top fifth hold — rather than asserting a rule.

**Variance bridge.** Month-over-month change is decomposed into the categories that caused it. Standard waterfall practice: order by absolute impact, fold minor drivers into "Other" (a bridge with seventeen tiny bars explains nothing), neutral colour for start and end totals, directional colour for movements.

**Small multiples.** Category drift uses six panels at constant scale, following Tufte's argument for the form: constant axes across many small panels let differences surface at a glance where a combined chart would bury them.

**Data quality is stated, not hidden.** The calendar heatmap shows days with no entry at all. If logging was missed, every figure is a floor rather than a total, and the app says so.

## Projections

Forward-looking figures are easy to make confidently wrong. Four rules:

- **Complete months only.** The current month is partial; including it drags typical spending down and inflates the projection.
- **Median, not mean.** One heavy month should not set a year's forecast.
- **A range, not a point.** The best and worst recent months bound the estimate, drawn as a band. A single number implies precision that three months of data cannot support.
- **Months with no entries are dropped**, not counted as zero spending.

Below three complete months the app says so and asks for the figure to be read as a shape rather than a number. Projections are plain accumulation — any investment return is explicitly not modelled, because picking a rate would mean inventing one.

**Only commitments are forecast.** Recurring detection knows what is due and roughly when. Discretionary spending is a decision made daily, not a schedule, so it is estimated separately from the recent run rate and shown beside — never blended into one number that would imply more certainty than exists.

## Income and transfers

A category can be marked **Transfer, not spending**. A deposit into a recurring deposit is money *moved*, not money *gone*.

Two quantities are easy to conflate:

- **saved** — income not spent. A transfer into savings counts here; it *is* saving.
- **left in account** — cash still unallocated. The transfer has gone, so it does not.

Savings rate must use the first. Using the second would reduce your savings rate every time you invested, which is exactly backwards. Both figures appear separately, and the rate is identical whether or not an investment is logged.

Income is take-home rather than gross. Tax and deductions never reach the account, so counting them would flatter the savings rate and make safe-to-spend wrong.

## Commitments

Detection groups entries by a two-token description signature, takes the median gap between them, and matches it against weekly / fortnightly / monthly / quarterly / half-yearly / yearly with per-cadence tolerance and an amount coefficient of variation at or below 0.45.

Two refinements came from real use. A median gap alone let a near-daily habit with a few skipped days pass as weekly, so the gaps must also be regular — coefficient of variation at or below 0.35, or 80% of gaps within tolerance — and shorter cadences need more evidence: five occurrences for weekly, four for fortnightly, three for monthly. In the other direction, rent was missed because two payments are not three, so a fixed-cost category needs only two monthly occurrences. The forecast amount is the latest payment for fixed costs (rent changes in steps, and the last step is the current one) and the median of the last three otherwise.

**The annual total is the headline.** This category of tool exists because of a perception gap — surveys find people underestimate their subscription spending by roughly 2.5×. Monthly figures are easy to wave away; annual ones are not.

**Price rises are flagged.** Recent occurrences are compared against earlier ones; anything past 8% is reported with the step, the date it changed, and the annual impact. A quiet increase per charge is invisible and material over a year.

**Commitments can be added by hand.** Detection needs history, so a new rent agreement or an annual premium paid once is invisible to it. A hand-added commitment joins the same list at full confidence and feeds the allowance and forward view exactly like a detected one. A logged payment is matched to it by description, or by category at an amount within 15%, which marks that payment as committed and moves the due date on — so it is set aside once, not twice. Monthly dates step by calendar month from the original date rather than by 30 days, so the 1st stays the 1st. If a hand-added commitment covers the same payments as a detected one, the detected one is dropped.

**Lapsed items ask rather than assert.** The app cannot distinguish a cancelled service from one that simply stopped being logged, and both are worth attention.

## Daily allowance

Version 1.1 adds a daily figure on the Add screen. It is the feature most likely to backfire, so the design follows the research closely.

**The trap.** A study reported by the Behavioral Economics Institute found that showing people a precise remaining budget made them spend *more*, not less, and most of all late in the period, when the remaining figure looks like permission. The mitigations that worked were rolling budgets, ranges rather than single numbers, a buffer, shorter windows, and updating mid-period. Splitting money into many small budgets made things worse — which is the second reason, after it being declined earlier, that there are no per-category budgets.

**What follows from that:**

- **Daily, not monthly.** A short window, updated every time you save.
- **A range.** A target (with the savings goal set aside) and a ceiling (without it). Landing between the two is "stretching", not failing.
- **Asymmetric rollover.** The allowance is the lower of the steady rate — money for the month spread over its days — and the rolling rate — money left spread over the days left. Overspending lowers the days that follow, so it gets absorbed. Underspending does not raise them: a pure rolling allowance climbed to several times the steady rate by month-end in testing, which is exactly the late-period permission the study warns about. The surplus is reported as money ahead of plan instead.
- **Fixed costs come off first.** Rent and bills are set aside before anything is divided by days, including ones detected as due but not yet paid, so the first of the month doesn't show a huge allowance that collapses when rent clears.
- **Savings goal defaults to 20%**, and the first month is prorated from the first logged day.

Without income the card falls back to today against a typical day, which needs no setup.

## Coverage

The first real backup exposed a class of bug that synthetic data never produces: **the month you start logging is partial**. Treated as a complete month it looks like the cheapest month on record, so every comparison against it shows a huge increase, savings for months before you started read as 100%, and projections drift down. The app now finds the first logged day and treats a month as complete only when at least 90% of its days fall after it. Partial months are excluded from comparisons and projections and the views say why, rather than going silent.

The same applies inside a month: **the current month is compared with the same number of days of the previous one**. "₹X so far, 12% less than the same 24 days of last month" is a fair comparison; against all thirty days of last month, every month in progress looks like a saving.

## Logging habits

**No streak counter.** Silverman and Barasch (Journal of Consumer Research, 2023) found that a broken streak makes people more likely to abandon the behaviour altogether — the streak becomes the goal and losing it removes the reason to continue. Logging dots show "logged on 5 of the last 7 days", which a missed day dents rather than resets, and a one-line prompt offers to add yesterday when it has nothing.

**No reminders.** Scheduled local notifications would need the Notification Triggers API, which never shipped in Chrome. A push server would break the no-backend design. The in-app recap is the substitute.

**Time-aware chips.** Repeat chips are ranked by how often an item is logged near the current hour, then recency, then frequency, and pre-fill your usual (median) amount — leave the amount off and "Save · ₹90 usual" says what will be recorded.

## Payments

A survey of Indian UPI users (arXiv 2401.09937) found 74% reported spending more since adopting UPI and around 60% reported overspending, attributing it to the payment feeling less real than cash. So the app records the method — optional, parsed from the text, the last one remembered — and shows the split over 90 days. No judgement is attached to it; the point is to make the split visible.

## Appearance

**Light mode exists, and Auto is the default.** NN/g's review of the research finds that for people with normal vision, dark text on a light background gives better reading performance, and that the right default is to follow the system setting. The app was dark-only. Theme is now Auto, Light or Dark, with four accent colours, all tokens checked against WCAG AA in both themes — the lowest pair measures 4.99:1.

Chart colours are resolved from the active tokens at render time rather than written as `var()` inside SVG attributes, which browsers handle inconsistently.

**Category icons.** The same UPI study found 41% of respondents wanted icons in spending summaries; transaction rows now carry an icon per category, with a monogram for custom categories.

---

## Read-only laptop viewer

Deliberately read-only. IndexedDB is per-device, so a writable second copy would have no sync between the two — edit on both and the next import silently discards one side, because merge is last-write-wins on `updated_at` with no way to know which edit was intended. A viewer that never writes cannot diverge.

---

## Audit

ESLint 9 with correctness and security rules, a 152-assertion property suite, and static passes for XSS, prototype pollution and uncleaned resources.

**Fixed:**

- **Thousands separator parsed as a decimal point.** The entry parser converted `,` to `.` for European decimal commas, so `rs 2,500` parsed as 2.5. Indian formatting uses commas as thousands separators. Silent corruption of this kind poisons every downstream statistic with nothing on screen to indicate it. Commas are now stripped, never reinterpreted.
- **`<` emitted raw into SVG.** A chart bucket label reached `<text>` unescaped, producing invalid markup.
- **Eleven maps inheriting from `Object.prototype`.** Maps keyed by user-supplied strings meant a category named `constructor` resolved to a function, and assigning to a `__proto__` key was silently ignored. All now use `Object.create(null)`, verified by rendering every view with entries named `__proto__` and `constructor`.
- **Pointer capture never released** after a chart scrub.
- **A local shadowing the global `live()` accessor** inside the edit sheet.
- **Dead code** left over when the interactive chart replaced two earlier trend panels.
- **Recurring detection recomputed seven times per render.** O(n log n) with tokenisation over every entry. Now memoised against a version counter that every mutation bumps.

**Fixed in 1.1, found by running against a real backup:**

- **Partial first month** treated as complete (see Coverage), producing a four-digit percentage headline and 100% savings for months before logging began.
- **Missing 1.4826 constant** in the MAD threshold, which together with the next item flagged about a quarter of all transactions as unusual.
- **Rent flagged as unusual** and **missed as recurring** (two occurrences); a near-daily item detected as weekly.
- **Repeat chips used the mean**, so one large lunch set the default amount for every lunch after it.
- **The category map was rebuilt as a plain object** in three places after the earlier prototype-pollution fix. All rebuilds now go through one function.

**Reviewed and left alone:** eleven `require-atomic-updates` warnings on the save path, all false positives. The re-entrancy guard is sound because the check and the set are separated by no `await` — JavaScript cannot interleave another invocation into synchronous code — and the flag releases in a `finally`. Verified by firing concurrent calls and asserting a single row is written.

**Property suite:** quantile and MAD against hand-computed values; `addDays`/`daysBetween` proven inverse across 400 days, month ends, year ends, and both leap and non-leap February; Indian lakh grouping; and invariants on generated data — daily totals sum to the month, bridge steps sum to the net change, the concentration curve is monotonic and terminates at exactly 1.0, size buckets reconcile to total and count, week buckets tile with no gaps, cumulative series never decrease, and compare series align across all twenty range × metric combinations. Every analytic also runs against empty data and against a single entry.

---

## Sources

- Nielsen Norman Group — [confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/), [proximity of consequential options](https://www.nngroup.com/articles/proximity-consequential-options/)
- Smashing Magazine — [the thumb zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- W3C — [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Material Design 3 — [tabs](https://m3.material.io/components/tabs/guidelines)
- Harms et al. (2015), on layout strategies for long content on smartphones
- Leys et al. (2013), on median absolute deviation for outlier detection
- Behavioral Economics Institute — [The Budgeting App Trap: when spending information backfires](https://www.behavioraleconomics.com/the-budgeting-app-trap-when-spending-information-backfires/)
- Nielsen Norman Group — [dark mode vs. light mode](https://www.nngroup.com/articles/dark-mode/)
- [From Cash to Cashless: UPI's impact on spending behavior among Indian users](https://arxiv.org/abs/2401.09937) (arXiv 2401.09937)
- Silverman & Barasch (2023), [On or Off Track: How (Broken) Streaks Affect Consumer Decisions](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions), *Journal of Consumer Research*
- [arXiv cond-mat/0201195](https://arxiv.org/abs/cond-mat/0201195), on the lognormal shape of personal expenditure
