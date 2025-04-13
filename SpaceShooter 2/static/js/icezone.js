class IceZone {
    constructor(canvas) {
        this.duration = 20000; // 20 seconds
        this.createTime = Date.now();
        
        // Randomly select one quarter of the screen
        this.quarter = Math.floor(Math.random() * 4);
        this.x = this.quarter % 2 === 0 ? 0 : canvas.width / 2;
        this.y = this.quarter < 2 ? 0 : canvas.height / 2;
        this.width = canvas.width / 2;
        this.height = canvas.height / 2;
        
        // Visual properties
        this.opacity = 0.3;
    }

    draw(ctx) {
        const timeLeft = (this.createTime + this.duration - Date.now()) / this.duration;
        if (timeLeft <= 0) return;

        // Create ice effect gradient
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + this.width, this.y + this.height
        );
        gradient.addColorStop(0, `rgba(200, 232, 255, ${timeLeft * this.opacity})`);
        gradient.addColorStop(0.5, `rgba(147, 197, 253, ${timeLeft * this.opacity})`);
        gradient.addColorStop(1, `rgba(200, 232, 255, ${timeLeft * this.opacity})`);

        // Draw ice zone
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw crystalline patterns
        this.drawCrystalPatterns(ctx, timeLeft);
    }

    drawCrystalPatterns(ctx, timeLeft) {
        const patternCount = 8;
        ctx.strokeStyle = `rgba(255, 255, 255, ${timeLeft * 0.4})`;
        ctx.lineWidth = 1;

        for (let i = 0; i < patternCount; i++) {
            const x = this.x + (Math.sin(Date.now() / 1000 + i) + 1) * this.width / 2;
            const y = this.y + (Math.cos(Date.now() / 1000 + i) + 1) * this.height / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let j = 0; j < 3; j++) {
                const angle = (Math.PI * 2 * j) / 3;
                ctx.lineTo(
                    x + Math.cos(angle) * 30,
                    y + Math.sin(angle) * 30
                );
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    isActive() {
        return Date.now() - this.createTime < this.duration;
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    applySlipperyPhysics(object, keys) {
        // Only apply if not in a portal safe zone
        if (!object.inPortalSafeZone) {
            // Add momentum-based movement
            if (!object.momentum) {
                object.momentum = { x: 0, y: 0 };
            }

            const friction = 0.98;
            const acceleration = 0.2;

            // Update momentum based on input
            if (keys) {
                if (keys.ArrowLeft || keys.a) object.momentum.x -= acceleration;
                if (keys.ArrowRight || keys.d) object.momentum.x += acceleration;
                if (keys.ArrowUp || keys.w) object.momentum.y -= acceleration;
                if (keys.ArrowDown || keys.s) object.momentum.y += acceleration;
            }

            // Apply momentum
            object.x += object.momentum.x;
            object.y += object.momentum.y;

            // Apply friction
            object.momentum.x *= friction;
            object.momentum.y *= friction;
        }
    }
}
