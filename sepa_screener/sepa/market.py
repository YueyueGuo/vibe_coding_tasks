"""General market health. Minervini buys breakouts only when the market itself is in an uptrend."""
from __future__ import annotations

import pandas as pd


def index_health(df: pd.DataFrame, name: str) -> dict:
    c, v = df["Close"], df["Volume"]
    ema21 = c.ewm(span=21, adjust=False).mean()
    sma50, sma200 = c.rolling(50).mean(), c.rolling(200).mean()
    # Distribution day: index down >= 0.2% on higher volume than the prior session (last 25 sessions).
    chg = c.pct_change()
    dist = ((chg <= -0.002) & (v > v.shift())).tail(25).sum()
    price = c.iloc[-1]
    above50, above200 = price > sma50.iloc[-1], price > sma200.iloc[-1]
    golden = sma50.iloc[-1] > sma200.iloc[-1]
    rising200 = sma200.iloc[-1] > sma200.iloc[-22]
    if above50 and above200 and golden and dist <= 5:
        trend = "Confirmed uptrend"
    elif above200 and (golden or rising200):
        trend = "Uptrend under pressure"
    else:
        trend = "Correction / downtrend"
    return {
        "index": name,
        "close": round(float(price), 2),
        "chg_1d_pct": round(float(chg.iloc[-1]) * 100, 2),
        "above_21ema": bool(price > ema21.iloc[-1]),
        "above_50sma": bool(above50),
        "above_200sma": bool(above200),
        "sma50_above_200": bool(golden),
        "distribution_days_25": int(dist),
        "trend": trend,
    }


def breadth(prices: dict[str, pd.DataFrame]) -> dict:
    a50 = a200 = n = hi = lo = 0
    for df in prices.values():
        if len(df) < 252:
            continue
        c = df["Close"]
        n += 1
        a50 += c.iloc[-1] > c.tail(50).mean()
        a200 += c.iloc[-1] > c.tail(200).mean()
        hi += df["High"].iloc[-1] >= df["High"].tail(252).max()
        lo += df["Low"].iloc[-1] <= df["Low"].tail(252).min()
    if not n:
        return {}
    return {
        "stocks": n,
        "pct_above_50sma": round(100 * a50 / n, 1),
        "pct_above_200sma": round(100 * a200 / n, 1),
        "new_52w_highs": int(hi),
        "new_52w_lows": int(lo),
    }
