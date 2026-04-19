# Private Ledger — Budget Analyzer

A privacy-first React app that analyses Australian bank CSV exports. Categorises your spending, detects reliable monthly income and recurring expenses (mortgage, subscriptions, etc.), compares each category to ABS household benchmarks, and surfaces concrete savings suggestions.

Everything runs in the browser. No upload, no backend, no analytics.

## Tech stack

- **Vite** + **React 18** — fast HMR, tiny bundle
- **Tailwind CSS** — utility classes used for layout scaffolding
- **lucide-react** — icons
- **recharts** — charts (currently imported but optional)
- **localStorage** — persists your category overrides between sessions

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Building for production

```bash
npm run build
```

Output lands in `dist/`. This is a static site — deploy it anywhere.

## Deploying

### Vercel (recommended — free, 60 second setup)

1. Push this repo to GitHub
2. Visit vercel.com → "Add New Project" → import your GitHub repo
3. Vercel auto-detects Vite — just click Deploy
4. Every push to `main` redeploys automatically

### Cloudflare Pages / Netlify

Same story — connect GitHub, build command `npm run build`, output directory `dist`.

### GitHub Pages

```bash
npm run build
# Then publish the `dist/` folder to the `gh-pages` branch.
# Or add the included .github/workflows/deploy.yml and push.
```

## Project structure

```
.
├── index.html              # Entry — loads fonts, mounts React
├── src/
│   ├── main.jsx            # ReactDOM bootstrap
│   ├── App.jsx             # The whole app (1700+ lines)
│   ├── storage.js          # localStorage shim (artifact-compatible API)
│   └── index.css           # Tailwind + Fraunces/JetBrains Mono setup
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

`App.jsx` is the single-file React artifact exported as a default function. It contains:

- **Category rules** — keyword matching for Groceries, Mortgage, Subscriptions, etc.
- **CSV parser** — handles CBA NetBank, Westpac, NAB, ANZ, Up, ING, Bendigo, Macquarie variants
- **Recurring-transaction detector** — used for both income (budget floor) and expenses (mortgage auto-detection)
- **Benchmark comparison** — ABS household monthly averages
- **Alternatives / savings** — per-merchant suggestions with monthly savings estimates
- **Card-stack categorisation UI** — post-it style for manually tagging "Other" transactions

## Privacy notes

All CSV parsing happens client-side. The file never leaves your browser. Category overrides you make are stored in `localStorage` under the `budget-analyzer:` prefix — wipe them any time with the "Clear all" link in the app or via devtools.

## Making changes

`App.jsx` is one long file on purpose — it's how the artifact was authored and it makes search/replace edits safe and obvious. If you want to modularise, good split points:

- Extract `CATEGORY_RULES`, `BENCHMARKS`, `ALTERNATIVES` into `src/config/` as JSON
- Extract `parseCSV`, `identifyColumns`, `parseDate` into `src/lib/csv.js`
- Extract `detectRecurring`, `detectAnomalies`, `merchantKey` into `src/lib/analysis.js`
- Break the results view into section components (`<MonthlyBudget />`, `<CategoryBreakdown />`, `<CategorisationStack />`)

## License

Do whatever you want with it.
