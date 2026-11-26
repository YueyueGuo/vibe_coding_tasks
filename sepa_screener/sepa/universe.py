"""Build the list of tickers to screen from free public sources."""
from __future__ import annotations

import io
import logging
import re
from pathlib import Path

import pandas as pd
import requests

log = logging.getLogger(__name__)

UA = {"User-Agent": "Mozilla/5.0 (sepa-screener; +https://github.com)"}
NASDAQ_LISTED = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt"
OTHER_LISTED = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt"
WIKI = {
    "sp500": "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
    "sp400": "https://en.wikipedia.org/wiki/List_of_S%26P_400_companies",
    "sp600": "https://en.wikipedia.org/wiki/List_of_S%26P_600_companies",
}

# Securities that are not ordinary common stock / ADRs.
_EXCLUDE_NAME = re.compile(
    r"\b(?:warrants?|units?|rights?|preferred|preference|notes?|debentures?|"
    r"subordinated|contingent value|acquisition corp)\b|\d%",
    re.IGNORECASE,
)


# Company names seen while loading the universe (fallback when Yahoo has none).
NAMES: dict[str, str] = {}

_NAME_SUFFIX = re.compile(
    r"\s*-?\s*(?:Class [A-Z] )?(?:Common Stock|Ordinary Shares?|Common Shares?|American Depositary Shares?.*|"
    r"Depositary Shares?.*|Shares of Beneficial Interest|Capital Stock)\b.*$",
    re.IGNORECASE,
)


def clean_name(name: str) -> str:
    return _NAME_SUFFIX.sub("", str(name)).strip(" -,")


def _yahoo_symbol(sym: str) -> str:
    return sym.strip().replace(".", "-").replace("/", "-")


def _read_pipe_file(url: str) -> pd.DataFrame:
    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    lines = [ln for ln in r.text.splitlines() if not ln.startswith("File Creation Time")]
    return pd.read_csv(io.StringIO("\n".join(lines)), sep="|", dtype=str).fillna("")


def us_listed() -> list[str]:
    """All NASDAQ / NYSE / NYSE American / Cboe listed common stocks & ADRs (no ETFs)."""
    nas = _read_pipe_file(NASDAQ_LISTED)
    nas = nas[(nas["ETF"] == "N") & (nas["Test Issue"] == "N") & (nas["Financial Status"].isin(["N", ""]))]
    nas = nas.rename(columns={"Symbol": "sym"})

    oth = _read_pipe_file(OTHER_LISTED)
    oth = oth[(oth["ETF"] == "N") & (oth["Test Issue"] == "N")]
    oth = oth.rename(columns={"ACT Symbol": "sym"})

    df = pd.concat([nas[["sym", "Security Name"]], oth[["sym", "Security Name"]]])
    df = df[~df["Security Name"].str.contains(_EXCLUDE_NAME)]
    df = df[~df["sym"].str.contains(r"[\$\^ ]")]          # preferreds / odd classes
    df = df[df["sym"].str.len() <= 5]
    for sym, name in zip(df["sym"], df["Security Name"]):
        NAMES.setdefault(_yahoo_symbol(sym), clean_name(name))
    syms = sorted({_yahoo_symbol(s) for s in df["sym"] if s})
    log.info("US-listed universe: %d symbols", len(syms))
    return syms


def _wiki_index(key: str) -> list[str]:
    r = requests.get(WIKI[key], headers=UA, timeout=30)
    r.raise_for_status()
    for table in pd.read_html(io.StringIO(r.text)):
        for col in ("Symbol", "Ticker symbol", "Ticker"):
            if col in table.columns:
                syms = [_yahoo_symbol(str(s)) for s in table[col].dropna()]
                for name_col in ("Security", "Company"):
                    if name_col in table.columns:
                        for sym, name in zip(syms, table[name_col]):
                            NAMES.setdefault(sym, clean_name(name))
                        break
                return syms
    raise RuntimeError(f"Could not find a symbol column on {WIKI[key]}")


def load_universe(spec: str) -> list[str]:
    spec = spec.strip()
    if spec == "us":
        return us_listed()
    if spec == "sp500":
        return sorted(set(_wiki_index("sp500")))
    if spec == "sp1500":
        return sorted(set(_wiki_index("sp500") + _wiki_index("sp400") + _wiki_index("sp600")))
    if spec.startswith("file:"):
        text = Path(spec[5:]).read_text()
        return sorted({_yahoo_symbol(t) for t in re.split(r"[\s,]+", text) if t and not t.startswith("#")})
    return sorted({_yahoo_symbol(t) for t in spec.split(",") if t.strip()})
