/**
 * Cosmic UI Mood Lighting Selector
 * Manages color theme customization throughout the game
 * Version 1.0.0
 */
class CosmicThemeSelector {
    constructor() {
        // Theme definitions with color schemes
        this.themes = {
            default: {
                name: 'Default Space',
                backgroundGradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
                primaryColor: '#3498db',
                secondaryColor: '#2ecc71',
                accentColor: '#9b59b6',
                textColor: '#ffffff',
                enemyColor: '#e74c3c',
                playerColor: '#3498db',
                particleColors: ['#3498db', '#1abc9c', '#9b59b6', '#f1c40f'],
            },
            nebula: {
                name: 'Nebula Dream',
                backgroundGradient: 'linear-gradient(135deg, #2c003e, #512b58, #7b337d)',
                primaryColor: '#c56cf0',
                secondaryColor: '#7158e2',
                accentColor: '#3ae374',
                textColor: '#ffffff',
                enemyColor: '#ff3838',
                playerColor: '#c56cf0',
                particleColors: ['#c56cf0', '#7158e2', '#3ae374', '#ff9f1a'],
            },
            void: {
                name: 'Cosmic Void',
                backgroundGradient: 'linear-gradient(135deg, #02010a, #04052e, #140152)',
                primaryColor: '#0652DD',
                secondaryColor: '#1B1464',
                accentColor: '#FFC312',
                textColor: '#ffffff',
                enemyColor: '#EA2027',
                playerColor: '#0652DD',
                particleColors: ['#0652DD', '#1B1464', '#FFC312', '#12CBC4'],
            },
            solarFlare: {
                name: 'Solar Flare',
                backgroundGradient: 'linear-gradient(135deg, #4d3105, #9a5f02, #ff9d00)',
                primaryColor: '#ff9f1a',
                secondaryColor: '#fbc531',
                accentColor: '#c23616',
                textColor: '#ffffff',
                enemyColor: '#e84118',
                playerColor: '#f5cd79',
                particleColors: ['#e84118', '#f5cd79', '#ffbe76', '#ff9f1a'],
            },
            aurora: {
                name: 'Aurora',
                backgroundGradient: 'linear-gradient(135deg, #023020, #0a623a, #38b000)',
                primaryColor: '#38b000',
                secondaryColor: '#4dba2e',
                accentColor: '#80ed99',
                textColor: '#ffffff',
                enemyColor: '#ff006e',
                playerColor: '#38b000',
                particleColors: ['#38b000', '#80ed99', '#c7f9cc', '#57cc99'],
            }
        };
        
        // Store for current active theme
        this.currentTheme = 'default';
    }
    
    /**
     * Initialize the theme selector system
     */
    initialize() {
        // Load saved theme preference
        this.loadSavedTheme();
        
        // Set up event listeners for theme selection
        this.setupEventListeners();
        
        // Initialize theme preview
        this.updateThemePreview(this.currentTheme);
        
        // Apply the loaded/default theme
        this.applyTheme(this.currentTheme);
    }
    
    /**
     * Set up event listeners for theme radio buttons
     */
    setupEventListeners() {
        const themeRadios = document.querySelectorAll('input[name="cosmicTheme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;
                this.currentTheme = selectedTheme;
                
                // Update theme preview
                this.updateThemePreview(selectedTheme);
                
                // Apply selected theme
                this.applyTheme(selectedTheme);
                
                // Save theme preference
                this.saveThemePreference(selectedTheme);
            });
        });
    }
    
    /**
     * Update the preview box to reflect selected theme
     * @param {string} themeKey - Theme identifier
     */
    updateThemePreview(themeKey) {
        if (!this.themes[themeKey]) return;
        
        const themeData = this.themes[themeKey];
        const previewBox = document.querySelector('.theme-preview-box');
        const previewShip = document.querySelector('.theme-preview-ship');
        const previewEnemy = document.querySelector('.theme-preview-enemy');
        
        if (previewBox) {
            previewBox.style.background = themeData.backgroundGradient;
        }
        
        if (previewShip) {
            previewShip.style.background = themeData.playerColor;
            previewShip.style.boxShadow = `0 0 10px ${themeData.playerColor}`;
        }
        
        if (previewEnemy) {
            previewEnemy.style.background = themeData.enemyColor;
            previewEnemy.style.boxShadow = `0 0 8px ${themeData.enemyColor}`;
        }
    }
    
    /**
     * Apply selected theme to the game UI and elements
     * @param {string} themeKey - Theme identifier
     */
    applyTheme(themeKey) {
        if (!this.themes[themeKey]) return;
        
        const themeData = this.themes[themeKey];
        
        // Apply theme to root CSS variables for global access
        document.documentElement.style.setProperty('--theme-primary', themeData.primaryColor);
        document.documentElement.style.setProperty('--theme-secondary', themeData.secondaryColor);
        document.documentElement.style.setProperty('--theme-accent', themeData.accentColor);
        document.documentElement.style.setProperty('--theme-text', themeData.textColor);
        document.documentElement.style.setProperty('--theme-enemy', themeData.enemyColor);
        document.documentElement.style.setProperty('--theme-player', themeData.playerColor);
        document.documentElement.style.setProperty('--theme-background', themeData.backgroundGradient);
        
        // Add theme name as CSS class to body for more specific styling
        document.body.classList.remove('theme-default', 'theme-nebula', 'theme-void', 'theme-solarFlare', 'theme-aurora');
        document.body.classList.add(`theme-${themeKey}`);
        
        // Update welcome modal background if active
        const welcomeModal = document.querySelector('.welcome-modal');
        if (welcomeModal) {
            welcomeModal.style.background = `${themeData.backgroundGradient}`;
            welcomeModal.style.backgroundOpacity = '0.95';
        }
        
        // If cosmic transitions system exists, update its color palette
        if (window.cosmicTransitions) {
            window.cosmicTransitions.updateColorPalette(themeData.particleColors);
        }
        
        // If game is active, update game colors
        if (window.game) {
            this.updateGameColors(themeData);
        }
        
        console.log(`Applied theme: ${themeData.name}`);
    }
    
    /**
     * Update active game colors
     * @param {Object} themeData - Theme color data
     */
    updateGameColors(themeData) {
        // Check if performance mode is active
        const isPerformanceMode = window.game && window.game.performanceMode;
        
        // Update player colors if player exists
        if (window.game && window.game.player) {
            window.game.player.color = themeData.playerColor;
            // Apply more efficient rendering for player in performance mode
            if (isPerformanceMode && window.game.player.effectsIntensity) {
                window.game.player.effectsIntensity = 0.5; // Reduce effects intensity
            }
        }
        
        // Update dimension background if applicable (with performance considerations)
        if (window.game && window.game.dimension) {
            window.game.dimension.colors = {
                background: themeData.backgroundGradient,
                particles: themeData.particleColors
            };
            
            // If in performance mode, reduce particle count and effects
            if (isPerformanceMode && window.game.dimension.reducedEffects !== undefined) {
                window.game.dimension.reducedEffects = true;
            }
        }
        
        // Update background particles (optimize for performance)
        if (window.game && window.game.backgroundParticles) {
            // In performance mode, only update a portion of particles to reduce rendering load
            const updateIncrement = isPerformanceMode ? 3 : 1; // Update every 3rd particle in performance mode
            
            for (let i = 0; i < window.game.backgroundParticles.length; i += updateIncrement) {
                const randomColor = themeData.particleColors[
                    Math.floor(Math.random() * themeData.particleColors.length)
                ];
                window.game.backgroundParticles[i].color = randomColor;
            }
        }
        
        // Update HUD elements
        const hudElement = document.querySelector('.hud');
        if (hudElement) {
            hudElement.style.borderLeft = `3px solid ${themeData.primaryColor}`;
        }
        
        // Update score element
        const scoreElement = document.querySelector('.score');
        if (scoreElement) {
            scoreElement.style.color = themeData.primaryColor;
            scoreElement.style.textShadow = `0 0 ${isPerformanceMode ? '5px' : '10px'} ${themeData.primaryColor}`;
        }
        
        // Update difficulty level indicator if present
        const difficultyElement = document.querySelector('.difficulty-level');
        if (difficultyElement) {
            difficultyElement.style.borderColor = `${themeData.primaryColor}`;
        }
        
        // Update button colors (batch DOM operations for better performance)
        const updateBtns = (selector, bgColor, borderColor) => {
            document.querySelectorAll(selector).forEach(btn => {
                btn.style.backgroundColor = bgColor;
                btn.style.borderColor = borderColor;
            });
        };
        
        updateBtns('.btn-primary', themeData.primaryColor, themeData.primaryColor);
        updateBtns('.btn-info', themeData.secondaryColor, themeData.secondaryColor);
        
        // Store enemy color for enemy rendering
        // This makes it accessible to enemies through window.cosmicThemeSelector.getCurrentTheme().enemyColor
        if (themeData.enemyColor) {
            // Also update any existing enemies on screen to use the new theme colors
            if (window.game && window.game.enemies && window.game.enemies.length > 0) {
                // No need to force immediate update - enemies will use new colors on their next render cycle
                console.log(`Theme updated: ${themeData.name} - Enemies will use new color: ${themeData.enemyColor}`);
            }
        }
        
        // Log performance-optimized theme application
        console.log(`Applied theme: ${themeData.name}${isPerformanceMode ? ' (performance optimized)' : ''}`);
    }
    
    /**
     * Save theme preference to localStorage
     * @param {string} themeKey - Theme identifier
     */
    saveThemePreference(themeKey) {
        localStorage.setItem('selectedTheme', themeKey);
    }
    
    /**
     * Load saved theme preference from localStorage
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
            
            // Check the correct radio button
            const themeRadio = document.getElementById(`theme${this.capitalizeFirstLetter(savedTheme)}`);
            if (themeRadio) {
                themeRadio.checked = true;
            }
        }
    }
    
    /**
     * Capitalize first letter of a string
     * @param {string} string - Input string
     * @returns {string} - String with first letter capitalized
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Get current theme data
     * @returns {Object} - Current theme data
     */
    getCurrentTheme() {
        return this.themes[this.currentTheme];
    }
}

// Create a global instance
window.cosmicThemeSelector = null;

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the theme selector
    window.cosmicThemeSelector = new CosmicThemeSelector();
    window.cosmicThemeSelector.initialize();
});