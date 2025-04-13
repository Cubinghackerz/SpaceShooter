class StarMap {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.createMapModal();
        this.stars = [];
        this.discoveredRegions = new Set();
        this.currentRegion = { x: 0, y: 0 };
        this.regionSize = 200;
        this.starDensity = 0.0001; // Stars per pixel squared
        this.animationProgress = 0;
        this.lastFrameTime = 0;
        this.isAnimating = false;
    }

    createMapModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'star-map-modal';
        this.modal.innerHTML = `
            <div class="star-map-content">
                <h3>Star Map Visualization</h3>
                <canvas id="starMapCanvas"></canvas>
                <div class="map-legend">
                    <div class="legend-item">
                        <span class="discovered-region"></span> Explored Space
                    </div>
                    <div class="legend-item">
                        <span class="current-region"></span> Current Location
                    </div>
                    <div class="legend-item">
                        <span class="unexplored-region"></span> Unexplored Space
                    </div>
                </div>
                <p class="text-info mt-2">Click regions to mark them as explored</p>
                <p class="text-muted mt-1">Press 'M' to close the map</p>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.canvas = this.modal.querySelector('#starMapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Add click event listener for region selection
        this.canvas.addEventListener('click', (e) => this.handleMapClick(e));
    }

    resizeCanvas() {
        this.canvas.width = 1000;
        this.canvas.height = 800;
        this.generateStars();
    }

    generateStars() {
        this.stars = [];
        const totalStars = Math.floor(this.canvas.width * this.canvas.height * this.starDensity);
        
        for (let i = 0; i < totalStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
    }

    show() {
        this.visible = true;
        this.modal.style.display = 'block';
        this.modal.classList.add('visible');
        this.startAnimation();
    }

    hide() {
        this.visible = false;
        this.modal.classList.remove('visible');
        setTimeout(() => {
            if (!this.visible) {
                this.modal.style.display = 'none';
            }
        }, 300);
        this.animationProgress = 0;
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    startAnimation() {
        this.isAnimating = true;
        this.animationProgress = 0;
        this.lastFrameTime = performance.now();
        this.animate();
    }

    animate(currentTime = performance.now()) {
        if (!this.isAnimating) return;

        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.animationProgress = Math.min(1, this.animationProgress + deltaTime * 0.002);
        this.draw();

        if (this.animationProgress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.isAnimating = false;
        }
    }

    handleMapClick(event) {
        // Navigation functionality has been disabled
        // This is now just a visualization map
        
        // Just add the clicked region to discovered for visualization purposes
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert click coordinates to region coordinates
        const regionX = Math.floor(x / this.regionSize);
        const regionY = Math.floor(y / this.regionSize);
        
        // Simply add the region to discovered for visualization
        if (this.isRegionAccessible(regionX, regionY)) {
            this.discoveredRegions.add(`${regionX},${regionY}`);
            this.draw();
        }
    }

    isRegionAccessible(x, y) {
        // Check if the region is adjacent to current region or discovered
        const isAdjacent = Math.abs(x - this.currentRegion.x) <= 1 && 
                          Math.abs(y - this.currentRegion.y) <= 1;
        return isAdjacent || this.discoveredRegions.has(`${x},${y}`);
    }

    drawRegion(x, y, isDiscovered, isCurrent) {
        const regionX = x * this.regionSize;
        const regionY = y * this.regionSize;

        this.ctx.save();
        
        if (isCurrent) {
            // Draw current region with highlight
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
        } else if (isDiscovered) {
            // Draw discovered region
            this.ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
            this.ctx.strokeStyle = '#0088ff';
            this.ctx.lineWidth = 2;
        } else {
            // Draw unexplored region with fog effect
            this.ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 1;
        }

        this.ctx.fillRect(regionX, regionY, this.regionSize, this.regionSize);
        this.ctx.strokeRect(regionX, regionY, this.regionSize, this.regionSize);
        
        // Add nebula effect for discovered regions
        if (isDiscovered) {
            const gradient = this.ctx.createRadialGradient(
                regionX + this.regionSize/2, regionY + this.regionSize/2, 0,
                regionX + this.regionSize/2, regionY + this.regionSize/2, this.regionSize/2
            );
            gradient.addColorStop(0, 'rgba(0, 100, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(regionX, regionY, this.regionSize, this.regionSize);
        }

        this.ctx.restore();
    }

    draw() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background stars with parallax effect
        this.ctx.save();
        this.ctx.globalAlpha = this.animationProgress;
        this.stars.forEach(star => {
            const gradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.size
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();

        // Draw regions
        const regionsX = Math.ceil(this.canvas.width / this.regionSize);
        const regionsY = Math.ceil(this.canvas.height / this.regionSize);

        for (let x = 0; x < regionsX; x++) {
            for (let y = 0; y < regionsY; y++) {
                const isDiscovered = this.discoveredRegions.has(`${x},${y}`);
                const isCurrent = this.currentRegion.x === x && this.currentRegion.y === y;
                this.drawRegion(x, y, isDiscovered, isCurrent);
            }
        }
    }
}
