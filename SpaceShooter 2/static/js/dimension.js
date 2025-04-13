class Dimension {
    constructor(canvas, type = 'normal') {
        this.type = type;
        this.canvas = canvas;
        this.setupDimension();
        
        // Pre-generate particles for better performance
        this.particlePositions = [];
        this.generateParticles();
    }

    generateParticles() {
        // Pre-generate particle positions for all dimensions
        // This improves performance by avoiding random generation on each frame
        for (let i = 0; i < 60; i++) {
            this.particlePositions.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.1
            });
        }
    }

    setupDimension() {
        switch(this.type) {
            case 'void':
                this.bgColor = 'rgba(76, 29, 149, 0.3)'; // Dark purple
                this.gridColor = 'rgba(167, 139, 250, 0.2)';
                this.portalColor = '#a78bfa';
                this.playerColor = '#34d399'; // Emerald
                this.projectileColor = '#f0fdf4';
                this.enemyColor = '#f87171';
                break;
            case 'lunar':
                this.bgColor = 'rgba(23, 37, 84, 0.9)'; // Deep blue for lunar
                this.gridColor = 'rgba(199, 210, 254, 0.15)';
                this.portalColor = '#818cf8';
                this.playerColor = '#93c5fd'; // Light blue
                this.projectileColor = '#dbeafe';
                this.enemyColor = '#7f1d1d'; // Dark red
                break;
            case 'radiant':
                this.bgColor = 'rgba(185, 28, 28, 0.3)'; // Dark red background for radiant
                this.gridColor = 'rgba(254, 202, 202, 0.2)';
                this.portalColor = '#f87171';
                this.playerColor = '#fcd34d'; // Amber
                this.projectileColor = '#fef3c7';
                this.enemyColor = '#9333ea'; // Purple
                break;
            default: // normal dimension
                this.bgColor = 'rgba(17, 24, 39, 1)'; // Dark background
                this.gridColor = 'rgba(255, 255, 255, 0.1)';
                this.portalColor = '#9333ea';
                this.playerColor = '#00ff00';
                this.projectileColor = '#ffffff';
                this.enemyColor = '#ff0000';
        }
    }

    drawBackground(ctx) {
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        ctx.beginPath();
        const gridSize = 20;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
        }

        ctx.strokeStyle = this.gridColor;
        ctx.stroke();

        // Add dimension-specific effects
        if (this.type === 'void') {
            this.drawVoidEffects(ctx);
        } else if (this.type === 'lunar') {
            this.drawLunarEffects(ctx);
        } else if (this.type === 'radiant') {
            this.drawRadiantEffects(ctx);
        }
    }

    drawVoidEffects(ctx) {
        // Use pre-generated particles for better performance
        const time = Date.now() * 0.001; // Current time in seconds
        
        ctx.save();
        for (let i = 0; i < 50; i++) {
            const particle = this.particlePositions[i];
            
            // Adjust y position with time for a floating effect
            const y = (particle.y + time * particle.speed * 20) % this.canvas.height;
            
            ctx.beginPath();
            ctx.arc(particle.x, y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(167, 139, 250, 0.3)';
            ctx.fill();
        }
        ctx.restore();
    }
    
    drawLunarEffects(ctx) {
        // Draw moon in the background
        ctx.save();
        
        // Large faint glow
        const gradient = ctx.createRadialGradient(
            this.canvas.width * 0.8, this.canvas.height * 0.2, 0,
            this.canvas.width * 0.8, this.canvas.height * 0.2, 100
        );
        gradient.addColorStop(0, 'rgba(224, 231, 255, 0.7)');
        gradient.addColorStop(0.5, 'rgba(224, 231, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(224, 231, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.canvas.width * 0.8, this.canvas.height * 0.2, 100, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon surface
        ctx.fillStyle = 'rgba(224, 231, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.canvas.width * 0.8, this.canvas.height * 0.2, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon craters
        ctx.fillStyle = 'rgba(190, 198, 227, 0.8)';
        ctx.beginPath();
        ctx.arc(this.canvas.width * 0.78, this.canvas.height * 0.18, 10, 0, Math.PI * 2);
        ctx.arc(this.canvas.width * 0.83, this.canvas.height * 0.22, 8, 0, Math.PI * 2);
        ctx.arc(this.canvas.width * 0.76, this.canvas.height * 0.25, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Stars in the background (using pre-generated particles)
        const time = Date.now() * 0.0005; // Slower time factor for twinkling
        
        for (let i = 0; i < 40; i++) {
            const particle = this.particlePositions[i];
            const twinkle = Math.sin(time + i) * 0.3 + 0.7; // Value between 0.4 and 1.0
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.8 * twinkle, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(224, 231, 255, ${0.4 + twinkle * 0.6})`; // Twinkling effect
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawRadiantEffects(ctx) {
        // Create a pulsing radiant effect
        ctx.save();
        
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 2) * 0.2 + 0.8; // Pulsing factor (0.6 to 1.0)
        
        // Radiant glow in the center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 200 * pulse;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(254, 202, 202, 0.4)');
        gradient.addColorStop(0.5, 'rgba(254, 202, 202, 0.1)');
        gradient.addColorStop(1, 'rgba(254, 202, 202, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy particles
        for (let i = 10; i < 40; i++) {
            const particle = this.particlePositions[i];
            
            // Calculate position relative to center, with time-based movement
            const angle = time * particle.speed + (i * Math.PI * 2 / 30);
            const distance = 100 + 50 * Math.sin(time * 0.5 + i) * pulse;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            ctx.beginPath();
            ctx.arc(x, y, particle.size * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(254, 202, 202, 0.6)';
            ctx.fill();
        }
        
        ctx.restore();
    }
}