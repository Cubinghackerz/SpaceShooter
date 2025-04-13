class Portal {
    constructor(canvas) {
        this.size = 80;
        this.activeTime = 20000; // 20 seconds in milliseconds
        this.createTime = Date.now();
        this.healRate = 0.1; // Health points per second
        this.lastHealTime = Date.now();
        this.destructionRadius = 120; // Radius where enemies are destroyed
        this.repulsionRadius = 200; // Radius where enemies are pushed away
        this.repulsionForce = 2; // Force multiplier for enemy repulsion

        // Animation properties
        this.entryDuration = 1000; // 1 second entry animation
        this.exitDuration = 1500; // 1.5 seconds exit animation
        this.particles = [];
        this.maxParticles = 20;

        // Random position within canvas bounds
        this.x = Math.random() * (canvas.width - this.size * 2) + this.size;
        this.y = Math.random() * (canvas.height - this.size * 2) + this.size;

        // Initialize particles
        this.initParticles();
    }

    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                angle: (Math.PI * 2 * i) / this.maxParticles,
                distance: this.size * 0.8,
                speed: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 2
            });
        }
    }

    getAnimationProgress() {
        const now = Date.now();
        const timeSinceCreation = now - this.createTime;
        const timeUntilEnd = this.createTime + this.activeTime - now;

        // Entry animation
        if (timeSinceCreation < this.entryDuration) {
            return {
                phase: 'entry',
                progress: timeSinceCreation / this.entryDuration
            };
        }
        // Exit animation
        else if (timeUntilEnd < this.exitDuration) {
            return {
                phase: 'exit',
                progress: timeUntilEnd / this.exitDuration
            };
        }
        // Normal state
        return {
            phase: 'active',
            progress: 1
        };
    }

    draw(ctx) {
        const animation = this.getAnimationProgress();
        if (animation.phase === 'exit' && animation.progress <= 0) return;

        // Calculate base opacity and size based on animation phase
        let baseOpacity, baseSize;
        switch (animation.phase) {
            case 'entry':
                baseOpacity = animation.progress;
                baseSize = this.size * (0.2 + 0.8 * animation.progress);
                break;
            case 'exit':
                baseOpacity = animation.progress;
                baseSize = this.size * (1 + 0.2 * (1 - animation.progress));
                break;
            default:
                baseOpacity = 1;
                baseSize = this.size;
        }

        // Draw particles
        this.updateAndDrawParticles(ctx, baseOpacity);

        // Draw outer glow for shield radius
        const shieldGradient = ctx.createRadialGradient(
            this.x, this.y, baseSize,
            this.x, this.y, this.repulsionRadius
        );
        shieldGradient.addColorStop(0, `rgba(0, 255, 255, 0)`);
        shieldGradient.addColorStop(0.3, `rgba(0, 255, 255, ${baseOpacity * 0.1})`);
        shieldGradient.addColorStop(1, `rgba(0, 255, 255, 0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.repulsionRadius, 0, Math.PI * 2);
        ctx.fillStyle = shieldGradient;
        ctx.fill();

        // Create a pulsing effect
        const pulseIntensity = animation.phase === 'active' ? 0.1 : 0.2;
        const pulseSize = baseSize * (1 + Math.sin(Date.now() / 200) * pulseIntensity);

        // Draw shield core with enhanced glow
        const coreGradient = ctx.createRadialGradient(
            this.x, this.y, pulseSize * 0.5,
            this.x, this.y, pulseSize
        );
        coreGradient.addColorStop(0, `rgba(0, 255, 255, ${baseOpacity * 0.7})`);
        coreGradient.addColorStop(0.7, `rgba(0, 255, 255, ${baseOpacity * 0.3})`);
        coreGradient.addColorStop(1, `rgba(0, 255, 255, 0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();

        // Draw inner shield with bright center
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${baseOpacity * 0.9})`;
        ctx.fill();

        // Add a bright center point
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 0.7})`;
        ctx.fill();
    }

    updateAndDrawParticles(ctx, baseOpacity) {
        for (let particle of this.particles) {
            // Update particle position
            particle.angle += particle.speed;

            // Calculate particle position
            const x = this.x + Math.cos(particle.angle) * particle.distance;
            const y = this.y + Math.sin(particle.angle) * particle.distance;

            // Draw particle
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${baseOpacity * 0.8})`;
            ctx.fill();

            // Draw particle trail
            const gradient = ctx.createLinearGradient(
                x, y,
                x - Math.cos(particle.angle) * 10,
                y - Math.sin(particle.angle) * 10
            );
            gradient.addColorStop(0, `rgba(0, 255, 255, ${baseOpacity * 0.6})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = particle.size;
            ctx.moveTo(x, y);
            ctx.lineTo(
                x - Math.cos(particle.angle) * 10,
                y - Math.sin(particle.angle) * 10
            );
            ctx.stroke();
        }
    }

    isActive() {
        return Date.now() - this.createTime < this.activeTime;
    }

    containsPoint(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= this.size;
    }

    healPlayer(player) {
        const now = Date.now();
        const deltaTime = (now - this.lastHealTime) / 1000; // Convert to seconds
        const healAmount = this.healRate * deltaTime;

        player.currentHealth = Math.min(player.maxHealth, player.currentHealth + healAmount);
        this.lastHealTime = now;
    }

    handleEnemy(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Destroy enemies that get too close
        if (distance < this.destructionRadius) {
            return true; // Enemy should be destroyed
        }

        // Repel enemies within the repulsion radius
        if (distance < this.repulsionRadius) {
            const angle = Math.atan2(dy, dx);
            const repulsionStrength = (this.repulsionRadius - distance) / this.repulsionRadius;

            enemy.x += Math.cos(angle) * this.repulsionForce * repulsionStrength;
            enemy.y += Math.sin(angle) * this.repulsionForce * repulsionStrength;
        }

        return false; // Enemy survives
    }

    handlePlayer(player) {
        if (this.containsPoint(player.x, player.y)) {
            // Play portal sound effect if available
            if (window.game && window.game.soundManager && 
                typeof window.game.soundManager.playSound === 'function') {
                try {
                    window.game.soundManager.playSound('portalActivate', 0.4);
                } catch (error) {
                    console.warn('Could not play portal sound effect:', error);
                }
            }
            // Heal player
            this.healPlayer(player);
        }
    }
}