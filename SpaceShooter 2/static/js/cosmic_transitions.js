/**
 * Cosmic UI Transitions with Gravity-Defying Particle Effects
 * Creates smooth, space-themed transitions between UI elements with
 * realistic physics and particle animations
 * Version 1.0.0
 */
class CosmicTransitions {
    constructor() {
        // Check if performance mode is enabled from localStorage
        this.performanceMode = localStorage.getItem('performanceMode') === 'true';
        
        // Canvas setup
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.className = 'cosmic-transitions-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        
        // Particles and effects containers
        this.particles = [];
        this.gravitySources = [];
        this.activeTransitions = new Map();
        this.transitionQueue = [];
        
        // Physics settings
        this.physicsSettings = {
            gravity: 0.03,
            friction: 0.98,
            particleCount: {
                small: 30,
                medium: 60,
                large: 120
            },
            gravityWellStrength: 5,
            antigravityStrength: -2,
            maxSpeed: 5,
            particleLifespan: 3000, // milliseconds
            turbulence: 0.2
        };
        
        // State tracking
        this.lastFrameTime = 0;
        this.isInitialized = false;
        this.isActive = false;
        
        // Color palettes
        this.colorPalettes = {
            cosmic: ['#3498db', '#9b59b6', '#2980b9', '#8e44ad', '#ffffff'],
            fire: ['#e74c3c', '#c0392b', '#d35400', '#f39c12', '#ffffff'],
            ice: ['#00bcd4', '#80deea', '#4dd0e1', '#26c6da', '#ffffff'],
            energy: ['#2ecc71', '#27ae60', '#f1c40f', '#f39c12', '#ffffff'],
            void: ['#34495e', '#2c3e50', '#7f8c8d', '#95a5a6', '#ffffff']
        };
        
        // Bind methods
        this.animate = this.animate.bind(this);
    }
    
    /**
     * Initialize the transition system
     */
    initialize() {
        if (this.isInitialized) return;
        
        // Append canvas to body
        document.body.appendChild(this.canvas);
        
        // Set up resize handling
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();
        
        // Start animation loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.animate);
        
        this.isInitialized = true;
    }
    
    /**
     * Handle canvas resize
     */
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update any gravity wells or transition points
        this.updateGravitySources();
    }
    
    /**
     * Update gravity source positions if they're attached to DOM elements
     */
    updateGravitySources() {
        this.gravitySources = this.gravitySources.filter(source => {
            if (source.element) {
                const rect = source.element.getBoundingClientRect();
                source.x = rect.left + rect.width / 2;
                source.y = rect.top + rect.height / 2;
                return true;
            }
            return source.persistent;
        });
    }
    
    /**
     * Add a gravity well to influence particle movement
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} strength - Gravity strength (positive attracts, negative repels)
     * @param {HTMLElement} element - Optional element to track
     * @param {boolean} persistent - Whether this gravity source persists after transitions
     * @returns {Object} The created gravity source
     */
    addGravitySource(x, y, strength = 1, element = null, persistent = false) {
        const source = {
            x, y, strength, element, persistent,
            radius: Math.abs(strength) * 20,
            active: true
        };
        
        this.gravitySources.push(source);
        return source;
    }
    
    /**
     * Create a particle with physics properties
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {string} color - Particle color
     * @param {number} size - Particle size
     * @param {Object} options - Additional options
     * @returns {Object} The created particle
     */
    createParticle(x, y, color, size, options = {}) {
        const angle = options.angle || Math.random() * Math.PI * 2;
        const speed = options.speed || (Math.random() * 2 + 1);
        
        return {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size || Math.random() * 4 + 1,
            color,
            alpha: options.alpha || 1,
            decay: options.decay || 0.01,
            gravity: options.gravity !== undefined ? options.gravity : true,
            lifespan: options.lifespan || this.physicsSettings.particleLifespan,
            createdAt: performance.now(),
            trail: options.trail || false,
            trailPoints: [],
            glow: options.glow || false,
            spin: options.spin ? (Math.random() * 0.2 - 0.1) : 0,
            angle: Math.random() * Math.PI * 2,
            shape: options.shape || 'circle',
            fadeIn: options.fadeIn || false,
            elasticity: options.elasticity || 0.7
        };
    }
    
    /**
     * Create a burst of particles
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {Object} options - Configuration options
     */
    createParticleBurst(x, y, options = {}) {
        // Reduce particle count in performance mode
        let count = options.count || this.physicsSettings.particleCount.small;
        if (this.performanceMode) {
            // Reduce particle count by 70% in performance mode
            count = Math.max(5, Math.floor(count * 0.3));
        }
        
        const colors = options.colors || this.colorPalettes.cosmic;
        const size = options.size || { min: 1, max: 4 };
        const speed = options.speed || { min: 1, max: 3 };
        const lifespan = options.lifespan || this.physicsSettings.particleLifespan;
        
        // Skip particle creation entirely if count is zero
        if (count <= 0) return;
        
        for (let i = 0; i < count; i++) {
            const angle = (options.directed) 
                ? (options.direction + (Math.random() * 0.5 - 0.25))
                : (Math.random() * Math.PI * 2);
            
            const particleSpeed = speed.min + Math.random() * (speed.max - speed.min);
            const particleSize = size.min + Math.random() * (size.max - size.min);
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // In performance mode, simplify the particles (no trails, less glow)
            const useTrail = this.performanceMode ? false : (options.trail || false);
            const useGlow = this.performanceMode ? false : (options.glow || (Math.random() > 0.7));
            
            this.particles.push(this.createParticle(x, y, color, particleSize, {
                angle: angle,
                speed: particleSpeed,
                lifespan: this.performanceMode ? lifespan * 0.7 : lifespan, // Shorter lifespan in performance mode
                gravity: options.gravity !== undefined ? options.gravity : true,
                trail: useTrail,
                glow: useGlow,
                shape: options.shape || (Math.random() > 0.7 ? 'star' : 'circle'),
                fadeIn: options.fadeIn || false,
                elasticity: options.elasticity || 0.7
            }));
        }
    }
    
    /**
     * Create a transition between two UI elements
     * @param {HTMLElement} fromElement - Starting element
     * @param {HTMLElement} toElement - Target element
     * @param {Object} options - Transition options
     */
    createTransition(fromElement, toElement, options = {}) {
        if (!fromElement || !toElement) return;
        
        // Ensure the system is initialized
        if (!this.isInitialized) this.initialize();
        
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        const fromCenter = {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2
        };
        
        const toCenter = {
            x: toRect.left + toRect.width / 2,
            y: toRect.top + toRect.height / 2
        };
        
        // Create a unique ID for this transition
        const transitionId = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Default options
        const transitionOptions = Object.assign({
            type: 'cosmic', // cosmic, warp, portal, etc.
            duration: 1000,
            particleCount: this.physicsSettings.particleCount.medium,
            colors: this.colorPalettes.cosmic,
            addGravitySources: true,
            callback: null
        }, options);
        
        // Add gravity sources if requested
        if (transitionOptions.addGravitySources) {
            this.addGravitySource(
                fromCenter.x, 
                fromCenter.y, 
                -1, // Repel from source
                fromElement,
                false
            );
            
            this.addGravitySource(
                toCenter.x,
                toCenter.y,
                3, // Attract to destination
                toElement,
                false
            );
        }
        
        // Create initial particle burst at start element
        this.createParticleBurst(fromCenter.x, fromCenter.y, {
            count: transitionOptions.particleCount,
            colors: transitionOptions.colors,
            size: { min: 1, max: 5 },
            speed: { min: 1, max: 4 },
            directed: true,
            direction: Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x),
            lifespan: transitionOptions.duration,
            gravity: true,
            trail: true,
            glow: true
        });
        
        // Store the transition data
        this.activeTransitions.set(transitionId, {
            fromElement,
            toElement,
            startTime: performance.now(),
            options: transitionOptions,
            progress: 0
        });
        
        // Make sure the animation is running
        this.isActive = true;
        
        // Return the transition ID for potential later reference
        return transitionId;
    }
    
    /**
     * Create a floating effect for a UI element
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     */
    createFloatingEffect(element, options = {}) {
        if (!element) return;
        
        // Ensure the system is initialized
        if (!this.isInitialized) this.initialize();
        
        const rect = element.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        // Default options
        const floatOptions = Object.assign({
            duration: 3000,
            particleRate: 0.1, // Particles per frame
            particleCount: 20,
            colors: this.colorPalettes.cosmic,
            gravitational: true,
            persistent: true
        }, options);
        
        // Add a gentle gravity well
        if (floatOptions.gravitational) {
            this.addGravitySource(
                center.x,
                center.y,
                0.5, // Gentle attraction
                element,
                floatOptions.persistent
            );
        }
        
        // Add some ambient particles
        this.createParticleBurst(center.x, center.y, {
            count: floatOptions.particleCount,
            colors: floatOptions.colors,
            size: { min: 1, max: 3 },
            speed: { min: 0.2, max: 1 },
            lifespan: floatOptions.duration,
            gravity: floatOptions.gravitational,
            glow: true
        });
        
        // Set up a timer to continuously add particles
        const particleInterval = setInterval(() => {
            if (!document.body.contains(element)) {
                clearInterval(particleInterval);
                return;
            }
            
            const updatedRect = element.getBoundingClientRect();
            const x = updatedRect.left + Math.random() * updatedRect.width;
            const y = updatedRect.bottom;
            
            if (Math.random() < floatOptions.particleRate) {
                this.createParticleBurst(x, y, {
                    count: 1,
                    colors: floatOptions.colors,
                    size: { min: 1, max: 2 },
                    speed: { min: 0.2, max: 1 },
                    directed: true,
                    direction: -Math.PI/2, // Upward
                    lifespan: 1500,
                    gravity: floatOptions.gravitational,
                    glow: true
                });
            }
        }, 100);
        
        return particleInterval;
    }
    
    /**
     * Apply a hover effect to an element
     * @param {HTMLElement} element - Element to apply hover effect to
     * @param {Object} options - Effect options
     */
    addElementHoverEffect(element, options = {}) {
        if (!element) return;
        
        const hoverOptions = Object.assign({
            particleCount: 10,
            colors: this.colorPalettes.cosmic,
            size: { min: 1, max: 3 },
            speed: { min: 0.5, max: 2 },
            lifespan: 1000,
            fadeOut: true,
            gravitational: true
        }, options);
        
        let hoverTimeout;
        
        element.addEventListener('mouseenter', () => {
            const rect = element.getBoundingClientRect();
            
            // Create particles around the element border
            for (let i = 0; i < hoverOptions.particleCount; i++) {
                const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
                let x, y, direction;
                
                switch(side) {
                    case 0: // top
                        x = rect.left + Math.random() * rect.width;
                        y = rect.top;
                        direction = Math.PI/2; // Downward
                        break;
                    case 1: // right
                        x = rect.right;
                        y = rect.top + Math.random() * rect.height;
                        direction = Math.PI; // Leftward
                        break;
                    case 2: // bottom
                        x = rect.left + Math.random() * rect.width;
                        y = rect.bottom;
                        direction = -Math.PI/2; // Upward
                        break;
                    case 3: // left
                        x = rect.left;
                        y = rect.top + Math.random() * rect.height;
                        direction = 0; // Rightward
                        break;
                }
                
                this.createParticleBurst(x, y, {
                    count: 1,
                    colors: hoverOptions.colors,
                    size: hoverOptions.size,
                    speed: hoverOptions.speed,
                    directed: true,
                    direction: direction,
                    lifespan: hoverOptions.lifespan,
                    gravity: hoverOptions.gravitational,
                    glow: true,
                    fadeIn: true
                });
            }
            
            // Add a temporary gravity source
            const gravitySource = this.addGravitySource(
                rect.left + rect.width/2,
                rect.top + rect.height/2,
                1,
                element,
                false
            );
            
            // Remove gravity source after mouse leaves
            hoverTimeout = setTimeout(() => {
                const index = this.gravitySources.indexOf(gravitySource);
                if (index > -1) {
                    this.gravitySources.splice(index, 1);
                }
            }, hoverOptions.lifespan + 500);
            
            // Ensure animation is running
            this.isActive = true;
        });
        
        element.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            
            // Find and remove any gravity sources associated with this element
            this.gravitySources = this.gravitySources.filter(source => 
                source.element !== element || source.persistent
            );
        });
    }
    
    /**
     * Create a click effect for UI elements
     * @param {HTMLElement} element - Element to add click effect to
     * @param {Object} options - Effect options
     */
    addElementClickEffect(element, options = {}) {
        if (!element) return;
        
        const clickOptions = Object.assign({
            particleCount: this.physicsSettings.particleCount.small,
            colors: this.colorPalettes.energy,
            size: { min: 2, max: 4 },
            speed: { min: 1, max: 3 },
            lifespan: 800,
            gravitational: false
        }, options);
        
        element.addEventListener('click', (event) => {
            // Don't capture if we clicked on a child that has its own effect
            if (event.target !== element && event.target.hasClickEffect) return;
            
            // Create burst at click position
            this.createParticleBurst(event.clientX, event.clientY, {
                count: clickOptions.particleCount,
                colors: clickOptions.colors,
                size: clickOptions.size,
                speed: clickOptions.speed,
                lifespan: clickOptions.lifespan,
                gravity: clickOptions.gravitational,
                glow: true
            });
            
            // Ensure animation is running
            this.isActive = true;
        });
        
        // Mark this element as having a click effect
        element.hasClickEffect = true;
    }
    
    /**
     * Create a pulse effect that emanates from an element
     * @param {HTMLElement} element - Source element
     * @param {Object} options - Effect options
     */
    createPulseEffect(element, options = {}) {
        if (!element) return;
        
        // Ensure initialization
        if (!this.isInitialized) this.initialize();
        
        const rect = element.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        // Default options
        const pulseOptions = Object.assign({
            radius: Math.max(rect.width, rect.height) / 2,
            color: '#3498db',
            duration: 1000,
            thickness: 2,
            fadeRate: 0.02,
            particleFollow: true
        }, options);
        
        // Create the pulse object
        const pulse = {
            x: center.x,
            y: center.y,
            radius: 0,
            maxRadius: pulseOptions.radius * 2,
            color: pulseOptions.color,
            alpha: 1,
            thickness: pulseOptions.thickness,
            startTime: performance.now(),
            duration: pulseOptions.duration,
            element: pulseOptions.particleFollow ? element : null
        };
        
        // Add to animation queue
        this.particles.push(pulse);
        
        // Ensure animation is active
        this.isActive = true;
        
        return pulse;
    }
    
    /**
     * Create a page transition effect
     * @param {string} direction - Direction of transition ('in' or 'out')
     * @param {Object} options - Transition options
     */
    createPageTransition(direction = 'in', options = {}) {
        // Ensure initialization
        if (!this.isInitialized) this.initialize();
        
        const defaultOptions = {
            duration: 1000,
            particleCount: this.physicsSettings.particleCount.large,
            colors: this.colorPalettes.cosmic,
            type: 'cosmic', // cosmic, warp, fade
            callback: null
        };
        
        const transitionOptions = Object.assign(defaultOptions, options);
        const startTime = performance.now();
        
        // Create particles based on transition type
        const { width, height } = this.canvas;
        
        if (transitionOptions.type === 'cosmic') {
            // For 'in' transition, create particles from edges to center
            // For 'out' transition, create particles from center to edges
            const isInTransition = direction === 'in';
            
            // Add gravity source at center
            const centerGravity = this.addGravitySource(
                width / 2,
                height / 2,
                isInTransition ? 4 : -4,
                null,
                false
            );
            
            // Create particles along the edges or at center
            if (isInTransition) {
                // Create particles along the edges
                // Top edge
                for (let x = 0; x < width; x += width / 20) {
                    this.createParticleBurst(x, 0, {
                        count: 3,
                        colors: transitionOptions.colors,
                        directed: true,
                        direction: Math.PI/2, // Downward
                        lifespan: transitionOptions.duration,
                        gravity: true,
                        glow: true
                    });
                }
                
                // Bottom edge
                for (let x = 0; x < width; x += width / 20) {
                    this.createParticleBurst(x, height, {
                        count: 3,
                        colors: transitionOptions.colors,
                        directed: true,
                        direction: -Math.PI/2, // Upward
                        lifespan: transitionOptions.duration,
                        gravity: true,
                        glow: true
                    });
                }
                
                // Left edge
                for (let y = 0; y < height; y += height / 20) {
                    this.createParticleBurst(0, y, {
                        count: 3,
                        colors: transitionOptions.colors,
                        directed: true,
                        direction: 0, // Rightward
                        lifespan: transitionOptions.duration,
                        gravity: true,
                        glow: true
                    });
                }
                
                // Right edge
                for (let y = 0; y < height; y += height / 20) {
                    this.createParticleBurst(width, y, {
                        count: 3,
                        colors: transitionOptions.colors,
                        directed: true,
                        direction: Math.PI, // Leftward
                        lifespan: transitionOptions.duration,
                        gravity: true,
                        glow: true
                    });
                }
            } else {
                // Create a burst at center that explodes outward
                this.createParticleBurst(width / 2, height / 2, {
                    count: transitionOptions.particleCount,
                    colors: transitionOptions.colors,
                    size: { min: 2, max: 5 },
                    speed: { min: 2, max: 5 },
                    lifespan: transitionOptions.duration,
                    gravity: true,
                    glow: true
                });
            }
            
            // Set up a callback to remove gravity after transition
            setTimeout(() => {
                const index = this.gravitySources.indexOf(centerGravity);
                if (index > -1) {
                    this.gravitySources.splice(index, 1);
                }
                
                if (transitionOptions.callback) {
                    transitionOptions.callback();
                }
            }, transitionOptions.duration);
        }
        
        // Ensure animation is active
        this.isActive = true;
    }
    
    /**
     * Animation loop for the particle system
     * @param {number} currentTime - Current frame timestamp
     */
    animate(currentTime) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Check if we need to keep animating
        const hasActiveParticles = this.particles.length > 0;
        const hasActiveTransitions = this.activeTransitions.size > 0;
        
        if (hasActiveParticles || hasActiveTransitions || this.isActive) {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update gravity sources
            this.updateGravitySources();
            
            // Update and draw particles
            this.updateParticles(deltaTime);
            
            // Update transitions
            this.updateTransitions(currentTime);
            
            // Continue the animation loop
            requestAnimationFrame(this.animate);
        } else {
            // No active animations, pause until needed
            this.isActive = false;
        }
    }
    
    /**
     * Update all particles
     * @param {number} deltaTime - Time since last frame
     */
    updateParticles(deltaTime) {
        // Process each particle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Check if particle should be removed
            if (
                (particle.createdAt && currentTime - particle.createdAt > particle.lifespan) ||
                particle.alpha <= 0
            ) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Handle pulse effect special case
            if (particle.maxRadius !== undefined) {
                this.updatePulseEffect(particle, deltaTime);
                this.drawPulseEffect(particle);
                continue;
            }
            
            // Apply physics
            if (particle.gravity) {
                // Apply gravity from gravity wells
                for (const source of this.gravitySources) {
                    if (!source.active) continue;
                    
                    const dx = source.x - particle.x;
                    const dy = source.y - particle.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);
                    
                    if (dist > 0 && dist < source.radius * 3) {
                        const force = source.strength / distSq;
                        const ax = (dx / dist) * force;
                        const ay = (dy / dist) * force;
                        
                        particle.vx += ax;
                        particle.vy += ay;
                    }
                }
                
                // Global gravity (very light)
                particle.vy += this.physicsSettings.gravity;
            }
            
            // Apply turbulence for more interesting motion
            if (Math.random() < this.physicsSettings.turbulence) {
                particle.vx += (Math.random() * 0.4 - 0.2);
                particle.vy += (Math.random() * 0.4 - 0.2);
            }
            
            // Apply friction
            particle.vx *= this.physicsSettings.friction;
            particle.vy *= this.physicsSettings.friction;
            
            // Enforce max speed
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > this.physicsSettings.maxSpeed) {
                const ratio = this.physicsSettings.maxSpeed / speed;
                particle.vx *= ratio;
                particle.vy *= ratio;
            }
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Handle trails
            if (particle.trail && Math.random() > 0.7) {
                particle.trailPoints.push({
                    x: particle.x,
                    y: particle.y,
                    alpha: 0.7
                });
                
                // Limit trail length
                if (particle.trailPoints.length > 10) {
                    particle.trailPoints.shift();
                }
            }
            
            // Handle screen boundaries with bounce
            const buffer = particle.size * 2;
            
            if (particle.x < buffer) {
                particle.x = buffer;
                particle.vx *= -particle.elasticity;
            } else if (particle.x > this.canvas.width - buffer) {
                particle.x = this.canvas.width - buffer;
                particle.vx *= -particle.elasticity;
            }
            
            if (particle.y < buffer) {
                particle.y = buffer;
                particle.vy *= -particle.elasticity;
            } else if (particle.y > this.canvas.height - buffer) {
                particle.y = this.canvas.height - buffer;
                particle.vy *= -particle.elasticity;
            }
            
            // Update angles for spinning particles
            if (particle.spin) {
                particle.angle += particle.spin;
            }
            
            // Handle fade in/out
            if (particle.fadeIn && particle.alpha < 1) {
                particle.alpha += 0.05;
            } else {
                // Gradually reduce alpha
                particle.alpha -= particle.decay;
            }
            
            // Draw the particle
            this.drawParticle(particle);
        }
    }
    
    /**
     * Update a pulse effect
     * @param {Object} pulse - The pulse to update
     * @param {number} deltaTime - Time since last frame
     */
    updatePulseEffect(pulse, deltaTime) {
        const elapsed = performance.now() - pulse.startTime;
        const progress = Math.min(elapsed / pulse.duration, 1);
        
        // Update radius based on progress
        pulse.radius = pulse.maxRadius * progress;
        
        // Update alpha
        pulse.alpha = 1 - progress;
        
        // Update position if attached to an element
        if (pulse.element) {
            const rect = pulse.element.getBoundingClientRect();
            pulse.x = rect.left + rect.width / 2;
            pulse.y = rect.top + rect.height / 2;
        }
    }
    
    /**
     * Draw a pulse effect
     * @param {Object} pulse - The pulse to draw
     */
    drawPulseEffect(pulse) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = pulse.color;
        this.ctx.lineWidth = pulse.thickness;
        this.ctx.globalAlpha = pulse.alpha;
        this.ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Draw a particle
     * @param {Object} particle - Particle to draw
     */
    drawParticle(particle) {
        this.ctx.globalAlpha = particle.alpha;
        
        // Draw any trail first
        if (particle.trail && particle.trailPoints.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            
            for (let i = particle.trailPoints.length - 1; i >= 0; i--) {
                const point = particle.trailPoints[i];
                this.ctx.lineTo(point.x, point.y);
                
                // Fade trail points
                particle.trailPoints[i].alpha -= 0.03;
                if (particle.trailPoints[i].alpha <= 0) {
                    particle.trailPoints.splice(i, 1);
                }
            }
            
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = particle.size / 2;
            this.ctx.stroke();
        }
        
        // Draw glow if needed
        if (particle.glow) {
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.shadowColor = particle.color;
        }
        
        // Draw the particle based on its shape
        switch (particle.shape) {
            case 'star':
                this.drawStar(
                    this.ctx, 
                    particle.x, 
                    particle.y, 
                    particle.size * 1.5, 
                    particle.angle
                );
                break;
                
            case 'square':
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.angle);
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                this.ctx.restore();
                break;
                
            case 'triangle':
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, -particle.size);
                this.ctx.lineTo(particle.size, particle.size);
                this.ctx.lineTo(-particle.size, particle.size);
                this.ctx.closePath();
                this.ctx.fillStyle = particle.color;
                this.ctx.fill();
                this.ctx.restore();
                break;
                
            case 'circle':
            default:
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fillStyle = particle.color;
                this.ctx.fill();
                break;
        }
        
        // Reset shadow
        if (particle.glow) {
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Draw a star shape
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} size - Star size
     * @param {number} rotation - Rotation in radians
     */
    drawStar(ctx, x, y, size, rotation = 0) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i;
            ctx.lineTo(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            );
        }
        
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }
    
    /**
     * Update active transitions
     * @param {number} currentTime - Current timestamp
     */
    updateTransitions(currentTime) {
        for (const [id, transition] of this.activeTransitions.entries()) {
            const elapsed = currentTime - transition.startTime;
            const progress = Math.min(elapsed / transition.options.duration, 1);
            
            transition.progress = progress;
            
            // If transition is complete, remove it and call callback
            if (progress >= 1) {
                if (transition.options.callback) {
                    transition.options.callback();
                }
                this.activeTransitions.delete(id);
            }
        }
    }
    
    /**
     * Apply the transition system to all menu and UI elements
     * This is a convenience method to quickly enhance a UI
     */
    enhanceGameUI() {
        // Initialize the system
        this.initialize();
        
        // Add click effects to buttons
        const buttons = document.querySelectorAll('button, .button, [role="button"]');
        buttons.forEach(button => {
            this.addElementClickEffect(button);
            this.addElementHoverEffect(button);
        });
        
        // Add hover effects to menu items
        const menuItems = document.querySelectorAll('.menu-item, nav a, .nav-link');
        menuItems.forEach(item => {
            this.addElementHoverEffect(item, {
                colors: this.colorPalettes.cosmic,
                particleCount: 5
            });
        });
        
        // Add floating effects to important UI elements
        const importantElements = document.querySelectorAll('.important, .highlight, h1, h2');
        importantElements.forEach(element => {
            this.createFloatingEffect(element, {
                particleRate: 0.05,
                particleCount: 10,
                colors: this.colorPalettes.energy
            });
        });
        
        // Set up transitions between screens/sections
        const transitionTriggers = document.querySelectorAll('[data-transition-to]');
        transitionTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const targetId = trigger.getAttribute('data-transition-to');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    this.createTransition(trigger, targetElement, {
                        callback: () => {
                            // After transition, activate the target screen
                            const screens = document.querySelectorAll('.screen, .section');
                            screens.forEach(screen => screen.classList.remove('active'));
                            targetElement.classList.add('active');
                        }
                    });
                }
            });
        });
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        window.removeEventListener('resize', this.handleResize);
        this.isInitialized = false;
    }
    
    /**
     * Update color palette for cosmic transitions
     * @param {Array} colors - Array of color strings to use
     */
    updateColorPalette(colors) {
        if (Array.isArray(colors) && colors.length >= 3) {
            // Update cosmic palette (primary palette used throughout the system)
            this.colorPalettes.cosmic = [...colors, '#ffffff']; // Ensure white is included for stars
            
            // Update existing particles with new colors
            if (this.particles.length > 0) {
                this.particles.forEach(particle => {
                    // Only update certain particles to maintain visual consistency
                    if (Math.random() < 0.3) {
                        particle.color = this.colorPalettes.cosmic[
                            Math.floor(Math.random() * (this.colorPalettes.cosmic.length - 1))
                        ];
                    }
                });
            }
            
            console.log('Updated cosmic transition color palette');
        }
    }
}

// Make it globally available
window.cosmicTransitions = new CosmicTransitions();