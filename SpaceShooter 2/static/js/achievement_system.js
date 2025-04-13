/**
 * Achievement System
 * Tracks player accomplishments and rewards them with notifications and unlockables
 * Version 1.1.0 - Enhanced with dynamic particle effects
 */
class AchievementSystem {
    constructor(game) {
        this.game = game;
        
        // Achievement definitions with their unlock conditions
        this.achievements = {
            firstKill: {
                id: 'firstKill',
                name: 'First Contact',
                description: 'Destroy your first enemy',
                icon: '🔥',
                progress: 0,
                target: 1,
                unlocked: false
            },
            sharpshooter: {
                id: 'sharpshooter',
                name: 'Sharpshooter',
                description: 'Achieve 80% accuracy with at least 20 shots fired',
                icon: '🎯',
                progress: 0,
                target: 0.8,
                unlocked: false,
                // This will be calculated as hits/total shots
                progressType: 'ratio'
            },
            destroyer: {
                id: 'destroyer',
                name: 'Destroyer',
                description: 'Destroy 50 enemy ships',
                icon: '💥',
                progress: 0,
                target: 50,
                unlocked: false
            },
            tankBuster: {
                id: 'tankBuster',
                name: 'Tank Buster',
                description: 'Destroy 10 durable enemy ships',
                icon: '🛡️',
                progress: 0,
                target: 10,
                unlocked: false
            },
            survivor: {
                id: 'survivor',
                name: 'Survivor',
                description: 'Survive for 5 minutes',
                icon: '⏱️',
                progress: 0,
                target: 300, // in seconds
                unlocked: false
            },
            highScore: {
                id: 'highScore',
                name: 'High Roller',
                description: 'Score 10,000 points in a single game',
                icon: '🏆',
                progress: 0,
                target: 10000,
                unlocked: false
            },
            dimensionTraveler: {
                id: 'dimensionTraveler',
                name: 'Dimension Traveler',
                description: 'Use a portal to travel to another dimension',
                icon: '🌀',
                progress: 0,
                target: 1,
                unlocked: false
            },
            upgrader: {
                id: 'upgrader',
                name: 'Ship Engineer',
                description: 'Upgrade your ship 3 times in a single game',
                icon: '🔧',
                progress: 0,
                target: 3,
                unlocked: false
            },
            killChain: {
                id: 'killChain',
                name: 'Chain Reaction',
                description: 'Destroy 5 enemies within 3 seconds',
                icon: '⚡',
                progress: 0,
                target: 5,
                unlocked: false
            },
            multiplierMaster: {
                id: 'multiplierMaster',
                name: 'Multiplier Master',
                description: 'Reach a 5x score multiplier',
                icon: '✖️',
                progress: 0,
                target: 5,
                unlocked: false
            },
            radiantTrigger: {
                id: 'radiantTrigger',
                name: 'Radiant???',
                description: 'Trigger the mysterious Radiant event',
                icon: '✨',
                progress: 0,
                target: 1,
                unlocked: false
            },
            highlyRadiant: {
                id: 'highlyRadiant',
                name: 'Highly Radiant',
                description: 'Successfully complete a Radiant event',
                icon: '🌟',
                progress: 0,
                target: 1,
                unlocked: false
            },
            lunarSurvivor: {
                id: 'lunarSurvivor',
                name: 'Lunar Survivor',
                description: 'Experience the mysterious Lunar event',
                icon: '🌙',
                progress: 0,
                target: 1,
                unlocked: false
            },
            highlyLunar: {
                id: 'highlyLunar',
                name: 'Highly Lunar',
                description: 'Successfully complete a Lunar event',
                icon: '🌕',
                progress: 0,
                target: 1,
                unlocked: false
            }
        };
        
        // Session tracking
        this.sessionStats = {
            shotsFired: 0,
            shotsHit: 0,
            killStreak: 0,
            killStreakTimestamp: 0,
            killChainCount: 0,
            startTime: Date.now()
        };
        
        // Load any previously unlocked achievements
        this.loadAchievements();
        
        // Create the achievement UI
        this.createAchievementUI();
    }
    
    /**
     * Load saved achievements from local storage
     */
    loadAchievements() {
        const savedAchievements = localStorage.getItem('spaceShooterAchievements');
        if (savedAchievements) {
            try {
                const parsed = JSON.parse(savedAchievements);
                
                // Apply saved progress and unlock status to each achievement
                Object.keys(parsed).forEach(id => {
                    if (this.achievements[id]) {
                        this.achievements[id].progress = parsed[id].progress;
                        this.achievements[id].unlocked = parsed[id].unlocked;
                    }
                });
            } catch (e) {
                console.error('Error loading achievements:', e);
            }
        }
    }
    
    /**
     * Save achievements to local storage
     */
    saveAchievements() {
        const achievementsToSave = {};
        
        // Create a simplified object with just the necessary properties
        Object.keys(this.achievements).forEach(id => {
            achievementsToSave[id] = {
                progress: this.achievements[id].progress,
                unlocked: this.achievements[id].unlocked
            };
        });
        
        localStorage.setItem('spaceShooterAchievements', JSON.stringify(achievementsToSave));
    }
    
    /**
     * Create the achievement UI elements
     */
    createAchievementUI() {
        this.achievementContainer = document.querySelector('.achievement-container');
        this.notificationsContainer = document.querySelector('.achievement-notifications');
        
        // Generate achievement items
        this.updateAchievementUI();
    }
    
    /**
     * Toggle the achievement screen visibility
     */
    toggleAchievementScreen() {
        const achievementScreen = document.querySelector('.achievement-screen');
        
        // Toggle the display
        if (achievementScreen.style.display === 'none' || !achievementScreen.style.display) {
            achievementScreen.style.display = 'flex';
            // Update the UI in case any achievements were unlocked
            this.updateAchievementUI();
        } else {
            achievementScreen.style.display = 'none';
        }
    }
    
    /**
     * Update the achievement UI with the latest progress
     */
    updateAchievementUI() {
        if (!this.achievementContainer) return;
        
        // Clear the container and any existing showcase particles
        this.achievementContainer.innerHTML = '';
        if (window.achievementParticles) {
            window.achievementParticles.showcaseParticles = [];
        }
        
        // Sorted achievements - unlocked first, then by progress percentage
        const sortedAchievements = Object.values(this.achievements).sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            
            // For unlocked achievements, sort by ID
            if (a.unlocked && b.unlocked) return a.id.localeCompare(b.id);
            
            // For locked achievements, sort by progress percentage
            const aProgress = a.progressType === 'ratio' ? 
                (a.progress >= 20 ? a.progress : 0) : // Only count ratio if there are enough samples
                (a.progress / a.target);
            
            const bProgress = b.progressType === 'ratio' ?
                (b.progress >= 20 ? b.progress : 0) :
                (b.progress / b.target);
                
            return bProgress - aProgress;
        });
        
        // Create elements for each achievement
        const updatePromises = sortedAchievements.map(achievement => {
            return new Promise(resolve => {
                const achievementItem = document.createElement('div');
                achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
                achievementItem.dataset.id = achievement.id;
                
                // Calculate progress percentage
                let progressPercent = 0;
                let progressText = '';
                
                if (achievement.progressType === 'ratio') {
                    // For ratio achievements (like accuracy)
                    const hits = this.sessionStats.shotsHit;
                    const total = this.sessionStats.shotsFired;
                    
                    if (total >= 20) {
                        // Only show accurate percentage if enough shots fired
                        progressPercent = Math.min(100, (hits / total) * 100);
                        progressText = `${Math.round(progressPercent)}% (${hits}/${total})`;
                    } else {
                        progressText = `${hits}/${total} shots (need 20+)`;
                        progressPercent = (total / 20) * 100; // Show progress toward 20 shots
                    }
                } else {
                    // For regular counting achievements
                    progressPercent = Math.min(100, (achievement.progress / achievement.target) * 100);
                    progressText = `${achievement.progress}/${achievement.target}`;
                }
                
                // For unlocked achievements, always show 100%
                if (achievement.unlocked) {
                    progressPercent = 100;
                    progressText = 'Completed!';
                }
                
                // Create achievement details structure
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'achievement-details';
                detailsDiv.innerHTML = `
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${progressText}</div>
                    </div>
                `;
                
                // Create icon container
                const iconDiv = document.createElement('div');
                iconDiv.className = 'achievement-icon';
                
                // Append the structure
                achievementItem.appendChild(iconDiv);
                achievementItem.appendChild(detailsDiv);
                
                // Add the achievement item to the container
                this.achievementContainer.appendChild(achievementItem);
                
                // Add animated badge using our badge system
                if (window.achievementBadges) {
                    window.achievementBadges.createBadgeElement(achievement.id, iconDiv, achievement.unlocked)
                        .then(badgeElement => {
                            if (badgeElement) {
                                badgeElement.id = `badge-${achievement.id}`;
                                window.achievementBadges.addHoverEffects(badgeElement);
                                
                                // Add showcase particles for unlocked achievements
                                if (achievement.unlocked && window.achievementParticles) {
                                    setTimeout(() => {
                                        const rect = achievementItem.getBoundingClientRect();
                                        window.achievementParticles.createShowcaseEffect(rect, true);
                                    }, 100 + Math.random() * 200);
                                }
                            } else {
                                // Fallback to emoji if badge loading failed
                                iconDiv.innerHTML = achievement.icon;
                            }
                            resolve();
                        });
                } else {
                    // Fallback to emoji if badge system is not available
                    iconDiv.innerHTML = achievement.icon;
                    resolve();
                }
            });
        });
        
        // After all achievements are rendered, add interactions
        Promise.all(updatePromises).then(() => {
            this.addAchievementInteractions();
        });
    }
    
    /**
     * Add mouse interaction effects for achievements
     */
    addAchievementInteractions() {
        const achievementItems = document.querySelectorAll('.achievement-item');
        
        achievementItems.forEach(item => {
            // Mouse enter - add more particles
            item.addEventListener('mouseenter', () => {
                if (item.classList.contains('unlocked') && window.achievementParticles) {
                    const rect = item.getBoundingClientRect();
                    window.achievementParticles.createNotificationEffect(rect, 'showcase');
                }
            });
            
            // Click - create a burst effect
            item.addEventListener('click', () => {
                if (window.achievementParticles) {
                    const rect = item.getBoundingClientRect();
                    const effectType = item.classList.contains('unlocked') ? 'unlock' : 'progress';
                    window.achievementParticles.createNotificationEffect(rect, effectType);
                }
            });
        });
    }
    
    /**
     * Check for achievements that have been met
     */
    checkAchievements() {
        // Update time-based achievements
        const elapsedSeconds = (Date.now() - this.sessionStats.startTime) / 1000;
        this.updateAchievementProgress('survivor', elapsedSeconds);
        
        // Check kill chain expiration
        if (this.sessionStats.killChainCount > 0) {
            const chainElapsed = Date.now() - this.sessionStats.killStreakTimestamp;
            if (chainElapsed > 3000) { // Reset after 3 seconds
                this.sessionStats.killChainCount = 0;
            }
        }
        
        // Check sharpshooter achievement
        if (this.sessionStats.shotsFired >= 20) {
            const accuracy = this.sessionStats.shotsHit / this.sessionStats.shotsFired;
            this.updateAchievementProgress('sharpshooter', accuracy);
        }
    }
    
    /**
     * Update achievement progress and unlock if target reached
     * @param {string} id - Achievement ID
     * @param {number} value - Current progress value
     */
    updateAchievementProgress(id, value) {
        if (!this.achievements[id] || this.achievements[id].unlocked) return;
        
        const achievement = this.achievements[id];
        
        // Update progress
        if (achievement.progressType === 'ratio') {
            // For ratio achievements, store the actual ratio
            achievement.progress = value;
        } else {
            // For counting achievements, take the max value
            achievement.progress = Math.max(achievement.progress, value);
        }
        
        // Check if achievement should be unlocked
        let shouldUnlock = false;
        
        if (achievement.progressType === 'ratio') {
            // For ratio achievements (like accuracy), we need the minimum shots and the target ratio
            shouldUnlock = this.sessionStats.shotsFired >= 20 && value >= achievement.target;
        } else {
            // For regular achievements, just compare progress to target
            shouldUnlock = achievement.progress >= achievement.target;
        }
        
        if (shouldUnlock) {
            this.unlockAchievement(id);
        }
        
        // Save achievement progress
        this.saveAchievements();
    }
    
    /**
     * Record projectile hit for accuracy tracking
     */
    recordProjectileHit() {
        this.sessionStats.shotsHit++;
        
        // Check first kill achievement
        if (this.sessionStats.shotsHit === 1) {
            this.updateAchievementProgress('firstKill', 1);
        }
    }
    
    /**
     * Record projectile miss for accuracy tracking
     */
    recordProjectileMiss() {
        // Nothing to do here, just keeping the function for symmetry
    }
    
    /**
     * Record enemy kill
     * @param {boolean} isDurable - Whether the enemy killed was a durable enemy
     */
    recordEnemyKill(isDurable) {
        // Increment total kills
        const totalKills = this.achievements.destroyer.progress + 1;
        this.updateAchievementProgress('destroyer', totalKills);
        
        // Increment durable kills if applicable
        if (isDurable) {
            const durableKills = this.achievements.tankBuster.progress + 1;
            this.updateAchievementProgress('tankBuster', durableKills);
        }
        
        // Update kill chain tracking
        const now = Date.now();
        const timeSinceLastKill = now - this.sessionStats.killStreakTimestamp;
        
        if (timeSinceLastKill <= 3000) { // Within 3 seconds
            this.sessionStats.killChainCount++;
            this.recordKillStreak(this.sessionStats.killChainCount);
        } else {
            this.sessionStats.killChainCount = 1;
        }
        
        this.sessionStats.killStreakTimestamp = now;
    }
    
    /**
     * Record kill streak for achievement tracking
     * @param {number} streak - Current kill streak
     */
    recordKillStreak(streak) {
        this.updateAchievementProgress('killChain', streak);
    }
    
    /**
     * Record portal use
     */
    recordPortalUse() {
        this.updateAchievementProgress('dimensionTraveler', 1);
    }
    
    /**
     * Record score update
     * @param {number} points - Points that were just added
     */
    updateScore(points) {
        // Update high score achievement
        this.updateAchievementProgress('highScore', this.game.score);
        
        // Update multiplier achievement
        this.updateAchievementProgress('multiplierMaster', this.game.multiplier);
    }
    
    /**
     * Record ship upgrade
     */
    recordShipUpgrade() {
        const currentUpgrades = this.achievements.upgrader.progress + 1;
        this.updateAchievementProgress('upgrader', currentUpgrades);
    }
    
    /**
     * Unlock an achievement
     * @param {string} id - Achievement ID
     */
    unlockAchievement(id) {
        if (!this.achievements[id] || this.achievements[id].unlocked) return;
        
        // Mark as unlocked
        this.achievements[id].unlocked = true;
        
        // Save achievement progress
        this.saveAchievements();
        
        // Show notification with particle effects
        this.showAchievementNotification(this.achievements[id]);
        
        // Create victory effect if all achievements are unlocked
        this.checkAllAchievementsUnlocked();
        
        // Update UI if achievement screen is open
        if (document.querySelector('.achievement-screen').style.display === 'flex') {
            this.updateAchievementUI();
            
            // Add showcase particles to newly unlocked achievement
            setTimeout(() => {
                this.addShowcaseParticles(id);
            }, 100);
        }
        
        console.log(`Achievement unlocked: ${this.achievements[id].name}`);
    }
    
    /**
     * Check if all achievements are unlocked and trigger victory effect
     */
    checkAllAchievementsUnlocked() {
        const allUnlocked = Object.values(this.achievements).every(achievement => achievement.unlocked);
        if (allUnlocked && window.achievementParticles) {
            window.achievementParticles.createVictoryEffect();
        }
    }
    
    /**
     * Add showcase particles to an achievement
     * @param {string} id - Achievement ID
     */
    addShowcaseParticles(id) {
        if (!window.achievementParticles) return;
        
        // Find the achievement element in the DOM
        const achievementElement = Array.from(document.querySelectorAll('.achievement-item'))
            .find(el => el.querySelector('.achievement-name').textContent === this.achievements[id].name);
            
        if (achievementElement) {
            const rect = achievementElement.getBoundingClientRect();
            window.achievementParticles.createShowcaseEffect(rect, true);
        }
    }
    
    /**
     * Show achievement notification
     * @param {Object} achievement - Achievement object
     */
    showAchievementNotification(achievement) {
        if (!this.notificationsContainer) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        // Create the icon container for the badge
        const iconContainer = document.createElement('div');
        iconContainer.className = 'achievement-notification-icon';
        
        // Create the content section
        const contentDiv = document.createElement('div');
        contentDiv.className = 'achievement-notification-content';
        contentDiv.innerHTML = `
            <div class="achievement-notification-title">Achievement Unlocked!</div>
            <div class="achievement-notification-name">${achievement.name}</div>
            <div class="achievement-notification-description">${achievement.description}</div>
        `;
        
        // Add components to notification
        notification.appendChild(iconContainer);
        notification.appendChild(contentDiv);
        
        // Add to DOM
        this.notificationsContainer.appendChild(notification);
        
        // Try to add an animated badge
        if (window.achievementBadges) {
            window.achievementBadges.createBadgeElement(achievement.id, iconContainer, true)
                .then(badgeElement => {
                    if (!badgeElement) {
                        // Fallback to emoji if badge creation failed
                        iconContainer.innerHTML = achievement.icon;
                    } else {
                        // Add special animation for the unlocked badge
                        setTimeout(() => {
                            window.achievementBadges.animateUnlock(badgeElement);
                        }, 200);
                    }
                });
        } else {
            // Fallback to emoji if badge system is not available
            iconContainer.innerHTML = achievement.icon;
        }
        
        // Trigger animation after a small delay (for browser to process the DOM change)
        setTimeout(() => {
            notification.classList.add('show');
            
            // Create particle effects for the notification
            if (window.achievementParticles) {
                const rect = notification.getBoundingClientRect();
                window.achievementParticles.createNotificationEffect(rect, 'unlock');
            }
        }, 10);
        
        // Create another burst of particles after a delay
        setTimeout(() => {
            if (window.achievementParticles) {
                const rect = notification.getBoundingClientRect();
                window.achievementParticles.createNotificationEffect(rect, 'showcase');
            }
        }, 1500);
        
        // Remove after display
        setTimeout(() => {
            // One final particle burst before hiding
            if (window.achievementParticles && notification.classList.contains('show')) {
                const rect = notification.getBoundingClientRect();
                window.achievementParticles.createNotificationEffect(rect, 'progress');
            }
            
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500); // Wait for fade out animation
        }, 5000); // Show for 5 seconds
    }
    
    /**
     * Reset session achievements
     * This should be called when starting a new game session
     */
    resetSessionAchievements() {
        // Reset session stats
        this.sessionStats = {
            shotsFired: 0,
            shotsHit: 0,
            killStreak: 0,
            killStreakTimestamp: 0,
            killChainCount: 0,
            startTime: Date.now()
        };
    }
}