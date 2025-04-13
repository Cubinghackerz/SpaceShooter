/**
 * Enhanced Cosmic Loading Screen with Dynamic Particles and Ambient Animations
 * Alpha Version 1.3.0
 */

class CosmicLoadingScreen {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.dustParticles = [];
        this.nebulaClouds = [];
        this.progress = 0;
        this.targetProgress = 0;
        this.visible = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.loadingText = "LOADING";
        this.loadingMessages = [
            "Calibrating warp drives...",
            "Scanning for alien life...",
            "Mapping star systems...",
            "Charging photon cannons...",
            "Activating shields...",
            "Aligning quantum stabilizers...",
            "Plotting hyperspace routes...",
            "Engaging gravity wells...",
            "Deploying stellar probes...",
            "Calculating trajectory vectors..."
        ];
        this.currentMessage = "";
        this.messageTimeout = null;
        this.lastFrameTime = 0;
        this.animationRequestId = null;
        this.onCompleteCallback = null;
        this.dotCount = 0;
        this.dotInterval = null;
        this.progressBarWidth = 300;
        this.progressBarHeight = 4;

        // Interactive elements
        this.interactive = true;
        this.parallaxStrength = 5;
        this.colorScheme = {
            background: "#0a0e16",
            stars: ["#ffffff", "#efefef", "#d0e8ff", "#bacbff", "#ffecab"],
            accent: "#4fc3f7",
            text: "#ffffff",
            progressBar: "#4fc3f7",
            progressBarBg: "rgba(255, 255, 255, 0.2)"
        };

        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    initialize() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'cosmic-loading-screen';
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial styles
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '10000',
            background: this.colorScheme.background,
            opacity: '0',
            transition: 'opacity 0.6s ease',
            display: 'none'
        });
        
        document.body.appendChild(this.canvas);
        
        // Initialize event listeners
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('resize', this.handleResize);
        
        // Set initial canvas size
        this.handleResize();
        
        // Generate initial star field
        this.generateStars();
        this.generateDustParticles();
        this.generateNebulaClouds();
        
        // Start with a random message
        this.changeMessage();
        
        console.log("Cosmic loading screen initialized");
    }

    handleResize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            // Regenerate stars when resizing
            this.generateStars();
            this.generateDustParticles();
            this.generateNebulaClouds();
            
            // Redraw if visible
            if (this.visible) {
                this.draw();
            }
        }
    }

    handleMouseMove(event) {
        if (!this.interactive || !this.visible) return;
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }

    generateStars() {
        this.stars = [];
        const density = Math.max(this.canvas.width, this.canvas.height) / 100;
        const count = Math.floor(density * 100);
        
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                color: this.colorScheme.stars[Math.floor(Math.random() * this.colorScheme.stars.length)],
                parallaxFactor: Math.random() * 0.8 + 0.2, // Between 0.2 and 1.0
                pulse: Math.random() * 0.4 + 0.8, // Pulse scale factor
                pulseSpeed: Math.random() * 0.01 + 0.005,
                pulseOffset: Math.random() * Math.PI * 2, // Random start point in pulse cycle
                twinkleChance: Math.random() // Chance to twinkle
            });
        }
    }

    generateDustParticles() {
        this.dustParticles = [];
        const count = Math.floor(this.canvas.width * this.canvas.height / 20000);
        
        for (let i = 0; i < count; i++) {
            this.dustParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                parallaxFactor: Math.random() * 0.3 + 0.1, // Slower than stars
                drift: {
                    x: (Math.random() - 0.5) * 0.2,
                    y: (Math.random() - 0.5) * 0.2
                }
            });
        }
    }

    generateNebulaClouds() {
        this.nebulaClouds = [];
        const count = 3 + Math.floor(Math.random() * 3); // 3-5 nebula clouds
        
        for (let i = 0; i < count; i++) {
            this.nebulaClouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 200 + 100,
                color1: `hsla(${Math.random() * 60 + 200}, 80%, 50%, 0.1)`, // Blues/purples
                color2: `hsla(${Math.random() * 60 + 300}, 70%, 60%, 0.08)`, // Purples/magentas
                parallaxFactor: Math.random() * 0.2 + 0.05, // Very slow movement
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.001
            });
        }
    }

    changeMessage() {
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Select a random message
        const previousMessage = this.currentMessage;
        let newMessage;
        
        do {
            newMessage = this.loadingMessages[Math.floor(Math.random() * this.loadingMessages.length)];
        } while (newMessage === previousMessage && this.loadingMessages.length > 1);
        
        this.currentMessage = newMessage;
        
        // Set timeout for next message change (between 2-4 seconds)
        this.messageTimeout = setTimeout(() => this.changeMessage(), Math.random() * 2000 + 2000);
    }

    updateLoadingDots() {
        // Reset dots animation if it exists
        if (this.dotInterval) {
            clearInterval(this.dotInterval);
        }
        
        this.dotCount = 0;
        
        // Create dots animation interval
        this.dotInterval = setInterval(() => {
            this.dotCount = (this.dotCount + 1) % 4;
        }, 500);
    }

    show(onCompleteCallback = null) {
        this.onCompleteCallback = onCompleteCallback;
        this.progress = 0;
        this.targetProgress = 0;
        
        // Make sure the canvas is visible
        this.canvas.style.display = 'block';
        
        // Enable transition effect
        setTimeout(() => {
            this.canvas.style.opacity = '1';
        }, 10);
        
        this.visible = true;
        this.updateLoadingDots();
        
        // Start animation
        if (this.animationRequestId === null) {
            this.lastFrameTime = performance.now();
            this.animationRequestId = requestAnimationFrame(this.animate);
        }
    }

    hide() {
        // Fade out
        this.canvas.style.opacity = '0';
        
        // Clean up after transition ends
        setTimeout(() => {
            if (this.animationRequestId) {
                cancelAnimationFrame(this.animationRequestId);
                this.animationRequestId = null;
            }
            
            this.canvas.style.display = 'none';
            this.visible = false;
            
            // Clear intervals
            if (this.dotInterval) {
                clearInterval(this.dotInterval);
                this.dotInterval = null;
            }
            
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout);
                this.messageTimeout = null;
            }
        }, 600); // Match transition duration
    }

    setProgress(value) {
        this.targetProgress = Math.max(0, Math.min(1, value));
        
        // If progress reaches 100%, call the complete callback after a delay
        if (this.targetProgress >= 1 && this.onCompleteCallback) {
            setTimeout(() => {
                this.hide();
                setTimeout(() => {
                    this.onCompleteCallback();
                }, 600); // Wait for hide transition
            }, 500); // Show 100% for half a second
        }
    }

    animate(currentTime) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Smoothly update progress
        const progressDiff = this.targetProgress - this.progress;
        this.progress += progressDiff * Math.min(1, deltaTime / 200);
        
        // Update dust particle positions
        this.updateDustParticles(deltaTime);
        
        // Update nebula clouds
        this.updateNebulaClouds(deltaTime);
        
        // Draw the frame
        this.draw();
        
        // Continue animation loop if visible
        if (this.visible) {
            this.animationRequestId = requestAnimationFrame(this.animate);
        }
    }

    updateDustParticles(deltaTime) {
        for (let dust of this.dustParticles) {
            // Apply drift
            dust.x += dust.drift.x * deltaTime / 16;
            dust.y += dust.drift.y * deltaTime / 16;
            
            // Wrap around screen
            if (dust.x < 0) dust.x = this.canvas.width;
            if (dust.x > this.canvas.width) dust.x = 0;
            if (dust.y < 0) dust.y = this.canvas.height;
            if (dust.y > this.canvas.height) dust.y = 0;
        }
    }

    updateNebulaClouds(deltaTime) {
        for (let cloud of this.nebulaClouds) {
            // Rotate the cloud slightly
            cloud.rotation += cloud.rotationSpeed * deltaTime / 16;
        }
    }

    draw() {
        if (!this.ctx || !this.visible) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.fillStyle = this.colorScheme.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate parallax offset based on mouse position
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const offsetX = (this.mouseX - centerX) / centerX * this.parallaxStrength;
        const offsetY = (this.mouseY - centerY) / centerY * this.parallaxStrength;
        
        // Draw nebula clouds (background effect)
        this.drawNebulaClouds(ctx, offsetX, offsetY);
        
        // Draw dust particles
        this.drawDustParticles(ctx, offsetX, offsetY);
        
        // Draw stars with parallax effect
        this.drawStars(ctx, offsetX, offsetY);
        
        // Draw loading text and progress bar
        this.drawLoadingUI(ctx);
    }

    drawNebulaClouds(ctx, offsetX, offsetY) {
        for (let cloud of this.nebulaClouds) {
            const parallaxX = cloud.x + offsetX * cloud.parallaxFactor;
            const parallaxY = cloud.y + offsetY * cloud.parallaxFactor;
            
            // Create radial gradient
            const gradient = ctx.createRadialGradient(
                parallaxX, parallaxY, 0,
                parallaxX, parallaxY, cloud.radius
            );
            
            gradient.addColorStop(0, cloud.color1);
            gradient.addColorStop(0.6, cloud.color2);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.save();
            ctx.translate(parallaxX, parallaxY);
            ctx.rotate(cloud.rotation);
            ctx.translate(-parallaxX, -parallaxY);
            
            // Draw nebula cloud
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(
                parallaxX, 
                parallaxY, 
                cloud.radius, 
                cloud.radius * 0.7, 
                cloud.rotation, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.restore();
        }
    }

    drawDustParticles(ctx, offsetX, offsetY) {
        for (let dust of this.dustParticles) {
            const parallaxX = dust.x + offsetX * dust.parallaxFactor;
            const parallaxY = dust.y + offsetY * dust.parallaxFactor;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${dust.opacity})`;
            ctx.beginPath();
            ctx.arc(parallaxX, parallaxY, dust.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawStars(ctx, offsetX, offsetY) {
        const time = performance.now() / 1000;
        
        for (let star of this.stars) {
            // Apply parallax effect based on mouse position
            const parallaxX = star.x + offsetX * star.parallaxFactor;
            const parallaxY = star.y + offsetY * star.parallaxFactor;
            
            // Calculate pulsing effect
            const pulseScale = 1 + Math.sin(time * star.pulseSpeed + star.pulseOffset) * 0.2 * star.pulse;
            
            // Randomly twinkle some stars (change opacity)
            let opacity = 1;
            if (star.twinkleChance > 0.7) {
                opacity = 0.5 + Math.sin(time * star.pulseSpeed * 3 + star.pulseOffset) * 0.5;
            }
            
            const finalSize = star.size * pulseScale;
            
            // Draw the star
            ctx.fillStyle = star.color;
            ctx.globalAlpha = opacity;
            
            // For larger stars, draw a glow effect
            if (finalSize > 1.8) {
                const glow = ctx.createRadialGradient(
                    parallaxX, parallaxY, 0,
                    parallaxX, parallaxY, finalSize * 2
                );
                
                glow.addColorStop(0, star.color);
                glow.addColorStop(0.5, `${star.color}80`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(parallaxX, parallaxY, finalSize * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw the star core
            ctx.beginPath();
            ctx.arc(parallaxX, parallaxY, finalSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
        }
    }

    // Draw an animated cosmic portal effect
    drawCosmicPortal(ctx, centerX, centerY, time) {
        // Draw outer spinning ring
        const outerRadius = 120 + Math.sin(time) * 5;
        const innerRadius = 100 + Math.sin(time * 1.5) * 3;
        
        // Create portal effect with gradient
        const portalGradient = ctx.createRadialGradient(
            centerX, centerY, innerRadius * 0.2,
            centerX, centerY, outerRadius
        );
        
        // Animated color stops based on time
        const hue1 = (200 + Math.sin(time * 0.2) * 20) % 360;
        const hue2 = (240 + Math.sin(time * 0.3) * 30) % 360;
        
        portalGradient.addColorStop(0, `hsla(${hue1}, 80%, 50%, 0.2)`);
        portalGradient.addColorStop(0.5, `hsla(${hue2}, 70%, 40%, 0.15)`);
        portalGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Draw portal base
        ctx.fillStyle = portalGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw energy rings
        for (let i = 0; i < 3; i++) {
            const ringRadius = innerRadius * (0.7 + i * 0.15);
            const ringWidth = 2 - i * 0.5;
            const ringOpacity = 0.5 - i * 0.15;
            const ringPosition = time * (1 + i * 0.2) % (Math.PI * 2);
            
            ctx.strokeStyle = `rgba(120, 220, 255, ${ringOpacity})`;
            ctx.lineWidth = ringWidth;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw energy pulses along the rings
            for (let j = 0; j < 8; j++) {
                const pulseAngle = ringPosition + j * (Math.PI / 4);
                const pulseX = centerX + Math.cos(pulseAngle) * ringRadius;
                const pulseY = centerY + Math.sin(pulseAngle) * ringRadius;
                const pulseSize = 3 - i * 0.5 + Math.sin(time * 3 + j) * 1;
                
                ctx.fillStyle = `rgba(180, 230, 255, ${ringOpacity * 1.5})`;
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw central energy core
        const coreGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, innerRadius * 0.4
        );
        
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        coreGradient.addColorStop(0.5, 'rgba(120, 220, 255, 0.5)');
        coreGradient.addColorStop(1, 'rgba(70, 130, 180, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw light rays from the core
        const rayCount = 12;
        for (let i = 0; i < rayCount; i++) {
            const rayAngle = (i * (Math.PI * 2 / rayCount) + time * 0.2) % (Math.PI * 2);
            const rayLength = innerRadius * (0.5 + Math.sin(time * 2 + i) * 0.1);
            
            ctx.strokeStyle = `rgba(120, 220, 255, ${0.1 + Math.sin(time * 3 + i) * 0.05})`;
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(rayAngle) * rayLength,
                centerY + Math.sin(rayAngle) * rayLength
            );
            ctx.stroke();
        }
    }
    
    drawLoadingUI(ctx) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() / 1000;
        
        // Draw animated cosmic portal
        this.drawCosmicPortal(ctx, centerX, centerY, time);
        
        // Draw loading text with glow effect
        const fontSize = 32;
        ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(79, 195, 247, 0.7)';
        ctx.fillStyle = '#ffffff';
        
        const dots = '.'.repeat(this.dotCount);
        ctx.fillText(`${this.loadingText}${dots}`, centerX, centerY - 60);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw loading message with fade in/out effect
        const messageOpacity = 0.7 + Math.sin(time * 2) * 0.3;
        ctx.font = '18px "Arial", sans-serif';
        ctx.fillStyle = `rgba(255, 255, 255, ${messageOpacity})`;
        ctx.fillText(this.currentMessage, centerX, centerY - 25);
        
        // Create a futuristic container for the progress bar
        const progressBarWidth = this.progressBarWidth;
        const progressBarHeight = 6; // Taller progress bar
        const progressBarX = centerX - progressBarWidth / 2;
        const progressBarY = centerY + 40;
        
        // Draw progress bar container with edge accents
        ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)';
        ctx.lineWidth = 1;
        
        // Main container
        ctx.beginPath();
        ctx.roundRect(progressBarX - 10, progressBarY - 5, progressBarWidth + 20, progressBarHeight + 10, 4);
        ctx.fill();
        ctx.stroke();
        
        // Edge accents
        const accentWidth = 20;
        ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
        
        // Left accent
        ctx.beginPath();
        ctx.moveTo(progressBarX - 10, progressBarY - 5);
        ctx.lineTo(progressBarX - 10 + accentWidth, progressBarY - 5);
        ctx.lineTo(progressBarX - 5 + accentWidth, progressBarY);
        ctx.lineTo(progressBarX - 5, progressBarY);
        ctx.closePath();
        ctx.fill();
        
        // Right accent
        ctx.beginPath();
        ctx.moveTo(progressBarX + progressBarWidth + 10, progressBarY + progressBarHeight + 5);
        ctx.lineTo(progressBarX + progressBarWidth + 10 - accentWidth, progressBarY + progressBarHeight + 5);
        ctx.lineTo(progressBarX + progressBarWidth + 5 - accentWidth, progressBarY + progressBarHeight);
        ctx.lineTo(progressBarX + progressBarWidth + 5, progressBarY + progressBarHeight);
        ctx.closePath();
        ctx.fill();
        
        // Progress bar background
        ctx.fillStyle = this.colorScheme.progressBarBg;
        ctx.beginPath();
        ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 3);
        ctx.fill();
        
        // Draw progress bar fill with animated gradient
        const fillWidth = progressBarWidth * this.progress;
        
        // Create animated gradient fill for progress bar
        const progressGradient = ctx.createLinearGradient(
            progressBarX, 0,
            progressBarX + progressBarWidth, 0
        );
        
        progressGradient.addColorStop(0, this.colorScheme.progressBar);
        progressGradient.addColorStop(1, '#a7e3fa');
        
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(progressBarX, progressBarY, fillWidth, this.progressBarHeight, 2);
        ctx.fill();
        
        // Draw percentage text
        ctx.font = '14px "Arial", sans-serif';
        ctx.fillStyle = this.colorScheme.text;
        ctx.fillText(`${Math.round(this.progress * 100)}%`, centerX, progressBarY + 25);
        
        // Draw pulsing "interactive" hint text if progress is stalled
        if (this.progress < 0.1 && this.interactive) {
            const hintOpacity = 0.5 + Math.sin(performance.now() / 500) * 0.3;
            ctx.font = '14px "Arial", sans-serif';
            ctx.fillStyle = `rgba(255, 255, 255, ${hintOpacity})`;
            ctx.fillText('Move your mouse to interact with the stars', centerX, centerY + 80);
        }
        
        // Draw completion message when nearly done
        if (this.progress > 0.95) {
            const completionOpacity = Math.min(1, (this.progress - 0.95) * 20);
            ctx.font = '18px "Arial", sans-serif';
            ctx.fillStyle = `rgba(255, 255, 255, ${completionOpacity})`;
            ctx.fillText('Warp drive ready!', centerX, centerY + 80);
            
            // Draw pulsing effect around completion text
            ctx.strokeStyle = `rgba(79, 195, 247, ${completionOpacity * 0.5 + Math.sin(performance.now() / 300) * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(centerX - 100, centerY + 65, 200, 25, 12);
            ctx.stroke();
        }
    }
}