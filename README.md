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

**Redeploying:** bump `CACHE = 'ledger-v6'` to `'ledger-v7'` in `sw.js`, or the phone keeps serving the old copy. The new version appears on the *next* launch after that, not the current one — that's the deliberate trade for instant opening (see §4).

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

## 4a. What's in the Trends tab

Nine analyses beyond the headline numbers, each chosen against a specific source rather than because the chart looked good.

**Typical day = median, not mean.** Spending is strongly right-skewed — a few large days drag the average far above what a normal day looks like. On realistic test data the mean sat 2.9× the median. Robust-statistics practice is to lead with the median and show the mean beside it, so the gap is visible instead of misleading. The spread panel adds the 25th and 75th percentiles: half your active days fall in that band.

**Smoothed trend (90 days).** Raw daily spending has no readable direction. Three lines: raw, 7-day and 30-day trailing means. The 30-day line is the signal; the app states plainly whether it's rising, falling or flat and by how much.

**What changed vs last month — a variance bridge.** The single most useful chart here. It decomposes the month-over-month difference into the categories that caused it. Waterfall practice says: order by absolute impact, fold minor drivers into "Other" (a bridge with 17 tiny bars explains nothing), neutral colour for the start and end totals, directional colour for the movements. Red pushed the total up, green pulled it down.

**Committed vs decided.** Standard fixed-versus-variable framing: fixed costs set the floor you can't move this month, variable is the part actually open to a decision. The recurring detector already identifies your committed payments, so this comes free — and it's the number that tells you where a change would have to come from.

**Calendar heatmap.** Calendar views place daily data in a familiar grid, which makes weekly and seasonal patterns readable at a glance. It also does something the other charts can't: it shows **blank days**. If you missed logging, every figure on the page is a floor rather than a total, and the app says so rather than quietly understating.

**Category drift — small multiples.** Six categories, six months each, same shape and same scale. Tufte's argument for the form is that constant axes across many small panels let differences surface at a glance, where a single combined chart would bury them. Each panel compares this month against that category's own average of the prior five, so you see what's creeping up.

**Concentration.** Everyone quotes the 80/20 rule; Byron Sharp's research shows the real ratio is rarely that extreme — nearer 50/20 in consumer data (Goodhardt's 20:30:50 law). So this measures your actual curve rather than asserting the rule: how many transactions carry half your month, and what share the top 20% actually hold. The dashed diagonal is perfectly even spending; the further the curve bows above it, the more a few decisions dominate.

**Unusual for you.** Flagged by **median ± 2.5 × MAD** (Leys et al., 2013), not mean ± SD. The reason is specific: the mean and standard deviation are themselves distorted by the outliers you're hunting, so that rule routinely misses obvious ones. MAD has a 50% breakdown point and doesn't. Each transaction is compared against its own category's history — a large rent payment isn't unusual, a large coffee is — falling back to all-spending for categories with too little history to have a norm. Tap any flagged item to open it.

**Transaction-size distribution.** Bar height is total rupees, the count beneath is how many transactions. A tall bar with a small count means a few big decisions; short bars with high counts mean it leaks away in small pieces. Two very different problems with two very different fixes.

The last five sit behind one disclosure toggle, keeping the default view to one thought per screen.

---

## 4b. Categories

17 seeded categories, and you can now add, rename, recolour and hide your own from **More → Manage categories**.

The rule that matters: **a category in use cannot be deleted, only hidden.** Expenses reference categories by `category_id`, so deleting one that's still referenced would orphan every entry pointing at it — the crash class this app can least afford, since it would take out the Log and Trends tabs at once. Hiding removes it from the picker for new expenses while every historical entry keeps resolving normally. Delete is offered only when usage is zero.

One related detail: if you edit an old expense whose category has since been hidden, that category still appears in the picker, marked `HIDDEN`, so opening the entry can't silently reassign it.

---

## 5. How the categoriser works

No API call, no key, works offline.

1. **Seed keywords** — ~250 India-first terms (`swiggy`, `dmart`, `fastag`, `jio`, `apollo`, `bookmyshow`). Cold-start priors only.
2. **Learned rules** — every time you *manually pick* a category, each significant word in the description gets a +1 vote for that category, stored in the `rules` table. Learned votes are weighted 3× over seeds.
3. So `client lunch at Blue Diamond` gets categor