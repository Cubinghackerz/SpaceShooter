class UpgradeTree {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.createTreeModal();
        this.nodeRadius = 30;
        this.levelSpacing = 150;
        this.horizontalSpacing = 250;
        this.animationProgress = 0;
        this.lastFrameTime = 0;
        this.isAnimating = false;
    }

    createTreeModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'upgrade-tree-modal';
        this.modal.innerHTML = `
            <div class="upgrade-tree-content">
                <h3>Ship Upgrade Path</h3>
                <canvas id="upgradeTreeCanvas"></canvas>
                <div class="tree-legend">
                    <div class="legend-item">
                        <span class="current-node"></span> Current Ship
                    </div>
                    <div class="legend-item">
                        <span class="available-node"></span> Available Upgrade
                    </div>
                    <div class="legend-item">
                        <span class="locked-node"></span> Locked
                    </div>
                </div>
                <p class="text-muted mt-3">Press 'V' again to close</p>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.canvas = this.modal.querySelector('#upgradeTreeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    show() {
        this.visible = true;
        this.modal.style.display = 'block';
        this.modal.classList.add('visible');
        this.game.paused = true;
        this.resizeCanvas();
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
        this.game.paused = false;
        this.animationProgress = 0;
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    resizeCanvas() {
        this.canvas.width = 1200;
        this.canvas.height = 800;
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
        this.drawTree();

        if (this.animationProgress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.isAnimating = false;
        }
    }

    drawConnection(startX, startY, endX, endY, isCurrentPath, progress = 1) {
        const dx = endX - startX;
        const dy = endY - startY;

        // Calculate control points for curved lines
        const midY = startY + dy * 0.5;
        const cp1x = startX;
        const cp1y = midY;
        const cp2x = endX;
        const cp2y = midY;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);

        // Calculate current end point based on progress
        const currentEndX = startX + dx * progress;
        const currentEndY = startY + dy * progress;

        // Draw bezier curve
        this.ctx.bezierCurveTo(
            cp1x, cp1y * progress,
            cp2x * progress, cp2y * progress,
            currentEndX, currentEndY
        );

        if (isCurrentPath) {
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 4;
        } else {
            this.ctx.shadowColor = '#666';
            this.ctx.shadowBlur = 8;
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
        }

        this.ctx.stroke();
        this.ctx.restore();
    }

    drawNode(x, y, shipType, isCurrent, isAvailable, progress = 1) {
        // Create gradient for node
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.nodeRadius);

        if (isCurrent) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(0.6, '#00aa00');
            gradient.addColorStop(1, '#004400');
        } else if (isAvailable) {
            gradient.addColorStop(0, '#0088ff');
            gradient.addColorStop(0.6, '#0044aa');
            gradient.addColorStop(1, '#002244');
        } else {
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(0.6, '#444');
            gradient.addColorStop(1, '#222');
        }

        // Draw node background glow
        this.ctx.save();
        if (isCurrent || isAvailable) {
            this.ctx.shadowColor = isCurrent ? '#00ff00' : '#0088ff';
            this.ctx.shadowBlur = 20;
        }

        // Draw node circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.nodeRadius * progress, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.restore();

        // Draw ship preview
        const previewShip = new ShipType(shipType);
        this.ctx.save();
        this.ctx.globalAlpha = progress;
        this.ctx.translate(x, y);
        this.ctx.scale(0.5, 0.5);
        previewShip.draw(this.ctx, 0, 0, 0);
        this.ctx.restore();

        // Draw ship name
        this.ctx.save();
        this.ctx.globalAlpha = progress;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(previewShip.name, x, y + this.nodeRadius + 25);
        this.ctx.restore();
    }

    drawTree() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const currentType = this.game.player.shipType.type;
        const upgradePaths = ShipType.getUpgradePaths();

        // Calculate starting position
        const startX = this.canvas.width / 2;
        const startY = 100;

        // Draw the current ship as the root
        this.drawNode(startX, startY, currentType, true, true, this.animationProgress);

        // Get available upgrades for the current ship
        const availableUpgrades = upgradePaths[currentType] || [];
        const spacing = this.horizontalSpacing * 0.8;

        // Draw available upgrades
        availableUpgrades.forEach((upgradeType, index) => {
            const x = startX + (index - (availableUpgrades.length - 1) / 2) * spacing;
            const y = startY + this.levelSpacing;

            // Draw connection to upgrade
            this.drawConnection(
                startX, startY,
                x, y,
                true,
                this.animationProgress
            );

            // Draw upgrade node
            this.drawNode(
                x, y,
                upgradeType,
                currentType === upgradeType,
                this.isUpgradeAvailable(upgradeType),
                this.animationProgress
            );

            // Draw subsequent upgrades if available
            const furtherUpgrades = upgradePaths[upgradeType] || [];
            furtherUpgrades.forEach((furtherType, subIndex) => {
                const nextX = x + (subIndex - (furtherUpgrades.length - 1) / 2) * (spacing * 0.7);
                const nextY = y + this.levelSpacing;

                // Draw connection to further upgrade
                this.drawConnection(
                    x, y,
                    nextX, nextY,
                    currentType === upgradeType && this.isUpgradeAvailable(furtherType),
                    this.animationProgress
                );

                // Draw further upgrade node
                this.drawNode(
                    nextX, nextY,
                    furtherType,
                    currentType === furtherType,
                    currentType === upgradeType && this.isUpgradeAvailable(furtherType),
                    this.animationProgress
                );

                // Handle tier 3 upgrades
                const tier3Upgrades = upgradePaths[furtherType] || [];
                tier3Upgrades.forEach((tier3Type, tier3Index) => {
                    const tier3X = nextX + (tier3Index - (tier3Upgrades.length - 1) / 2) * (spacing * 0.6);
                    const tier3Y = nextY + this.levelSpacing;

                    // Draw connection to tier 3 upgrade
                    this.drawConnection(
                        nextX, nextY,
                        tier3X, tier3Y,
                        currentType === furtherType || this.isUpgradeAvailable(tier3Type),
                        this.animationProgress
                    );

                    // Draw tier 3 node
                    this.drawNode(
                        tier3X, tier3Y,
                        tier3Type,
                        currentType === tier3Type,
                        currentType === furtherType || this.isUpgradeAvailable(tier3Type),
                        this.animationProgress
                    );
                });
            });
        });
    }

    isUpgradeAvailable(shipType) {
        const upgradePaths = ShipType.getUpgradePaths();
        const currentType = this.game.player.shipType.type;

        // Direct upgrade check
        if (upgradePaths[currentType] && upgradePaths[currentType].includes(shipType)) {
            return true;
        }

        // Check for tier 2 to tier 3 upgrades
        const currentTypeBase = currentType.split('-')[0];
        const targetTypeBase = shipType.split('-')[0];

        // If current ship is a tier 2 upgrade, check if the target is its tier 3 upgrade
        if (currentType.includes('-') && currentTypeBase === targetTypeBase) {
            // Find the upgrade path that leads to the target
            const tier2Upgrades = Object.entries(upgradePaths)
                .find(([key]) => key.startsWith(currentTypeBase) && key !== currentType);

            if (tier2Upgrades && tier2Upgrades[1].includes(shipType)) {
                return true;
            }
        }

        return false;
    }
}