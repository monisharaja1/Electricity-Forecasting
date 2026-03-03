// =========================================
// FORM HANDLING MODULE
// =========================================

const FormHandler = (function() {
    // Public methods
    return {
        // Initialize prediction form
        initPredictionForm: function() {
            const form = document.getElementById('predictionForm');
            if (!form) return;
            
            // Set default datetime to current time
            const datetimeInput = document.getElementById('datetime');
            if (datetimeInput) {
                const now = new Date();
                const timezoneOffset = now.getTimezoneOffset() * 60000;
                const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
                datetimeInput.value = localISOTime;
            }
            
            // Add input validation
            this.setupInputValidation(form);
        },
        
        // Setup input validation
        setupInputValidation: function(form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Real-time validation
                input.addEventListener('blur', function() {
                    this.validateInput(this);
                }.bind(this));
                
                // Clear validation on input
                input.addEventListener('input', function() {
                    this.clearValidation(this);
                }.bind(this));
            });
        },
        
        // Validate single input
        validateInput: function(input) {
            this.clearValidation(input);
            
            let isValid = true;
            let errorMessage = '';
            
            // Required validation
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                errorMessage = 'This field is required';
            }
            
            // Numeric validation
            if (input.type === 'number' && input.value) {
                const value = parseFloat(input.value);
                const min = input.getAttribute('min');
                const max = input.getAttribute('max');
                
                if (isNaN(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid number';
                } else if (min && value < parseFloat(min)) {
                    isValid = false;
                    errorMessage = `Value must be at least ${min}`;
                } else if (max && value > parseFloat(max)) {
                    isValid = false;
                    errorMessage = `Value must be at most ${max}`;
                }
            }
            
            // Datetime validation
            if (input.type === 'datetime-local' && input.value) {
                const selectedDate = new Date(input.value);
                const now = new Date();
                
                if (selectedDate < now) {
                    // Allow past dates for historical analysis
                    // isValid = false;
                    // errorMessage = 'Please select a future date';
                }
            }
            
            if (!isValid) {
                this.showInputError(input, errorMessage);
            }
            
            return isValid;
        },
        
        // Show input error
        showInputError: function(input, message) {
            const formGroup = input.closest('.form-group');
            if (!formGroup) return;
            
            // Remove existing error
            this.clearValidation(input);
            
            // Add error class
            input.classList.add('error');
            
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            errorElement.style.cssText = `
                color: #f72585;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            `;
            
            formGroup.appendChild(errorElement);
        },
        
        // Clear validation
        clearValidation: function(input) {
            input.classList.remove('error');
            
            const formGroup = input.closest('.form-group');
            if (!formGroup) return;
            
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        },
        
        // Validate entire form
        validateForm: function(form) {
            let isValid = true;
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                if (!this.validateInput(input)) {
                    isValid = false;
                }
            });
            
            return isValid;
        },
        
        // Get form data
        getFormData: function(formId) {
            const form = document.getElementById(formId);
            if (!form) return {};
            
            const formData = {};
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                if (input.name || input.id) {
                    const key = input.name || input.id;
                    
                    if (input.type === 'checkbox') {
                        formData[key] = input.checked;
                    } else if (input.type === 'radio') {
                        if (input.checked) {
                            formData[key] = input.value;
                        }
                    } else {
                        formData[key] = input.value.trim();
                    }
                }
            });
            
            return formData;
        },
        
        // Set form data
        setFormData: function(formId, data) {
            const form = document.getElementById(formId);
            if (!form) return;
            
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"], [id="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = Boolean(data[key]);
                    } else if (input.type === 'radio') {
                        const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                        if (radio) {
                            radio.checked = true;
                        }
                    } else {
                        input.value = data[key];
                    }
                }
            });
        },
        
        // Reset form
        resetForm: function(formId) {
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
                
                // Clear validation errors
                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    this.clearValidation(input);
                });
            }
        },
        
        // Fill form with current time
        fillCurrentTime: function() {
            const datetimeInput = document.getElementById('datetime');
            if (datetimeInput) {
                const now = new Date();
                const timezoneOffset = now.getTimezoneOffset() * 60000;
                const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
                datetimeInput.value = localISOTime;
            }
        },
        
        // Set form preset
        setFormPreset: function(presetName) {
            const presets = {
                morning: {
                    datetime: this.getTimeToday(8, 0),
                    demand_lag_1: '1450',
                    demand_lag_24: '1420',
                    rolling_mean_24: '1480',
                    rolling_std_24: '120'
                },
                afternoon: {
                    datetime: this.getTimeToday(14, 0),
                    demand_lag_1: '1550',
                    demand_lag_24: '1420',
                    rolling_mean_24: '1520',
                    rolling_std_24: '130'
                },
                evening: {
                    datetime: this.getTimeToday(19, 0),
                    demand_lag_1: '1650',
                    demand_lag_24: '1420',
                    rolling_mean_24: '1580',
                    rolling_std_24: '150'
                },
                night: {
                    datetime: this.getTimeToday(0, 0),
                    demand_lag_1: '1250',
                    demand_lag_24: '1420',
                    rolling_mean_24: '1350',
                    rolling_std_24: '100'
                }
            };
            
            const preset = presets[presetName];
            if (preset) {
                this.setFormData('predictionForm', preset);
                App.showNotification(`Loaded ${presetName} preset`, 'success');
            }
        },
        
        // Helper: Get time today
        getTimeToday: function(hours, minutes) {
            const now = new Date();
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            return new Date(date - timezoneOffset).toISOString().slice(0, 16);
        },
        
        // Format form data for API
        formatForApi: function(formData) {
            return {
                datetime: formData.datetime,
                demand_lag_1: formData.demand_lag_1 ? parseFloat(formData.demand_lag_1) : undefined,
                demand_lag_24: formData.demand_lag_24 ? parseFloat(formData.demand_lag_24) : undefined,
                rolling_mean_24: formData.rolling_mean_24 ? parseFloat(formData.rolling_mean_24) : undefined,
                rolling_std_24: formData.rolling_std_24 ? parseFloat(formData.rolling_std_24) : undefined
            };
        }
    };
})();

// Make FormHandler available globally
window.FormHandler = FormHandler;

// Initialize forms when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('predictionForm')) {
        FormHandler.initPredictionForm();
    }
});