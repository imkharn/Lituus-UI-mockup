# Augur Lituus UI Mockup

Interactive frontend mockup of the upcoming Augur Lituus oracle UI. Smart-contract behavior is simulated locally (Augur V2–style escalation, appeal windows, fork migration). No wallet or chain connection required.

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Tabs

| Tab | Default | Purpose |
|-----|---------|---------|
| **Report** | Yes | Reporter list with required actions, claimable winnings, smart sort / next-to-expire, inline expand, bet/to-win staking, Snapshot-style stake timeline |
| **Query** | | Create a query with auto best-price quote (AMM vs protocol) and expandable help |
| **Stats** | | APY, % staked / TVL, open interest placeholder, attack cost, log-Y charts of queries/day and fee with dotted fee projection |

## Mock interactions

- Stake / appeal deducts REP from the mock wallet and updates the query timeline
- Claim moves winnings into the wallet
- Migrate removes fork-required items after choosing a child universe
- Sort preference is stored in `localStorage` under `lituus-report-sort`
- A 60s tick decrements time remaining; queries at ≤0 disappear from the list

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · Recharts
