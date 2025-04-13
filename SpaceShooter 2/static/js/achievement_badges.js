/**
 * Achievement Badge System
 * Manages SVG animated badges for achievement display and interactions
 * Version 1.0.0
 */
class AchievementBadges {
    constructor() {
        // Map of achievement IDs to badge SVG paths
        this.badgeMap = {
            // Default badge for when specific badges are not available
            default: '/static/assets/achievements/badge-template.svg',
            
            // Specific achievement badges
            firstKill: '/static/assets/achievements/first-kill.svg',
            sharpshooter: '/static/assets/achievements/sharpshooter.svg',
            dimensionTraveler: '/static/assets/achievements/dimension-traveler.svg',
            destroyer: '/static/assets/achievements/destroyer.svg',
            tankBuster: '/static/assets/achievements/tank-buster.svg',
            survivor: '/static/assets/achievements/survivor.svg',
            highScore: '/static/assets/achievements/high-score.svg',
            upgrader: '/static/assets/achievements/upgrader.svg',
            killChain: '/static/assets/achievements/kill-chain.svg',
            multiplierMaster: '/static/assets/achievements/multiplier-master.svg'
        };
        
        // Cache loaded badges to avoid repeated fetches
        this.badgeCache = {};
        
        // Animation states for badges
        this.animationStates = {};
    }
    
    /**
     * Get the badge SVG path for an achievement
     * @param {string} achievementId - The achievement identifier
     * @returns {string} - Path to the SVG badge
     */
    getBadgePath(achievementId) {
        return this.badgeMap[achievementId] || this.badgeMap.default;
    }
    
    /**
     * Load an SVG badge from a path
     * @param {string} achievementId - The achievement identifier
     * @returns {Promise<string>} - Promise resolving to SVG content
     */
    async loadBadge(achievementId) {
        const path = this.getBadgePath(achievementId);
        
        // Return from cache if available
        if (this.badgeCache[path]) {
            return this.badgeCache[path];
        }
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load badge: ${response.status}`);
            }
            
            const svgContent = await response.text();
            this.badgeCache[path] = svgContent;
            return svgContent;
        } catch (error) {
            console.error(`Error loading badge for ${achievementId}:`, error);
            // Fallback to default badge
            return this.loadBadge('default');
        }
    }
    
    /**
     * Create a badge element and inject it into the DOM
     * @param {string} achievementId - The achievement identifier
     * @param {HTMLElement} container - Container element to append badge to
     * @param {boolean} isUnlocked - Whether the achievement is unlocked
     * @returns {Promise<HTMLElement>} - Promise resolving to the created element
     */
    async createBadgeElement(achievementId, container, isUnlocked = false) {
        try {
            const svgContent = await this.loadBadge(achievementId);
            
            // Create a wrapper div for the badge
            const badgeElement = document.createElement('div');
            badgeElement.className = `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
            badgeElement.innerHTML = svgContent;
            
            // Apply locked state styles if needed
            if (!isUnlocked) {
                this.applyLockedStyles(badgeElement);
            }
            
            // Add to container if provided
            if (container) {
                container.appendChild(badgeElement);
            }
            
            return badgeElement;
        } catch (error) {
            console.error(`Error creating badge for ${achievementId}:`, error);
            return null;
        }
    }
    
    /**
     * Apply styles to make a badge appear locked/greyed out
     * @param {HTMLElement} badgeElement - The badge element to modify
     */
    applyLockedStyles(badgeElement) {
        if (!badgeElement) return;
        
        const svg = badgeElement.querySelector('svg');
        if (!svg) return;
        
        // Add a filter to the SVG for greyscale
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <filter id="grayscale">
                <feColorMatrix type="matrix" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0"/>
                <feComponentTransfer>
                    <feFuncR type="linear" slope="0.5"/>
                    <feFuncG type="linear" slope="0.5"/>
                    <feFuncB type="linear" slope="0.5"/>
                </feComponentTransfer>
            </filter>
        `;
        
        svg.insertBefore(defs, svg.firstChild);
        svg.setAttribute('filter', 'url(#grayscale)');
        svg.style.opacity = '0.6';
        
        // Disable animations for locked badges
        const animations = svg.querySelectorAll('animate, animateTransform');
        animations.forEach(animation => {
            animation.setAttribute('repeatCount', '0');
        });
    }
    
    /**
     * Run unlock animation for a badge
     * @param {HTMLElement} badgeElement - The badge element to animate
     */
    animateUnlock(badgeElement) {
        if (!badgeElement) return;
        
        // Remove locked styles
        const svg = badgeElement.querySelector('svg');
        if (!svg) return;
        
        // Remove grayscale filter
        svg.removeAttribute('filter');
        svg.style.opacity = '1';
        
        // Add scale animation to the element
        badgeElement.style.animation = 'badge-unlock 1.5s ease-out';
        badgeElement.style.transform = 'scale(1.2)';
        
        // Re-enable SVG animations
        const animations = svg.querySelectorAll('animate, animateTransform');
        animations.forEach(animation => {
            // Reset the animations by removing and re-adding them
            const parent = animation.parentNode;
            const clone = animation.cloneNode(true);
            animation.remove();
            setTimeout(() => {
                clone.setAttribute('repeatCount', 'indefinite');
                parent.appendChild(clone);
            }, 10);
        });
        
        // Reset after animation completes
        setTimeout(() => {
            badgeElement.style.transform = 'scale(1)';
        }, 1500);
    }
    
    /**
     * Add hover interaction effects to badge
     * @param {HTMLElement} badgeElement - The badge element to enhance
     */
    addHoverEffects(badgeElement) {
        if (!badgeElement) return;
        
        badgeElement.addEventListener('mouseenter', () => {
            this.animationStates[badgeElement.id] = 'hover';
            badgeElement.style.transform = 'scale(1.1) rotate(5deg)';
            badgeElement.style.transition = 'transform 0.3s ease-out';
        });
        
        badgeElement.addEventListener('mouseleave', () => {
            this.animationStates[badgeElement.id] = 'normal';
            badgeElement.style.transform = 'scale(1) rotate(0deg)';
        });
        
        badgeElement.addEventListener('click', () => {
            // Add pulse animation
            badgeElement.style.animation = 'badge-pulse 0.5s ease-out';
            setTimeout(() => {
                badgeElement.style.animation = '';
            }, 500);
        });
    }
}

// Make globally available
window.achievementBadges = new AchievementBadges();