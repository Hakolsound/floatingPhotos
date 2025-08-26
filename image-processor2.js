const ImageProcessor = require('./image-processor');
const path = require('path');

class ImageProcessor2 extends ImageProcessor {
    constructor() {
        super();
        this.sourceDir = path.join(__dirname, 'images2');
        this.scaledDir = path.join(__dirname, 'images2-scaled');
        this.processedTracking = path.join(__dirname, 'processed-images2.json');
        this.processedFiles = this.loadProcessedFiles();
        
        // Ensure directories exist
        this.ensureDirectories();
        
        console.log('🖼️ Image Processor 2 initialized');
        console.log(`📁 Source: ${this.sourceDir}`);
        console.log(`📁 Scaled: ${this.scaledDir}`);
        console.log(`📏 Max height: ${this.maxHeight}px`);
    }
}

module.exports = ImageProcessor2;

// CLI usage
if (require.main === module) {
    const processor = new ImageProcessor2();
    
    async function runOnce() {
        const result = await processor.scanAndProcess();
        const stats = processor.getStats();
        
        console.log('\n📊 Processing Summary (Instance 2):');
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