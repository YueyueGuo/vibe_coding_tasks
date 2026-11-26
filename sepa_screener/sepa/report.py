"""Write the daily scan as CSV + Markdown + a self-contained HTML page."""
from __future__ import annotations

import base64
import html
import json
import logging
import re
from pathlib import Path

import numpy as np
import pandas as pd

from .screen import ScreenResult
from .summary import build_summary, plain

log = logging.getLogger(__name__)

STATUS_LABEL = {
    "breakout": "Breakout",
    "above_pivot": "Above pivot",
    "near_pivot": "Near pivot",
    "below_pivot": "Below pivot",
    "extended": "Extended",
    "no_base": "No base yet",
}


def _fmt(x, suffix="", nd=1):
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return "–"
    if isinstance(x, str):
        return x + (suffix if x not in ("turnaround",) else "")
    return f"{x:,.{nd}f}{suffix}"


def _earnings_soon(row, as_of: pd.Timestamp, days: int = 14) -> bool:
    ne = row.get("next_earnings")
    if not isinstance(ne, str):
        return False
    d = pd.Timestamp(ne)
    return as_of <= d <= as_of + pd.Timedelta(days=days)


def split_sections(r: ScreenResult):
    v = r.vcp
    if v.empty:
        return v, v, v
    actionable = v[v["actionable"]]
    watch = v[(~v["actionable"]) & (v["status"] != "no_base") & (v["score"] >= 50)]
    return actionable, watch, v


# --------------------------------------------------------------------------- markdown
def write_markdown(r: ScreenResult, path: Path, summary: dict | None = None) -> None:
    actionable, watch, v = split_sections(r)
    lines = [f"# SEPA / VCP scan — {r.as_of:%Y-%m-%d}", ""]
    lines += [f"Universe **{r.universe_size:,}** symbols · **{r.downloaded:,}** with data · "
              f"**{r.liquid:,}** liquid · **{len(r.trend[r.trend['tt_pass']]) if len(r.trend) else 0}** pass the Trend Template · "
              f"**{len(actionable)}** actionable VCPs", ""]
    if summary:
        lines += ["## Summary", "", f"**{summary['headline']}**", ""]
        lines += [f"- **{title}.** {text}" for title, text in summary["points"]] + [""]
    lines += ["## Market", "", "| Index | Close | 1d | Trend | >50d | >200d | Dist. days (25) |", "|---|---:|---:|---|:-:|:-:|---:|"]
    for m in r.market:
        lines.append(f"| {m['index']} | {m['close']:,.2f} | {m['chg_1d_pct']:+.2f}% | {m['trend']} | "
                     f"{'✓' if m['above_50sma'] else '✗'} | {'✓' if m['above_200sma'] else '✗'} | {m['distribution_days_25']} |")
    if r.breadth:
        b = r.breadth
        lines += ["", f"Breadth: {b['pct_above_50sma']}% above 50-day · {b['pct_above_200sma']}% above 200-day · "
                      f"{b['new_52w_highs']} new highs / {b['new_52w_lows']} new lows", ""]

    def table(df, title, cols):
        out = [f"## {title}", ""]
        if df.empty:
            return out + ["_None today._", ""]
        hdr = [c[0] for c in cols]
        out += ["| " + " | ".join(hdr) + " |", "|" + "---|" * len(hdr)]
        for _, row in df.iterrows():
            out.append("| " + " | ".join(str(c[1](row)) for c in cols) + " |")
        return out + [""]

    cols = [
        ("Ticker", lambda x: f"**{x['ticker']}**"),
        ("Status", lambda x: STATUS_LABEL.get(x["status"], x["status"])),
        ("Score", lambda x: _fmt(x["score"], nd=0)),
        ("RS", lambda x: _fmt(x["rs_rating"], nd=0)),
        ("Close", lambda x: _fmt(x["close"], nd=2)),
        ("Pivot", lambda x: _fmt(x["pivot"], nd=2)),
        ("To pivot", lambda x: _fmt(x["dist_to_pivot_pct"], "%")),
        ("Contractions %", lambda x: x["depths_pct"] or "–"),
        ("Vol dry-up", lambda x: _fmt(x["volume_dryup_ratio"], "x", 2)),
        ("Base (d)", lambda x: x["base_days"]),
        ("EPS Q YoY", lambda x: _fmt(x.get("eps_growth_q"), "%")),
        ("Sales Q YoY", lambda x: _fmt(x.get("rev_growth_q"), "%")),
        ("Earnings", lambda x: x.get("next_earnings") if isinstance(x.get("next_earnings"), str) else "–"),
    ]
    lines += table(actionable, "Actionable VCP setups", cols)
    lines += table(watch, "Watch list (good base, rule not yet met)", cols + [("Why not", lambda x: x["reasons"])])
    tt = v.sort_values("rs_rating", ascending=False) if not v.empty else v
    lines += table(tt, "All Trend Template stocks", [
        ("Ticker", lambda x: x["ticker"]), ("RS", lambda x: _fmt(x["rs_rating"], nd=0)),
        ("Close", lambda x: _fmt(x["close"], nd=2)), ("Off high", lambda x: _fmt(x["pct_below_52w_high"], "%")),
        ("Status", lambda x: STATUS_LABEL.get(x["status"], x["status"])),
        ("Sector", lambda x: x.get("sector") if isinstance(x.get("sector"), str) else "–"),
    ])
    lines += ["---", "_Automated screen, not investment advice. Check every chart yourself before trading._", ""]
    path.write_text("\n".join(lines))


# --------------------------------------------------------------------------- html
CSS = """
/* Layout: a single-column scan sheet. Market strip, then setup cards (chart + numbers), then tables. */
:root{
  --bg:#f3f5f4; --panel:#ffffff; --ink:#18211e; --muted:#5d6a65; --line:#d9e0dd;
  --accent:#0f6b55; --accent-soft:#dcefe8; --up:#16794f; --down:#b3392f; --warn:#9a6a00;
  --up-soft:#e2f2ea; --down-soft:#f8e4e1; --warn-soft:#f6edd6; --chart-bg:#ffffff;
  --f-display:"Archivo","Helvetica Neue",Arial,sans-serif;
  --f-body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  --f-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --bg:#101614; --panel:#18201d; --ink:#e4ebe8; --muted:#9aa8a2; --line:#2b3632;
  --accent:#5cc8a4; --accent-soft:#183a30; --up:#5cc89a; --down:#f0877c; --warn:#e3b54f;
  --up-soft:#173327; --down-soft:#3a1f1c; --warn-soft:#352b14; --chart-bg:#ffffff; color-scheme:dark; } }
:root[data-theme="dark"]{
  --bg:#101614; --panel:#18201d; --ink:#e4ebe8; --muted:#9aa8a2; --line:#2b3632;
  --accent:#5cc8a4; --accent-soft:#183a30; --up:#5cc89a; --down:#f0877c; --warn:#e3b54f;
  --up-soft:#173327; --down-soft:#3a1f1c; --warn-soft:#352b14; --chart-bg:#ffffff; color-scheme:dark; }
body{background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:15px;line-height:1.5}
.wrap{max-width:1080px;margin:0 auto;padding-block:28px 56px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));
  display:flex;flex-direction:column;gap:32px}
h1,h2,h3{font-family:var(--f-display);margin:0;text-wrap:balance;letter-spacing:-0.01em}
h1{font-size:1.9rem;font-weight:800}
h2{font-size:1.2rem;font-weight:700;display:flex;align-items:baseline;gap:10px}
h2 .count{font-family:var(--f-mono);font-size:.85rem;color:var(--muted);font-weight:500}
.eyebrow{font-family:var(--f-mono);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.sub{color:var(--muted);margin:4px 0 0}
.mono,td.num,.kv dd{font-family:var(--f-mono);font-variant-numeric:tabular-nums}
section{display:flex;flex-direction:column;gap:14px}
.note{color:var(--muted);font-size:.9rem;margin:0;max-width:70ch}
.summary{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--warn);border-radius:10px;
  padding:18px 20px;gap:12px}
.summary.ok{border-left-color:var(--up)} .summary.bad{border-left-color:var(--down)}
.summary h2{font-family:var(--f-mono);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:500}
.verdict{font-family:var(--f-display);font-size:1.3rem;font-weight:700;line-height:1.35;margin:0;text-wrap:pretty;max-width:46em}
.findings{margin:0;display:grid;grid-template-columns:max-content minmax(0,1fr);gap:10px 20px}
.findings dt{font-family:var(--f-mono);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);padding-top:.2rem}
.findings dd{margin:0;max-width:75ch}
@media (max-width:600px){.findings{grid-template-columns:1fr;gap:2px}.findings dd{margin-bottom:10px}}
.market{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.idx{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;min-width:0}
.idx .name{font-weight:600}
.idx .pill{align-self:flex-start}
.idx .px{font-family:var(--f-mono);font-size:1.1rem}
.checks{display:flex;flex-wrap:wrap;gap:6px;font-family:var(--f-mono);font-size:.75rem}
.chk{padding:1px 7px;border-radius:99px;background:var(--down-soft);color:var(--down)}
.chk.y{background:var(--up-soft);color:var(--up)}
.pill{display:inline-block;font-family:var(--f-mono);font-size:.75rem;padding:2px 9px;border-radius:99px;white-space:nowrap;
  background:var(--accent-soft);color:var(--accent)}
.pill.breakout{background:var(--up-soft);color:var(--up)}
.pill.extended,.pill.below_pivot{background:var(--warn-soft);color:var(--warn)}
.pill.no_base{background:var(--line);color:var(--muted)}
.pill.trend-up{background:var(--up-soft);color:var(--up)}
.pill.trend-mid{background:var(--warn-soft);color:var(--warn)}
.pill.trend-down{background:var(--down-soft);color:var(--down)}
.breadth{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:.9rem;color:var(--muted)}
.breadth b{color:var(--ink);font-family:var(--f-mono);font-weight:500}
.cards{display:flex;flex-direction:column;gap:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px;display:grid;
  grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:18px}
@media (max-width:760px){.card{grid-template-columns:1fr}}
.card .chart{background:var(--chart-bg);border-radius:6px;padding:4px;min-width:0}
.card .chart img{display:block;width:100%;height:auto}
.card .info{display:flex;flex-direction:column;gap:10px;min-width:0}
.card .head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.card .tkr{font-family:var(--f-display);font-size:1.4rem;font-weight:800}
.card .co{color:var(--muted);font-size:.85rem}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin:0;font-size:.88rem}
.kv dt{color:var(--muted)} .kv dd{margin:0;text-align:right}
.flag{font-size:.82rem;color:var(--warn)}
.tbl{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;width:100%;font-size:.85rem}
th,td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
th{font-family:var(--f-mono);font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:500;background:var(--panel);position:sticky;top:0}
td.num,th.num{text-align:right}
td.why{white-space:normal;min-width:260px;color:var(--muted)}
tr:last-child td{border-bottom:none}
.empty{color:var(--muted);font-style:italic;margin:0}
footer{color:var(--muted);font-size:.82rem;border-top:1px solid var(--line);padding-top:16px;display:flex;flex-direction:column;gap:6px}
a{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
"""

FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800'
         '&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap">')


def _e(x) -> str:
    return html.escape("–" if x is None or (isinstance(x, float) and np.isnan(x)) else str(x))


def _bold(text: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", html.escape(text))


def _summary_html(r: ScreenResult, summary: dict) -> str:
    trends = [m["trend"] for m in r.market[:2]]
    tone = ("ok" if trends and all(t.startswith("Confirmed") for t in trends)
            else "bad" if any(t.startswith("Correction") for t in trends) else "warn")
    items = "".join(f"<dt>{_e(t)}</dt><dd>{_bold(x)}</dd>" for t, x in summary["points"])
    return (f'<section class="summary {tone}" aria-labelledby="summary-h"><h2 id="summary-h">Summary</h2>'
            f'<p class="verdict">{_e(summary["headline"])}</p><dl class="findings">{items}</dl></section>')


def _trend_class(t: str) -> str:
    return "trend-up" if t.startswith("Confirmed") else "trend-mid" if "pressure" in t else "trend-down"


def _market_html(r: ScreenResult) -> str:
    cards = []
    for m in r.market:
        chk = lambda ok, label: f'<span class="chk{" y" if ok else ""}">{label}</span>'  # noqa: E731
        cards.append(
            f'<div class="idx"><span class="name">{_e(m["index"])}</span>'
            f'<span class="px">{m["close"]:,.2f} <span style="color:var(--{"up" if m["chg_1d_pct"] >= 0 else "down"})">'
            f'{m["chg_1d_pct"]:+.2f}%</span></span>'
            f'<span class="pill {_trend_class(m["trend"])}">{_e(m["trend"])}</span>'
            f'<div class="checks">{chk(m["above_21ema"], "21e")}{chk(m["above_50sma"], "50d")}'
            f'{chk(m["above_200sma"], "200d")}{chk(m["sma50_above_200"], "50>200")}'
            f'<span class="chk{" y" if m["distribution_days_25"] <= 4 else ""}">{m["distribution_days_25"]} dist. days</span></div></div>'
        )
    b = r.breadth
    breadth = ""
    if b:
        breadth = (f'<div class="breadth"><span>Above 50-day <b>{b["pct_above_50sma"]}%</b></span>'
                   f'<span>Above 200-day <b>{b["pct_above_200sma"]}%</b></span>'
                   f'<span>New 52-week highs <b>{b["new_52w_highs"]}</b></span>'
                   f'<span>New 52-week lows <b>{b["new_52w_lows"]}</b></span></div>')
    return f'<div class="market">{"".join(cards)}</div>{breadth}'


def _card(row, chart_png: Path | None, as_of) -> str:
    img = ""
    if chart_png and chart_png.exists():
        b64 = base64.b64encode(chart_png.read_bytes()).decode()
        img = f'<div class="chart"><img alt="{_e(row["ticker"])} daily chart with contractions and pivot" src="data:image/png;base64,{b64}"></div>'
    name = row.get("name") if isinstance(row.get("name"), str) else ""
    sector = " · ".join(x for x in (row.get("sector"), row.get("industry")) if isinstance(x, str))
    flags = []
    if _earnings_soon(row, as_of):
        flags.append(f'Earnings on {row["next_earnings"]}. Minervini avoids new buys just before a report.')
    fp = row.get("fund_pass")
    if fp is not None and not pd.isna(fp) and not bool(fp):
        flags.append("Fundamentals below the SEPA bar: EPS +25% / sales +20% year over year.")
    kv = [
        ("Pivot", _fmt(row["pivot"], nd=2)), ("Close", _fmt(row["close"], nd=2)),
        ("To pivot", _fmt(row["dist_to_pivot_pct"], "%")),
        ("Contractions", (row["depths_pct"] + "%") if row["depths_pct"] else "–"),
        ("Base length", f'{row["base_days"]} days'), ("Volume dry-up", _fmt(row["volume_dryup_ratio"], "× avg", 2)),
        ("Today's volume", _fmt(row["breakout_volume_ratio"], "× avg", 2)),
        ("RS rating", _fmt(row["rs_rating"], nd=0)), ("Off 52-week high", _fmt(row["pct_below_52w_high"], "%")),
        ("EPS, latest quarter", _fmt(row.get("eps_growth_q"), "%")), ("Sales, latest quarter", _fmt(row.get("rev_growth_q"), "%")),
        ("Next earnings", row.get("next_earnings") if isinstance(row.get("next_earnings"), str) else "–"),
    ]
    dl = "".join(f"<dt>{_e(k)}</dt><dd>{_e(v)}</dd>" for k, v in kv)
    fl = "".join(f'<span class="flag">{_e(f)}</span>' for f in flags)
    return (f'<article class="card">{img}<div class="info"><div class="head"><span class="tkr">{_e(row["ticker"])}</span>'
            f'<span class="pill {row["status"]}">{_e(STATUS_LABEL.get(row["status"], row["status"]))}</span>'
            f'<span class="pill">score {row["score"]:.0f}</span></div>'
            f'<span class="co">{_e(name)}{" · " if name and sector else ""}{_e(sector)}</span>'
            f'<dl class="kv">{dl}</dl>{fl}</div></article>')


def _table(df: pd.DataFrame, cols: list[tuple[str, str, callable]]) -> str:
    if df.empty:
        return '<p class="empty">None today.</p>'
    head = "".join(f'<th class="{c}">{_e(h)}</th>' for h, c, _ in cols)
    body = "".join("<tr>" + "".join(f'<td class="{c}">{f(row)}</td>' for _, c, f in cols) + "</tr>" for _, row in df.iterrows())
    return f'<div class="tbl"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def write_html(r: ScreenResult, path: Path, charts: dict[str, Path], summary: dict | None = None) -> None:
    actionable, watch, v = split_sections(r)
    n_tt = int(r.trend["tt_pass"].sum()) if len(r.trend) else 0
    pill = lambda x: f'<span class="pill {x["status"]}">{_e(STATUS_LABEL.get(x["status"], x["status"]))}</span>'  # noqa: E731
    watch_cols = [
        ("Ticker", "", lambda x: f'<b>{_e(x["ticker"])}</b>'), ("Status", "", pill),
        ("Score", "num", lambda x: _e(_fmt(x["score"], nd=0))), ("RS", "num", lambda x: _e(_fmt(x["rs_rating"], nd=0))),
        ("Pivot", "num", lambda x: _e(_fmt(x["pivot"], nd=2))), ("To pivot", "num", lambda x: _e(_fmt(x["dist_to_pivot_pct"], "%"))),
        ("Contractions", "num", lambda x: _e(x["depths_pct"] or "–")),
        ("Dry-up", "num", lambda x: _e(_fmt(x["volume_dryup_ratio"], "×", 2))),
        ("Why it isn't a VCP yet", "why", lambda x: _e(x["reasons"])),
    ]
    tt = v.sort_values("rs_rating", ascending=False) if not v.empty else v
    tt_cols = [
        ("Ticker", "", lambda x: f'<b>{_e(x["ticker"])}</b>'), ("RS", "num", lambda x: _e(_fmt(x["rs_rating"], nd=0))),
        ("Close", "num", lambda x: _e(_fmt(x["close"], nd=2))), ("Off high", "num", lambda x: _e(_fmt(x["pct_below_52w_high"], "%"))),
        ("Status", "", pill), ("EPS Q", "num", lambda x: _e(_fmt(x.get("eps_growth_q"), "%"))),
        ("Sales Q", "num", lambda x: _e(_fmt(x.get("rev_growth_q"), "%"))),
        ("Sector", "", lambda x: _e(x.get("sector") if isinstance(x.get("sector"), str) else "–")),
    ]
    cards = "".join(_card(row, charts.get(row["ticker"]), r.as_of) for _, row in actionable.iterrows())
    page = f"""<title>SEPA Daily Scan</title>
<meta name="claude:viewport-fit-sides" content="cover">
{FONTS}
<style>{CSS}</style>
<div class="wrap">
<header>
  <div class="eyebrow">Close of {r.as_of:%A, %B %-d, %Y}</div>
  <h1>SEPA Daily Scan</h1>
  <p class="sub">Trend Template, relative strength and Volatility Contraction Patterns across {r.universe_size:,} US-listed stocks.
  {r.liquid:,} were liquid enough to screen; <b>{n_tt}</b> passed the Trend Template and <b>{len(actionable)}</b> show an actionable VCP.</p>
</header>
{_summary_html(r, summary) if summary else ""}
<section><h2>Market</h2>{_market_html(r)}</section>
<section><h2>Actionable VCP setups <span class="count">{len(actionable)}</span></h2>
<p class="note">Each stock passes the Trend Template, its contractions get progressively tighter with lower volume, and it sits
within 10% below or 5% above its pivot. A breakout counts only on volume at least 40% above the 50-day average.</p>
{cards or '<p class="empty">No stock meets every VCP rule today. See the watch list below.</p>'}</section>
<section><h2>Watch list <span class="count">{len(watch)}</span></h2>
<p class="note">Trend Template stocks building a base that scores well but still misses one or more VCP rules.</p>
{_table(watch, watch_cols)}</section>
<section><h2>All Trend Template stocks <span class="count">{len(tt)}</span></h2>{_table(tt, tt_cols)}</section>
<footer><span>Daily prices and financials from Yahoo Finance; ticker lists from NASDAQ Trader. RS rating weights the last
quarter double (IBD style) and is ranked against every stock screened.</span>
<span>This is an automated screen, not investment advice. Check every chart yourself and size positions to your stop.</span></footer>
</div>"""
    path.write_text(page)


# --------------------------------------------------------------------------- driver
def write_reports(r: ScreenResult, out_dir: Path, charts: bool = True, max_charts: int = 15) -> dict[str, Path]:
    day_dir = out_dir / f"{r.as_of:%Y-%m-%d}"
    day_dir.mkdir(parents=True, exist_ok=True)
    trend_cols = [c for c in r.trend.columns]
    r.trend[trend_cols].to_csv(day_dir / "trend_template.csv", index=False)
    if not r.vcp.empty:
        r.vcp.to_csv(day_dir / "vcp_candidates.csv", index=False)
    else:
        (day_dir / "vcp_candidates.csv").write_text("ticker\n")

    chart_paths: dict[str, Path] = {}
    actionable, _, _ = split_sections(r)
    summary = build_summary(r, actionable, out_dir)
    if charts and not actionable.empty:
        try:
            from .charts import plot_vcp
            chart_dir = out_dir / "_charts"
            names = dict(zip(actionable["ticker"], actionable["name"])) if "name" in actionable.columns else {}
            for t in actionable["ticker"].head(max_charts):
                name = names.get(t)
                chart_paths[t] = plot_vcp(t, r.prices[t], r.vcp_details[t], chart_dir / f"{t}.png",
                                          name=name if isinstance(name, str) else None)
        except ImportError:
            log.warning("matplotlib not installed: skipping charts")

    md = day_dir / "report.md"
    write_markdown(r, md, summary)
    html_path = out_dir / "latest.html"
    write_html(r, html_path, chart_paths, summary)
    (out_dir / "latest.md").write_text(md.read_text())
    latest = {
        "as_of": f"{r.as_of:%Y-%m-%d}",
        "headline": summary["headline"],
        "summary": [f"{t}: {plain(x)}" for t, x in summary["points"]],
        "universe": r.universe_size, "liquid": r.liquid,
        "trend_template": int(r.trend["tt_pass"].sum()) if len(r.trend) else 0,
        "actionable": actionable["ticker"].tolist() if not actionable.empty else [],
        "market": [{k: m[k] for k in ("index", "trend", "distribution_days_25")} for m in r.market],
    }
    (out_dir / "latest.json").write_text(json.dumps(latest, indent=2))
    return {"markdown": md, "html": html_path, "dir": day_dir}
