const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageProcessor {
    constructor() {
        this.sourceDir = path.join(__dirname, 'images');
        this.scaledDir = path.join(__dirname, 'images-scaled');
        this.processedTracking = path.join(__dirname, 'processed-images.json');
        this.maxHeight = 500;
        this.processedFiles = this.loadProcessedFiles();
        
        // Ensure directories exist
        this.ensureDirectories();
        
        console.log('🖼️ Image Processor initialized');
        console.log(`📁 Source: ${this.sourceDir}`);
        console.log(`📁 Scaled: ${this.scaledDir}`);
        console.log(`📏 Max height: ${this.maxHeight}px`);
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.scaledDir)) {
            fs.mkdirSync(this.scaledDir, { recursive: true });
            console.log('📁 Created scaled images directory');
        }
    }
    
    loadProcessedFiles() {
        try {
            if (fs.existsSync(this.processedTracking)) {
                const data = JSON.parse(fs.readFileSync(this.processedTracking, 'utf8'));
                console.log(`📋 Loaded ${Object.keys(data).length} processed file records`);
                return data;
            }
        } catch (error) {
            console.error('❌ Error loading processed files:', error.message);
        }
        return {};
    }
    
    saveProcessedFiles() {
        try {
            fs.writeFileSync(this.processedTracking, JSON.stringify(this.processedFiles, null, 2));
        } catch (error) {
            console.error('❌ Error saving processed files:', error.message);
        }
    }
    
    async getImageInfo(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const metadata = await sharp(filePath).metadata();
            return {
                size: stats.size,
                modified: stats.mtime.toISOString(),
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            };
        } catch (error) {
            return null;
        }
    }
    
    needsProcessing(filename, sourceInfo) {
        const processed = this.processedFiles[filename];
        if (!processed) return true;
        
        // Check if source file has been modified
        if (processed.sourceModified !== sourceInfo.modified) return true;
        
        // Check if scaled file exists
        const scaledPath = path.join(this.scaledDir, filename);
        if (!fs.existsSync(scaledPath)) return true;
        
        return false;
    }
    
    async processImage(filename) {
        const sourcePath = path.join(this.sourceDir, filename);
        const scaledPath = path.join(this.scaledDir, filename);
        
        try {
            console.log(`🔄 Processing: ${filename}`);
            
            const sourceInfo = await this.getImageInfo(sourcePath);
            if (!sourceInfo) {
                console.log(`❌ Could not read image info: ${filename}`);
                return false;
            }
            
            // Skip if image is already small enough
            if (sourceInfo.height <= this.maxHeight) {
                console.log(`✅ Image already optimal size: ${filename} (${sourceInfo.height}px)`);
                // Copy original to scaled directory
                fs.copyFileSync(sourcePath, scaledPath);
            } else {
                // Calculate new dimensions maintaining aspect ratio
                const aspectRatio = sourceInfo.width / sourceInfo.height;
                const newHeight = this.maxHeight;
                const newWidth = Math.round(newHeight * aspectRatio);
                
                console.log(`📏 Resizing ${filename}: ${sourceInfo.width}x${sourceInfo.height} → ${newWidth}x${newHeight}`);
                
                // Process image
                await sharp(sourcePath)
                    .resize(newWidth, newHeight, {
                        kernel: sharp.kernel.lanczos3,
                        withoutEnlargement: true
                    })
                    .jpeg({ 
                        quality: 85,
                        progressive: true,
                        mozjpeg: true
                    })
                    .png({
                        quality: 85,
                        compressionLevel: 6
                    })
                    .webp({
                        quality: 85
                    })
                    .toFile(scaledPath);
            }
            
            // Update tracking
            const scaledInfo = await this.getImageInfo(scaledPath);
            this.processedFiles[filename] = {
                sourceModified: sourceInfo.modified,
                sourceSize: sourceInfo.size,
                scaledSize: scaledInfo.size,
                processedAt: new Date().toISOString(),
                originalDimensions: `${sourceInfo.width}x${sourceInfo.height}`,
                scaledDimensions: `${scaledInfo.width}x${scaledInfo.height}`
            };
            
            const savedBytes = sourceInfo.size - scaledInfo.size;
            const savedPercent = ((savedBytes / sourceInfo.size) * 100).toFixed(1);
            
            console.log(`✅ Processed ${filename}: ${this.formatBytes(savedBytes)} saved (${savedPercent}%)`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error.message);
            return false;
        }
    }
    
    async scanAndProcess() {
        try {
            console.log('🔍 Scanning for images to process...');
            
            const files = fs.readdirSync(this.sourceDir);
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
            );
            
            console.log(`📷 Found ${imageFiles.length} image files`);
            
            let processed = 0;
            let skipped = 0;
            
            for (const filename of imageFiles) {
                const sourcePath = path.join(this.sourceDir, filename);
                const sourceInfo = await this.getImageInfo(sourcePath);
                
                if (!sourceInfo) {
                    console.log(`⚠️ Skipping invalid image: ${filename}`);
                    continue;
                }
                
                if (this.needsProcessing(filename, sourceInfo)) {
                    const success = await this.processImage(filename);
                    if (success) processed++;
                } else {
                    skipped++;
                }
            }
            
            if (processed > 0) {
                this.saveProcessedFiles();
                console.log(`💾 Updated processed files tracking`);
            }
            
            console.log(`🎯 Scan complete: ${processed} processed, ${skipped} skipped`);
            
            return {
                total: imageFiles.length,
                processed,
                skipped,
                hasNewImages: processed > 0
            };
            
        } catch (error) {
            console.error('❌ Error during scan and process:', error.message);
            return { total: 0, processed: 0, skipped: 0, hasNewImages: false };
        }
    }
    
    getStats() {
        const processedCount = Object.keys(this.processedFiles).length;
        let totalSaved = 0;
        
        for (const info of Object.values(this.processedFiles)) {
            totalSaved += (info.sourceSize - info.scaledSize);
        }
        
        return {
            processedCount,
            totalSaved: this.formatBytes(totalSaved),
            avgSavingPercent: processedCount > 0 ? 
                (Object.values(this.processedFiles).reduce((sum, info) => 
                    sum + ((info.sourceSize - info.scaledSize) / info.sourceSize * 100), 0
                ) / processedCount).toFixed(1) : 0
        };
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Clean up scaled images that no longer have source files
    cleanupOrphaned() {
        try {
            const scaledFiles = fs.readdirSync(this.scaledDir);
            const sourceFiles = fs.readdirSync(this.sourceDir);
            let cleaned = 0;
            
            for (const scaledFile of scaledFiles) {
                if (!sourceFiles.includes(scaledFile)) {
                    const scaledPath = path.join(this.scaledDir, scaledFile);
                    fs.unlinkSync(scaledPath);
                    delete this.processedFiles[scaledFile];
                    cleaned++;
                    console.log(`🗑️ Removed orphaned scaled image: ${scaledFile}`);
                }
            }
            
            if (cleaned > 0) {
                this.saveProcessedFiles();
                console.log(`🧹 Cleaned up ${cleaned} orphaned files`);
            }
            
            return cleaned;
        } catch (error) {
            console.error('❌ Error during cleanup:', error.message);
            return 0;
        }
    }
}

module.exports = ImageProcessor;

// CLI usage
if (require.main === module) {
    const processor = new ImageProcessor();
    
    async function runOnce() {
        const result = await processor.scanAndProcess();
        const stats = processor.getStats();
        
        console.log('\n📊 Processing Summary:');
        console.log(`   Total images: ${result.total}`);
        console.log(`   Processed: ${result.processed}`);
        console.log(`   Skipped: ${result.skipped}`);
        console.log(`   Total processed files: ${stats.processedCount}`);
        console.log(`   Storage saved: ${stats.totalSaved} (avg ${stats.avgSavingPercent}%)`);
        
        processor.cleanupOrphaned();
    }
    
    // Run once immediately
    runOnce();
}