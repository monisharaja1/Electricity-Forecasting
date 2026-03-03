// =========================================
// FORECAST PAGE LOGIC - COLORFUL VERSION
// =========================================

const ForecastPage = (function() {
    // State
    let forecastData = null;
    let currentView = 'table';
    
    // Color Scheme
    const colors = {
        primary: '#667eea',
        primaryLight: '#7c93ed',
        primaryDark: '#5a67d8',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        
        // Gradient colors
        gradient1: ['#667eea', '#764ba2'],
        gradient2: ['#f093fb', '#f5576c'],
        gradient3: ['#4facfe', '#00f2fe'],
        gradient4: ['#43e97b', '#38f9d7'],
        gradient5: ['#fa709a', '#fee140'],
        
        // Day colors
        monday: '#FF6B6B',
        tuesday: '#4ECDC4',
        wednesday: '#FFD166',
        thursday: '#06D6A0',
        friday: '#118AB2',
        saturday: '#073B4C',
        sunday: '#EF476F',
        
        // Chart colors
        chartLine: '#667eea',
        chartFill: 'rgba(102, 126, 234, 0.1)',
        chartGrid: 'rgba(102, 126, 234, 0.05)',
        
        // Pattern colors
        patternLow: '#4cc9f0',
        patternNormal: '#4361ee',
        patternHigh: '#f72585'
    };
    
    // DOM Elements
    const elements = {
        forecastForm: document.getElementById('forecastForm'),
        forecastStartDate: document.getElementById('forecastStartDate'),
        initialDemand: document.getElementById('initialDemand'),
        forecastModel: document.getElementById('forecastModel'),
        patternInputs: document.querySelectorAll('.pattern-input'),
        
        forecastLoading: document.getElementById('forecastLoading'),
        forecastProgress: document.getElementById('forecastProgress'),
        
        weeklyForecastChart: null,
        hourlyDetailChart: null,
        
        forecastTableBody: document.getElementById('forecastTableBody'),
        dailyCardsContainer: document.getElementById('dailyCardsContainer'),
        hourlyTableBody: document.getElementById('hourlyTableBody'),
        daySelector: document.getElementById('daySelector'),
        
        totalDemand: document.getElementById('totalDemand'),
        avgDemand: document.getElementById('avgDemand'),
        peakDemand: document.getElementById('peakDemand'),
        minDemand: document.getElementById('minDemand'),
        variation: document.getElementById('variation'),
        peakDay: document.getElementById('peakDay'),
        
        viewToggles: document.querySelectorAll('.view-toggle')
    };
    
    // Public methods
    return {
        // Initialize forecast page
        init: function() {
            this.setupEventListeners();
            this.setDefaultDate();
            this.setupPatternInputs();
            this.setupViewToggles();
            this.applyColorTheme();
            
            // Load sample data if no data exists
            if (!forecastData) {
                setTimeout(() => this.loadSampleData(), 1000);
            }
        },
        
        // Apply colorful theme to page
        applyColorTheme: function() {
            // Style buttons
            const primaryBtns = document.querySelectorAll('.btn-primary');
            primaryBtns.forEach(btn => {
                btn.style.background = `linear-gradient(135deg, ${colors.gradient1[0]} 0%, ${colors.gradient1[1]} 100%)`;
                btn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            });
            
            // Style cards
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.borderLeft = `4px solid ${colors.primary}`;
                card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            });
            
            // Style form inputs
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.style.borderColor = colors.primaryLight;
                input.addEventListener('focus', (e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                });
                input.addEventListener('blur', (e) => {
                    e.target.style.borderColor = colors.primaryLight;
                    e.target.style.boxShadow = 'none';
                });
            });
            
            // Add colorful backgrounds to sections
            const sections = document.querySelectorAll('.card-header');
            sections.forEach(section => {
                section.style.background = `linear-gradient(135deg, ${colors.gradient1[0]}15 0%, ${colors.gradient1[1]}15 100%)`;
                section.style.borderBottom = `2px solid ${colors.primary}20`;
            });
        },
        
        // Setup event listeners
        setupEventListeners: function() {
            // Pattern inputs
            elements.patternInputs.forEach(input => {
                input.addEventListener('change', this.updatePatternValue.bind(this));
                input.addEventListener('input', this.updatePatternValue.bind(this));
            });
            
            // Day selector
            if (elements.daySelector) {
                elements.daySelector.addEventListener('change', this.updateHourlyView.bind(this));
            }
        },
        
        // Setup view toggles
        setupViewToggles: function() {
            elements.viewToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const view = toggle.getAttribute('data-view');
                    this.switchView(view);
                });
                
                // Add colorful hover effects
                toggle.addEventListener('mouseenter', () => {
                    toggle.style.transform = 'translateY(-2px)';
                    toggle.style.boxShadow = `0 6px 20px ${colors.primary}40`;
                });
                
                toggle.addEventListener('mouseleave', () => {
                    toggle.style.transform = 'translateY(0)';
                    toggle.style.boxShadow = 'none';
                });
            });
        },
        
        // Switch between table and cards view
        switchView: function(view) {
            if (view === currentView) return;
            
            // Update active toggle
            elements.viewToggles.forEach(toggle => {
                if (toggle.getAttribute('data-view') === view) {
                    toggle.classList.add('active');
                    toggle.style.background = `linear-gradient(135deg, ${colors.gradient1[0]} 0%, ${colors.gradient1[1]} 100%)`;
                    toggle.style.color = 'white';
                } else {
                    toggle.classList.remove('active');
                    toggle.style.background = 'white';
                    toggle.style.color = colors.primary;
                }
            });
            
            // Hide all views
            document.getElementById('tableView').classList.add('hidden');
            document.getElementById('cardsView').classList.add('hidden');
            
            // Show selected view with animation
            const targetView = document.getElementById(`${view}View`);
            targetView.classList.remove('hidden');
            targetView.style.opacity = '0';
            targetView.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                targetView.style.transition = 'all 0.3s ease';
                targetView.style.opacity = '1';
                targetView.style.transform = 'translateY(0)';
            }, 10);
            
            currentView = view;
            
            // Render data for new view
            if (forecastData) {
                if (view === 'table') {
                    this.renderForecastTable();
                } else {
                    this.renderDailyCards();
                }
            }
        },
        
        // Set default date to today
        setDefaultDate: function() {
            const today = new Date().toISOString().split('T')[0];
            if (elements.forecastStartDate) {
                elements.forecastStartDate.value = today;
            }
        },
        
        // Setup pattern inputs with colorful sliders
        setupPatternInputs: function() {
            const dayColors = [
                colors.monday, colors.tuesday, colors.wednesday, 
                colors.thursday, colors.friday, colors.saturday, colors.sunday
            ];
            
            elements.patternInputs.forEach((input, index) => {
                const container = document.createElement('div');
                container.className = 'pattern-slider-container';
                container.style.position = 'relative';
                container.style.marginBottom = '20px';
                
                const label = document.createElement('span');
                label.className = 'pattern-day-label';
                label.textContent = input.getAttribute('data-day').charAt(0).toUpperCase() + 
                                  input.getAttribute('data-day').slice(1);
                label.style.position = 'absolute';
                label.style.top = '-20px';
                label.style.left = '0';
                label.style.color = dayColors[index];
                label.style.fontWeight = '600';
                label.style.fontSize = '12px';
                
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = '0.5';
                slider.max = '1.5';
                slider.step = '0.01';
                slider.value = input.value;
                slider.className = 'pattern-slider';
                slider.style.width = '100%';
                slider.style.height = '20px';
                slider.style.background = `linear-gradient(to right, ${colors.patternLow}, ${colors.patternNormal}, ${colors.patternHigh})`;
                slider.style.webkitAppearance = 'none';
                slider.style.borderRadius = '10px';
                slider.style.outline = 'none';
                
                // Custom slider styling
                slider.style.cursor = 'pointer';
                
                // For Webkit browsers
                slider.addEventListener('input', (e) => {
                    input.value = e.target.value;
                    this.updatePatternValue(e);
                    this.updateSliderGradient(slider, e.target.value);
                });
                
                input.parentNode.insertBefore(container, input);
                container.appendChild(label);
                container.appendChild(slider);
                container.appendChild(input);
                
                // Add value display
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'pattern-value-display';
                valueDisplay.textContent = input.value;
                valueDisplay.style.position = 'absolute';
                valueDisplay.style.top = '-20px';
                valueDisplay.style.right = '0';
                valueDisplay.style.color = dayColors[index];
                valueDisplay.style.fontWeight = '600';
                valueDisplay.style.fontSize = '12px';
                container.appendChild(valueDisplay);
                
                // Update slider gradient initially
                this.updateSliderGradient(slider, slider.value);
                
                // Update value display
                input.addEventListener('input', () => {
                    valueDisplay.textContent = parseFloat(input.value).toFixed(2);
                });
            });
        },
        
        // Update slider gradient based on value
        updateSliderGradient: function(slider, value) {
            const val = parseFloat(value);
            let color;
            
            if (val < 0.8) {
                color = colors.patternLow;
            } else if (val > 1.2) {
                color = colors.patternHigh;
            } else {
                color = colors.patternNormal;
            }
            
            slider.style.background = `linear-gradient(to right, ${colors.patternLow}, ${color}, ${colors.patternHigh})`;
        },
        
        // Update pattern value
        updatePatternValue: function(e) {
            const input = e.target.classList.contains('pattern-input') ? e.target : e.target.nextElementSibling;
            const slider = e.target.classList.contains('pattern-slider') ? e.target : e.target.previousElementSibling;
            
            if (input && slider) {
                if (e.target === input) {
                    slider.value = input.value;
                } else {
                    input.value = slider.value;
                }
                
                // Update color based on value
                const value = parseFloat(input.value);
                let color;
                
                if (value < 0.8) {
                    color = colors.patternLow;
                } else if (value > 1.2) {
                    color = colors.patternHigh;
                } else {
                    color = colors.patternNormal;
                }
                
                input.style.borderColor = color;
                input.style.boxShadow = `0 0 0 2px ${color}40`;
                input.style.color = color;
                
                // Update value display
                const valueDisplay = input.parentNode.querySelector('.pattern-value-display');
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(2);
                    valueDisplay.style.color = color;
                }
                
                // Update slider gradient
                this.updateSliderGradient(slider, value);
            }
        },
        
        // Generate forecast
        generateForecast: async function() {
            try {
                // Show loading state with animation
                elements.forecastLoading.classList.remove('hidden');
                elements.forecastLoading.innerHTML = `
                    <div class="loading-animation">
                        <div class="spinner" style="
                            width: 60px;
                            height: 60px;
                            border: 4px solid ${colors.primary}20;
                            border-top: 4px solid ${colors.primary};
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 20px;
                        "></div>
                        <h3 style="color: ${colors.primary}; margin-bottom: 10px;">Generating Forecast</h3>
                        <p style="color: #666;">Analyzing patterns and predicting demand...</p>
                        <div class="progress-container" style="
                            width: 100%;
                            height: 8px;
                            background: ${colors.primary}20;
                            border-radius: 4px;
                            margin-top: 20px;
                            overflow: hidden;
                        ">
                            <div id="forecastProgress" style="
                                height: 100%;
                                width: 0%;
                                background: linear-gradient(90deg, ${colors.gradient3[0]}, ${colors.gradient3[1]});
                                border-radius: 4px;
                                transition: width 0.3s ease;
                            "></div>
                        </div>
                    </div>
                `;
                
                // Simulate progress
                this.simulateProgress();
                
                // Collect form data
                const formData = {
                    start_date: `${elements.forecastStartDate.value} 00:00:00`,
                    initial_demand: parseFloat(elements.initialDemand.value),
                    daily_pattern: this.getDailyPattern(),
                    model: elements.forecastModel.value
                };
                
                // Call API
                const response = await API.getWeeklyForecast(formData);
                
                // Process API response to match UI requirements (add colors, etc)
                forecastData = this.processApiResponse(response);
                
                // Hide loading state
                elements.forecastLoading.classList.add('hidden');
                
                // Render all components
                this.renderForecastChart();
                this.renderForecastTable();
                this.renderDailyCards();
                this.renderHourlyView();
                this.renderSummaryStats();
                
                // Show success notification with animation
                this.showColorfulNotification('Weekly forecast generated successfully!', 'success');
                
            } catch (error) {
                elements.forecastLoading.classList.add('hidden');
                this.showColorfulNotification(`Forecast generation failed: ${error.message}`, 'error');
                console.error('Forecast generation error:', error);
            }
        },
        
        // Process API response to add UI-specific properties
        processApiResponse: function(data) {
            const dayColors = {
                'Sunday': colors.sunday,
                'Monday': colors.monday,
                'Tuesday': colors.tuesday,
                'Wednesday': colors.wednesday,
                'Thursday': colors.thursday,
                'Friday': colors.friday,
                'Saturday': colors.saturday
            };

            if (data.daily_summary) {
                data.daily_summary.forEach(day => {
                    // Ensure day_name matches keys in dayColors
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    day.color = dayColors[dayName] || colors.primary;
                });
            }

            return data;
        },

        // Generate sample forecast data
        generateSampleForecast: function(formData) {
            const startDate = new Date(formData.start_date);
            const dailyPattern = formData.daily_pattern;
            const hourlyForecast = [];
            const dailySummary = [];
            
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayColors = [
                colors.sunday, colors.monday, colors.tuesday, 
                colors.wednesday, colors.thursday, colors.friday, colors.saturday
            ];
            
            // Generate 7 days of forecast
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + day);
                
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayName = dayNames[currentDate.getDay()];
                const dayPattern = dailyPattern[currentDate.getDay()];
                
                const hourlyData = [];
                let dailyTotal = 0;
                let peakDemand = 0;
                
                // Generate 24 hours
                for (let hour = 0; hour < 24; hour++) {
                    // Base demand with time-of-day pattern
                    let hourDemand;
                    if (hour >= 6 && hour < 12) {
                        hourDemand = 1400; // Morning
                    } else if (hour >= 12 && hour < 18) {
                        hourDemand = 1600; // Afternoon
                    } else if (hour >= 18 && hour < 22) {
                        hourDemand = 1800; // Evening
                    } else {
                        hourDemand = 1000; // Night
                    }
                    
                    // Apply daily pattern
                    hourDemand *= dayPattern;
                    
                    // Add some randomness
                    hourDemand += (Math.random() - 0.5) * 200;
                    hourDemand = Math.round(hourDemand);
                    
                    hourlyData.push({ hour, demand: hourDemand });
                    hourlyForecast.push({
                        timestamp: new Date(currentDate.setHours(hour, 0, 0, 0)).toISOString(),
                        predicted_demand: hourDemand
                    });
                    
                    dailyTotal += hourDemand;
                    peakDemand = Math.max(peakDemand, hourDemand);
                }
                
                dailySummary.push({
                    date: dateStr,
                    day_name: dayName,
                    total_demand: dailyTotal,
                    average_demand: Math.round(dailyTotal / 24),
                    peak_demand: peakDemand,
                    hourly_data: hourlyData,
                    color: dayColors[currentDate.getDay()]
                });
            }
            
            // Calculate weekly statistics
            const weeklyStats = {
                weekly_total_demand: dailySummary.reduce((sum, day) => sum + day.total_demand, 0),
                weekly_average_demand: Math.round(dailySummary.reduce((sum, day) => sum + day.average_demand, 0) / 7),
                weekly_peak_demand: Math.max(...dailySummary.map(day => day.peak_demand)),
                weekly_min_demand: Math.min(...dailySummary.map(day => Math.min(...day.hourly_data.map(h => h.demand)))),
                weekly_pattern: dailyPattern
            };
            
            return {
                hourly_forecast: hourlyForecast,
                daily_summary: dailySummary,
                weekly_statistics: weeklyStats,
                metadata: {
                    generated_at: new Date().toISOString(),
                    model_used: formData.model,
                    initial_demand: formData.initial_demand
                }
            };
        },
        
        // Simulate progress for demo
        simulateProgress: function() {
            let progress = 0;
            const progressBar = document.getElementById('forecastProgress');
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            }, 200);
        },
        
        // Get daily pattern from inputs
        getDailyPattern: function() {
            const pattern = {};
            elements.patternInputs.forEach(input => {
                const day = input.getAttribute('data-day');
                pattern[day] = parseFloat(input.value);
            });
            
            // Convert to array in correct order
            const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return dayOrder.map(day => pattern[day]);
        },
        
        // Render forecast chart
        renderForecastChart: function() {
            if (!forecastData || !forecastData.hourly_forecast) return;
            
            const ctx = document.getElementById('weeklyForecastChart').getContext('2d');
            
            // Destroy existing chart
            if (this.weeklyForecastChart) {
                this.weeklyForecastChart.destroy();
            }
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0.1)');
            
            const data = forecastData.hourly_forecast.map(point => ({
                x: new Date(point.timestamp),
                y: point.predicted_demand
            }));
            
            this.weeklyForecastChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Demand Forecast',
                        data: data,
                        borderColor: colors.chartLine,
                        backgroundColor: gradient,
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: colors.primary,
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: colors.primary,
                                font: {
                                    size: 14
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: colors.primary,
                            bodyColor: '#666',
                            borderColor: colors.primary,
                            borderWidth: 1,
                            boxPadding: 5
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'MMM d'
                                }
                            },
                            grid: {
                                color: colors.chartGrid
                            },
                            ticks: {
                                color: colors.primary
                            }
                        },
                        y: {
                            grid: {
                                color: colors.chartGrid
                            },
                            ticks: {
                                color: colors.primary,
                                callback: function(value) {
                                    return value.toLocaleString() + ' MW';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Demand (MW)',
                                color: colors.primary,
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        },
        
        // Render forecast table with colorful rows
        renderForecastTable: function() {
            if (!forecastData || !forecastData.daily_summary) return;
            
            const tableBody = elements.forecastTableBody;
            tableBody.innerHTML = '';
            
            forecastData.daily_summary.forEach((day, index) => {
                const date = new Date(day.date);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = dayNames[date.getDay()];
                
                // Find peak hour
                let peakHour = 0;
                let peakDemand = 0;
                if (day.hourly_data) {
                    day.hourly_data.forEach(hour => {
                        if (hour.demand > peakDemand) {
                            peakDemand = hour.demand;
                            peakHour = hour.hour;
                        }
                    });
                }
                
                const row = document.createElement('tr');
                row.style.transition = 'all 0.3s ease';
                row.style.borderLeft = `4px solid ${day.color}`;
                
                row.innerHTML = `
                    <td style="font-weight: 600; color: ${day.color}">${day.date}</td>
                    <td>${dayName}</td>
                    <td><span class="demand-value">${Math.round(day.total_demand).toLocaleString()}</span> MW</td>
                    <td>${peakHour}:00</td>
                    <td><span class="peak-value">${Math.round(peakDemand).toLocaleString()}</span> MW</td>
                    <td>${Math.round(day.average_demand).toLocaleString()} MW</td>
                    <td>
                        <button class="btn btn-sm btn-outline" 
                                onclick="ForecastPage.viewDayDetails(${index})"
                                style="border-color: ${day.color}; color: ${day.color};">
                            <i class="fas fa-chart-bar"></i> Details
                        </button>
                    </td>
                `;
                
                // Add hover effect
                row.addEventListener('mouseenter', () => {
                    row.style.transform = 'translateX(5px)';
                    row.style.boxShadow = `0 4px 15px ${day.color}40`;
                    row.style.backgroundColor = `${day.color}10`;
                });
                
                row.addEventListener('mouseleave', () => {
                    row.style.transform = 'translateX(0)';
                    row.style.boxShadow = 'none';
                    row.style.backgroundColor = 'transparent';
                });
                
                tableBody.appendChild(row);
            });
        },
        
        // Render daily cards with colorful backgrounds
        renderDailyCards: function() {
            if (!forecastData || !forecastData.daily_summary) return;
            
            const container = elements.dailyCardsContainer;
            container.innerHTML = '';
            
            forecastData.daily_summary.forEach((day, index) => {
                const date = new Date(day.date);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = dayNames[date.getDay()];
                
                // Calculate hourly chart data
                const hourlyData = day.hourly_data || [];
                const hours = hourlyData.map(h => h.hour);
                const demands = hourlyData.map(h => h.demand);
                
                const card = document.createElement('div');
                card.className = 'daily-card';
                card.style.background = `linear-gradient(135deg, ${day.color}15 0%, ${day.color}05 100%)`;
                card.style.border = `2px solid ${day.color}30`;
                card.style.borderRadius = '15px';
                card.style.padding = '20px';
                card.style.transition = 'all 0.3s ease';
                
                card.innerHTML = `
                    <div class="daily-card-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid ${day.color}20;
                    ">
                        <h4 style="color: ${day.color}; margin: 0; font-weight: 600;">
                            ${dayName} - ${day.date}
                        </h4>
                        <span class="daily-total" style="
                            background: ${day.color};
                            color: white;
                            padding: 5px 15px;
                            border-radius: 20px;
                            font-weight: 600;
                            font-size: 1.1rem;
                        ">
                            ${Math.round(day.total_demand).toLocaleString()} MW
                        </span>
                    </div>
                    
                    <div class="daily-stats" style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 15px;
                    ">
                        <div class="daily-stat" style="
                            background: white;
                            padding: 10px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-arrow-up" style="color: ${colors.danger}"></i>
                            <span>Peak: <strong>${Math.round(day.peak_demand).toLocaleString()} MW</strong></span>
                        </div>
                        <div class="daily-stat" style="
                            background: white;
                            padding: 10px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-chart-line" style="color: ${colors.success}"></i>
                            <span>Avg: <strong>${Math.round(day.average_demand).toLocaleString()} MW</strong></span>
                        </div>
                    </div>
                    
                    <div class="daily-chart-container" style="height: 120px; margin: 15px 0;">
                        <canvas id="dailyChart${index}"></canvas>
                    </div>
                    
                    <button class="btn btn-sm btn-outline" 
                            onclick="ForecastPage.viewDayDetails(${index})"
                            style="
                                width: 100%;
                                border-color: ${day.color};
                                color: ${day.color};
                                margin-top: 10px;
                            ">
                        <i class="fas fa-chart-bar"></i> View Details
                    </button>
                `;
                
                // Add hover effect
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-5px)';
                    card.style.boxShadow = `0 10px 30px ${day.color}30`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                });
                
                container.appendChild(card);
                
                // Create mini chart
                setTimeout(() => {
                    this.createDailyMiniChart(`dailyChart${index}`, hours, demands, day.color);
                }, 100);
            });
        },
        
        // Create daily mini chart
        createDailyMiniChart: function(canvasId, hours, demands, color) {
            const ctx = document.getElementById(canvasId).getContext('2d');
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 120);
            gradient.addColorStop(0, `${color}60`);
            gradient.addColorStop(1, `${color}10`);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hours.map(h => `${h}:00`),
                    datasets: [{
                        data: demands,
                        borderColor: color,
                        backgroundColor: gradient,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    interaction: { intersect: false },
                    elements: {
                        line: {
                            tension: 0.4
                        }
                    }
                }
            });
        },
        
        // Render hourly view
        renderHourlyView: function() {
            if (!forecastData || !forecastData.hourly_forecast) return;
            
            this.updateHourlyChart();
            this.updateHourlyTable();
        },
        
        // Update hourly chart based on selected day
        updateHourlyChart: function() {
            if (!forecastData || !forecastData.hourly_forecast) return;
            
            const selectedDay = elements.daySelector.value;
            let filteredData = forecastData.hourly_forecast;
            
            if (selectedDay !== 'all') {
                filteredData = forecastData.hourly_forecast.filter(point => {
                    const date = new Date(point.timestamp);
                    return date.getDay() === parseInt(selectedDay);
                });
            }
            
            const ctx = document.getElementById('hourlyDetailChart').getContext('2d');
            
            // Destroy existing chart
            if (this.hourlyDetailChart) {
                this.hourlyDetailChart.destroy();
            }
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(247, 37, 133, 0.6)');
            gradient.addColorStop(1, 'rgba(247, 37, 133, 0.1)');
            
            const data = filteredData.map(point => ({
                x: new Date(point.timestamp),
                y: point.predicted_demand
            }));
            
            this.hourlyDetailChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Hourly Demand',
                        data: data,
                        borderColor: colors.patternHigh,
                        backgroundColor: gradient,
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: colors.patternHigh,
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: colors.patternHigh,
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'hour',
                                displayFormats: {
                                    hour: 'HH:mm'
                                }
                            },
                            grid: {
                                color: colors.chartGrid
                            },
                            ticks: {
                                color: colors.primary
                            },
                            title: {
                                display: true,
                                text: 'Time',
                                color: colors.primary
                            }
                        },
                        y: {
                            grid: {
                                color: colors.chartGrid
                            },
                            ticks: {
                                color: colors.primary,
                                callback: function(value) {
                                    return value.toLocaleString() + ' MW';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Demand (MW)',
                                color: colors.primary
                            }
                        }
                    }
                }
            });
        },
        
        // Update hourly table with colorful rows
        updateHourlyTable: function() {
            if (!forecastData || !forecastData.hourly_forecast) return;
            
            const selectedDay = elements.daySelector.value;
            let filteredData = forecastData.hourly_forecast;
            
            if (selectedDay !== 'all') {
                filteredData = forecastData.hourly_forecast.filter(point => {
                    const date = new Date(point.timestamp);
                    return date.getDay() === parseInt(selectedDay);
                });
            }
            
            const tableBody = elements.hourlyTableBody;
            tableBody.innerHTML = '';
            
            filteredData.forEach((point, index) => {
                const date = new Date(point.timestamp);
                const hour = date.getHours();
                const timeString = `${hour.toString().padStart(2, '0')}:00`;
                
                // Calculate trend
                let trend = 'stable';
                let trendIcon = 'minus';
                let trendColor = colors.info;
                
                if (index > 0) {
                    const prevDemand = filteredData[index - 1].predicted_demand;
                    const diff = point.predicted_demand - prevDemand;
                    const percentDiff = (diff / prevDemand) * 100;
                    
                    if (percentDiff > 5) {
                        trend = 'rising';
                        trendIcon = 'arrow-up';
                        trendColor = colors.success;
                    } else if (percentDiff < -5) {
                        trend = 'falling';
                        trendIcon = 'arrow-down';
                        trendColor = colors.danger;
                    }
                }
                
                // Calculate percentage of daily average
                const dailyAvg = filteredData.reduce((sum, p) => sum + p.predicted_demand, 0) / filteredData.length;
                const percentOfAvg = ((point.predicted_demand / dailyAvg) * 100).toFixed(1);
                
                // Determine demand level color
                let demandColor = colors.info;
                if (point.predicted_demand > dailyAvg * 1.2) {
                    demandColor = colors.danger;
                } else if (point.predicted_demand > dailyAvg * 1.1) {
                    demandColor = colors.warning;
                } else if (point.predicted_demand > dailyAvg) {
                    demandColor = colors.success;
                }
                
                const row = document.createElement('tr');
                row.style.transition = 'all 0.3s ease';
                
                row.innerHTML = `
                    <td style="font-weight: 600; color: ${colors.primary}">${hour}</td>
                    <td>${timeString}</td>
                    <td style="color: ${demandColor}; font-weight: 600;">
                        ${Math.round(point.predicted_demand).toLocaleString()} MW
                    </td>
                    <td>
                        <span style="color: ${trendColor}; font-weight: 600;">
                            <i class="fas fa-${trendIcon}"></i> ${trend}
                        </span>
                    </td>
                    <td style="color: ${colors.primary}; font-weight: 600;">${percentOfAvg}%</td>
                `;
                
                // Add hover effect
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = `${colors.primary}10`;
                    row.style.transform = 'translateX(5px)';
                });
                
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = 'transparent';
                    row.style.transform = 'translateX(0)';
                });
                
                tableBody.appendChild(row);
            });
        },
        
        // Render summary statistics with colorful cards
        renderSummaryStats: function() {
            if (!forecastData || !forecastData.weekly_statistics) return;
            
            const stats = forecastData.weekly_statistics;
            
            // Update stat elements with animation
            this.animateStat(elements.totalDemand, Math.round(stats.weekly_total_demand));
            this.animateStat(elements.avgDemand, Math.round(stats.weekly_average_demand));
            this.animateStat(elements.peakDemand, Math.round(stats.weekly_peak_demand));
            this.animateStat(elements.minDemand, Math.round(stats.weekly_min_demand));
            
            // Calculate variation
            const variation = ((stats.weekly_peak_demand - stats.weekly_min_demand) / stats.weekly_average_demand * 100).toFixed(1);
            this.animateStat(elements.variation, variation, '%');
            
            // Find peak day
            if (forecastData.daily_summary && elements.peakDay) {
                let peakDay = '';
                let peakValue = 0;
                let peakColor = colors.primary;
                
                forecastData.daily_summary.forEach(day => {
                    if (day.peak_demand > peakValue) {
                        peakValue = day.peak_demand;
                        peakDay = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
                        peakColor = day.color;
                    }
                });
                
                elements.peakDay.textContent = peakDay;
                elements.peakDay.style.color = peakColor;
                elements.peakDay.style.fontWeight = '600';
            }
            
            // Add color to stat cards
            const statCards = document.querySelectorAll('.stat-card');
            const gradients = [
                `linear-gradient(135deg, ${colors.gradient1[0]} 0%, ${colors.gradient1[1]} 100%)`,
                `linear-gradient(135deg, ${colors.gradient2[0]} 0%, ${colors.gradient2[1]} 100%)`,
                `linear-gradient(135deg, ${colors.gradient3[0]} 0%, ${colors.gradient3[1]} 100%)`,
                `linear-gradient(135deg, ${colors.gradient4[0]} 0%, ${colors.gradient4[1]} 100%)`,
                `linear-gradient(135deg, ${colors.gradient5[0]} 0%, ${colors.gradient5[1]} 100%)`
            ];
            
            statCards.forEach((card, index) => {
                const icon = card.querySelector('i');
                const value = card.querySelector('h3');
                const label = card.querySelector('p');
                
                card.style.background = gradients[index % gradients.length];
                card.style.color = 'white';
                card.style.boxShadow = `0 8px 25px ${gradients[index % gradients.length].split(',')[0].replace('linear-gradient(135deg, ', '').trim()}40`;
                
                if (icon) icon.style.color = 'white';
                if (value) value.style.color = 'white';
                if (label) label.style.color = 'rgba(255, 255, 255, 0.9)';
            });
        },
        
        // Animate statistic values
        animateStat: function(element, targetValue, suffix = '') {
            if (!element) return;
            
            const currentValue = parseFloat(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
            const duration = 1000;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutCubic(progress);
                const current = currentValue + (targetValue - currentValue) * eased;
                
                element.textContent = Math.round(current).toLocaleString() + suffix;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        },
        
        // Easing function
        easeOutCubic: function(t) {
            return 1 - Math.pow(1 - t, 3);
        },
        
        // View day details
        viewDayDetails: function(dayIndex) {
            if (!forecastData || !forecastData.daily_summary || !forecastData.daily_summary[dayIndex]) return;
            
            const day = forecastData.daily_summary[dayIndex];
            this.showDayDetailsModal(day);
        },
        
        // Show day details modal
        showDayDetailsModal: function(day) {
            const modalHtml = `
                <div class="modal-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(5px);
                ">
                    <div class="modal" style="
                        background: white;
                        border-radius: 20px;
                        padding: 30px;
                        max-width: 800px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        position: relative;
                        border-top: 8px solid ${day.color};
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    ">
                        <div class="modal-header" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 30px;
                        ">
                            <h3 style="color: ${day.color}; margin: 0;">${new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</h3>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="
                                background: ${day.color};
                                color: white;
                                border: none;
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                cursor: pointer;
                                font-size: 1.2rem;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="day-stats-grid" style="
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                                gap: 15px;
                                margin-bottom: 30px;
                            ">
                                ${this.createStatCard('Total Demand', `${Math.round(day.total_demand).toLocaleString()} MW`, day.color, 'fas fa-bolt')}
                                ${this.createStatCard('Average Demand', `${Math.round(day.average_demand).toLocaleString()} MW`, colors.success, 'fas fa-chart-line')}
                                ${this.createStatCard('Peak Demand', `${Math.round(day.peak_demand).toLocaleString()} MW`, colors.danger, 'fas fa-arrow-up')}
                                ${this.createStatCard('Peak Hour', `${day.hourly_data?.find(h => h.demand === day.peak_demand)?.hour || 'N/A'}:00`, colors.warning, 'fas fa-clock')}
                            </div>
                            
                            <h4 style="color: ${day.color}; margin-bottom: 15px;">Hourly Breakdown</h4>
                            <div class="hourly-table-container" style="
                                max-height: 300px;
                                overflow-y: auto;
                                border-radius: 10px;
                                border: 2px solid ${day.color}20;
                            ">
                                <table class="hourly-detail-table" style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: ${day.color}10;">
                                            <th style="padding: 15px; text-align: left; color: ${day.color}; border-bottom: 2px solid ${day.color}30;">Hour</th>
                                            <th style="padding: 15px; text-align: left; color: ${day.color}; border-bottom: 2px solid ${day.color}30;">Demand</th>
                                            <th style="padding: 15px; text-align: left; color: ${day.color}; border-bottom: 2px solid ${day.color}30;">% of Average</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${day.hourly_data?.map(hour => `
                                            <tr style="
                                                border-bottom: 1px solid ${day.color}10;
                                                transition: all 0.3s ease;
                                            " onmouseover="this.style.backgroundColor='${day.color}10'" 
                                               onmouseout="this.style.backgroundColor='transparent'">
                                                <td style="padding: 12px 15px; font-weight: 600; color: ${day.color};">${hour.hour}:00</td>
                                                <td style="padding: 12px 15px;">
                                                    <span style="
                                                        display: inline-block;
                                                        padding: 4px 12px;
                                                        background: ${day.color}20;
                                                        border-radius: 20px;
                                                        color: ${day.color};
                                                        font-weight: 600;
                                                    ">
                                                        ${Math.round(hour.demand).toLocaleString()} MW
                                                    </span>
                                                </td>
                                                <td style="padding: 12px 15px; font-weight: 600; color: ${colors.primary};">
                                                    ${((hour.demand / day.average_demand) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        `).join('') || ''}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        },
        
        // Create stat card HTML
        createStatCard: function(title, value, color, icon) {
            return `
                <div class="day-stat" style="
                    background: linear-gradient(135deg, ${color}15 0%, ${color}05 100%);
                    border: 2px solid ${color}30;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: ${color};
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 15px;
                        color: white;
                        font-size: 1.5rem;
                    ">
                        <i class="${icon}"></i>
                    </div>
                    <h4 style="color: ${color}; margin-bottom: 5px; font-size: 1rem;">${title}</h4>
                    <p style="color: #333; font-size: 1.5rem; font-weight: 700; margin: 0;">${value}</p>
                </div>
            `;
        },
        
        // Load sample data for demo
        loadSampleData: function() {
            // Set sample values
            elements.forecastStartDate.value = new Date().toISOString().split('T')[0];
            elements.initialDemand.value = '1500';
            elements.forecastModel.value = 'random_forest';
            
            // Set sample pattern
            const samplePattern = [0.9, 0.85, 0.8, 0.82, 0.88, 1.2, 1.1];
            elements.patternInputs.forEach((input, index) => {
                input.value = samplePattern[index];
                const slider = input.previousElementSibling;
                if (slider) slider.value = samplePattern[index];
                this.updatePatternValue({ target: input });
            });
            
            // Generate sample forecast
            setTimeout(() => {
                this.generateForecast();
            }, 500);
        },
        
        // Reset patterns to defaults
        resetPatterns: function() {
            const defaultPattern = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
            elements.patternInputs.forEach((input, index) => {
                input.value = defaultPattern[index];
                const slider = input.previousElementSibling;
                if (slider) slider.value = defaultPattern[index];
                this.updatePatternValue({ target: input });
            });
            
            this.showColorfulNotification('Patterns reset to default values', 'info');
        },
        
        // Clear forecast
        clearForecast: function() {
            forecastData = null;
            
            // Clear charts
            if (this.weeklyForecastChart) {
                this.weeklyForecastChart.destroy();
                this.weeklyForecastChart = null;
            }
            
            if (this.hourlyDetailChart) {
                this.hourlyDetailChart.destroy();
                this.hourlyDetailChart = null;
            }
            
            // Clear tables
            if (elements.forecastTableBody) {
                elements.forecastTableBody.innerHTML = '';
            }
            
            if (elements.dailyCardsContainer) {
                elements.dailyCardsContainer.innerHTML = '';
            }
            
            if (elements.hourlyTableBody) {
                elements.hourlyTableBody.innerHTML = '';
            }
            
            // Reset stats
            if (elements.totalDemand) elements.totalDemand.textContent = '0';
            if (elements.avgDemand) elements.avgDemand.textContent = '0';
            if (elements.peakDemand) elements.peakDemand.textContent = '0';
            if (elements.minDemand) elements.minDemand.textContent = '0';
            if (elements.variation) elements.variation.textContent = '0%';
            if (elements.peakDay) elements.peakDay.textContent = '-';
            
            this.showColorfulNotification('Forecast cleared', 'info');
        },
        
        // Show colorful notification
        showColorfulNotification: function(message, type) {
            const colors = {
                success: { bg: colors.success, text: 'white' },
                error: { bg: colors.danger, text: 'white' },
                warning: { bg: colors.warning, text: 'white' },
                info: { bg: colors.info, text: 'white' }
            };
            
            const color = colors[type] || colors.info;
            
            // Create notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${color.bg};
                color: ${color.text};
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 8px 25px ${color.bg}80;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // Remove after delay
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        },
        
        // Export forecast
        exportForecast: function(format) {
            if (!forecastData) {
                this.showColorfulNotification('No forecast data to export', 'warning');
                return;
            }
            
            switch (format) {
                case 'csv':
                    this.exportAsCSV();
                    break;
                case 'excel':
                    this.exportAsExcel();
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
            if (!forecastData) return;
            
            let csvContent = 'Date,Day,Hour,Demand (MW)\n';
            
            forecastData.hourly_forecast.forEach(point => {
                const date = new Date(point.timestamp);
                const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dateStr = date.toLocaleDateString();
                const hour = date.getHours();
                
                csvContent += `${dateStr},${day},${hour}:00,${point.predicted_demand}\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `forecast_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            this.showColorfulNotification('Forecast exported as CSV', 'success');
        },
        
        // Export as Excel (simplified)
        exportAsExcel: function() {
            this.exportAsCSV(); // For simplicity, export as CSV
            this.showColorfulNotification('Forecast exported as Excel (CSV format)', 'success');
        },
        
        // Export as PDF (simplified)
        exportAsPDF: function() {
            this.showColorfulNotification('PDF export would be implemented with a PDF library', 'info');
        },
        
        // Export as JSON
        exportAsJSON: function() {
            if (!forecastData) return;
            
            const jsonStr = JSON.stringify(forecastData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `forecast_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            this.showColorfulNotification('Forecast exported as JSON', 'success');
        },
        
        // Print forecast
        printForecast: function() {
            window.print();
        }
    };
})();

// Make ForecastPage available globally
window.ForecastPage = ForecastPage;

// Initialize when DOM is loaded
if (document.querySelector('.forecast-page')) {
    document.addEventListener('DOMContentLoaded', function() {
        ForecastPage.init();
        
        // Add custom styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .demand-value {
                background: linear-gradient(135deg, ${colors.gradient1[0]}, ${colors.gradient1[1]});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
            }
            
            .peak-value {
                background: linear-gradient(135deg, ${colors.danger}, ${colors.warning});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
            }
            
            .pattern-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: white;
                border: 2px solid ${colors.primary};
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .pattern-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: white;
                border: 2px solid ${colors.primary};
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .view-toggle.active {
                background: linear-gradient(135deg, ${colors.gradient1[0]} 0%, ${colors.gradient1[1]} 100%) !important;
                color: white !important;
                box-shadow: 0 4px 15px ${colors.primary}40 !important;
            }
            
            .stat-card {
                transition: all 0.3s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important;
            }
        `;
        document.head.appendChild(style);
    });
}