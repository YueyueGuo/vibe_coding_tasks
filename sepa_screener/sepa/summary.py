"""Plain-language summary of a scan: a one-line verdict plus a few findings.

Text uses **bold** for tickers; the HTML writer turns that into <b>.
"""
from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

_SUFFIX = re.compile(r",?\s+(?:Inc\.?|Incorporated|Corporation|Corp\.?|Co\.?|Company|plc|PLC|"
                     r"Ltd\.?|Limited|N\.V\.|S\.A\.|SE|AG|L\.P\.|LP|Trust)$")


def short_name(name) -> str:
    if not isinstance(name, str) or not name:
        return ""
    if name.isupper():
        name = name.title()
    prev = None
    while prev != name:
        prev, name = name, _SUFFIX.sub("", name).strip(" ,")
    return name


def _who(row) -> str:
    n = short_name(row.get("name"))
    return f"**{row['ticker']}** ({n})" if n else f"**{row['ticker']}**"


def _join(items: list[str]) -> str:
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + " and " + items[-1]


def _position(m: dict) -> str:
    a50, a200 = m["above_50sma"], m["above_200sma"]
    if a50 and a200:
        return "above its 50-day and 200-day averages"
    if a200:
        return "below its 50-day but above its 200-day average"
    if a50:
        return "above its 50-day but below its 200-day average"
    return "below its 50-day and 200-day averages"


def _previous(out_dir: Path, as_of: pd.Timestamp) -> pd.DataFrame | None:
    """The most recent earlier scan's VCP table, if one exists."""
    if out_dir is None or not out_dir.exists():
        return None
    days = sorted(p for p in out_dir.iterdir()
                  if p.is_dir() and re.fullmatch(r"\d{4}-\d{2}-\d{2}", p.name) and p.name < f"{as_of:%Y-%m-%d}")
    for d in reversed(days):
        f = d / "vcp_candidates.csv"
        if f.exists():
            try:
                return pd.read_csv(f)
            except Exception:
                return None
    return None


def _fund_ok(x) -> bool:
    return x is not None and not (isinstance(x, float) and np.isnan(x)) and bool(x) and str(x) != "False"


def build_summary(r, actionable: pd.DataFrame, out_dir: Path | None = None) -> dict:
    v = r.vcp
    n = len(actionable)
    n_tt = int(r.trend["tt_pass"].sum()) if len(r.trend) else 0
    idx = {m["index"].split()[0]: m for m in r.market}
    trends = [idx[k]["trend"] for k in ("SPY", "QQQ") if k in idx]
    setups = f"{n} stock{'s' if n != 1 else ''} show{'s' if n == 1 else ''} a VCP setup"

    if trends and all(t.startswith("Confirmed") for t in trends):
        headline = f"The market is in a confirmed uptrend and {setups} near a buy point." if n else \
            "The market is in a confirmed uptrend, but no stock has a VCP setup near a buy point today."
    elif any(t.startswith("Correction") for t in trends):
        headline = (f"The market is in a correction, so the {n} VCP setup{'s' if n != 1 else ''} below "
                    f"{'are' if n != 1 else 'is'} a watch list, not a buy list.") if n else \
            "The market is in a correction and no stock has a VCP setup near a buy point."
    else:
        headline = f"The uptrend is under pressure. {setups}; be selective and keep positions small." if n else \
            "The uptrend is under pressure and no stock has a VCP setup near a buy point."

    points: list[tuple[str, str]] = []

    # Market
    have = [k for k in ("SPY", "QQQ") if k in idx]
    if len(have) == 2 and _position(idx["SPY"]) == _position(idx["QQQ"]):
        pos = _position(idx["SPY"]).replace("its ", "their ").replace("average", "averages").replace("averagess", "averages")
        d1, d2 = idx["SPY"]["distribution_days_25"], idx["QQQ"]["distribution_days_25"]
        dd = f"{d1} distribution days each" if d1 == d2 else f"{d1} and {d2} distribution days"
        text = f"SPY and QQQ are both {pos}, with {dd} in the last 25 sessions."
    else:
        parts = [f"{k} is {_position(idx[k])} with {idx[k]['distribution_days_25']} distribution days in 25 sessions"
                 for k in have]
        text = "; ".join(parts) + "." if parts else ""
    b = r.breadth
    if b:
        hl = (f"new highs outnumber new lows {b['new_52w_highs']} to {b['new_52w_lows']}"
              if b["new_52w_highs"] >= b["new_52w_lows"]
              else f"new lows outnumber new highs {b['new_52w_lows']} to {b['new_52w_highs']}")
        text += f" {b['pct_above_50sma']:.0f}% of stocks are above their 50-day average, and {hl}."
    if text:
        points.append(("Market", text.strip()))

    # Leadership
    if n_tt:
        text = f"{n_tt} stocks ({100 * n_tt / max(r.liquid, 1):.0f}% of the liquid universe) pass the Trend Template."
        if "sector" in v.columns and v["sector"].notna().sum() >= 0.8 * len(v):
            top = v["sector"].dropna().value_counts().head(3)
            text += " The most come from " + _join([f"{s} ({c})" for s, c in top.items()]) + "."
        if n and "sector" in actionable.columns and actionable["sector"].notna().any():
            s, c = next(iter(actionable["sector"].dropna().value_counts().items()))
            if c >= 3:
                text += f" {s} also has the most VCP setups ({c})."
        points.append(("Leadership", text))

    if n:
        # Best setups by score
        best = []
        for _, row in actionable.sort_values("score", ascending=False).head(3).iterrows():
            d = row["dist_to_pivot_pct"]
            where = (f"{abs(d):.1f}% below its {row['pivot']:.2f} pivot" if d < 0
                     else f"{d:.1f}% above its {row['pivot']:.2f} pivot")
            best.append(f"{_who(row)} is {where} after contractions of {row['depths_pct']}%")
        points.append(("Best setups", "; ".join(best) + "."))

        # Breakouts
        bo = actionable[actionable["status"] == "breakout"]
        ap = actionable[actionable["status"] == "above_pivot"]
        if len(bo):
            text = _join([f"{_who(x)} on {x['breakout_volume_ratio']:.1f}× average volume" for _, x in bo.iterrows()])
            text = f"Broke out today: {text}."
        else:
            text = "No stock broke out on volume today."
        if len(ap):
            text += (f" {_join([f'**{t}**' for t in ap['ticker']])} "
                     f"{'is' if len(ap) == 1 else 'are'} above the pivot on light volume, which is not yet a confirmed breakout.")
        points.append(("Breakouts", text))

        # Fundamentals
        if "fund_pass" in actionable.columns:
            good = actionable[actionable["fund_pass"].map(_fund_ok)]
            known = actionable["fund_pass"].map(lambda x: x is not None and not (isinstance(x, float) and np.isnan(x)))
            missing = int((~known).sum())
            if missing == len(actionable):
                text = "Yahoo returned no quarterly earnings data for today's setups, so check EPS and sales growth yourself."
            elif len(good):
                verb = "clears" if len(good) == 1 else "clear"
                text = (f"{_join([f'**{t}**' for t in good['ticker']])} also {verb} the SEPA earnings bar "
                        f"(EPS up 25%+ and sales up 20%+ year over year). "
                        f"{'This is' if len(good) == 1 else 'These are'} the strongest candidates.")
            else:
                text = ("None of the setups with earnings data clears the SEPA earnings bar (EPS up 25%+ and "
                        "sales up 20%+ year over year).")
            if missing and missing < len(actionable):
                text += f" Earnings data was missing for {missing} of the {len(actionable)} setups."
            points.append(("Earnings growth", text))

        # Upcoming reports
        if "next_earnings" in actionable.columns:
            soon = []
            for _, x in actionable.iterrows():
                ne = x.get("next_earnings")
                if isinstance(ne, str) and r.as_of <= pd.Timestamp(ne) <= r.as_of + pd.Timedelta(days=14):
                    soon.append(f"**{x['ticker']}** ({pd.Timestamp(ne):%b %-d})")
            if soon:
                points.append(("Report dates", f"{_join(soon)} report{'s' if len(soon) == 1 else ''} within two weeks. "
                                               "Minervini avoids opening a position right before earnings."))

    # Changes since the last scan
    prev = _previous(out_dir, r.as_of) if out_dir is not None else None
    if prev is not None and "actionable" in prev.columns:
        before = set(prev.loc[prev["actionable"].astype(str) == "True", "ticker"])
        now = set(actionable["ticker"]) if n else set()
        new, gone = sorted(now - before), sorted(before - now)
        if not new and not gone:
            text = "The setup list is unchanged from the previous scan."
        else:
            bits = []
            if new:
                bits.append(f"New: {_join([f'**{t}**' for t in new])}.")
            if gone:
                status = dict(zip(v["ticker"], v["status"])) if not v.empty else {}
                labels = {"extended": "now extended", "below_pivot": "fell below the base", "no_base": "made a new high"}
                gone_txt = [f"**{t}**" + (f" ({labels[status[t]]})" if status.get(t) in labels else "") for t in gone]
                bits.append(f"Dropped off: {_join(gone_txt)}.")
            text = " ".join(bits)
        points.append(("Since the last scan", text))

    return {"headline": headline, "points": points}


def plain(text: str) -> str:
    return text.replace("**", "")
