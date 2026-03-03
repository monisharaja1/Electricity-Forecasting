// =========================================
// API COMMUNICATION MODULE
// =========================================

const API = (function() {
    const BASE_URL = 'http://localhost:5050'; // Change this to your Flask API URL
    
    // Public methods
    return {
        // Health check
        async checkHealth() {
            try {
                const response = await fetch(`${BASE_URL}/health`);
                return await response.json();
            } catch (error) {
                console.error('Health check failed:', error);
                return { status: 'error', message: 'API unavailable' };
            }
        },
        
        // Get model info
        async getModelInfo() {
            try {
                const response = await fetch(`${BASE_URL}/model-info`);
                return await response.json();
            } catch (error) {
                console.error('Failed to get model info:', error);
                throw error;
            }
        },
        
        // Single prediction
        async getPrediction(predictionData) {
            try {
                const response = await fetch(`${BASE_URL}/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(predictionData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Prediction failed');
                }
                
                return await response.json();
            } catch (error) {
                console.error('Prediction failed:', error);
                throw error;
            }
        },
        
        // Batch predictions
        async getBatchPredictions(predictionsData) {
            try {
                const response = await fetch(`${BASE_URL}/predict-batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: predictionsData })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Batch prediction failed');
                }
                
                return await response.json();
            } catch (error) {
                console.error('Batch prediction failed:', error);
                throw error;
            }
        },
        
        // Weekly forecast
        async getWeeklyForecast(forecastData) {
            try {
                const response = await fetch(`${BASE_URL}/predict-weekly`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(forecastData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Weekly forecast failed');
                }
                
                return await response.json();
            } catch (error) {
                console.error('Weekly forecast failed:', error);
                throw error;
            }
        },
        
        // Generate visualization
        async getVisualization(predictionsData) {
            try {
                const response = await fetch(`${BASE_URL}/visualize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ predictions: predictionsData })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Visualization failed');
                }
                
                return await response.json();
            } catch (error) {
                console.error('Visualization failed:', error);
                throw error;
            }
        },
        
        // Export data
        async exportData(data, format = 'csv') {
            try {
                const response = await fetch(`${BASE_URL}/export-${format}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Export failed');
                }
                
                return await response.blob();
            } catch (error) {
                console.error('Export failed:', error);
                throw error;
            }
        },
        
        // Demo endpoint
        async getDemoData() {
            try {
                const response = await fetch(`${BASE_URL}/demo`);
                return await response.json();
            } catch (error) {
                console.error('Failed to get demo data:', error);
                throw error;
            }
        },
        
        // Helper: Simulate API delay for demo purposes
        simulateDelay(ms = 1000) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        // Helper: Save prediction to localStorage
        savePredictionToHistory(prediction) {
            try {
                let history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
                
                // Add timestamp and ID
                const predictionWithMeta = {
                    ...prediction,
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    savedAt: new Date().toLocaleString()
                };
                
                // Add to beginning of array
                history.unshift(predictionWithMeta);
                
                // Keep only last 100 predictions
                if (history.length > 100) {
                    history = history.slice(0, 100);
                }
                
                localStorage.setItem('predictionHistory', JSON.stringify(history));
                return predictionWithMeta;
            } catch (error) {
                console.error('Failed to save prediction:', error);
                return null;
            }
        },
        
        // Helper: Get prediction history
        getPredictionHistory() {
            try {
                return JSON.parse(localStorage.getItem('predictionHistory') || '[]');
            } catch (error) {
                console.error('Failed to get prediction history:', error);
                return [];
            }
        },
        
        // Helper: Clear prediction history
        clearPredictionHistory() {
            try {
                localStorage.removeItem('predictionHistory');
                return true;
            } catch (error) {
                console.error('Failed to clear history:', error);
                return false;
            }
        }
    };
})();

// Make API available globally
window.API = API;