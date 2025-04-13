class UpgradeSystem {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.upgrades = {
            speed: {
                level: 0,
                maxLevel: 5,
                basePrice: 1000,
                getName: () => 'Movement Speed',
                getEffect: (level) => level * 0.25,
                getPrice: (level) => Math.floor(this.upgrades.speed.basePrice * Math.pow(1.5, level))
            },
            fireRate: {
                level: 0,
                maxLevel: 5,
                basePrice: 1500,
                getName: () => 'Fire Rate',
                getEffect: (level) => level * 20, // Reduces shootDelay by 20ms per level
                getPrice: (level) => Math.floor(this.upgrades.fireRate.basePrice * Math.pow(1.5, level))
            },
            projectileSize: {
                level: 0,
                maxLevel: 3,
                basePrice: 2000,
                getName: () => 'Projectile Size',
                getEffect: (level) => level * 1, // Increases projectile radius
                getPrice: (level) => Math.floor(this.upgrades.projectileSize.basePrice * Math.pow(2, level))
            },
            durability: {
                level: 0,
                maxLevel: 2,
                basePrice: 3000,
                getName: () => 'Durability',
                getEffect: (level) => level + 1, // Level 1: 2 HP, Level 2: 3 HP
                getPrice: (level) => Math.floor(this.upgrades.durability.basePrice * Math.pow(2, level))
            },
            regeneration: {
                level: 0,
                maxLevel: 3,
                basePrice: 2500,
                getName: () => 'Health Regen',
                getEffect: (level) => level * 0.1, // 0.1 health per second per level
                getPrice: (level) => Math.floor(this.upgrades.regeneration.basePrice * Math.pow(2, level))
            }
        };

        this.createUpgradePanel();
    }

    createUpgradePanel() {
        const panel = document.createElement('div');
        panel.className = 'upgrade-panel';
        document.body.appendChild(panel);  // Append to body instead of game container

        // Add header
        const header = document.createElement('h4');
        header.className = 'text-light mb-3';
        header.textContent = 'Upgrades';
        panel.appendChild(header);

        // Create upgrade buttons
        Object.entries(this.upgrades).forEach(([type, upgrade]) => {
            const button = document.createElement('button');
            button.className = 'upgrade-button btn btn-outline-info';
            button.dataset.upgradeType = type;
            this.updateButtonText(button, type, upgrade);

            button.addEventListener('click', () => this.purchaseUpgrade(type));
            panel.appendChild(button);
        });
    }

    updateButtonText(button, type, upgrade) {
        const price = upgrade.getPrice(upgrade.level);
        const maxedOut = upgrade.level >= upgrade.maxLevel;
        const effect = upgrade.getEffect(upgrade.level);
        const nextEffect = upgrade.getEffect(upgrade.level + 1);

        let effectText = '';
        switch(type) {
            case 'speed':
                effectText = `Speed: +${effect.toFixed(2)} → +${nextEffect.toFixed(2)}`;
                break;
            case 'fireRate':
                effectText = `Rate: -${effect}ms → -${nextEffect}ms`;
                break;
            case 'projectileSize':
                effectText = `Size: +${effect} → +${nextEffect}`;
                break;
            case 'durability':
                effectText = `HP: ${effect + 1} → ${nextEffect + 1}`;
                break;
            case 'regeneration':
                effectText = `Regen: ${(effect * 100).toFixed(0)}% → ${(nextEffect * 100).toFixed(0)}%`;
                break;
        }

        button.innerHTML = `
            ${upgrade.getName()}<br>
            Level: ${upgrade.level}/${upgrade.maxLevel}<br>
            ${maxedOut ? 'MAXED' : `${effectText}<br>Cost: ${price} points`}
        `;
        button.disabled = maxedOut || this.game.score < price;
    }

    purchaseUpgrade(type) {
        const upgrade = this.upgrades[type];
        const price = upgrade.getPrice(upgrade.level);

        if (this.game.score >= price && upgrade.level < upgrade.maxLevel) {
            // Get the button element for animation
            const button = document.querySelector(`.upgrade-button[data-upgrade-type="${type}"]`);
            
            // Apply purchase animation
            if (button) {
                button.classList.add('upgrade-button-pulse');
                setTimeout(() => button.classList.remove('upgrade-button-pulse'), 600);
            }
            
            this.game.score -= price;
            upgrade.level++;

            // Apply upgrade effects
            switch(type) {
                case 'speed':
                    // Apply the speed effect correctly
                    // Base speed is 3.25, then add the upgrade effect
                    this.player.speed = 3.25 + upgrade.getEffect(upgrade.level);
                    break;
                case 'fireRate':
                    if (this.player.shipType) {
                        const baseDelay = this.player.shipType.getBaseProperties().shootDelay;
                        const tierMultiplier = 1 + (this.player.shipType.tier - 1) * 0.3;
                        // Apply both tier and upgrade effects
                        // Make sure we're applying the current level's effect after the upgrade
                        this.player.shipType.shootDelay = Math.max(50, 
                            (baseDelay - upgrade.getEffect(upgrade.level)) / tierMultiplier);
                    }
                    break;
                case 'projectileSize':
                    if (this.player.shipType) {
                        // Get the upgrade effect and apply it correctly
                        // Instead of incrementing by a fixed amount, use the actual effect value
                        this.player.shipType.projectileSize = this.player.shipType.getBaseProperties().projectileSize * 
                            (1 + (this.player.shipType.tier - 1) * 0.3) + upgrade.getEffect(upgrade.level);
                    }
                    break;
                case 'durability':
                    const newHealth = upgrade.getEffect(upgrade.level) + 1;
                    this.player.maxHealth = newHealth;
                    this.player.currentHealth = newHealth; // Heal to new max health
                    break;
                case 'regeneration':
                    this.player.regenRate = upgrade.getEffect(upgrade.level);
                    break;
            }

            // Play upgrade sound
            if (this.game.soundManager) {
                // Pass the ship type to the sound manager for specialized sounds
                if (this.player.shipType) {
                    this.game.soundManager.playUpgradeSound(this.player.shipType.type);
                } else {
                    this.game.soundManager.playUpgradeSound();
                }
            }

            // Trigger shimmer effect on the player
            this.player.startShimmer();
            
            // Create particle effects for this upgrade
            if (window.upgradeEffects && this.player) {
                window.upgradeEffects.createUpgradeEffect(this.player, type);
            }
            
            // Record ship upgrade for achievement tracking
            if (this.game.achievementSystem) {
                this.game.achievementSystem.recordShipUpgrade();
            }

            // Update UI
            document.getElementById('score').textContent = this.game.score;
            this.updateAllButtons();
        }
    }

    updateAllButtons() {
        const buttons = document.querySelectorAll('.upgrade-button');
        const previouslyDisabled = [];
        
        // First pass: track which buttons were previously disabled
        [...buttons].forEach(button => {
            if (button.disabled) {
                previouslyDisabled.push(button.dataset.upgradeType);
            }
        });
        
        // Second pass: update button texts and check which ones became enabled
        [...buttons].forEach(button => {
            const type = button.dataset.upgradeType;
            if (type) {
                // Remember the previous disabled state
                const wasDisabled = button.disabled;
                
                // Update button text and state
                this.updateButtonText(button, type, this.upgrades[type]);
                
                // If button was previously disabled but now enabled, highlight it
                if (wasDisabled && !button.disabled && this.game.score > 0) {
                    button.classList.add('upgrade-button-pulse');
                    setTimeout(() => button.classList.remove('upgrade-button-pulse'), 600);
                }
            }
        });
    }
}