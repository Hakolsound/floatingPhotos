class P5AdminController {
    constructor() {
        this.currentInstance = '1';
        this.settings = {};
        this.instanceWindows = {};
        
        this.initializeEventListeners();
        this.switchInstance(this.currentInstance);
        this.initializeAspectRatio();
    }
    
    initializeEventListeners() {
        // Instance tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchInstance(e.target.dataset.instance);
            });
        });
        
        // Settings controls
        document.querySelectorAll('input[type="range"], input[type="number"], input[type="checkbox"], select').forEach(input => {
            input.addEventListener('input', this.handleSettingChange.bind(this));
            input.addEventListener('change', this.handleSettingChange.bind(this));
        });
        
        // Color inputs
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', this.handleColorChange.bind(this));
        });
        
        // Color text inputs
        document.querySelectorAll('.color-text').forEach(input => {
            input.addEventListener('input', this.handleColorTextChange.bind(this));
        });
        
        // Header actions
        document.getElementById('applySettings').addEventListener('click', this.applySettings.bind(this));
        document.getElementById('openInstance').addEventListener('click', this.openInstance.bind(this));
        document.getElementById('copyObsUrl').addEventListener('click', this.copyObsUrl.bind(this));
        document.getElementById('refreshImages').addEventListener('click', this.refreshImages.bind(this));
        
        // Export/Import
        document.getElementById('exportSettings').addEventListener('click', this.exportSettings.bind(this));
        document.getElementById('importSettingsButton').addEventListener('click', () => {
            document.getElementById('importSettings').click();
        });
        document.getElementById('importSettings').addEventListener('change', this.importSettings.bind(this));
        
        // Preset functionality
        document.getElementById('presetSelect').addEventListener('change', this.loadPreset.bind(this));
        document.getElementById('savePreset').addEventListener('click', this.savePreset.bind(this));
        document.getElementById('resetUsedImages').addEventListener('click', this.resetUsedImages.bind(this));
        
        // Initialize presets
        this.initializePresets();
    }
    
    initializeAspectRatio() {
        const aspectSelect = document.getElementById('targetAspectRatio');
        const widthInput = document.getElementById('displayWidth');
        
        // Update height when aspect ratio or width changes
        const updateHeight = () => {
            const aspect = aspectSelect.value;
            const width = parseInt(widthInput.value);
            
            const ratios = {
                '16:9': 16/9,
                '21:9': 21/9,
                '4:3': 4/3,
                '16:10': 16/10,
                '1:1': 1/1,
                '3:2': 3/2,
                '3:1': 3/1
            };
            
            const ratio = ratios[aspect] || 16/9;
            const height = Math.round(width / ratio);
            
            this.settings.displayHeight = height;
            
            // Update the display to show calculated dimensions
            const option = aspectSelect.querySelector(`option[value="${aspect}"]`);
            if (option) {
                option.textContent = `${aspect} (${width}x${height})`;
            }
        };
        
        aspectSelect.addEventListener('change', updateHeight);
        widthInput.addEventListener('input', updateHeight);
        
        // Initial calculation
        updateHeight();
    }
    
    switchInstance(instanceId) {
        // Update active tab
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-instance="${instanceId}"]`).classList.add('active');
        
        // Save current settings
        this.saveCurrentSettings();
        
        // Switch to new instance
        this.currentInstance = instanceId;
        
        // Load instance settings
        this.loadInstanceSettings();
        
        // Update folder display
        document.getElementById('imagesFolder').value = instanceId === '1' ? 'images' : 'images2';
    }
    
    loadInstanceSettings() {
        const saved = localStorage.getItem(`imageShuffler_${this.currentInstance}_settings`);
        const defaultSettings = {
            maxImages: 3,
            speed: 2.0,
            imageScale: 150,
            blurAmount: 5,
            frameEnabled: true,
            frameStyle: 'classic',
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
            onTimeVariation: 15,
            displayCenter: 50,
            minSpacing: 200,
            parkWaitTime: 2000,
            parkAreaHeight: 100,
            minParkSpeed: 0.1,
            parkZoneOffset: 0,
            speedVariation: 30,
            sizeVariation: 8,
            easingStrength: 2.0,
            bottomOffset: 100,
            topOffset: 100,
            targetAspectRatio: '16:9',
            displayWidth: 1920,
            displayHeight: 1080,
            autoResize: true,
            imagesFolder: this.currentInstance === '1' ? 'images' : 'images2'
        };
        
        this.settings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        this.populateForm();
    }
    
    saveCurrentSettings() {
        if (Object.keys(this.settings).length > 0) {
            localStorage.setItem(`imageShuffler_${this.currentInstance}_settings`, JSON.stringify(this.settings));
        }
    }
    
    populateForm() {
        // Update all form controls with current settings
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else if (element.type === 'color') {
                    element.value = this.settings[key];
                    // Update corresponding text input
                    const textInput = document.getElementById(key + 'Text');
                    if (textInput) textInput.value = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
                
                // Update range displays
                if (element.type === 'range') {
                    const display = element.nextElementSibling;
                    if (display && display.classList.contains('range-display')) {
                        const unit = this.getRangeUnit(key);
                        display.textContent = this.settings[key] + unit;
                    }
                }
            }
        });
    }
    
    getRangeUnit(key) {
        const units = {
            speed: '',
            displayCenter: '%',
            parkWaitTime: 'ms',
            minParkSpeed: '',
            minSpacing: 'px',
            speedVariation: '%',
            sizeVariation: '%',
            imageScale: 'px',
            blurAmount: 'px',
            glowIntensity: '%',
            frameWidth: 'px',
            effectIntensity: '%',
            colorVariation: '%',
            easingStrength: '',
            onTimeVariation: '%',
            parkAreaHeight: 'px',
            bottomOffset: 'px',
            topOffset: 'px',
            parkZoneOffset: 'px'
        };
        return units[key] || '';
    }
    
    handleSettingChange(event) {
        const key = event.target.id;
        let value = event.target.value;
        
        if (event.target.type === 'checkbox') {
            value = event.target.checked;
        } else if (event.target.type === 'number' || event.target.type === 'range') {
            value = parseFloat(value);
        }
        
        this.settings[key] = value;
        
        // Update range display
        if (event.target.type === 'range') {
            const display = event.target.nextElementSibling;
            if (display && display.classList.contains('range-display')) {
                const unit = this.getRangeUnit(key);
                display.textContent = value + unit;
            }
        }
        
        // Update preview
        this.updatePreview();
        
        // Send to p5.js instances immediately for real-time updates
        this.sendSettingsToInstances();
        
        // Auto-save settings
        this.saveCurrentSettings();
    }
    
    handleColorChange(event) {
        const key = event.target.id;
        const value = event.target.value;
        
        this.settings[key] = value;
        
        // Update corresponding text input
        const textInput = document.getElementById(key + 'Text');
        if (textInput) textInput.value = value;
        
        this.updatePreview();
        
        // Send to p5.js instances immediately
        this.sendSettingsToInstances();
        
        // Auto-save settings
        this.saveCurrentSettings();
    }
    
    handleColorTextChange(event) {
        const key = event.target.id.replace('Text', '');
        const value = event.target.value;
        
        // Validate hex color
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            this.settings[key] = value;
            
            // Update corresponding color input
            const colorInput = document.getElementById(key);
            if (colorInput) colorInput.value = value;
            
            this.updatePreview();
            
            // Send to p5.js instances immediately
            this.sendSettingsToInstances();
            
            // Auto-save settings
            this.saveCurrentSettings();
        }
    }
    
    updatePreview() {
        // Update preview container background
        const previewContainer = document.getElementById('previewContainer');
        if (previewContainer && this.settings.backgroundColor) {
            previewContainer.style.background = this.settings.backgroundColor;
        }
        
        // Update preview zones
        this.updatePreviewZones();
    }
    
    updatePreviewZones() {
        const container = document.getElementById('previewContainer');
        const containerHeight = container.offsetHeight;
        
        // Update display center line
        const displayCenter = document.querySelector('.display-center-line');
        if (displayCenter) {
            const centerY = (this.settings.displayCenter / 100) * containerHeight;
            displayCenter.style.top = centerY + 'px';
        }
        
        // Update park area
        const parkArea = document.getElementById('parkArea');
        if (parkArea) {
            const centerY = (this.settings.displayCenter / 100) * containerHeight;
            const parkHeight = Math.min(this.settings.parkAreaHeight, containerHeight * 0.5);
            const parkTop = centerY - parkHeight/2 + this.settings.parkZoneOffset;
            
            parkArea.style.top = parkTop + 'px';
            parkArea.style.height = parkHeight + 'px';
        }
        
        // Update on-time zone
        const onTimeZone = document.getElementById('onTimeZone');
        if (onTimeZone) {
            const centerY = (this.settings.displayCenter / 100) * containerHeight;
            const zoneHeight = this.settings.parkAreaHeight * 2;
            const zoneTop = centerY - zoneHeight/2 + this.settings.parkZoneOffset;
            
            onTimeZone.style.top = zoneTop + 'px';
            onTimeZone.style.height = zoneHeight + 'px';
        }
    }
    
    applySettings() {
        // Save settings
        this.saveCurrentSettings();
        
        // Apply to any open p5.js instances
        this.sendSettingsToInstances();
        
        // Visual feedback
        const button = document.getElementById('applySettings');
        const originalText = button.textContent;
        button.textContent = '✓ Applied!';
        button.style.background = 'rgba(34, 197, 94, 0.8)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
    }
    
    sendSettingsToInstances() {
        // Try to communicate with open p5.js windows
        Object.entries(this.instanceWindows).forEach(([instanceId, instanceWindow]) => {
            try {
                if (instanceWindow && !instanceWindow.closed) {
                    // Check if the window has loaded and has our global object
                    if (instanceWindow.imageShuffler && typeof instanceWindow.imageShuffler.updateSettings === 'function') {
                        instanceWindow.imageShuffler.updateSettings(this.settings);
                        console.log(`Settings sent to instance ${instanceId}`);
                    } else {
                        // Window not ready yet, try again in a moment
                        setTimeout(() => {
                            if (instanceWindow && !instanceWindow.closed && instanceWindow.imageShuffler) {
                                instanceWindow.imageShuffler.updateSettings(this.settings);
                                console.log(`Settings sent to instance ${instanceId} (delayed)`);
                            }
                        }, 1000);
                    }
                }
            } catch (error) {
                console.log(`Could not communicate with instance ${instanceId}:`, error);
            }
        });
    }
    
    openInstance() {
        const url = `p5-index.html?instance=${this.currentInstance}`;
        
        // Close existing window for this instance
        if (this.instanceWindows[this.currentInstance]) {
            this.instanceWindows[this.currentInstance].close();
        }
        
        // Open new window
        const newWindow = window.open(url, `instance_${this.currentInstance}`, 'width=1920,height=1080');
        this.instanceWindows[this.currentInstance] = newWindow;
        
        // Monitor window and establish communication
        if (newWindow) {
            const checkClosed = setInterval(() => {
                if (newWindow.closed) {
                    clearInterval(checkClosed);
                    delete this.instanceWindows[this.currentInstance];
                }
            }, 1000);
            
            // Wait for window to load, then send current settings
            setTimeout(() => {
                this.sendSettingsToInstances();
            }, 2000);
        }
    }
    
    copyObsUrl() {
        const baseUrl = `${window.location.protocol}//${window.location.host}/p5-index.html`;
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
            'speedVariation': 'speedVar',
            'sizeVariation': 'sizeVar',
            'easingStrength': 'easing',
            'onTimeVariation': 'timeVar',
            'bottomOffset': 'bottomGap',
            'topOffset': 'topGap',
            'targetAspectRatio': 'aspect',
            'displayWidth': 'width',
            'displayHeight': 'height',
            'autoResize': 'autoResize'
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
            console.error('Failed to copy URL:', err);
            // Fallback: show URL in alert
            alert('Copy this URL:\n\n' + obsUrl);
        });
    }
    
    refreshImages() {
        // Trigger a refresh in connected instances
        Object.entries(this.instanceWindows).forEach(([instanceId, instanceWindow]) => {
            try {
                if (instanceWindow && !instanceWindow.closed && instanceWindow.imageShuffler) {
                    instanceWindow.imageShuffler.refreshImages();
                    console.log(`Images refreshed for instance ${instanceId}`);
                }
            } catch (error) {
                console.log(`Could not refresh images for instance ${instanceId}:`, error);
            }
        });
        
        // Visual feedback
        const button = document.getElementById('refreshImages');
        button.innerHTML = '⟳';
        setTimeout(() => {
            button.innerHTML = '↻';
        }, 500);
    }
    
    resetUsedImages() {
        // Reset image queue in connected instances
        Object.entries(this.instanceWindows).forEach(([instanceId, instanceWindow]) => {
            try {
                if (instanceWindow && !instanceWindow.closed && instanceWindow.imageShuffler) {
                    instanceWindow.imageShuffler.resetUsedImages();
                    console.log(`Image queue reset for instance ${instanceId}`);
                }
            } catch (error) {
                console.log(`Could not reset queue for instance ${instanceId}:`, error);
            }
        });
        
        // Visual feedback
        const button = document.getElementById('resetUsedImages');
        const originalText = button.textContent;
        button.textContent = '✓ Reset!';
        button.style.background = 'rgba(34, 197, 94, 0.2)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
    }
    
    // Preset functionality
    initializePresets() {
        const presets = {
            default: {
                maxImages: 3,
                speed: 2.0,
                imageScale: 150,
                parkWaitTime: 2000,
                minSpacing: 200,
                frameStyle: 'classic',
                glowIntensity: 50,
                effectIntensity: 100
            },
            fast: {
                maxImages: 5,
                speed: 4.0,
                imageScale: 120,
                parkWaitTime: 1000,
                minSpacing: 150,
                frameStyle: 'neon',
                glowIntensity: 80,
                effectIntensity: 150
            },
            slow: {
                maxImages: 2,
                speed: 1.0,
                imageScale: 200,
                parkWaitTime: 4000,
                minSpacing: 300,
                frameStyle: 'cosmic',
                glowIntensity: 30,
                effectIntensity: 80
            },
            showcase: {
                maxImages: 4,
                speed: 1.5,
                imageScale: 180,
                parkWaitTime: 3000,
                minSpacing: 250,
                frameStyle: 'rainbow',
                glowIntensity: 70,
                effectIntensity: 120
            }
        };
        
        // Store presets
        localStorage.setItem(`imageShuffler_presets`, JSON.stringify(presets));
    }
    
    loadPreset(event) {
        const presetName = event.target.value;
        if (!presetName) return;
        
        const presets = JSON.parse(localStorage.getItem(`imageShuffler_presets`) || '{}');
        const preset = presets[presetName];
        
        if (preset) {
            this.settings = { ...this.settings, ...preset };
            this.populateForm();
            this.updatePreview();
            
            // Reset select
            event.target.value = '';
        }
    }
    
    savePreset() {
        const name = prompt('Enter preset name:');
        if (!name) return;
        
        const presets = JSON.parse(localStorage.getItem(`imageShuffler_presets`) || '{}');
        presets[name] = { ...this.settings };
        localStorage.setItem(`imageShuffler_presets`, JSON.stringify(presets));
        
        // Add to select
        const select = document.getElementById('presetSelect');
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
        
        alert(`Preset "${name}" saved!`);
    }
    
    exportSettings() {
        const data = {
            settings: this.settings,
            version: '2.0-p5js',
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `floating-photos-settings-instance${this.currentInstance}-p5js.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                    this.populateForm();
                    this.updatePreview();
                    alert('Settings imported successfully!');
                } else {
                    alert('Invalid settings file format.');
                }
            } catch (error) {
                alert('Failed to parse settings file.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    // Initialize when DOM is loaded
    static init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new P5AdminController();
            });
        } else {
            new P5AdminController();
        }
    }
}

// Auto-initialize
P5AdminController.init();