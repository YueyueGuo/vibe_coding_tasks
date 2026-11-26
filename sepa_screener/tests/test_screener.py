import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sepa.config import TrendTemplateConfig, VCPConfig  # noqa: E402
from sepa.trend import rs_ratings, rs_raw_score, trend_template  # noqa: E402
from sepa.vcp import _merge_lower_lows, detect_vcp, zigzag  # noqa: E402


def make_df(points, vol_points=None, seed=0, spread=0.006):
    """Piecewise-linear close path through (day, price) points, with small noise and H/L around it."""
    rng = np.random.default_rng(seed)
    days = np.arange(points[-1][0] + 1)
    close = np.interp(days, [p[0] for p in points], [p[1] for p in points])
    close = close * (1 + rng.normal(0, 0.002, len(days)))
    high = close * (1 + spread)
    low = close * (1 - spread)
    if vol_points is None:
        vol = np.full(len(days), 1_000_000.0)
    else:
        vol = np.interp(days, [p[0] for p in vol_points], [p[1] for p in vol_points])
    idx = pd.bdate_range("2024-01-01", periods=len(days))
    return pd.DataFrame({"Open": close, "High": high, "Low": low, "Close": close, "Volume": vol}, index=idx)


def vcp_df():
    """Up-trend 50 -> 100, then a base with contractions of ~25%, ~12%, ~5% on falling volume."""
    pts = [(0, 50), (300, 100),           # advance
           (310, 75), (322, 97),          # contraction 1: 25%
           (330, 85.5), (340, 95),        # contraction 2: ~12%
           (345, 90.3), (352, 94.5),      # contraction 3: ~5%
           (356, 93.4)]                   # tight, just under the pivot
    vols = [(0, 1.5e6), (300, 1.5e6), (310, 2.5e6), (322, 1.2e6), (330, 1.0e6),
            (340, 0.8e6), (345, 0.6e6), (356, 0.45e6)]
    return make_df(pts, vols)


def test_zigzag_finds_swings():
    df = vcp_df()
    h, l = df["High"].to_numpy(), df["Low"].to_numpy()
    pivots, _ = zigzag(h, l, 300, 0.04)
    kinds = "".join(p[1] for p in pivots)
    assert kinds.startswith("HLHLHL")


def test_merge_lower_lows_folds_undercut_contraction():
    high = np.array([100, 95, 96, 90, 92, 80, 85.0])
    low = np.array([99, 94, 90, 89, 91, 79, 84.0])
    legs = [(0, 2, True), (4, 5, True)]    # second leg undercuts the first leg's low
    assert _merge_lower_lows(legs, high, low) == [(0, 5, True)]


def test_detects_textbook_vcp():
    v = detect_vcp(vcp_df(), VCPConfig())
    assert v.is_vcp, v.reasons
    # 25% / 12% / 5%, plus the ~2% pullback still in progress off the last swing high
    assert v.num_contractions == 4
    d = v.depths_pct
    assert 22 <= d[0] <= 28 and 9 <= d[1] <= 15 and 3 <= d[2] <= 8 and d[3] < 3
    assert v.status == "near_pivot" and v.actionable
    assert v.volume_dryup_ratio < 1
    assert v.pivot == pytest.approx(94.5 * 1.006, rel=0.01)


def test_breakout_needs_volume():
    df = vcp_df()
    pivot = detect_vcp(df, VCPConfig()).pivot
    last = df.index[-1]
    df.loc[last, ["Close", "High"]] = [pivot * 1.02, pivot * 1.03]
    df.loc[last, "Volume"] = 3e6
    assert detect_vcp(df, VCPConfig()).status == "breakout"
    df.loc[last, "Volume"] = 0.5e6
    assert detect_vcp(df, VCPConfig()).status == "above_pivot"


def test_expanding_volatility_is_not_vcp():
    pts = [(0, 50), (300, 100), (310, 94), (320, 99), (332, 82), (345, 97), (356, 90)]
    v = detect_vcp(make_df(pts), VCPConfig())
    assert not v.is_vcp


def test_stock_at_new_highs_has_no_base():
    v = detect_vcp(make_df([(0, 50), (356, 110)]), VCPConfig())
    assert v.status == "no_base" and not v.is_vcp


def test_trend_template_pass_and_fail():
    up = make_df([(0, 40), (250, 70), (356, 100)])
    tt = trend_template(up, 90, TrendTemplateConfig())
    assert tt["tt_pass"], tt
    down = make_df([(0, 100), (356, 50)])
    tt = trend_template(down, 10, TrendTemplateConfig())
    assert not tt["tt_pass"] and tt["tt_score"] <= 2
    assert not trend_template(up, 60, TrendTemplateConfig())["c8_rs_rating"]


def test_rs_rating_ranks_leaders_high():
    prices = {f"S{i}": make_df([(0, 50), (300, 50 + i * 5)], seed=i) for i in range(20)}
    rs = rs_ratings(prices)
    assert rs["S19"] == 99 and rs["S0"] <= 10
    assert np.isnan(rs_raw_score(prices["S1"]["Close"].tail(100)))


def test_summary_headline_and_names():
    from types import SimpleNamespace

    from sepa.summary import build_summary, short_name

    assert short_name("Paychex, Inc.") == "Paychex"
    assert short_name("UNIVERSAL INSURANCE HOLDINGS") == "Universal Insurance Holdings"
    mkt = {"above_50sma": False, "above_200sma": False, "distribution_days_25": 8, "trend": "Correction / downtrend"}
    act = pd.DataFrame([{"ticker": "AAA", "name": "Alpha Corp.", "status": "breakout", "pivot": 10.0,
                         "dist_to_pivot_pct": 1.0, "depths_pct": "20/9/4", "score": 80, "breakout_volume_ratio": 2.0,
                         "fund_pass": True, "sector": "Technology", "next_earnings": None}])
    r = SimpleNamespace(vcp=act, trend=pd.DataFrame({"tt_pass": [True, False]}), liquid=2,
                        market=[{**mkt, "index": "SPY (S&P 500)"}, {**mkt, "index": "QQQ (Nasdaq 100)"}],
                        breadth={}, as_of=pd.Timestamp("2026-11-24"))
    s = build_summary(r, act)
    assert "correction" in s["headline"] and "watch list" in s["headline"]
    text = dict(s["points"])
    assert "**AAA** (Alpha)" in text["Best setups"]
    assert "Broke out today" in text["Breakouts"]
    assert "strongest candidate" in text["Earnings growth"]
