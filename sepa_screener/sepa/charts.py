"""Candlestick charts with the VCP contractions and pivot drawn on top (matplotlib, optional)."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from .vcp import VCPResult


def plot_vcp(ticker: str, df: pd.DataFrame, v: VCPResult, path: Path, days: int = 200,
             name: str | None = None) -> Path:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    full = df.copy()
    for n in (50, 150, 200):
        full[f"sma{n}"] = full["Close"].rolling(n).mean()
    d = full.tail(days)
    x = range(len(d))
    pos = {ts: i for i, ts in enumerate(d.index)}

    fig, (ax, axv) = plt.subplots(2, 1, figsize=(9, 5), sharex=True,
                                  gridspec_kw={"height_ratios": [3.2, 1], "hspace": 0.04})
    up = d["Close"] >= d["Open"]
    col = ["#2e9d6a" if u else "#d0504f" for u in up]
    ax.vlines(x, d["Low"], d["High"], color=col, linewidth=0.8)
    ax.bar(x, (d["Close"] - d["Open"]).abs().clip(lower=d["Close"] * 0.0015),
           bottom=d[["Open", "Close"]].min(axis=1), color=col, width=0.7)
    for n, c in ((50, "#3b6fd8"), (150, "#a066c9"), (200, "#e08a2c")):
        ax.plot(x, d[f"sma{n}"], color=c, linewidth=1.1, label=f"{n}-day")

    for i, c in enumerate(v.contractions):
        s, e = pd.Timestamp(c.start), pd.Timestamp(c.end)
        if s not in pos or e not in pos:
            continue
        xs, xe = pos[s], pos[e]
        ax.plot([xs, xe], [c.high, c.low], color="#555", linewidth=1, linestyle="--")
        ax.annotate(f"{c.depth:.0%}", ((xs + xe) / 2, (c.high + c.low) / 2), fontsize=8,
                    ha="left", va="center", color="#333",
                    bbox={"boxstyle": "round,pad=0.15", "fc": "white", "ec": "#bbb", "lw": 0.5})
    if v.pivot:
        ax.axhline(v.pivot, color="#2e9d6a", linewidth=1, linestyle=":")
        ax.annotate(f"pivot {v.pivot:.2f}", (len(d) - 1, v.pivot), fontsize=8, color="#2e9d6a",
                    ha="right", va="bottom")

    axv.bar(x, d["Volume"], color=col, width=0.7)
    axv.plot(x, d["Volume"].rolling(50).mean(), color="#333", linewidth=0.9)
    axv.set_yticks([])
    ticks = list(range(0, len(d), max(1, len(d) // 8)))
    axv.set_xticks(ticks)
    axv.set_xticklabels([d.index[i].strftime("%b %d") for i in ticks], fontsize=8)
    ax.tick_params(labelsize=8)
    ax.legend(loc="upper left", fontsize=7, frameon=False)
    fig.suptitle(f"{ticker}  {name}" if name else ticker, x=0.125, y=0.985, ha="left",
                 fontsize=12, fontweight="bold")
    sub = (f"{v.status.replace('_', ' ')}  ·  contractions {'/'.join(f'{x:.0f}' for x in v.depths_pct)}%"
           f"  ·  pivot {v.pivot:.2f}" if v.pivot else v.status.replace("_", " "))
    ax.set_title(sub, fontsize=9, loc="left", color="#555")
    for a in (ax, axv):
        a.grid(alpha=0.25, linewidth=0.5)
        for side in ("top", "right"):
            a.spines[side].set_visible(False)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=110, bbox_inches="tight")
    plt.close(fig)
    return path
