/**
 * Achievement Particle System
 * Creates dynamic particles and effects for achievement showcase and notifications
 * Version 1.0.0
 */
class AchievementParticles {
    constructor() {
        this.canvas = document.getElementById('achievement-particles-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Arrays to store different types of particles
        this.notificationParticles = [];
        this.showcaseParticles = [];
        this.specialEffects = [];
        
        // Color palettes
        this.colors = {
            unlock: ['#00ffff', '#00ccff', '#0099ff', '#66ffff', '#33ccff'],
            progress: ['#ffcc00', '#ffaa00', '#ff8800', '#ffdd33', '#ffbb33'],
            showcase: ['#ff00ff', '#cc00ff', '#9900ff', '#ff33ff', '#cc33ff']
        };
        
        this.initialized = false;
        
        // Initialize the system
        this.initialize();
    }
    
    initialize() {
        if (!this.canvas || !this.ctx) {
            console.warn('Achievement particles canvas not found');
            return;
        }
        
        // Set canvas to full window size
        this.resize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
        
        // Start animation loop
        this.animate(performance.now());
        
        this.initialized = true;
    }
    
    resize() {
        if (!this.canvas) return;
        
        // Make canvas full screen
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Create particles for achievement notification
     * @param {DOMRect} rect - The element rectangle to emit particles from
     * @param {string} type - The type of effect (unlock, progress, showcase)
     */
    createNotificationEffect(rect, type = 'unlock') {
        if (!this.initialized) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Color palette based on type
        const palette = this.colors[type] || this.colors.unlock;
        
        // Create particles based on type
        const particleCount = type === 'unlock' ? 40 : (type === 'showcase' ? 25 : 15);
        
        for (let i = 0; i < particleCount; i++) {
            // Create particles with different properties based on type
            let speed, size, lifespan;
            
            if (type === 'unlock') {
                // Burst particles for unlock
                speed = Math.random() * 5 + 3;
                size = Math.random() * 4 + 2;
                lifespan = Math.random() * 1000 + 1000;
            } else if (type === 'showcase') {
                // Floating particles for showcase
                speed = Math.random() * 2 + 1;
                size = Math.random() * 6 + 3;
                lifespan = Math.random() * 2000 + 2000;
            } else {
                // Subtle particles for progress
                speed = Math.random() * 3 + 1;
                size = Math.random() * 3 + 1;
                lifespan = Math.random() * 800 + 800;
            }
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // Add some gravity for unlock effect
            const gravity = type === 'unlock' ? 0.1 : (type === 'progress' ? 0.05 : -0.02);
            
            // Random color from the palette
            const color = palette[Math.floor(Math.random() * palette.length)];
            
            // Special shape for showcase particles
            const shape = type === 'showcase' ? (Math.random() > 0.7 ? 'star' : 'circle') : 'circle';
            
            // Create particle
            this.notificationParticles.push({
                x: centerX + (Math.random() - 0.5) * rect.width * 0.8,
                y: centerY + (Math.random() - 0.5) * rect.height * 0.8,
                velocity,
                size,
                color,
                alpha: 1,
                gravity,
                lifespan,
                birthtime: performance.now(),
                shape,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 5 - 2.5
            });
        }
    }
    
    /**
     * Create showcase particles for achievement screen
     * @param {DOMRect} rect - The achievement element rectangle
     * @param {boolean} isUnlocked - Whether the achievement is unlocked
     */
    createShowcaseEffect(rect, isUnlocked = true) {
        if (!this.initialized) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Color palette based on unlock status
        const palette = isUnlocked ? this.colors.showcase : this.colors.progress;
        
        // Create particles
        const particleCount = isUnlocked ? 15 : 5;
        
        for (let i = 0; i < particleCount; i++) {
            // Slow moving particles that orbit the achievement
            const speed = Math.random() * 0.5 + 0.2;
            const size = Math.random() * 4 + 2;
            const lifespan = Math.random() * 5000 + 5000;
            
            // Create movement pattern (orbital or floating)
            const orbital = Math.random() > 0.4;
            const orbitRadius = Math.random() * rect.width * 0.6 + rect.width * 0.3;
            const orbitSpeed = (Math.random() * 0.001 + 0.001) * (Math.random() > 0.5 ? 1 : -1);
            const orbitStartAngle = Math.random() * Math.PI * 2;
            
            // Create star shape for unlocked achievements
            const shape = isUnlocked && Math.random() > 0.6 ? 'star' : 'circle';
            
            // Non-orbital particles move in a slight drift
            const angle = Math.random() * Math.PI * 2;
            const velocity = {
                x: orbital ? 0 : Math.cos(angle) * speed,
                y: orbital ? 0 : Math.sin(angle) * speed
            };
            
            // Random color from the palette
            const color = palette[Math.floor(Math.random() * palette.length)];
            
            // Create particle
            this.showcaseParticles.push({
                x: orbital ? centerX + Math.cos(orbitStartAngle) * orbitRadius : centerX + (Math.random() - 0.5) * rect.width,
                y: orbital ? centerY + Math.sin(orbitStartAngle) * orbitRadius : centerY + (Math.random() - 0.5) * rect.height,
                velocity,
                size,
                color,
                alpha: Math.random() * 0.3 + 0.7,
                birthtime: performance.now(),
                lifespan,
                shape,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 2 - 1,
                orbital,
                orbitCenter: { x: centerX, y: centerY },
                orbitRadius,
                orbitSpeed,
                orbitAngle: orbitStartAngle,
                rect: { ...rect } // Store rectangle to check if achievement is still visible
            });
        }
    }
    
    /**
     * Create a special victory effect when all achievements are completed
     */
    createVictoryEffect() {
        if (!this.initialized) return;
        
        // Create a special burst of particles across the screen
        for (let i = 0; i < 100; i++) {
            // Create particles that spread from the center of the screen
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Fast spreading particles
            const speed = Math.random() * 8 + 5;
            const angle = Math.random() * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // Larger, more visible particles
            const size = Math.random() * 10 + 5;
            
            // Long lasting particles
            const lifespan = Math.random() * 3000 + 2000;
            
            // Random color from all palettes
            const allColors = [...this.colors.unlock, ...this.colors.showcase, ...this.colors.progress];
            const color = allColors[Math.floor(Math.random() * allColors.length)];
            
            // Special stars for victory
            const shape = Math.random() > 0.4 ? 'star' : 'circle';
            
            // Create the particle
            this.specialEffects.push({
                x: centerX,
                y: centerY,
                velocity,
                size,
                color,
                alpha: 1,
                gravity: 0.05,
                birthtime: performance.now(),
                lifespan,
                shape,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 5 - 2.5,
                type: 'victory'
            });
        }
        
        // Create a shockwave effect
        this.specialEffects.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: 10,
            maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
            color: '#ffffff',
            alpha: 0.8,
            birthtime: performance.now(),
            lifespan: 1500,
            type: 'shockwave'
        });
    }
    
    /**
     * Draw a star shape
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} size - Star size
     * @param {number} rotation - Rotation in degrees
     */
    drawStar(ctx, x, y, size, rotation = 0) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        let rot = (Math.PI / 2) + (rotation * Math.PI / 180);
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const currX = x + Math.cos(rot) * radius;
            const currY = y + Math.sin(rot) * radius;
            
            if (i === 0) {
                ctx.moveTo(currX, currY);
            } else {
                ctx.lineTo(currX, currY);
            }
            
            rot += step;
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Updates and draws all particles
     */
    animate(time) {
        if (!this.initialized || !this.ctx) {
            requestAnimationFrame((t) => this.animate(t));
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.updateNotificationParticles(time);
        this.updateShowcaseParticles(time);
        this.updateSpecialEffects(time);
        
        // Continue animation loop
        requestAnimationFrame((t) => this.animate(t));
    }
    
    /**
     * Update notification particles
     */
    updateNotificationParticles(time) {
        for (let i = this.notificationParticles.length - 1; i >= 0; i--) {
            const p = this.notificationParticles[i];
            
            // Check if particle has expired
            if (time - p.birthtime > p.lifespan) {
                this.notificationParticles.splice(i, 1);
                continue;
            }
            
            // Update position
            p.x += p.velocity.x;
            p.y += p.velocity.y;
            
            // Apply gravity
            p.velocity.y += p.gravity;
            
            // Update rotation
            p.rotation += p.rotationSpeed;
            
            // Fade out based on lifetime
            const lifePercent = (time - p.birthtime) / p.lifespan;
            p.alpha = 1 - lifePercent;
            
            // Draw particle
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            
            if (p.shape === 'star') {
                this.drawStar(this.ctx, p.x, p.y, p.size, p.rotation);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Reset alpha
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Update showcase particles
     */
    updateShowcaseParticles(time) {
        for (let i = this.showcaseParticles.length - 1; i >= 0; i--) {
            const p = this.showcaseParticles[i];
            
            // Check if particle has expired
            if (time - p.birthtime > p.lifespan) {
                this.showcaseParticles.splice(i, 1);
                continue;
            }
            
            // If orbital, update position based on orbit
            if (p.orbital) {
                p.orbitAngle += p.orbitSpeed;
                p.x = p.orbitCenter.x + Math.cos(p.orbitAngle) * p.orbitRadius;
                p.y = p.orbitCenter.y + Math.sin(p.orbitAngle) * p.orbitRadius;
            } else {
                // Update position with velocity
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                
                // Bounce off the achievement box edges
                const halfSize = p.size / 2;
                if (p.x < p.rect.left + halfSize) {
                    p.x = p.rect.left + halfSize;
                    p.velocity.x *= -1;
                } else if (p.x > p.rect.left + p.rect.width - halfSize) {
                    p.x = p.rect.left + p.rect.width - halfSize;
                    p.velocity.x *= -1;
                }
                
                if (p.y < p.rect.top + halfSize) {
                    p.y = p.rect.top + halfSize;
                    p.velocity.y *= -1;
                } else if (p.y > p.rect.top + p.rect.height - halfSize) {
                    p.y = p.rect.top + p.rect.height - halfSize;
                    p.velocity.y *= -1;
                }
            }
            
            // Update rotation
            p.rotation += p.rotationSpeed;
            
            // Pulsing alpha based on lifetime
            const lifePercent = (time - p.birthtime) / p.lifespan;
            const pulse = Math.sin(lifePercent * Math.PI * 8) * 0.2 + 0.8;
            p.alpha = pulse * (1 - lifePercent * 0.5);
            
            // Draw particle
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            
            if (p.shape === 'star') {
                this.drawStar(this.ctx, p.x, p.y, p.size, p.rotation);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Reset alpha
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Update special effects
     */
    updateSpecialEffects(time) {
        for (let i = this.specialEffects.length - 1; i >= 0; i--) {
            const effect = this.specialEffects[i];
            
            // Check if effect has expired
            if (time - effect.birthtime > effect.lifespan) {
                this.specialEffects.splice(i, 1);
                continue;
            }
            
            const lifePercent = (time - effect.birthtime) / effect.lifespan;
            
            if (effect.type === 'shockwave') {
                // Update shockwave
                effect.radius = effect.maxRadius * lifePercent;
                effect.alpha = 0.8 * (1 - lifePercent);
                
                // Draw shockwave
                this.ctx.globalAlpha = effect.alpha;
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (effect.type === 'victory') {
                // Update victory particle
                effect.x += effect.velocity.x;
                effect.y += effect.velocity.y;
                
                // Apply gravity
                effect.velocity.y += effect.gravity;
                
                // Update rotation
                effect.rotation += effect.rotationSpeed;
                
                // Fade out based on lifetime
                effect.alpha = 1 - lifePercent;
                
                // Draw particle
                this.ctx.globalAlpha = effect.alpha;
                this.ctx.fillStyle = effect.color;
                
                if (effect.shape === 'star') {
                    this.drawStar(this.ctx, effect.x, effect.y, effect.size, effect.rotation);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Reset alpha
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Clear all particles
     */
    clearParticles() {
        this.notificationParticles = [];
        this.showcaseParticles = [];
        this.specialEffects = [];
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearParticles();
        window.removeEventListener('resize', this.resize);
        this.initialized = false;
    }
}

// Initialize the achievement particles system when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.achievementParticles = new AchievementParticles();
});