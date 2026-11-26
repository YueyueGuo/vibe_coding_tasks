"""SEPA fundamentals: quarterly EPS and sales growth, plus profile and next earnings date.

Only the stocks that pass the Trend Template are looked up here, which keeps
the number of Yahoo Finance requests small.
"""
from __future__ import annotations

import logging
import random
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
import yfinance as yf

from .config import FundamentalConfig

log = logging.getLogger(__name__)

EPS_ROWS = ("Diluted EPS", "Basic EPS")
REV_ROWS = ("Total Revenue", "Operating Revenue")
NI_ROWS = ("Net Income", "Net Income Common Stockholders")


def _retry(fn, tries: int = 4, base: float = 3.0):
    """Yahoo rate-limits bursts of requests; back off and try again."""
    for i in range(tries):
        try:
            return fn()
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(base * 2 ** i + random.random() * base)


def _quarterly(t):
    q = t.quarterly_income_stmt
    if q is None or q.empty:
        raise ValueError("empty statement")
    return q


def _row(stmt: pd.DataFrame, names) -> pd.Series | None:
    for n in names:
        if n in stmt.index:
            s = pd.to_numeric(stmt.loc[n], errors="coerce").dropna()
            if len(s):
                s.index = pd.to_datetime(s.index)
                return s.sort_index(ascending=False)
    return None


def _yoy(s: pd.Series | None, k: int = 0) -> float | None:
    """YoY growth of the k-th most recent quarter vs the same quarter a year earlier."""
    if s is None or len(s) <= k:
        return None
    d0, v0 = s.index[k], s.iloc[k]
    prior = s[(s.index <= d0 - pd.Timedelta(days=330)) & (s.index >= d0 - pd.Timedelta(days=400))]
    if prior.empty:
        return None
    v1 = prior.iloc[0]
    if v1 == 0 or np.isnan(v1):
        return None
    if v1 < 0:  # turnaround: report growth as None but flag via sign
        return np.inf if v0 > 0 else None
    return float(v0 / v1 - 1)


def _pct(x):
    if x is None:
        return None
    if np.isinf(x):
        return "turnaround"
    return round(x * 100, 1)


def fetch_one(ticker: str, cfg: FundamentalConfig) -> dict:
    out: dict = {"ticker": ticker}
    t = yf.Ticker(ticker)
    try:
        q = _retry(lambda: _quarterly(t))
        eps, rev, ni = _row(q, EPS_ROWS), _row(q, REV_ROWS), _row(q, NI_ROWS)
        g0, g1 = _yoy(eps, 0), _yoy(eps, 1)
        r0, r1 = _yoy(rev, 0), _yoy(rev, 1)
        out.update(
            eps_q=round(float(eps.iloc[0]), 2) if eps is not None else None,
            eps_qtr=str(eps.index[0].date()) if eps is not None else None,
            eps_growth_q=_pct(g0),
            eps_growth_prev_q=_pct(g1),
            rev_growth_q=_pct(r0),
            rev_growth_prev_q=_pct(r1),
        )
        if ni is not None and rev is not None:
            m = (ni / rev).dropna().sort_index(ascending=False)
            out["net_margin_q"] = round(float(m.iloc[0]) * 100, 1) if len(m) else None
            out["margin_expanding"] = bool(len(m) >= 2 and m.iloc[0] > m.iloc[1])
        eps_ok = None if g0 is None else bool(g0 >= cfg.min_eps_growth)   # inf (turnaround) passes
        rev_ok = None if r0 is None else bool(r0 >= cfg.min_revenue_growth)
        accel = None
        if g0 is not None and g1 is not None and not np.isinf(g0) and not np.isinf(g1):
            accel = bool(g0 > g1)
        out["eps_accelerating"] = accel
        out["fund_pass"] = None if eps_ok is None or rev_ok is None else (eps_ok and rev_ok)
    except Exception as exc:
        log.debug("fundamentals %s: %s", ticker, exc)
        out["fund_pass"] = None
    try:
        info = _retry(t.get_info) or {}
        out["name"] = info.get("longName") or info.get("shortName")
        out["sector"] = info.get("sector")
        out["industry"] = info.get("industry")
        mc = info.get("marketCap")
        out["market_cap_b"] = round(mc / 1e9, 2) if mc else None
        # earningsTimestamp is often the *last* report; keep the first date still ahead.
        today = pd.Timestamp.now().normalize()
        dates = sorted(pd.Timestamp(info[k], unit="s").normalize()
                       for k in ("earningsTimestampStart", "earningsTimestamp", "earningsTimestampEnd")
                       if info.get(k))
        future = [d for d in dates if d >= today - pd.Timedelta(days=1)]
        out["next_earnings"] = str(future[0].date()) if future else None
    except Exception as exc:
        log.debug("info %s: %s", ticker, exc)
    return out


def fetch_fundamentals(tickers: list[str], cfg: FundamentalConfig) -> pd.DataFrame:
    if not tickers:
        return pd.DataFrame(columns=["ticker"])
    with ThreadPoolExecutor(max_workers=cfg.workers) as ex:
        rows = list(ex.map(lambda t: fetch_one(t, cfg), tickers))
    return pd.DataFrame(rows)
