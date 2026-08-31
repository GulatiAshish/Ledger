# Ledger — daily expense tracker

Offline-first PWA. All data stays on the phone. Zero runtime dependencies except a Google Fonts stylesheet (cached after first load; the app is fully usable without it).

---

## 1. Get it on your phone (10 minutes, one time)

The app **must** be served over HTTPS or Android won't offer a real install. GitHub Pages is free and takes five minutes.

1. Create a public repo, e.g. `ledger`.
2. Upload **all ten files**, keeping this exact layout — `fonts/` must be a real folder, not renamed files:

```
index.html                  the whole app
sw.js                       service worker (offline)
manifest.webmanifest        install config
icon-192.png                app icon
icon-512.png                app icon
icon-maskable-512.png       adaptive icon
shortcut-add.png            long-press menu
shortcut-log.png            long-press menu
shortcut-trends.png         long-press menu
fonts/archivo-var.woff2     self-hosted font
fonts/plexmono-400.woff2    self-hosted font
fonts/plexmono-600.woff2    self-hosted font
```

3. Repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / root → Save.
4. Wait ~60s. Your URL is `https://<username>.github.io/<RepoName>/` — matching your repo's capitalisation exactly.
5. Open it in **Chrome on Android** → menu (⋮) → **Install app** / *Add to Home screen*.
6. Launch from the home-screen icon (not the browser tab). Go to **More → Persistent storage → Request**. It should read *Granted*.

Step 6 matters. It's what stops Chrome from evicting your data under storage pressure. Installed PWAs almost always get it.

**Replacing an earlier version:** overwrite `index.html`, `sw.js` and `manifest.webmanifest`, and add the `fonts/` folder and three `shortcut-*.png` files. Nothing needs deleting — no file from the first version has been removed or renamed.

**Case sensitivity:** the username part of a GitHub Pages URL is case-insensitive (domains are), but **the repository name in the path is not**. A repo called `Ledger` is served only at `https://<username>.github.io/Ledger/`; the lowercase spelling 404s. Every path in this app is relative (`./index.html`, `scope: "./"`, bare filenames), so it runs correctly at any path with any casing — you just have to type the URL the way the repo is actually named.

**Redeploying:** bump `CACHE = 'ledger-v15'` to `'ledger-v16'` in `sw.js`, or the phone keeps serving the old copy. The new version appears on the *next* launch after that, not the current one — that's the deliberate trade for instant opening (see §4).

---

## 1a. Does it work offline?

Yes, completely, after one online load. Nothing in the app touches the network at runtime:

| | Where it comes from |
|---|---|
| Your expenses | IndexedDB, on the phone |
| App code | One HTML file, precached |
| Fonts | Self-hosted `.woff2`, precached (68 KB) |
| Charts | Inline SVG generated in JS |
| Categorisation | Local keyword + learned-rules table |
| Icons | Precached PNGs |

The whole install is ~152 KB. `grep -oE 'https?://' index.html` returns nothing — there is no CDN, no analytics, no font service, no API.

**Two things worth knowing:**

*The first load must be online.* You have to download the app once. After the service worker's install step completes, every later launch is served from cache. `install` uses `cache.addAll`, which is atomic — if any file 404s the install fails loudly rather than leaving you half-cached.

*Weak signal used to be worse than no signal.* The original service worker was network-first on navigation. Fully offline that's fine — `fetch` rejects fast and the cache answers. But on a flaky connection (patchy 4G, a shop-floor dead spot, a captive-portal wifi) `fetch` can hang for tens of seconds before it rejects, so the app would have opened *slower on a bad connection than with none at all*. It's now cache-first with background revalidation: it opens instantly in every network condition, and picks up a new deploy on the following launch.

You can verify it yourself: open the app, put the phone in aeroplane mode, force-close it, reopen. It should launch and record normally. **More → Offline readiness** reports whether the service worker is active.

---

## 1b. Home screen: shortcuts, not a widget

**A web app cannot create an Android home screen widget.** There is a `widgets` member in the Web App Manifest spec, but it's Microsoft's, and it targets the Windows 11 Widgets Board only. Chrome on Android doesn't implement it. No PWA on any platform can produce a home screen widget today.

**And the widget you're picturing doesn't exist natively either.** Android widgets are built from `RemoteViews`, which supports a fixed, small set of view classes — `FrameLayout`, `LinearLayout`, `RelativeLayout`, `TextView`, `Button`, `ImageButton`, `ImageView`, `ProgressBar`, `AnalogClock`, `Chronometer`, plus collection views. **`EditText` is not on that list.** Widgets that appear to have a text box — the Google Search bar is the famous one — are an `ImageView` drawn to look like a field; tapping it launches a full activity with the keyboard. Nobody types into a home screen widget, because the platform doesn't allow it.

So what you actually want — *tap something on the home screen, keyboard is up, type, done* — is a shortcut into a focused input. That's achievable today, with no native code.

**Three shortcuts are now in the manifest.** Long-press the Ledger icon and you get Add expense / Today's log / Trends. Long-press **Add expense** and drag it onto the home screen, and it becomes its own standalone icon that opens directly into the entry field. One tap from the home screen to typing.

**Plus a share target,** which is arguably better than a widget for your case. Ledger now appears in Android's share sheet. Select the text of a payment SMS or UPI notification, share it to Ledger, and it lands in the parser pre-filled:

- share `swiggy dinner 480` → ₹480, Food
- share `Paid Rs 2500 to HP petrol` → ₹2,500, Fuel

**Because you already installed the app, this needs a nudge.** Shortcuts are baked into the WebAPK at install time. Chrome re-checks the manifest roughly once a day and can take a couple of days to rebuild the app. To get them immediately: uninstall Ledger from the home screen, reload the page in Chrome, and install again. Your data is in IndexedDB keyed to the origin, not to the installed app — **but export a backup from More first anyway**, because uninstalling a PWA can clear site data on some Android versions.

If you later want a true widget — a home screen tile showing this month's total with quick-add buttons — that arrives with the native step in §7: Bubblewrap wraps this same PWA in a TWA, and you add a Kotlin `AppWidgetProvider` beside it. The widget would show numbers and buttons; tapping still opens an input. That's the ceiling on Android, not a limitation of this app.

---

## 1c. Backup and moving to a new phone

Two separate things, with very different risk.

**The app code** lives in your GitHub repo. Safe indefinitely, needs no thought.

**Your expenses** exist in one place: IndexedDB on the phone. There is no cloud copy. Until you export, the phone *is* the database.

Use **More → Back up to Drive**, not *Export*. Export writes to the phone's downloads folder, which dies with the phone — so it isn't really a backup. Back up to Drive opens Android's share sheet and pushes the file off the device entirely. Same file either way; only one of them survives losing the phone.

Recovery on a new phone:

1. Chrome → your URL → **Install app**
2. **More → Import** → pick your backup JSON
3. **More → Persistent storage → Request**

Import merges by `id` with newest-`updated_at` winning, so it is never destructive — you can safely import an old backup onto a phone that already has newer data.

The backup contains every entry (including soft-deleted ones), your categories, and the learned categoriser rules, so your trained auto-categorisation comes back too, not just the numbers. **CSV is not a backup** — only the JSON re-imports; CSV is for Excel and for loading into Postgres later.

**What actually destroys the data:**

- Losing the phone with no recent export. Everything since that export is gone.
- Clearing Chrome's *Cookies and site data*.
- Uninstalling the PWA — clears site data on some Android versions.
- Changing your **GitHub username**, or moving to a **custom domain**.

**What does not:** renaming the repo, or a difference in URL casing. An origin is scheme + host + port — the path is not part of it. Your origin is `https://<username>.github.io`, so everything under it shares one IndexedDB regardless of the path.

That last point has a security corollary: **every project site on your GitHub account shares that origin**, and any page hosted there can read this app's database. Fine for a personal account; don't host untrusted code on it.

---

## 2. Data model

IndexedDB, deliberately shaped as SQL so it ports without a migration.

```sql
CREATE TABLE expenses (
  id          TEXT PRIMARY KEY,           -- uuid v4, client-generated
  amount      REAL NOT NULL CHECK (amount > 0),
  spent_on    DATE NOT NULL,              -- local YYYY-MM-DD, never a timestamp
  category_id TEXT NOT NULL REFERENCES categories(id),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,       -- last-write-wins key for sync
  deleted_at  TIMESTAMPTZ                 -- soft delete, so deletions replicate
);
CREATE INDEX ON expenses (spent_on);
CREATE INDEX ON expenses (category_id);

CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT, color TEXT, sort INT, is_archived INT);
CREATE TABLE rules      (token TEXT PRIMARY KEY, counts JSONB);  -- learned categoriser
CREATE TABLE meta       (k TEXT PRIMARY KEY, v TEXT);
```

Two design choices worth keeping when you port this:

- **`spent_on` is a DATE, not a timestamp.** Timezone bugs in expense apps all trace back to storing `NOW()` and rendering it in a different zone. A date has no zone.
- **Soft deletes.** A hard delete can't replicate — the replica has no way to learn a row disappeared. `deleted_at` + `updated_at` gives you last-write-wins sync for free later.

---

## 3. ACID, honestly

| | How it's achieved | Strength |
|---|---|---|
| **Atomicity** | Every write goes through one IndexedDB transaction. Import writes N rows in a single tx — all land or none do. | Real |
| **Consistency** | Invariants enforced in the write path: `amount > 0`, date-format regex, unknown `category_id` coerced to `misc`. | App-layer, not engine-layer. Weaker than a Postgres `CHECK`. |
| **Isolation** | IndexedDB serialises transactions per object-store scope. Single-tab app, so contention is near-zero anyway. | Real |
| **Durability** | `durability: 'strict'` forces a flush to disk before the transaction resolves. `navigator.storage.persist()` marks the origin non-evictable. Writes never depend on connectivity. | Real, with one caveat below |

**The caveat:** clearing Chrome's site data, or uninstalling the PWA, deletes everything. Persistent storage protects against automatic eviction, not against you. **Export weekly.** The app nags you after 14 days.

Consistency is the genuinely weak leg here — there's no engine enforcing referential integrity. That's the single strongest argument for the Postgres replica in v2.

---

## 4. UX decisions and the research behind them

Each of these is a change made because of a specific published finding, not taste.

**Natural-language entry is the default.** Habit-formation research (BJ Fogg's Behavior Design Lab, cited in budgeting-app retention analyses) holds that behaviours needing more than about two steps to initiate don't stick without strong motivation — and manual entry is consistently identified as the primary failure point of budgeting apps, with most people abandoning manual tracking inside 2–4 weeks. Four form fields per expense is that failure mode. So the default is one text box: `swiggy dinner 480`, `yesterday 2000 rent`, `1.2k ola airport`, `₹250 medicine`. Amount, category and date are all parsed out. The keypad is still there as a second mode.

**"Log again" chips.** Anything you've entered twice or more appears as a one-tap chip. Repeat purchases are most of the volume, and this makes them a single tap.

**Controls sit low.** Steven Hoober's research on phone handling — roughly half of use is one-handed, and the large majority of interactions are thumb-driven — established the thumb-zone model: bottom third easy, top corners awkward. Mobile-dataviz guidance extends this specifically to filters and period selectors. The amount preview, category chip, date chip, entry field and Save button are all in the lower two-thirds. Month selection also works by **horizontal swipe**, which beats a date dropdown for a thumb.

**Delete uses undo, not a confirmation dialog.** NN/g is direct about this: don't spend confirmation dialogs on routine actions, because click-through fatigue makes them stop working, and prefer recovery over prevention. Deletes were already soft, so undo was nearly free — 6-second toast, one field flipped back. NN/g also warns against placing consequential and benign options close together, so Delete is separated from Save with clear space and different colour. The one remaining `confirm()` is on resetting the categoriser: rare and genuinely irreversible, which is exactly what NN/g reserves dialogs for.

**Contrast was actually broken.** The original `--dim` measured **2.81:1** against the card surface — every small label, all chart axis text, metadata and empty-state copy failed WCAG AA's 4.5:1 requirement. Now the whole palette measures 5.26:1 or better. This was a genuine defect, not a refinement.

**Touch targets.** WCAG 2.2 SC 2.5.8 (AA) requires 24×24 CSS px; SC 2.5.5 (AAA) requires 44×44, and Material Design asks for 48dp. The original chips were about 30px. Everything interactive now has a 44px minimum via `--tap`, with the keypad and Save at 52–56px.

**Fewer colours in charts.** Mobile dataviz guidance is consistent that 3–4 colours beat a rainbow, and that hover tooltips don't exist on a phone. Bars are now one hue at two intensities, the selected bar prints its own value, and tapping any month bar jumps to that month. Category dots stay as identity markers in lists — but Food's old colour was almost identical to the selection accent, so one colour meant two things. Fixed.

**Progressive disclosure on Trends.** The "one screen, one thought" principle: headline numbers, 12-month trend, burn curve and category split are shown by default; weekday pattern and top items sit behind one toggle.

Sources: NN/g on [confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/) and [consequential options](https://www.nngroup.com/articles/proximity-consequential-options/), Smashing Magazine on [the thumb zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

---

## 4a. Trends: four views, not one scroll

The page had grown to fifteen sections in a single vertical scroll. That is the worst-performing shape for this content, and there is a direct result on it: Harms et al. (2015) tested four layouts for long content on smartphones and found **plain scrolling performed worst of the four**, with tabs, menus and collapsible sections all doing better. NN/g's dashboard research says the same from the other side — users abandon dashboards that are too dense, and the fix is a top-level summary with drill-down rather than one packed view.

So Trends is now four views behind a sticky segmented control: **Overview · Where · When · Habits**. Segmented controls are the correct component here rather than tabs or a menu — iOS and Fluent guidance both scope them to switching between views *within a single context*, which is exactly what these are, and four sits under the five-segment limit for a phone. Labels name the view rather than the feature. Horizontal swipe moves between views, the way a tabbed pager does.

The longest single view is now under half the old scroll length.

**One period control per view.** This is the change that made the split worth doing. Previously a range selector (1M–ALL) and a month picker sat on the same screen meaning different things, which is a mapping problem — the relationship between a control and its effect has to be obvious. Now: Overview is range-based, Where and When are month-based, Habits is all-time. Each view has exactly one, and it is unambiguous.

**Answer first.** Tableau's eye-tracking work found big numbers command attention before anything else, and that in a repeating row of cards attention is strongest at the first item and falls away after it. So the page opens with the conclusion in plain words — *"₹58,551 in Aug '26 — 75% more than Jul '26. Mostly Travel, up ₹28,000."* — and the month total is a single full-width figure above the smaller supporting stats, rather than four equal cards that force you to work out which matters.

**Section notes.** Each block carries one line saying how to read it. Lack of contextual clarity is a standard dashboard failure: a chart with no framing leaves you guessing what it is telling you.

### The chart itself

**Timeframe selector directly under the chart** — `1M · 3M · 6M · 1Y · ALL`. Trading-app UX guidance is specific that these belong adjacent to the chart, not in a menu, since rapid switching is the core behaviour. It also puts them in the thumb zone.

**Metric toggles:** Spend, Entries, Avg size, Running total — whether a heavy month came from spending more, buying more often, or buying dearer things.

**Overlays:** Smooth (trailing average) and Compare previous (preceding equal window, dashed).

**Drag to read any point.** Apple Stocks updates the value above the chart as the pointer moves; same here, with a crosshair and a haptic tick. Matters more on a phone than desktop because there is no hover. Pointer events, so it works with a mouse in the laptop viewer.

**Buckets adapt to range:** daily to 3 months, weekly to a year, monthly for ALL. 365 daily points on a 340px chart is noise.

**Gesture conflict, resolved twice.** Charting guidance warns against blocking gestures. The month-swipe handler ignores touches starting inside the chart, and page-level swipe on Trends now moves between the four views rather than between months — months have their own picker, so the gesture was doing redundant work.

---


**Timeframe selector sits directly under the chart** — `1M · 3M · 6M · 1Y · ALL`. Trading-app UX guidance is specific that timeframe selectors belong adjacent to the chart module rather than in a menu, since rapid switching is the core behaviour and friction there breaks the exploration. It also puts them in the thumb zone.

**Metric toggles:** Spend, Entries, Avg size, Running total. The same window answers four different questions — whether a heavy month came from spending more, or buying more often, or buying dearer things.

**Overlays:** *Smooth* (trailing average over the raw line) and *Compare previous* (the preceding equal-length window, dashed). Smooth is disabled on Running total, which is monotonic by construction and already smooth.

**Drag across the chart to read any point.** Apple Stocks updates the date and value above the chart as the pointer moves; the same here, with a crosshair and a haptic tick. This matters more on a phone than on desktop because there is no hover — without it, a value can only be estimated by eye. Built on pointer events, so it works with a mouse in the laptop viewer too.

**Buckets adapt to the range,** as stock charts do: daily up to 3 months, weekly to a year, monthly for ALL. 365 daily points across a 340px-wide chart is noise, not detail.

**One gesture conflict, resolved.** Trends already used horizontal swipe to step through months, which would have hijacked every scrub drag. Charting guidance flags this directly — avoid blocking gestures. The month-swipe handler now ignores any touch starting inside the chart, and the chart sets `touch-action: none` so the page doesn't scroll under the drag.

This replaced the old static "12-month trend" bars and the fixed "Smoothed trend · 90 days" panel — the hero chart does both jobs and more. Everything month-specific (the variance bridge, category split, heatmap, deep dive) now sits below under a **Month detail** heading with its own month picker, so the two period controls never get confused for each other.

---

## 4b. Categories

17 seeded categories, and you can now add, rename, recolour and hide your own from **More → Manage categories**.

The rule that matters: **a category in use cannot be deleted, only hidden.** Expenses reference categories by `category_id`, so deleting one that's still referenced would orphan every entry pointing at it — the crash class this app can least afford, since it would take out the Log and Trends tabs at once. Hiding removes it from the picker for new expenses while every historical entry keeps resolving normally. Delete is offered only when usage is zero.

One related detail: if you edit an old expense whose category has since been hidden, that category still appears in the picker, marked `HIDDEN`, so opening the entry can't silently reassign it.

---

## 4c. Forward view, habit cost, entry guard

Three things that use data already in the app rather than new inputs — which matters, because every new *input* channel is closed on this platform. A web app cannot read SMS on Android. Receipt OCR needs a model too large to ship offline. Bank feeds need account-aggregator licensing. So the only room left is inference.

**Committed over the next 30 days.** Every expense tracker looks backwards, including this one until now. But the recurring detector already knows what is due and roughly when, which is enough to project the *committed* side of next month: rent on its date, subscriptions on theirs, groceries on their weekly cycle. Overdue items are carried in too.

Only commitments are forecast. Discretionary spending is a decision made daily, not a schedule, so it is estimated separately from your recent non-recurring run rate and shown beside — never blended into one number that would imply more certainty than exists.

**Annualised habit cost.** Frequency × unit price, projected from your actual pace. A ₹380 lunch reads differently as ₹5,700 a month. Guard: an item must appear at least 4 times across at least six weeks. Annualising from two events a week apart produces confident nonsense, and a wrong big number is worse than no number.

**Entry-time typo and duplicate guard.** The outlier check in Trends runs days later — by which point a mistyped extra zero has already skewed the median, the variance bridge, the concentration curve and the recurring amounts it feeds. So the same check now runs as you type, before saving.

The threshold is deliberately stricter than review-time: **3.5 MAD at entry versus 2.5 in Trends**, because a false alarm here interrupts every single entry, while a false alarm in Trends is just a row you skip. On test data ₹25,000 of fuel flags at 10× the usual ₹2,500, while a normal ₹380 lunch and a normal ₹2,500 fill-up pass silently. The duplicate check matches description, amount and date. Both warn; neither blocks.

---

## 4d. Viewing on a laptop

**More → Open a backup (read-only).** Load a backup JSON and browse the Log and Trends tabs on a bigger screen.

**It is read-only on purpose, and that is the whole design.** IndexedDB is per-device. A writable laptop copy would be a second database with no sync between them — edit on both, and the next import silently discards one side's changes, because merge is last-write-wins on `updated_at` and has no way to know which edit you meant to keep. A viewer that never writes cannot diverge. The phone stays the single source of truth.

While a backup is open, the Add tab disappears from the nav, every write path refuses, and a banner sits at the top. Exit reloads back to your real data.

If you later want genuine two-way laptop editing, that is the Postgres replica in §7 — real sync, not two hopeful copies of a file.

---

## 4e. Money

Income turns absolute figures into ratios, and ratios are where the meaning is. ₹58,000 spent says nothing alone; ₹58,000 against ₹80,000 earned is a savings rate.

**Take-home, not gross.** Tax and deductions never reach the account, so counting them would flatter the savings rate and make safe-to-spend actively wrong.

**One monthly figure plus per-month overrides.** Income here is mostly steady with minor variation, so a single estimate covers the norm and an override covers the month with an incentive, a bonus, or a gap.

**What it shows:** savings rate as the headline; safe-to-spend for the rest of the month with commitments still due set aside first, and the daily figure that implies; a four-way split of where income went (committed / variable / moved to savings / left in account); savings rate charted across twelve months; and every category as a share of *income* rather than share of spending — a category at 4% of spending may be 1% of income, and that is the number that matters.

### At this pace

A forward projection from recent spending, and the reason it takes work to get right is that a naive version would be confidently wrong.

Four rules keep it honest:

- **Complete months only.** The current month is partial. Including it would drag typical spending down and inflate the projection.
- **Median, not mean.** Spending is right-skewed; one heavy month should not set a year's forecast.
- **A range, not a point.** The best and worst of the recent months bound the estimate, drawn as a band. A single number implies precision that three months of data cannot support.
- **Months with no entries are dropped**, not counted as zero spending.

Below three complete months it says so plainly and asks you to treat the figure as a rough shape rather than a number. It also states that this is plain accumulation — any interest or returns on what you invest sit on top and are not modelled, because guessing a rate would be inventing a number.

Alongside: how many months of living costs a year at this pace buys you, and your typical monthly spend with its range.

### What a 10% trim is worth

The actionable half. For each of your largest non-recurring categories, what spending a tenth less would add over a year, plus the total if you did all of them.

Recurring commitments are deliberately excluded. Those are not reduced by deciding differently day to day — they are reduced by cancelling, which the Committed view in Trends already handles.

### Transfers are not spending

A category can now be marked **Transfer, not spending** in More → Manage categories. An RD deposit is money *moved*, not money *gone*.

This matters more than it sounds. Two quantities are easy to conflate:

- **saved** = income not spent. A transfer into an RD counts here — it *is* saving.
- **left in account** = cash still unallocated. The transfer has left, so it does not.

Savings rate must use the first. I got this wrong in the first cut of this feature and caught it in testing: transfers were being subtracted as spending, so logging a ₹20,000 RD dropped a 70% savings rate to 50% — punishing you for investing. Both figures now appear, correctly and separately, and the rate is identical whether or not you log the investment.

Entries in a transfer category stay visible in the Log but are kept out of every spending analytic. With no category flagged, nothing changes at all.

---

## 4f. Navigation

Bottom nav: **Add · Log · Trends · Money · More**.

Recurring folded into Trends, which forced a decision on tab count. Material Design 3 is explicit: *avoid more than four tabs at once; at five or more the container becomes cramped* — and equally explicit that the obvious workaround is out: *do not include a set of tabbed content within a tab*. Scrollable tabs were the other option, but those are meant for browsing contexts where you don't need to compare labels, which is the opposite of pivoting between analyses.

So Trends consolidated to four rather than growing to seven: **Overview · Categories · Patterns · Committed**. Committed carries everything from the old Recurring tab — forward calendar with a 30/90-day toggle, ranked costs with a month/year toggle, price-change detection, lapsed commitments — plus annualised habit costs, which belong beside recurring costs since both are ongoing commitments in all but name.

---

## 5. How the categoriser works

No API call, no key, works offline.

1. **Seed keywords** — ~250 India-first terms (`swiggy`, `dmart`, `fastag`, `jio`, `apollo`, `bookmyshow`). Cold-start priors only.
2. **Learned rules** — every time you *manually pick* a category, each significant word in the description gets a +1 vote for that category, stored in the `rules` table. Learned votes are weighted 3× over seeds.
3. So `client lunch at Blue Diamond` gets categorised as Food the first time by the word "lunch"; correct it to **Business** twice and `blue`, `diamond` and `client` permanently outrank the seed.

It only learns from confirmed choices, never from its own guesses — otherwise it reinforces its own mistakes.

---

## 6. Recurring detection

Group entries by a two-token description signature → require **≥3 occurrences** → take the median gap between them → match against weekly / fortnightly / monthly / quarterly / half-yearly / yearly with per-cadence tolerance → require ≥60% of gaps within tolerance and amount coefficient-of-variation ≤0.45.

Output: cadence, mean amount, normalised monthly cost, next expected date, and an **overdue** flag when something's late — which means either you forgot to log it, or the subscription lapsed. The sum of all normalised monthly costs is your fixed baseline: what leaves your account before you decide anything.

Expect roughly two months of data before it's useful.

---

## 6a. Audit

ESLint 9 with correctness and security rules, a 99-assertion property suite, and a static pass for XSS, prototype pollution and uncleaned resources.

### Defects found and fixed

**Comma parsed as a decimal point.** `parseEntry("rs 2,500 fuel")` returned **2.5**, not 2500. The pattern did `.replace(',','.')` for European decimal commas, but Indian formatting uses commas as thousands separators. Sharing a payment SMS reading "Rs 2,500" would have logged ₹2.50 — silent corruption that poisons the median, the variance bridge, recurring amounts and every projection downstream. Commas are now stripped, never reinterpreted.

**`<` emitted raw into SVG.** The transaction-size chart's `<100` bucket label went into `<text>` unescaped, producing `<text><100</text>`. Browsers recover, but it is invalid markup and the first label containing a user-supplied string would have been a real injection. Escaped.

**Maps inheriting from `Object.prototype`.** Eleven maps were keyed by user-supplied strings — descriptions, category ids. A category named `constructor` resolved to a function and rendered as "Object"; assigning to a `__proto__` key is silently ignored, dropping the entry. All eleven now use `Object.create(null)`, verified by rendering every view with entries literally named `__proto__` and `constructor`.

**Pointer capture never released.** The chart scrub called `setPointerCapture` with no matching release.

**`live` shadowed inside `editSheet`.** A local named `live` masked the global `live()` accessor in that closure. Harmless as written, but any later call to `live()` there would have thrown.

**Dead code.** `byMonth()` and `dailySeries()` were orphaned when the hero chart replaced the old trend panels. Removed, along with an unused destructured binding and an unused parameter.

**`detectRecurring()` recomputed seven times per render.** O(n log n) with tokenisation over every entry, called seven times on a single render of Trends or Money. Now memoised against a `DATA_VER` counter that every mutation bumps.

### Reviewed and deliberately not changed

Nine `require-atomic-updates` warnings on `saveExpense`, all false positives. The re-entrancy guard is sound because the check and the set are separated by no `await` — JavaScript cannot interleave another invocation into synchronous code — and the flag is released in a `finally`. Verified empirically by firing three concurrent calls and asserting one row is written. The reasoning is now a comment in the source so the next reader does not have to re-derive it.

### Property suite (99 assertions, all passing)

Quantile and MAD against hand-computed values; `addDays`/`daysBetween` proven inverse across 400 days, month ends, year ends and both leap and non-leap February; Indian lakh grouping; and invariants on generated data — daily totals sum to the month, category totals sum to the month, bridge steps sum to the net change, the concentration curve is monotonic and terminates at exactly 1.0, size buckets reconcile to both total and count, week buckets tile the range with no gaps, cumulative series never decrease, compare series align to equal length across all twenty range × metric combinations, and `pace` excludes the current partial month. Every analytic is also run against empty data and against a single entry.

### Twelve `FUTURE` notes in the source

Marked at the code they concern rather than collected in a list: schema migrations before `SCHEMA_VERSION` moves to 2; encryption at rest; categoriser bigrams and TF-IDF; multi-entry parsing; recurring detection for shifting weekdays and changed cadences; CRDT merge as a prerequisite for two-way sync; calendar export and local notifications; multiple income streams, savings goals and an optional return rate; the periodic-entry logging mode; accessible chart fallbacks; locale support; and an outbox table as the clean shape for a future Postgres replica.

---

## 7. Roadmap

**v2 — Spring Boot + Postgres replica.** Push-only sync: phone stays the source of truth, backend is a durable replica with real constraints. `POST /sync` takes rows where `updated_at > last_sync`, upserts on `id` with last-write-wins. Add it *after* the schema has survived two months of real use, because it will change.

**v3 — Kotlin native.** Room uses the DDL above verbatim. Migration is a one-time JSON import.

Don't build v2 until v1 has real data in it. The schema is the thing worth getting right, and only daily use tells you where it's wrong.
