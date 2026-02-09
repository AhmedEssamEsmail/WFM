# PWA Icons TODO

## Required Icons

To fully support PWA installation, the following icon sizes should be generated:

### Required Sizes
- **192x192** - Minimum required size for Android
- **512x512** - Required for splash screens and high-res displays

### Current Status
- ✅ favicon-16x16.png (512 bytes)
- ✅ favicon-32x32.png (1,183 bytes)
- ✅ apple-touch-icon.png (8,320 bytes) - 180x180
- ✅ favicon.ico (15,406 bytes)
- ⚠️ android-chrome-192x192.png - **MISSING**
- ⚠️ android-chrome-512x512.png - **MISSING**

## How to Generate

### Option 1: Using Online Tools
1. Go to https://realfavicongenerator.net/
2. Upload your source logo/icon (preferably 512x512 or larger)
3. Configure settings for each platform
4. Download the generated package
5. Extract and place files in `public/icons/`

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# From a high-res source image (e.g., logo.png):

# Generate 192x192
magick logo.png -resize 192x192 public/icons/android-chrome-192x192.png

# Generate 512x512
magick logo.png -resize 512x512 public/icons/android-chrome-512x512.png
```

### Option 3: Using Sharp (Node.js)
```javascript
const sharp = require('sharp');

// Generate 192x192
sharp('logo.png')
  .resize(192, 192)
  .toFile('public/icons/android-chrome-192x192.png');

// Generate 512x512
sharp('logo.png')
  .resize(512, 512)
  .toFile('public/icons/android-chrome-512x512.png');
```

## After Generating Icons

Update `public/icons/site.webmanifest` to include the new icons:

```json
{
  "name": "WFM - Workforce Management",
  "short_name": "WFM",
  "icons": [
    {
      "src": "/icons/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "/icons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

## Testing PWA Installation

After adding the icons:

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools → Application → Manifest
4. Verify all icons are loaded correctly
5. Test "Install App" functionality

## Design Recommendations

- Use a simple, recognizable logo
- Ensure good contrast against both light and dark backgrounds
- Test on actual devices (Android, iOS)
- Consider using a maskable icon design (safe zone in center)
- Primary color: #3b82f6 (blue) to match the app theme
