class Enemy {
    constructor(canvas, isDurable = false, dimension = 'normal', isRadiant = false, reducedEffects = false) {
        // Determine if this is a lunar enemy based on dimension
        const isLunar = dimension === 'lunar';
        
        // Adjust durability based on dimension and special event status
        const dimensionMultiplier = dimension === 'void' ? 2 : 1;
        const radiantMultiplier = isRadiant ? 2 : 1; // Radiant enemies are 2x stronger
        const lunarMultiplier = isLunar ? 3 : 1; // Lunar enemies are 3x stronger (1.5x Radiant enemies)
        
        this.isDurable = isDurable;
        this.isRadiant = isRadiant;
        this.isLunar = isLunar;
        
        // Set reduced effects mode for performance optimization
        this.reducedEffects = reducedEffects;
        
        // Size adjustments based on enemy type
        this.size = (isDurable ? 30 : 20) * 
                   (dimension === 'void' ? 1.2 : 1) * 
                   (isLunar ? 1.1 : 1); // Slightly larger lunar enemies
        
        // Speed adjustments
        this.speed = 0.8 * 
                    (dimension === 'void' ? 0.8 : 1) * 
                    (isRadiant ? 1.2 : 1) * 
                    (isLunar ? 0.9 : 1); // Slightly slower lunar enemies for better performance
        
        // Health calculation with appropriate multipliers
        const baseHealth = isDurable ? 3 : 1;
        this.health = baseHealth * dimensionMultiplier * (isLunar ? lunarMultiplier : (isRadiant ? radiantMultiplier : 1));
        this.initialHealth = this.health; // Store initial health for health bar calculation
        
        // Log health in constructor for debugging
        console.log(`Created enemy with health: ${this.health}, isDurable: ${isDurable}, dimension: ${dimension}, isRadiant: ${isRadiant}, isLunar: ${isLunar}`);
        
        this.dimension = dimension;
        
        // Visual effects
        this.hitEffect = {
            active: false,
            duration: 0,
            maxDuration: 10
        };
        this.pulseEffect = 0;
        this.explosionParticles = [];
        this.glowIntensity = isRadiant ? 0.8 : (isLunar ? 0.6 : 0); // Special glow for each type
        
        // Radiant/Lunar-specific properties
        this.radiantPulse = 0;
        this.radiantPulseSpeed = 0.1;
        this.radiantColorPhase = Math.random() * Math.PI * 2; // Random starting color phase
        this.radiantTrailParticles = [];
        this.lastTrailTime = 0;
        
        // Initialize trail particles array if this is a special enemy
        if (this.isRadiant || this.isLunar) {
            this.radiantTrailParticles = [];
            this.lastTrailTime = Date.now();
        }
        
        // Dynamic properties
        this.wobble = 0;
        this.wobbleSpeed = 0.05 + Math.random() * 0.05;
        this.wobbleIntensity = Math.random() * 3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() * 0.02) - 0.01;
        
        // Void dimension special effects
        this.voidEffectTimer = 0;
        this.voidDistortAmount = 0;
        
        // Initialize feature points for more complex enemy shapes
        this.featurePoints = [];
        const numPoints = isDurable ? 8 : 6;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const distortion = (Math.random() * 0.3) + 0.85;
            this.featurePoints.push({
                angle: angle,
                distance: this.size * distortion,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                pulseIntensity: Math.random() * 0.15
            });
        }

        // Spawn enemy at random position outside the canvas
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: // top
                this.x = Math.random() * canvas.width;
                this.y = -this.size;
                break;
            case 1: // right
                this.x = canvas.width + this.size;
                this.y = Math.random() * canvas.height;
                break;
            case 2: // bottom
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + this.size;
                break;
            case 3: // left
                this.x = -this.size;
                this.y = Math.random() * canvas.height;
                break;
        }
    }

    draw(ctx) {
        try {
            ctx.save();
            
            // Draw trail particles for special enemies
            if (this.isRadiant || this.isLunar) {
                this.drawRadiantTrails(ctx);
            }
            
            // Apply hit glow effect if active
            if (this.hitEffect.active) {
                const hitGlowIntensity = (1 - this.hitEffect.duration / this.hitEffect.maxDuration) * 20;
                if (this.isLunar) {
                    ctx.shadowColor = '#a0a0ff';
                } else {
                    ctx.shadowColor = this.dimension === 'void' ? '#ff1a1a' : '#ff4444';
                }
                ctx.shadowBlur = hitGlowIntensity;
            }
            
            // Apply specific glow based on enemy type
            if (this.isRadiant) {
                // PERFORMANCE OPTIMIZATION: Reduce shadow calculations and intensity
                // Use cached hue value if available
                const hue = this._cachedBaseHue || (Date.now() * 0.1 + this.radiantColorPhase) % 360;
                
                // Use a more efficient shadow with reduced blur
                ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.6)`; // Lower alpha
                ctx.shadowBlur = 8; // Fixed lower value (reduced from 15 + sin variation)
            } else if (this.isLunar) {
                // Lunar enemies have a cooler, blue-tinted glow
                const blueHue = 220 + Math.sin(Date.now() * 0.002) * 20;
                ctx.shadowColor = `hsla(${blueHue}, 80%, 70%, 0.6)`;
                ctx.shadowBlur = 10;
            } else if (this.dimension === 'void') {
                // Void dimension enemies have a permanent subtle glow
                ctx.shadowColor = 'rgba(255, 60, 60, 0.7)';
                ctx.shadowBlur = 8 + Math.sin(this.voidEffectTimer * 0.1) * 4;
            }
            
            // Draw explosion particles first so they appear behind the enemy
            this.drawExplosionParticles(ctx);
            
            // Save context for shape transformations
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Apply wobble effect to void dimension enemies
            if (this.dimension === 'void') {
                this.voidDistortAmount = 0.5 + Math.sin(this.voidEffectTimer * 0.05) * 0.5;
            }
            
            // Enhanced enemy shape with feature points
            this.drawEnemyShape(ctx);
            
            // Draw inner details and patterns
            this.drawEnemyDetails(ctx);
            
            // Draw health bar on top of everything
            ctx.rotate(-this.rotation); // Reset rotation for health bar
            this.drawHealthBar(ctx);
            
            ctx.restore();
        } catch (error) {
            console.error('Error drawing enemy:', error);
        }
    }
    
    drawEnemyShape(ctx) {
        // Base color determination
        let baseHue, baseSaturation, baseLightness;
        
        if (this.isRadiant) {
            // PERFORMANCE OPTIMIZATION: Reduce color calculation frequency
            // Only update colors every 100ms rather than every frame
            const now = Date.now();
            if (!this._lastColorUpdate || now - this._lastColorUpdate > 100) {
                this._lastColorUpdate = now;
                this._cachedBaseHue = (now * 0.1 + this.radiantColorPhase) % 360;
                
                // Update radiant pulse less frequently
                this.radiantPulse += this.radiantPulseSpeed * 3; // Multiply to keep same visual speed
                this._cachedBaseLightness = `${60 + Math.sin(this.radiantPulse) * 15}%`;
            }
            
            // Use cached values instead of recalculating every frame
            baseHue = this._cachedBaseHue || 0;
            baseSaturation = '90%';
            baseLightness = this._cachedBaseLightness || '60%';
        } else if (this.isLunar) {
            // Lunar enemies have a blue-cold themed appearance
            // Cache calculations for performance
            const now = Date.now();
            if (!this._lastLunarUpdate || now - this._lastLunarUpdate > 100) {
                this._lastLunarUpdate = now;
                this.radiantPulse += this.radiantPulseSpeed * 2;
                // Cooler blue shades that shift subtly
                this._cachedLunarHue = 220 + Math.sin(now * 0.001) * 20; // Blue range
                this._cachedLunarLightness = `${50 + Math.sin(this.radiantPulse) * 10}%`;
            }
            
            baseHue = this._cachedLunarHue || 220;
            baseSaturation = '80%';
            baseLightness = this._cachedLunarLightness || '50%';
        } else if (this.dimension === 'void') {
            // Void dimension enemies
            baseHue = 0;
            baseSaturation = '90%';
            baseLightness = `${40 + this.voidDistortAmount * 10}%`;
        } else {
            // Normal enemies
            baseHue = 0;
            baseSaturation = '100%';
            baseLightness = `${45 + this.pulseEffect * 5}%`;
        }
        
        // Adjust for durability
        const durabilityAdjustment = this.isDurable ? '5%' : '0%';
        
        // Calculate final color
        const baseColor = `hsl(${baseHue}, ${baseSaturation}, calc(${baseLightness} - ${durabilityAdjustment}))`;
        
        // Draw the jagged enemy shape
        ctx.beginPath();
        
        // Start at the first feature point
        const initialPoint = this.getFeaturePointPosition(0);
        ctx.moveTo(initialPoint.x, initialPoint.y);
        
        // Connect all feature points
        for (let i = 1; i <= this.featurePoints.length; i++) {
            const point = this.getFeaturePointPosition(i % this.featurePoints.length);
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.closePath();
        
        // Fill with base color
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        // Add a subtle stroke for definition with theme support
        let strokeColor = 'rgba(255, 0, 0, 0.5)'; // Default red stroke
        
        // Check for theme colors
        if (window.cosmicThemeSelector && !this.isRadiant && !this.isLunar) {
            const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
            if (currentTheme && currentTheme.enemyColor) {
                // Convert hex to rgba for stroke
                const hexToRgba = (hex, alpha) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };
                strokeColor = hexToRgba(currentTheme.enemyColor, 0.7);
            }
        } else if (this.dimension === 'void') {
            strokeColor = 'rgba(255, 100, 100, 0.8)';
        }
        
        // Check if performance mode is active
        const isPerformanceMode = window.game && window.game.performanceMode;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isPerformanceMode ? 1 : 1.5; // Thinner stroke in performance mode
        ctx.stroke();
        
        // Add hit effect highlight
        if (this.hitEffect.active) {
            const highlightOpacity = 1 - (this.hitEffect.duration / this.hitEffect.maxDuration);
            ctx.fillStyle = `rgba(255, 255, 255, ${highlightOpacity * 0.7})`;
            ctx.fill();
        }
    }
    
    getFeaturePointPosition(index) {
        if (index >= this.featurePoints.length) index = 0;
        
        const point = this.featurePoints[index];
        const pulseFactor = 1 + Math.sin(this.pulseEffect * point.pulseSpeed * 10) * point.pulseIntensity;
        
        // Apply void dimension distortion
        let distortedDistance = point.distance;
        if (this.dimension === 'void') {
            distortedDistance += Math.sin(this.voidEffectTimer * 0.1 + point.angle * 2) * this.voidDistortAmount * 3;
        }
        
        // Apply hit effect expansion
        if (this.hitEffect.active) {
            const expansionFactor = 1 + (1 - this.hitEffect.duration / this.hitEffect.maxDuration) * 0.2;
            distortedDistance *= expansionFactor;
        }
        
        const finalDistance = distortedDistance * pulseFactor;
        const x = Math.cos(point.angle) * finalDistance;
        const y = Math.sin(point.angle) * finalDistance;
        
        return { x, y };
    }
    
    drawEnemyDetails(ctx) {
        // Draw core
        const coreSize = this.size * 0.5;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
        
        if (this.isLunar) {
            // Lunar dimension has cold blue core
            const pulse = 0.6 + Math.sin(this.radiantPulse * 0.5) * 0.2;
            coreGradient.addColorStop(0, `rgba(100, 150, 255, ${pulse})`);
            coreGradient.addColorStop(0.6, `rgba(50, 100, 200, ${pulse * 0.8})`);
            coreGradient.addColorStop(1, 'rgba(0, 50, 180, 0)');
        } else if (this.dimension === 'void') {
            // Void dimension has pulsing darker core
            const pulse = 0.5 + Math.sin(this.voidEffectTimer * 0.1) * 0.3;
            coreGradient.addColorStop(0, `rgba(180, 20, 20, ${pulse})`);
            coreGradient.addColorStop(0.6, `rgba(140, 0, 0, ${pulse * 0.8})`);
            coreGradient.addColorStop(1, 'rgba(80, 0, 0, 0)');
        } else {
            // Normal dimension has brighter core with theme support
            let coreColor = {
                inner: 'rgba(255, 100, 100, 0.9)',
                middle: 'rgba(255, 50, 50, 0.5)',
                outer: 'rgba(255, 0, 0, 0)'
            };
            
            // Check for theme colors
            if (window.cosmicThemeSelector) {
                const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                if (currentTheme && currentTheme.enemyColor) {
                    // Convert hex to rgba for gradient
                    const hexToRgba = (hex, alpha) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    };
                    
                    // Create themed gradient colors with varying opacity
                    coreColor.inner = hexToRgba(currentTheme.enemyColor, 0.9);
                    coreColor.middle = hexToRgba(currentTheme.enemyColor, 0.5);
                    coreColor.outer = hexToRgba(currentTheme.enemyColor, 0);
                }
            }
            
            // Apply core gradient colors
            coreGradient.addColorStop(0, coreColor.inner);
            coreGradient.addColorStop(0.7, coreColor.middle);
            coreGradient.addColorStop(1, coreColor.outer);
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // Draw energy patterns
        if (this.isDurable || this.dimension === 'void') {
            // Durable enemies and void dimension have internal energy patterns
            const patternCount = this.isDurable ? 3 : 2;
            
            for (let i = 0; i < patternCount; i++) {
                const patternRotation = this.pulseEffect * (i+1) * 0.5;
                const patternSize = (this.size * 0.7) * (1 - i * 0.2);
                
                ctx.save();
                ctx.rotate(patternRotation);
                
                ctx.beginPath();
                ctx.moveTo(0, -patternSize);
                
                // Draw a star-like pattern
                for (let j = 0; j < 5; j++) {
                    const angle = Math.PI * 2 * j / 5;
                    const outerX = Math.sin(angle) * patternSize;
                    const outerY = -Math.cos(angle) * patternSize;
                    
                    const innerAngle = angle + Math.PI / 5;
                    const innerRadius = patternSize * 0.4;
                    const innerX = Math.sin(innerAngle) * innerRadius;
                    const innerY = -Math.cos(innerAngle) * innerRadius;
                    
                    ctx.lineTo(outerX, outerY);
                    ctx.lineTo(innerX, innerY);
                }
                
                ctx.closePath();
                
                // Adjust pattern color based on dimension
                let patternOpacity;
                if (this.dimension === 'void') {
                    patternOpacity = 0.1 + Math.sin(this.voidEffectTimer * 0.1 + i) * 0.05;
                } else {
                    patternOpacity = 0.15 - i * 0.04;
                }
                
                ctx.strokeStyle = this.dimension === 'void' ? 
                    `rgba(255, 150, 150, ${patternOpacity})` : 
                    `rgba(255, 200, 200, ${patternOpacity})`;
                    
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.restore();
            }
        }
        
        // Highlight dot in center for all enemies with theme support
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.1, 0, Math.PI * 2);
        
        // Default highlight color
        let highlightColor = this.dimension === 'void' ? '#fff' : '#ffcccc';
        
        // Check for theme colors for normal enemies
        if (window.cosmicThemeSelector && !this.isRadiant && !this.isLunar && this.dimension !== 'void') {
            const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
            if (currentTheme && currentTheme.enemyColor) {
                // Create lighter version of theme color for highlight
                const hexToRgb = (hex) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return [r, g, b];
                };
                
                // Get base color and lighten it
                const rgb = hexToRgb(currentTheme.enemyColor);
                
                // Create lighter version (add 100 to each component up to 255)
                const lighterRgb = rgb.map(c => Math.min(255, c + 100));
                highlightColor = `rgb(${lighterRgb[0]}, ${lighterRgb[1]}, ${lighterRgb[2]})`;
            }
        }
        
        ctx.fillStyle = highlightColor;
        ctx.fill();
    }
    
    drawHealthBar(ctx) {
        // Draw health bar for durable, lunar, or void dimension enemies
        if ((this.isDurable || this.dimension === 'void' || this.isLunar) && this.health > 1) {
            const healthBarWidth = this.size * 2;
            const healthBarHeight = 4;
            const healthPercentage = this.health / this.initialHealth;
            
            // Bar background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-healthBarWidth/2, -this.size - 8, healthBarWidth, healthBarHeight);
            
            // Health percentage fill
            let healthGradient;
            
            if (this.isLunar) {
                // Cool blue Lunar health bar
                healthGradient = ctx.createLinearGradient(
                    -healthBarWidth/2, 0,
                    -healthBarWidth/2 + healthBarWidth * healthPercentage, 0
                );
                healthGradient.addColorStop(0, '#5599ff');
                healthGradient.addColorStop(1, '#0044cc');
            } else if (this.dimension === 'void') {
                // Pulsing void health bar
                healthGradient = ctx.createLinearGradient(
                    -healthBarWidth/2, 0,
                    -healthBarWidth/2 + healthBarWidth * healthPercentage, 0
                );
                healthGradient.addColorStop(0, '#ff5555');
                healthGradient.addColorStop(1, '#ff0000');
            } else {
                // Normal health bar with theme support
                healthGradient = ctx.createLinearGradient(
                    -healthBarWidth/2, 0,
                    -healthBarWidth/2 + healthBarWidth * healthPercentage, 0
                );
                
                // Default colors
                let lightColor = '#ff4444';
                let darkColor = '#cc0000';
                
                // Check for theme colors
                if (window.cosmicThemeSelector) {
                    const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                    if (currentTheme && currentTheme.enemyColor) {
                        // Convert theme color to HSL for better color control
                        const hexToRgb = (hex) => {
                            const r = parseInt(hex.slice(1, 3), 16) / 255;
                            const g = parseInt(hex.slice(3, 5), 16) / 255;
                            const b = parseInt(hex.slice(5, 7), 16) / 255;
                            return [r, g, b];
                        };
                        
                        const rgbToHsl = (r, g, b) => {
                            const max = Math.max(r, g, b);
                            const min = Math.min(r, g, b);
                            let h, s, l = (max + min) / 2;
                            
                            if (max === min) {
                                h = s = 0; // achromatic
                            } else {
                                const d = max - min;
                                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                                
                                switch (max) {
                                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                                    case g: h = (b - r) / d + 2; break;
                                    case b: h = (r - g) / d + 4; break;
                                }
                                
                                h /= 6;
                            }
                            
                            return [h * 360, s * 100, l * 100];
                        };
                        
                        const hslToHex = (h, s, l) => {
                            h /= 360;
                            s /= 100;
                            l /= 100;
                            let r, g, b;
                          
                            if (s === 0) {
                                r = g = b = l; // achromatic
                            } else {
                                const hue2rgb = (p, q, t) => {
                                    if (t < 0) t += 1;
                                    if (t > 1) t -= 1;
                                    if (t < 1/6) return p + (q - p) * 6 * t;
                                    if (t < 1/2) return q;
                                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                                    return p;
                                };
                                
                                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                                const p = 2 * l - q;
                                r = hue2rgb(p, q, h + 1/3);
                                g = hue2rgb(p, q, h);
                                b = hue2rgb(p, q, h - 1/3);
                            }
                          
                            const toHex = x => {
                                const hex = Math.round(x * 255).toString(16);
                                return hex.length === 1 ? '0' + hex : hex;
                            };
                          
                            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                        };
                        
                        // Get base color in HSL
                        const rgb = hexToRgb(currentTheme.enemyColor);
                        const [h, s, l] = rgbToHsl(...rgb);
                        
                        // Create two variations: brighter and darker with same hue
                        lightColor = hslToHex(h, Math.min(100, s + 15), Math.min(70, l + 20));
                        darkColor = hslToHex(h, Math.min(100, s + 10), Math.max(30, l - 10));
                    }
                }
                
                healthGradient.addColorStop(0, lightColor);
                healthGradient.addColorStop(1, darkColor);
            }
            
            ctx.fillStyle = healthGradient;
            ctx.fillRect(-healthBarWidth/2, -this.size - 8, 
                        healthBarWidth * healthPercentage, healthBarHeight);
            
            // Add health bar border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-healthBarWidth/2, -this.size - 8, healthBarWidth, healthBarHeight);
        }
    }
    
    drawExplosionParticles(ctx) {
        // Skip particles entirely if reduced effects mode is enabled
        if (this.reducedEffects) {
            if (this.explosionParticles.length > 0) {
                // In reduced effects mode, just clear particles as they serve visual purposes only
                this.explosionParticles = [];
            }
            return;
        }
        
        // Performance optimization: limit the number of particles being rendered
        if (this.explosionParticles.length > 50) {
            this.explosionParticles = this.explosionParticles.slice(-30);
        }
        
        // Only add glow effects if we have few particles (improves performance)
        const useGlowEffects = this.explosionParticles.length < 20;
        
        for (let i = 0; i < this.explosionParticles.length; i++) {
            const particle = this.explosionParticles[i];
            
            // Calculate alpha based on lifetime
            const alpha = 1 - (particle.life / particle.maxLife);
            
            // Skip particles with very low alpha (optimization)
            if (alpha < 0.05) continue;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(
                this.x + particle.x, 
                this.y + particle.y, 
                particle.size * (1 - particle.life / particle.maxLife), 
                0, 
                Math.PI * 2
            );
            
            // Fill with color based on particle type with theme support
            if (particle.type === 'spark') {
                // Check for theme colors for spark particles
                if (window.cosmicThemeSelector && !this.isRadiant && !this.isLunar && this.dimension !== 'void') {
                    const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                    if (currentTheme && currentTheme.enemyColor) {
                        // Convert hex to rgb for theme-based spark
                        const hexToRgb = (hex) => {
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            return [r, g, b];
                        };
                        
                        // Get base color and brighten it for spark
                        const rgb = hexToRgb(currentTheme.enemyColor);
                        // Make more yellow/white for spark appearance
                        const brightRgb = [
                            Math.min(255, rgb[0] + 100), 
                            Math.min(255, rgb[1] + 150),
                            Math.min(255, rgb[2] + 50)
                        ];
                        
                        ctx.fillStyle = `rgba(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]}, ${alpha * 0.9})`;
                    } else {
                        // Default spark color
                        ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.9})`;
                    }
                } else {
                    // Default spark color for special enemies
                    ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.9})`;
                }
            } else if (particle.type === 'smoke') {
                // Smoke is always grey/black for visual clarity
                ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.7})`;
            } else {
                // Default fire particle with theme support
                if (window.cosmicThemeSelector && !this.isRadiant && !this.isLunar && this.dimension !== 'void') {
                    const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                    if (currentTheme && currentTheme.enemyColor) {
                        // Convert hex to rgb for theme-based fire
                        const hexToRgb = (hex) => {
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            return [r, g, b];
                        };
                        
                        // Get base color and adjust for flame effect
                        const rgb = hexToRgb(currentTheme.enemyColor);
                        
                        // Animate the fire color based on life
                        const lifeProgress = particle.life / particle.maxLife;
                        const r = Math.max(0, rgb[0] - Math.floor(lifeProgress * 100));
                        const g = Math.max(0, rgb[1] - Math.floor(lifeProgress * 150));
                        const b = Math.max(0, rgb[2] - Math.floor(lifeProgress * 150));
                        
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    } else {
                        // Default fire particle calculation
                        const r = 255 - Math.floor((particle.life / particle.maxLife) * 155);
                        const g = Math.floor((1 - particle.life / particle.maxLife) * 100);
                        ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
                    }
                } else {
                    // Default fire particle for special enemies
                    const r = 255 - Math.floor((particle.life / particle.maxLife) * 155);
                    const g = Math.floor((1 - particle.life / particle.maxLife) * 100);
                    ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
                }
            }
            
            ctx.fill();
            
            // Add glow for sparks - but only when we have few particles
            if (particle.type === 'spark' && useGlowEffects) {
                // Default glow color
                let glowColor = 'rgba(255, 200, 50, 0.8)';
                let innerGlowColor = `rgba(255, 255, 200, ${alpha})`;
                
                // Check for theme colors for sparks
                if (window.cosmicThemeSelector && !this.isRadiant && !this.isLunar && this.dimension !== 'void') {
                    const currentTheme = window.cosmicThemeSelector.getCurrentTheme();
                    if (currentTheme && currentTheme.enemyColor) {
                        // Convert hex to rgb for theme-based glow
                        const hexToRgb = (hex) => {
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            return [r, g, b];
                        };
                        
                        // Get base color and create glow variation
                        const rgb = hexToRgb(currentTheme.enemyColor);
                        
                        // Brighten color for glow effect
                        const glowRgb = [
                            Math.min(255, rgb[0] + 120),
                            Math.min(255, rgb[1] + 160),
                            Math.min(255, rgb[2] + 80)
                        ];
                        
                        // Ultra bright inner core
                        const innerRgb = [
                            Math.min(255, rgb[0] + 180),
                            Math.min(255, rgb[1] + 200),
                            Math.min(255, rgb[2] + 150)
                        ];
                        
                        glowColor = `rgba(${glowRgb[0]}, ${glowRgb[1]}, ${glowRgb[2]}, 0.8)`;
                        innerGlowColor = `rgba(${innerRgb[0]}, ${innerRgb[1]}, ${innerRgb[2]}, ${alpha})`;
                    }
                }
                
                // Performance optimization: lower shadow blur in performance mode
                const isPerformanceMode = window.game && window.game.performanceMode;
                const blurAmount = isPerformanceMode ? 2 : 3;
                
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = blurAmount;
                ctx.beginPath();
                ctx.arc(this.x + particle.x, this.y + particle.y, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = innerGlowColor;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    takeDamage() {
        try {
            // If enemy is already dead, don't process further damage
            if (this.health <= 0) {
                return true; // Already dead
            }
            
            // Apply damage - check for damage boost from projectile if present
            let damageAmount = 1; // Default damage
            let enhancedDamage = false;
            
            // Get projectile info from the last collision check and check for player damage boost
            if (window.game && window.game.currentProjectile) {
                // Apply projectile's damage value if it has one
                damageAmount = window.game.currentProjectile.damage || 1;
                
                // Check if player has damage boost active
                const player = window.game.player;
                if (player && player.powerUps && player.powerUps.damage &&
                    player.powerUps.damage.active && Date.now() < player.powerUps.damage.endTime) {
                    // Apply damage boost multiplier
                    damageAmount *= player.powerUps.damage.multiplier;
                    enhancedDamage = true;
                }
            }
            
            this.health -= damageAmount;
            
            // Trigger hit effect
            this.hitEffect.active = true;
            this.hitEffect.duration = 0;
            
            // Create hit particles (enhanced if damage was boosted)
            this.createHitEffect(enhancedDamage);
            
            // Check if enemy should be destroyed
            const isDead = this.health <= 0;
            
            // Debug output - very verbose to help diagnose issues
            console.log(`Enemy hit! Health: ${this.health}, isDead: ${isDead}, isDurable: ${this.isDurable}`);
            
            if (isDead) {
                console.log("Enemy is dead and should be removed!");
                // Set health to exactly 0 for consistency
                this.health = 0;
            }
            
            // Return whether enemy is destroyed
            return isDead;
        } catch (error) {
            console.error('Error in enemy takeDamage:', error);
            return true; // Destroy enemy on error to prevent undefined behavior
        }
    }
    
    createHitEffect(enhancedDamage = false) {
        // Skip creating particles in reduced effects mode
        if (this.reducedEffects) {
            return;
        }
        
        // Limit total number of particles to prevent lag
        if (this.explosionParticles.length > 150) {
            // If too many particles, just keep the newest
            this.explosionParticles = this.explosionParticles.slice(-50);
        }

        // Create a small burst of particles when hit - reduced counts for performance
        // Increase particle count for enhanced damage or death
        let particleCount = this.health <= 0 ? 15 : 5; // Reduced from 30/8 to 15/5
        
        // Add more particles for enhanced damage hits for visual feedback
        if (enhancedDamage && this.health > 0) {
            particleCount += 3; // Add a few more particles for damage boost hits
        }
        
        // Add cosmic transition effects if available
        if (window.cosmicTransitions && this.health <= 0) {
            // Get appropriate color palette based on enemy type
            let colorPalette;
            if (this.isRadiant) {
                colorPalette = window.cosmicTransitions.colorPalettes.radiant;
            } else if (this.dimension === 'void') {
                colorPalette = window.cosmicTransitions.colorPalettes.defeat;
            } else if (this.dimension === 'lunar') {
                colorPalette = window.cosmicTransitions.colorPalettes.lunar;
            } else {
                colorPalette = window.cosmicTransitions.colorPalettes.energy;
            }
            
            // Create gravity implosion/explosion effect for destroyed enemies
            // First, create an implosion (negative gravity)
            window.cosmicTransitions.addGravitySource(
                this.x, this.y, 
                -2, // Strong implosion
                null, 
                false, // Not persistent
                200 // Short duration
            );
            
            // Then, after a short delay, create an explosion (positive gravity)
            setTimeout(() => {
                if (window.cosmicTransitions) {
                    window.cosmicTransitions.addGravitySource(
                        this.x, this.y, 
                        3, // Strong explosion
                        null, 
                        false, // Not persistent
                        300 // Longer duration for explosion
                    );
                    
                    // Create particle burst with physics
                    window.cosmicTransitions.createParticleBurst(
                        this.x, this.y,
                        {
                            count: this.isDurable ? 25 : 15,
                            colors: colorPalette,
                            speed: { min: 20, max: 120 },
                            size: { min: 2, max: 5 },
                            lifespan: 1200,
                            gravity: 0.05,
                            shapes: ['circle', 'triangle'],
                            spread: 360,
                            glow: true
                        }
                    );
                }
            }, 100);
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Speed up particles for enhanced damage hits
            const speed = Math.random() * 2 + (enhancedDamage ? 2 : 1);
            // Make particles slightly larger for enhanced damage hits
            const size = Math.random() * 3 + (enhancedDamage ? 1.5 : 1);
            
            // Different particle types
            let type;
            if (this.health <= 0) {
                // Final explosion has more variation
                const typeRoll = Math.random();
                if (typeRoll < 0.3) {
                    type = 'spark';
                } else if (typeRoll < 0.6) {
                    type = 'smoke';
                } else {
                    type = 'fire';
                }
            } else {
                // Normal hit is mainly sparks
                type = Math.random() < 0.7 ? 'spark' : 'fire';
            }
            
            // Shorter lifetime for better performance
            const maxLife = Math.random() * 15 + 5; // Reduced from 20+10 to 15+5
            
            this.explosionParticles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                life: 0,
                maxLife: maxLife,
                type: type
            });
        }
    }

    update(playerX, playerY) {
        try {
            // Basic movement towards player
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const angle = Math.atan2(dy, dx);

            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
            
            // Update wobble effect
            this.wobble += this.wobbleSpeed;
            
            // Update pulse effect (used for various animations)
            this.pulseEffect += 0.05;
            
            // Update rotation
            this.rotation += this.rotationSpeed;
            
            // Update hit effect
            if (this.hitEffect.active) {
                this.hitEffect.duration++;
                if (this.hitEffect.duration >= this.hitEffect.maxDuration) {
                    this.hitEffect.active = false;
                }
            }
            
            // Update void dimension effects
            if (this.dimension === 'void') {
                this.voidEffectTimer++;
            }
            
            // Update explosion particles
            for (let i = 0; i < this.explosionParticles.length; i++) {
                const particle = this.explosionParticles[i];
                
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Add some gravity to particles
                particle.vy += 0.05;
                
                // Apply drag
                particle.vx *= 0.97;
                particle.vy *= 0.97;
                
                // Update life
                particle.life++;
            }
            
            // PERFORMANCE OPTIMIZATION: More efficient explosion particles management
            // Only filter explosion particles every 3 frames
            if (!this._explosionFrameCounter) this._explosionFrameCounter = 0;
            this._explosionFrameCounter = (this._explosionFrameCounter + 1) % 3;
            
            if (this._explosionFrameCounter === 0 && this.explosionParticles.length > 0) {
                // Manual filtering is more efficient than using Array.filter
                const liveExplosionParticles = [];
                for (let i = 0; i < this.explosionParticles.length; i++) {
                    if (this.explosionParticles[i].life < this.explosionParticles[i].maxLife) {
                        liveExplosionParticles.push(this.explosionParticles[i]);
                    }
                }
                // Replace array only if needed
                if (liveExplosionParticles.length < this.explosionParticles.length) {
                    this.explosionParticles = liveExplosionParticles;
                }
            }
            
            // PERFORMANCE OPTIMIZATION: More efficient radiant trail particles management
            if (this.isRadiant) {
                // Only update trails every 3 frames to improve performance
                if (!this._frameCounter) this._frameCounter = 0;
                this._frameCounter = (this._frameCounter + 1) % 3;
                
                if (this._frameCounter === 0) {
                    // Manual filtering is more efficient than using Array.filter
                    const liveParticles = [];
                    for (let i = 0; i < this.radiantTrailParticles.length; i++) {
                        if (this.radiantTrailParticles[i].life < this.radiantTrailParticles[i].maxLife) {
                            liveParticles.push(this.radiantTrailParticles[i]);
                        }
                    }
                    // Replace array only if needed (avoid unnecessary memory allocation)
                    if (liveParticles.length < this.radiantTrailParticles.length) {
                        this.radiantTrailParticles = liveParticles;
                    }
                }
            }
            
        } catch (error) {
            console.error('Error updating enemy:', error);
        }
    }
    
    // Method to create a full death explosion
    drawRadiantTrails(ctx) {
        // Skip trail effects completely in reduced effects mode
        if (this.reducedEffects) {
            return;
        }
        
        // Generate and draw trailing particles for radiant enemies
        const now = Date.now();
        
        // PERFORMANCE OPTIMIZATION: Reduce frequency of new particles
        if (now - this.lastTrailTime > 100) { // Reduced from 50ms to 100ms
            this.lastTrailTime = now;
            
            // Create new trail particle
            const hue = (now * 0.1 + this.radiantColorPhase) % 360;
            this.radiantTrailParticles.push({
                x: this.x,
                y: this.y,
                size: this.size * 0.4 * (Math.random() * 0.3 + 0.7), // Slightly smaller
                alpha: 0.7, // Reduced from 0.8
                hue: hue,
                maxLife: 20, // Reduced from 30
                life: 0
            });
            
            // PERFORMANCE OPTIMIZATION: Reduce max particles
            if (this.radiantTrailParticles.length > 8) { // Reduced from 15
                this.radiantTrailParticles.shift();
            }
        }
        
        // PERFORMANCE OPTIMIZATION: Batch draw particles
        // Use a single path for all particles of similar color to reduce draw calls
        const particlesByHue = {};
        
        // Group particles by hue range (rounded to nearest 30 degrees)
        for (let i = 0; i < this.radiantTrailParticles.length; i++) {
            const particle = this.radiantTrailParticles[i];
            
            // Skip drawing if particle is dead
            if (particle.life >= particle.maxLife) continue;
            
            // Update particle life
            particle.life++;
            
            // Calculate remaining life percentage
            const lifePercent = 1 - (particle.life / particle.maxLife);
            
            // Group similar hues together (round to nearest 30°)
            const hueGroup = Math.round(particle.hue / 30) * 30;
            
            if (!particlesByHue[hueGroup]) {
                particlesByHue[hueGroup] = [];
            }
            
            particlesByHue[hueGroup].push({
                x: particle.x,
                y: particle.y,
                size: particle.size * lifePercent,
                alpha: particle.alpha * lifePercent
            });
        }
        
        // PERFORMANCE OPTIMIZATION: Draw particles by hue group with reduced shadow effects
        for (const hue in particlesByHue) {
            const particles = particlesByHue[hue];
            if (particles.length === 0) continue;
            
            ctx.save();
            
            // PERFORMANCE OPTIMIZATION: Apply shadow only once per hue group
            // instead of for each individual particle
            ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.6)`;
            ctx.shadowBlur = 5; // Reduced from 8
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                ctx.globalAlpha = p.alpha;
                
                // Draw particles with less detail
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.5)`;
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    createDeathExplosion() {
        // This can be called externally from game.js when enemy is destroyed
        this.createHitEffect();
        
        // Add more particles for a bigger explosion - but limit to prevent lag
        // Reduced from 20 to 10 particle bursts for performance
        const particleBursts = this.isDurable ? 10 : 5; 
        
        for (let i = 0; i < particleBursts; i++) {
            this.createHitEffect();
        }
    }
}