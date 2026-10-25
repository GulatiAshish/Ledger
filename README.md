# Ledger

A daily expense tracker that runs entirely in your browser. No account, no server, no sync — your data stays on your device.

Install it to your Android home screen and it behaves like a native app: opens instantly, works with no signal, and records expenses offline.

---

## Features

**Fast entry**
- Type it however you'd say it — `swiggy dinner 480`, `yesterday 2000 rent`, `1.2k ola airport`. Amount, category and date are parsed out of the text.
- A numeric keypad as an alternative to typing.
- One-tap repeat for anything you've logged before, ordered by time of day — breakfast chips in the morning, dinner at night.
- Leave the amount off a familiar item and it uses your usual amount for it.
- Optional payment method — add `upi`, `cash` or `card` to the text, or tap it. The last one used is remembered.
- A gentle "yesterday has nothing logged" prompt instead of a streak counter, so missing a day doesn't feel like failing.
- Automatic categorisation from ~250 keywords, which learns from your corrections.
- Warns before saving if an amount looks like a typo or a duplicate.

**Today**
- A daily allowance worked out from your income, savings goal and fixed costs, shown as a range: a target and a ceiling.
- Overspend is spread across the rest of the month, so one heavy day doesn't wreck the plan. Underspend is shown as money ahead of plan, not added to tomorrow's allowance.
- A month-by-day calendar coloured by whether each day landed under, near or over its allowance.
- Tap the card to change your savings percentage. The split — saved, committed, left to spend, per day — updates as you type.

**Analysis**
- Interactive chart with `1M / 3M / 6M / 1Y / ALL` ranges, four metrics, and a smoothed trend line. Drag across it to read any point.
- "Everyday only" toggle on the chart hides rent, bills and other fixed costs so day-to-day spending is readable.
- Month-on-month variance breakdown showing which categories drove a change. The current month is compared with the same number of days of the previous one, not the whole month.
- How you pay — the UPI / cash / card split over the last 90 days.
- Calendar heatmap of daily spending. Tap a day to backfill it.
- Category drift over six months, spending concentration, transaction-size distribution, and outlier detection.
- Months before you started logging are left out of comparisons and projections rather than treated as cheap months.

**Commitments**
- Detects recurring payments automatically — no setup, no manual subscription list.
- Add a commitment yourself — rent, an SIP, an annual premium — weekly, monthly, quarterly or yearly. When you log the payment it's matched to it, so it's never counted twice.
- Categories can be marked as fixed costs (rent, bills, utilities and subscriptions by default). These are set aside before the daily allowance and never flagged as unusual.
- Rolling 30 / 90-day forward view of what's due and when.
- Flags price increases on recurring charges, and payments that have stopped arriving.
- Annual cost of every commitment and repeated habit.

**Income (optional)**
- Add take-home income and a savings goal (20% by default) to get savings rate, the daily allowance, and every category as a share of income.
- Projects annual savings from your recent pace, as a range rather than a single number.
- Shows what trimming each category by 10% would be worth over a year.

**Data**
- Works fully offline after the first load.
- Search every month at once by description, category or payment method.
- Auto, light or dark theme, following the phone by default, with four accent colours.
- One-tap backup to Google Drive via the Android share sheet, plus JSON and CSV export. Backups include your income settings and commitments.
- Read-only viewer for opening a backup on a laptop.

---

## Install

1. Open **https://gulatiashish.github.io/Ledger/** in Chrome on Android → menu → **Install app**.
2. Launch from the home-screen icon, then go to **More → Persistent storage → Request**.

Step 2 stops Chrome evicting your data under storage pressure. Installed apps are almost always granted it.

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

## License

**Copyright © 2026 Ashish Gulati. All rights reserved.**

The source is public to read, not to reuse. You may use the app at the address above for your own expenses. Copying, hosting, modifying, redesigning or redistributing it — in whole or in part — requires my prior written permission. To ask, contact me through [GitHub](https://github.com/GulatiAshish).

See [`LICENSE`](LICENSE) for the full terms. 
