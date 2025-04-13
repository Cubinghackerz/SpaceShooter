class DebugInfo {
    constructor() {
        this.lastTime = performance.now();
        
        // Render FPS tracking
        this.renderFrames = 0;
        this.renderFps = 0;
        this.lastRenderFpsUpdate = 0;
        
        // Physics FPS tracking
        this.physicsFrames = 0;
        this.physicsFps = 0;
        this.lastPhysicsFpsUpdate = 0;
        
        // Create FPS display at top of screen - now positioned to avoid ship selector
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.className = 'fps-display';
        this.fpsDisplay.style.position = 'fixed';
        this.fpsDisplay.style.top = '5px';
        this.fpsDisplay.style.right = '5px'; // Position on the right side instead of center
        this.fpsDisplay.style.transform = 'none'; // Remove center transform
        this.fpsDisplay.style.background = 'rgba(0, 0, 0, 0.6)';
        this.fpsDisplay.style.color = '#fff';
        this.fpsDisplay.style.padding = '4px 8px';
        this.fpsDisplay.style.borderRadius = '4px';
        this.fpsDisplay.style.fontFamily = 'monospace';
        this.fpsDisplay.style.fontSize = '12px';
        this.fpsDisplay.style.zIndex = '1000';
        this.fpsDisplay.style.textAlign = 'right'; // Right-align text
        document.body.appendChild(this.fpsDisplay);
        
        // Update FPS display
        setInterval(() => this.updateFpsDisplay(), 500);
    }

    updateRenderFps() {
        const now = performance.now();
        this.renderFrames++;

        if (now - this.lastRenderFpsUpdate >= 1000) {
            this.renderFps = Math.round((this.renderFrames * 1000) / (now - this.lastRenderFpsUpdate));
            this.renderFrames = 0;
            this.lastRenderFpsUpdate = now;
        }
    }
    
    updatePhysicsFps() {
        const now = performance.now();
        this.physicsFrames++;
        
        if (now - this.lastPhysicsFpsUpdate >= 1000) {
            this.physicsFps = Math.round((this.physicsFrames * 1000) / (now - this.lastPhysicsFpsUpdate));
            this.physicsFrames = 0;
            this.lastPhysicsFpsUpdate = now;
        }
    }
    
    updateFpsDisplay() {
        // Get performance data from game if available
        let performanceInfo = '';
        let performanceDetails = '';
        
        if (window.game && window.game.performanceMonitor) {
            const spawnReduction = window.game.performanceMonitor.spawnRateReduction.toFixed(1);
            const isLagging = window.game.performanceMonitor.isLagging;
            const isMildlyLagging = window.game.performanceMonitor.isMildlyLagging;
            
            // Set color based on performance state
            let color = '#4CAF50'; // Green (good)
            if (isLagging) {
                color = '#FF5722'; // Red (critical)
            } else if (isMildlyLagging) {
                color = '#FFC107'; // Yellow (warning)
            }
            
            // Add basic info to main display
            performanceInfo = ` | <span style="color: ${color};">Spawn Rate: ${spawnReduction}x</span>`;
            
            // Add detailed performance info
            const avgFps = window.game.performanceMonitor.fpsHistory.length > 0 ? 
                (window.game.performanceMonitor.fpsHistory.reduce((a, b) => a + b, 0) / 
                window.game.performanceMonitor.fpsHistory.length).toFixed(1) : 'N/A';
                
            const fpsHistory = window.game.performanceMonitor.fpsHistory.map(f => f.toFixed(0)).join(', ');
            
            const status = isLagging ? 'CRITICAL' : (isMildlyLagging ? 'WARNING' : 'GOOD');
            
            performanceDetails = `
                <div style="font-size: 10px; margin-top: 2px; padding: 2px; background: rgba(0,0,0,0.4); border-radius: 2px;">
                    <span style="color: ${color};">Status: ${status}</span> |
                    Avg FPS: ${avgFps} | 
                    History: [${fpsHistory}] |
                    Thresholds: ${window.game.performanceMonitor.lowFpsThreshold}/${window.game.performanceMonitor.mediumFpsThreshold}
                </div>
            `;
        }
        
        // Update the FPS display at the top of the screen
        this.fpsDisplay.innerHTML = `
            <span style="color: #4CAF50;">Render: ${this.renderFps} FPS</span> | 
            <span style="color: #2196F3;">Physics: ${this.physicsFps} FPS</span>${performanceInfo}
            ${performanceDetails}
        `;
    }

    toggle() {
        // No longer used but kept for API compatibility
    }

    draw() {
        // Only update render FPS
        // No need to draw anything as we're using the fpsDisplay at the top
    }
}
