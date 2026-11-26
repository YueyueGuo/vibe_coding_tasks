# SEPA / VCP Screener

A daily stock screen built on Mark Minervini's **Specific Entry Point Analysis (SEPA)**
and the **Volatility Contraction Pattern (VCP)**. It uses only free, public data:

| Data | Source |
|---|---|
| Daily OHLCV, split/dividend adjusted | Yahoo Finance via [`yfinance`](https://github.com/ranaroussi/yfinance) |
| Quarterly EPS and sales, sector, next earnings date | Yahoo Finance via `yfinance` |
| US ticker universe (NASDAQ, NYSE, NYSE American, Cboe) | [NASDAQ Trader symbol directory](https://www.nasdaqtrader.com/trader.aspx?id=symboldirdefs) |
| S&P 500 / 400 / 600 members (optional universes) | Wikipedia constituent tables |

## What it checks

The screen runs in this order. Each stage only sees the stocks that passed the one before.

1. **Liquidity.** Price ≥ $10, 50-day average volume ≥ 200k shares and ≥ $5M a day.
2. **Relative strength (RS) rating, 1–99.** Weighted 12-month return in the IBD style
   (`0.4·3m + 0.2·6m + 0.2·9m + 0.2·12m`), ranked as a percentile against every stock in the universe.
3. **Trend Template.** All 8 of Minervini's criteria:
   1. Price above the 150-day and 200-day moving averages
   2. 150-day MA above the 200-day MA
   3. 200-day MA rising for at least 1 month (the report also counts how many of the last 5 months it rose)
   4. 50-day MA above the 150-day and 200-day MAs
   5. Price above the 50-day MA
   6. Price at least 30% above its 52-week low
   7. Price within 25% of its 52-week high
   8. RS rating ≥ 70
4. **VCP detection** (`sepa/vcp.py`):
   - **Base.** Finds the base high (≥ 3 weeks old, within ~32 weeks).
   - **Contractions.** Traces swing highs and lows with a zig-zag sized to the stock's own ATR.
     Undercut lows are folded into the deeper move, and wiggles in the lower half of the base are dropped.
     What remains is the latest run of progressively tighter contractions.
   - **Rules.** A valid VCP has:
     - 2–6 contractions;
     - a first pullback of 40% or less;
     - a final contraction of 12% or less, and at most 60% of the first;
     - higher lows;
     - volume in the final contraction below both the 50-day average and the first contraction's volume.
   - **Pivot.** The high of the last contraction. The status is one of:
     - `breakout`: above the pivot on volume ≥ 1.4× the 50-day average;
     - `above_pivot`: above the pivot without that volume;
     - `near_pivot`: up to 10% below the pivot;
     - `extended`: more than 5% above the pivot;
     - `below_pivot`: more than 10% below the pivot;
     - `no_base`: the stock is still at new highs.
   - **Score, 0–100.** Rates contraction count, final tightness, volume dry-up, closeness to the pivot,
     and the 10-day trading range. It is used to rank setups and near misses.
5. **Fundamentals** (Trend Template passers only):
   - **Growth.** Latest-quarter EPS and sales growth, year over year. The SEPA bar is EPS ≥ +25% and sales ≥ +20%.
   - **Trends.** Whether EPS growth is accelerating and the net margin is expanding.
   - **Profile.** Sector, industry and market cap.
   - **Earnings date.** The next one is flagged when it is within 2 weeks.

   Fundamentals are *reported*, not used as a hard filter, because Yahoo's quarterly data is sometimes incomplete.
6. **Market condition.**
   - **Index trends.** SPY, QQQ and IWM against their 21/50/200-day averages.
   - **Distribution days.** The count over the last 25 sessions.
   - **Breadth.** The share of stocks above their 50-day and 200-day averages, and new highs vs new lows.

   Minervini buys breakouts only in a healthy market. The report says plainly when the market is in a correction.

## Output

Each run writes to `reports/`:

| File | Contents |
|---|---|
| `YYYY-MM-DD/report.md` | Market, actionable VCPs, watch list (with why each misses), every Trend Template stock |
| `YYYY-MM-DD/vcp_candidates.csv` | Every Trend Template stock with its VCP analysis and fundamentals |
| `YYYY-MM-DD/trend_template.csv` | Every liquid stock with each of the 8 criteria |
| `latest.md`, `latest.json` | The most recent run |
| `latest.html` | A self-contained page with charts of each setup (not committed: regenerated each run) |

## Run it

```bash
cd sepa_screener
pip install -r requirements.txt
python run_screener.py                      # all US-listed stocks, ~5,000 symbols, 10–15 min
python run_screener.py --universe sp500     # about 1 min
python run_screener.py --universe NVDA,CRWD,ANET --no-fundamentals
python run_screener.py --help               # every threshold can be changed
python -m pytest -q tests                   # synthetic-data tests for the Trend Template, RS and VCP logic
```

Run it after the US close (data for the day settles about 30–60 minutes after 4 pm ET).
Prices are cached in `.cache/` per day, so re-running the same day is quick.

## Daily automation

Two options; use one.

- **Claude scheduled task** (set up in the Claude session that built this). It runs every weekday evening,
  commits `reports/` to the `claude/modest-turing-ohssz0` branch, updates the published HTML page, and sends
  a push notification naming the day's setups.
- **GitHub Actions** (`.github/workflows/sepa-screener.yml`). It runs at 22:17 UTC on weekdays, posts the report
  as the job summary, uploads `latest.html` as a build artifact, and commits `reports/`.
  GitHub only runs scheduled workflows from the default branch, so this takes effect once it is merged to `main`.
  You can also start it by hand from the Actions tab.

## Caveats

- **Data quality.** Yahoo Finance data is free and unofficial. Occasional gaps, bad ticks and missing quarterly
  numbers happen. The screener skips what it can't read rather than failing.
- **Pattern detection is a filter, not a verdict.** Every chart needs a human look before a trade.
  The watch list shows near misses and the exact rule each one fails, so you can loosen a threshold if you disagree.
- **Nothing here is investment advice.**
