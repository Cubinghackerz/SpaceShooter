class SafeZone {
    constructor(canvas) {
        this.size = 100;
        this.duration = 5000; // 5 seconds in milliseconds
        this.createTime = Date.now();
        
        // Random position within canvas bounds
        this.x = Math.random() * (canvas.width - this.size * 2) + this.size;
        this.y = Math.random() * (canvas.height - this.size * 2) + this.size;
        
        // Play safe zone activation sound if available
        if (window.game && window.game.soundManager && 
            typeof window.game.soundManager.playSound === 'function') {
            try {
                window.game.soundManager.playSound('safeZoneActivate', 0.5);
            } catch (error) {
                console.warn('Could not play safe zone sound effect:', error);
            }
        }
    }

    draw(ctx) {
        const timeLeft = (this.createTime + this.duration - Date.now()) / this.duration;
        if (timeLeft <= 0) return;

        // Draw safe zone with fading effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${timeLeft * 0.2})`; // Cyan with fading opacity
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 255, 255, ${timeLeft * 0.8})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    isActive() {
        return Date.now() - this.createTime < this.duration;
    }

    containsPoint(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= this.size;
    }
}
