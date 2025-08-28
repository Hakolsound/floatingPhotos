# Floating Photos - Advanced Image Shuffler 🎨

A sophisticated web-based image shuffler with smooth park-and-wait animations, spectacular frame effects, and performance optimizations.

## Features

### 🎭 Advanced Animation System
- **Park-and-Wait Behavior**: Images smoothly decelerate, park in center zone, wait, then accelerate off-screen
- **Speed Variation**: Individual speed variations (±30%) for natural organic movement
- **Smooth Transitions**: Butter-smooth 50fps animations with hardware acceleration
- **Fade Effects**: Gradual fade-out when images hit top boundary

### 🖼️ Visual Effects
- **8 Spectacular Frame Styles**: Classic, Neon, Plasma, Cosmic, Fire, Ice, Rainbow, Electric
- **Brand Color System**: Customizable dual-color system with tone variations
- **Dynamic Frames**: Animated glowing effects with customizable intensity
- **Circular Masking**: Perfect circular images with blurred edge effects

### ⚙️ Smart Management
- **Image Processing**: Automatic background resizing to 500px height for optimal performance
- **Queue System**: One-per-cycle image display with proper tracking
- **Dual Instances**: Support for two separate image folders (images/images2)
- **Collision Detection**: X-axis spacing to prevent overlapping

## Quick Start

### Single Machine Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Prepare your images:**
   - Create `~/images` folder and add your images
   - Optionally create `~/images2` for the second instance
   - Supported formats: JPG, JPEG, PNG, GIF, WebP, BMP

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   - Main page: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html
   - Instance 1: http://localhost:3000/?instance=1
   - Instance 2: http://localhost:3000/?instance=2

### LAN Setup (3 Machines: 1 Host + 2 Clients)

**Host Machine Setup:**
1. Clone and setup the project:
   ```bash
   git clone https://github.com/Hakolsound/floatingPhotos.git
   cd floatingPhotos
   npm install
   ```

2. **Prepare your images:**
   - Create `~/images` folder and add your images
   - Create `~/images2` folder and add images for second instance
   - Supported formats: JPG, JPEG, PNG, GIF, WebP, BMP

3. **Start the server:**
   ```bash
   npm start
   ```
   The server will display the LAN IP address and URLs for client machines.

**Client Machine Setup:**
- No installation needed on client machines
- Just open a web browser and navigate to the URLs provided by the host server:
  - **Client Machine 1**: Open `http://[HOST-IP]:3000/?instance=1`
  - **Client Machine 2**: Open `http://[HOST-IP]:3000/?instance=2`
  - **Admin Panel** (host machine): `http://[HOST-IP]:3000/admin.html`

Replace `[HOST-IP]` with the actual IP address shown when you start the server.

## Admin Settings

The admin panel provides complete control over:

### Animation Settings
- **Max Images on Screen**: Control how many images display simultaneously (1-10)
- **Animation Speed**: Adjust how fast images move up the screen
- **Bottom/Top Offset**: Set how far off-screen images start and end
- **Image Size**: Scale images from 50px to 400px

### Visual Settings
- **Blur Amount**: Control the blur effect intensity (0-20px)
- **Frame Design**: Toggle decorative frames around images
- **Frame Style**: Choose between Default, Gold, Silver, or Black frames

### Instance Management
- **Dual Instances**: Run two separate windows with different settings
- **Separate Image Folders**: Instance 1 uses `~/images`, Instance 2 uses `~/images2`
- **Independent Tracking**: Each instance tracks its own used images
- **Settings Export/Import**: Save and restore configurations

## File Structure

```
ImagesShuffler/
├── index.html          # Main display page
├── admin.html          # Admin settings panel
├── script.js           # Main application logic
├── admin-script.js     # Admin panel functionality
├── styles.css          # Main page styles
├── admin-styles.css    # Admin panel styles
├── server.js           # Express server for local file access
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Image Requirements

- **Location**: Place images in `~/images` (and optionally `~/images2`)
- **Formats**: JPG, JPEG, PNG, GIF, WebP, BMP
- **Resolution**: Any resolution (images are automatically scaled)
- **Quantity**: No limit (the more images, the longer before repeats)

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Tips for Best Experience

1. **Image Quality**: Use high-resolution images for best visual results
2. **Variety**: Mix different types of images for visual interest
3. **Organization**: Keep images organized in separate folders for different themes
4. **Performance**: With very large image collections, consider smaller image sizes for better performance

## Troubleshooting

**Images not loading?**
- Check that `~/images` folder exists
- Verify image file extensions are supported
- Check browser console for errors

**Server won't start?**
- Ensure Node.js is installed (version 14 or higher)
- Run `npm install` to install dependencies
- Check that port 3000 is available

**Settings not saving?**
- Enable local storage in your browser
- Check browser console for localStorage errors

## License

MIT License - Feel free to modify and distribute!