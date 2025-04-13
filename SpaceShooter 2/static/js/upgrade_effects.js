/**
 * Upgrade Effect System
 * Creates dynamic particles and visual effects for stat upgrades and ship improvements
 * Version 1.0.0
 */
class UpgradeEffects {
    constructor() {
        this.initialized = false;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        
        // Color themes for different upgrade types
        this.colors = {
            speed: ['rgba(0, 255, 255, ', 'rgba(100, 200, 255, ', 'rgba(50, 150, 255, '],
            fireRate: ['rgba(255, 100, 100, ', 'rgba(255, 150, 50, ', 'rgba(255, 200, 100, '],
            projectileSize: ['rgba(255, 255, 100, ', 'rgba(200, 255, 50, ', 'rgba(150, 255, 100, '],
            durability: ['rgba(100, 255, 150, ', 'rgba(50, 200, 100, ', 'rgba(100, 200, 150, '],
            regeneration: ['rgba(255, 100, 255, ', 'rgba(200, 100, 255, ', 'rgba(150, 100, 255, '],
            default: ['rgba(150, 150, 255, ', 'rgba(100, 200, 255, ', 'rgba(200, 200, 255, ']
        };
        
        this.initialize();
    }
    
    initialize() {
        // Create canvas for upgrade effects
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'upgrade-effects-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        // Add event listeners
        window.addEventListener('resize', this.resize.bind(this));
        
        this.initialized = true;
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Create upgrade effect at the player's position
     * @param {Object} player - The player object
     * @param {string} upgradeType - Type of upgrade (speed, fireRate, etc.)
     */
    createUpgradeEffect(player, upgradeType = 'default') {
        if (!this.initialized) return;
        
        // Get player position
        const x = player.x;
        const y = player.y;
        const radius = player.size * 1.5;
        
        // Get color palette for this upgrade type
        const palette = this.colors[upgradeType] || this.colors.default;
        
        // Create a burst of particles
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            // Create particles with different behaviors based on upgrade type
            let particleType;
            let speed;
            let gravity;
            let size;
            let lifespan;
            
            switch(upgradeType) {
                case 'speed':
                    // Speed upgrade: fast horizontal particles 
                    particleType = 'streak';
                    speed = Math.random() * 8 + 4;
                    gravity = 0;
                    size = Math.random() * 4 + 2;
                    lifespan = Math.random() * 700 + 500;
                    break;
                    
                case 'fireRate':
                    // Fire rate upgrade: burst particles
                    particleType = 'burst';
                    speed = Math.random() * 6 + 3;
                    gravity = 0.05;
                    size = Math.random() * 3 + 2;
                    lifespan = Math.random() * 600 + 400;
                    break;
                    
                case 'projectileSize':
                    // Projectile size upgrade: expanding rings
                    particleType = 'ring';
                    speed = Math.random() * 2 + 1;
                    gravity = 0;
                    size = Math.random() * 5 + 10;
                    lifespan = Math.random() * 800 + 600;
                    break;
                    
                case 'durability':
                    // Durability upgrade: shield particles
                    particleType = 'shield';
                    speed = Math.random() * 1.5 + 0.5;
                    gravity = 0;
                    size = Math.random() * 3 + 2;
                    lifespan = Math.random() * 1000 + 800;
                    break;
                    
                case 'regeneration':
                    // Regeneration upgrade: healing particles
                    particleType = 'healing';
                    speed = Math.random() * 2 + 1;
                    gravity = -0.05;
                    size = Math.random() * 3 + 2;
                    lifespan = Math.random() * 900 + 700;
                    break;
                    
                default:
                    // Default upgrade effect
                    particleType = Math.random() > 0.5 ? 'sparkle' : 'circle';
                    speed = Math.random() * 4 + 2;
                    gravity = 0.03;
                    size = Math.random() * 4 + 2;
                    lifespan = Math.random() * 800 + 500;
            }
            
            // Calculate particle angle and velocity
            let angle, vx, vy;
            
            if (particleType === 'shield') {
                // Shield particles orbit around the player
                angle = Math.random() * Math.PI * 2;
                const orbitRadius = radius + Math.random() * 20;
                vx = Math.cos(angle) * 0.5; // Slow orbital motion
                vy = Math.sin(angle) * 0.5;
                
                // Start at a position on the orbit
                const startAngle = Math.random() * Math.PI * 2;
                const startX = x + Math.cos(startAngle) * orbitRadius;
                const startY = y + Math.sin(startAngle) * orbitRadius;
                
                this.createParticle(startX, startY, vx, vy, size, particleType, palette, lifespan, gravity, {
                    orbitCenter: {x, y},
                    orbitRadius: orbitRadius,
                    orbitSpeed: speed * 0.02,
                    orbitAngle: startAngle
                });
            } 
            else if (particleType === 'ring') {
                // Create expanding rings
                const ringAngle = Math.random() * Math.PI * 2;
                this.createParticle(x, y, 0, 0, size, particleType, palette, lifespan, 0, {
                    startRadius: radius,
                    expansionRate: speed
                });
            }
            else {
                // Standard particle emission
                angle = Math.random() * Math.PI * 2;
                vx = Math.cos(angle) * speed;
                vy = Math.sin(angle) * speed;
                
                this.createParticle(x, y, vx, vy, size, particleType, palette, lifespan, gravity);
            }
        }
        
        // Start animation if not already running
        if (!this.animationId) {
            this.animate();
        }
    }
    
    /**
     * Create a single particle
     */
    createParticle(x, y, vx, vy, size, type, palette, lifespan, gravity, extra = {}) {
        // Choose a random color from the palette
        const colorBase = palette[Math.floor(Math.random() * palette.length)];
        
        this.particles.push({
            x, y,
            vx, vy,
            size,
            type,
            color: colorBase,
            alpha: 1,
            gravity,
            birthtime: performance.now(),
            lifespan,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 5,
            ...extra
        });
    }
    
    /**
     * Animation loop for particles
     */
    animate(time = performance.now()) {
        if (!this.initialized) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Check if particle has expired
            if (time - particle.birthtime > particle.lifespan) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Calculate life percentage
            const lifePercent = (time - particle.birthtime) / particle.lifespan;
            
            // Update based on particle type
            if (particle.type === 'shield') {
                // Update orbital position
                particle.orbitAngle += particle.orbitSpeed;
                particle.x = particle.orbitCenter.x + Math.cos(particle.orbitAngle) * particle.orbitRadius;
                particle.y = particle.orbitCenter.y + Math.sin(particle.orbitAngle) * particle.orbitRadius;
                
                // Fade based on life
                particle.alpha = 1 - lifePercent;
            }
            else if (particle.type === 'ring') {
                // Update ring radius
                particle.currentRadius = particle.startRadius + 
                    (particle.expansionRate * (time - particle.birthtime) / 30);
                
                // Fade based on expansion
                particle.alpha = 1 - lifePercent;
            }
            else {
                // Standard particle movement
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Apply gravity
                particle.vy += particle.gravity;
                
                // Fade based on life
                particle.alpha = 1 - lifePercent;
                
                // Update rotation
                particle.rotation += particle.rotationSpeed;
            }
            
            // Draw the particle
            this.drawParticle(particle);
        }
        
        // Continue animation if particles exist
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(this.animate.bind(this));
        } else {
            this.animationId = null;
        }
    }
    
    /**
     * Draw a particle based on its type
     */
    drawParticle(particle) {
        this.ctx.save();
        
        // Set transparency
        this.ctx.globalAlpha = particle.alpha;
        
        if (particle.type === 'ring') {
            // Draw expanding ring
            this.ctx.strokeStyle = `${particle.color}${particle.alpha})`;
            this.ctx.lineWidth = particle.size / 4;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        else if (particle.type === 'streak') {
            // Draw streaking particle with trail
            this.ctx.fillStyle = `${particle.color}${particle.alpha})`;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(Math.atan2(particle.vy, particle.vx));
            this.ctx.fillRect(-particle.size * 2, -particle.size / 2, particle.size * 4, particle.size);
        }
        else if (particle.type === 'sparkle') {
            // Draw four-point star
            this.ctx.fillStyle = `${particle.color}${particle.alpha})`;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation * Math.PI / 180);
            
            this.ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                this.ctx.lineTo(0, particle.size);
                this.ctx.lineTo(particle.size / 2, particle.size / 2);
                this.ctx.rotate(Math.PI / 2);
            }
            this.ctx.fill();
        }
        else if (particle.type === 'healing') {
            // Draw plus sign for healing
            this.ctx.fillStyle = `${particle.color}${particle.alpha})`;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation * Math.PI / 180);
            
            const width = particle.size / 3;
            const length = particle.size;
            
            // Horizontal bar
            this.ctx.fillRect(-length / 2, -width / 2, length, width);
            // Vertical bar
            this.ctx.fillRect(-width / 2, -length / 2, width, length);
        }
        else if (particle.type === 'burst') {
            // Draw burst particle (small triangle)
            this.ctx.fillStyle = `${particle.color}${particle.alpha})`;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation * Math.PI / 180);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, -particle.size);
            this.ctx.lineTo(particle.size, particle.size);
            this.ctx.lineTo(-particle.size, particle.size);
            this.ctx.closePath();
            this.ctx.fill();
        }
        else {
            // Default circle particle
            this.ctx.fillStyle = `${particle.color}${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Clear all particles
     */
    clearParticles() {
        this.particles = [];
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.clearParticles();
        if (this.canvas) {
            window.removeEventListener('resize', this.resize);
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
        this.initialized = false;
    }
}