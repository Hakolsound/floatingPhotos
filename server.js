const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const ImageProcessor = require('./image-processor');
const ImageProcessor2 = require('./image-processor2');

const app = express();
const PORT = 3000;

// Initialize image processors
const imageProcessor = new ImageProcessor();
const imageProcessor2 = new ImageProcessor2();

// Background processing every minute
setInterval(async () => {
    try {
        const result1 = await imageProcessor.scanAndProcess();
        const result2 = await imageProcessor2.scanAndProcess();
        
        if (result1.hasNewImages || result2.hasNewImages) {
            console.log(`🔄 Background processing: ${result1.processed + result2.processed} images processed`);
        }
    } catch (error) {
        console.error('❌ Background processing error:', error.message);
    }
}, 60000); // 1 minute

// Serve static files
app.use(express.static('.'));

// API endpoint to get images from a folder
app.get('/api/images/:folder', async (req, res) => {
    try {
        const folderName = req.params.folder;
        let imagesPath;
        
        // Handle different folder names - look in project directory first
        if (folderName === 'images' || folderName === 'images2') {
            // First try project directory
            imagesPath = path.join(__dirname, folderName);
            
            // If project folder doesn't exist, fall back to home directory
            try {
                await fs.access(imagesPath);
            } catch (error) {
                imagesPath = path.join(os.homedir(), folderName);
                console.log(`Project ${folderName} folder not found, trying home directory`);
            }
        } else {
            imagesPath = path.join(__dirname, folderName);
        }
        
        // Check if directory exists
        try {
            await fs.access(imagesPath);
        } catch (error) {
            return res.json([]);
        }
        
        // Get scaled images first, fall back to original
        const scaledPath = path.join(__dirname, `${folderName}-scaled`);
        let imageFiles = [];
        
        try {
            // Try to get scaled images first
            await fs.access(scaledPath);
            const scaledFiles = await fs.readdir(scaledPath);
            const scaledImageFiles = scaledFiles.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
            });
            
            // Get original images
            const files = await fs.readdir(imagesPath);
            const originalImageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
            });
            
            // Combine: prefer scaled, add originals if no scaled version
            const scaledSet = new Set(scaledImageFiles);
            imageFiles = [...scaledImageFiles];
            
            for (const file of originalImageFiles) {
                if (!scaledSet.has(file)) {
                    imageFiles.push(file);
                }
            }
        } catch (error) {
            // No scaled directory, use original images
            const files = await fs.readdir(imagesPath);
            imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
            });
        }
        
        res.json(imageFiles);
    } catch (error) {
        console.error('Error reading images directory:', error);
        res.status(500).json({ error: 'Failed to read images directory' });
    }
});

// API endpoint to serve individual images
app.get('/api/images/:folder/:filename', async (req, res) => {
    try {
        const folderName = req.params.folder;
        const filename = req.params.filename;
        
        // Try scaled image first, fall back to original
        const scaledPath = path.join(__dirname, `${folderName}-scaled`, filename);
        let imagePath;
        
        try {
            await fs.access(scaledPath);
            imagePath = scaledPath;
        } catch (error) {
            // Fall back to original image
            let imagesPath;
            if (folderName === 'images' || folderName === 'images2') {
                // First try project directory
                imagesPath = path.join(__dirname, folderName);
                
                // If project folder doesn't exist, fall back to home directory
                try {
                    await fs.access(imagesPath);
                } catch (error) {
                    imagesPath = path.join(os.homedir(), folderName);
                }
            } else {
                imagesPath = path.join(__dirname, folderName);
            }
            
            imagePath = path.join(imagesPath, filename);
        }
        
        // Security check - ensure the file is within allowed directories
        const resolvedPath = path.resolve(imagePath);
        const projectDir = path.resolve(__dirname);
        const homeDir = path.resolve(os.homedir());
        
        if (!resolvedPath.startsWith(projectDir) && !resolvedPath.startsWith(homeDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if file exists
        try {
            await fs.access(imagePath);
        } catch (error) {
            return res.status(404).json({ error: 'Image not found' });
        }
        
        // Send the image file
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        imagesPath: path.join(os.homedir(), 'images')
    });
});

app.listen(PORT, () => {
    console.log(`🎨 Images Shuffler Server running at http://localhost:${PORT}`);
    console.log(`📁 Images directory: ${path.join(__dirname, 'images')}`);
    console.log(`📁 Images2 directory: ${path.join(__dirname, 'images2')}`);
    console.log(`🎛️  Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`🖼️  Instance 1: http://localhost:${PORT}/?instance=1`);
    console.log(`🖼️  Instance 2: http://localhost:${PORT}/?instance=2`);
});