// =========================================
// CHARTING UTILITIES MODULE
// =========================================

const ChartManager = (function() {
    // Chart instances storage
    const chartInstances = new Map();
    
    // Color palettes
    const colorPalettes = {
        primary: ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0'],
        sequential: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'],
        categorical: ['#4cc9f0', '#f72585', '#4361ee', '#7209b7', '#3a0ca3', '#b5179e', '#560bad', '#480ca8']
    };
    
    // Public methods
    return {
        // Create a chart
        createChart(canvasId, config) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`Canvas with id "${canvasId}" not found`);
                return null;
            }
            
            // Destroy existing chart if it exists
            this.destroyChart(canvasId);
            
            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, config);
            
            // Store chart instance
            chartInstances.set(canvasId, chart);
            
            return chart;
        },
        
        // Destroy a chart
        destroyChart(canvasId) {
            if (chartInstances.has(canvasId)) {
                chartInstances.get(canvasId).destroy();
                chartInstances.delete(canvasId);
            }
        },
        
        // Update chart data
        updateChartData(canvasId, datasetIndex, newData) {
            const chart = chartInstances.get(canvasId);
            if (chart) {
                chart.data.datasets[datasetIndex].data = newData;
                chart.update();
            }
        },
        
        // Update chart labels
        updateChartLabels(canvasId, newLabels) {
            const chart = chartInstances.get(canvasId);
            if (chart) {
                chart.data.labels = newLabels;
                chart.update();
            }
        },
        
        // Create time series chart
        createTimeSeriesChart(canvasId, data, options = {}) {
            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: options.timeUnit || 'hour'
                        },
                        title: {
                            display: true,
                            text: options.xTitle || 'Time'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: options.yTitle || 'Demand (MW)'
                        }
                    }
                }
            };
            
            const config = {
                type: 'line',
                data: {
                    datasets: [{
                        label: options.label || 'Demand',
                        data: data,
                        borderColor: options.color || colorPalettes.primary[0],
                        backgroundColor: this.addAlpha(options.color || colorPalettes.primary[0], 0.1),
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: { ...defaultOptions, ...options.chartOptions }
            };
            
            return this.createChart(canvasId, config);
        },
        
        // Create bar chart
        createBarChart(canvasId, labels, data, options = {}) {
            const config = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: options.label || 'Demand',
                        data: data,
                        backgroundColor: colorPalettes.primary,
                        borderColor: colorPalettes.primary.map(color => this.darkenColor(color, 20)),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: options.yTitle || 'Demand (MW)'
                            }
                        }
                    }
                }
            };
            
            return this.createChart(canvasId, config);
        },
        
        // Create pie/doughnut chart
        createPieChart(canvasId, labels, data, options = {}) {
            const config = {
                type: options.type || 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colorPalettes.categorical,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
            
            return this.createChart(canvasId, config);
        },
        
        // Create multi-series chart
        createMultiSeriesChart(canvasId, seriesData, options = {}) {
            const datasets = seriesData.map((series, index) => ({
                label: series.label,
                data: series.data,
                borderColor: series.color || colorPalettes.primary[index],
                backgroundColor: this.addAlpha(series.color || colorPalettes.primary[index], 0.1),
                tension: 0.1,
                fill: series.fill || false
            }));
            
            const config = {
                type: 'line',
                data: {
                    labels: options.labels || [],
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: options.xTitle || 'Time'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: options.yTitle || 'Demand (MW)'
                            }
                        }
                    }
                }
            };
            
            return this.createChart(canvasId, config);
        },
        
        // Create gauge chart
        createGaugeChart(canvasId, value, maxValue = 100, options = {}) {
            const config = {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [value, maxValue - value],
                        backgroundColor: [
                            options.color || colorPalettes.primary[0],
                            '#f0f0f0'
                        ],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            };
            
            const chart = this.createChart(canvasId, config);
            
            // Add center text
            if (chart) {
                const gaugeValue = (value / maxValue * 100).toFixed(1);
                const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
                
                chart.ctx.save();
                chart.ctx.font = 'bold 24px Arial';
                chart.ctx.fillStyle = options.color || colorPalettes.primary[0];
                chart.ctx.textAlign = 'center';
                chart.ctx.textBaseline = 'middle';
                chart.ctx.fillText(`${gaugeValue}%`, centerX, centerY - 10);
                
                chart.ctx.font = '14px Arial';
                chart.ctx.fillStyle = '#666';
                chart.ctx.fillText(options.label || 'Utilization', centerX, centerY + 20);
                chart.ctx.restore();
            }
            
            return chart;
        },
        
        // Generate random data for demo
        generateDemoData(points = 24, min = 1000, max = 2000) {
            const data = [];
            const now = new Date();
            
            for (let i = 0; i < points; i++) {
                const timestamp = new Date(now.getTime() - (points - i) * 3600000);
                const value = min + Math.random() * (max - min);
                
                // Add some pattern (lower at night, higher during day)
                const hour = timestamp.getHours();
                let patternFactor = 1;
                if (hour >= 0 && hour < 6) patternFactor = 0.7; // Night
                else if (hour >= 6 && hour < 12) patternFactor = 0.9; // Morning
                else if (hour >= 12 && hour < 18) patternFactor = 1.1; // Afternoon
                else if (hour >= 18 && hour < 24) patternFactor = 1.2; // Evening
                
                data.push({
                    x: timestamp,
                    y: value * patternFactor + (Math.random() * 200 - 100)
                });
            }
            
            return data;
        },
        
        // Helper: Add alpha to hex color
        addAlpha(color, alpha) {
            if (color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            return color;
        },
        
        // Helper: Darken color
        darkenColor(color, percent) {
            if (color.startsWith('#')) {
                let r = parseInt(color.slice(1, 3), 16);
                let g = parseInt(color.slice(3, 5), 16);
                let b = parseInt(color.slice(5, 7), 16);
                
                r = Math.max(0, Math.min(255, r * (100 - percent) / 100));
                g = Math.max(0, Math.min(255, g * (100 - percent) / 100));
                b = Math.max(0, Math.min(255, b * (100 - percent) / 100));
                
                return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
            }
            return color;
        },
        
        // Export chart as image
        exportChartAsImage(canvasId, fileName = 'chart.png') {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };
})();

// Make ChartManager available globally
window.ChartManager = ChartManager;
