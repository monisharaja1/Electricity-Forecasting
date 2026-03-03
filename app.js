// =========================================
// MAIN APPLICATION MODULE
// =========================================

const App = (function() {
    // Private variables
    let currentTheme = 'light';
    let apiStatus = false;
    
    // DOM Elements
    const elements = {
        themeToggle: document.querySelector('[data-theme-toggle]'),
        menuToggle: document.querySelector('.menu-toggle'),
        navMenu: document.querySelector('.nav-menu'),
        apiStatusIndicator: document.querySelector('.status-indicator')
    };
    
    // Public methods
    return {
        // Initialize the application
        init: function() {
            this.setupEventListeners();
            this.loadPreferences();
            this.checkApiStatus();
            this.updateDateTime();
        },
        
        // Setup event listeners
        setupEventListeners: function() {
            // Theme toggle
            if (elements.themeToggle) {
                elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
            }
            
            // Menu toggle
            if (elements.menuToggle) {
                elements.menuToggle.addEventListener('click', this.toggleMenu.bind(this));
            }
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (elements.navMenu && elements.navMenu.classList.contains('active') &&
                    !elements.navMenu.contains(e.target) &&
                    !elements.menuToggle.contains(e.target)) {
                    this.toggleMenu();
                }
            });
            
            // Handle keyboard shortcuts
            document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        },
        
        // Toggle theme
        toggleTheme: function() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            
            // Update toggle button icon
            if (elements.themeToggle) {
                const icon = elements.themeToggle.querySelector('i');
                if (icon) {
                    icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
                }
            }
            
            // Show notification
            this.showNotification(`Switched to ${currentTheme} theme`, 'success');
        },
        
        // Toggle mobile menu
        toggleMenu: function() {
            if (elements.navMenu) {
                elements.navMenu.classList.toggle('active');
                elements.menuToggle.classList.toggle('active');
                
                // Update menu icon
                const icon = elements.menuToggle.querySelector('i');
                if (icon) {
                    icon.className = elements.navMenu.classList.contains('active') 
                        ? 'fas fa-times' 
                        : 'fas fa-bars';
                }
            }
        },
        
        // Check API status
        checkApiStatus: async function() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                
                apiStatus = data.status === 'healthy';
                
                if (elements.apiStatusIndicator) {
                    elements.apiStatusIndicator.className = `status-indicator ${apiStatus ? 'online' : 'offline'}`;
                    
                    // Update status text
                    const statusText = elements.apiStatusIndicator.nextElementSibling;
                    if (statusText) {
                        statusText.textContent = apiStatus ? 'Connected' : 'Disconnected';
                    }
                }
                
                return apiStatus;
            } catch (error) {
                console.error('API check failed:', error);
                apiStatus = false;
                
                if (elements.apiStatusIndicator) {
                    elements.apiStatusIndicator.className = 'status-indicator offline';
                }
                
                return false;
            }
        },
        
        // Load user preferences
        loadPreferences: function() {
            // Load theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                currentTheme = savedTheme;
                document.documentElement.setAttribute('data-theme', currentTheme);
            }
            
            // Load other preferences...
        },
        
        // Update date and time
        updateDateTime: function() {
            const updateClock = () => {
                const now = new Date();
                const dateOptions = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                };
                const timeOptions = { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                };
                
                const dateString = now.toLocaleDateString('en-US', dateOptions);
                const timeString = now.toLocaleTimeString('en-US', timeOptions);
                
                // Update any clock elements on the page
                const clockElements = document.querySelectorAll('.current-datetime');
                clockElements.forEach(element => {
                    element.textContent = `${dateString} - ${timeString}`;
                });
            };
            
            // Update immediately
            updateClock();
            
            // Update every second
            setInterval(updateClock, 1000);
        },
        
        // Show notification
        showNotification: function(message, type = 'info') {
            // Check if notification container exists
            let notificationContainer = document.getElementById('notification-container');
            
            if (!notificationContainer) {
                notificationContainer = document.createElement('div');
                notificationContainer.id = 'notification-container';
                notificationContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                `;
                document.body.appendChild(notificationContainer);
            }
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                background: ${type === 'success' ? '#4cc9f0' : type === 'error' ? '#f72585' : '#4361ee'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
            `;
            
            // Add icon based on type
            const iconMap = {
                success: 'check-circle',
                error: 'exclamation-circle',
                info: 'info-circle'
            };
            
            notification.innerHTML = `
                <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" style="
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                ">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            notificationContainer.appendChild(notification);
            
            // Add close functionality
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            }, 5000);
            
            // Add CSS animations if not already added
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        // Handle keyboard shortcuts
        handleKeyboardShortcuts: function(e) {
            // Don't trigger shortcuts when user is typing
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Ctrl/Cmd + T to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl/Cmd + K to focus search (if exists)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to close modals/menus
            if (e.key === 'Escape') {
                this.toggleMenu();
                
                // Close any open modals
                const modals = document.querySelectorAll('.modal.show');
                modals.forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        },
        
        // Format number with commas
        formatNumber: function(num) {
            return new Intl.NumberFormat('en-US').format(num);
        },
        
        // Format date
        formatDate: function(date, format = 'short') {
            const d = new Date(date);
            const options = {
                short: {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                },
                long: {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                },
                time: {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            };
            
            return d.toLocaleDateString('en-US', options[format] || options.short);
        }
    };
})();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// Global helper functions
window.toggleTheme = App.toggleTheme.bind(App);
window.toggleMenu = App.toggleMenu.bind(App);