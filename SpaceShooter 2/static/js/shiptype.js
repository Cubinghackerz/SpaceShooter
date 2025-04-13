class ShipType {
    constructor(type, tier = 1) {
        this.type = type;
        this.tier = tier;
        this.setProperties();

        // Animation properties
        this.recoilDistance = 0;
        this.maxRecoilDistance = 5;
        this.recoilSpeed = 0.5;
        this.isRecoiling = false;
        this.flashOpacity = 0;
        this.lastShootTime = 0;
    }

    setProperties() {
        // Base properties based on type
        const baseProps = this.getBaseProperties();

        // Apply tier multipliers
        const tierMultiplier = 1 + (this.tier - 1) * 0.3; // 30% increase per tier

        this.shootDelay = Math.max(50, baseProps.shootDelay / tierMultiplier);
        this.projectileSpeed = baseProps.projectileSpeed * tierMultiplier;
        this.projectileSize = baseProps.projectileSize * tierMultiplier;
        this.damage = baseProps.damage * tierMultiplier;
        this.color = baseProps.color;
        this.shape = baseProps.shape;
        this.name = baseProps.name;
    }

    getBaseProperties() {
        switch(this.type) {
            case 'default-advanced':
                return {
                    shootDelay: 180,
                    projectileSpeed: 12,
                    projectileSize: 4,
                    damage: 1.5,
                    color: '#33ff33',
                    name: 'Advanced Scout',
                    shape: [
                        [25, 0],
                        [-22, -22],
                        [-22, 22]
                    ]
                };
            case 'default-elite':
                return {
                    shootDelay: 160,
                    projectileSpeed: 14,
                    projectileSize: 5,
                    damage: 2,
                    color: '#66ff66',
                    name: 'Elite Scout',
                    shape: [
                        [30, 0],
                        [-25, -25],
                        [-25, 25]
                    ]
                };
            case 'sniper':
                return {
                    shootDelay: 800,
                    projectileSpeed: 15,
                    projectileSize: 2,
                    damage: 3,
                    color: '#00ff88',
                    name: 'Sniper',
                    shape: [
                        [20, 0],
                        [-10, -8],
                        [-5, 0],
                        [-10, 8]
                    ]
                };
            case 'sniper-burst':
                return {
                    shootDelay: 1000,
                    projectileSpeed: 18,
                    projectileSize: 2,
                    damage: 4,
                    color: '#00ff99',
                    name: 'Burst Sniper',
                    shape: [
                        [25, 0],
                        [-10, -10],
                        [-5, 0],
                        [-10, 10]
                    ]
                };
            case 'sniper-precision':
                return {
                    shootDelay: 1200,
                    projectileSpeed: 22,
                    projectileSize: 3,
                    damage: 6,
                    color: '#00ffaa',
                    name: 'Precision Sniper',
                    shape: [
                        [30, 0],
                        [-12, -12],
                        [-6, 0],
                        [-12, 12]
                    ]
                };
            case 'quasar':
                return {
                    shootDelay: 150,
                    projectileSpeed: 8,
                    projectileSize: 3,
                    damage: 0.5,
                    color: '#00ffff',
                    name: 'Quasar',
                    shape: [
                        [15, 0],
                        [-10, -12],
                        [-5, 0],
                        [-10, 12]
                    ]
                };
            case 'quasar-pulse':
                return {
                    shootDelay: 100,
                    projectileSpeed: 10,
                    projectileSize: 4,
                    damage: 0.7,
                    color: '#66ffff',
                    name: 'Pulse Quasar',
                    shape: [
                        [18, 0],
                        [-12, -15],
                        [-6, 0],
                        [-12, 15]
                    ]
                };
            case 'quasar-storm':
                return {
                    shootDelay: 80,
                    projectileSpeed: 12,
                    projectileSize: 5,
                    damage: 1,
                    color: '#99ffff',
                    name: 'Storm Quasar',
                    shape: [
                        [22, 0],
                        [-15, -18],
                        [-8, 0],
                        [-15, 18]
                    ]
                };
            case 'heavy':
                return {
                    shootDelay: 1200,
                    projectileSpeed: 6,
                    projectileSize: 8,
                    damage: 4,
                    color: '#ffaa00',
                    name: 'Heavy',
                    shape: [
                        [15, 0],
                        [-15, -15],
                        [-10, 0],
                        [-15, 15]
                    ]
                };
            case 'heavy-siege':
                return {
                    shootDelay: 1500,
                    projectileSpeed: 5,
                    projectileSize: 10,
                    damage: 6,
                    color: '#ffcc00',
                    name: 'Siege Heavy',
                    shape: [
                        [18, 0],
                        [-18, -18],
                        [-12, 0],
                        [-18, 18]
                    ]
                };
            case 'heavy-fortress':
                return {
                    shootDelay: 2000,
                    projectileSpeed: 4,
                    projectileSize: 12,
                    damage: 8,
                    color: '#ffdd00',
                    name: 'Fortress Heavy',
                    shape: [
                        [22, 0],
                        [-22, -22],
                        [-15, 0],
                        [-22, 22]
                    ]
                };
            default: // Default ship (Scout)
                return {
                    shootDelay: 200,
                    projectileSpeed: 10,
                    projectileSize: 3,
                    damage: 1,
                    color: '#00ff00',
                    name: 'Scout',
                    shape: [
                        [20, 0],
                        [-20, -20],
                        [-20, 20]
                    ]
                };
        }
    }

    static getUpgradePaths() {
        return {
            'default': ['default-advanced', 'sniper', 'quasar', 'heavy'],
            'default-advanced': ['default-elite'],
            'default-elite': [],
            'sniper': ['sniper-burst'],
            'sniper-burst': ['sniper-precision'],
            'sniper-precision': [],
            'quasar': ['quasar-pulse'],
            'quasar-pulse': ['quasar-storm'],
            'quasar-storm': [],
            'heavy': ['heavy-siege'],
            'heavy-siege': ['heavy-fortress'],
            'heavy-fortress': []
        };
    }

    triggerShootAnimation() {
        this.isRecoiling = true;
        this.recoilDistance = this.maxRecoilDistance;
        this.flashOpacity = 1;
        this.lastShootTime = Date.now();
    }

    updateAnimation() {
        // Update recoil
        if (this.isRecoiling) {
            this.recoilDistance = Math.max(0, this.recoilDistance - this.recoilSpeed);
            if (this.recoilDistance === 0) {
                this.isRecoiling = false;
            }
        }

        // Update muzzle flash
        if (this.flashOpacity > 0) {
            this.flashOpacity = Math.max(0, this.flashOpacity - 0.1);
        }
    }

    draw(ctx, x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Apply recoil transform
        if (this.recoilDistance > 0) {
            ctx.translate(-this.recoilDistance, 0);
        }
        
        // Check for themed color
        let shipColor = this.color;
        
        // Get theme color if available through the player object or cosmic theme selector
        if (window.game && window.game.player && window.game.player.color) {
            shipColor = window.game.player.color;
        } else if (window.cosmicThemeSelector) {
            const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
            if (currentTheme && currentTheme.playerColor) {
                shipColor = currentTheme.playerColor;
            }
        }
        
        // Check if performance mode is active
        const isPerformanceMode = window.game && window.game.performanceMode;
        
        // Draw ship body
        ctx.beginPath();
        ctx.moveTo(this.shape[0][0], this.shape[0][1]);
        for (let i = 1; i < this.shape.length; i++) {
            ctx.lineTo(this.shape[i][0], this.shape[i][1]);
        }
        ctx.closePath();
        ctx.fillStyle = shipColor;
        ctx.fill();

        // Draw muzzle flash with theme colors
        if (this.flashOpacity > 0) {
            // Convert ship color to RGB values for flash effects
            const hexToRgb = (hex) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return [r, g, b];
            };
            
            // Get colors based on ship color and theme
            const rgbShipColor = hexToRgb(shipColor);
            
            // Skip complex flash rendering in extreme performance mode
            const flashSize = isPerformanceMode ? 12 : 15;
            
            // Create a theme-colored muzzle flash
            const gradient = ctx.createRadialGradient(
                this.shape[0][0] + 5, 0, 0,
                this.shape[0][0] + 5, 0, flashSize
            );
            
            // White center core is same for all themes
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.flashOpacity})`);
            
            // Middle color based on ship color and ship type
            const middleColor = this.type === 'heavy' 
                ? `rgba(${rgbShipColor[0]}, ${Math.min(rgbShipColor[1] + 50, 255)}, ${Math.min(rgbShipColor[2] + 100, 255)}, ${this.flashOpacity * 0.6})` 
                : `rgba(${Math.min(rgbShipColor[0] + 50, 255)}, ${rgbShipColor[1]}, ${rgbShipColor[2]}, ${this.flashOpacity * 0.6})`;
            
            gradient.addColorStop(0.5, middleColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            // Draw flash with possibly reduced size in performance mode
            ctx.beginPath();
            ctx.arc(this.shape[0][0] + 5, 0, flashSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        ctx.restore();

        // Update animation state
        this.updateAnimation();
    }
}