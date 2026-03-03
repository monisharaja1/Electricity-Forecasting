let demandChart = null;
let dashboardBooted = false;

function renderChart(rows) {
    const canvas = document.getElementById("db_chart");
    if (!canvas || !window.Chart) return;

    const labels = rows.map((r, i) => `${i + 1}`);
    const values = rows.map((r) => Number(r.predicted_demand || 0));
    const movingAvg = values.map((_, idx) => {
        const start = Math.max(0, idx - 2);
        const segment = values.slice(start, idx + 1);
        return segment.reduce((a, b) => a + b, 0) / segment.length;
    });

    if (demandChart) {
        demandChart.destroy();
    }

    demandChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Predicted Demand (MW)",
                    data: values,
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37, 99, 235, 0.12)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2
                },
                {
                    label: "Moving Avg (3)",
                    data: movingAvg,
                    borderColor: "#00a28b",
                    backgroundColor: "rgba(0, 162, 139, 0)",
                    fill: false,
                    tension: 0.25,
                    pointRadius: 0,
                    borderDash: [6, 4]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: { title: { display: true, text: "Hour Index" } },
                y: { title: { display: true, text: "MW" } }
            }
        }
    });
}

async function loadDashboard() {
    const ui = window.SmartGridUI || {};
    const healthEl = document.getElementById("db_health");
    const modelEl = document.getElementById("db_model");
    const featuresEl = document.getElementById("db_features");
    const versionEl = document.getElementById("db_version");
    const qualityEl = document.getElementById("db_quality");
    const p95El = document.getElementById("db_p95");
    const callsEl = document.getElementById("db_calls");
    const errorsEl = document.getElementById("db_errors");
    const driftEl = document.getElementById("db_drift");
    const rowsEl = document.getElementById("db_rows");

    try {
        const [health, info, metrics] = await Promise.all([
            ui.requestJSON ? ui.requestJSON("/api/health", { timeoutMs: 12000, retries: 1 }) : (await fetch("/api/health")).json(),
            ui.requestJSON ? ui.requestJSON("/api/model-info", { timeoutMs: 12000, retries: 1 }) : (await fetch("/api/model-info")).json(),
            ui.requestJSON ? ui.requestJSON("/api/dashboard-metrics", { timeoutMs: 12000, retries: 1 }) : (await fetch("/api/dashboard-metrics")).json()
        ]);

        healthEl.textContent = health.status || "unknown";
        modelEl.textContent = info.model_name || "-";
        featuresEl.textContent = String(info.features_count || 0);
        versionEl.textContent = info.model_version || "-";
        const qm = info.quality_metrics || {};
        qualityEl.textContent = `MAE ${qm.mae ?? "-"} / RMSE ${qm.rmse ?? "-"}`;
        p95El.textContent = `${metrics.service?.latency_p95_ms ?? 0} ms`;
        callsEl.textContent = String(metrics.service?.predict_calls ?? 0);
        errorsEl.textContent = String(metrics.service?.predict_errors ?? 0);
        driftEl.textContent = `${metrics.monitoring?.drift_status ?? "normal"} (${metrics.monitoring?.drift_score ?? 0})`;

        const rows = metrics.recent_history || [];
        rowsEl.innerHTML = "";
        if (!rows.length) {
            rowsEl.innerHTML = `<tr><td colspan="3" class="muted">No records yet.</td></tr>`;
        }
        rows.forEach((r, i) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${i + 1}</td><td>${r.datetime}</td><td>${r.predicted_demand}</td>`;
            rowsEl.appendChild(tr);
        });
        renderChart(rows);
    } catch (err) {
        healthEl.textContent = "error";
        modelEl.textContent = "error";
        featuresEl.textContent = "error";
        rowsEl.innerHTML = `<tr><td colspan="3" class="error">${err.message}</td></tr>`;
        if (ui.showToast) ui.showToast(err.message, "error");
    }
}

function bootDashboard() {
    if (dashboardBooted) return;
    dashboardBooted = true;

    if (!window.Chart) {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/chart.js";
        s.onload = loadDashboard;
        s.onerror = loadDashboard;
        document.head.appendChild(s);
        setTimeout(loadDashboard, 2500);
        return;
    }
    loadDashboard();
}

document.addEventListener("DOMContentLoaded", bootDashboard);
