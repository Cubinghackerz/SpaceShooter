class Projectile {
    constructor(x, y, angle, shipType) {
        this.x = x;
        this.y = y;
        this.speed = shipType.projectileSpeed;
        this.radius = shipType.projectileSize;
        this.angle = angle;
        this.damage = shipType.damage;
        this.color = shipType.color;
        this.shipType = shipType.type;
        this.trailPositions = [];
        this.lifetime = 0;
        this.maxTrailPositions = 10;
        this.particles = [];
        this.isDamageBoosted = false; // Flag for damage-boosted projectiles
        
        // Store initial position for trail
        this.trailPositions.push({x: this.x, y: this.y, age: 0});
    }
    
    // Create enhanced hit effect when projectile hits an enemy
    createEnhancedHitEffect(enemy, game) {
        // Only create enhanced effects if this is a damage-boosted projectile
        if (!this.isDamageBoosted || !window.cosmicTransitions) return;
        
        // Reduce effects in performance mode
        const isPerformanceMode = game && game.performanceMode;
        
        // Add a burst of particles at impact point
        window.cosmicTransitions.createParticleBurst(
            enemy.x, 
            enemy.y, 
            {
                count: isPerformanceMode ? 8 : 15,
                colors: ['#ff6666', '#ff3333', '#ff9999', '#ffcccc'],
                speed: { min: 30, max: 100 },
                size: { min: 2, max: 5 },
                lifespan: { min: 300, max: 800 },
                fadeOut: true,
                gravity: 0.05,
                spread: Math.PI * 2,
                glow: true
            }
        );
        
        // Create a pulse effect for the impact shockwave
        window.cosmicTransitions.createPulseEffect(null, {
            x: enemy.x,
            y: enemy.y,
            radius: enemy.size * 2,
            color: '#ff3333',
            duration: 400,
            fadeOut: true,
            expandSpeed: 2
        });
        
        // Add temporary gravity well at impact point (creates a pulling effect)
        if (!isPerformanceMode) {
            const gravitySource = window.cosmicTransitions.addGravitySource(
                enemy.x,
                enemy.y,
                -0.8, // Negative for repulsion effect
                null,
                false
            );
            
            // Remove gravity source after a short time
            setTimeout(() => {
                if (window.cosmicTransitions.gravitySources.includes(gravitySource)) {
                    const index = window.cosmicTransitions.gravitySources.indexOf(gravitySource);
                    window.cosmicTransitions.gravitySources.splice(index, 1);
                }
            }, 500);
        }
    }

    draw(ctx) {
        // Draw trail first (so it appears behind the projectile)
        this.drawTrail(ctx);
        
        // Draw projectile with glow effect
        ctx.save();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.radius * 3;
        
        // Draw the main projectile
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw a brighter core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.restore();
        
        // Draw particles if we have any
        this.drawParticles(ctx);
    }
    
    drawTrail(ctx) {
        // Different trail effects based on ship type
        switch(this.shipType) {
            case 'scout':
                this.drawPulsingTrail(ctx);
                break;
            case 'sniper':
                this.drawLaserTrail(ctx);
                break;
            case 'quasar':
                this.drawEnergyTrail(ctx);
                break;
            case 'heavy':
                this.drawHeavyTrail(ctx);
                break;
            default:
                this.drawDefaultTrail(ctx);
        }
    }
    
    drawDefaultTrail(ctx) {
        if (this.trailPositions.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);
        
        for (let i = 1; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const opacity = 1 - (pos.age / 10);
            ctx.lineTo(pos.x, pos.y);
        }
        
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.trailPositions[this.trailPositions.length - 1].x,
            this.trailPositions[this.trailPositions.length - 1].y
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.radius * 0.8;
        ctx.stroke();
    }
    
    drawPulsingTrail(ctx) {
        // Scout has fast, pulsing trail
        if (this.trailPositions.length < 2) return;
        
        for (let i = 1; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const prevPos = this.trailPositions[i-1];
            const opacity = 1 - (pos.age / 10);
            const pulseIntensity = 0.5 + Math.sin(this.lifetime * 0.2 + i * 0.3) * 0.5;
            
            const gradient = ctx.createLinearGradient(
                prevPos.x, prevPos.y, pos.x, pos.y
            );
            gradient.addColorStop(0, `rgba(100, 200, 255, ${opacity * pulseIntensity})`);
            gradient.addColorStop(1, `rgba(100, 200, 255, 0)`);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.radius * 0.8 * pulseIntensity;
            ctx.moveTo(prevPos.x, prevPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    }
    
    drawLaserTrail(ctx) {
        // Sniper has long, straight laser trail
        const trailLength = 30;
        
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x - Math.cos(this.angle) * trailLength,
            this.y - Math.sin(this.angle) * trailLength
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

        // Draw main laser trail
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.radius * 0.8;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - Math.cos(this.angle) * trailLength,
            this.y - Math.sin(this.angle) * trailLength
        );
        ctx.stroke();
        
        // Draw brighter core
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = this.radius * 0.3;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - Math.cos(this.angle) * trailLength * 0.7,
            this.y - Math.sin(this.angle) * trailLength * 0.7
        );
        ctx.stroke();
    }
    
    drawEnergyTrail(ctx) {
        // Quasar has electric, lightning-like trail
        if (this.trailPositions.length < 2) return;
        
        ctx.save();
        
        for (let i = 1; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const prevPos = this.trailPositions[i-1];
            const opacity = 1 - (pos.age / 10);
            
            // Random offset for lightning effect
            const offsetX = (Math.random() - 0.5) * this.radius * 2;
            const offsetY = (Math.random() - 0.5) * this.radius * 2;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 100, 255, ${opacity})`;
            ctx.lineWidth = this.radius * 0.6 * (1 - i/this.trailPositions.length);
            ctx.moveTo(prevPos.x, prevPos.y);
            
            // Draw lightning segment with slight jitter
            if (i % 2 === 0) {
                const midX = (prevPos.x + pos.x) / 2 + offsetX;
                const midY = (prevPos.y + pos.y) / 2 + offsetY;
                ctx.lineTo(midX, midY);
                ctx.lineTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
            
            ctx.stroke();
            
            // Add small glow for sparkle effect
            if (Math.random() > 0.7) {
                ctx.beginPath();
                ctx.arc(
                    (prevPos.x + pos.x) / 2 + (Math.random() - 0.5) * 5,
                    (prevPos.y + pos.y) / 2 + (Math.random() - 0.5) * 5,
                    Math.random() * this.radius * 0.8,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(255, 230, 255, ${opacity * 0.8})`;
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    drawHeavyTrail(ctx) {
        // Heavy has smoke-like, thick trail
        if (this.trailPositions.length < 2) return;
        
        for (let i = 1; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const opacity = 1 - (pos.age / 10);
            const size = this.radius * (1 - i/this.trailPositions.length) * 2;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 150, 50, ${opacity * 0.3})`;
            ctx.fill();
        }
        
        // Draw flame-like gradient core
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x - Math.cos(this.angle) * this.radius * 3,
            this.y - Math.sin(this.angle) * this.radius * 3
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#ffaa00');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    drawParticles(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const opacity = 1 - (particle.age / particle.maxAge);
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * opacity, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particle.color}, ${opacity})`;
            ctx.fill();
            
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.age++;
        }
        
        // Remove dead particles
        this.particles = this.particles.filter(p => p.age < p.maxAge);
    }
    
    update() {
        this.lifetime++;
        
        // Calculate new position
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Add new position to trail
        this.trailPositions.unshift({x: this.x, y: this.y, age: 0});
        
        // Age existing positions
        for (let i = 0; i < this.trailPositions.length; i++) {
            this.trailPositions[i].age++;
        }
        
        // Remove old positions
        if (this.trailPositions.length > this.maxTrailPositions) {
            this.trailPositions.pop();
        }
        
        // Add particles occasionally
        if (Math.random() > 0.7) {
            this.emitParticle();
        }
    }
    
    emitParticle() {
        // Create differently styled particles based on ship type
        let color, size, speed, maxAge;
        
        switch(this.shipType) {
            case 'scout':
                color = '100, 200, 255';
                size = Math.random() * this.radius * 0.8;
                speed = 0.5;
                maxAge = 10;
                break;
            case 'sniper':
                color = '0, 255, 136';
                size = Math.random() * this.radius * 0.5;
                speed = 0.7;
                maxAge = 15;
                break;
            case 'quasar':
                color = '255, 100, 255';
                size = Math.random() * this.radius * 0.7;
                speed = 0.3;
                maxAge = 8;
                break;
            case 'heavy':
                color = '255, 150, 50';
                size = Math.random() * this.radius * 1.2;
                speed = 0.2;
                maxAge = 20;
                break;
            default:
                color = '255, 255, 255';
                size = Math.random() * this.radius * 0.5;
                speed = 0.3;
                maxAge = 12;
        }
        
        // Calculate random direction perpendicular to movement
        const perpAngle = this.angle + Math.PI/2;
        const spreadFactor = Math.random() * 2 - 1; // -1 to 1
        
        const particle = {
            x: this.x,
            y: this.y,
            vx: Math.cos(perpAngle) * spreadFactor * speed,
            vy: Math.sin(perpAngle) * spreadFactor * speed,
            size: size,
            color: color,
            age: 0,
            maxAge: maxAge
        };
        
        this.particles.push(particle);
    }
}