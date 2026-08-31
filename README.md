# Ledger

A daily expense tracker that runs entirely in your browser. No account, no server, no sync — your data stays on your device.

Install it to your Android home screen and it behaves like a native app: opens instantly, works with no signal, and records expenses offline.

---

## Features

**Fast entry**
- Type it however you'd say it — `swiggy dinner 480`, `yesterday 2000 rent`, `1.2k ola airport`. Amount, category and date are parsed out of the text.
- A numeric keypad as an alternative to typing.
- One-tap repeat for anything you've logged before.
- Automatic categorisation from ~250 keywords, which learns from your corrections.
- Warns before saving if an amount looks like a typo or a duplicate.

**Analysis**
- Interactive chart with `1M / 3M / 6M / 1Y / ALL` ranges, four metrics, and a smoothed trend line. Drag across it to read any point.
- Month-on-month variance breakdown showing which categories drove a change.
- Calendar heatmap of daily spending. Tap a day to backfill it.
- Category drift over six months, spending concentration, transaction-size distribution, and outlier detection.

**Commitments**
- Detects recurring payments automatically — no setup, no manual subscription list.
- Rolling 30 / 90-day forward view of what's due and when.
- Flags price increases on recurring charges, and payments that have stopped arriving.
- Annual cost of every commitment and repeated habit.

**Income (optional)**
- Add take-home income to get savings rate, safe-to-spend, and every category as a share of income.
- Projects annual savings from your recent pace, as a range rather than a single number.
- Shows what trimming each category by 10% would be worth over a year.

**Data**
- Works fully offline after the first load.
- One-tap backup to Google Drive via the Android share sheet, plus JSON and CSV export.
- Read-only viewer for opening a backup on a laptop.

---

## Install

The app must be served over HTTPS for Android to offer a real install. GitHub Pages works and is free.

1. Upload all files to the root of a public repo, keeping this flat structure:

```
index.html                 manifest.webmanifest
sw.js                      icon-192.png
archivo-var.woff2          icon-512.png
plexmono-400.woff2         icon-maskable-512.png
plexmono-600.woff2         shortcut-add.png
                           shortcut-log.png
                           shortcut-trends.png
```

2. **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / root.
3. Open `https://<username>.github.io/<repo>/` in Chrome on Android → menu → **Install app**.
4. Launch from the home-screen icon, then go to **More → Persistent storage → Request**.

Step 4 stops Chrome evicting your data under storage pressure. Installed apps are almost always granted it.

Long-press the app icon for shortcuts to Add, Log and Trends. Drag **Add expense** onto your home screen for a one-tap entry icon. Ledger also appears in Android's share sheet — share the text of a payment SMS and it arrives pre-filled.

---

## Privacy

Everything is stored locally in IndexedDB. There is no backend, no analytics, no telemetry, and no third-party requests of any kind — the fonts are self-hosted and the charts are drawn in the browser. Searching the source for `http` returns nothing.

The trade-off is that **there is no cloud backup**. Until you export, your phone holds the only copy.

Use **More → Back up to Drive** rather than *Export*. Export writes to the phone's downloads folder, which is lost with the phone; Back up to Drive sends the file off the device. The app reminds you if it has been more than two weeks.

Your data survives: reinstalling from the same URL, renaming the repo, and moving to a new phone (install, then **More → Import**).

Your data is lost by: clearing Chrome's site data, uninstalling on some Android versions, changing your GitHub username, or moving to a custom domain — the last two change the origin, and IndexedDB is scoped to it.

Note that all project sites under one `github.io` account share a single origin, so anything else you host there can read this app's storage. Fine for a personal account; don't host untrusted code alongside it.

---

## How it works

**No build step and no dependencies.** One HTML file with inline CSS and JS, a service worker, three self-hosted `.woff2` fonts, and some PNGs. Charts are hand-written SVG. The whole install is about 200 KB.

**Storage** is IndexedDB with a schema shaped deliberately like SQL, so it ports without a migration:

```sql
CREATE TABLE expenses (
  id          TEXT PRIMARY KEY,      -- client-generated uuid
  amount      REAL NOT NULL CHECK (amount > 0),
  spent_on    DATE NOT NULL,         -- local YYYY-MM-DD, never a timestamp
  category_id TEXT NOT NULL REFERENCES categories(id),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,  -- last-write-wins key for any future sync
  deleted_at  TIMESTAMPTZ            -- soft delete, so deletions can replicate
);
```

Two choices worth keeping if you fork this: `spent_on` is a bare date, not a timestamp, because timezone bugs in expense apps almost always trace back to storing `NOW()` and rendering it elsewhere. And deletes are soft, because a hard delete can't replicate — the other side has no way to learn a row disappeared.

**Offline** is cache-first, not network-first. Network-first is fine when you're fully offline (the fetch fails fast), but on weak signal it can hang for tens of seconds — meaning the app would open slower on a bad connection than on none at all. Cache-first opens instantly in every condition and picks up a new deploy on the following launch.

**Categorisation** is a weighted bag-of-words vote: seed keywords provide the cold start, and every manual correction adds weighted votes for the words in that description. It only learns from confirmed choices, never its own guesses.

**Recurring detection** groups entries by description signature, requires at least three occurrences, takes the median gap, and matches it against weekly through yearly cadences with per-cadence tolerance and an amount-stability check.

**Statistics** are robust rather than naive. Spending is strongly right-skewed, so the app reports medians with the mean beside them, and detects outliers with median ± MAD rather than mean ± standard deviation — the mean and SD are themselves distorted by the outliers you're looking for.

`DESIGN.md` covers the reasoning behind the interface and analytics in more depth.

---

## Development

Edit `index.html` directly — there is nothing to compile.

**After any change, bump the cache version in `sw.js`:**

```js
const CACHE = 'ledger-v15';   // → 'ledger-v16'
```

Without this the phone keeps serving the old copy. The new version appears on the *second* launch after deploying — that's the deliberate cost of cache-first loading.

The source carries `FUTURE —` comments at the places they concern, covering schema migrations, encryption at rest, two-way sync, and other extensions.

**Checks:**

```bash
npx eslint index.html      # after extracting the <script> block
```

The repo has no test runner wired up; the property suite used during development covers date arithmetic, quantiles, and cross-view invariants.

---

## Roadmap

- Separate logging mode for periodic entries — investments, EMIs, premiums — recorded monthly rather than daily.
- Postgres replica with real two-way sync, once the schema has settled.
- Native Android build reusing the same schema in Room.

---

## License

MIT. See `LICENSE`.
