"""Tunable parameters for the SEPA / VCP screener.

Defaults follow Mark Minervini's published guidelines ("Trade Like a Stock
Market Wizard", "Think & Trade Like a Champion"). Every threshold can be
overridden from the command line (see run_screener.py --help).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class LiquidityConfig:
    min_price: float = 10.0              # Minervini generally avoids sub-$10 stocks
    min_avg_volume: float = 200_000      # 50-day average shares traded
    min_avg_dollar_volume: float = 5_000_000  # 50-day average $ volume


@dataclass
class TrendTemplateConfig:
    sma_200_rising_days: int = 22        # 200-day SMA up for at least ~1 month
    min_above_52w_low: float = 0.30      # price >= 30% above 52-week low
    max_below_52w_high: float = 0.25     # price within 25% of 52-week high
    min_rs_rating: int = 70              # RS rating >= 70 (ideally 80-90+)


@dataclass
class VCPConfig:
    min_base_days: int = 15              # ~3 weeks
    max_base_days: int = 160             # ~32 weeks look-back for the base high
    zigzag_min_pct: float = 0.03         # min swing size used to find contractions
    zigzag_atr_mult: float = 1.5         # swing size = max(min_pct, mult * ATR%)
    min_contractions: int = 2
    max_contractions: int = 6
    max_first_depth: float = 0.40        # first pullback usually 10-35% (up to ~50% in bear mkts)
    max_base_depth: float = 0.50
    max_final_depth: float = 0.12        # last contraction is tight, often 3-10%
    depth_tolerance: float = 0.10        # contraction k may be up to 10% larger than k-1
    min_contraction_position: float = 0.50  # later contractions must start in the upper half of the base
    max_final_to_first: float = 0.60     # last contraction <= 60% of the first one's depth
    max_volume_dryup: float = 1.0        # final-leg avg volume / 50d avg volume must be below this
    max_dist_below_pivot: float = 0.10   # include setups up to 10% below the pivot
    max_extension: float = 0.05          # >5% above pivot = extended, don't chase
    breakout_volume_mult: float = 1.4    # breakout volume >= 140% of 50d average
    tight_days: int = 10                 # window used to measure "tightness"


@dataclass
class FundamentalConfig:
    enabled: bool = True
    min_eps_growth: float = 0.25         # latest quarter EPS YoY growth
    min_revenue_growth: float = 0.20     # latest quarter sales YoY growth
    workers: int = 8


@dataclass
class ScreenerConfig:
    universe: str = "us"                 # us | sp500 | sp1500 | file:<path> | AAPL,MSFT,...
    history_period: str = "2y"
    batch_size: int = 200
    benchmark: str = "SPY"
    liquidity: LiquidityConfig = field(default_factory=LiquidityConfig)
    trend: TrendTemplateConfig = field(default_factory=TrendTemplateConfig)
    vcp: VCPConfig = field(default_factory=VCPConfig)
    fundamentals: FundamentalConfig = field(default_factory=FundamentalConfig)
    charts: bool = True
    max_charts: int = 15
