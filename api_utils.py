import csv
import io
import random
import statistics
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

FEATURES_ORDER = [
    "hour",
    "day",
    "month",
    "weekday",
    "is_weekend",
    "demand_lag_1",
    "demand_lag_24",
    "rolling_mean_24",
    "rolling_std_24",
]

def _extract_request_json(request: Any) -> Dict:
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else {}


def _parse_datetime(dt_str: str) -> Optional[datetime]:
    try:
        if HAS_PANDAS:
            return pd.to_datetime(dt_str).to_pydatetime()
        normalized = str(dt_str).strip().replace("T", " ")
        return datetime.fromisoformat(normalized)
    except Exception:
        return None


def _validate_number(value, min_val=0.0, max_val=100000.0) -> bool:
    try:
        num = float(value)
        return min_val <= num <= max_val
    except Exception:
        return False


def _build_features(dt: datetime, lag_1: float, lag_24: float, mean_24: float, std_24: float) -> Dict:
    return {
        "hour": dt.hour,
        "day": dt.day,
        "month": dt.month,
        "weekday": dt.weekday(),
        "is_weekend": 1 if dt.weekday() >= 5 else 0,
        "demand_lag_1": lag_1,
        "demand_lag_24": lag_24,
        "rolling_mean_24": mean_24,
        "rolling_std_24": std_24,
    }


def _features_to_df(items: List[Dict]):
    if HAS_PANDAS:
        df = pd.DataFrame(items)
        for col in FEATURES_ORDER:
            if col not in df.columns:
                df[col] = 0
        return df[FEATURES_ORDER]
    return [[row.get(col, 0) for col in FEATURES_ORDER] for row in items]


def _validate_single_payload(data: Dict) -> Optional[str]:
    if "datetime" not in data:
        return "'datetime' is required"
    if _parse_datetime(str(data["datetime"])) is None:
        return "Invalid datetime format"
    for key in ["demand_lag_1", "demand_lag_24", "rolling_mean_24", "rolling_std_24"]:
        if key in data and not _validate_number(data[key]):
            return f"Invalid numeric value for '{key}'"
    return None


def _csv_bytes(rows: List[Dict]) -> io.BytesIO:
    output = io.StringIO()
    fieldnames = ["datetime", "predicted_demand", "unit"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows or []:
        writer.writerow(
            {
                "datetime": row.get("datetime", ""),
                "predicted_demand": row.get("predicted_demand", ""),
                "unit": row.get("unit", "MW"),
            }
        )
    data = io.BytesIO(output.getvalue().encode("utf-8"))
    data.seek(0)
    return data


def _uniform_array(low: float, high: float, size: int):
    if HAS_NUMPY:
        return np.random.uniform(low, high, size=size)
    return [random.uniform(low, high) for _ in range(size)]


def _mean(values: List[float]) -> float:
    if HAS_NUMPY:
        return float(np.mean(values))
    return float(statistics.fmean(values)) if values else 0.0


def _std(values: List[float]) -> float:
    if HAS_NUMPY:
        return float(np.std(values))
    if not values:
        return 0.0
    m = _mean(values)
    variance = sum((v - m) ** 2 for v in values) / len(values)
    return float(variance ** 0.5)


def _sum(values: List[float]) -> float:
    if HAS_NUMPY:
        return float(np.sum(values))
    return float(sum(values))


def _max(values: List[float]) -> float:
    if HAS_NUMPY:
        return float(np.max(values))
    return float(max(values)) if values else 0.0


def _min(values: List[float]) -> float:
    if HAS_NUMPY:
        return float(np.min(values))
    return float(min(values)) if values else 0.0
