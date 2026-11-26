"""End-to-end SEPA screen: universe -> prices -> liquidity -> RS -> Trend Template -> VCP -> fundamentals."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from .config import ScreenerConfig
from .data import download_history
from .fundamentals import fetch_fundamentals
from .market import breadth, index_health
from .trend import TT_CRITERIA, passes_liquidity, rs_ratings, trend_template
from .universe import NAMES, load_universe
from .vcp import VCPResult, detect_vcp

log = logging.getLogger(__name__)

INDEXES = {"SPY": "S&P 500", "QQQ": "Nasdaq 100", "IWM": "Russell 2000"}


@dataclass
class ScreenResult:
    as_of: pd.Timestamp
    universe_size: int
    downloaded: int
    liquid: int
    market: list[dict]
    breadth: dict
    trend: pd.DataFrame                    # every liquid stock with its Trend Template checks
    vcp: pd.DataFrame                      # Trend Template passers with VCP analysis (+ fundamentals)
    vcp_details: dict[str, VCPResult] = field(default_factory=dict)
    prices: dict[str, pd.DataFrame] = field(default_factory=dict, repr=False)


def run_screen(cfg: ScreenerConfig, cache_dir: Path | None = None) -> ScreenResult:
    tickers = load_universe(cfg.universe)
    log.info("Universe %s: %d tickers", cfg.universe, len(tickers))
    all_syms = list(dict.fromkeys(tickers + list(INDEXES)))
    prices = download_history(all_syms, cfg.history_period, cfg.batch_size, cache_dir)
    idx_prices = {k: prices[k] for k in INDEXES if k in prices}
    stocks = {t: df for t, df in prices.items() if t in set(tickers) and len(df) >= 60}

    # Most common last bar date = the session being screened; drop stale/halted tickers.
    last_dates = pd.Series({t: df.index[-1] for t, df in stocks.items()})
    as_of = last_dates.mode().iloc[0]
    stocks = {t: df for t, df in stocks.items() if df.index[-1] >= as_of - pd.Timedelta(days=5)}

    rs = rs_ratings(stocks)       # ranked against the whole universe, not just liquid names
    liquid = {t: df for t, df in stocks.items() if passes_liquidity(df, cfg.liquidity)}
    log.info("As of %s: %d with data, %d pass liquidity", as_of.date(), len(stocks), len(liquid))

    rows = []
    for t, df in liquid.items():
        tt = trend_template(df, rs.get(t), cfg.trend)
        if tt is not None:
            rows.append({"ticker": t, **tt})
    trend = pd.DataFrame(rows)
    if trend.empty:
        trend = pd.DataFrame(columns=["ticker", "tt_pass", "tt_score", "rs_rating", *TT_CRITERIA])
    trend = trend.sort_values(["tt_score", "rs_rating"], ascending=False, na_position="last")
    passers = trend[trend["tt_pass"]]["ticker"].tolist()
    log.info("%d stocks pass the Trend Template", len(passers))

    details: dict[str, VCPResult] = {}
    vrows = []
    for t in passers:
        v = detect_vcp(liquid[t], cfg.vcp)
        details[t] = v
        vrows.append({"ticker": t, **v.summary()})
    vcp = pd.DataFrame(vrows)
    if not vcp.empty:
        vcp = trend[["ticker", "close", "rs_rating", "pct_below_52w_high", "sma200_months_rising"]].merge(vcp, on="ticker")
        if cfg.fundamentals.enabled:
            log.info("Fetching fundamentals for %d stocks", len(passers))
            fund = fetch_fundamentals(passers, cfg.fundamentals)
            vcp = vcp.merge(fund, on="ticker", how="left")
        if "name" not in vcp.columns:
            vcp["name"] = None
        vcp["name"] = [n if isinstance(n, str) and n else NAMES.get(t) for t, n in zip(vcp["ticker"], vcp["name"])]
        vcp = vcp.sort_values(["actionable", "is_vcp", "score", "rs_rating"], ascending=False)

    return ScreenResult(
        as_of=as_of,
        universe_size=len(tickers),
        downloaded=len(stocks),
        liquid=len(liquid),
        market=[index_health(idx_prices[k], f"{k} ({v})") for k, v in INDEXES.items() if k in idx_prices and len(idx_prices[k]) > 200],
        breadth=breadth(stocks),
        trend=trend,
        vcp=vcp,
        vcp_details=details,
        prices=liquid,
    )
