#!/usr/bin/env python3
"""Run the SEPA / VCP screen and write the daily report.

Examples:
    python run_screener.py                       # all US-listed stocks (default)
    python run_screener.py --universe sp500      # S&P 500 only (fast)
    python run_screener.py --universe NVDA,AAPL,CRWD --no-fundamentals
    python run_screener.py --min-rs 80 --max-final-depth 0.08
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from sepa.config import ScreenerConfig  # noqa: E402
from sepa.report import write_reports  # noqa: E402
from sepa.screen import run_screen  # noqa: E402


def parse_args(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--universe", default="us",
                   help="us | sp500 | sp1500 | file:<path> | comma-separated tickers (default: us)")
    p.add_argument("--out", type=Path, default=HERE / "reports", help="report directory")
    p.add_argument("--cache", type=Path, default=HERE / ".cache", help="price cache directory ('' to disable)")
    p.add_argument("--no-fundamentals", action="store_true", help="skip EPS / sales lookups")
    p.add_argument("--no-charts", action="store_true")
    p.add_argument("--min-price", type=float)
    p.add_argument("--min-dollar-volume", type=float, help="50-day average $ volume")
    p.add_argument("--min-rs", type=int, help="minimum RS rating for the Trend Template (default 70)")
    p.add_argument("--max-final-depth", type=float, help="max depth of the last contraction (default 0.12)")
    p.add_argument("--max-first-depth", type=float, help="max depth of the first contraction (default 0.40)")
    p.add_argument("--max-volume-dryup", type=float, help="final-leg volume / 50d avg must be below this (default 1.0)")
    p.add_argument("--max-dist-below-pivot", type=float, help="how far below the pivot to list setups (default 0.10)")
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args(argv)


def build_config(a) -> ScreenerConfig:
    cfg = ScreenerConfig(universe=a.universe)
    cfg.fundamentals.enabled = not a.no_fundamentals
    cfg.charts = not a.no_charts
    for attr, target, field in [
        ("min_price", cfg.liquidity, "min_price"),
        ("min_dollar_volume", cfg.liquidity, "min_avg_dollar_volume"),
        ("min_rs", cfg.trend, "min_rs_rating"),
        ("max_final_depth", cfg.vcp, "max_final_depth"),
        ("max_first_depth", cfg.vcp, "max_first_depth"),
        ("max_volume_dryup", cfg.vcp, "max_volume_dryup"),
        ("max_dist_below_pivot", cfg.vcp, "max_dist_below_pivot"),
    ]:
        val = getattr(a, attr)
        if val is not None:
            setattr(target, field, val)
    return cfg


def main(argv=None) -> int:
    a = parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if a.verbose else logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")
    for noisy in ("yfinance", "urllib3", "peewee", "matplotlib"):
        logging.getLogger(noisy).setLevel(logging.CRITICAL)
    cfg = build_config(a)
    t0 = time.time()
    result = run_screen(cfg, cache_dir=a.cache if str(a.cache) else None)
    paths = write_reports(result, a.out, charts=cfg.charts, max_charts=cfg.max_charts)
    summary = json.loads((a.out / "latest.json").read_text())
    logging.info("Done in %.0fs. Report: %s", time.time() - t0, paths["markdown"])
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
