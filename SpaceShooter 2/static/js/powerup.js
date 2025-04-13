/**
 * PowerUp System
 * Adds temporary power-ups that enhance player abilities
 * Version 1.0.0
 */
class PowerUp {
    constructor(x, y, type) {
        // Position
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        
        // Visual properties
        this.size = 20;
        this.pulseDirection = 1;
        this.pulseAmount = 0;
        this.maxPulse = 5;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.02;
        
        // Hover movement
        this.hoverOffset = 0;
        this.hoverSpeed = 0.05;
        this.hoverAmount = 10;
        this.hoverDirection = 1;
        
        // Particles
        this.particleTimer = 0;
        this.particleInterval = 100; // ms
        this.lastParticleTime = Date.now();
        
        // Lifetime (power-ups disappear after some time)
        this.lifetime = 0;
        this.maxLifetime = 15000; // 15 seconds
        this.startTime = Date.now();
        
        // Get config based on type
        const config = this.getTypeConfig();
        this.duration = config.duration;
        this.displayName = config.displayName;
        this.description = config.description;
        this.icon = config.icon || '⭐';
        this.color = config.color;
    }
    
    getTypeConfig() {
        const configs = {
            shield: {
                displayName: 'Shield',
                description: 'Protects against enemy collisions',
                duration: 10000, // 10 seconds
                color: '#3498db',
                icon: '🛡️'
            },
            damage: { // Replacing multishot with damage boost
                displayName: 'Damage Boost',
                description: 'Increases projectile damage',
                duration: 8000, // 8 seconds
                color: '#e74c3c',
                icon: '🔥'
            },
            speedboost: {
                displayName: 'Speed Boost',
                description: 'Increases ship movement speed',
                duration: 12000, // 12 seconds
                color: '#2ecc71',
                icon: '⚡'
            },
            rapidfire: {
                displayName: 'Rapid Fire',
                description: 'Decreases firing cooldown',
                duration: 8000, // 8 seconds
                color: '#f39c12',
                icon: '💨'
            },
            points: {
                displayName: 'Score Bonus',
                description: 'Instant score boost',
                duration: 0, // Instant effect
                color: '#9b59b6',
                icon: '💎'
            }
        };
        
        return configs[this.type] || configs.points;
    }
    
    getGlowColor() {
        // Return a slightly lighter version of the color for glow effects
        return this.color + '88'; // Add 50% alpha
    }
    
    getCollectSound() {
        const sounds = {
            shield: 'powerupShield',
            damage: 'powerupWeapon', // Updated from multishot
            speedboost: 'powerupSpeed',
            rapidfire: 'powerupWeapon',
            points: 'powerupPoints'
        };
        
        return sounds[this.type] || 'powerupGeneric';
    }
    
    update() {
        // Update rotation
        this.rotationAngle += this.rotationSpeed;
        
        // Update pulsing size
        this.pulseAmount += 0.1 * this.pulseDirection;
        if (this.pulseAmount >= this.maxPulse) {
            this.pulseDirection = -1;
        } else if (this.pulseAmount <= 0) {
            this.pulseDirection = 1;
        }
        
        // Update hover position
        this.hoverOffset += this.hoverSpeed * this.hoverDirection;
        if (Math.abs(this.hoverOffset) >= this.hoverAmount) {
            this.hoverDirection *= -1;
        }
        
        // Emit particles periodically
        const now = Date.now();
        if (now - this.lastParticleTime >= this.particleInterval) {
            this.emitParticles();
            this.lastParticleTime = now;
        }
        
        // Check lifetime
        if (now - this.startTime >= this.maxLifetime) {
            this.active = false;
        }
    }
    
    emitParticles() {
        // Create particles if the cosmic transition system is available and not in performance mode
        if (window.cosmicTransitions && !window.game?.performanceMode) {
            const color = this.color;
            const glowColor = this.getGlowColor();
            
            // Create fewer particles for better performance (just 1-2)
            const particleCount = Math.floor(Math.random() * 2) + 1;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = this.size * 0.8;
                const particleX = this.x + Math.cos(angle) * distance;
                const particleY = this.y + Math.sin(angle) * distance + this.hoverOffset;
                
                // Create a particle with longer lifespan (fewer particles, but visible longer)
                window.cosmicTransitions.createParticle(
                    particleX,
                    particleY,
                    i % 2 === 0 ? color : glowColor,
                    Math.random() * 2 + 1, // Smaller particles
                    {
                        velocityX: Math.cos(angle) * (Math.random() * 1.5 - 0.75), // Less velocity variation
                        velocityY: Math.sin(angle) * (Math.random() * 1.5 - 0.75),
                        lifespan: Math.random() * 300 + 700, // Longer lifespan but fewer particles
                        fadeOut: true,
                        gravity: -0.005, // Reduced gravity effect
                        glow: true
                    }
                );
            }
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const effectiveSize = this.size + this.pulseAmount;
        const isPerformanceMode = window.game?.performanceMode;
        
        // Save context state
        ctx.save();
        
        // Draw a glow effect (simplified in performance mode)
        if (!isPerformanceMode) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y + this.hoverOffset, effectiveSize * 0.5,
                this.x, this.y + this.hoverOffset, effectiveSize * 1.5 // Reduced size for better performance
            );
            gradient.addColorStop(0, this.getGlowColor());
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.globalAlpha = 0.3; // Slightly reduced opacity
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y + this.hoverOffset, effectiveSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1;
        
        // Draw the power-up shape (rotated hexagon)
        ctx.translate(this.x, this.y + this.hoverOffset);
        ctx.rotate(this.rotationAngle);
        
        this.drawHexagon(ctx, 0, 0, effectiveSize, this.rotationAngle);
        
        // Draw the lifetime ring (simplified in performance mode)
        if (!isPerformanceMode) {
            this.drawLifetimeRing(ctx);
        } else {
            // Simplified lifetime indicator in performance mode
            this.drawSimpleLifetimeIndicator(ctx);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    // Simpler lifetime indicator for performance mode
    drawSimpleLifetimeIndicator(ctx) {
        const elapsedTime = Date.now() - this.startTime;
        const lifePercentage = Math.max(0, 1 - (elapsedTime / this.maxLifetime));
        
        // Draw just a simple colored line
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.2, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * lifePercentage));
        ctx.stroke();
    }
    
    drawHexagon(ctx, x, y, size, rotation) {
        const sides = 6;
        const isPerformanceMode = window.game?.performanceMode;
        
        if (isPerformanceMode) {
            // Simplified drawing in performance mode - flat color instead of gradient
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1; // Thinner line
        } else {
            // Draw filled hexagon with gradient in normal mode
            const gradient = ctx.createRadialGradient(x, y, size * 0.2, x, y, size);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, this.getGlowColor());
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
        }
        
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = rotation + (i * 2 * Math.PI / sides);
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw inner icon or symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, x, y);
    }
    
    drawLifetimeRing(ctx) {
        const radius = this.size * 1.5;
        const elapsedTime = Date.now() - this.startTime;
        const lifePercentage = Math.max(0, 1 - (elapsedTime / this.maxLifetime));
        
        // Draw background ring (dim)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw foreground ring (progress)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * lifePercentage));
        ctx.stroke();
    }
    
    collect(player, game) {
        if (!this.active) return;
        
        // Apply the power-up effect
        this.active = false;
        
        // Create a collection effect at the player's position
        this.createCollectionEffect(player);
        
        // Play sound effect
        if (game.soundManager) {
            try {
                game.soundManager.playSound(this.getCollectSound(), 0.6);
            } catch (error) {
                console.warn('Could not play power-up sound:', error);
            }
        }
        
        // Don't apply power-up effects during events, only give score
        if (game.radiantEventActive || game.lunarEventActive) {
            // Still give points but disable the power-up's normal effect
            game.addScore(500);
            this.showPowerUpNotification(game, true);
            return;
        }
        
        // Apply effects based on power-up type
        switch (this.type) {
            case 'shield':
                // Add shield protection
                player.addShield(this.duration);
                break;
                
            case 'damage':
                // Enable damage boost (replaces multishot)
                player.enableDamageBoost(this.duration);
                break;
                
            case 'speedboost':
                // Increase movement speed
                player.enableSpeedBoost(this.duration);
                break;
                
            case 'rapidfire':
                // Decrease firing cooldown
                player.enableRapidFire(this.duration);
                break;
                
            case 'points':
                // Add bonus points (500-1000)
                const bonusPoints = Math.floor(Math.random() * 501) + 500;
                game.addScore(bonusPoints);
                break;
        }
        
        // Show notification
        this.showPowerUpNotification(game);
    }
    
    createCollectionEffect(player) {
        // Create a collection effect if cosmic transitions are available
        if (window.cosmicTransitions) {
            // Adjust particle count based on performance mode
            const isPerformanceMode = window.game?.performanceMode;
            const particleCount = isPerformanceMode ? 8 : 15;
            
            // Create particles bursting from the power-up location to the player
            window.cosmicTransitions.createParticleBurst(
                this.x,
                this.y,
                {
                    count: particleCount,
                    colors: [this.color, '#ffffff', this.getGlowColor()],
                    directed: true,
                    direction: {
                        x: player.x - this.x,
                        y: player.y - this.y
                    },
                    speed: { min: 30, max: 60 }, // Slower for better performance
                    size: { min: isPerformanceMode ? 1 : 2, max: isPerformanceMode ? 3 : 5 },
                    lifespan: isPerformanceMode ? 600 : 800,
                    fadeOut: true,
                    gravity: 0,
                    glow: true,
                    trail: !isPerformanceMode // Disable trails in performance mode
                }
            );
            
            // Create a pulse effect (simpler in performance mode)
            window.cosmicTransitions.createPulseEffect(null, {
                x: this.x,
                y: this.y,
                radius: this.size * (isPerformanceMode ? 3 : 5),
                color: this.color,
                duration: isPerformanceMode ? 300 : 500,
                fadeOut: true
            });
            
            // Add a gravity well at player position (only if not in performance mode)
            if (!isPerformanceMode) {
                const gravitySource = window.cosmicTransitions.addGravitySource(
                    player.x,
                    player.y,
                    1.5, // Less intense attraction for better performance
                    null,
                    false
                );
                
                // Remove gravity source after particles reach it
                setTimeout(() => {
                    if (window.cosmicTransitions.gravitySources) {
                        const index = window.cosmicTransitions.gravitySources.indexOf(gravitySource);
                        if (index > -1) window.cosmicTransitions.gravitySources.splice(index, 1);
                    }
                }, 800); // Shorter lifetime
            }
        }
    }
    
    showPowerUpNotification(game, disabledByEvent = false) {
        // Show notification in the achievement area instead of power-up area
        const container = document.querySelector('.achievement-notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.borderLeft = `4px solid ${this.color}`;
        notification.style.boxShadow = `0 0 20px ${this.color}88`;
        
        // Determine the title and description based on whether we're in an event
        const title = disabledByEvent ? "POWER-UP CONVERTED" : "POWER-UP ACTIVATED";
        const description = disabledByEvent 
            ? "Power-up converted to points during event"
            : `${this.description} ${this.duration > 0 ? `(${this.duration / 1000}s)` : ''}`;
        
        // Use achievement notification style but with power-up content
        notification.innerHTML = `
            <div class="achievement-notification-icon" style="color: ${this.color}">${this.icon}</div>
            <div class="achievement-notification-content">
                <div class="achievement-notification-title" style="color: ${this.color}">${title}</div>
                <div class="achievement-notification-name">${this.displayName}</div>
                <div class="achievement-notification-description">${description}</div>
            </div>
        `;
        
        // Add to DOM
        container.appendChild(notification);
        
        // Add show class after a small delay for animation (using achievement animation)
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after display duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500); // Remove after fade out animation
        }, 3000);
        
        // Create active effects for gameplay purposes but don't display the indicators
        if (this.duration > 0) {
            // Create a tracking object for the game logic without visual elements
            if (!game.activePowerUps) {
                game.activePowerUps = {};
            }
            
            // If there's an existing timer for this power-up type, clear it
            if (game.activePowerUps[this.type] && game.activePowerUps[this.type].timerId) {
                clearTimeout(game.activePowerUps[this.type].timerId);
            }
            
            // Store the power-up duration and set a timer to clear it
            game.activePowerUps[this.type] = {
                endTime: Date.now() + this.duration,
                timerId: setTimeout(() => {
                    if (game.activePowerUps) {
                        delete game.activePowerUps[this.type];
                    }
                }, this.duration)
            };
        }
    }
    
    collidesWith(player) {
        if (!this.active || !player) return false;
        
        const dx = this.x - player.x;
        const dy = (this.y + this.hoverOffset) - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.size + player.size);
    }
}