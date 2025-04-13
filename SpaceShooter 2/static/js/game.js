class Game {
    constructor() {
        try {
            // Make game instance accessible globally for other components
            window.game = this;
            
            // Check if performance mode is enabled
            this.performanceMode = localStorage.getItem('performanceMode') === 'true';
            
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Could not get canvas context');
            }

            // Use the global sound manager if it exists or create a new one
            if (window.globalSoundManager) {
                this.soundManager = window.globalSoundManager;
                if (!this.soundManager.initialized) {
                    // Initialize it on first user interaction if not already initialized
                    document.addEventListener('click', () => {
                        this.soundManager.initialize();
                    }, { once: true });
                }
            } else {
                // Create a new sound manager and set it as the global one
                this.soundManager = new SoundManager();
                window.globalSoundManager = this.soundManager;
                
                // Initialize it on first user interaction
                document.addEventListener('click', () => {
                    this.soundManager.initialize();
                }, { once: true });
            }

            // Set initial canvas size
            this.resizeCanvas();

            // Initialize Cosmic Transitions system
            if (window.CosmicTransitions) {
                // Initialize global cosmic transitions if it doesn't exist
                if (!window.cosmicTransitions) {
                    window.cosmicTransitions = new CosmicTransitions();
                    window.cosmicTransitions.initialize();
                    console.log("Cosmic Transitions system initialized");
                    
                    // Define color palettes for different game effects
                    window.cosmicTransitions.colorPalettes = {
                        cosmic: ['#00aaff', '#0088ff', '#00ddff', '#aaddff'],
                        energy: ['#ffaa00', '#ff8800', '#ffdd00', '#ffcc33'],
                        victory: ['#00ff88', '#00dd66', '#00ffaa', '#66ffcc'],
                        defeat: ['#ff0066', '#dd0044', '#ff4488', '#ff6699'],
                        radiant: ['#ffcc00', '#ff9900', '#ffee44', '#ffdd33'],
                        lunar: ['#9966ff', '#7744dd', '#aa88ff', '#bb99ff']
                    };
                }
            }

            // Initialize game state
            this.score = 0;
            this.gameOver = false;
            this.keys = {};
            this.mouseX = 0;
            this.mouseY = 0;
            this.paused = true; // Start paused until welcome modal is closed
            
            // Property for storing current projectile in collision detection
            this.currentProjectile = null;

            // Add new properties for ship selection
            this.hasSelectedShip = false;
            this.lastTierUpgrade = 0;
            this.maxScore = 50000;

            // Initialize game objects
            this.initializeGameObjects();
            
            // Apply performance mode settings
            this.applyPerformanceModeSettings();

            // Setup event handlers
            this.setupEventListeners();
            this.updateAutoFeatureDisplay();

            // Start game loop
            this.boundGameLoop = this.gameLoop.bind(this);
            requestAnimationFrame(this.boundGameLoop);
            this.upgradeTree = new UpgradeTree(this);
            this.starMap = new StarMap(this); // Added starMap initialization
            this.multiplayerManager = new MultiplayerManager(this);
            this.chatSystem = new ChatSystem(this); // Added chat system initialization
            
            // Initialize achievement system
            this.achievementSystem = new AchievementSystem(this);
            
            // Initialize upgrade effects
            if (typeof UpgradeEffects !== 'undefined') {
                window.upgradeEffects = new UpgradeEffects();
            }

        } catch (error) {
            console.error('Error initializing game:', error);
            this.handleError(error);
        }
    }

    initializeGameObjects() {
        try {
            // Initialize player
            this.player = new Player(this.canvas.width/2, this.canvas.height/2, 20);

            // Initialize collections
            this.projectiles = [];
            this.enemies = [];
            this.persistentExplosions = []; // Array to store explosion effects that persist after enemy removal
            this.powerUps = []; // New array to store active power-ups
            this.portal = null;

            // Power-up system configuration
            this.lastPowerUpTime = Date.now();
            this.powerUpInterval = 15000; // Base interval between power-ups in ms
            this.powerUpChance = 0.3; // Base chance of enemy dropping a power-up
            
            // Create power-up notification container
            if (!document.querySelector('.power-up-notifications')) {
                const notificationContainer = document.createElement('div');
                notificationContainer.className = 'power-up-notifications';
                document.body.appendChild(notificationContainer);
            }

            // Create power-up effects container
            if (!document.querySelector('.player-power-up-effects')) {
                const effectsContainer = document.createElement('div');
                effectsContainer.className = 'player-power-up-effects';
                document.body.appendChild(effectsContainer);
            }

            // Points system
            this.basePoints = 100;
            this.multiplier = 1;
            this.killStreak = 0;
            this.gameStartTime = Date.now();
            this.lastKillTime = Date.now();

            // Initialize systems
            this.upgradeSystem = new UpgradeSystem(this.player, this);
            this.debugInfo = new DebugInfo();
            this.achievementSystem = new AchievementSystem(this);
            console.log("Achievement system initialized");

            // Ice zone initialization
            this.iceZone = null;
            this.lastIceZoneTime = Date.now();
            this.iceZoneInterval = 30000;
            
            // Initialize background particles
            this.createBackgroundParticles();
            
            // Initialize adaptive difficulty system
            this.initializeDifficultySystem();
            
            // Apply performance mode settings if enabled
            if (this.performanceMode) {
                this.applyPerformanceModeSettings();
            }
            
            // Initialize Radiant Event properties
            this.radiantEventActive = false;
            this.radiantEventTriggered = false;
            
            // Initialize Lunar Event properties
            this.lunarEventActive = false;
            this.lunarEventTriggered = false;
            this.lunarEventDelay = 15; // 15 seconds after Radiant event ends
            this.lunarEventTimerStart = 0;
            
            // Enhanced performance monitoring
            this.performanceMonitor = {
                fpsHistory: [],
                lowFpsThreshold: 40, // Increased from 30 to be more proactive in preventing lag
                mediumFpsThreshold: 50, // New threshold for mild performance issues
                spawnRateReduction: 1.0, // 1.0 = normal, higher values = reduced spawn rate
                maxSpawnRateReduction: 6.0, // Increased from 4.0 to allow more aggressive spawn reduction
                isLagging: false,
                isMildlyLagging: false,
                lastCheck: Date.now()
            };
            
            // Event countdowns and timers
            this.radiantCountdownActive = false;
            this.lunarCountdownActive = false;
            this.countdownTime = 5; // 5 second countdown
            this.lastCountdownSecond = 0;
            
            // Event durations and timing
            this.radiantEventDuration = 120; // 2 minutes in seconds
            this.lunarEventDuration = 120; // 2 minutes in seconds
            this.radiantEventStartTime = 0;
            this.radiantEventEndTime = 0;
            this.lunarEventStartTime = 0;
            this.lunarEventEndTime = 0;
            
            // Enemy difficulty multipliers
            this.radiantEnemyMultiplier = 2.0; // Radiant enemies are 2x stronger
            this.lunarEnemyMultiplier = 3.0; // Lunar enemies are 3x stronger (1.5x Radiant enemies)
            this.postRadiantEnemyMultiplier = 1.5; // After event, enemies are 1.5x stronger
            this.enemyMultiplierActive = 1.0; // Default multiplier
            
            // Spawn rate modifiers for different events
            this.radiantSpawnRateModifier = 1.0; // Normal spawn rate for Radiant
            this.lunarSpawnRateModifier = 0.91; // 91% spawn rate for Lunar (= 0.7 * 1.3, increased by 30%)
            
            // Initialize dimensions
            this.currentDimension = 'normal';
            this.dimensions = {
                'normal': new Dimension(this.canvas, 'normal'),
                'lunar': new Dimension(this.canvas, 'lunar'),
                'radiant': new Dimension(this.canvas, 'radiant'),
                'void': new Dimension(this.canvas, 'void')
            };
        } catch (error) {
            console.error('Error initializing game objects:', error);
            throw error;
        }
    }

    resizeCanvas() {
        try {
            // Get the actual viewport dimensions
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.canvas.width = width;
            this.canvas.height = height;

            // If player exists, ensure it stays within bounds after resize
            if (this.player) {
                this.player.x = Math.min(Math.max(this.player.x, 0), width);
                this.player.y = Math.min(Math.max(this.player.y, 0), height);
            }
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    handleError(error) {
        console.error('Game error:', error);
        // Attempt to recover
        if (!this.gameOver) {
            this.resetGameState();
        }
    }

    resetGameState() {
        try {
            this.projectiles = [];
            this.enemies = [];
            this.persistentExplosions = [];
            this.powerUps = []; // Reset power-ups
            this.portal = null;
            this.iceZone = null;
            
            // Reset scores
            this.score = 0;
            this.multiplier = 1;
            this.totalKills = 0;
            
            // Reset radiant event status
            this.radiantEventTriggered = false;
            this.radiantCountdownActive = false;
            this.radiantEventActive = false;
            this.radiantEventStartTime = 0;
            this.radiantEventEndTime = 0;
            
            // Reset lunar event status
            this.lunarEventActive = false;
            this.lunarEventTriggered = false;
            this.lunarCountdownActive = false;
            this.lunarEventTimerStart = 0;
            this.lunarEventStartTime = 0;
            this.lunarEventEndTime = 0;
            
            // Reset event durations and properties
            this.radiantEventDuration = 120; // 2 minutes in seconds
            this.lunarEventDuration = 120; // 2 minutes in seconds
            this.radiantEnemyMultiplier = 2.0; // 2x stronger enemies during Radiant event
            this.lunarEnemyMultiplier = 3.0; // 3x stronger enemies during Lunar event (1.5x Radiant enemies)
            this.postRadiantEnemyMultiplier = 1.5; // 1.5x stronger enemies after Radiant event
            this.enemyMultiplierActive = 1.0; // Reset to default multiplier
            this.lastCountdownSecond = 0;
            
            // Reset spawn rate modifiers
            this.radiantSpawnRateModifier = 1.0;
            this.lunarSpawnRateModifier = 0.91; // Increased from 0.7 (0.7 * 1.3 = 0.91) for higher spawn rate
            
            if (this.player) {
                this.player.x = this.canvas.width/2;
                this.player.y = this.canvas.height/2;
            }
            
            // Remove any lingering event UI elements
            this.removeRadiantCountdownUI();
            this.removeRadiantEventTimer();
            this.removeLunarCountdownUI();
            this.removeLunarEventTimer();
        } catch (error) {
            console.error('Error resetting game state:', error);
        }
    }
    
    // Apply performance mode settings to reduce graphic effects and improve frame rates
    applyPerformanceModeSettings() {
        console.log("Performance mode enabled - reducing graphical effects");
        
        // Reduce particle counts and effects
        this.backgroundParticleCount = 30;  // Significantly fewer background particles
        this.maxPersistentExplosions = 2;   // Limit persistent explosion effects
        this.reduceVisualEffects = true;    // Flag to reduce visual effects throughout the game
        
        // Adjust performance monitoring settings
        if (this.performanceMonitor) {
            this.performanceMonitor.spawnRateReduction = 2.0;  // Start with reduced spawn rate
            this.performanceMonitor.lowFpsThreshold = 30;     // Lower threshold for performance optimization
        }
        
        // Apply settings to cosmic transitions if available
        if (window.cosmicTransitions) {
            window.cosmicTransitions.particleLimit = 100;     // Limit particle effects
            window.cosmicTransitions.disableGlow = true;      // Disable glow effects
            window.cosmicTransitions.simplifiedEffects = true; // Use simplified effects
        }
        
        // Disable or reduce dimension special effects
        for (const dimension in this.dimensions) {
            if (this.dimensions[dimension]) {
                this.dimensions[dimension].reducedEffects = true;
            }
        }
        
        // Apply settings to enemy rendering
        this.enemyEffectsReduced = true;
        
        // Apply settings to projectile effects
        this.projectileEffectsReduced = true;
    }
    
    initializeDifficultySystem() {
        try {
            // Performance tracking
            this.performanceMetrics = {
                enemiesKilled: 0,
                projectilesFired: 0,
                hitAccuracy: 0,
                damageTaken: 0,
                survivalTime: 0,
                lastUpdate: Date.now(),
                assessmentInterval: 10000 // Assess performance every 10 seconds
            };
            
            // Difficulty parameters (values 0-1 where 0 is easiest, 1 is hardest)
            this.difficulty = {
                level: 0.2, // Starting difficulty (slightly easy)
                enemySpeed: 0.2,
                enemyHealth: 0.2,
                enemySpawnRate: 0.2,
                durableEnemyChance: 0.2,
                // Separate parameters for different aspects of difficulty
                speedModifier: 1.0, // Multiplier for enemy speed
                healthModifier: 1.0, // Multiplier for enemy health
                spawnRateModifier: 1.0, // Multiplier for spawn rate
                // Boundaries for adaptation
                min: 0.1,
                max: 0.9,
                adaptationRate: 0.05, // How quickly difficulty changes
                lastAssessment: Date.now(),
                adaptiveEnabled: true // Default to adaptive difficulty enabled
            };
            
            // Add UI element to show difficulty
            const hudElement = document.querySelector('.hud');
            if (hudElement) {
                const difficultyDisplay = document.createElement('div');
                difficultyDisplay.className = 'difficulty-level';
                difficultyDisplay.innerHTML = '<div>Difficulty: <span id="difficultyLevel">Adapting...</span></div>';
                hudElement.appendChild(difficultyDisplay);
            }
            
            // Try to load difficulty from localStorage (for returning players)
            this.loadDifficultySettings();
        } catch (error) {
            console.error('Error initializing difficulty system:', error);
        }
    }
    
    // New method to set difficulty based on user selection with more balanced and nuanced settings
    setDifficulty(difficultyLevel, adaptiveEnabled) {
        try {
            if (!this.difficulty) return;
            
            // Store settings
            this.difficulty.adaptiveEnabled = adaptiveEnabled;
            
            // Set initial difficulty based on selection with balanced parameters
            switch(difficultyLevel) {
                case 'easy':
                    this.difficulty.level = 0.15;
                    this.difficulty.min = 0.05;
                    this.difficulty.max = 0.4;
                    
                    // More specific adjustments for easy mode
                    this.difficulty.speedModifier = 0.8;   // Slower enemies
                    this.difficulty.healthModifier = 0.7;  // Less durable enemies
                    this.difficulty.spawnRateModifier = 0.7; // Fewer enemies spawning
                    break;
                    
                case 'medium':
                    this.difficulty.level = 0.3;
                    this.difficulty.min = 0.15;
                    this.difficulty.max = 0.65;
                    
                    // Balanced settings for medium mode
                    this.difficulty.speedModifier = 1.0;   // Standard enemy speed
                    this.difficulty.healthModifier = 1.0;  // Standard enemy health
                    this.difficulty.spawnRateModifier = 1.0; // Standard spawn rate
                    break;
                    
                case 'hard':
                    this.difficulty.level = 0.5;
                    this.difficulty.min = 0.3;
                    this.difficulty.max = 0.9;
                    
                    // More challenging settings for hard mode
                    this.difficulty.speedModifier = 1.2;   // Faster enemies
                    this.difficulty.healthModifier = 1.3;  // More durable enemies
                    this.difficulty.spawnRateModifier = 1.4; // More enemies spawning
                    break;
                
                default:
                    // Use default values if selection is invalid
                    this.difficulty.level = 0.3;
                    this.difficulty.min = 0.15;
                    this.difficulty.max = 0.65;
                    this.difficulty.speedModifier = 1.0;
                    this.difficulty.healthModifier = 1.0;
                    this.difficulty.spawnRateModifier = 1.0;
            }
            
            // Apply initial difficulty settings with modifiers
            this.difficulty.enemySpeed = this.difficulty.level * this.difficulty.speedModifier;
            this.difficulty.enemyHealth = this.difficulty.level * this.difficulty.healthModifier;
            this.difficulty.enemySpawnRate = this.difficulty.level * this.difficulty.spawnRateModifier;
            this.difficulty.durableEnemyChance = this.difficulty.level * 0.8; // Reduce durable enemy chance slightly
            
            // Update the UI display
            this.updateDifficultyDisplay();
            
            console.log(`Difficulty set to ${difficultyLevel} (level: ${this.difficulty.level}), adaptive: ${adaptiveEnabled}`);
            console.log(`Speed modifier: ${this.difficulty.speedModifier}, Health modifier: ${this.difficulty.healthModifier}, Spawn Rate modifier: ${this.difficulty.spawnRateModifier}`);
        } catch (error) {
            console.error('Error setting difficulty:', error);
        }
    }
    
    // Load difficulty settings from localStorage
    loadDifficultySettings() {
        try {
            const savedDifficulty = localStorage.getItem('selectedDifficulty');
            const savedAdaptive = localStorage.getItem('adaptiveDifficultyEnabled');
            
            if (savedDifficulty || savedAdaptive) {
                const adaptive = savedAdaptive ? (savedAdaptive === 'true') : true;
                this.setDifficulty(savedDifficulty || 'medium', adaptive);
            }
        } catch (error) {
            console.error('Error loading difficulty settings:', error);
        }
    }

    cleanupEventListeners() {
        try {
            // Remove window resize event
            window.removeEventListener('resize', this.resizeCanvas);
            
            // Remove keyboard event handlers
            if (this.eventHandlers) {
                window.removeEventListener('keydown', this.eventHandlers.keydown);
                window.removeEventListener('keyup', this.eventHandlers.keyup);
                
                // Remove mouse event handlers from canvas
                if (this.canvas) {
                    this.canvas.removeEventListener('mousemove', this.eventHandlers.mousemove);
                    this.canvas.removeEventListener('click', this.eventHandlers.click);
                }
            }
            
            // Clean up any custom event listeners in multiplayer manager
            if (this.multiplayerManager) {
                // Any multiplayer-specific cleanup
            }
            
            // Clean up any custom event listeners in chat system
            if (this.chatSystem) {
                // Any chat-specific cleanup
            }
            
            // Clean up any achievement system event listeners
            if (this.achievementSystem) {
                // Any achievement-specific cleanup
                const achievementButton = document.getElementById('achievementButton');
                if (achievementButton) {
                    achievementButton.removeEventListener('click', this.achievementSystem.toggleAchievementScreen);
                }
            }
            
            // Clean up animation frame to prevent memory leaks
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            console.log('Event listeners cleaned up successfully');
        } catch (error) {
            console.error('Error cleaning up event listeners:', error);
        }
    }

    setupEventListeners() {
        try {
            const keydownHandler = (e) => {
                this.keys[e.key] = true;

                if (e.key === 'e') {
                    this.player.toggleAutoSpin();
                    this.updateAutoFeatureDisplay();
                }
                if (e.key === 'q') {
                    this.player.toggleAutoShoot();
                    this.updateAutoFeatureDisplay();
                }
                if (e.key === 'm' || e.key === 'M') {
                    this.debugInfo.toggle();
                    this.starMap.toggle(); // Added starMap toggle
                }
                if (e.key === 'v' || e.key === 'V') {
                    this.upgradeTree.toggle();
                }
            };

            const keyupHandler = (e) => {
                this.keys[e.key] = false;
            };

            const mousemoveHandler = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            };

            const clickHandler = () => {
                if (!this.gameOver && !this.player.autoShoot) {
                    this.shoot();
                }
            };

            window.addEventListener('keydown', keydownHandler);
            window.addEventListener('keyup', keyupHandler);
            this.canvas.addEventListener('mousemove', mousemoveHandler);
            this.canvas.addEventListener('click', clickHandler);
            window.addEventListener('resize', () => this.resizeCanvas());

            // Store handlers for potential cleanup
            this.eventHandlers = {
                keydown: keydownHandler,
                keyup: keyupHandler,
                mousemove: mousemoveHandler,
                click: clickHandler
            };
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    shoot() {
        try {
            if (!this.player) return;

            if (this.player.shoot()) {
                // Play shoot sound
                if (this.soundManager) {
                    this.soundManager.playShootSound(this.player.shipType);
                }
                
                // Get direction vector for the projectile
                const angle = this.player.getShootAngle();
                const vx = Math.cos(angle);
                const vy = Math.sin(angle);
                
                // Create a single projectile
                const projectile = new Projectile(
                    this.player.x,
                    this.player.y,
                    angle,
                    this.player.shipType
                );
                
                // Apply damage boost if active
                if (this.player.powerUps.damage.active && Date.now() < this.player.powerUps.damage.endTime) {
                    // Enhance projectile damage
                    projectile.damage *= this.player.powerUps.damage.multiplier;
                    projectile.radius *= 1.2; // Make projectile slightly larger for visual feedback
                    projectile.color = '#ff3333'; // Reddish color to indicate enhanced damage
                    projectile.isDamageBoosted = true; // Set flag for enhanced hit effects
                }
                
                this.projectiles.push(projectile);
                
                // Add cosmic particle effects when shooting
                if (window.cosmicTransitions) {
                    // Calculate muzzle position (slightly in front of ship)
                    const muzzleDistance = this.player.radius * 1.2;
                    const muzzleX = this.player.x + vx * muzzleDistance;
                    const muzzleY = this.player.y + vy * muzzleDistance;
                    
                    // Basic projectile trail
                    window.cosmicTransitions.createParticleBurst(
                        muzzleX, 
                        muzzleY,
                        {
                            count: Math.min(8, Math.max(3, this.player.shipType.damage / 2)),
                            colors: this.player.shipType.type.includes('radiant') ? 
                                window.cosmicTransitions.colorPalettes.radiant : 
                                (this.player.shipType.type.includes('lunar') ? 
                                    window.cosmicTransitions.colorPalettes.lunar :
                                    window.cosmicTransitions.colorPalettes.cosmic),
                            directed: true,
                            spread: 0.6, // Narrow cone
                            direction: {
                                x: vx * 50, // Strong directional momentum
                                y: vy * 50
                            },
                            speed: { min: 5, max: 20 },
                            size: { min: 1, max: 3 },
                            lifespan: 500,
                            gravity: 0.02,
                            glow: true
                        }
                    );
                    
                    // Add recoil effect for the player (opposite direction particles)
                    if (this.player.shipType.damage >= 2) {
                        window.cosmicTransitions.createParticleBurst(
                            this.player.x - vx * muzzleDistance, 
                            this.player.y - vy * muzzleDistance,
                            {
                                count: Math.min(5, Math.max(2, this.player.shipType.damage / 3)),
                                colors: ['#ffffff', '#aaaaff', '#ccccff'],
                                directed: true,
                                spread: 0.4,
                                direction: {
                                    x: -vx * 30, // Opposite direction of shooting
                                    y: -vy * 30
                                },
                                speed: { min: 3, max: 12 },
                                size: { min: 1, max: 2 },
                                lifespan: 300,
                                gravity: -0.01,
                                glow: true
                            }
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error shooting:', error);
        }
    }

    checkCollisions() {
        try {
            // Create temporary arrays for removal to avoid modification during iteration
            const projectilesToRemove = [];
            const enemiesToRemove = [];

            // Check projectile-enemy collisions
            for (let i = 0; i < this.projectiles.length; i++) {
                const projectile = this.projectiles[i];
                if (!projectile) continue;

                let projectileHit = false;
                
                // Check if projectile is out of bounds (counts as a miss for achievement tracking)
                const isOutOfBounds = projectile.x < 0 || 
                                     projectile.x > this.canvas.width || 
                                     projectile.y < 0 || 
                                     projectile.y > this.canvas.height;
                
                if (isOutOfBounds) {
                    // Track miss for achievement system
                    if (this.achievementSystem) {
                        this.achievementSystem.recordProjectileMiss();
                    }
                    projectilesToRemove.push(i);
                    continue;
                }
                
                for (let j = 0; j < this.enemies.length; j++) {
                    const enemy = this.enemies[j];
                    if (!enemy) {
                        continue;
                    }
                    
                    // Skip enemies already scheduled for removal
                    if (enemiesToRemove.includes(j)) {
                        continue;
                    }

                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.size + projectile.radius) {
                        projectileHit = true;
                        
                        // Store current projectile for damage calculation
                        this.currentProjectile = projectile;
                        
                        // Track hit for achievement system
                        if (this.achievementSystem) {
                            this.achievementSystem.recordProjectileHit();
                        }
                        
                        // Check if enemy has died
                        const isDead = enemy.takeDamage();
                        
                        // Create enhanced hit effect for damage-boosted projectiles
                        if (projectile.isDamageBoosted) {
                            projectile.createEnhancedHitEffect(enemy, this);
                        }
                        
                        // Clear current projectile reference
                        this.currentProjectile = null;
                        
                        if (isDead) {
                            // Call the death explosion effect before removing the enemy
                            enemy.createDeathExplosion();
                            
                            // Create a persistent death explosion effect to remain after enemy removal
                            this.createPersistentDeathEffect(enemy);
                            
                            // Add to removal array 
                            if (!enemiesToRemove.includes(j)) {
                                enemiesToRemove.push(j);
                            }
                            
                            // Only increment kill streak and add score if enemy is actually destroyed
                            this.killStreak++;
                            this.addScore(enemy.isDurable ? this.basePoints * 2 : this.basePoints);
                            
                            // Record enemy kill for achievement system
                            if (this.achievementSystem) {
                                this.achievementSystem.recordEnemyKill(enemy.isDurable);
                                
                                // Record kill streak milestone
                                if (this.killStreak >= 5) {
                                    this.achievementSystem.recordKillStreak(this.killStreak);
                                }
                            }
                            
                            // Play a sound based on enemy type
                            if (this.soundManager && typeof this.soundManager.playSound === 'function') {
                                try {
                                    if (enemy.isDurable) {
                                        this.soundManager.playSound('enemyExplosionLarge', 0.7);
                                    } else {
                                        this.soundManager.playSound('enemyExplosion', 0.5);
                                    }
                                } catch (soundError) {
                                    console.warn('Could not play sound effect:', soundError);
                                }
                            }
                            
                            // Maybe spawn a power-up from the defeated enemy
                            this.maybeSpawnPowerUpOnEnemyDeath(enemy);
                        }
                        
                        break; // One projectile can only hit one enemy
                    }
                }
                
                if (projectileHit) {
                    projectilesToRemove.push(i);
                }
            }

            // Remove projectiles and enemies after iteration
            // Remove in reverse order to avoid index shifting problems
            for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
                const index = projectilesToRemove[i];
                if (index >= 0 && index < this.projectiles.length) {
                    this.projectiles.splice(index, 1);
                }
            }

            // Debug output for enemy removal
            if (enemiesToRemove.length > 0) {
                console.log(`About to remove ${enemiesToRemove.length} enemies from array of ${this.enemies.length} enemies.`);
                console.log(`Enemy indices to remove: ${enemiesToRemove.join(', ')}`);
            }

            for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
                const index = enemiesToRemove[i];
                if (index >= 0 && index < this.enemies.length) {
                    console.log(`Removing enemy at index ${index}`);
                    this.enemies.splice(index, 1);
                } else {
                    console.log(`Invalid enemy index: ${index}, enemies.length: ${this.enemies.length}`);
                }
            }
            
            // Debug output after removal
            if (enemiesToRemove.length > 0) {
                console.log(`After removal: ${this.enemies.length} enemies remaining.`);
            }

            // Check player-enemy collisions
            if (this.player) {
                const playerCollisions = [];
                
                // First pass: identify all enemies in collision with player
                for (let i = 0; i < this.enemies.length; i++) {
                    const enemy = this.enemies[i];
                    if (!enemy) continue;
                    
                    // Skip enemies already scheduled for removal
                    if (enemiesToRemove.includes(i)) continue;

                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.size + this.player.size) {
                        console.log(`Player collision with enemy at index ${i}, distance: ${distance.toFixed(2)}`);
                        playerCollisions.push(i);
                    }
                }
                
                // Handle collisions in a safe way
                if (playerCollisions.length > 0) {
                    console.log(`Player collided with ${playerCollisions.length} enemies.`);
                    
                    // Does player die?
                    if (this.player.takeDamage()) {
                        console.log("Player died from collision.");
                        this.endGame();
                    } else {
                        console.log("Player survived collision but took damage.");
                        
                        // Process all colliding enemies
                        for (const index of playerCollisions) {
                            const enemy = this.enemies[index];
                            if (!enemy) continue;
                            
                            // Create explosion effect before removing the enemy
                            enemy.createDeathExplosion();
                            
                            // Create a persistent death explosion effect to remain after enemy removal
                            this.createPersistentDeathEffect(enemy);
                            
                            // Play collision sound
                            if (this.soundManager && typeof this.soundManager.playSound === 'function') {
                                try {
                                    this.soundManager.playSound('playerCollision', 0.6);
                                } catch (soundError) {
                                    console.warn('Could not play collision sound:', soundError);
                                }
                            }
                            
                            // Add to removal array if not already there
                            if (!enemiesToRemove.includes(index)) {
                                enemiesToRemove.push(index);
                            }
                        }
                        
                        // Remove enemies in a separate step to avoid array modification issues
                        // This isn't needed since we're already removing them with the enemiesToRemove array
                    }
                }
            }
        } catch (error) {
            console.error('Error checking collisions:', error.message);
            // Log the error stack trace for better debugging
            console.log('Error stack:', error.stack);
        }
    }

    update() {
        try {
            // Update physics FPS counter
            if (this.debugInfo) {
                this.debugInfo.updatePhysicsFps();
                
                // Track FPS for lag detection
                this.updatePerformanceMonitoring();
            }
            
            if (this.gameOver) return;

            if (this.player) {
                this.player.update(this.keys, this.mouseX, this.mouseY);
            }
            
            // Check and update special events
            this.checkRadiantEventTrigger();
            this.updateRadiantEvent();
            this.updateLunarEvent();

            // Update achievement system
            if (this.achievementSystem) {
                this.achievementSystem.checkAchievements();
            }

            this.updateIceZone();

            // Check if it's time to spawn a power-up
            const currentTime = Date.now();
            if (currentTime - this.lastPowerUpTime > this.powerUpInterval) {
                this.spawnRandomPowerUp();
                this.lastPowerUpTime = currentTime;
                
                // Adjust next power-up interval (random between 10-20 seconds)
                this.powerUpInterval = 10000 + Math.random() * 10000;
            }
            
            // Update and clean up power-ups
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                
                // Remove inactive power-ups
                if (!powerUp.active) {
                    this.powerUps.splice(i, 1);
                    continue;
                }
                
                // Update power-up
                powerUp.update();
                
                // Check for collisions with player
                if (this.player && powerUp.collidesWith(this.player)) {
                    powerUp.collect(this.player, this);
                }
            }

            if (this.player && this.player.autoShoot && this.player.canShoot()) {
                this.shoot();
            }

            // Update and cleanup projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const projectile = this.projectiles[i];
                if (!projectile) {
                    this.projectiles.splice(i, 1);
                    continue;
                }

                projectile.update();

                // Remove projectiles that are off screen
                if (projectile.x < -100 || projectile.x > this.canvas.width + 100 ||
                    projectile.y < -100 || projectile.y > this.canvas.height + 100) {
                    this.projectiles.splice(i, 1);
                }
            }

            // Update enemies
            // Make sure we don't have any null values in the array
            const initialEnemyCount = this.enemies.length;
            this.enemies = this.enemies.filter(enemy => enemy != null);
            
            // Log if nulls were removed
            if (initialEnemyCount !== this.enemies.length) {
                console.log(`Removed ${initialEnemyCount - this.enemies.length} null enemies in cleanup.`);
            }
            
            // Update each enemy position, animation state, etc.
            this.enemies.forEach((enemy, index) => {
                if (enemy) {
                    try {
                        enemy.update(this.player.x, this.player.y);
                    } catch (error) {
                        console.error(`Error updating enemy at index ${index}:`, error);
                        // Mark this enemy for removal in the next cleanup cycle
                        this.enemies[index] = null;
                    }
                }
            });

            this.spawnEnemy();
            this.checkCollisions();
            this.updatePortal();

            // Reset kill streak if no kills in 5 seconds
            if (Date.now() - this.lastKillTime > 5000) {
                this.killStreak = 0;
            }
            
            // Update adaptive difficulty
            this.updateDifficulty();

            // Update music intensity based on game state
            this.updateMusicIntensity();
            // Send player state to server
            if (this.multiplayerManager) {
                this.multiplayerManager.sendPlayerState();
            }
        } catch (error) {
            console.error('Error in update loop:', error);
            this.handleError(error);
        }
    }
    
    updateDifficulty() {
        try {
            // Update performance metrics
            this.performanceMetrics.survivalTime = (Date.now() - this.gameStartTime) / 1000;
            
            // Check if adaptive difficulty is enabled and it's time for an adjustment
            if (this.difficulty.adaptiveEnabled && 
                Date.now() - this.difficulty.lastAssessment >= this.performanceMetrics.assessmentInterval) {
                
                // Calculate metrics since last assessment
                let playerSkillRating = 0;
                
                // Factor 1: Kill rate (kills per second)
                const killRate = this.killStreak / (this.performanceMetrics.assessmentInterval / 1000);
                const normalizedKillRate = Math.min(killRate / 2, 1); // Cap at 2 kills per second = max skill
                playerSkillRating += normalizedKillRate * 0.4; // 40% weight
                
                // Factor 2: Survival time
                const survivalFactor = Math.min(this.performanceMetrics.survivalTime / 120, 1); // Cap at 2 minutes = max skill
                playerSkillRating += survivalFactor * 0.3; // 30% weight
                
                // Factor 3: Current multiplier (which factors in killstreak)
                const multiplierFactor = Math.min((this.multiplier - 1) / 3, 1); // Cap at 4x multiplier = max skill
                playerSkillRating += multiplierFactor * 0.3; // 30% weight
                
                // Adjust difficulty toward player skill level
                // If player is highly skilled, increase difficulty; if struggling, decrease it
                const targetDifficulty = this.difficulty.min + playerSkillRating * (this.difficulty.max - this.difficulty.min);
                const difficultyDelta = targetDifficulty - this.difficulty.level;
                
                // Gradually adjust difficulty using adaptationRate
                this.difficulty.level += difficultyDelta * this.difficulty.adaptationRate;
                
                // Apply difficulty to specific parameters using the modifiers for better balance
                this.difficulty.enemySpeed = this.difficulty.level * this.difficulty.speedModifier;
                this.difficulty.enemyHealth = this.difficulty.level * this.difficulty.healthModifier;
                this.difficulty.enemySpawnRate = this.difficulty.level * this.difficulty.spawnRateModifier;
                this.difficulty.durableEnemyChance = this.difficulty.level * 0.8; // Reduce durable enemy chance slightly
                
                // Reset for next assessment period
                this.difficulty.lastAssessment = Date.now();
                
                // Log difficulty adjustment with detailed parameters
                console.log(`Adaptive difficulty adjusted to level: ${this.difficulty.level.toFixed(2)}`);
                console.log(`Speed: ${this.difficulty.enemySpeed.toFixed(2)}, Health: ${this.difficulty.enemyHealth.toFixed(2)}, Spawn Rate: ${this.difficulty.enemySpawnRate.toFixed(2)}`);
            }
            
            // Always update the UI display, whether adaptive is enabled or not
            this.updateDifficultyDisplay();
            
        } catch (error) {
            console.error('Error updating difficulty:', error);
        }
    }
    
    updateDifficultyDisplay() {
        try {
            const difficultyElement = document.getElementById('difficultyLevel');
            if (!difficultyElement) return;
            
            // Convert numeric difficulty to text description
            let difficultyText;
            const level = this.difficulty.level;
            
            if (level < 0.2) {
                difficultyText = "Easy";
            } else if (level < 0.4) {
                difficultyText = "Medium";
            } else if (level < 0.6) {
                difficultyText = "Hard";
            } else if (level < 0.8) {
                difficultyText = "Expert";
            } else {
                difficultyText = "Insane";
            }
            
            // Append adaptive status
            if (this.difficulty.adaptiveEnabled) {
                difficultyText += " (Adaptive)";
            } else {
                difficultyText += " (Adaptive Disabled)";
            }
            
            // Append performance mode status if enabled
            if (this.performanceMode) {
                difficultyText += " | Performance Mode ✓";
            }
            
            // Update the display with animation
            if (difficultyElement.textContent !== difficultyText) {
                difficultyElement.classList.add('difficulty-change');
                setTimeout(() => difficultyElement.classList.remove('difficulty-change'), 1000);
            }
            
            difficultyElement.textContent = difficultyText;
        } catch (error) {
            console.error('Error updating difficulty display:', error);
        }
    }

    updateMusicIntensity() {
        if (!this.soundManager || !this.soundManager.initialized) return;

        let intensity = 0;

        // Factor 1: Number of enemies (contributes up to 0.3 to intensity)
        const enemyCount = this.enemies.length;
        const enemyIntensity = Math.min(enemyCount / 20, 1) * 0.3;

        // Factor 2: Kill streak (contributes up to 0.2 to intensity)
        const streakIntensity = Math.min(this.killStreak / 15, 1) * 0.2;

        // Factor 3: Score multiplier (contributes up to 0.2 to intensity)
        const multiplierIntensity = Math.min((this.multiplier - 1) / 4, 1) * 0.2;

        // Factor 4: Proximity to enemies (contributes up to 0.3 to intensity)
        let closestDistance = Infinity;
        this.enemies.forEach(enemy => {
            if (enemy && this.player) {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                closestDistance = Math.min(closestDistance, distance);
            }
        });
        const proximityIntensity = closestDistance === Infinity ? 0 :
            Math.max(0, Math.min(1 - (closestDistance / 300), 1)) * 0.3;

        // Combine all factors
        intensity = enemyIntensity + streakIntensity + multiplierIntensity + proximityIntensity;

        // Smoothly update the music intensity
        this.soundManager.setMusicIntensity(intensity);
    }

    draw() {
        try {
            // Update render FPS counter
            if (this.debugInfo) {
                this.debugInfo.updateRenderFps();
            }
            
            if (!this.ctx) return;

            // Fill background
            this.ctx.fillStyle = 'rgba(17, 24, 39, 1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw grid
            this.ctx.beginPath();
            const gridSize = 20;

            // Vertical lines
            for (let x = 0; x <= this.canvas.width; x += gridSize) {
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
            }

            // Horizontal lines
            for (let y = 0; y <= this.canvas.height; y += gridSize) {
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
            }

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.stroke();

            if (this.iceZone) {
                this.iceZone.draw(this.ctx);
            }

            if (this.portal) {
                this.portal.draw(this.ctx);
            }

            if (this.player) {
                this.player.draw(this.ctx);
            }

            this.projectiles.forEach(projectile => {
                if (projectile) {
                    projectile.draw(this.ctx);
                }
            });
            
            // Draw power-ups
            this.powerUps.forEach(powerUp => {
                if (powerUp && powerUp.active) {
                    powerUp.draw(this.ctx);
                }
            });

            // Draw persistent explosion effects that outlast removed enemies
            this.persistentExplosions.forEach((explosion, index) => {
                if (explosion) {
                    this.drawPersistentExplosion(explosion);
                    
                    // Update explosion lifetime
                    explosion.lifetime += 1;
                    
                    // Remove explosion if its lifetime has ended
                    if (explosion.lifetime >= explosion.maxLifetime) {
                        this.persistentExplosions.splice(index, 1);
                    }
                }
            });
            
            // Power-ups are already drawn above
            
            this.enemies.forEach(enemy => {
                if (enemy) {
                    enemy.draw(this.ctx);
                }
            });
            // Draw other players
            if (this.multiplayerManager) {
                this.multiplayerManager.drawOtherPlayers(this.ctx);
            }
        } catch (error) {
            console.error('Error in draw loop:', error);
            this.handleError(error);
        }
    }

    gameLoop() {
        try {
            if (!this.paused) {
                this.update();
                
                // Check for collisions
                this.checkCollisions();
                
                // Update difficulty if needed
                this.updateDifficulty();
                
                // Check achievements
                if (this.achievementSystem) {
                    this.achievementSystem.checkAchievements();
                }
            }
            this.draw();
            this.debugInfo.draw();
            // Store the animation frame ID for proper cleanup
            this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
        } catch (error) {
            console.error('Error in game loop:', error);
            this.handleError(error);
        }
    }
    updatePerformanceMonitoring() {
        try {
            const now = Date.now();
            
            // Only check performance every 1 second to avoid too frequent adjustments
            if (now - this.performanceMonitor.lastCheck < 1000) {
                return;
            }
            
            this.performanceMonitor.lastCheck = now;
            
            // Add current FPS to history
            const currentFps = this.debugInfo ? this.debugInfo.physicsFps : 60;
            this.performanceMonitor.fpsHistory.push(currentFps);
            
            // Keep only the last 5 measurements
            if (this.performanceMonitor.fpsHistory.length > 5) {
                this.performanceMonitor.fpsHistory.shift();
            }
            
            // Calculate average FPS
            const avgFps = this.performanceMonitor.fpsHistory.reduce((sum, fps) => sum + fps, 0) / 
                           this.performanceMonitor.fpsHistory.length;
            
            // Determine if the game is lagging (now with two thresholds)
            const wasLagging = this.performanceMonitor.isLagging;
            const wasMildlyLagging = this.performanceMonitor.isMildlyLagging;
            
            // Critical lag - below lowFpsThreshold
            this.performanceMonitor.isLagging = avgFps < this.performanceMonitor.lowFpsThreshold;
            
            // Mild lag - below mediumFpsThreshold but above lowFpsThreshold
            this.performanceMonitor.isMildlyLagging = !this.performanceMonitor.isLagging && 
                                                     avgFps < this.performanceMonitor.mediumFpsThreshold;
            
            // Adjust spawn rate reduction based on lag status
            if (this.performanceMonitor.isLagging) {
                // More aggressive spawn rate reduction for severe lag
                this.performanceMonitor.spawnRateReduction = Math.min(
                    this.performanceMonitor.spawnRateReduction * 2.0, 
                    this.performanceMonitor.maxSpawnRateReduction
                );
                
                if (!wasLagging) {
                    console.log(`Performance CRITICAL: FPS dropped to ${avgFps.toFixed(1)}, strongly reducing enemy spawns (x${this.performanceMonitor.spawnRateReduction.toFixed(1)})`);
                }
            } else if (this.performanceMonitor.isMildlyLagging) {
                // Moderate spawn rate reduction for mild lag
                this.performanceMonitor.spawnRateReduction = Math.min(
                    this.performanceMonitor.spawnRateReduction * 1.25, 
                    this.performanceMonitor.maxSpawnRateReduction * 0.7
                );
                
                if (!wasMildlyLagging && !wasLagging) {
                    console.log(`Performance WARNING: FPS at ${avgFps.toFixed(1)}, moderately reducing enemy spawns (x${this.performanceMonitor.spawnRateReduction.toFixed(1)})`);
                }
            } else if (wasLagging || wasMildlyLagging) {
                // Gradually reduce spawn rate reduction when no longer lagging
                this.performanceMonitor.spawnRateReduction = Math.max(
                    this.performanceMonitor.spawnRateReduction * 0.8,
                    1.0
                );
                console.log(`Performance IMPROVED: FPS recovered to ${avgFps.toFixed(1)}, normalizing enemy spawns (x${this.performanceMonitor.spawnRateReduction.toFixed(1)})`);
            }
        } catch (error) {
            console.error('Error updating performance monitoring:', error);
        }
    }
    
    updateMultiplier() {
        try {
            // Store the old multiplier for comparison
            const oldMultiplier = this.multiplier;

            // Increase multiplier based on survival time (every 30 seconds)
            const survivalTime = (Date.now() - this.gameStartTime) / 1000;
            const timeMultiplier = Math.floor(survivalTime / 30) * 0.1 + 1;

            // Increase multiplier based on kill streak
            const streakMultiplier = Math.min(this.killStreak * 0.1, 2);

            // Calculate new multiplier
            this.multiplier = timeMultiplier + streakMultiplier;

            // Get the multiplier display element
            const multiplierElement = document.getElementById('multiplier');
            if (!multiplierElement) return;

            // Update the display with animation effects
            multiplierElement.textContent = this.multiplier.toFixed(1);

            // Check for milestone multipliers and add special highlight animation
            if (Math.floor(this.multiplier * 10) > Math.floor(oldMultiplier * 10) && 
                this.multiplier >= 1.5 && 
                Math.floor(this.multiplier * 10) % 5 === 0) {
                // Special milestone animation (e.g., at 1.5x, 2.0x, 2.5x, etc.)
                multiplierElement.classList.remove('increasing', 'decreasing');
                multiplierElement.classList.add('multiplier-highlight');
                setTimeout(() => multiplierElement.classList.remove('multiplier-highlight'), 800);
            } 
            // Standard increase/decrease animations
            else if (this.multiplier > oldMultiplier) {
                // Multiplier increased - show positive animation
                multiplierElement.classList.remove('decreasing');
                multiplierElement.classList.add('increasing');
                setTimeout(() => multiplierElement.classList.remove('increasing'), 1000);
            } else if (this.multiplier < oldMultiplier) {
                // Multiplier decreased - show negative animation
                multiplierElement.classList.remove('increasing');
                multiplierElement.classList.add('decreasing');
                setTimeout(() => multiplierElement.classList.remove('decreasing'), 1000);
            }
        } catch (error) {
            console.error('Error updating multiplier:', error);
        }
    }

    addScore(basePoints) {
        try {
            // Validate inputs
            if (!Number.isFinite(basePoints) || basePoints <= 0) {
                console.error('Invalid base points:', basePoints);
                return;
            }

            this.updateMultiplier();

            // Ensure multiplier is within reasonable bounds
            this.multiplier = Math.min(Math.max(1, this.multiplier), 5);

            const points = Math.floor(basePoints * this.multiplier);

            // Validate calculated points
            if (!Number.isFinite(points) || points <= 0) {
                console.error('Invalid calculated points:', points);
                return;
            }

            this.score += points;
            this.lastKillTime = Date.now();

            // Update score display with animation
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                // Format the score with thousands separators for better readability
                scoreElement.textContent = this.score.toLocaleString();
                
                // Add pulse animation to the score
                scoreElement.classList.add('pulse');
                setTimeout(() => scoreElement.classList.remove('pulse'), 500);
                
                // Add cosmic particles for score if available
                if (window.cosmicTransitions && this.player) {
                    const rect = scoreElement.getBoundingClientRect();
                    
                    // Create gravity well at score display to attract particles
                    const scoreGravity = window.cosmicTransitions.addGravitySource(
                        rect.left + rect.width/2, 
                        rect.top + rect.height/2, 
                        0.5, // Moderate attraction
                        scoreElement, // Attach to score element
                        false // Not persistent
                    );
                    
                    // Remove gravity source after particles reach it
                    setTimeout(() => {
                        if (window.cosmicTransitions.gravitySources) {
                            const index = window.cosmicTransitions.gravitySources.indexOf(scoreGravity);
                            if (index > -1) window.cosmicTransitions.gravitySources.splice(index, 1);
                        }
                    }, 1000);
                    
                    // Create particles at player position
                    window.cosmicTransitions.createParticleBurst(
                        this.player.x, 
                        this.player.y, 
                        {
                            count: Math.min(10, Math.max(3, points / 100)),
                            colors: this.multiplier > 3 ? 
                                ['#ffaa00', '#ff8800', '#ffdd00'] : // High multiplier colors
                                ['#00aaff', '#0088ff', '#00ddff'], // Standard colors
                            directed: true,
                            direction: {
                                x: rect.left + rect.width/2 - this.player.x,
                                y: rect.top + rect.height/2 - this.player.y
                            },
                            glow: true,
                            trail: this.multiplier > 2,
                            lifespan: 1500,
                            gravity: 0.05
                        }
                    );
                    
                    // For high multipliers, add a pulse effect around the score display
                    if (this.multiplier >= 3) {
                        window.cosmicTransitions.createPulseEffect(scoreElement, {
                            radius: rect.width * 2,
                            color: this.multiplier >= 4 ? '#ff9900' : '#3399ff',
                            duration: 800
                        });
                    }
                }
            }

            // Check for tier upgrade
            this.checkTierUpgrade();

            // Show floating score text
            this.showFloatingScore(points);

            // Update upgrade buttons after score changes
            this.upgradeSystem.updateAllButtons();
            
            // Register score with achievement system
            if (this.achievementSystem) {
                this.achievementSystem.updateScore(points);
            }
        } catch (error) {
            console.error('Error adding score:', error);
        }
    }

    showFloatingScore(points) {
        try {
            if (!this.player) return;

            const floatingScore = document.createElement('div');
            
            // Determine the type of score animation based on points value
            const isBonus = points >= 300 || typeof points === 'string';
            
            if (isBonus) {
                floatingScore.className = 'floating-score bonus';
                floatingScore.textContent = typeof points === 'string' ? points : `+${points} BONUS!`;
            } else {
                floatingScore.className = 'floating-score positive';
                floatingScore.textContent = `+${points}`;
            }

            // Position it semi-randomly around where the player is
            const offsetX = (Math.random() * 60 - 30) + (this.player.velocityX ? this.player.velocityX * 5 : 0);
            const offsetY = (Math.random() * 60 - 30) + (this.player.velocityY ? this.player.velocityY * 5 : 0);
            
            floatingScore.style.left = `${this.player.x + offsetX}px`;
            floatingScore.style.top = `${this.player.y + offsetY}px`;

            document.querySelector('.game-container').appendChild(floatingScore);
            
            // Add cosmic particles around the floating score if available
            if (window.cosmicTransitions) {
                const rect = floatingScore.getBoundingClientRect();
                
                // Create particle burst around the floating score
                window.cosmicTransitions.createParticleBurst(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    {
                        count: isBonus ? 15 : 8,
                        colors: isBonus ? 
                            ['#ffcc00', '#ff9900', '#ffeeaa'] : // Bonus colors
                            ['#aaddff', '#66aaff', '#88ccff'], // Standard colors
                        speed: { min: 20, max: 60 },
                        size: { min: 2, max: 4 },
                        lifespan: isBonus ? 1400 : 1000,
                        gravity: -0.02, // Particles float upward slightly
                        shapes: isBonus ? ['circle', 'star'] : ['circle'],
                        glow: true
                    }
                );
                
                // Add floating effect to the score text
                window.cosmicTransitions.createFloatingEffect(floatingScore, {
                    amplitude: isBonus ? 10 : 5,
                    frequency: isBonus ? 3 : 2,
                    fadeOut: true,
                    duration: isBonus ? 1500 : 1200
                });
            }

            // Remove the element after animation completes
            setTimeout(() => {
                floatingScore.remove();
            }, isBonus ? 1500 : 1200);
        } catch (error) {
            console.error('Error showing floating score:', error);
        }
    }

    // Check if the Radiant Event should be triggered (score reached 10,000)
    checkRadiantEventTrigger() {
        try {
            // Only proceed if we haven't already triggered the event
            if (this.score >= 10000 && !this.radiantEventTriggered) {
                console.log("Radiant Event triggered at score 10,000!");
                this.radiantEventTriggered = true;
                this.radiantCountdownActive = true;
                this.radiantCountdownTime = 5; // 5 second countdown
                
                // Display countdown notification
                this.showRadiantCountdown();
            }
        } catch (error) {
            console.error('Error checking Radiant Event trigger:', error);
        }
    }
    
    // Update the Radiant Event state
    updateRadiantEvent() {
        try {
            // Update countdown if active
            if (this.radiantCountdownActive) {
                // Decrement countdown each second
                const currentSecond = Math.floor(Date.now() / 1000);
                if (currentSecond !== this.lastCountdownSecond) {
                    this.lastCountdownSecond = currentSecond;
                    this.radiantCountdownTime--;
                    
                    // Update countdown display
                    this.updateRadiantCountdown();
                    
                    // When countdown reaches zero, start the event
                    if (this.radiantCountdownTime <= 0) {
                        this.startRadiantEvent();
                        this.radiantCountdownActive = false;
                    }
                }
            }
            
            // Update active event timer
            if (this.radiantEventActive) {
                const now = Date.now();
                const timeRemaining = Math.max(0, this.radiantEventEndTime - now);
                
                // Update timer display
                this.updateRadiantEventTimer(timeRemaining);
                
                // When time is up, end the event
                if (timeRemaining <= 0) {
                    this.endRadiantEvent();
                }
            }
        } catch (error) {
            console.error('Error updating Radiant Event:', error);
        }
    }
    
    // Update the Lunar Event state
    updateLunarEvent() {
        try {
            // Check if we should start the Lunar countdown after Radiant event
            if (this.lunarEventTriggered && !this.lunarEventActive && !this.lunarCountdownActive && !this.radiantEventActive) {
                const timeSinceRadiantEnd = (Date.now() - this.lunarEventTimerStart) / 1000;
                
                // Start countdown after 15 seconds delay
                if (timeSinceRadiantEnd >= this.lunarEventDelay) {
                    console.log("Starting Lunar event countdown");
                    this.lunarCountdownActive = true;
                    this.lunarCountdownTime = 5; // 5 second countdown
                    this.showLunarCountdown();
                    this.lastCountdownSecond = Math.floor(Date.now() / 1000);
                }
            }
            
            // Update countdown if active
            if (this.lunarCountdownActive) {
                // Decrement countdown each second
                const currentSecond = Math.floor(Date.now() / 1000);
                if (currentSecond !== this.lastCountdownSecond) {
                    this.lastCountdownSecond = currentSecond;
                    this.lunarCountdownTime--;
                    
                    // Update countdown display
                    this.updateLunarCountdown();
                    
                    // When countdown reaches zero, start the event
                    if (this.lunarCountdownTime <= 0) {
                        this.startLunarEvent();
                        this.lunarCountdownActive = false;
                    }
                }
            }
            
            // Update active event timer
            if (this.lunarEventActive) {
                const now = Date.now();
                const timeRemaining = Math.max(0, this.lunarEventEndTime - now);
                
                // Update timer display
                this.updateLunarEventTimer(timeRemaining);
                
                // When time is up, end the event
                if (timeRemaining <= 0) {
                    this.endLunarEvent();
                }
            }
        } catch (error) {
            console.error('Error updating Lunar Event:', error);
        }
    }
    
    // Start the Radiant Event
    startRadiantEvent() {
        try {
            console.log("Radiant Event started!");
            this.radiantEventActive = true;
            this.radiantEventStartTime = Date.now();
            this.radiantEventEndTime = this.radiantEventStartTime + (this.radiantEventDuration * 1000);
            
            // Set the enemy multiplier to the radiant value (2x)
            this.enemyMultiplierActive = this.radiantEnemyMultiplier;
            
            // Show event start notification
            this.showRadiantEventStart();
            
            // Create the timer UI
            this.createRadiantEventTimer();
        } catch (error) {
            console.error('Error starting Radiant Event:', error);
        }
    }
    
    // End the Radiant Event
    endRadiantEvent() {
        try {
            console.log("Radiant Event ended!");
            this.radiantEventActive = false;
            
            // Change to post-event multiplier (1.5x)
            this.enemyMultiplierActive = this.postRadiantEnemyMultiplier;
            
            // Show event end notification
            this.showRadiantEventEnd();
            
            // Remove the timer UI
            this.removeRadiantEventTimer();
            
            // Unlock the Highly Radiant achievement
            if (this.achievementSystem) {
                this.achievementSystem.updateAchievementProgress('highlyRadiant', 1);
            }
            
            // Start the timer for Lunar event
            if (!this.lunarEventTriggered) {
                this.lunarEventTriggered = true;
                this.lunarEventTimerStart = Date.now();
                console.log("Lunar event countdown started - will trigger in 15 seconds");
            }
        } catch (error) {
            console.error('Error ending Radiant Event:', error);
        }
    }
    
    // Create and show the countdown notification
    showRadiantCountdown() {
        try {
            // Remove any existing countdown
            const existingCountdown = document.getElementById('radiantCountdown');
            if (existingCountdown) {
                existingCountdown.remove();
            }
            
            // Create countdown element
            const countdown = document.createElement('div');
            countdown.id = 'radiantCountdown';
            countdown.className = 'radiant-countdown';
            countdown.innerHTML = `
                <div class="countdown-title">Radiant Event Incoming!</div>
                <div class="countdown-timer">${this.radiantCountdownTime}</div>
                <div class="countdown-desc">Prepare for powerful enemies!</div>
            `;
            
            document.body.appendChild(countdown);
        } catch (error) {
            console.error('Error showing Radiant countdown:', error);
        }
    }
    
    // Update the countdown display
    updateRadiantCountdown() {
        try {
            const countdown = document.getElementById('radiantCountdown');
            if (countdown) {
                const timer = countdown.querySelector('.countdown-timer');
                if (timer) {
                    timer.textContent = this.radiantCountdownTime;
                    
                    // Add pulse animation
                    timer.classList.remove('pulse');
                    void timer.offsetWidth; // Force reflow
                    timer.classList.add('pulse');
                }
            }
        } catch (error) {
            console.error('Error updating Radiant countdown:', error);
        }
    }
    
    // Show notification that the event has started
    showRadiantEventStart() {
        try {
            // Remove countdown if it exists
            const countdown = document.getElementById('radiantCountdown');
            if (countdown) {
                countdown.remove();
            }
            
            // Create start notification
            const notification = document.createElement('div');
            notification.className = 'radiant-notification';
            notification.innerHTML = `
                <div class="notification-title">Radiant Event Activated!</div>
                <div class="notification-desc">Enemies are now 2x stronger!</div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 1000);
            }, 3000);
        } catch (error) {
            console.error('Error showing Radiant event start:', error);
        }
    }
    
    // Show notification that the event has ended
    showRadiantEventEnd() {
        try {
            // Create end notification
            const notification = document.createElement('div');
            notification.className = 'radiant-notification';
            notification.innerHTML = `
                <div class="notification-title">Radiant Event Complete</div>
                <div class="notification-desc">Enemies remain 1.5x stronger!</div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 1000);
            }, 3000);
        } catch (error) {
            console.error('Error showing Radiant event end:', error);
        }
    }
    
    // Create the timer UI for the Radiant Event
    createRadiantEventTimer() {
        try {
            // Remove any existing timer
            this.removeRadiantEventTimer();
            
            // Create timer element
            const timer = document.createElement('div');
            timer.id = 'radiantEventTimer';
            timer.className = 'radiant-event-timer';
            timer.innerHTML = `
                <div class="event-timer-title">Radiant Event</div>
                <div class="event-timer-countdown">2:00</div>
            `;
            
            document.body.appendChild(timer);
        } catch (error) {
            console.error('Error creating Radiant event timer:', error);
        }
    }
    
    // Update the timer display
    updateRadiantEventTimer(timeRemaining) {
        try {
            const timer = document.getElementById('radiantEventTimer');
            if (timer) {
                const countdown = timer.querySelector('.event-timer-countdown');
                if (countdown) {
                    // Format time as minutes:seconds
                    const minutes = Math.floor(timeRemaining / 60000);
                    const seconds = Math.floor((timeRemaining % 60000) / 1000);
                    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    countdown.textContent = formattedTime;
                    
                    // Add warning animation when less than 30 seconds remain
                    if (timeRemaining < 30000 && !countdown.classList.contains('warning')) {
                        countdown.classList.add('warning');
                    }
                }
            }
        } catch (error) {
            console.error('Error updating Radiant event timer:', error);
        }
    }
    
    // Remove the timer UI
    removeRadiantEventTimer() {
        try {
            const timer = document.getElementById('radiantEventTimer');
            if (timer) {
                timer.remove();
            }
        } catch (error) {
            console.error('Error removing Radiant event timer:', error);
        }
    }
    
    // Remove the countdown UI
    removeRadiantCountdownUI() {
        try {
            const countdown = document.getElementById('radiantCountdown');
            if (countdown) {
                countdown.remove();
            }
        } catch (error) {
            console.error('Error removing Radiant countdown:', error);
        }
    }
    
    // Remove the Lunar countdown UI
    removeLunarCountdownUI() {
        try {
            const countdown = document.getElementById('lunarCountdown');
            if (countdown) {
                countdown.remove();
            }
        } catch (error) {
            console.error('Error removing Lunar countdown:', error);
        }
    }
    
    // Start the Lunar Event
    startLunarEvent() {
        try {
            console.log("Lunar Event started!");
            this.lunarEventActive = true;
            this.lunarEventStartTime = Date.now();
            this.lunarEventEndTime = this.lunarEventStartTime + (this.lunarEventDuration * 1000);
            
            // Set the enemy multiplier to the lunar value (3x)
            this.enemyMultiplierActive = this.lunarEnemyMultiplier;
            
            // Change to lunar dimension
            this.changeDimension('lunar');
            
            // Show event start notification
            this.showLunarEventStart();
            
            // Create the timer UI
            this.createLunarEventTimer();
            
            // Unlock achievement
            if (this.achievementSystem) {
                this.achievementSystem.updateAchievementProgress('lunarSurvivor', 1);
            }
        } catch (error) {
            console.error('Error starting Lunar Event:', error);
        }
    }
    
    // End the Lunar Event
    endLunarEvent() {
        try {
            console.log("Lunar Event ended!");
            this.lunarEventActive = false;
            
            // Reset to post-radiant multiplier (1.5x)
            this.enemyMultiplierActive = this.postRadiantEnemyMultiplier;
            
            // Return to normal dimension
            this.changeDimension('normal');
            
            // Show event end notification
            this.showLunarEventEnd();
            
            // Remove the timer UI
            this.removeLunarEventTimer();
            
            // Prevent the lunar event from triggering again until next radiant event
            // This is the key fix to prevent re-triggering
            this.lunarEventTriggered = false;
            
            // Unlock achievement for completing the lunar event
            if (this.achievementSystem) {
                this.achievementSystem.updateAchievementProgress('highlyLunar', 1);
            }
        } catch (error) {
            console.error('Error ending Lunar Event:', error);
        }
    }
    
    // Show Lunar countdown
    showLunarCountdown() {
        try {
            // Remove any existing countdown
            const existingCountdown = document.getElementById('lunarCountdown');
            if (existingCountdown) {
                existingCountdown.remove();
            }
            
            // Create countdown element
            const countdown = document.createElement('div');
            countdown.id = 'lunarCountdown';
            countdown.className = 'lunar-countdown';
            countdown.innerHTML = `
                <div class="countdown-title">Lunar Event Incoming!</div>
                <div class="countdown-timer">${this.lunarCountdownTime}</div>
                <div class="countdown-desc">Prepare for ultra-powerful enemies!</div>
            `;
            
            document.body.appendChild(countdown);
        } catch (error) {
            console.error('Error showing Lunar countdown:', error);
        }
    }
    
    // Update Lunar countdown
    updateLunarCountdown() {
        try {
            const countdown = document.getElementById('lunarCountdown');
            if (countdown) {
                const timer = countdown.querySelector('.countdown-timer');
                if (timer) {
                    timer.textContent = this.lunarCountdownTime;
                    
                    // Add pulse animation
                    timer.classList.remove('pulse');
                    void timer.offsetWidth; // Force reflow
                    timer.classList.add('pulse');
                }
            }
        } catch (error) {
            console.error('Error updating Lunar countdown:', error);
        }
    }
    
    // Show Lunar event start notification
    showLunarEventStart() {
        try {
            // Remove countdown if it exists
            const countdown = document.getElementById('lunarCountdown');
            if (countdown) {
                countdown.remove();
            }
            
            // Create start notification
            const notification = document.createElement('div');
            notification.className = 'lunar-notification';
            notification.innerHTML = `
                <div class="notification-title">Lunar Event Activated!</div>
                <div class="notification-desc">Enemies are now 3x stronger with increased spawn rate!</div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 1000);
            }, 3000);
        } catch (error) {
            console.error('Error showing Lunar event start:', error);
        }
    }
    
    // Show Lunar event end notification
    showLunarEventEnd() {
        try {
            // Create end notification
            const notification = document.createElement('div');
            notification.className = 'lunar-notification';
            notification.innerHTML = `
                <div class="notification-title">Lunar Event Complete</div>
                <div class="notification-desc">Enemies return to 1.5x strength!</div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 1000);
            }, 3000);
        } catch (error) {
            console.error('Error showing Lunar event end:', error);
        }
    }
    
    // Create Lunar event timer UI
    createLunarEventTimer() {
        try {
            // Remove any existing timer
            this.removeLunarEventTimer();
            
            // Create timer element
            const timer = document.createElement('div');
            timer.id = 'lunarEventTimer';
            timer.className = 'lunar-event-timer';
            timer.innerHTML = `
                <div class="event-timer-title">Lunar Event</div>
                <div class="event-timer-countdown">2:00</div>
            `;
            
            document.body.appendChild(timer);
        } catch (error) {
            console.error('Error creating Lunar event timer:', error);
        }
    }
    
    // Update Lunar event timer
    updateLunarEventTimer(timeRemaining) {
        try {
            const timer = document.getElementById('lunarEventTimer');
            if (timer) {
                const countdown = timer.querySelector('.event-timer-countdown');
                if (countdown) {
                    // Format time as minutes:seconds
                    const minutes = Math.floor(timeRemaining / 60000);
                    const seconds = Math.floor((timeRemaining % 60000) / 1000);
                    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    countdown.textContent = formattedTime;
                    
                    // Add warning animation when less than 30 seconds remain
                    if (timeRemaining < 30000 && !countdown.classList.contains('warning')) {
                        countdown.classList.add('warning');
                    }
                }
            }
        } catch (error) {
            console.error('Error updating Lunar event timer:', error);
        }
    }
    
    // Remove Lunar event timer
    removeLunarEventTimer() {
        try {
            const timer = document.getElementById('lunarEventTimer');
            if (timer) {
                timer.remove();
            }
        } catch (error) {
            console.error('Error removing Lunar event timer:', error);
        }
    }

    spawnEnemy() {
        try {
            // Apply difficulty to spawn rates with spawnRateModifier for better balance
            const difficultyFactor = this.difficulty ? this.difficulty.level : 0.2;
            const spawnRateModifier = this.difficulty ? this.difficulty.spawnRateModifier : 1.0;
            
            // Apply performance-based spawn rate reduction if the game is lagging
            // If performance mode is enabled, apply a more aggressive spawn rate reduction
            let performanceModifier = this.performanceMonitor ? (1.0 / this.performanceMonitor.spawnRateReduction) : 1.0;
            
            // If performance mode is enabled, further reduce spawn rate by 25%
            if (this.performanceMode) {
                performanceModifier *= 0.75;
            }
            
            // Debug performance adjustment
            if (Math.random() < 0.01) { // Only log occasionally to avoid console spam
                console.log(`Performance: Spawn rate adjusted by ${performanceModifier.toFixed(2)}x (Reduction: ${this.performanceMonitor?.spawnRateReduction.toFixed(2)}x)`);
            }
            
            // Base spawn rate increases with difficulty (0.01 at easiest, 0.03 at hardest)
            // Apply both the difficulty spawn rate modifier and performance modifier
            const baseSpawnRate = (0.01 + (difficultyFactor * 0.02)) * spawnRateModifier * performanceModifier; 
            
            // Durable enemy chance increases with difficulty (0.002 at easiest, 0.01 at hardest)
            // Slightly reduce the durable enemy chance to make the game more balanced
            // Also apply performance modifier to durable enemies
            const durableSpawnRate = (0.002 + (difficultyFactor * 0.006)) * spawnRateModifier * 0.8 * performanceModifier;
            
            const random = Math.random();
            
            // Apply different spawn rates based on active event
            let eventSpawnRate = baseSpawnRate;
            if (this.lunarEventActive) {
                // Lunar event has 91% of the normal spawn rate (increased from 70% by a factor of 1.3)
                // This creates a balance where there are fewer but much stronger enemies (3x normal strength)
                eventSpawnRate = baseSpawnRate * this.lunarSpawnRateModifier;
                
                // Log occasionally to debug spawn rates
                if (Math.random() < 0.001) {
                    console.log(`Lunar event spawn rate: ${eventSpawnRate.toFixed(4)} (Base: ${baseSpawnRate.toFixed(4)} × Modifier: ${this.lunarSpawnRateModifier})`);
                }
            } else if (this.radiantEventActive) {
                // Radiant event has normal spawn rate (1.0x)
                eventSpawnRate = baseSpawnRate * this.radiantSpawnRateModifier;
                
                // Log occasionally to debug spawn rates
                if (Math.random() < 0.001) {
                    console.log(`Radiant event spawn rate: ${eventSpawnRate.toFixed(4)} (Base: ${baseSpawnRate.toFixed(4)} × Modifier: ${this.radiantSpawnRateModifier})`);
                }
            }
            
            if (random < eventSpawnRate) {
                const isDurable = random < durableSpawnRate;
                // Determine enemy type and dimension based on active event
                const isRadiant = this.radiantEventActive;
                const isLunar = false; // We don't need this flag anymore since dimension='lunar' automatically makes isLunar=true in Enemy class
                
                // Select dimension based on active event - this directly drives enemy appearance
                const dimension = this.lunarEventActive ? 'lunar' : (this.radiantEventActive ? 'radiant' : 'normal');
                
                const enemy = new Enemy(this.canvas, isDurable, dimension, isRadiant, this.performanceMode);
                
                // Apply difficulty modifiers to enemy properties if difficulty system is initialized
                if (this.difficulty) {
                    // Apply speed modifier for more nuanced difficulty
                    const speedModifier = this.difficulty.speedModifier || 1.0;
                    // Speed increases with difficulty (base speed * 0.8 at easiest, base speed * 1.5 at hardest)
                    enemy.speed = enemy.speed * (0.7 + (this.difficulty.enemySpeed * 0.7 * speedModifier));
                    
                    // Apply health modifier for more nuanced difficulty
                    const healthModifier = this.difficulty.healthModifier || 1.0;
                    // Health increases with difficulty (base health at easiest, base health * 2 at hardest)
                    const healthMultiplier = 1 + (this.difficulty.enemyHealth * healthModifier);
                    
                    // Apply additional multiplier for radiant event
                    const eventMultiplier = this.enemyMultiplierActive;
                    
                    enemy.health = Math.ceil(enemy.health * healthMultiplier * eventMultiplier);
                    enemy.initialHealth = enemy.health; // Update initial health for health bar calculation
                }
                
                this.enemies.push(enemy);
                
                // Update performance metrics
                this.performanceMetrics.enemiesSpawned = (this.performanceMetrics.enemiesSpawned || 0) + 1;
            }
        } catch (error) {
            console.error('Error spawning enemy:', error);
        }
    }

    /**
     * Creates a persistent death explosion effect that will remain visible
     * after the enemy is removed from the game
     * @param {Enemy} enemy - The enemy that was destroyed
     */
    createPersistentDeathEffect(enemy) {
        try {
            if (!enemy) return;
            
            // Skip creating explosion effects in performance mode
            if (this.performanceMode) {
                return;
            }
            
            // Create a persistent explosion based on the enemy's properties
            const explosionEffect = {
                x: enemy.x,
                y: enemy.y,
                size: enemy.size,
                isDurable: enemy.isDurable, 
                isRadiant: enemy.isRadiant,
                isLunar: enemy.isLunar,
                dimension: enemy.dimension,
                particles: [],
                lifetime: 0,
                maxLifetime: 75, // About 1-2 seconds at 60 FPS
                rotationSpeed: Math.random() * 0.1 - 0.05,
                rotation: Math.random() * Math.PI * 2
            };
            
            // Create initial particles
            const particleCount = enemy.isDurable ? 40 : 25;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                const size = Math.random() * 4 + 1;
                
                // Different particle types for visual variety
                let type;
                const typeRoll = Math.random();
                if (typeRoll < 0.3) {
                    type = 'spark';
                } else if (typeRoll < 0.6) {
                    type = 'smoke';
                } else {
                    type = 'fire';
                }
                
                // Longer lifetime for persistent effect
                const maxLife = Math.random() * 60 + 30;
                
                explosionEffect.particles.push({
                    x: 0,
                    y: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: size,
                    life: 0,
                    maxLife: maxLife,
                    type: type,
                    alpha: 1
                });
            }
            
            // Add to persistent explosions array
            this.persistentExplosions.push(explosionEffect);
            
        } catch (error) {
            console.error('Error creating persistent death effect:', error);
        }
    }
    
    /**
     * Draws a persistent explosion effect
     * @param {Object} explosion - The explosion effect to draw
     */
    drawPersistentExplosion(explosion) {
        try {
            if (!explosion || !this.ctx) return;
            
            // Calculate lifetime progress (0-1)
            const lifeProgress = explosion.lifetime / explosion.maxLifetime;
            
            // Set global alpha based on lifetime (fades out towards the end)
            const globalAlpha = 1 - lifeProgress;
            this.ctx.save();
            this.ctx.globalAlpha = globalAlpha;
            
            // Draw each particle in the explosion
            for (let i = 0; i < explosion.particles.length; i++) {
                const particle = explosion.particles[i];
                
                // Update particle position
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Apply gravity and drag
                particle.vy += 0.05;
                particle.vx *= 0.97;
                particle.vy *= 0.97;
                
                // Update particle lifetime
                particle.life++;
                
                // Skip rendering dead particles
                if (particle.life >= particle.maxLife) continue;
                
                // Calculate particle alpha based on lifetime
                const particleAlpha = 1 - (particle.life / particle.maxLife);
                if (particleAlpha < 0.05) continue;
                
                // Draw particle
                this.ctx.beginPath();
                this.ctx.arc(
                    explosion.x + particle.x, 
                    explosion.y + particle.y, 
                    particle.size * (1 - particle.life / particle.maxLife), 
                    0, 
                    Math.PI * 2
                );
                
                // Determine particle color based on type and enemy properties
                if (particle.type === 'spark') {
                    if (explosion.isRadiant) {
                        this.ctx.fillStyle = `rgba(255, 220, 150, ${particleAlpha * 0.9})`;
                    } else if (explosion.isLunar) {
                        this.ctx.fillStyle = `rgba(200, 220, 255, ${particleAlpha * 0.9})`;
                    } else {
                        this.ctx.fillStyle = `rgba(255, 200, 100, ${particleAlpha * 0.9})`;
                    }
                } else if (particle.type === 'smoke') {
                    this.ctx.fillStyle = `rgba(100, 100, 100, ${particleAlpha * 0.7})`;
                } else {
                    // Fire particle
                    if (explosion.isRadiant) {
                        const r = 255;
                        const g = Math.floor(200 + (1 - particle.life / particle.maxLife) * 55);
                        const b = Math.floor(50 + (1 - particle.life / particle.maxLife) * 50);
                        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particleAlpha})`;
                    } else if (explosion.isLunar) {
                        const r = Math.floor(100 + (1 - particle.life / particle.maxLife) * 100);
                        const g = Math.floor(150 + (1 - particle.life / particle.maxLife) * 50);
                        const b = 255;
                        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particleAlpha})`;
                    } else {
                        const r = 255 - Math.floor((particle.life / particle.maxLife) * 155);
                        const g = Math.floor((1 - particle.life / particle.maxLife) * 100);
                        this.ctx.fillStyle = `rgba(${r}, ${g}, 0, ${particleAlpha})`;
                    }
                }
                
                this.ctx.fill();
            }
            
            this.ctx.restore();
        } catch (error) {
            console.error('Error drawing persistent explosion:', error);
        }
    }

    endGame() {
        this.gameOver = true;
        
        // Save achievement progress before ending game
        if (this.achievementSystem) {
            this.achievementSystem.saveAchievements();
        }
        
        // Create cosmic transition effect for game over screen
        if (window.cosmicTransitions) {
            // Create a dramatic page transition effect
            window.cosmicTransitions.createPageTransition('out', {
                duration: 1200,
                particleCount: 150,
                colors: window.cosmicTransitions.colorPalettes.defeat,
                particleSize: { min: 2, max: 6 },
                particleSpeed: { min: 50, max: 150 },
                fadeOut: true
            });
            
            // Add a gravity source at the center for dramatic effect
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            window.cosmicTransitions.addGravitySource(centerX, centerY, -0.5);
        }
        
        document.getElementById('gameOver').classList.remove('d-none');
        document.getElementById('finalScore').textContent = this.score.toLocaleString();

        // Save high score if it's higher than the current one
        const highScore = localStorage.getItem('highScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('highScore', this.score);
            document.getElementById('newHighScore').classList.remove('d-none');
            
            // Add celebratory cosmic effect for new high score
            if (window.cosmicTransitions) {
                const highScoreEl = document.getElementById('newHighScore');
                if (highScoreEl) {
                    window.cosmicTransitions.createParticleBurst(
                        window.innerWidth / 2,
                        window.innerHeight / 2,
                        {
                            count: 100,
                            colors: window.cosmicTransitions.colorPalettes.victory,
                            speed: { min: 50, max: 200 },
                            size: { min: 3, max: 8 },
                            shapes: ['circle', 'star'],
                            lifespan: 3000,
                            gravity: 0.05,
                            spread: 360,
                            glow: true
                        }
                    );
                    
                    // Add pulsing effect to the high score message
                    window.cosmicTransitions.createPulseEffect(highScoreEl, {
                        count: 3,
                        interval: 800,
                        radius: 150,
                        color: '#ffdd00',
                        duration: 1200
                    });
                }
            }
        }
        
        // Show high score on the game over screen
        const currentHighScore = localStorage.getItem('highScore') || 0;
        const highScoreElement = document.getElementById('highScoreValue');
        if (highScoreElement) {
            highScoreElement.textContent = parseInt(currentHighScore).toLocaleString();
            document.getElementById('highScoreContainer').classList.remove('d-none');
        }
        
        // Show survival time
        const survivalTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(survivalTime / 60);
        const seconds = survivalTime % 60;
        const survivalTimeElement = document.getElementById('survivalTime');
        if (survivalTimeElement) {
            survivalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('survivalTimeContainer').classList.remove('d-none');
        }
        
        // Clean up event listeners to prevent memory leaks
        this.cleanupEventListeners();
    }



    updatePortal() {
        try {
            // Remove inactive portal
            if (this.portal && !this.portal.isActive()) {
                this.portal = null;
            }

            // Spawn new portal with 0.1% chance if none exists
            if (!this.portal && Math.random() < 0.001) {
                this.portal = new Portal(this.canvas);
            }

            // Handle portal interactions
            if (this.portal && this.portal.isActive()) {
                // Handle player healing
                this.portal.handlePlayer(this.player);

                // Handle enemies
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    if (this.portal.handleEnemy(enemy)) {
                        this.enemies.splice(i, 1);
                        this.killStreak++;
                        this.addScore(this.basePoints / 2);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating portal:', error);
        }
    }

    updateIceZone() {
        // Remove inactive ice zone
        if (this.iceZone && !this.iceZone.isActive()) {
            this.iceZone = null;
        }

        // Spawn new ice zone periodically
        if (!this.iceZone && Date.now() - this.lastIceZoneTime >= this.iceZoneInterval) {
            this.iceZone = new IceZone(this.canvas);
            this.lastIceZoneTime = Date.now();
        }

        // Apply ice physics if necessary
        if (this.iceZone && this.iceZone.isActive()) {
            // Check if player is in portal safe zone
            this.player.inPortalSafeZone = this.portal &&
                                                                 this.portal.isActive() &&
                                                                 this.portal.containsPoint(this.player.x, this.player.y);

            // Apply ice physics to player if in ice zone
            if (this.iceZone.containsPoint(this.player.x, this.player.y)) {
                this.iceZone.applySlipperyPhysics(this.player, this.keys);
            }

            // Apply ice physics to enemies in the zone
            this.enemies.forEach(enemy => {
                if (this.iceZone.containsPoint(enemy.x, enemy.y)) {
                    this.iceZone.applySlipperyPhysics(enemy);
                }
            });
        }
    }

    // This function has been modified to be internal only since star map navigation is disabled
    changeDimension(newDimension) {
        try {
            // Only allow dimension changes from the game itself, not from star map navigation
            if (this.dimensions[newDimension]) {
                this.currentDimension = newDimension;

                // Clear existing enemies when changing dimensions
                this.enemies = [];

                // Create a new portal in the new dimension
                setTimeout(() => {
                    this.portal = new Portal(this.canvas, this.currentDimension);
                }, 2000); // Wait 2 seconds before creating new portal

                // Update music intensity based on the new dimension
                if (this.soundManager) {
                    this.soundManager.setMusicIntensity(0.3); // Reset intensity for new dimension
                }
                
                // Show a floating notification about dimension change
                this.showFloatingScore("Dimension changed!", "bonus");
            }
        } catch (error) {
            console.error('Error changing dimension:', error);
        }
    }

    updateAutoFeatureDisplay() {
        document.getElementById('autoSpin').textContent = this.player.autoSpin ? 'ON' : 'OFF';
        document.getElementById('autoShoot').textContent = this.player.autoShoot ? 'ON' : 'OFF';
    }
    
    createBackgroundParticles() {
        try {
            // Get the game container
            const gameContainer = document.querySelector('.game-container');
            if (!gameContainer) return;
            
            // Clear existing particles
            const existingParticles = document.querySelectorAll('.cosmic-particle');
            existingParticles.forEach(p => p.remove());
            
            // Use a more optimized approach for particle count
            // Reduced density to improve performance
            // Further reduce for performance mode
            const baseCount = this.performanceMode ? 15 : 50;
            const densityFactor = this.performanceMode ? 40000 : 20000;
            const particleCount = Math.min(Math.floor(window.innerWidth * window.innerHeight / densityFactor), baseCount);
            
            // Create a document fragment to batch DOM operations
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                
                // Determine size class
                const sizeRandom = Math.random();
                let sizeClass;
                if (sizeRandom < 0.6) {
                    sizeClass = 'small';
                } else if (sizeRandom < 0.9) {
                    sizeClass = 'medium';
                } else {
                    sizeClass = 'large';
                }
                
                // Apply styles
                particle.className = `cosmic-particle ${sizeClass}`;
                
                // Random position
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                
                // Random animation duration and delay
                // Use shorter duration for better performance
                const duration = 15 + Math.random() * 20;
                const delay = Math.random() * 10;
                
                // Random color variation
                const hue = 190 + Math.random() * 40; // Blue to aqua range
                const lightness = 70 + Math.random() * 20; // Bright but varied
                
                // Optimize by reducing box-shadow blur radius
                particle.style.cssText = `
                    left: ${x}vw;
                    top: ${y}vh;
                    opacity: ${0.2 + Math.random() * 0.4};
                    animation-duration: ${duration}s;
                    animation-delay: -${delay}s;
                    box-shadow: 0 0 ${2 + Math.random() * 3}px hsl(${hue}, 80%, ${lightness}%);
                    will-change: transform;
                `;
                
                fragment.appendChild(particle);
            }
            
            // Add all particles at once using the fragment
            gameContainer.appendChild(fragment);
        } catch (error) {
            console.error('Error creating background particles:', error);
        }
    }
    
    checkTierUpgrade() {
        const currentTier = Math.floor(this.score / 10000) + 1;
        if (currentTier > this.lastTierUpgrade && this.score < this.maxScore) {
            this.lastTierUpgrade = currentTier;
            this.showTierUpgradeModal();
        }
    }

    showTierUpgradeModal() {
        try {
            // Pause the game
            this.paused = true;
            
            // Use document fragment for better performance
            const fragment = document.createDocumentFragment();
            
            const modal = document.createElement('div');
            modal.className = 'ship-selection-modal';
            modal.id = 'tierUpgradeModal';
            modal.style.display = 'block';
    
            const content = document.createElement('div');
            content.className = 'ship-selection-content';
            content.innerHTML = `
                <div class="pause-overlay mb-4">GAME PAUSED</div>
                <h2>Tier ${this.lastTierUpgrade} Upgrade Available!</h2>
                <p>Choose your upgrade path:</p>
                <div class="ship-preview-container" id="upgradeOptions">
                </div>
                <div class="modal-controls mt-3">
                    <button id="closeUpgradeModal" class="btn btn-danger">Skip Upgrade (ESC)</button>
                </div>
            `;
    
            modal.appendChild(content);
            fragment.appendChild(modal);

            // Function to close modal and resume game
            const closeModalAndResume = () => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                this.paused = false;
                
                // Remove the keydown event for escape 
                document.removeEventListener('keydown', escapeKeyHandler);
                
                console.log("Tier upgrade modal closed, game resumed");
            };
            
            // Escape key handler
            const escapeKeyHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModalAndResume();
                }
            };
            
            // Add escape key handler
            document.addEventListener('keydown', escapeKeyHandler);
            
            // Add click handler to close button
            setTimeout(() => {
                const closeButton = document.getElementById('closeUpgradeModal');
                if (closeButton) {
                    closeButton.addEventListener('click', closeModalAndResume);
                }
            }, 0);
    
            // Precompute the upgrade paths to avoid doing it during rendering
            const upgradeOptions = content.querySelector('#upgradeOptions');
            const currentType = this.player.shipType.type;
            let upgradePaths = [];
    
            // Calculate upgrade paths in a more optimized way
            if (currentType.includes('-')) {
                // For tier 2 ships, show tier 3 upgrades
                const baseType = currentType.split('-')[0];
                
                // Use a more direct approach to find paths
                const allPaths = ShipType.getUpgradePaths();
                for (const [type, paths] of Object.entries(allPaths)) {
                    if (type.startsWith(baseType) && type !== currentType) {
                        upgradePaths = upgradePaths.concat(paths);
                    }
                }
            } else {
                // For base ships, show tier 2 upgrades
                upgradePaths = ShipType.getUpgradePaths()[currentType] || [];
            }
    
            // Optimized rendering of ship options
            const optionsFragment = document.createDocumentFragment();
            
            upgradePaths.forEach(upgradePath => {
                const previewShip = new ShipType(upgradePath, this.lastTierUpgrade);
                const preview = document.createElement('div');
                preview.className = 'ship-preview';
                
                // Prepare stats HTML separately
                const statsHtml = `
                    <div>Damage: ${previewShip.damage.toFixed(1)}</div>
                    <div>Fire Rate: ${(1000/previewShip.shootDelay).toFixed(1)}/s</div>
                    <div>Projectile Speed: ${previewShip.projectileSpeed}</div>
                `;
                
                preview.innerHTML = `
                    <h3>${previewShip.name}</h3>
                    <canvas class="preview-canvas" width="150" height="150"></canvas>
                    <div class="ship-stats">${statsHtml}</div>
                `;
    
                // Optimize canvas drawing by using requestAnimationFrame
                const canvas = preview.querySelector('canvas');
                
                // Delay canvas drawing until after DOM is updated
                requestAnimationFrame(() => {
                    const ctx = canvas.getContext('2d');
                    ctx.translate(75, 75);
                    previewShip.draw(ctx, 0, 0, 0);
                });
    
                // Optimize event listener with arrow function
                preview.addEventListener('click', () => {
                    // Play upgrade sound first before modal removal
                    this.soundManager.playUpgradeSound(upgradePath);
                    
                    // Performance optimization: Hide modal before removing from DOM
                    modal.style.opacity = 0;
                    modal.style.pointerEvents = 'none';
                    
                    // Remove the keydown event for escape 
                    document.removeEventListener('keydown', escapeKeyHandler);
                    
                    // Batch changes for better performance
                    requestAnimationFrame(() => {
                        // Change ship type
                        this.player.changeShipType(upgradePath);
                        
                        // Remove modal after slight delay to allow for cleanup
                        setTimeout(() => {
                            if (modal.parentNode) {
                                modal.parentNode.removeChild(modal);
                            }
                            // Resume the game
                            this.paused = false;
                            
                            console.log("Ship upgraded, game resumed");
                            
                            // Show achievement message if applicable
                            if (this.score >= this.maxScore) {
                                this.showMaxScoreMessage();
                            }
                        }, 50);
                    });
                });
    
                optionsFragment.appendChild(preview);
            });
            
            upgradeOptions.appendChild(optionsFragment);
            
            // Play tier up sound after everything else is ready
            this.soundManager.playTierUpSound();
            
            // Append to body last for better performance
            document.body.appendChild(fragment);
            
            console.log("Tier upgrade modal displayed");
        } catch (error) {
            console.error("Error showing tier upgrade modal:", error);
            // In case of error, make sure the game isn't stuck in paused state
            this.paused = false;
        }
    }

    showMaxScoreMessage() {
        const message = document.createElement('div');
        message.className = 'alert alert-success position-absolute top-50 start-50 translate-middle';
        message.style.zIndex = '1000';
        message.innerHTML = `
            <h4>Congratulations!</h4>
            <p>You've reached the maximum score of ${this.maxScore.toLocaleString()} points!</p>
            <p>Your ship has been fully upgraded to its maximum potential.</p>
        `;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 5000);
    }
    
    /**
     * Spawns a random power-up within the game area
     */
    spawnRandomPowerUp() {
        try {
            // Don't spawn power-ups when game is paused, over, during events, or in performance mode with lots of enemies
            if (this.gameOver || this.paused || this.radiantEventActive || this.lunarEventActive) {
                return;
            }
            
            // Reduced power-up spawns in performance mode if many entities exist
            if (this.performanceMode && (this.enemies.length > 15 || this.projectiles.length > 20)) {
                return;
            }
            
            // Define available power-up types
            const powerUpTypes = ['shield', 'multishot', 'speedboost', 'rapidfire', 'points'];
            
            // Select a random position within the visible game area
            // Keep away from edges
            const margin = 100;
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            // Select a random power-up type
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            // Create the power-up
            const powerUp = new PowerUp(x, y, type);
            this.powerUps.push(powerUp);
            
            console.log(`Spawned ${type} power-up at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        } catch (error) {
            console.error('Error spawning power-up:', error);
        }
    }
    
    /**
     * Spawns a power-up at an enemy's death location with a certain probability
     * @param {Enemy} enemy - The defeated enemy
     */
    maybeSpawnPowerUpOnEnemyDeath(enemy) {
        try {
            // Don't spawn power-ups during events or when game is over
            if (!enemy || this.gameOver || this.radiantEventActive || this.lunarEventActive) return;
            
            // Increase chances for durable enemies
            const baseProbability = enemy.isDurable ? this.powerUpChance * 1.5 : this.powerUpChance;
            
            // Adjust probability based on player performance
            // Fewer power-ups when player has high score/multiplier, more when struggling
            const scoreAdjustment = Math.min(this.score / 10000, 0.1);
            const multiplierAdjustment = Math.min((this.multiplier - 1) * 0.05, 0.1);
            
            // Lower probability for high-performing players, higher for struggling players
            const adjustedProbability = baseProbability - scoreAdjustment - multiplierAdjustment;
            
            // Random chance to spawn power-up
            if (Math.random() < adjustedProbability) {
                // Define power-up types with weights
                const powerUpOptions = [
                    { type: 'shield', weight: 1 },
                    { type: 'damage', weight: 1.2 }, // Replaced multishot with damage
                    { type: 'speedboost', weight: 1.5 },
                    { type: 'rapidfire', weight: 1.2 },
                    { type: 'points', weight: 2 }
                ];
                
                // Calculate total weight
                const totalWeight = powerUpOptions.reduce((sum, option) => sum + option.weight, 0);
                
                // Random selection based on weights
                let randomValue = Math.random() * totalWeight;
                let selectedType = powerUpOptions[0].type;
                
                for (const option of powerUpOptions) {
                    randomValue -= option.weight;
                    if (randomValue <= 0) {
                        selectedType = option.type;
                        break;
                    }
                }
                
                // Create the power-up at the enemy's position
                const powerUp = new PowerUp(enemy.x, enemy.y, selectedType);
                this.powerUps.push(powerUp);
                
                console.log(`Spawned ${selectedType} power-up from enemy at (${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)})`);
            }
        } catch (error) {
            console.error('Error spawning power-up from enemy:', error);
        }
    }
}

function restartGame() {
    // Hide all game over elements
    document.getElementById('gameOver').classList.add('d-none');
    document.getElementById('newHighScore').classList.add('d-none');
    
    // Hide all the new game stats containers
    if (document.getElementById('highScoreContainer')) {
        document.getElementById('highScoreContainer').classList.add('d-none');
    }
    if (document.getElementById('survivalTimeContainer')) {
        document.getElementById('survivalTimeContainer').classList.add('d-none');
    }
    
    // Clean up existing game instance
    if (window.game) {
        try {
            console.log('Cleaning up game for restart...');
            
            // Make sure the game is not paused
            window.game.paused = false;
            
            // Make sure to clean up event listeners
            window.game.cleanupEventListeners();
            
            // Remove all DOM elements created by the game
            const gameElements = document.querySelectorAll('.floating-score, .cosmic-particle, .ship-selection-modal, #tierUpgradeModal');
            gameElements.forEach(el => {
                try {
                    el.remove();
                } catch (e) {
                    console.warn('Error removing element:', e);
                }
            });
            
            // Remove any global event listeners added for modals
            document.removeEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('tierUpgradeModal');
                    if (modal) modal.remove();
                }
            });
            
            // Reset state in the multiplayer manager if it exists
            if (window.game.multiplayerManager) {
                // Send disconnect message or similar if needed
            }
            
            console.log('Game cleanup complete');
        } catch (error) {
            console.error('Error cleaning up game:', error);
        }
    }
    
    // Use the cosmic loading screen if it exists
    if (window.cosmicLoader) {
        window.cosmicLoader.show(() => {
            // Create fresh game instance
            window.game = new Game();
            
            // Reset achievement session tracking
            if (window.game.achievementSystem) {
                window.game.achievementSystem.resetSessionAchievements();
            }
        });
        
        // Simulate loading process
        window.simulateGameLoading();
    } else {
        // Fallback if cosmic loader is not available
        window.game = new Game();
        
        // Reset achievement session tracking even in fallback path
        if (window.game.achievementSystem) {
            window.game.achievementSystem.resetSessionAchievements();
        }
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    try {
        window.game = new Game();
    } catch (error) {
        console.error('Failed to start game:', error);
        // Show error message to user
        const container = document.querySelector('.game-container');
        if (container) {
            container.innerHTML = `<div class="alert alert-danger">Failed to start game: ${error.message}</div>`;
        }
    }
});