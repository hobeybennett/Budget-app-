# Project notes for Claude Code

This is a Vite + React single-page app. The entire UI lives in `src/App.jsx`.

## Architecture at a glance

- **Top of App.jsx (lines ~5 – ~200):** Configuration constants — `CATEGORY_RULES`, `ALTERNATIVES`, `BENCHMARKS`, `BUILT_IN_CATEGORIES`. Edit these to change categorisation behaviour.
- **Middle (~200 – ~650):** Pure functions — `categorize`, `findAlternative`, `merchantKey`, `median`, `detectRecurring`, `detectAnomalies`, CSV parser (`parseCSV` and helpers), date parsing.
- **Bottom (~650 – end):** The `App` component, with state, the `analysis` useMemo, and the full JSX tree.

## Things that are easy to get wrong

1. **Rule order matters.** `CATEGORY_RULES` is evaluated top-down; the first match wins. Mortgage must come before Transfers because a mortgage transfer description contains both "transfer to" and "mortgage".

2. **Merchant key normalisation.** `merchantKey()` strips common banking prefixes (`direct credit`, `transfer to`, `osko payment`, etc.) so the actual payee becomes the key. Without this every "Direct Credit X" and "Fast Transfer From Y" collapses to the same key.

3. **Virtual mortgage key.** Any debit description matching `/\bmortgage\b|\bhome loan\b|\bloan repayment\b|\bp&i payment\b/` is force-grouped under `__mortgage__` before merchantKey analysis — this fixes the case where different people's names appear in the reference field.

4. **Conservative budget amounts.** `detectRecurring()` uses the mode of rounded-dollar amounts when it appears 2+ times, otherwise the minimum. Never the mean. This matters because bonuses shouldn't inflate your budget floor.

5. **Category filtering in anomaly detector.** `detectAnomalies()` skips known-recurring categories (Mortgage, Rent, Insurance, Utilities, Subscriptions, etc.) entirely — otherwise your mortgage keeps showing up as "unusual spend."

6. **Monthly conversion factor.** `analysis.periodMonths = periodDays / 30.44`. Every user-facing number is divided by this before display. Internal totals (`c.total`, `s.estimatedSavings`) are period totals; display values are `/mo`.

## Persistent storage

`src/storage.js` shims the artifact `window.storage` API on top of `localStorage`. Keys are prefixed with `budget-analyzer:`. The app reads `categorisations` on mount (stores `{overrides, customCategories}`).

## Running locally

```bash
npm install
npm run dev
```

## Deploying

Push to GitHub → connect Vercel → auto-deploy on push to main. No config needed; Vite is detected automatically.
