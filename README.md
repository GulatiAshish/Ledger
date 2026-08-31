# Ledger

A daily expense tracker that runs entirely in your browser. No account, no server, no sync - your data stays on your device.

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
- Detects recurring payments automatically.
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

## Privacy

Everything is stored locally in IndexedDB. There is no backend, no analytics, no telemetry, and no third-party requests of any kind - the fonts are self-hosted and the charts are drawn in the browser. Searching the source for `http` returns nothing.

The trade-off is that **there is no cloud backup**. Until you export, your phone holds the only copy.

Use **More → Back up to Drive** rather than *Export*. Export writes to the phone's downloads folder, which is lost with the phone; Back up to Drive sends the file off the device. The app reminds you if it has been more than two weeks.

Your data survives: reinstalling from the same URL, renaming the repo, and moving to a new phone (install, then **More → Import**).

Your data is lost by: clearing Chrome's site data, uninstalling on some Android versions, changing your GitHub username, or moving to a custom domain — the last two change the origin, and IndexedDB is scoped to it.

---

**Checks:**

```bash
npx eslint index.html      # after extracting the <script> block
```

The repo has no test runner wired up; the property suite used during development covers date arithmetic, quantiles, and cross-view invariants.

---

## License

Apache License 2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).

Free to use, modify, and redistribute, including commercially. Section 4 of the
licence requires that derivative works retain the copyright and attribution
notices, mark any modified files as changed, and reproduce the contents of
`NOTICE` — in a NOTICE file, in the documentation, or in the app's own interface.

Copyright 2026 Ashish Gulati.
