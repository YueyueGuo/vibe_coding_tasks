"""Volatility Contraction Pattern (VCP) detection.

How a base is read, following Minervini's description of the VCP:

1. Base high: the highest high of the look-back window (`max_base_days`).
   It has to be at least `min_base_days` old, or the stock is still at new highs
   and there is no base yet.
2. Contractions: from the base high to yesterday, a zig-zag of swing highs
   and lows is traced. The minimum swing size scales with the stock's own
   volatility (`max(zigzag_min_pct, zigzag_atr_mult * ATR%)`). Each move from a
   swing high to the next swing low is one contraction. If price is pulling
   back right now, that unfinished move is the final contraction. Then:
   * a swing low that is later undercut is folded into the deeper move (the
     earlier contraction never really ended), so the lows left are rising;
   * pullbacks that start in the lower half of the base are wiggles in the
     recovery off the lows, not contractions, and are dropped;
   * only the latest run of progressively tighter contractions is kept.
     Older, looser swings on the left side are reported as `left_side_swings`.
3. A valid VCP has:
   * 2 to 6 contractions, the last one at most `max_final_to_first` of the first;
   * a first pullback no deeper than `max_first_depth`, and a whole base no
     deeper than `max_base_depth`;
   * a final contraction of `max_final_depth` or less;
   * volume drying up: the final contraction trades below the 50-day average
     and below the first contraction's volume;
   * higher lows: the last low is above the first contraction's low.
4. The pivot (buy point) is the high of the last contraction. Today's bar is
   left out when the base is traced, so a breakout today is measured against
   the pivot that held before it.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

import numpy as np
import pandas as pd

from .config import VCPConfig


@dataclass
class Contraction:
    start: str
    end: str
    high: float
    low: float
    depth: float          # fraction, e.g. 0.12 = 12%
    bars: int
    avg_volume: float
    complete: bool


@dataclass
class VCPResult:
    is_vcp: bool = False
    actionable: bool = False
    status: str = "no_base"  # breakout | above_pivot | near_pivot | below_pivot | extended | no_base
    score: float = 0.0
    pivot: float | None = None
    dist_to_pivot_pct: float | None = None
    base_start: str | None = None
    base_days: int = 0
    base_depth_pct: float | None = None
    num_contractions: int = 0
    left_side_swings: int = 0  # older, looser swings ignored before the tightening sequence
    depths_pct: list[float] = field(default_factory=list)
    final_depth_pct: float | None = None
    volume_dryup_ratio: float | None = None
    breakout_volume_ratio: float | None = None
    tightness_pct: float | None = None
    swing_threshold_pct: float | None = None
    contractions: list[Contraction] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)

    def summary(self) -> dict:
        d = asdict(self)
        d.pop("contractions")
        d["depths_pct"] = "/".join(f"{x:.0f}" for x in self.depths_pct)
        d["reasons"] = "; ".join(self.reasons)
        return d


def _lin(x: float, best: float, worst: float) -> float:
    """1.0 at `best`, 0.0 at `worst`, linear in between (works for either direction)."""
    if x is None or np.isnan(x):
        return 0.0
    t = (x - worst) / (best - worst)
    return float(min(1.0, max(0.0, t)))


def zigzag(high: np.ndarray, low: np.ndarray, start: int, thr: float):
    """Swing pivots starting from a swing high at `start`.

    Returns (pivots, tail) where pivots is a list of (index, 'H'|'L', price) for
    confirmed swings, and tail describes the unconfirmed leg in progress:
    ('down', low_idx, low_val) or ('up', high_idx, high_val).
    """
    n = len(high)
    pivots: list[tuple[int, str, float]] = [(start, "H", float(high[start]))]
    mode = "down"
    ext_i, ext_v = None, np.inf          # running extreme of the leg in progress
    for i in range(start + 1, n):
        if mode == "down":
            if high[i] > pivots[-1][2]:                 # made a higher high: move the swing high
                pivots[-1] = (i, "H", float(high[i]))
                ext_i, ext_v = None, np.inf
                continue
            if low[i] < ext_v:
                ext_i, ext_v = i, float(low[i])
            if ext_i is not None and i > ext_i and high[i] >= ext_v * (1 + thr):
                pivots.append((ext_i, "L", ext_v))
                mode, ext_i, ext_v = "up", i, float(high[i])
        else:
            if high[i] > ext_v:
                ext_i, ext_v = i, float(high[i])
            if i > ext_i and low[i] <= ext_v * (1 - thr):
                pivots.append((ext_i, "H", ext_v))
                mode, ext_i, ext_v = "down", i, float(low[i])
            elif low[i] < pivots[-1][2]:                # undercut the swing low: move it
                pivots[-1] = (i, "L", float(low[i]))
                ext_i, ext_v = i, float(high[i])
    return pivots, (mode, ext_i, ext_v)


def _legs(high: np.ndarray, low: np.ndarray, start: int, thr: float):
    """Swing-high -> swing-low legs of the base, plus the index of the latest swing high.

    Returns (legs, pivot_idx) with legs = [(high_idx, low_idx, complete), ...].
    """
    pivots, (mode, ext_i, _) = zigzag(high, low, start, thr)
    last = len(high) - 1
    legs: list[tuple[int, int, bool]] = []
    for k in range(len(pivots) - 1):
        if pivots[k][1] == "H" and pivots[k + 1][1] == "L":
            legs.append((pivots[k][0], pivots[k + 1][0], True))
    if mode == "down":                            # falling from the last swing high
        pivot_idx = pivots[-1][0]
    else:                                         # rallying off the last swing low
        pivot_idx = ext_i
    if pivot_idx < last and (not legs or legs[-1][0] != pivot_idx):
        l_idx = pivot_idx + 1 + int(np.argmin(low[pivot_idx + 1 :]))
        legs.append((pivot_idx, l_idx, False))   # pullback in progress = final contraction
    return legs, pivot_idx


def _merge_lower_lows(legs, high, low):
    """A swing low that is later undercut means that contraction never ended:
    fold it into the deeper one, so the contractions left have rising lows."""
    out: list[tuple[int, int, bool]] = []
    for h, l, comp in legs:
        while out and low[l] < low[out[-1][1]]:
            ph, _, _ = out.pop()
            if high[ph] >= high[h]:
                h = ph
        out.append((h, l, comp))
    return out


def _tightening_suffix(depths: list[float], tol: float) -> int:
    """Start index of the latest run of contractions that keep getting tighter."""
    s = len(depths) - 1
    while s > 0 and depths[s] <= depths[s - 1] * (1 + tol):
        s -= 1
    return s


def _contractions(df: pd.DataFrame, start: int, thr: float, tol: float, upper: float):
    high, low, vol = df["High"].to_numpy(), df["Low"].to_numpy(), df["Volume"].to_numpy()
    dates, last = df.index, len(df) - 1
    legs, pivot_idx = _legs(high, low, start, thr)
    legs = _merge_lower_lows(legs, high, low)
    # Pullbacks that start low in the base are wiggles in the recovery off the lows,
    # not contractions. A VCP tightens near the top of its base.
    b_hi, b_lo = float(high[start]), float(low[start:].min())
    floor = b_lo + upper * (b_hi - b_lo)
    legs = legs[:1] + [lg for lg in legs[1:] if high[lg[0]] >= floor]
    cs = []
    for h_i, l_i, complete in legs:
        hv, lv = float(high[h_i]), float(low[l_i])
        seg = vol[h_i + 1 : (l_i if complete else last) + 1]
        cs.append(Contraction(
            start=str(dates[h_i].date()), end=str(dates[l_i].date()),
            high=round(hv, 2), low=round(lv, 2), depth=max(0.0, 1 - lv / hv),
            bars=int(l_i - h_i), avg_volume=float(np.nanmean(seg)) if len(seg) else float(vol[h_i]),
            complete=complete,
        ))
    skipped = _tightening_suffix([c.depth for c in cs], tol) if cs else 0
    return cs[skipped:], skipped, pivot_idx


def detect_vcp(df: pd.DataFrame, cfg: VCPConfig) -> VCPResult:
    res = VCPResult()
    if len(df) < cfg.min_base_days + 60:
        res.reasons.append("not enough history")
        return res

    window = df.iloc[-(cfg.max_base_days + 1):]
    struct = window.iloc[:-1]                       # base structure excludes today
    today = window.iloc[-1]
    i0 = int(np.argmax(struct["High"].to_numpy()))
    base_high = float(struct["High"].iloc[i0])
    res.base_start = str(struct.index[i0].date())
    res.base_days = len(window) - 1 - i0
    avg_vol50 = float(df["Volume"].iloc[-51:-1].mean())  # pandas mean skips NaN

    if res.base_days < cfg.min_base_days:
        res.reasons.append(f"no base: high only {res.base_days} days ago")
        return res

    base = struct.iloc[i0:]
    tr = pd.concat([base["High"] - base["Low"],
                    (base["High"] - base["Close"].shift()).abs(),
                    (base["Low"] - base["Close"].shift()).abs()], axis=1).max(axis=1)
    atrp = float((tr / base["Close"]).iloc[1:].mean()) if len(base) > 1 else 0.0
    thr = max(cfg.zigzag_min_pct, cfg.zigzag_atr_mult * atrp)
    res.swing_threshold_pct = round(thr * 100, 1)

    real, skipped, pivot_idx = _contractions(struct, i0, thr, cfg.depth_tolerance, cfg.min_contraction_position)
    pivot = float(struct["High"].iloc[pivot_idx])
    res.contractions = real
    res.left_side_swings = skipped
    res.num_contractions = len(real)
    res.depths_pct = [round(c.depth * 100, 1) for c in real]
    res.pivot = round(pivot, 2)
    res.base_depth_pct = round((1 - float(base["Low"].min()) / base_high) * 100, 1)

    final = real[-1] if real else None
    res.final_depth_pct = round(final.depth * 100, 1) if final else None
    if final is not None and avg_vol50 > 0:
        h_idx = struct.index.get_loc(pd.Timestamp(final.start))
        leg = struct["Volume"].iloc[h_idx + 1 :]
        if len(leg) and leg.notna().any():
            res.volume_dryup_ratio = round(float(leg.mean()) / avg_vol50, 2)
    tight = df.tail(cfg.tight_days)
    res.tightness_pct = round((tight["High"].max() / tight["Low"].min() - 1) * 100, 1)
    res.breakout_volume_ratio = round(float(today["Volume"]) / avg_vol50, 2) if avg_vol50 > 0 else None

    # --- structural rules -------------------------------------------------
    r = res.reasons
    d = [c.depth for c in real]
    if not (cfg.min_contractions <= len(real) <= cfg.max_contractions):
        r.append(f"{len(real)} contraction(s), need {cfg.min_contractions}-{cfg.max_contractions}")
    if d and d[0] > cfg.max_first_depth:
        r.append(f"first pullback {d[0]:.0%} too deep")
    if res.base_depth_pct is not None and res.base_depth_pct / 100 > cfg.max_base_depth:
        r.append(f"base {res.base_depth_pct:.0f}% deep")
    if len(d) >= 2 and d[-1] > cfg.max_final_to_first * d[0]:
        r.append("final contraction not much tighter than the first")
    if final is not None and final.depth > cfg.max_final_depth:
        r.append(f"final contraction {final.depth:.0%} > {cfg.max_final_depth:.0%}")
    if len(real) >= 2 and real[-1].low <= real[0].low:
        r.append("no higher lows")
    if res.volume_dryup_ratio is None:
        r.append("no volume data")
    elif res.volume_dryup_ratio >= cfg.max_volume_dryup:
        r.append(f"no volume dry-up ({res.volume_dryup_ratio:.2f}x avg)")
    if len(real) >= 2 and real[-1].avg_volume >= real[0].avg_volume:
        r.append("volume not contracting")
    res.is_vcp = not r

    # --- where is price relative to the pivot? ------------------------------
    close = float(today["Close"])
    dist = close / pivot - 1
    res.dist_to_pivot_pct = round(dist * 100, 1)
    if dist > cfg.max_extension:
        res.status = "extended"
    elif dist > 0:
        strong = res.breakout_volume_ratio is not None and res.breakout_volume_ratio >= cfg.breakout_volume_mult
        res.status = "breakout" if strong else "above_pivot"
    elif dist >= -cfg.max_dist_below_pivot:
        res.status = "near_pivot"
    else:
        res.status = "below_pivot"
    res.actionable = res.is_vcp and res.status in ("breakout", "above_pivot", "near_pivot")

    # --- 0-100 quality score (also ranks near-misses) -----------------------
    n = len(real)
    s_count = {0: 0, 1: 5, 2: 15, 3: 22, 4: 25}.get(n, 22)
    s_final = 25 * _lin(final.depth if final else np.nan, 0.03, 0.15)
    s_vol = 20 * _lin(res.volume_dryup_ratio if res.volume_dryup_ratio is not None else np.nan, 0.4, 1.1)
    if res.status == "breakout":
        s_piv = 20.0
    elif res.status in ("above_pivot", "near_pivot"):
        s_piv = 20 * _lin(-dist if dist < 0 else 0.0, 0.0, cfg.max_dist_below_pivot)
    else:
        s_piv = 0.0
    s_tight = 10 * _lin(res.tightness_pct / 100, 0.04, 0.15)
    res.score = round(s_count + s_final + s_vol + s_piv + s_tight, 1)
    return res
