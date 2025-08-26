class ImageShuffler {
    constructor(containerId = 'imageContainer', instanceId = '1') {
        this.container = document.getElementById(containerId);
        this.instanceId = instanceId;
        this.isRunning = false;
        this.activeImages = [];
        this.usedImages = [];
        this.availableImages = [];
        this.imageQueue = []; // Queue of images ready to be shown
        this.currentCycle = 1; // Track which cycle we're in
        this.animationId = null;
        
        // Performance optimization settings
        this.targetFPS = 50;
        this.frameInterval = 1000 / this.targetFPS; // 20ms per frame
        this.lastFrameTime = 0;
        this.performanceStats = {
            frameCount: 0,
            droppedFrames: 0,
            avgFrameTime: 0,
            lastSecondFrames: 0
        };
        
        // Default settings
        this.settings = {
            maxImages: 3,
            speed: 2,
            bottomOffset: 100,
            topOffset: 100,
            imageScale: 150,
            blurAmount: 5,
            frameEnabled: true,
            frameStyle: 'neon',
            frameWidth: 4,
            glowIntensity: 50,
            frameVariation: true,
            frameAnimation: true,
            effectIntensity: 100,
            brandColor1: '#667eea',
            brandColor2: '#764ba2',
            colorVariation: 25,
            backgroundColor: '#667eea',
            centerZoneStart: 20, // Percentage of screen height where "on time" zone starts
            centerZoneEnd: 80,   // Percentage of screen height where "on time" zone ends
            easingStrength: 2.0, // Strength of logarithmic easing (1.0 = linear, 2.0 = moderate, 4.0 = strong)
            onTimeVariation: 15, // Percentage variation in individual center zones (±15%)
            displayCenter: 50,   // Main display center at 50% of screen height
            minSpacing: 200,     // Minimum spacing between images on X-axis (pixels)
            parkWaitTime: 2000,  // Time to wait in park area (milliseconds)
            parkAreaHeight: 100, // Height of park area where images slow down (pixels)
            minParkSpeed: 0.1,   // Minimum speed in park area (fraction of normal speed)
            parkZoneOffset: 0,   // Vertical offset for park zone from display center (pixels, + = down, - = up)
            speedVariation: 30,  // Percentage variation in individual image speeds (±30%)
            imagesFolder: instanceId === '1' ? 'images' : 'images2'
        };
        
        // Track active images for collision detection
        this.activeImagePositions = [];
        
        this.loadSettings();
        this.applyBackgroundColor();
        this.loadImages();
        
        // Auto-start the shuffler
        this.start();
    }
    
    loadSettings() {
        // First load from localStorage
        const saved = localStorage.getItem(`imageShuffler_${this.instanceId}_settings`);
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        // Then check for URL parameters to override settings
        this.loadSettingsFromURL();
    }
    
    loadSettingsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Define parameter mappings
        const paramMap = {
            'maxImages': 'maxImages',
            'speed': 'speed', 
            'scale': 'imageScale',
            'blur': 'blurAmount',
            'frame': 'frameEnabled',
            'frameStyle': 'frameStyle',
            'frameWidth': 'frameWidth',
            'glow': 'glowIntensity',
            'variation': 'frameVariation',
            'animation': 'frameAnimation',
            'effect': 'effectIntensity',
            'color1': 'brandColor1',
            'color2': 'brandColor2',
            'colorVar': 'colorVariation',
            'bg': 'backgroundColor',
            'centerStart': 'centerZoneStart',
            'centerEnd': 'centerZoneEnd',
            'spacing': 'minSpacing',
            'parkWait': 'parkWaitTime',
            'parkHeight': 'parkAreaHeight',
            'parkSpeed': 'minParkSpeed',
            'parkOffset': 'parkZoneOffset',
            'speedVar': 'speedVariation'
        };
        
        // Apply URL parameters
        for (const [urlParam, settingKey] of Object.entries(paramMap)) {
            if (urlParams.has(urlParam)) {
                const value = urlParams.get(urlParam);
                
                // Parse the value based on setting type
                if (typeof this.settings[settingKey] === 'boolean') {
                    this.settings[settingKey] = value.toLowerCase() === 'true';
                } else if (typeof this.settings[settingKey] === 'number') {
                    this.settings[settingKey] = parseFloat(value);
                } else {
                    this.settings[settingKey] = value;
                }
            }
        }
        
        // Special handling for preset loading
        if (urlParams.has('preset')) {
            this.loadPresetFromURL(urlParams.get('preset'));
        }
    }
    
    loadPresetFromURL(presetName) {
        const presets = JSON.parse(localStorage.getItem(`imageShuffler_${this.instanceId}_presets`) || '{}');
        if (presets[presetName]) {
            this.settings = { ...this.settings, ...presets[presetName] };
        }
    }
    
    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem(`imageShuffler_${this.instanceId}_settings`, JSON.stringify(this.settings));
    }
    
    async loadImages() {
        try {
            const response = await fetch(`/api/images/${this.settings.imagesFolder}`);
            const images = await response.json();
            
            this.availableImages = images.filter(img => 
                img.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            // Load image queue state from storage
            this.loadImageQueue();
            
        } catch (error) {
            // Fallback to mock images for testing
            this.availableImages = Array.from({length: 10}, (_, i) => `image${i + 1}.jpg`);
        }
    }
    
    initializeImageQueue() {
        
        // Create a shuffled copy of all available images
        const shuffledImages = [...this.availableImages];
        for (let i = shuffledImages.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledImages[i], shuffledImages[j]] = [shuffledImages[j], shuffledImages[i]];
        }
        
        this.imageQueue = shuffledImages;
        
        // Reset used images for new cycle
        this.usedImages = [];
        this.saveUsedImages();
    }
    
    getNextQueuedImage() {
        // Initialize queue if empty or if this is the first run
        if (this.imageQueue.length === 0) {
            if (this.availableImages.length === 0) {
                return null;
            }
            this.initializeImageQueue();
        }
        
        // Get next image from queue
        const selected = this.imageQueue.shift();
        this.usedImages.push(selected);
        this.saveUsedImages();
        
        
        // If queue is empty, prepare for next cycle
        if (this.imageQueue.length === 0) {
            this.currentCycle++;
        }
        
        return selected;
    }
    
    saveUsedImages() {
        const usedKey = `imageShuffler_${this.instanceId}_used`;
        const queueKey = `imageShuffler_${this.instanceId}_queue`;
        const cycleKey = `imageShuffler_${this.instanceId}_cycle`;
        
        localStorage.setItem(usedKey, JSON.stringify(this.usedImages));
        localStorage.setItem(queueKey, JSON.stringify(this.imageQueue));
        localStorage.setItem(cycleKey, JSON.stringify(this.currentCycle));
    }
    
    loadImageQueue() {
        const usedKey = `imageShuffler_${this.instanceId}_used`;
        const queueKey = `imageShuffler_${this.instanceId}_queue`;
        const cycleKey = `imageShuffler_${this.instanceId}_cycle`;
        
        const savedUsed = localStorage.getItem(usedKey);
        const savedQueue = localStorage.getItem(queueKey);
        const savedCycle = localStorage.getItem(cycleKey);
        
        if (savedUsed) {
            this.usedImages = JSON.parse(savedUsed);
        }
        
        if (savedQueue) {
            this.imageQueue = JSON.parse(savedQueue);
        }
        
        if (savedCycle) {
            this.currentCycle = JSON.parse(savedCycle);
        }
    }
    
    findNonCollidingXPosition(windowWidth) {
        const maxAttempts = 20;
        const imageSize = this.settings.imageScale;
        const minSpacing = this.settings.minSpacing;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidateX = Math.random() * (windowWidth - imageSize);
            let hasCollision = false;
            
            // Check against all active images
            for (const activePos of this.activeImagePositions) {
                const distance = Math.abs(candidateX - activePos.currentX);
                if (distance < minSpacing) {
                    hasCollision = true;
                    break;
                }
            }
            
            if (!hasCollision) {
                return candidateX;
            }
        }
        
        // If no non-colliding position found, use a distributed approach
        const section = this.activeImagePositions.length;
        const sectionWidth = windowWidth / (this.settings.maxImages + 1);
        const distributedX = sectionWidth * (section + 1) - imageSize/2;
        
        return Math.max(0, Math.min(windowWidth - imageSize, distributedX));
    }
    
    createImageElement(imagePath) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'floating-image';
        
        const img = document.createElement('img');
        img.src = `/api/images/${this.settings.imagesFolder}/${imagePath}`;
        img.onerror = () => {
            // Fallback to placeholder
            img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23ccc"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="%23999">Image</text></svg>`;
        };
        
        imageWrapper.appendChild(img);
        
        // Get window dimensions for positioning
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const displayCenterY = windowHeight * (this.settings.displayCenter / 100);
        
        // Find non-colliding X position
        const startX = this.findNonCollidingXPosition(windowWidth);
        
        const startY = windowHeight + this.settings.bottomOffset;
        
        // Calculate individual park target Y position (with variation around display center + park offset)
        const baseCenter = this.settings.displayCenter;
        const variation = (Math.random() - 0.5) * this.settings.onTimeVariation * 2; // ±variation%
        const individualParkCenter = Math.max(10, Math.min(90, baseCenter + variation));
        const baseParkTargetY = windowHeight * (individualParkCenter / 100);
        const parkTargetY = baseParkTargetY + this.settings.parkZoneOffset;
        
        // Calculate individual speed variation (±variation% of base speed)
        const speedVariationFactor = 1 + ((Math.random() - 0.5) * (this.settings.speedVariation / 100) * 2);
        const individualSpeed = this.settings.speed * speedVariationFactor;
        
        // Store position data for collision detection and animation
        const positionData = {
            element: imageWrapper,
            startX: startX,
            currentX: startX,
            displayCenterY: displayCenterY,
            parkTargetY: parkTargetY,
            parkStartY: parkTargetY - (this.settings.parkAreaHeight / 2),
            parkEndY: parkTargetY + (this.settings.parkAreaHeight / 2),
            speed: individualSpeed, // Individual speed for this image
            isInPark: false,
            parkStartTime: null,
            hasWaited: false,
            fadeStarted: false,
            fadeStartTime: null,
            fadeStartY: null
        };
        
        this.activeImagePositions.push(positionData);
        
        imageWrapper.style.left = `${startX}px`;
        imageWrapper.style.top = `${startY}px`;
        imageWrapper.style.transform = 'translate(0px, 0px)'; // Initialize transform for animation
        imageWrapper.style.width = `${this.settings.imageScale}px`;
        imageWrapper.style.height = `${this.settings.imageScale}px`;
        // Hide only the image content, keeping frame visible
        const imgElement = imageWrapper.querySelector('img');
        if (imgElement) imgElement.style.opacity = '0';
        
        // Store reference for later use
        imageWrapper._positionData = positionData;
        
        // Image itself stays sharp - blur is handled by CSS pseudo-elements
        
        // Apply frame styling if enabled
        if (this.settings.frameEnabled) {
            this.applyFrameStyle(imageWrapper);
        }
        
        return imageWrapper;
    }
    
    // Color manipulation utilities for brand color variations
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }
    
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
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
        return [h, s, l];
    }
    
    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
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
        return [r * 255, g * 255, b * 255];
    }
    
    generateBrandColorVariation(baseColor, variation) {
        const rgb = this.hexToRgb(baseColor);
        if (!rgb) return baseColor;
        
        const [h, s, l] = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Create variations in hue, saturation, and lightness
        const variationAmount = variation / 100;
        const hueShift = (Math.random() - 0.5) * variationAmount * 0.3; // ±30% of variation for hue
        const satShift = (Math.random() - 0.5) * variationAmount * 0.4; // ±40% of variation for saturation  
        const lightShift = (Math.random() - 0.5) * variationAmount * 0.5; // ±50% of variation for lightness
        
        const newH = (h + hueShift + 1) % 1; // Keep hue in 0-1 range
        const newS = Math.max(0, Math.min(1, s + satShift));
        const newL = Math.max(0.1, Math.min(0.9, l + lightShift)); // Keep lightness reasonable
        
        const [r, g, b] = this.hslToRgb(newH, newS, newL);
        return this.rgbToHex(r, g, b);
    }
    
    getRandomBrandColor() {
        // Choose randomly between brandColor1 and brandColor2
        const baseColor = Math.random() > 0.5 ? this.settings.brandColor1 : this.settings.brandColor2;
        
        // Apply variation if enabled
        if (this.settings.frameVariation && this.settings.colorVariation > 0) {
            return this.generateBrandColorVariation(baseColor, this.settings.colorVariation);
        }
        
        return baseColor;
    }
    
    applyFrameStyle(imageWrapper) {
        // Base frame class
        imageWrapper.classList.add('framed');
        
        // Choose frame style
        let frameStyle = this.settings.frameStyle;
        
        // Random variation if enabled
        if (this.settings.frameVariation) {
            const frameStyles = ['classic', 'neon', 'plasma', 'cosmic', 'fire', 'ice', 'rainbow', 'electric'];
            frameStyle = frameStyles[Math.floor(Math.random() * frameStyles.length)];
        }
        
        // Get brand color variation for this image
        const primaryColor = this.getRandomBrandColor();
        const secondaryColor = this.getRandomBrandColor();
        
        // Apply frame style class (but will override colors)
        imageWrapper.classList.add(`frame-${frameStyle}`);
        
        // Optimized CSS variables - reduced calculations for performance
        const effectIntensity = this.settings.effectIntensity / 100;
        const frameWidth = Math.min(this.settings.frameWidth, 6); // Cap frame width for performance
        
        // Essential settings only
        imageWrapper.style.setProperty('--frame-width', `${frameWidth}px`);
        imageWrapper.style.setProperty('--glow-opacity', (this.settings.glowIntensity / 100) * effectIntensity);
        imageWrapper.style.setProperty('--brand-color-1', primaryColor);
        
        // Simplified color application for performance
        const rgb1 = this.hexToRgb(primaryColor);
        if (rgb1) {
            const rgba_glow = `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, ${0.4 * effectIntensity})`;
            imageWrapper.style.setProperty('--frame-color', primaryColor);
            imageWrapper.style.setProperty('--frame-glow', `0 0 12px ${rgba_glow}`);
        }
        
        // Optimized animation settings
        if (this.settings.frameAnimation) {
            const delay = Math.random() * 1; // Reduced delay range for faster start
            imageWrapper.style.setProperty('animation-delay', `${delay}s`);
            
            // Consistent animation duration for better performance
            imageWrapper.style.setProperty('animation-duration', '2s');
        }
        
        // Random scale variation for eclectic look (±5%)
        if (this.settings.frameVariation) {
            const scaleVariation = 0.95 + (Math.random() * 0.1); // 0.95 to 1.05
            imageWrapper.style.setProperty('--frame-scale', scaleVariation);
        }
    }
    
    animateImage(imageElement) {
        // Get actual window dimensions
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        const startY = windowHeight + this.settings.bottomOffset;
        // Ensure complete circle exit: center position where circle top edge + 20% safety is off-screen
        const circleRadius = this.settings.imageScale / 2;
        const safetyMargin = circleRadius * 0.2; // 20% safety margin
        const endY = -(circleRadius + safetyMargin + this.settings.topOffset);
        const startX = parseFloat(imageElement.style.left);
        const driftAmount = (Math.random() - 0.5) * 10; // Minimal drift
        
        // Get position data for this image
        const positionData = imageElement._positionData;
        if (!positionData) {
            return;
        }
        
        // Use individual image speed instead of master speed
        const individualSpeed = positionData.speed || this.settings.speed; // Fallback to master speed if not set
        const baseSpeed = individualSpeed * (this.targetFPS / 60); // Individual movement speed adjusted for target FPS
        const startTime = performance.now();
        
        let currentY = startY;
        let frameCount = 0;
        let isVisible = false; // Track if image has become visible
        let lastAnimationTime = startTime;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const deltaTime = currentTime - lastAnimationTime;
            
            // Optimized frame rate control for smoothness
            // Skip frames if running too fast to prevent excessive CPU usage
            if (deltaTime < 8) { // Cap at ~120fps to prevent over-processing
                if (currentY > endY) {
                    requestAnimationFrame(animate);
                }
                return;
            }
            
            const frameMultiplier = Math.min(2.0, deltaTime / 16.67); // Normalize to 60fps baseline, cap multiplier
            
            // Track performance stats
            this.performanceStats.frameCount++;
            const frameTime = deltaTime;
            this.performanceStats.avgFrameTime = (this.performanceStats.avgFrameTime * 0.9) + (frameTime * 0.1);
            
            if (frameTime > this.frameInterval * 1.5) {
                this.performanceStats.droppedFrames++;
            }
            
            lastAnimationTime = currentTime;
            
            // Calculate proper visibility bounds based on circle dimensions + 20% safety margin
            const circleRadius = this.settings.imageScale / 2;
            const safetyMargin = circleRadius * 0.2; // 20% safety margin
            const totalBuffer = circleRadius + safetyMargin;
            
            // Image center position bounds for visibility (accounting for full circle + safety)
            const isInVisibleArea = (currentY + circleRadius) >= -totalBuffer && 
                                  (currentY - circleRadius) <= (windowHeight + totalBuffer);
            
            // More precise: check if ANY part of the circle is potentially visible
            const circleTopEdge = currentY - circleRadius;
            const circleBottomEdge = currentY + circleRadius;
            const isCircleInView = circleBottomEdge >= -safetyMargin && 
                                  circleTopEdge <= (windowHeight + safetyMargin);
            
            // Track visibility lifecycle with precise circle bounds (preserve frame throughout)
            const imgElement = imageElement.querySelector('img');
            if (!isVisible && isCircleInView) {
                isVisible = true;
                if (imgElement) imgElement.style.opacity = '1';
            } else if (isVisible && !isCircleInView) {
                // Entire circle (+ safety margin) has left visible area - hide content but keep frame
                if (imgElement) imgElement.style.opacity = '0';
            }
            
            // Calculate distance to park area
            // Smooth movement calculation with proper easing
            const totalDistance = startY - endY;
            const currentProgress = (startY - currentY) / totalDistance;
            const parkCenterProgress = (startY - positionData.parkTargetY) / totalDistance;
            
            let targetSpeed = baseSpeed;
            
            // Simplified park zone calculation - use fixed progress percentages for smoothness
            const parkZoneRadius = 0.08; // 8% of total journey around park center (larger for smoother transitions)
            const approachZoneSize = 0.12; // 12% approach zone for gradual deceleration
            
            // Distance from park center in progress units
            const distanceFromParkCenter = Math.abs(currentProgress - parkCenterProgress);
            
            // Smooth state-based speed calculation
            if (currentProgress < parkCenterProgress - approachZoneSize) {
                // Far from park - normal speed
                targetSpeed = baseSpeed;
                
            } else if (currentProgress < parkCenterProgress - parkZoneRadius) {
                // Approaching park - smooth deceleration 
                const approachProgress = (currentProgress - (parkCenterProgress - approachZoneSize)) / (approachZoneSize - parkZoneRadius);
                const easingFactor = Math.pow(1 - approachProgress, 0.5); // Gentle curve
                targetSpeed = baseSpeed * Math.max(this.settings.minParkSpeed, 0.3 + (easingFactor * 0.7));
                
            } else if (distanceFromParkCenter <= parkZoneRadius && !positionData.hasWaited) {
                // In park zone - slow and wait
                if (!positionData.isInPark) {
                    positionData.isInPark = true;
                    positionData.parkStartTime = currentTime;
                }
                
                const timeInPark = positionData.parkStartTime ? currentTime - positionData.parkStartTime : 0;
                if (timeInPark >= this.settings.parkWaitTime) {
                    positionData.hasWaited = true;
                }
                
                targetSpeed = baseSpeed * this.settings.minParkSpeed;
                
            } else {
                // Exiting park - smooth acceleration (includes both waited images and those outside park zone)
                if (positionData.hasWaited || distanceFromParkCenter > parkZoneRadius) {
                    const exitProgress = Math.max(0, currentProgress - parkCenterProgress); // Distance past park center
                    const accelFactor = 1.2 + Math.min(2.0, exitProgress * 8); // Stronger acceleration
                    targetSpeed = baseSpeed * accelFactor;
                } else {
                    // Fallback - should not reach here but ensure movement
                    targetSpeed = baseSpeed;
                }
            }
            
            // Smooth speed interpolation to prevent stuttering
            if (!positionData.currentSpeed) positionData.currentSpeed = baseSpeed;
            const speedLerpFactor = Math.min(1.0, deltaTime / 100); // Smooth over 100ms
            positionData.currentSpeed = positionData.currentSpeed + (targetSpeed - positionData.currentSpeed) * speedLerpFactor;
            
            // Apply frame-rate independent movement
            const frameAdjustedSpeed = positionData.currentSpeed * frameMultiplier;
            currentY -= frameAdjustedSpeed;
            
            // Keep X position fixed with minimal drift
            const currentX = startX + (driftAmount * (startY - currentY) / (startY - endY) * 0.05);
            
            // Update position data for collision detection
            positionData.currentX = currentX;
            
            // Handle fade out animation when hitting top boundary
            const topBoundary = 0; // Screen top
            const fadeStartY = topBoundary;
            const totalFadeDistance = Math.abs(endY - fadeStartY); // Distance from top to final exit
            const halfFadeDistance = totalFadeDistance / 2; // Half the distance for fade duration
            
            // Start fade when image center hits top boundary
            if (currentY <= fadeStartY && !positionData.fadeStarted) {
                positionData.fadeStarted = true;
                positionData.fadeStartTime = currentTime;
                positionData.fadeStartY = currentY;
            }
            
            // Apply fade out during the first half of exit journey
            if (positionData.fadeStarted && currentY > endY) {
                const fadeProgress = Math.abs(currentY - fadeStartY) / halfFadeDistance;
                const opacity = Math.max(0, 1 - Math.min(1, fadeProgress));
                // Apply fade to the entire image wrapper (including frame)
                imageElement.style.opacity = opacity;
            } else if (!positionData.fadeStarted) {
                // Ensure full opacity before fade starts
                imageElement.style.opacity = '1';
            }
            
            // Use transform for smoother sub-pixel rendering and hardware acceleration
            imageElement.style.transform = `translate(${currentX - startX}px, ${currentY - startY}px)`;
            
            frameCount++;
            
            // Optimized continuation logic
            const shouldContinue = currentY > endY;
            
            if (shouldContinue) {
                if (isCircleInView) {
                    // High-priority animation for visible circles
                    requestAnimationFrame(animate);
                } else {
                    // Reduced frequency for off-screen circles (30fps for efficiency)
                    setTimeout(() => requestAnimationFrame(animate), Math.max(this.frameInterval, 33));
                }
            } else {
                // Circle has fully exited with safety margin - safe to remove
                const fps = frameCount / (elapsed / 1000);
                const finalCircleTop = currentY - circleRadius;
                this.removeImage(imageElement);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    removeImage(imageElement) {
        const index = this.activeImages.indexOf(imageElement);
        if (index > -1) {
            this.activeImages.splice(index, 1);
        }
        
        // Remove from position tracking
        const positionData = imageElement._positionData;
        if (positionData) {
            const posIndex = this.activeImagePositions.indexOf(positionData);
            if (posIndex > -1) {
                this.activeImagePositions.splice(posIndex, 1);
            }
        }
        
        if (imageElement.parentNode) {
            imageElement.parentNode.removeChild(imageElement);
        }
    }
    
    addNewImage() {
        const visibleImages = this.getVisibleImageCount();
        const totalActive = this.activeImages.length;
        
        // Limit based on visible images, but also prevent excessive total images (max 2x visible limit)
        if (visibleImages >= this.settings.maxImages || totalActive >= (this.settings.maxImages * 2)) {
            return;
        }
        
        const imagePath = this.getNextQueuedImage();
        
        if (!imagePath) {
            return;
        }
        
        const imageElement = this.createImageElement(imagePath);
        
        this.container.appendChild(imageElement);
        this.activeImages.push(imageElement);
        
        this.animateImage(imageElement);
    }
    
    start() {
        this.isRunning = true;
        this.resetPerformanceStats();
        
        // Start performance monitoring
        setTimeout(() => this.adjustPerformanceSettings(), 2000); // Allow initial stabilization
        
        this.run();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        
        // Clear all active images
        this.activeImages.forEach(img => this.removeImage(img));
        this.activeImages = [];
    }
    
    run() {
        if (!this.isRunning) return;
        
        // Count total active images (entire lifecycle from spawn to exit)
        const visibleImages = this.getVisibleImageCount();
        const totalActiveImages = this.activeImages.length;
        
        // Add new images to maintain the desired visible count
        if (visibleImages < this.settings.maxImages && totalActiveImages < (this.settings.maxImages * 2)) {
            this.addNewImage();
        }
        
        // Schedule next check - more frequent when below target visible count for responsiveness
        const delay = visibleImages >= this.settings.maxImages ? 
            Math.random() * 2000 + 1000 : // Normal interval when at target
            Math.random() * 1000 + 300;   // Faster interval when below target
        this.animationId = setTimeout(() => this.run(), delay);
    }
    
    applyBackgroundColor() {
        if (this.settings.backgroundColor) {
            document.body.style.background = this.settings.backgroundColor;
        }
    }
    
    updateSettings(newSettings) {
        this.saveSettings(newSettings);
        
        // Apply background color if changed
        if (newSettings.backgroundColor) {
            this.applyBackgroundColor();
        }
        
        // Update existing images if needed
        this.activeImages.forEach(img => {
            // Remove all frame classes first
            img.className = img.className.replace(/\bframe-\w+\b/g, '');
            img.classList.remove('framed');
            
            // Apply new frame if enabled
            if (this.settings.frameEnabled) {
                this.applyFrameStyle(img);
            }
        });
    }
    
    resetImageQueue() {
        this.usedImages = [];
        this.imageQueue = [];
        this.currentCycle = 1;
        this.saveUsedImages();
    }
    
    getQueueStatus() {
        return {
            currentCycle: this.currentCycle,
            totalImages: this.availableImages.length,
            usedInCycle: this.usedImages.length,
            remainingInQueue: this.imageQueue.length,
            remainingInCycle: this.availableImages.length - this.usedImages.length
        };
    }
    
    getVisibleImageCount() {
        return this.activeImages.filter(imgWrapper => {
            const imgElement = imgWrapper.querySelector('img');
            return imgElement && imgElement.style.opacity !== '0';
        }).length;
    }
    
    getPerformanceStatus() {
        const visibleImages = this.getVisibleImageCount();
        
        const hiddenImages = this.activeImages.length - visibleImages;
        const currentFPS = this.performanceStats.frameCount > 0 ? 
            (1000 / Math.max(this.performanceStats.avgFrameTime, 1)) : 0;
        
        return {
            // Animation Performance
            targetFPS: this.targetFPS,
            actualFPS: Math.round(currentFPS * 10) / 10,
            avgFrameTime: Math.round(this.performanceStats.avgFrameTime * 100) / 100,
            droppedFrames: this.performanceStats.droppedFrames,
            totalFrames: this.performanceStats.frameCount,
            
            // Resource Management  
            totalActive: this.activeImages.length,
            visibleContent: visibleImages,
            hiddenContent: hiddenImages,
            framesPersistent: this.activeImages.length,
            
            // Optimization Metrics
            contentOptimization: hiddenImages > 0 ? `${((hiddenImages / this.activeImages.length) * 100).toFixed(1)}% content hidden` : 'All content visible',
            performanceRating: this.getPerformanceRating(currentFPS),
            hardwareAcceleration: 'Enabled (GPU layers)'
        };
    }
    
    getPerformanceRating(fps) {
        if (fps >= this.targetFPS * 0.95) return '🟢 Excellent';
        if (fps >= this.targetFPS * 0.85) return '🟡 Good'; 
        if (fps >= this.targetFPS * 0.70) return '🟠 Fair';
        return '🔴 Poor';
    }
    
    resetPerformanceStats() {
        this.performanceStats = {
            frameCount: 0,
            droppedFrames: 0,
            avgFrameTime: 0,
            lastSecondFrames: 0
        };
    }
    
    adjustPerformanceSettings() {
        const status = this.getPerformanceStatus();
        const actualFPS = status.actualFPS;
        
        // Dynamic performance adjustments
        if (actualFPS < this.targetFPS * 0.8) {
            // Performance is poor, reduce quality
            
            // Increase frame interval slightly for stability
            this.frameInterval = Math.min(this.frameInterval * 1.1, 25); // Max 40fps fallback
            
        } else if (actualFPS > this.targetFPS * 1.05 && this.frameInterval > 20) {
            // Performance is great, we can improve quality
            
            // Decrease frame interval for smoother animation
            this.frameInterval = Math.max(this.frameInterval * 0.95, 20); // Target 50fps
        }
        
        // Auto-adjust every 5 seconds
        setTimeout(() => this.adjustPerformanceSettings(), 5000);
    }
}

// Get instance ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const instanceId = urlParams.get('instance') || '1';

// Initialize the shuffler
const shuffler = new ImageShuffler('imageContainer', instanceId);

// Update page title to show instance
document.title = `Images Shuffler - Instance ${instanceId}`;

// Make shuffler available globally for admin controls
window.imageShuffler = shuffler;