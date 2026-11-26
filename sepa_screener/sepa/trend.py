"""Minervini Trend Template, relative-strength rating, and liquidity screen."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import LiquidityConfig, TrendTemplateConfig

TT_CRITERIA = {
    "c1_price_above_150_200": "Price above the 150-day and 200-day SMA",
    "c2_150_above_200": "150-day SMA above the 200-day SMA",
    "c3_200_rising": "200-day SMA trending up for at least 1 month",
    "c4_50_above_150_200": "50-day SMA above the 150-day and 200-day SMA",
    "c5_price_above_50": "Price above the 50-day SMA",
    "c6_above_52w_low": "Price at least 30% above its 52-week low",
    "c7_near_52w_high": "Price within 25% of its 52-week high",
    "c8_rs_rating": "Relative-strength rating of 70 or higher",
}


def atr_pct(df: pd.DataFrame, n: int = 20) -> float:
    h, l, c = df["High"], df["Low"], df["Close"]
    tr = pd.concat([h - l, (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    return float(tr.tail(n).mean() / c.iloc[-1])


def rs_raw_score(close: pd.Series) -> float:
    """IBD-style weighted 12-month performance (latest quarter counts double)."""
    if len(close) < 253:
        return np.nan
    c = close.to_numpy()
    r = lambda n: c[-1] / c[-1 - n] - 1.0  # noqa: E731
    return 0.4 * r(63) + 0.2 * r(126) + 0.2 * r(189) + 0.2 * r(252)


def rs_ratings(prices: dict[str, pd.DataFrame]) -> pd.Series:
    """Percentile-rank the raw RS score across the universe -> 1..99."""
    raw = pd.Series({t: rs_raw_score(df["Close"]) for t, df in prices.items()}).dropna()
    if raw.empty:
        return raw
    pct = raw.rank(pct=True, method="average")
    return np.clip(np.ceil(pct * 99), 1, 99).astype(int)


def passes_liquidity(df: pd.DataFrame, cfg: LiquidityConfig) -> bool:
    tail = df.tail(50)
    if len(tail) < 20:
        return False
    close = df["Close"].iloc[-1]
    avg_vol = tail["Volume"].mean()
    return bool(
        close >= cfg.min_price
        and avg_vol >= cfg.min_avg_volume
        and (tail["Close"] * tail["Volume"]).mean() >= cfg.min_avg_dollar_volume
    )


def trend_template(df: pd.DataFrame, rs: float | None, cfg: TrendTemplateConfig) -> dict | None:
    """Evaluate the 8 Trend Template criteria. Returns None if there is not enough history."""
    need = 200 + cfg.sma_200_rising_days
    if len(df) < need:
        return None
    close = df["Close"]
    sma50 = close.rolling(50).mean()
    sma150 = close.rolling(150).mean()
    sma200 = close.rolling(200).mean()
    price = close.iloc[-1]
    s50, s150, s200 = sma50.iloc[-1], sma150.iloc[-1], sma200.iloc[-1]
    s200_prev = sma200.iloc[-1 - cfg.sma_200_rising_days]
    year = df.tail(252)
    low52, high52 = year["Low"].min(), year["High"].max()
    rs_val = float(rs) if rs is not None and not pd.isna(rs) else np.nan

    checks = {
        "c1_price_above_150_200": price > s150 and price > s200,
        "c2_150_above_200": s150 > s200,
        "c3_200_rising": s200 > s200_prev,
        "c4_50_above_150_200": s50 > s150 and s50 > s200,
        "c5_price_above_50": price > s50,
        "c6_above_52w_low": price >= (1 + cfg.min_above_52w_low) * low52,
        "c7_near_52w_high": price >= (1 - cfg.max_below_52w_high) * high52,
        "c8_rs_rating": bool(rs_val >= cfg.min_rs_rating),
    }
    checks = {k: bool(v) for k, v in checks.items()}
    # How many of the last 5 months has the 200-day been rising? (Minervini prefers 4-5)
    months_rising = int(sum(sma200.iloc[-1 - 21 * i] > sma200.iloc[-1 - 21 * (i + 1)]
                            for i in range(5) if len(sma200.dropna()) > 21 * (i + 1)))
    return {
        **checks,
        "tt_score": sum(checks.values()),
        "tt_pass": all(checks.values()),
        "close": round(float(price), 2),
        "sma50": round(float(s50), 2),
        "sma150": round(float(s150), 2),
        "sma200": round(float(s200), 2),
        "sma200_months_rising": months_rising,
        "low_52w": round(float(low52), 2),
        "high_52w": round(float(high52), 2),
        "pct_above_52w_low": round(float(price / low52 - 1) * 100, 1),
        "pct_below_52w_high": round(float(1 - price / high52) * 100, 1),
        "rs_rating": None if np.isnan(rs_val) else int(rs_val),
    }
