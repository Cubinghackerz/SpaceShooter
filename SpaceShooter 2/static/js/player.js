class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 3.25;
        this.rotation = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.maxHealth = 1;
        this.currentHealth = this.maxHealth;
        this.regenRate = 0;
        this.lastRegenTime = Date.now();

        // Ship type management
        this.shipType = new ShipType('default');
        this.lastShootTime = 0;

        // Shimmer effect properties
        this.shimmerActive = false;
        this.shimmerStartTime = 0;
        this.shimmerDuration = 1000;
        this.shimmerColors = ['#00ff00', '#66ff66', '#99ff99', '#66ff66'];

        // Auto features
        this.autoSpin = false;
        this.autoShoot = false;
        this.spinSpeed = 0.1;

        // Safety bounds
        this.minX = -100;
        this.minY = -100;
        this.maxX = window.innerWidth + 100;
        this.maxY = window.innerHeight + 100;
        
        // Power-up effects
        this.powerUps = {
            shield: {
                active: false,
                endTime: 0,
                strength: 1
            },
            damage: { // Replaces multishot power-up
                active: false,
                endTime: 0,
                multiplier: 1.5 // Damage boost multiplier
            },
            speedboost: {
                active: false,
                endTime: 0,
                multiplier: 1.5
            },
            rapidfire: {
                active: false,
                endTime: 0,
                cooldownReduction: 0.5
            }
        };
    }

    changeShipType(type) {
        try {
            this.shipType = new ShipType(type);
            this.startShimmer();
            window.game.hasSelectedShip = true;

            // Update ship selection buttons visibility
            const shipSelector = document.querySelector('.ship-type-selector');
            if (shipSelector) {
                shipSelector.style.display = 'none';
            }
        } catch (error) {
            console.error('Error changing ship type:', error);
        }
    }

    startShimmer() {
        try {
            this.shimmerActive = true;
            this.shimmerStartTime = Date.now();
        } catch (error) {
            console.error('Error starting shimmer:', error);
        }
    }

    draw(ctx) {
        try {
            if (!ctx) return;
            
            // Performance optimization flag
            const isPerformanceModeActive = window.game && window.game.performanceMode;
            
            // Default effect intensity (can be adjusted for performance)
            this.effectsIntensity = isPerformanceModeActive ? 0.5 : 1.0;
            
            // Get theme color if cosmic theme selector is available
            let themeShieldColor = '#3498db'; // Default shield color
            let themePlayerColor = '#3498db'; // Default player color
            
            if (window.cosmicThemeSelector) {
                const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                if (currentTheme) {
                    themeShieldColor = currentTheme.primaryColor || themeShieldColor;
                    themePlayerColor = currentTheme.playerColor || themePlayerColor;
                    // Update ship color to match theme
                    this.color = themePlayerColor;
                }
            }
            
            // Convert hex color to rgba for shield effects
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            // Draw shield if active
            if (this.powerUps.shield.active && Date.now() < this.powerUps.shield.endTime) {
                // Shield glow effect
                const shieldRadius = this.size * 1.5;
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, this.size,
                    this.x, this.y, shieldRadius
                );
                
                // Use theme color for shield with alpha values
                gradient.addColorStop(0, hexToRgba(themeShieldColor, 0.1));
                gradient.addColorStop(0.7, hexToRgba(themeShieldColor, 0.4 * this.effectsIntensity));
                gradient.addColorStop(1, hexToRgba(themeShieldColor, 0));
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, shieldRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Shield border (skip in very high performance mode)
                if (this.effectsIntensity > 0.3) {
                    ctx.strokeStyle = themeShieldColor;
                    ctx.lineWidth = isPerformanceModeActive ? 1 : 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, shieldRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Pulsating inner shield
                const pulseSpeed = isPerformanceModeActive ? 300 : 200; // Slower pulse in performance mode
                const pulseAmount = 0.2 * Math.sin(Date.now() / pulseSpeed);
                const innerRadius = this.size * (1.2 + pulseAmount * this.effectsIntensity);
                
                ctx.strokeStyle = hexToRgba(themeShieldColor, 0.8 * this.effectsIntensity);
                ctx.lineWidth = isPerformanceModeActive ? 1 : 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, innerRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw ship using shipType
            this.shipType.draw(ctx, this.x, this.y, this.rotation);

            // Draw health bar above player if health > 1
            if (this.maxHealth > 1) {
                const healthBarWidth = 40;
                const healthBarHeight = 5;
                const healthPercentage = Math.max(0, Math.min(1, this.currentHealth / this.maxHealth));

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size - 10,
                           healthBarWidth, healthBarHeight);

                ctx.fillStyle = this.shipType.color;
                ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size - 10,
                           healthBarWidth * healthPercentage, healthBarHeight);
            }
            
            // Draw speedboost effect if active
            if (this.powerUps.speedboost.active && Date.now() < this.powerUps.speedboost.endTime) {
                // Get theme-appropriate color for speed boost
                let speedBoostColor = hexToRgba(themeShieldColor, 0.7);
                
                // Speed lines with reduced count in performance mode
                ctx.strokeStyle = speedBoostColor;
                ctx.lineWidth = isPerformanceModeActive ? 1 : 2;
                
                // Adjust trail count based on performance mode
                const trailCount = isPerformanceModeActive ? 2 : 4;
                const angleOffset = 0.3; // Spread of the trail
                const baseAngle = this.rotation + Math.PI; // Opposite of ship direction
                
                for (let i = 0; i < trailCount; i++) {
                    const trailAngle = baseAngle + (Math.random() * angleOffset * 2 - angleOffset);
                    const length = this.size * (1.5 + Math.random() * this.effectsIntensity);
                    const startX = this.x + Math.cos(trailAngle) * this.size * 0.7;
                    const startY = this.y + Math.sin(trailAngle) * this.size * 0.7;
                    const endX = startX + Math.cos(trailAngle) * length;
                    const endY = startY + Math.sin(trailAngle) * length;
                    
                    // Draw speed trail
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            
            // Draw damage boost indicator if active
            if (this.powerUps.damage.active && Date.now() < this.powerUps.damage.endTime) {
                // Get theme-appropriate color for damage boost
                let damageBoostColor = themePlayerColor;
                
                // Add red tint to the theme color for damage boost
                if (window.cosmicThemeSelector) {
                    // Try to get accent color which is often more vibrant
                    const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                    if (currentTheme && currentTheme.accentColor) {
                        damageBoostColor = currentTheme.accentColor;
                    }
                }
                
                // Weapon enhancement effect
                ctx.fillStyle = hexToRgba(damageBoostColor, 0.8 * this.effectsIntensity);
                
                // Enhanced weapon effect
                const weaponX = this.x + Math.cos(this.rotation) * this.size;
                const weaponY = this.y + Math.sin(this.rotation) * this.size;
                
                // Create pulsing effect (reduced in performance mode)
                const pulseSpeed = isPerformanceModeActive ? 200 : 150;
                const pulseSize = 3 + Math.sin(Date.now() / pulseSpeed) * 1.5 * this.effectsIntensity;
                
                // Draw main weapon enhancement
                ctx.beginPath();
                ctx.arc(weaponX, weaponY, pulseSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Skip power trail in extreme performance mode
                if (this.effectsIntensity > 0.3) {
                    // Draw power trail
                    ctx.strokeStyle = hexToRgba(damageBoostColor, 0.5 * this.effectsIntensity);
                    ctx.lineWidth = isPerformanceModeActive ? 1 : 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(weaponX, weaponY);
                    ctx.stroke();
                }
            }
            
            // Rapid fire visual effect
            if (this.powerUps.rapidfire.active && Date.now() < this.powerUps.rapidfire.endTime) {
                // Get theme-appropriate color for rapid fire
                let rapidFireColor = themeShieldColor;
                
                // Try to get secondary color for variety
                if (window.cosmicThemeSelector) {
                    const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                    if (currentTheme && currentTheme.secondaryColor) {
                        rapidFireColor = currentTheme.secondaryColor;
                    }
                }
                
                // Weapon glow
                const frontX = this.x + Math.cos(this.rotation) * this.size;
                const frontY = this.y + Math.sin(this.rotation) * this.size;
                
                // Adjust effect based on performance mode
                const pulseSpeed = isPerformanceModeActive ? 150 : 100;
                const glowRadius = (3 + Math.sin(Date.now() / pulseSpeed) * 2) * this.effectsIntensity;
                
                ctx.fillStyle = hexToRgba(rapidFireColor, 0.7 * this.effectsIntensity);
                ctx.beginPath();
                ctx.arc(frontX, frontY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        } catch (error) {
            console.error('Error drawing player:', error);
        }
    }

    takeDamage() {
        try {
            // Check for shield power-up
            if (this.powerUps.shield.active && Date.now() < this.powerUps.shield.endTime) {
                // Shield absorbs the damage
                return false;
            }
            
            // Take damage normally
            this.currentHealth = Math.max(0, this.currentHealth - 1);
            return this.currentHealth <= 0;
        } catch (error) {
            console.error('Error in takeDamage:', error);
            return true;
        }
    }

    heal() {
        try {
            this.currentHealth = this.maxHealth;
        } catch (error) {
            console.error('Error healing player:', error);
        }
    }

    updateRegeneration() {
        try {
            if (this.regenRate > 0 && this.currentHealth < this.maxHealth) {
                const now = Date.now();
                const deltaTime = (now - this.lastRegenTime) / 1000;
                const regenAmount = this.regenRate * deltaTime;

                this.currentHealth = Math.min(this.maxHealth, this.currentHealth + regenAmount);
                this.lastRegenTime = now;
            }
        } catch (error) {
            console.error('Error updating regeneration:', error);
        }
    }

    toggleAutoSpin() {
        this.autoSpin = !this.autoSpin;
    }

    toggleAutoShoot() {
        this.autoShoot = !this.autoShoot;
    }

    update(keys, mouseX, mouseY) {
        try {
            // Store previous position for bounds checking
            const prevX = this.x;
            const prevY = this.y;
            
            // Apply speed boost power-up if active
            let currentSpeed = this.speed;
            if (this.powerUps.speedboost.active && Date.now() < this.powerUps.speedboost.endTime) {
                currentSpeed *= this.powerUps.speedboost.multiplier;
            }

            if (keys.ArrowLeft || keys.a) this.x -= currentSpeed;
            if (keys.ArrowRight || keys.d) this.x += currentSpeed;
            if (keys.ArrowUp || keys.w) this.y -= currentSpeed;
            if (keys.ArrowDown || keys.s) this.y += currentSpeed;

            // Bounds checking
            if (this.x < this.minX || this.x > this.maxX) this.x = prevX;
            if (this.y < this.minY || this.y > this.maxY) this.y = prevY;

            this.mouseX = mouseX;
            this.mouseY = mouseY;

            if (this.autoSpin) {
                this.rotation += this.spinSpeed;
            } else {
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                this.rotation = Math.atan2(dy, dx);
            }

            this.updateRegeneration();
        } catch (error) {
            console.error('Error updating player:', error);
            // Restore previous position on error
            this.x = prevX;
            this.y = prevY;
        }
    }

    canShoot() {
        try {
            let shootDelay = this.shipType.shootDelay;
            
            // Apply rapid fire power-up if active
            if (this.powerUps.rapidfire.active && Date.now() < this.powerUps.rapidfire.endTime) {
                shootDelay *= this.powerUps.rapidfire.cooldownReduction;
            }
            
            return this.autoShoot ? 
                (Date.now() - this.lastShootTime >= shootDelay) : true;
        } catch (error) {
            console.error('Error checking canShoot:', error);
            return false;
        }
    }

    shoot() {
        try {
            this.shipType.triggerShootAnimation();
            this.lastShootTime = Date.now();
            return true;
        } catch (error) {
            console.error('Error in player shoot:', error);
            return false;
        }
    }

    getShootAngle() {
        try {
            return this.autoSpin ? this.rotation : Math.atan2(this.mouseY - this.y, this.mouseX - this.x);
        } catch (error) {
            console.error('Error getting shoot angle:', error);
            return this.rotation;
        }
    }
    
    // Power-up activation methods
    addShield(duration) {
        try {
            this.powerUps.shield.active = true;
            this.powerUps.shield.endTime = Date.now() + duration;
            console.log(`Shield power-up activated for ${duration/1000} seconds`);
        } catch (error) {
            console.error('Error activating shield power-up:', error);
        }
    }
    
    enableDamageBoost(duration) {
        try {
            this.powerUps.damage.active = true;
            this.powerUps.damage.endTime = Date.now() + duration;
            console.log(`Damage boost power-up activated for ${duration/1000} seconds`);
        } catch (error) {
            console.error('Error activating damage boost power-up:', error);
        }
    }
    
    enableSpeedBoost(duration) {
        try {
            this.powerUps.speedboost.active = true;
            this.powerUps.speedboost.endTime = Date.now() + duration;
            console.log(`Speed boost power-up activated for ${duration/1000} seconds`);
        } catch (error) {
            console.error('Error activating speed boost power-up:', error);
        }
    }
    
    enableRapidFire(duration) {
        try {
            this.powerUps.rapidfire.active = true;
            this.powerUps.rapidfire.endTime = Date.now() + duration;
            console.log(`Rapid fire power-up activated for ${duration/1000} seconds`);
        } catch (error) {
            console.error('Error activating rapid fire power-up:', error);
        }
    }
}