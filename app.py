import base64
import ast
import io
import json
import logging
import os
import pickle
import random
import statistics
import sys
import csv
import sqlite3
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

try:
    import numpy as np

    HAS_NUMPY = True
except Exception:
    HAS_NUMPY = False
    np = None

try:
    import pandas as pd

    HAS_PANDAS = True
except Exception:
    HAS_PANDAS = False
    pd = None
from flask import Flask, jsonify, render_template, request, send_file
from flask_cors import CORS

import api_utils as u

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    HAS_MATPLOTLIB = True
except Exception:
    HAS_MATPLOTLIB = False
    plt = None

# Python 3.14 compatibility for older joblib/sklearn code paths.
if not hasattr(ast, "Num"):
    ast.Num = ast.Constant
if hasattr(ast, "Constant") and not hasattr(ast.Constant, "n"):
    ast.Constant.n = property(lambda self: self.value)


if os.name == "nt":
    py_ver = f"Python{sys.version_info.major}{sys.version_info.minor}"
    candidate_paths = [
        Path.home() / "AppData" / "Roaming" / "Python" / py_ver / "site-packages",
        Path.home() / "AppData" / "Local" / "Python" / "pythoncore-3.14-64" / "Lib" / "site-packages",
    ]
    for p in candidate_paths:
        p_str = str(p)
        if p.exists() and p_str not in sys.path:
            sys.path.insert(0, p_str)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "saved_models" / "best_demand_model (1).pkl"
SCALER_PATH = BASE_DIR / "saved_models" / "scaler.pkl"
DB_PATH = BASE_DIR / "smartgrid.db"
MODEL_META_PATH = BASE_DIR / "saved_models" / "model_metadata.json"
MAX_MODEL_BYTES = int(os.environ.get("MAX_MODEL_BYTES", str(250 * 1024 * 1024)))
ALLOW_LARGE_MODEL = os.environ.get("ALLOW_LARGE_MODEL", "0").lower() in {"1", "true", "yes"}


class ModelService:
    def __init__(self) -> None:
        self.model = None
        self.scaler = None
        self.model_name = "DemoModel"
        self.requires_scaling = False
        self.expected_features_count = len(u.FEATURES_ORDER)
        self.expected_feature_names = list(u.FEATURES_ORDER)
        self.model_version = os.environ.get("MODEL_VERSION", "v1.0.0")
        self.trained_at = None
        self.metrics: Dict[str, float] = {}
        self._loaded = False

    def _load(self) -> None:
        if self._loaded:
            return
        try:
            if MODEL_PATH.exists() and not ALLOW_LARGE_MODEL:
                size = MODEL_PATH.stat().st_size
                if size > MAX_MODEL_BYTES:
                    raise RuntimeError(
                        f"Model file too large ({size} bytes). "
                        f"Set ALLOW_LARGE_MODEL=1 to force loading."
                    )
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
            self.model_name = type(self.model).__name__
            if MODEL_PATH.exists():
                self.trained_at = datetime.fromtimestamp(MODEL_PATH.stat().st_mtime).isoformat()
            self.requires_scaling = self.model_name in {
                "LinearRegression",
                "Ridge",
                "Lasso",
                "SVR",
                "KNeighborsRegressor",
            }
            # Avoid heavy parallel/joblib overhead on local runtime.
            if hasattr(self.model, "n_jobs"):
                try:
                    self.model.n_jobs = 1
                except Exception:
                    pass
            if SCALER_PATH.exists():
                with open(SCALER_PATH, "rb") as f:
                    self.scaler = pickle.load(f)
            self._load_metadata()
            self._detect_expected_features()
            logger.info("Model loaded: %s", self.model_name)
        except Exception as e:
            logger.warning("Running in demo mode: %s", e)
            self.model = None
            self.scaler = None
        finally:
            self._loaded = True

    def info(self) -> Dict:
        self._load()
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "trained_at": self.trained_at,
            "quality_metrics": self.metrics,
            "features_required": self.expected_feature_names,
            "features_count": self.expected_features_count,
            "requires_scaling": self.requires_scaling,
            "status": "loaded" if self.model is not None else "demo_mode",
        }

    def _load_metadata(self) -> None:
        if not MODEL_META_PATH.exists():
            return
        try:
            with open(MODEL_META_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                if data.get("model_version"):
                    self.model_version = str(data["model_version"])
                if data.get("trained_at"):
                    self.trained_at = str(data["trained_at"])
                if isinstance(data.get("quality_metrics"), dict):
                    self.metrics = data["quality_metrics"]
        except Exception as e:
            logger.warning("Failed to load model metadata: %s", e)

    def _detect_expected_features(self) -> None:
        expected = len(u.FEATURES_ORDER)
        names = list(u.FEATURES_ORDER)

        if self.scaler is not None and hasattr(self.scaler, "n_features_in_"):
            expected = int(self.scaler.n_features_in_)
        elif self.model is not None and hasattr(self.model, "n_features_in_"):
            expected = int(self.model.n_features_in_)

        if self.model is not None and hasattr(self.model, "feature_names_in_"):
            try:
                raw_names = list(self.model.feature_names_in_)
                if raw_names:
                    names = [str(x) for x in raw_names]
                    expected = len(names)
            except Exception:
                pass

        if len(names) < expected:
            names = names + [f"extra_feature_{i}" for i in range(len(names), expected)]
        elif len(names) > expected:
            names = names[:expected]

        self.expected_features_count = expected
        self.expected_feature_names = names

    def _align_features(self, features_df: Any):
        expected = self.expected_features_count
        if expected <= 0:
            return features_df

        if HAS_PANDAS and hasattr(features_df, "columns"):
            df = features_df.copy()
            for col in self.expected_feature_names:
                if col not in df.columns:
                    df[col] = 0.0
            return df[self.expected_feature_names]

        aligned = []
        for row in features_df:
            row_list = list(row)
            if len(row_list) < expected:
                row_list.extend([0.0] * (expected - len(row_list)))
            elif len(row_list) > expected:
                row_list = row_list[:expected]
            aligned.append(row_list)
        return aligned

    def predict(self, features_df: Any):
        self._load()
        if self.model is None:
            return u._uniform_array(1000, 2000, len(features_df))
        try:
            features_df = self._align_features(features_df)
            if self.requires_scaling:
                if self.scaler is None:
                    raise RuntimeError("Scaler is required for this model, but scaler.pkl is missing.")
                return self.model.predict(self.scaler.transform(features_df))
            return self.model.predict(features_df)
        except Exception as e:
            logger.exception("Model prediction failed. Falling back to demo predictions: %s", e)
            return u._uniform_array(1200, 1900, len(features_df))


model_service = ModelService()
service_stats = {
    "predict_calls": 0,
    "predict_errors": 0,
    "latency_ms": [],
    "started_at": datetime.now().isoformat(),
}


def _db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                source TEXT NOT NULL,
                datetime TEXT NOT NULL,
                predicted_demand REAL NOT NULL,
                unit TEXT NOT NULL,
                model_name TEXT,
                payload_json TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_predictions_source ON predictions(source)")
        conn.commit()


def save_predictions(rows: List[Dict], source: str, model_name: str, payload: Optional[Dict] = None) -> None:
    if not rows:
        return
    payload_json = json.dumps(payload or {})
    created = datetime.now().isoformat()
    with _db_conn() as conn:
        conn.executemany(
            """
            INSERT INTO predictions (created_at, source, datetime, predicted_demand, unit, model_name, payload_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    created,
                    source,
                    str(r.get("datetime", "")),
                    float(r.get("predicted_demand", 0)),
                    str(r.get("unit", "MW")),
                    model_name,
                    payload_json,
                )
                for r in rows
            ],
        )
        conn.commit()


def get_history(limit: int = 200, source: Optional[str] = None) -> List[Dict]:
    query = "SELECT id, created_at, source, datetime, predicted_demand, unit, model_name FROM predictions"
    args: List[Any] = []
    if source:
        query += " WHERE source = ?"
        args.append(source)
    query += " ORDER BY id DESC LIMIT ?"
    args.append(max(1, min(limit, 2000)))
    with _db_conn() as conn:
        rows = conn.execute(query, args).fetchall()
    return [dict(r) for r in rows]


def clear_history() -> int:
    with _db_conn() as conn:
        cur = conn.execute("DELETE FROM predictions")
        conn.commit()
        return int(cur.rowcount)


def _record_latency(ms: float, ok: bool) -> None:
    service_stats["predict_calls"] += 1
    if not ok:
        service_stats["predict_errors"] += 1
    latencies = service_stats["latency_ms"]
    latencies.append(ms)
    if len(latencies) > 300:
        del latencies[: len(latencies) - 300]


init_db()


def _predict_point(dt: datetime, lag_1: float, lag_24: float, mean_24: float, std_24: float) -> float:
    row = u._build_features(dt, lag_1, lag_24, mean_24, std_24)
    features_df = u._features_to_df([row])
    pred = model_service.predict(features_df)[0]
    return float(pred)


def _render_page(template_name: str, page_name: str):
    try:
        return render_template(template_name)
    except Exception as e:
        logger.exception("Failed to render %s using template %s: %s", page_name, template_name, e)
        fallback_html = f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_name} | Electricity Forecasting</title>
</head>
<body style="font-family:Arial, sans-serif; max-width:720px; margin:40px auto; line-height:1.5;">
  <h1>Electricity Forecasting Service</h1>
  <p>The API is running, but the UI template for <strong>{page_name}</strong> could not be loaded.</p>
  <p>Check deployment file paths for <code>templates/</code> and <code>static/</code>.</p>
  <ul>
    <li><a href="/api/health">Health Check</a></li>
    <li><a href="/api/model-info">Model Info</a></li>
    <li><a href="/api-docs">API Docs</a></li>
  </ul>
</body>
</html>
"""
        return fallback_html, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/")
def home():
    return _render_page("index.html", "Home")


@app.route("/realtime")
def realtime():
    return _render_page("realtime.html", "Realtime")


@app.route("/forecast")
def forecast():
    return _render_page("forecast.html", "Forecast")


@app.route("/history")
def history():
    return _render_page("history.html", "History")


@app.route("/dashboard")
def dashboard():
    return _render_page("dashboard.html", "Dashboard")


@app.route("/api-docs", methods=["GET"])
def api_docs():
    return jsonify(
        {
            "name": "Electricity Forecasting API",
            "version": "2.0.0",
            "routes": [
                "GET /api/health",
                "GET /api/model-info",
                "POST /api/predict",
                "POST /api/predict-batch",
                "POST /api/predict-batch-csv",
                "POST /api/predict-weekly",
                "GET /api/demo",
                "GET /api/history",
                "POST /api/history/clear",
                "GET /api/dashboard-metrics",
                "POST /api/visualize",
                "POST /api/export-csv",
                "POST /api/export-json",
            ],
        }
    )


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "healthy",
            "model_loaded": model_service._loaded and model_service.model is not None,
            "model_initialized": model_service._loaded,
            "model_name": model_service.model_name,
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.route("/api/model-info", methods=["GET"])
def model_info():
    info = model_service.info()
    info["feature_descriptions"] = {
        "hour": "Hour of day (0-23)",
        "day": "Day of month (1-31)",
        "month": "Month (1-12)",
        "weekday": "Day of week (0=Monday)",
        "is_weekend": "1 for Saturday/Sunday",
        "demand_lag_1": "Previous hour demand",
        "demand_lag_24": "Demand from 24 hours ago",
        "rolling_mean_24": "24-hour rolling average",
        "rolling_std_24": "24-hour rolling standard deviation",
    }
    return jsonify(info)


@app.route("/api/predict", methods=["POST"])
def predict():
    t0 = time.perf_counter()
    try:
        data = u._extract_request_json(request)
        err = u._validate_single_payload(data)
        if err:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": err}), 400

        dt = u._parse_datetime(str(data["datetime"]))
        lag_1 = float(data.get("demand_lag_1", 0))
        lag_24 = float(data.get("demand_lag_24", lag_1))
        mean_24 = float(data.get("rolling_mean_24", lag_1))
        std_24 = float(data.get("rolling_std_24", 0))

        pred = _predict_point(dt, lag_1, lag_24, mean_24, std_24)
        result = {
            "datetime": dt.isoformat(sep=" "),
            "predicted_demand": round(pred, 3),
            "unit": "MW",
            "model_name": model_service.model_name,
        }
        save_predictions([result], "realtime", model_service.model_name, payload=data)
        _record_latency((time.perf_counter() - t0) * 1000.0, True)
        return jsonify(result)
    except Exception as e:
        logger.exception("predict failed")
        _record_latency((time.perf_counter() - t0) * 1000.0, False)
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict-batch", methods=["POST"])
def predict_batch():
    t0 = time.perf_counter()
    try:
        data = u._extract_request_json(request)
        rows = data.get("data", [])
        if not isinstance(rows, list) or len(rows) == 0:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "'data' must be a non-empty list"}), 400

        features = []
        datetimes = []
        for idx, row in enumerate(rows):
            if not isinstance(row, dict):
                _record_latency((time.perf_counter() - t0) * 1000.0, False)
                return jsonify({"error": f"Row {idx} must be an object"}), 400
            err = u._validate_single_payload(row)
            if err:
                _record_latency((time.perf_counter() - t0) * 1000.0, False)
                return jsonify({"error": f"Row {idx}: {err}"}), 400

            dt = u._parse_datetime(str(row["datetime"]))
            lag_1 = float(row.get("demand_lag_1", 0))
            lag_24 = float(row.get("demand_lag_24", lag_1))
            mean_24 = float(row.get("rolling_mean_24", lag_1))
            std_24 = float(row.get("rolling_std_24", 0))
            features.append(u._build_features(dt, lag_1, lag_24, mean_24, std_24))
            datetimes.append(dt.isoformat(sep=" "))

        preds = model_service.predict(u._features_to_df(features))
        result = []
        for dt_str, pred in zip(datetimes, preds):
            result.append({"datetime": dt_str, "predicted_demand": round(float(pred), 3), "unit": "MW"})
        save_predictions(result, "batch", model_service.model_name, payload={"count": len(rows)})
        _record_latency((time.perf_counter() - t0) * 1000.0, True)
        return jsonify({"count": len(result), "predictions": result})
    except Exception as e:
        logger.exception("predict-batch failed")
        _record_latency((time.perf_counter() - t0) * 1000.0, False)
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict-weekly", methods=["POST"])
def predict_weekly():
    t0 = time.perf_counter()
    try:
        data = u._extract_request_json(request)
        start_date = data.get("start_date")
        if not start_date:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "'start_date' is required"}), 400
        start_dt = u._parse_datetime(str(start_date))
        if start_dt is None:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "Invalid 'start_date' format"}), 400

        hours = int(data.get("hours", 168))
        if hours < 1 or hours > 744:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "'hours' must be in range 1..744"}), 400

        initial = float(data.get("initial_demand", 1500.0))
        daily_pattern = data.get("daily_pattern", [])
        rolling: List[float] = [initial] * 24
        items = []

        for i in range(hours):
            dt = start_dt + timedelta(hours=i)
            lag_1 = rolling[-1]
            lag_24 = rolling[-24] if len(rolling) >= 24 else lag_1
            mean_24 = u._mean(rolling[-24:])
            std_24 = u._std(rolling[-24:])
            pred = _predict_point(dt, lag_1, lag_24, mean_24, std_24)
            
            # Apply daily pattern if provided (0=Monday, 6=Sunday)
            if daily_pattern and isinstance(daily_pattern, list) and len(daily_pattern) == 7:
                day_idx = dt.weekday()
                try:
                    factor = float(daily_pattern[day_idx])
                    pred = pred * factor
                except (ValueError, IndexError):
                    pass
            
            rolling.append(pred)
            items.append({"datetime": dt.isoformat(sep=" "), "predicted_demand": round(pred, 3), "unit": "MW"})

        values = [x["predicted_demand"] for x in items]
        
        # Calculate daily summary
        daily_map = {}
        for item in items:
            dt_obj = u._parse_datetime(item["datetime"])
            date_key = dt_obj.strftime("%Y-%m-%d")
            if date_key not in daily_map:
                daily_map[date_key] = {"date": date_key, "hourly_data": [], "total_demand": 0.0, "peak_demand": 0.0}
            
            d = item["predicted_demand"]
            daily_map[date_key]["hourly_data"].append({"hour": dt_obj.hour, "demand": d})
            daily_map[date_key]["total_demand"] += d
            if d > daily_map[date_key]["peak_demand"]:
                daily_map[date_key]["peak_demand"] = d

        daily_summary = []
        for k, v in daily_map.items():
            count = len(v["hourly_data"])
            v["average_demand"] = round(v["total_demand"] / count, 2) if count > 0 else 0
            v["total_demand"] = round(v["total_demand"], 2)
            dt_obj = datetime.strptime(k, "%Y-%m-%d")
            v["day_name"] = dt_obj.strftime("%A")
            daily_summary.append(v)
        
        # Sort by date
        daily_summary.sort(key=lambda x: x["date"])

        save_predictions(items, "forecast", model_service.model_name, payload={"hours": hours, "start_date": start_date})
        _record_latency((time.perf_counter() - t0) * 1000.0, True)
        return jsonify(
            {
                "start_date": start_dt.isoformat(),
                "hours": hours,
                "hourly_forecast": items,
                "daily_summary": daily_summary,
                "weekly_statistics": {
                    "weekly_total_demand": u._sum(values),
                    "average_hourly_demand": u._mean(values),
                    "peak_demand": u._max(values),
                    "min_demand": u._min(values),
                },
            }
        )
    except Exception as e:
        logger.exception("predict-weekly failed")
        _record_latency((time.perf_counter() - t0) * 1000.0, False)
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict-batch-csv", methods=["POST"])
def predict_batch_csv():
    t0 = time.perf_counter()
    try:
        f = request.files.get("file")
        if not f:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "CSV file is required under form field 'file'"}), 400

        text = f.read().decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "CSV has no data rows"}), 400

        features = []
        valid_rows = []
        errors = []
        for idx, row in enumerate(rows, start=1):
            err = u._validate_single_payload(row)
            if err:
                errors.append({"row": idx, "error": err})
                continue
            dt = u._parse_datetime(str(row["datetime"]))
            lag_1 = float(row.get("demand_lag_1", 0))
            lag_24 = float(row.get("demand_lag_24", lag_1))
            mean_24 = float(row.get("rolling_mean_24", lag_1))
            std_24 = float(row.get("rolling_std_24", 0))
            features.append(u._build_features(dt, lag_1, lag_24, mean_24, std_24))
            valid_rows.append(dt.isoformat(sep=" "))

        if not valid_rows:
            _record_latency((time.perf_counter() - t0) * 1000.0, False)
            return jsonify({"error": "No valid rows in CSV", "errors": errors}), 400

        preds = model_service.predict(u._features_to_df(features))
        result = []
        for dt_str, pred in zip(valid_rows, preds):
            result.append({"datetime": dt_str, "predicted_demand": round(float(pred), 3), "unit": "MW"})

        save_predictions(result, "batch_csv", model_service.model_name, payload={"rows": len(rows), "errors": len(errors)})
        _record_latency((time.perf_counter() - t0) * 1000.0, True)
        return jsonify({"count": len(result), "predictions": result, "errors": errors})
    except Exception as e:
        logger.exception("predict-batch-csv failed")
        _record_latency((time.perf_counter() - t0) * 1000.0, False)
        return jsonify({"error": str(e)}), 500


@app.route("/api/demo", methods=["GET"])
def demo():
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    rows = []
    base = 1500.0
    for i in range(24):
        dt = now + timedelta(hours=i)
        hour = dt.hour
        if 0 <= hour < 6:
            factor = 0.78
        elif 6 <= hour < 12:
            factor = 0.95
        elif 12 <= hour < 18:
            factor = 1.08
        else:
            factor = 1.18
        val = base * factor + (u._uniform_array(-25, 25, 1)[0])
        rows.append({"datetime": dt.isoformat(sep=" "), "predicted_demand": round(float(val), 3), "unit": "MW"})
    save_predictions(rows, "demo", model_service.model_name, payload={"count": len(rows)})
    return jsonify({"count": len(rows), "predictions": rows})


@app.route("/api/history", methods=["GET"])
def history_api():
    limit = int(request.args.get("limit", 200))
    source = request.args.get("source")
    rows = get_history(limit=limit, source=source)
    return jsonify({"count": len(rows), "rows": rows})


@app.route("/api/history/clear", methods=["POST"])
def history_clear_api():
    deleted = clear_history()
    return jsonify({"deleted": deleted})


@app.route("/api/dashboard-metrics", methods=["GET"])
def dashboard_metrics():
    info = model_service.info()
    recent = get_history(limit=200)
    lat = service_stats["latency_ms"]
    p95 = 0.0
    avg = 0.0
    if lat:
        sorted_lat = sorted(lat)
        idx = int(0.95 * (len(sorted_lat) - 1))
        p95 = float(sorted_lat[idx])
        avg = float(sum(lat) / len(lat))

    recent_values = [float(x.get("predicted_demand", 0)) for x in recent[:24]]
    drift_score = 0.0
    if recent_values:
        baseline = float(os.environ.get("BASELINE_DEMAND", "1500"))
        drift_score = abs((sum(recent_values) / len(recent_values)) - baseline)

    return jsonify(
        {
            "service": {
                "started_at": service_stats["started_at"],
                "predict_calls": service_stats["predict_calls"],
                "predict_errors": service_stats["predict_errors"],
                "latency_avg_ms": round(avg, 2),
                "latency_p95_ms": round(p95, 2),
            },
            "model": info,
            "monitoring": {
                "drift_score": round(drift_score, 3),
                "drift_status": "warning" if drift_score > 120 else "normal",
            },
            "recent_history": recent,
        }
    )


@app.route("/api/visualize", methods=["POST"])
def visualize():
    try:
        if not HAS_MATPLOTLIB:
            return jsonify({"error": "Visualization is unavailable because matplotlib is not installed."}), 501

        data = u._extract_request_json(request)
        rows = data.get("predictions", [])
        if not isinstance(rows, list) or len(rows) == 0:
            return jsonify({"error": "'predictions' must be a non-empty list"}), 400

        y = []
        for row in rows:
            if isinstance(row, dict) and row.get("predicted_demand") is not None:
                y.append(float(row["predicted_demand"]))
        if not y:
            return jsonify({"error": "No plottable values found"}), 400

        fig, ax = plt.subplots(figsize=(10, 4))
        ax.plot(range(len(y)), y, linewidth=2)
        ax.set_title("Electricity Demand Forecast")
        ax.set_xlabel("Point")
        ax.set_ylabel("Demand (MW)")
        ax.grid(alpha=0.3)
        fig.tight_layout()

        buf = io.BytesIO()
        fig.savefig(buf, format="png")
        plt.close(fig)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return jsonify({"image_base64": b64, "points": len(y)})
    except Exception as e:
        logger.exception("visualize failed")
        return jsonify({"error": str(e)}), 500


@app.route("/api/export-csv", methods=["POST"])
def export_csv():
    try:
        data = u._extract_request_json(request)
        rows = data.get("predictions", data.get("data", []))
        if not isinstance(rows, list):
            return jsonify({"error": "'predictions' must be a list"}), 400
        return send_file(
            u._csv_bytes(rows),
            mimetype="text/csv",
            as_attachment=True,
            download_name="electricity_predictions.csv",
        )
    except Exception as e:
        logger.exception("export-csv failed")
        return jsonify({"error": str(e)}), 500


@app.route("/api/export-json", methods=["POST"])
def export_json():
    try:
        data = u._extract_request_json(request)
        rows = data.get("predictions", data.get("data", []))
        if not isinstance(rows, list):
            return jsonify({"error": "'predictions' must be a list"}), 400
        payload = io.BytesIO(json.dumps({"predictions": rows}, indent=2).encode("utf-8"))
        payload.seek(0)
        return send_file(
            payload,
            mimetype="application/json",
            as_attachment=True,
            download_name="electricity_predictions.json",
        )
    except Exception as e:
        logger.exception("export-json failed")
        return jsonify({"error": str(e)}), 500


# Backward-compatible aliases
app.add_url_rule("/health", view_func=health, methods=["GET"])
app.add_url_rule("/model-info", view_func=model_info, methods=["GET"])
app.add_url_rule("/predict", view_func=predict, methods=["POST"])
app.add_url_rule("/predict-batch", view_func=predict_batch, methods=["POST"])
app.add_url_rule("/predict-weekly", view_func=predict_weekly, methods=["POST"])
app.add_url_rule("/predict-batch-csv", view_func=predict_batch_csv, methods=["POST"])
app.add_url_rule("/demo", view_func=demo, methods=["GET"])
app.add_url_rule("/history-data", view_func=history_api, methods=["GET"])
app.add_url_rule("/history-clear", view_func=history_clear_api, methods=["POST"])
app.add_url_rule("/dashboard-metrics", view_func=dashboard_metrics, methods=["GET"])
app.add_url_rule("/visualize", view_func=visualize, methods=["POST"])
app.add_url_rule("/export-csv", view_func=export_csv, methods=["POST"])
app.add_url_rule("/export-json", view_func=export_json, methods=["POST"])


if __name__ == "__main__":
    os.makedirs("templates", exist_ok=True)
    os.makedirs("static", exist_ok=True)
    port = int(os.environ.get("PORT", 5050))
    logger.info("Starting on http://localhost:%s", port)
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False, threaded=True)
