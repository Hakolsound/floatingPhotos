class AdminPanel {
    constructor() {
        this.currentInstance = '1';
        this.instanceWindows = {};
        this.settings = {};
        
        this.initializeEventListeners();
        this.loadCurrentSettings();
        this.updateImageStatus();
    }
    
    initializeEventListeners() {
        // Instance tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchInstance(e.target.dataset.instance);
            });
        });
        
        // Range input updates with instant changes
        document.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateRangeDisplay(e);
                this.onSettingChange(e); // Instant change on drag
            });
        });
        
        // Other input updates with instant changes
        document.querySelectorAll('input[type="number"], input[type="text"], input[type="checkbox"], input[type="color"], select').forEach(input => {
            input.addEventListener('input', this.onSettingChange.bind(this)); // Instant on input
            input.addEventListener('change', this.onSettingChange.bind(this)); // Fallback on change
        });
        
        // Background color sync between color picker and text input
        const colorPicker = document.getElementById('backgroundColor');
        const colorText = document.getElementById('backgroundColorText');
        
        colorPicker.addEventListener('input', () => {
            colorText.value = colorPicker.value;
            this.settings.backgroundColor = colorPicker.value;
            this.saveCurrentSettings();
            this.updatePreview();
            if (this.instanceWindows[this.currentInstance]) {
                this.applyToInstance(this.currentInstance);
            }
        });
        
        colorText.addEventListener('input', () => {
            if (colorText.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                colorPicker.value = colorText.value;
                this.settings.backgroundColor = colorText.value;
                this.saveCurrentSettings();
                this.updatePreview();
                if (this.instanceWindows[this.currentInstance]) {
                    this.applyToInstance(this.currentInstance);
                }
            }
        });
        
        // Button actions
        document.getElementById('openInstance').addEventListener('click', this.openInstanceWindow.bind(this));
        document.getElementById('copyObsUrl').addEventListener('click', this.copyObsUrl.bind(this));
        document.getElementById('applySettings').addEventListener('click', this.applySettings.bind(this));
        document.getElementById('resetUsedImages').addEventListener('click', this.resetUsedImages.bind(this));
        document.getElementById('refreshImages').addEventListener('click', this.refreshImages.bind(this));
        document.getElementById('exportSettings').addEventListener('click', this.exportSettings.bind(this));
        document.getElementById('importSettingsButton').addEventListener('click', () => {
            document.getElementById('importSettings').click();
        });
        document.getElementById('importSettings').addEventListener('change', this.importSettings.bind(this));
        
        // Preset functionality
        document.getElementById('presetSelect').addEventListener('change', this.loadPreset.bind(this));
        document.getElementById('savePreset').addEventListener('click', this.savePreset.bind(this));
        
        // Initialize presets
        this.initializePresets();
    }
    
    switchInstance(instanceId) {
        // Update active tab
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-instance="${instanceId}"]`).classList.add('active');
        
        // Save current settings
        this.saveCurrentSettings();
        
        // Switch to new instance
        this.currentInstance = instanceId;
        this.loadCurrentSettings();
        this.updateImageStatus();
    }
    
    loadCurrentSettings() {
        const saved = localStorage.getItem(`imageShuffler_${this.currentInstance}_settings`);
        const defaultSettings = {
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
            centerZoneStart: 20,
            centerZoneEnd: 80,
            easingStrength: 2.0,
            onTimeVariation: 15,
            displayCenter: 50,
            minSpacing: 200,
            parkWaitTime: 2000,
            parkAreaHeight: 100,
            minParkSpeed: 0.1,
            parkZoneOffset: 0,
            speedVariation: 30,
            imagesFolder: this.currentInstance === '1' ? 'images' : 'images2'
        };
        
        this.settings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        this.populateForm();
    }
    
    saveCurrentSettings() {
        localStorage.setItem(`imageShuffler_${this.currentInstance}_settings`, JSON.stringify(this.settings));
    }
    
    populateForm() {
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
                
                if (element.type === 'range') {
                    this.updateRangeDisplay({ target: element });
                }
            }
        });
        
        // Sync background color inputs
        const colorText = document.getElementById('backgroundColorText');
        if (colorText) {
            colorText.value = this.settings.backgroundColor || '#667eea';
        }
        
        this.updatePreview();
    }
    
    updateRangeDisplay(event) {
        const input = event.target;
        const display = input.parentElement.querySelector('.range-display');
        if (display) {
            display.textContent = parseFloat(input.value).toFixed(input.step && input.step < 1 ? 1 : 0);
        }
    }
    
    onSettingChange(event) {
        const input = event.target;
        const key = input.id;
        
        if (input.type === 'checkbox') {
            this.settings[key] = input.checked;
        } else if (input.type === 'range' || input.type === 'number') {
            this.settings[key] = parseFloat(input.value);
        } else {
            this.settings[key] = input.value;
        }
        
        // Instant save and apply
        this.saveCurrentSettings();
        this.updatePreview();
        this.updateImageStatus();
        
        // Instant update to display window if open
        if (this.instanceWindows[this.currentInstance] && !this.instanceWindows[this.currentInstance].closed) {
            this.applyToInstance(this.currentInstance);
        }
        
        // Visual feedback for the changed control
        input.style.boxShadow = '0 0 8px rgba(102, 126, 234, 0.6)';
        setTimeout(() => {
            input.style.boxShadow = '';
        }, 200);
    }
    
    updatePreview() {
        const preview = document.querySelector('.preview-image');
        const previewContainer = document.getElementById('previewContainer');
        const onTimeZone = document.getElementById('onTimeZone');
        const displayCenter = document.getElementById('displayCenter');
        const parkArea = document.getElementById('parkArea');
        const zoneInfo = document.getElementById('zoneInfo');
        const spacingInfo = document.getElementById('spacingInfo');
        
        if (!previewContainer) return;
        
        const containerHeight = previewContainer.offsetHeight || 200;
        const containerWidth = previewContainer.offsetWidth || 300;
        
        // Update preview background to match setting
        if (this.settings.backgroundColor) {
            previewContainer.style.background = this.settings.backgroundColor;
        }
        
        // Update preview image
        if (preview) {
            const imageSize = Math.min(this.settings.imageScale / 3, 60); // Scale down for preview
            preview.style.width = `${imageSize}px`;
            preview.style.height = `${imageSize}px`;
            
            // Position at display center
            const centerY = (this.settings.displayCenter / 100) * containerHeight;
            preview.style.top = `${centerY - imageSize/2}px`;
            preview.style.left = `${containerWidth/2 - imageSize/2}px`;
            
            // Apply frame styling
            if (this.settings.frameEnabled) {
                let borderColor = 'rgba(255, 255, 255, 0.8)';
                if (this.settings.frameStyle === 'gold') borderColor = 'rgba(255, 215, 0, 0.8)';
                else if (this.settings.frameStyle === 'silver') borderColor = 'rgba(192, 192, 192, 0.8)';
                else if (this.settings.frameStyle === 'black') borderColor = 'rgba(0, 0, 0, 0.6)';
                
                preview.style.border = `2px solid ${borderColor}`;
            } else {
                preview.style.border = 'none';
            }
            
            // Adjust animation speed based on settings
            const duration = 4000 / this.settings.speed;
            preview.style.animationDuration = `${duration}ms`;
        }
        
        // Update display center line (50% reference)
        if (displayCenter) {
            const centerY = (this.settings.displayCenter / 100) * containerHeight;
            displayCenter.style.top = `${centerY}px`;
            
            const centerLabel = displayCenter.querySelector('.center-label');
            if (centerLabel) {
                centerLabel.textContent = `CENTER (${this.settings.displayCenter}%)`;
            }
        }
        
        // Update park area (individual park zones around display center + offset)
        if (parkArea) {
            const parkHeight = Math.min(this.settings.parkAreaHeight, containerHeight * 0.3);
            const baseCenterY = (this.settings.displayCenter / 100) * containerHeight;
            // Scale the offset proportionally for the preview
            const scaledOffset = (this.settings.parkZoneOffset / window.innerHeight) * containerHeight;
            const parkCenterY = baseCenterY + scaledOffset;
            const parkTop = Math.max(0, Math.min(containerHeight - parkHeight, parkCenterY - (parkHeight / 2)));
            
            // Show park area as horizontal band around center + offset
            parkArea.style.left = '10px';
            parkArea.style.right = '10px';
            parkArea.style.width = 'auto';
            parkArea.style.top = `${parkTop}px`;
            parkArea.style.height = `${parkHeight}px`;
            
            const parkLabel = parkArea.querySelector('.park-label');
            if (parkLabel) {
                const offsetText = this.settings.parkZoneOffset === 0 ? '' : ` ${this.settings.parkZoneOffset > 0 ? '+' : ''}${this.settings.parkZoneOffset}px`;
                parkLabel.textContent = `PARK (${this.settings.parkAreaHeight}px${offsetText})`;
            }
        }
        
        // Update slow zone indicator (the area where images move slowly)
        if (onTimeZone) {
            // Calculate the full slow movement zone including park offset
            const baseCenterY = (this.settings.displayCenter / 100) * containerHeight;
            const scaledOffset = (this.settings.parkZoneOffset / window.innerHeight) * containerHeight;
            const adjustedCenterY = baseCenterY + scaledOffset;
            const approachZone = 60; // pixels where slowing begins
            const parkHeight = Math.min(this.settings.parkAreaHeight, containerHeight * 0.3);
            
            const zoneTop = Math.max(0, adjustedCenterY - approachZone - parkHeight/2);
            const zoneBottom = Math.min(containerHeight, adjustedCenterY + approachZone + parkHeight/2);
            const zoneHeight = zoneBottom - zoneTop;
            
            onTimeZone.style.top = `${zoneTop}px`;
            onTimeZone.style.height = `${zoneHeight}px`;
            onTimeZone.style.left = '5px';
            onTimeZone.style.right = '5px';
            
            const zoneLabel = onTimeZone.querySelector('.zone-label');
            if (zoneLabel) {
                zoneLabel.textContent = `SLOW ZONE`;
            }
        }
        
        // Update info displays
        if (zoneInfo) {
            zoneInfo.textContent = `Park: ${this.settings.parkWaitTime}ms wait, ${(this.settings.minParkSpeed * 100).toFixed(0)}% speed`;
        }
        
        if (spacingInfo) {
            spacingInfo.textContent = `X-Spacing: ${this.settings.minSpacing}px, Variation: ±${this.settings.onTimeVariation}%`;
        }
    }
    
    async updateImageStatus() {
        try {
            const response = await fetch(`/api/images/${this.settings.imagesFolder}`);
            const images = await response.json();
            const totalImages = images.filter(img => 
                img.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
            ).length;
            
            // Load queue tracking data
            const usedKey = `imageShuffler_${this.currentInstance}_used`;
            const queueKey = `imageShuffler_${this.currentInstance}_queue`;
            const cycleKey = `imageShuffler_${this.currentInstance}_cycle`;
            
            const usedImages = JSON.parse(localStorage.getItem(usedKey) || '[]');
            const queueImages = JSON.parse(localStorage.getItem(queueKey) || '[]');
            const currentCycle = JSON.parse(localStorage.getItem(cycleKey) || '1');
            
            const remainingInCycle = totalImages - usedImages.length;
            const queuedImages = queueImages.length;
            
            document.getElementById('totalImages').textContent = totalImages;
            document.getElementById('usedImages').textContent = usedImages.length;
            
            // Update remaining images info with cycle information
            const remainingText = `Cycle ${currentCycle}: ${remainingInCycle} remaining (${queuedImages} queued)`;
            document.getElementById('remainingImages').textContent = remainingText;
            
        } catch (error) {
            console.error('Failed to update image status:', error);
            document.getElementById('totalImages').textContent = 'Error';
            document.getElementById('usedImages').textContent = 'Error';
            document.getElementById('remainingImages').textContent = 'Error';
        }
    }
    
    openInstanceWindow() {
        const instanceUrl = `index.html?instance=${this.currentInstance}`;
        const windowName = `ImageShuffler_Instance_${this.currentInstance}`;
        const windowFeatures = 'width=1200,height=800,scrollbars=no,resizable=yes';
        
        if (this.instanceWindows[this.currentInstance]) {
            this.instanceWindows[this.currentInstance].focus();
        } else {
            this.instanceWindows[this.currentInstance] = window.open(instanceUrl, windowName, windowFeatures);
            
            // Clean up when window is closed
            const checkClosed = setInterval(() => {
                if (this.instanceWindows[this.currentInstance].closed) {
                    clearInterval(checkClosed);
                    delete this.instanceWindows[this.currentInstance];
                }
            }, 1000);
        }
    }
    
    copyObsUrl() {
        const baseUrl = `${window.location.protocol}//${window.location.host}/index.html`;
        const params = new URLSearchParams();
        
        // Add instance parameter
        params.append('instance', this.currentInstance);
        
        // Add all current settings as URL parameters
        const paramMap = {
            'maxImages': 'maxImages',
            'speed': 'speed', 
            'imageScale': 'scale',
            'blurAmount': 'blur',
            'frameEnabled': 'frame',
            'frameStyle': 'frameStyle',
            'frameWidth': 'frameWidth',
            'glowIntensity': 'glow',
            'frameVariation': 'variation',
            'frameAnimation': 'animation',
            'effectIntensity': 'effect',
            'brandColor1': 'color1',
            'brandColor2': 'color2',
            'colorVariation': 'colorVar',
            'backgroundColor': 'bg',
            'centerZoneStart': 'centerStart',
            'centerZoneEnd': 'centerEnd',
            'minSpacing': 'spacing',
            'parkWaitTime': 'parkWait',
            'parkAreaHeight': 'parkHeight',
            'minParkSpeed': 'parkSpeed',
            'parkZoneOffset': 'parkOffset',
            'speedVariation': 'speedVar'
        };
        
        // Add current settings to URL
        for (const [settingKey, urlParam] of Object.entries(paramMap)) {
            if (this.settings[settingKey] !== undefined) {
                params.append(urlParam, this.settings[settingKey]);
            }
        }
        
        const obsUrl = `${baseUrl}?${params.toString()}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(obsUrl).then(() => {
            // Show feedback
            const button = document.getElementById('copyObsUrl');
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            button.style.background = 'rgba(34, 197, 94, 0.2)';
            button.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                button.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            // Fallback - show URL in alert
            alert('Copy this URL for OBS:\n\n' + obsUrl);
        });
    }
    
    applySettings() {
        this.saveCurrentSettings();
        this.applyToInstance(this.currentInstance);
        this.showNotification('Settings applied successfully!');
    }
    
    applyToInstance(instanceId) {
        if (this.instanceWindows[instanceId] && !this.instanceWindows[instanceId].closed) {
            try {
                const shuffler = this.instanceWindows[instanceId].imageShuffler;
                if (shuffler) {
                    shuffler.updateSettings(this.settings);
                }
            } catch (error) {
                console.error('Failed to apply settings to instance:', error);
            }
        }
    }
    
    resetUsedImages() {
        if (confirm('Are you sure you want to reset the image queue? This will start a fresh cycle with all images available.')) {
            const usedKey = `imageShuffler_${this.currentInstance}_used`;
            const queueKey = `imageShuffler_${this.currentInstance}_queue`;
            const cycleKey = `imageShuffler_${this.currentInstance}_cycle`;
            
            // Clear all queue data
            localStorage.setItem(usedKey, JSON.stringify([]));
            localStorage.setItem(queueKey, JSON.stringify([]));
            localStorage.setItem(cycleKey, JSON.stringify(1));
            
            this.updateImageStatus();
            this.showNotification('Image queue reset successfully! Starting fresh cycle.');
        }
    }
    
    async refreshImages() {
        await this.updateImageStatus();
        this.showNotification('Image list refreshed!');
    }
    
    exportSettings() {
        const allSettings = {};
        ['1', '2'].forEach(instance => {
            const settings = localStorage.getItem(`imageShuffler_${instance}_settings`);
            if (settings) {
                allSettings[`instance_${instance}`] = JSON.parse(settings);
            }
        });
        
        const dataStr = JSON.stringify(allSettings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `image-shuffler-settings-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Settings exported successfully!');
    }
    
    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target.result);
                
                Object.keys(importedSettings).forEach(key => {
                    if (key.startsWith('instance_')) {
                        const instanceId = key.split('_')[1];
                        localStorage.setItem(`imageShuffler_${instanceId}_settings`, JSON.stringify(importedSettings[key]));
                    }
                });
                
                this.loadCurrentSettings();
                this.showNotification('Settings imported successfully!');
                
            } catch (error) {
                alert('Error importing settings: Invalid file format');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
    
    initializePresets() {
        // Built-in presets
        this.presets = {
            default: {
                maxImages: 3,
                speed: 2,
                displayCenter: 50,
                parkWaitTime: 2000,
                minParkSpeed: 0.1,
                minSpacing: 200,
                imageScale: 150,
                blurAmount: 5,
                frameEnabled: true,
                frameStyle: 'default',
                backgroundColor: '#667eea'
            },
            fast: {
                maxImages: 5,
                speed: 4,
                displayCenter: 50,
                parkWaitTime: 1000,
                minParkSpeed: 0.3,
                minSpacing: 150,
                imageScale: 120,
                blurAmount: 3,
                frameEnabled: false,
                frameStyle: 'default',
                backgroundColor: '#ff6b6b'
            },
            slow: {
                maxImages: 2,
                speed: 1,
                displayCenter: 50,
                parkWaitTime: 4000,
                minParkSpeed: 0.05,
                minSpacing: 300,
                imageScale: 200,
                blurAmount: 8,
                frameEnabled: true,
                frameStyle: 'gold',
                backgroundColor: '#4ecdc4'
            },
            showcase: {
                maxImages: 1,
                speed: 1.5,
                displayCenter: 50,
                parkWaitTime: 6000,
                minParkSpeed: 0.02,
                minSpacing: 400,
                imageScale: 250,
                blurAmount: 10,
                frameEnabled: true,
                frameStyle: 'black',
                backgroundColor: '#2d3748'
            }
        };
        
        // Load custom presets from localStorage
        const customPresets = localStorage.getItem('imageShuffler_presets');
        if (customPresets) {
            Object.assign(this.presets, JSON.parse(customPresets));
            this.updatePresetDropdown();
        }
    }
    
    updatePresetDropdown() {
        const select = document.getElementById('presetSelect');
        // Clear custom options (keep built-ins)
        const builtInOptions = ['', 'default', 'fast', 'slow', 'showcase'];
        Array.from(select.options).forEach(option => {
            if (!builtInOptions.includes(option.value)) {
                option.remove();
            }
        });
        
        // Add custom presets
        Object.keys(this.presets).forEach(key => {
            if (!builtInOptions.includes(key)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                select.appendChild(option);
            }
        });
    }
    
    loadPreset(event) {
        const presetName = event.target.value;
        if (!presetName || !this.presets[presetName]) return;
        
        const preset = this.presets[presetName];
        
        // Apply preset settings
        Object.keys(preset).forEach(key => {
            this.settings[key] = preset[key];
        });
        
        // Update form and apply changes
        this.populateForm();
        this.saveCurrentSettings();
        
        // Instant visual feedback
        event.target.style.boxShadow = '0 0 12px rgba(102, 126, 234, 0.8)';
        setTimeout(() => {
            event.target.style.boxShadow = '';
        }, 500);
        
        this.showNotification(`Applied "${presetName}" preset`);
    }
    
    savePreset() {
        const presetName = prompt('Enter a name for this preset:');
        if (!presetName) return;
        
        // Save current settings as preset
        const presetData = { ...this.settings };
        delete presetData.imagesFolder; // Don't save folder in presets
        
        this.presets[presetName.toLowerCase()] = presetData;
        
        // Save to localStorage
        const customPresets = {};
        Object.keys(this.presets).forEach(key => {
            if (!['default', 'fast', 'slow', 'showcase'].includes(key)) {
                customPresets[key] = this.presets[key];
            }
        });
        localStorage.setItem('imageShuffler_presets', JSON.stringify(customPresets));
        
        this.updatePresetDropdown();
        this.showNotification(`Saved preset "${presetName}"`);
    }
    
    showNotification(message) {
        // Create a dark-themed notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
            font-size: 12px;
            border: 1px solid rgba(102, 126, 234, 0.3);
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        // Add entrance animation
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});