"""Download daily OHLCV history from Yahoo Finance (via yfinance), with a local cache."""
from __future__ import annotations

import logging
import pickle
import time
from pathlib import Path

import pandas as pd
import yfinance as yf

log = logging.getLogger(__name__)

FIELDS = ["Open", "High", "Low", "Close", "Volume"]


def _split(raw: pd.DataFrame, tickers: list[str]) -> dict[str, pd.DataFrame]:
    out: dict[str, pd.DataFrame] = {}
    if raw is None or raw.empty:
        return out
    if not isinstance(raw.columns, pd.MultiIndex):  # single ticker, flat columns
        raw = pd.concat({tickers[0]: raw}, axis=1)
    level0 = set(raw.columns.get_level_values(0))
    for t in tickers:
        if t not in level0:
            continue
        df = raw[t]
        if not set(FIELDS).issubset(df.columns):
            continue
        df = df[FIELDS].dropna(subset=["Close", "High", "Low"])
        df = df[df["Close"] > 0]
        if len(df):
            df.index = pd.to_datetime(df.index).tz_localize(None)
            out[t] = df.astype(float)
    return out


def download_history(
    tickers: list[str],
    period: str = "2y",
    batch_size: int = 200,
    cache_dir: Path | None = None,
    retries: int = 1,
) -> dict[str, pd.DataFrame]:
    """Return {ticker: DataFrame[Open, High, Low, Close, Volume]} (split/dividend adjusted)."""
    cache_file = None
    if cache_dir is not None:
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_file = cache_dir / f"prices_{pd.Timestamp.now(tz='America/New_York'):%Y-%m-%d}_{period}.pkl"
        if cache_file.exists():
            cached: dict[str, pd.DataFrame] = pickle.loads(cache_file.read_bytes())
            missing = [t for t in tickers if t not in cached]
            if not missing:
                log.info("Loaded %d tickers from cache %s", len(cached), cache_file.name)
                return {t: cached[t] for t in tickers if t in cached}
    data: dict[str, pd.DataFrame] = {}
    todo = list(dict.fromkeys(tickers))
    for attempt in range(retries + 1):
        if not todo:
            break
        if attempt:
            log.info("Retrying %d tickers (attempt %d)", len(todo), attempt + 1)
            time.sleep(5 * attempt)
        for i in range(0, len(todo), batch_size):
            batch = todo[i : i + batch_size]
            try:
                raw = yf.download(
                    batch,
                    period=period,
                    interval="1d",
                    auto_adjust=True,
                    group_by="ticker",
                    threads=True,
                    progress=False,
                )
                data.update(_split(raw, batch))
            except Exception as exc:  # network hiccup: retry whole batch later
                log.warning("Batch %d failed: %s", i // batch_size, exc)
            log.info("Downloaded %d/%d", min(i + batch_size, len(todo)), len(todo))
        todo = [t for t in todo if t not in data]
    if todo:
        log.info("No data for %d tickers (delisted / no history)", len(todo))
    if cache_file is not None:
        cache_file.write_bytes(pickle.dumps(data))
    return data
