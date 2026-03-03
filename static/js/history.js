// =========================================
// HISTORY PAGE LOGIC
// =========================================

const HistoryPage = (function() {
    // State
    let historicalData = [];
    let filteredData = [];
    let currentPage = 1;
    let rowsPerPage = 10;
    let filters = {};
    
    // DOM Elements
    const elements = {
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        modelFilter: document.getElementById('modelFilter'),
        statusFilter: document.getElementById('statusFilter'),
        timeFilter: document.getElementById('timeFilter'),
        
        totalPredictions: document.getElementById('totalPredictions'),
        avgAccuracy: document.getElementById('avgAccuracy'),
        avgDemand: document.getElementById('avgDemand'),
        highErrorCount: document.getElementById('highErrorCount'),
        peakDay: document.getElementById('peakDay'),
        peakHour: document.getElementById('peakHour'),
        
        performanceChart: null,
        modelComparisonChart: null,
        errorDistributionChart: null,
        hourlyPatternChart: null,
        weeklyPatternChart: null,
        
        historyTableBody: document.getElementById('historyTableBody'),
        searchHistory: document.getElementById('searchHistory'),
        rowsPerPage: document.getElementById('rowsPerPage'),
        
        startRow: document.getElementById('startRow'),
        endRow: document.getElementById('endRow'),
        totalRows: document.getElementById('totalRows'),
        pageNumbers: document.getElementById('pageNumbers'),
        
        maeValue: document.getElementById('maeValue'),
        rmseValue: document.getElementById('rmseValue'),
        mapeValue: document.getElementById('mapeValue'),
        r2Value: document.getElementById('r2Value'),
        errorInsights: document.getElementById('errorInsights'),
        patternInsights: document.getElementById('patternInsights')
    };
    
    // Public methods
    return {
        // Initialize history page
        init: function() {
            this.setupEventListeners();
            this.setDefaultDates();
            this.loadHistoricalData();
            this.initCharts();
        },
        
        // Setup event listeners
        setupEventListeners: function() {
            // Search functionality
            if (elements.searchHistory) {
                elements.searchHistory.addEventListener('input', this.handleSearch.bind(this));
            }
            
            // Rows per page change
            if (elements.rowsPerPage) {
                elements.rowsPerPage.addEventListener('change', this.updatePagination.bind(this));
            }
        },
        
        // Set default date range
        setDefaultDates: function() {
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            
            if (elements.startDate) {
                elements.startDate.value = weekAgo.toISOString().split('T')[0];
            }
            
            if (elements.endDate) {
                elements.endDate.value = today.toISOString().split('T')[0];
            }
        },
        
        // Load historical data
        loadHistoricalData: async function() {
            try {
                // Show loading state
                this.showLoading();
                
                // In a real application, you would fetch from API
                // const response = await API.getPredictionHistory();
                // historicalData = response;
                
                // For demo, generate sample data
                this.generateSampleData();
                
                // Apply initial filters
                this.applyFilters();
                
                // Update summary stats
                this.updateSummaryStats();
                
                // Update charts
                this.updateCharts();
                
                // Render table
                this.renderTable();
                
                // Hide loading state
                this.hideLoading();
                
            } catch (error) {
                console.error('Error loading historical data:', error);
                this.showError('Failed to load historical data');
            }
        },
        
        // Generate sample data for demo
        generateSampleData: function() {
            historicalData = [];
            const models = ['Random Forest', 'Gradient Boosting', 'Neural Network', 'Linear Regression'];
            const statuses = ['accurate', 'moderate', 'high_error'];
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            for (let i = 0; i < 100; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                date.setHours(Math.floor(Math.random() * 24));
                date.setMinutes(Math.floor(Math.random() * 60));
                
                const predicted = 1000 + Math.random() * 1000;
                const actual = predicted * (0.9 + Math.random() * 0.2); // 90-110% of predicted
                const error = Math.abs(actual - predicted);
                const accuracy = 100 - (error / actual * 100);
                const status = accuracy > 95 ? 'accurate' : accuracy > 90 ? 'moderate' : 'high_error';
                
                historicalData.push({
                    id: `pred_${i}`,
                    timestamp: date.toISOString(),
                    predicted_demand: predicted,
                    actual_demand: actual,
                    error: error,
                    accuracy: accuracy,
                    model: models[Math.floor(Math.random() * models.length)],
                    status: status,
                    hour: date.getHours(),
                    day: days[date.getDay()]
                });
            }
            
            // Sort by timestamp (newest first)
            historicalData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        },
        
        // Apply filters
        applyFilters: function() {
            filteredData = [...historicalData];
            
            // Apply date filter
            if (elements.startDate && elements.endDate) {
                const start = new Date(elements.startDate.value);
                const end = new Date(elements.endDate.value);
                end.setHours(23, 59, 59, 999); // End of day
                
                filteredData = filteredData.filter(item => {
                    const date = new Date(item.timestamp);
                    return date >= start && date <= end;
                });
            }
            
            // Apply model filter
            if (elements.modelFilter && elements.modelFilter.value !== 'all') {
                filteredData = filteredData.filter(item => 
                    item.model.toLowerCase().includes(elements.modelFilter.value.toLowerCase())
                );
            }
            
            // Apply status filter
            if (elements.statusFilter && elements.statusFilter.value !== 'all') {
                filteredData = filteredData.filter(item => {
                    if (elements.statusFilter.value === 'accurate') {
                        return item.accuracy >= 95;
                    } else if (elements.statusFilter.value === 'moderate') {
                        return item.accuracy >= 90 && item.accuracy < 95;
                    } else {
                        return item.accuracy < 90;
                    }
                });
            }
            
            // Apply time filter
            if (elements.timeFilter && elements.timeFilter.value !== 'all') {
                filteredData = filteredData.filter(item => {
                    const hour = item.hour;
                    if (elements.timeFilter.value === 'morning') {
                        return hour >= 6 && hour < 12;
                    } else if (elements.timeFilter.value === 'afternoon') {
                        return hour >= 12 && hour < 18;
                    } else if (elements.timeFilter.value === 'evening') {
                        return hour >= 18 && hour < 24;
                    } else {
                        return hour >= 0 && hour < 6;
                    }
                });
            }
            
            // Update pagination
            this.updatePagination();
        },
        
        // Handle search
        handleSearch: function() {
            const searchTerm = elements.searchHistory.value.toLowerCase();
            
            if (searchTerm) {
                const searchData = filteredData.filter(item => 
                    item.model.toLowerCase().includes(searchTerm) ||
                    item.status.toLowerCase().includes(searchTerm) ||
                    item.timestamp.toLowerCase().includes(searchTerm) ||
                    item.predicted_demand.toString().includes(searchTerm)
                );
                this.renderTableData(searchData);
            } else {
                this.renderTable();
            }
        },
        
        // Update pagination
        updatePagination: function() {
            if (elements.rowsPerPage) {
                rowsPerPage = parseInt(elements.rowsPerPage.value);
            }
            
            currentPage = 1;
            this.renderTable();
            this.updatePaginationControls();
        },
        
        // Update pagination controls
        updatePaginationControls: function() {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            
            // Update row info
            elements.startRow.textContent = ((currentPage - 1) * rowsPerPage) + 1;
            elements.endRow.textContent = Math.min(currentPage * rowsPerPage, filteredData.length);
            elements.totalRows.textContent = filteredData.length;
            
            // Update page numbers
            elements.pageNumbers.innerHTML = '';
            
            // Previous button
            const prevBtn = document.querySelector('.pagination-btn:first-child');
            if (prevBtn) {
                prevBtn.disabled = currentPage === 1;
            }
            
            // Next button
            const nextBtn = document.querySelector('.pagination-btn:last-child');
            if (nextBtn) {
                nextBtn.disabled = currentPage === totalPages;
            }
            
            // Page numbers
            const maxPages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
            let endPage = Math.min(totalPages, startPage + maxPages - 1);
            
            if (endPage - startPage + 1 < maxPages) {
                startPage = Math.max(1, endPage - maxPages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.onclick = () => this.goToPage(i);
                elements.pageNumbers.appendChild(pageBtn);
            }
        },
        
        // Go to specific page
        goToPage: function(page) {
            currentPage = page;
            this.renderTable();
            this.updatePaginationControls();
        },
        
        // Previous page
        prevPage: function() {
            if (currentPage > 1) {
                currentPage--;
                this.renderTable();
                this.updatePaginationControls();
            }
        },
        
        // Next page
        nextPage: function() {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                this.renderTable();
                this.updatePaginationControls();
            }
        },
        
        // Render table
        renderTable: function() {
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);
            
            this.renderTableData(pageData);
        },
        
        // Render table data
        renderTableData: function(data) {
            elements.historyTableBody.innerHTML = '';
            
            data.forEach(item => {
                const row = document.createElement('tr');
                
                // Format timestamp
                const date = new Date(item.timestamp);
                const timeString = date.toLocaleString();
                
                // Determine status class
                let statusClass = '';
                let statusText = '';
                if (item.status === 'accurate') {
                    statusClass = 'status-accurate';
                    statusText = 'Accurate';
                } else if (item.status === 'moderate') {
                    statusClass = 'status-moderate';
                    statusText = 'Moderate';
                } else {
                    statusClass = 'status-high-error';
                    statusText = 'High Error';
                }
                
                row.innerHTML = `
                    <td>${timeString}</td>
                    <td>${Math.round(item.predicted_demand).toLocaleString()} MW</td>
                    <td>${Math.round(item.actual_demand).toLocaleString()} MW</td>
                    <td>${Math.round(item.error).toLocaleString()} MW</td>
                    <td>${item.accuracy.toFixed(1)}%</td>
                    <td>${item.model}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="HistoryPage.viewDetails('${item.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                
                elements.historyTableBody.appendChild(row);
            });
            
            // Add CSS for status badges
            this.addStatusStyles();
        },
        
        // Add status styles
        addStatusStyles: function() {
            if (!document.getElementById('status-styles')) {
                const style = document.createElement('style');
                style.id = 'status-styles';
                style.textContent = `
                    .status-badge {
                        padding: 0.25rem 0.5rem;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                    }
                    .status-accurate {
                        background-color: rgba(76, 201, 240, 0.2);
                        color: #4cc9f0;
                    }
                    .status-moderate {
                        background-color: rgba(248, 150, 30, 0.2);
                        color: #f8961e;
                    }
                    .status-high-error {
                        background-color: rgba(247, 37, 133, 0.2);
                        color: #f72585;
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        // Update summary statistics
        updateSummaryStats: function() {
            if (filteredData.length === 0) return;
            
            // Total predictions
            elements.totalPredictions.textContent = filteredData.length.toLocaleString();
            
            // Average accuracy
            const avgAccuracy = filteredData.reduce((sum, item) => sum + item.accuracy, 0) / filteredData.length;
            elements.avgAccuracy.textContent = avgAccuracy.toFixed(1) + '%';
            
            // Average demand
            const avgDemand = filteredData.reduce((sum, item) => sum + item.predicted_demand, 0) / filteredData.length;
            elements.avgDemand.textContent = Math.round(avgDemand).toLocaleString();
            
            // High error count
            const highErrorCount = filteredData.filter(item => item.accuracy < 90).length;
            elements.highErrorCount.textContent = highErrorCount.toLocaleString();
            
            // Peak day
            const dayCounts = {};
            filteredData.forEach(item => {
                const day = item.day;
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            });
            
            let peakDay = '';
            let maxCount = 0;
            for (const day in dayCounts) {
                if (dayCounts[day] > maxCount) {
                    maxCount = dayCounts[day];
                    peakDay = day;
                }
            }
            elements.peakDay.textContent = peakDay;
            
            // Peak hour
            const hourCounts = {};
            filteredData.forEach(item => {
                const hour = item.hour;
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            
            let peakHour = '';
            let maxHourCount = 0;
            for (const hour in hourCounts) {
                if (hourCounts[hour] > maxHourCount) {
                    maxHourCount = hourCounts[hour];
                    peakHour = `${hour}:00`;
                }
            }
            elements.peakHour.textContent = peakHour;
        },
        
        // Initialize charts
        initCharts: function() {
            // Performance chart
            elements.performanceChart = ChartManager.createTimeSeriesChart(
                'performanceChart',
                [],
                {
                    label: 'Accuracy',
                    timeUnit: 'day',
                    xTitle: 'Date',
                    yTitle: 'Accuracy (%)'
                }
            );
            
            // Model comparison chart
            elements.modelComparisonChart = ChartManager.createBarChart(
                'modelComparisonChart',
                [],
                [],
                {
                    label: 'Accuracy',
                    yTitle: 'Accuracy (%)'
                }
            );
            
            // Error distribution chart
            elements.errorDistributionChart = ChartManager.createPieChart(
                'errorDistributionChart',
                [],
                []
            );
            
            // Hourly pattern chart
            elements.hourlyPatternChart = ChartManager.createBarChart(
                'hourlyPatternChart',
                [],
                [],
                {
                    label: 'Demand',
                    yTitle: 'Average Demand (MW)'
                }
            );
            
            // Weekly pattern chart
            elements.weeklyPatternChart = ChartManager.createBarChart(
                'weeklyPatternChart',
                [],
                [],
                {
                    label: 'Demand',
                    yTitle: 'Average Demand (MW)'
                }
            );
        },
        
        // Update charts
        updateCharts: function() {
            this.updatePerformanceChart();
            this.updateModelComparisonChart();
            this.updateErrorDistributionChart();
            this.updatePatternCharts();
            this.updateErrorMetrics();
            this.updateInsights();
        },
        
        // Update performance chart
        updatePerformanceChart: function() {
            if (!elements.performanceChart) return;
            
            // Group data by date
            const dailyData = {};
            filteredData.forEach(item => {
                const date = new Date(item.timestamp).toDateString();
                if (!dailyData[date]) {
                    dailyData[date] = { sum: 0, count: 0 };
                }
                dailyData[date].sum += item.accuracy;
                dailyData[date].count++;
            });
            
            const chartData = Object.keys(dailyData).map(date => ({
                x: new Date(date),
                y: dailyData[date].sum / dailyData[date].count
            }));
            
            // Sort by date
            chartData.sort((a, b) => a.x - b.x);
            
            ChartManager.updateChartData('performanceChart', 0, chartData);
        },
        
        // Update model comparison chart
        updateModelComparisonChart: function() {
            if (!elements.modelComparisonChart) return;
            
            // Group data by model
            const modelData = {};
            filteredData.forEach(item => {
                if (!modelData[item.model]) {
                    modelData[item.model] = { sum: 0, count: 0 };
                }
                modelData[item.model].sum += item.accuracy;
                modelData[item.model].count++;
            });
            
            const models = Object.keys(modelData);
            const accuracies = models.map(model => modelData[model].sum / modelData[model].count);
            
            ChartManager.updateChartLabels('modelComparisonChart', models);
            ChartManager.updateChartData('modelComparisonChart', 0, accuracies);
            
            // Update model stats table
            this.updateModelStatsTable(modelData);
        },
        
        // Update model stats table
        updateModelStatsTable: function(modelData) {
            const tableBody = document.querySelector('#modelStatsTable tbody');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            
            Object.keys(modelData).forEach(model => {
                const accuracy = modelData[model].sum / modelData[model].count;
                const error = 100 - accuracy;
                const count = modelData[model].count;
                
                // Determine best use case
                let bestUse = '';
                if (model.includes('Forest') || model.includes('Gradient')) {
                    bestUse = 'General purpose, high accuracy';
                } else if (model.includes('Neural')) {
                    bestUse = 'Complex patterns, large datasets';
                } else {
                    bestUse = 'Simple trends, fast predictions';
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${model}</td>
                    <td>${count}</td>
                    <td>${accuracy.toFixed(1)}%</td>
                    <td>${error.toFixed(1)}%</td>
                    <td>${bestUse}</td>
                `;
                tableBody.appendChild(row);
            });
        },
        
        // Update error distribution chart
        updateErrorDistributionChart: function() {
            if (!elements.errorDistributionChart) return;
            
            const errorRanges = [
                { label: 'Excellent (< 5%)', max: 5 },
                { label: 'Good (5-10%)', min: 5, max: 10 },
                { label: 'Fair (10-15%)', min: 10, max: 15 },
                { label: 'Poor (> 15%)', min: 15, max: 100 }
            ];
            
            const counts = errorRanges.map(range => {
                return filteredData.filter(item => {
                    const error = 100 - item.accuracy;
                    if (range.min !== undefined) {
                        return error >= range.min && error < range.max;
                    }
                    return error < range.max;
                }).length;
            });
            
            ChartManager.updateChartLabels('errorDistributionChart', errorRanges.map(r => r.label));
            ChartManager.updateChartData('errorDistributionChart', 0, counts);
        },
        
        // Update pattern charts
        updatePatternCharts: function() {
            // Hourly pattern
            const hourlyData = Array(24).fill(0).map(() => ({ sum: 0, count: 0 }));
            filteredData.forEach(item => {
                hourlyData[item.hour].sum += item.predicted_demand;
                hourlyData[item.hour].count++;
            });
            
            const hourlyAverages = hourlyData.map(h => h.count > 0 ? h.sum / h.count : 0);
            const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
            
            ChartManager.updateChartLabels('hourlyPatternChart', hourLabels);
            ChartManager.updateChartData('hourlyPatternChart', 0, hourlyAverages);
            
            // Weekly pattern
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const weeklyData = Array(7).fill(0).map(() => ({ sum: 0, count: 0 }));
            filteredData.forEach(item => {
                const date = new Date(item.timestamp);
                const day = date.getDay(); // 0 = Sunday
                weeklyData[day].sum += item.predicted_demand;
                weeklyData[day].count++;
            });
            
            const weeklyAverages = weeklyData.map(w => w.count > 0 ? w.sum / w.count : 0);
            
            ChartManager.updateChartLabels('weeklyPatternChart', days);
            ChartManager.updateChartData('weeklyPatternChart', 0, weeklyAverages);
        },
        
        // Update error metrics
        updateErrorMetrics: function() {
            if (filteredData.length === 0) return;
            
            // Calculate metrics
            let mae = 0; // Mean Absolute Error
            let mse = 0; // Mean Squared Error
            let mape = 0; // Mean Absolute Percentage Error
            let ss_res = 0; // Residual sum of squares
            let ss_tot = 0; // Total sum of squares
            
            const actualMean = filteredData.reduce((sum, item) => sum + item.actual_demand, 0) / filteredData.length;
            
            filteredData.forEach(item => {
                const error = Math.abs(item.predicted_demand - item.actual_demand);
                mae += error;
                mse += error * error;
                mape += Math.abs((item.actual_demand - item.predicted_demand) / item.actual_demand);
                ss_res += Math.pow(item.actual_demand - item.predicted_demand, 2);
                ss_tot += Math.pow(item.actual_demand - actualMean, 2);
            });
            
            mae /= filteredData.length;
            mse /= filteredData.length;
            mape = (mape / filteredData.length) * 100;
            const rmse = Math.sqrt(mse);
            const r2 = 1 - (ss_res / ss_tot);
            
            // Update DOM
            elements.maeValue.textContent = Math.round(mae).toLocaleString() + ' MW';
            elements.rmseValue.textContent = Math.round(rmse).toLocaleString() + ' MW';
            elements.mapeValue.textContent = mape.toFixed(1) + '%';
            elements.r2Value.textContent = r2.toFixed(3);
        },
        
        // Update insights
        updateInsights: function() {
            // Error insights
            const errorInsights = [
                'Most predictions (75%) have error rates below 10%',
                'The highest accuracy is achieved during morning hours',
                'Random Forest model consistently performs best across all time periods',
                'Weekends show 15% lower average demand compared to weekdays',
                'Peak prediction errors occur during sudden weather changes'
            ];
            
            elements.errorInsights.innerHTML = '';
            errorInsights.forEach(insight => {
                const li = document.createElement('li');
                li.textContent = insight;
                elements.errorInsights.appendChild(li);
            });
            
            // Pattern insights
            const patternInsights = [
                'Peak demand consistently occurs between 6 PM and 8 PM',
                'Lowest demand is observed between 2 AM and 5 AM',
                'Monday shows 10% higher demand compared to other weekdays',
                'Hourly patterns are stable with minor seasonal variations',
                'Weekend patterns differ significantly from weekday patterns'
            ];
            
            elements.patternInsights.innerHTML = '';
            patternInsights.forEach(insight => {
                const div = document.createElement('div');
                div.className = 'insight-item';
                div.innerHTML = `
                    <div class="insight-title">
                        <i class="fas fa-lightbulb"></i>
                        <span>Pattern Insight</span>
                    </div>
                    <div class="insight-description">${insight}</div>
                `;
                elements.patternInsights.appendChild(div);
            });
        },
        
        // View prediction details
        viewDetails: function(predictionId) {
            const prediction = historicalData.find(item => item.id === predictionId);
            if (!prediction) return;
            
            const modalHtml = `
                <div class="modal-overlay">
                    <div class="modal" style="max-width: 600px;">
                        <div class="modal-header">
                            <h3>Prediction Details</h3>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Timestamp:</label>
                                    <span>${new Date(prediction.timestamp).toLocaleString()}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Predicted Demand:</label>
                                    <span>${Math.round(prediction.predicted_demand).toLocaleString()} MW</span>
                                </div>
                                <div class="detail-item">
                                    <label>Actual Demand:</label>
                                    <span>${Math.round(prediction.actual_demand).toLocaleString()} MW</span>
                                </div>
                                <div class="detail-item">
                                    <label>Error:</label>
                                    <span>${Math.round(prediction.error).toLocaleString()} MW</span>
                                </div>
                                <div class="detail-item">
                                    <label>Accuracy:</label>
                                    <span>${prediction.accuracy.toFixed(1)}%</span>
                                </div>
                                <div class="detail-item">
                                    <label>Model:</label>
                                    <span>${prediction.model}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Status:</label>
                                    <span class="status-badge ${prediction.status === 'accurate' ? 'status-accurate' : prediction.status === 'moderate' ? 'status-moderate' : 'status-high-error'}">
                                        ${prediction.status === 'accurate' ? 'Accurate' : prediction.status === 'moderate' ? 'Moderate' : 'High Error'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="detail-chart">
                                <h4>Performance Comparison</h4>
                                <div class="comparison-bar">
                                    <div class="bar-label">Predicted</div>
                                    <div class="bar-container">
                                        <div class="bar predicted" style="width: ${(prediction.predicted_demand / 2500 * 100)}%">
                                            ${Math.round(prediction.predicted_demand)} MW
                                        </div>
                                    </div>
                                </div>
                                <div class="comparison-bar">
                                    <div class="bar-label">Actual</div>
                                    <div class="bar-container">
                                        <div class="bar actual" style="width: ${(prediction.actual_demand / 2500 * 100)}%">
                                            ${Math.round(prediction.actual_demand)} MW
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Add modal styles
            if (!document.getElementById('modal-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-styles';
                style.textContent = `
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }
                    .modal {
                        background-color: var(--light-color);
                        border-radius: var(--radius-lg);
                        padding: var(--spacing-md);
                        max-width: 90%;
                        max-height: 90%;
                        overflow-y: auto;
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: var(--spacing-md);
                    }
                    .modal-close {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: var(--gray-color);
                    }
                    .detail-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: var(--spacing-sm);
                        margin-bottom: var(--spacing-md);
                    }
                    .detail-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.5rem 0;
                        border-bottom: 1px solid var(--border-color);
                    }
                    .detail-item:last-child {
                        border-bottom: none;
                    }
                    .comparison-bar {
                        margin-bottom: var(--spacing-sm);
                    }
                    .bar-label {
                        margin-bottom: 0.25rem;
                        font-weight: 500;
                    }
                    .bar-container {
                        height: 30px;
                        background-color: var(--border-color);
                        border-radius: var(--radius-sm);
                        overflow: hidden;
                    }
                    .bar {
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 600;
                        font-size: 0.875rem;
                    }
                    .bar.predicted {
                        background-color: var(--primary-color);
                    }
                    .bar.actual {
                        background-color: var(--secondary-color);
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        // Export history
        exportHistory: function(format = 'csv') {
            if (filteredData.length === 0) {
                App.showNotification('No data to export', 'warning');
                return;
            }
            
            switch (format) {
                case 'csv':
                    this.exportAsCSV();
                    break;
                case 'pdf':
                    this.exportAsPDF();
                    break;
                case 'json':
                    this.exportAsJSON();
                    break;
            }
        },
        
        // Export as CSV
        exportAsCSV: function() {
            let csvContent = 'Timestamp,Predicted Demand (MW),Actual Demand (MW),Error (MW),Accuracy (%),Model,Status\n';
            
            filteredData.forEach(item => {
                const date = new Date(item.timestamp);
                const dateStr = date.toLocaleString();
                csvContent += `"${dateStr}",${item.predicted_demand},${item.actual_demand},${item.error},${item.accuracy},${item.model},${item.status}\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historical_data_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            App.showNotification('Historical data exported as CSV', 'success');
        },
        
        // Export as PDF (placeholder)
        exportAsPDF: function() {
            App.showNotification('PDF export would be implemented with a PDF library like jsPDF', 'info');
        },
        
        // Export as JSON
        exportAsJSON: function() {
            const jsonStr = JSON.stringify(filteredData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historical_data_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            App.showNotification('Historical data exported as JSON', 'success');
        },
        
        // Show loading state
        showLoading: function() {
            // Implementation for loading state
        },
        
        // Hide loading state
        hideLoading: function() {
            // Implementation for hiding loading state
        },
        
        // Show error
        showError: function(message) {
            App.showNotification(message, 'error');
        }
    };
})();

// Make HistoryPage available globally
window.HistoryPage = HistoryPage;

// Initialize when DOM is loaded
if (document.querySelector('.history-page')) {
    document.addEventListener('DOMContentLoaded', function() {
        HistoryPage.init();
    });
}

// Global functions for HTML onclick handlers
window.applyFilters = function() {
    HistoryPage.applyFilters();
};

window.resetFilters = function() {
    if (HistoryPage.elements.startDate) HistoryPage.elements.startDate.value = '';
    if (HistoryPage.elements.endDate) HistoryPage.elements.endDate.value = '';
    if (HistoryPage.elements.modelFilter) HistoryPage.elements.modelFilter.value = 'all';
    if (HistoryPage.elements.statusFilter) HistoryPage.elements.statusFilter.value = 'all';
    if (HistoryPage.elements.timeFilter) HistoryPage.elements.timeFilter.value = 'all';
    HistoryPage.applyFilters();
};

window.exportHistory = function() {
    HistoryPage.exportHistory('csv');
};

window.prevPage = function() {
    HistoryPage.prevPage();
};

window.nextPage = function() {
    HistoryPage.nextPage();
};

window.generateReport = function() {
    App.showNotification('Report generation feature would be implemented', 'info');
};

window.exportPatterns = function() {
    HistoryPage.exportHistory('json');
};

window.exportAsCSV = function() {
    HistoryPage.exportHistory('csv');
};

window.exportAsPDF = function() {
    HistoryPage.exportHistory('pdf');
};

window.exportAsJSON = function() {
    HistoryPage.exportHistory('json');
};

window.createBackup = function() {
    App.showNotification('Database backup feature would be implemented', 'info');
};